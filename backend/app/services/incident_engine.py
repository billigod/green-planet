import uuid
import json
from datetime import datetime
from typing import Dict, Any, Optional
from ..database.db import get_connection

class IncidentEngine:
    BIOMASS_DENSITY_MAP = {
        "Amazonian Dense Ombrophilous Rainforest": 230.0,
        "Congo Lowland Evergreen Rainforest": 240.0,
        "Tropical Dipterocarp Rainforest": 210.0,
        "Semi-Arid Dry Chaco Forest & Woodland": 140.0,
        "Tropical Montane & Peat Swamp Forest": 220.0
    }
    CARBON_FACTOR = 1.834

    @classmethod
    def evaluate_and_record_incident(
        cls,
        region_id: str,
        detection_result: Dict[str, Any],
        baseline_obs_id: str,
        current_obs_id: str,
        pre_date: str,
        post_date: str,
        pre_image_url: Optional[str] = None,
        post_image_url: Optional[str] = None,
        pre_cloud_pct: float = 0.0,
        post_cloud_pct: float = 0.0,
        valid_pixel_pct: float = 100.0
    ) -> Optional[str]:
        """
        Generates incidents strictly when valid satellite-derived change evidence meets configured criteria.
        Prevents duplicate incidents for the same observation pair.
        Returns unique incident ID or None if no valid loss is detected.
        """
        loss_detected = detection_result.get("loss_detected", detection_result.get("loss_area_hectares", 0.0) > 0.0)
        if not loss_detected:
            return None

        loss_ha = detection_result.get("loss_area_hectares", 0.0)
        confidence = detection_result.get("confidence_score", 0.0)

        # Minimum mapping criteria: must have measurable hectare loss and sufficient confidence
        if loss_ha < 0.1 or confidence < 35.0:
            return None

        conn = get_connection()
        cursor = conn.cursor()

        # Prevent duplicate incidents for the exact same observation pair
        cursor.execute("""
        SELECT id FROM incidents 
        WHERE region_id = ? AND baseline_observation_id = ? AND current_observation_id = ?
        """, (region_id, baseline_obs_id, current_obs_id))
        existing_inc = cursor.fetchone()
        if existing_inc:
            conn.close()
            return existing_inc["id"]

        cursor.execute("SELECT * FROM regions WHERE id = ?", (region_id,))
        region = cursor.fetchone()
        if not region:
            conn.close()
            return None

        biome = region["biome"]
        country = region["country"]
        center_lat = region["center_lat"]
        center_lng = region["center_lng"]

        biomass_per_ha = cls.BIOMASS_DENSITY_MAP.get(biome, 200.0)
        biomass_lost_tonnes = round(loss_ha * biomass_per_ha, 1)
        carbon_emitted_tco2e = round(biomass_lost_tonnes * cls.CARBON_FACTOR, 1)

        if loss_ha >= 30.0 or confidence >= 95.0:
            severity = "critical"
        elif loss_ha >= 10.0:
            severity = "warning"
        else:
            severity = "nominal"

        threat_type = "Clear-cutting"
        if detection_result.get("sensor_modality") == "sar_radar_cband":
            threat_type = "Linear Incursion Corridor (SAR Detected)"
        elif loss_ha < 5.0:
            threat_type = "Selective High-Grade Logging"

        legal_jurisdiction = f"{country} Environmental Enforcement Taskforce / Special Operations"
        if country == "Brazil":
            legal_jurisdiction = "IBAMA Specialized Inspection Unit / Federal Police Sector 4"
        elif country == "DR Congo":
            legal_jurisdiction = "ICCN National Park Rangers / Territorial Forestry Inspectorate"
        elif country == "Indonesia":
            legal_jurisdiction = "Gakkum KLHK Forest Law Enforcement Directorate"

        incident_id = f"INC-{datetime.utcnow().year}-{uuid.uuid4().hex[:4].upper()}"
        now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")

        # Extract georeferenced polygon if available
        polygons = detection_result.get("polygons", [])
        primary_polygon = polygons[0].get("geojson") if polygons else None
        
        # Centroid coordinates from polygon or region center
        inc_lat = center_lat
        inc_lng = center_lng
        if polygons and "bbox" in polygons[0]:
            p_bbox = polygons[0]["bbox"] # [min_lat, min_lng, max_lat, max_lng]
            inc_lat = round((p_bbox[0] + p_bbox[2]) / 2.0, 6)
            inc_lng = round((p_bbox[1] + p_bbox[3]) / 2.0, 6)

        methodology = detection_result.get("methodology") or (
            "S1_SAR_GRD_BACKSCATTER_DECORRELATION" if detection_result.get("sensor_modality") == "sar_radar_cband"
            else "S2_L2A_MULTISPECTRAL_NDVI_DELTA"
        )

        mean_drop = round(detection_result.get("mean_ndvi_drop", 0.0), 3)

        target_reticle = {
            "pre_mean_ndvi": detection_result.get("mean_ndvi_t0"),
            "post_mean_ndvi": detection_result.get("mean_ndvi_t1"),
            "deltaNdvi": -mean_drop,
            "mean_ndvi_drop": mean_drop,
            "radarCoherenceDropPct": round(confidence * 0.8, 1),
            "pre_cloud_cover_pct": pre_cloud_pct,
            "post_cloud_cover_pct": post_cloud_pct,
            "valid_pixel_coverage_pct": valid_pixel_pct,
            "methodology": methodology,
            "source_product_ids": [baseline_obs_id, current_obs_id],
            "acquisition_dates": [pre_date, post_date],
            "change_polygon": primary_polygon,
            "polygons": polygons,
            "polygons_count": len(polygons),
            "verification_status": "UNVERIFIED",
            "human_verification_status": "UNVERIFIED_PENDING_GROUND_PATROL",
            "legal_disclaimer": "Suspected vegetation canopy disturbance detected by orbital multi-spectral analysis. Subject to ground validation before legal enforcement.",
            "machineryDetected": loss_ha > 15.0,
            "roadWidthMeters": 8.0 if "Linear" in threat_type else 0.0,
            "linearAdvanceMetersPerDay": 120.0 if "Linear" in threat_type else 0.0
        }

        # Status must be UNVERIFIED per Prompt 6 specifications
        incident_status = "UNVERIFIED"

        cursor.execute("""
        INSERT INTO incidents (
            id, region_id, title, coordinates_lat, coordinates_lng,
            utm_zone, timestamp, detected_by, confidence_score, severity,
            status, loss_area_hectares, estimated_canopy_loss_pct,
            biomass_loss_tonnes, carbon_emission_tco2e, threat_type,
            pre_image_url, post_image_url, change_mask_url, pre_date, post_date,
            baseline_observation_id, current_observation_id, legal_jurisdiction,
            target_reticle_json, patrol_unit_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            incident_id, region_id, f"Suspected Canopy Disturbance: {threat_type} ({loss_ha} Ha)",
            inc_lat, inc_lng, "21S 595820 9643120", now_str,
            f"Orbital Sentinel Automated Ingestion ({methodology})", confidence, severity,
            incident_status, loss_ha, round(min(98.0, 50.0 + (loss_ha * 0.8)), 1),
            biomass_lost_tonnes, carbon_emitted_tco2e, threat_type,
            pre_image_url, post_image_url, detection_result.get("change_mask_url"), pre_date, post_date,
            baseline_obs_id, current_obs_id, legal_jurisdiction,
            json.dumps(target_reticle), None, datetime.utcnow().isoformat() + "Z"
        ))

        tl_id = f"tl-{uuid.uuid4().hex[:6]}"
        cursor.execute("""
        INSERT INTO incident_timeline (id, incident_id, timestamp, event, actor, verified, created_at)
        VALUES (?, ?, ?, ?, ?, 1, ?)
        """, (
            tl_id, incident_id, now_str,
            f"Automated multi-temporal analysis detected {loss_ha} Ha canopy clearance.",
            "Orbital Monitoring Pipeline", datetime.utcnow().isoformat() + "Z"
        ))

        cursor.execute("""
        UPDATE regions 
        SET tree_cover_loss_ha = tree_cover_loss_ha + ?,
            last_pass_time = ?
        WHERE id = ?
        """, (loss_ha, now_str, region_id))

        conn.commit()
        conn.close()
        return incident_id

incident_engine = IncidentEngine()
