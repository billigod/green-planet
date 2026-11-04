import json
import uuid
from typing import List
from datetime import datetime
from fastapi import APIRouter, HTTPException
from ...models.schemas import RegionResponse, RegionCreate, ObservationResponse, Coordinates
from ...database.db import get_connection

router = APIRouter()

@router.get("/regions", response_model=List[RegionResponse])
def get_regions():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM regions ORDER BY area_hectares DESC")
    rows = cursor.fetchall()
    
    regions = []
    for r in rows:
        bounds = json.loads(r["bounds_json"]) if r["bounds_json"] else [-10, -60, 0, -50]
        cursor.execute("SELECT COUNT(*) as cnt FROM incidents WHERE region_id = ? AND status != 'RESOLVED'", (r["id"],))
        alert_cnt = cursor.fetchone()["cnt"]

        regions.append(RegionResponse(
            id=r["id"],
            name=r["name"],
            country=r["country"],
            biome=r["biome"],
            protected_zone=r["protected_zone"],
            center_coords=Coordinates(lat=r["center_lat"], lng=r["center_lng"]),
            area_hectares=r["area_hectares"],
            tree_cover_loss_ha=r["tree_cover_loss_ha"],
            canopy_integrity_pct=r["canopy_integrity_pct"],
            risk_level=r["risk_level"],
            primary_sensor=r["primary_sensor"],
            bounds=bounds,
            active_alerts_count=alert_cnt,
            last_pass_time=r["last_pass_time"] or "Checked by 12h scheduler"
        ))
    conn.close()
    return regions

@router.post("/regions", response_model=RegionResponse)
def create_region(data: RegionCreate):
    conn = get_connection()
    cursor = conn.cursor()

    region_id = f"aoi-{uuid.uuid4().hex[:6]}"
    now_str = datetime.utcnow().isoformat() + "Z"

    cursor.execute("""
    INSERT INTO regions (
        id, name, country, biome, protected_zone,
        center_lat, center_lng, area_hectares, tree_cover_loss_ha,
        canopy_integrity_pct, risk_level, primary_sensor,
        bounds_json, last_pass_time, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0.0, 98.0, 'low', ?, ?, 'Registered for tracking', ?)
    """, (
        region_id, data.name, data.country, data.biome, data.protected_zone,
        data.center_lat, data.center_lng, data.area_hectares,
        data.primary_sensor or "Sentinel-2 L2A", json.dumps(data.bounds), now_str
    ))

    conn.commit()
    conn.close()

    return RegionResponse(
        id=region_id,
        name=data.name,
        country=data.country,
        biome=data.biome,
        protected_zone=data.protected_zone,
        center_coords=Coordinates(lat=data.center_lat, lng=data.center_lng),
        area_hectares=data.area_hectares,
        tree_cover_loss_ha=0.0,
        canopy_integrity_pct=98.0,
        risk_level="low",
        primary_sensor=data.primary_sensor or "Sentinel-2 L2A",
        bounds=data.bounds,
        active_alerts_count=0,
        last_pass_time="Registered for tracking"
    )

@router.get("/regions/{region_id}", response_model=RegionResponse)
def get_region(region_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM regions WHERE id = ?", (region_id,))
    r = cursor.fetchone()
    if not r:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Region {region_id} not found")

    bounds = json.loads(r["bounds_json"]) if r["bounds_json"] else [-10, -60, 0, -50]
    cursor.execute("SELECT COUNT(*) as cnt FROM incidents WHERE region_id = ? AND status != 'RESOLVED'", (region_id,))
    alert_cnt = cursor.fetchone()["cnt"]
    conn.close()

    return RegionResponse(
        id=r["id"],
        name=r["name"],
        country=r["country"],
        biome=r["biome"],
        protected_zone=r["protected_zone"],
        center_coords=Coordinates(lat=r["center_lat"], lng=r["center_lng"]),
        area_hectares=r["area_hectares"],
        tree_cover_loss_ha=r["tree_cover_loss_ha"],
        canopy_integrity_pct=r["canopy_integrity_pct"],
        risk_level=r["risk_level"],
        primary_sensor=r["primary_sensor"],
        bounds=bounds,
        active_alerts_count=alert_cnt,
        last_pass_time=r["last_pass_time"] or "Checked by 12h scheduler"
    )

@router.get("/regions/{region_id}/observations", response_model=List[ObservationResponse])
def get_region_observations(region_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM observations WHERE region_id = ? ORDER BY acquisition_date DESC", (region_id,))
    rows = cursor.fetchall()
    conn.close()

    return [
        ObservationResponse(
            id=r["id"],
            region_id=r["region_id"],
            sensor_name=r["sensor_name"],
            sensor_type=r["sensor_type"],
            acquisition_date=r["acquisition_date"],
            cloud_cover_pct=r["cloud_cover_pct"],
            product_identifier=r["product_identifier"],
            resolution_m=r["resolution_m"],
            status=r["status"],
            image_url=r["image_url"],
            metadata=json.loads(r["metadata_json"]) if r["metadata_json"] else None
        )
        for r in rows
    ]
