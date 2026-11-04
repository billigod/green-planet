import uuid
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List
from apscheduler.schedulers.background import BackgroundScheduler
from ..core.config import settings
from ..database.db import get_connection
from ..services.copernicus import copernicus_service
from ..services.earth_search import earth_search_service
from ..services.satellite_processor import satellite_processor

logger = logging.getLogger(__name__)

class MonitoringScheduler:
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.is_running = False
        self.interval_hours = settings.MONITORING_INTERVAL_HOURS

    def start(self):
        if not self.is_running:
            self.scheduler.add_job(
                func=self.execute_monitoring_cycle,
                trigger="interval",
                hours=self.interval_hours,
                id="orbital_monitoring_loop",
                replace_existing=True,
                kwargs={"trigger_type": "scheduled"}
            )
            self.scheduler.start()
            self.is_running = True
            logger.info(f"Orbital Monitoring Scheduler active (Interval: {self.interval_hours} hours).")

    def shutdown(self):
        if self.is_running:
            self.scheduler.shutdown(wait=False)
            self.is_running = False
            logger.info("Orbital Monitoring Scheduler stopped.")

    def execute_monitoring_cycle(self, trigger_type: str = "scheduled") -> Dict[str, Any]:
        job_id = f"job-{uuid.uuid4().hex[:8]}"
        start_time = datetime.utcnow()
        start_str = start_time.isoformat() + "Z"
        logger.info(f"Initiating monitoring cycle [{job_id}] triggered by: {trigger_type}")

        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM regions")
        regions = cursor.fetchall()

        cop_auth = copernicus_service.authenticate()
        cop_status = cop_auth.get("status", "NOT_CONFIGURED")

        regions_checked = 0
        new_observations = 0
        incidents_created = 0
        details = []

        end_date = datetime.utcnow().strftime("%Y-%m-%d")
        start_date = (datetime.utcnow() - timedelta(days=14)).strftime("%Y-%m-%d")

        for reg in regions:
            regions_checked += 1
            bounds = json.loads(reg["bounds_json"])
            reg_observations = 0

            # 1. Primary Ingest: Element 84 Earth Search STAC (Public, No Auth Needed)
            try:
                # Query Sentinel-2 L2A optical
                s2_res = earth_search_service.search_sentinel2_l2a(
                    bounds=bounds,
                    start_date=start_date,
                    end_date=end_date,
                    max_cloud_cover=30.0,
                    limit=2
                )
                s2_products = s2_res.get("products", [])
                for prod in s2_products:
                    obs_id = f"obs-e84-s2-{prod['id']}"
                    cursor.execute("""
                    INSERT OR IGNORE INTO observations (
                        id, region_id, sensor_name, sensor_type, acquisition_date,
                        cloud_cover_pct, product_identifier, resolution_m, status,
                        image_url, metadata_json, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        obs_id, reg["id"], prod.get("sensor_name", "Sentinel-2 MSI (Level-2A BOA)"), "optical",
                        prod["acquisition_date"], prod.get("cloud_cover_pct", 0.0),
                        prod["name"], 10.0, "ELEMENT84_INGESTED",
                        prod.get("thumbnail_url"), json.dumps(prod),
                        datetime.utcnow().isoformat() + "Z"
                    ))
                    reg_observations += 1

                # Query Sentinel-1 GRD SAR
                s1_res = earth_search_service.search_sentinel1_grd(
                    bounds=bounds,
                    start_date=start_date,
                    end_date=end_date,
                    limit=2
                )
                s1_products = s1_res.get("products", [])
                for prod in s1_products:
                    obs_id = f"obs-e84-s1-{prod['id']}"
                    cursor.execute("""
                    INSERT OR IGNORE INTO observations (
                        id, region_id, sensor_name, sensor_type, acquisition_date,
                        cloud_cover_pct, product_identifier, resolution_m, status,
                        image_url, metadata_json, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        obs_id, reg["id"], prod.get("sensor_name", "Sentinel-1 C-SAR (GRD)"), "sar",
                        prod["acquisition_date"], 0.0,
                        prod["name"], 10.0, "ELEMENT84_INGESTED",
                        prod.get("thumbnail_url"), json.dumps(prod),
                        datetime.utcnow().isoformat() + "Z"
                    ))
                    reg_observations += 1
            except Exception as e:
                logger.warning(f"Earth Search scheduled ingestion warning for {reg['id']}: {e}")

            # 2. Secondary Ingest: Copernicus CDSE if configured
            if copernicus_service.is_configured() and cop_auth.get("success"):
                cop_s2 = copernicus_service.search_sentinel2_l2a(bounds=bounds, start_date=start_date, end_date=end_date, limit=1)
                for prod in cop_s2.get("products", []):
                    cursor.execute("""
                    INSERT OR IGNORE INTO observations (
                        id, region_id, sensor_name, sensor_type, acquisition_date,
                        cloud_cover_pct, product_identifier, resolution_m, status,
                        image_url, metadata_json, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        f"obs-cop-{prod['id']}", reg["id"], "Sentinel-2B MSI (L2A)", "optical",
                        prod["acquisition_date"], prod.get("cloud_cover_pct", 0.0),
                        prod["name"], 10.0, "COPERNICUS_INGESTED",
                        prod.get("quicklook_url"), json.dumps(prod),
                        datetime.utcnow().isoformat() + "Z"
                    ))
                    reg_observations += 1

            new_observations += reg_observations

            if reg_observations > 0:
                cursor.execute("""
                UPDATE regions SET last_pass_time = ? WHERE id = ?
                """, (f"Earth Search pass {end_date} (Ingested {reg_observations} tiles)", reg["id"]))
            else:
                cursor.execute("""
                UPDATE regions SET last_pass_time = ? WHERE id = ?
                """, (f"Baseline check ({start_str[:16]})", reg["id"]))

            details.append({
                "region_id": reg["id"],
                "region_name": reg["name"],
                "status": "INGEST_SUCCESS" if reg_observations > 0 else "BASELINE_ACTIVE",
                "observations_ingested": reg_observations,
                "provider": "ELEMENT84_PRIMARY"
            })

        completed_time = datetime.utcnow()
        completed_str = completed_time.isoformat() + "Z"

        cursor.execute("""
        INSERT INTO monitoring_runs (
            id, started_at, completed_at, status, trigger_type,
            regions_checked, new_observations_found, incidents_created,
            copernicus_status, details_json, error_message
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            job_id, start_str, completed_str, "COMPLETED", trigger_type,
            regions_checked, new_observations, incidents_created,
            cop_status, json.dumps(details), None
        ))

        conn.commit()
        conn.close()

        logger.info(f"Cycle [{job_id}] finished. Checked {regions_checked} regions.")

        return {
            "job_id": job_id,
            "started_at": start_str,
            "completed_at": completed_str,
            "status": "COMPLETED",
            "trigger_type": trigger_type,
            "regions_checked": regions_checked,
            "new_observations_found": new_observations,
            "incidents_created": incidents_created,
            "copernicus_status": cop_status,
            "details": {"summary": f"Checked {regions_checked} active monitoring regions."}
        }

monitoring_scheduler = MonitoringScheduler()
