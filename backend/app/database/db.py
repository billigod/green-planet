import sqlite3
import json
import logging
from datetime import datetime
from ..core.config import settings

logger = logging.getLogger(__name__)

def get_connection():
    settings.DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(settings.DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS regions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        country TEXT NOT NULL,
        biome TEXT NOT NULL,
        protected_zone TEXT NOT NULL,
        center_lat REAL NOT NULL,
        center_lng REAL NOT NULL,
        area_hectares REAL NOT NULL,
        tree_cover_loss_ha REAL DEFAULT 0,
        canopy_integrity_pct REAL DEFAULT 95.0,
        risk_level TEXT DEFAULT 'moderate',
        primary_sensor TEXT DEFAULT 'Sentinel-2 L2A',
        bounds_json TEXT NOT NULL,
        last_pass_time TEXT,
        created_at TEXT NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS observations (
        id TEXT PRIMARY KEY,
        region_id TEXT NOT NULL,
        sensor_name TEXT NOT NULL,
        sensor_type TEXT NOT NULL,
        acquisition_date TEXT NOT NULL,
        cloud_cover_pct REAL DEFAULT 0,
        product_identifier TEXT NOT NULL,
        resolution_m REAL DEFAULT 10.0,
        status TEXT NOT NULL,
        image_url TEXT,
        metadata_json TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (region_id) REFERENCES regions (id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS incidents (
        id TEXT PRIMARY KEY,
        region_id TEXT NOT NULL,
        title TEXT NOT NULL,
        coordinates_lat REAL NOT NULL,
        coordinates_lng REAL NOT NULL,
        utm_zone TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        detected_by TEXT NOT NULL,
        confidence_score REAL NOT NULL,
        severity TEXT NOT NULL,
        status TEXT NOT NULL,
        loss_area_hectares REAL NOT NULL,
        estimated_canopy_loss_pct REAL NOT NULL,
        biomass_loss_tonnes REAL NOT NULL,
        carbon_emission_tco2e REAL NOT NULL,
        threat_type TEXT NOT NULL,
        pre_image_url TEXT,
        post_image_url TEXT,
        change_mask_url TEXT,
        pre_date TEXT NOT NULL,
        post_date TEXT NOT NULL,
        baseline_observation_id TEXT,
        current_observation_id TEXT,
        legal_jurisdiction TEXT NOT NULL,
        target_reticle_json TEXT,
        patrol_unit_json TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (region_id) REFERENCES regions (id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS incident_timeline (
        id TEXT PRIMARY KEY,
        incident_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        event TEXT NOT NULL,
        actor TEXT NOT NULL,
        verified INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        FOREIGN KEY (incident_id) REFERENCES incidents (id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS incident_notes (
        id TEXT PRIMARY KEY,
        incident_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        author TEXT NOT NULL,
        text TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (incident_id) REFERENCES incidents (id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS monitoring_runs (
        id TEXT PRIMARY KEY,
        started_at TEXT NOT NULL,
        completed_at TEXT,
        status TEXT NOT NULL,
        trigger_type TEXT NOT NULL,
        regions_checked INTEGER DEFAULT 0,
        new_observations_found INTEGER DEFAULT 0,
        incidents_created INTEGER DEFAULT 0,
        copernicus_status TEXT NOT NULL,
        details_json TEXT,
        error_message TEXT
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS processing_jobs (
        id TEXT PRIMARY KEY,
        region_id TEXT NOT NULL,
        job_type TEXT NOT NULL,
        status TEXT NOT NULL,
        params_json TEXT,
        result_json TEXT,
        error_message TEXT,
        created_at TEXT NOT NULL,
        completed_at TEXT
    )
    """)

    cursor.execute("""
    CREATE INDEX IF NOT EXISTS idx_incidents_obs_pair 
    ON incidents (region_id, baseline_observation_id, current_observation_id)
    """)

    conn.commit()
    seed_baseline_data_if_empty(conn)
    seed_baseline_observations_if_empty(conn)
    conn.close()
    logger.info("Database schema initialized and verified.")

def seed_baseline_observations_if_empty(conn):
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count FROM observations")
    if cursor.fetchone()["count"] > 0:
        return

    now = datetime.utcnow().isoformat() + "Z"
    observations_data = [
        (
            "obs-s2-20260405",
            "aoi-amz-01",
            "Sentinel-2B MSI",
            "optical",
            "2026-04-05T14:18:22Z",
            4.2,
            "S2B_MSIL2A_20260405T141822_N0500_R082_T21SYD_20260405T173000",
            10.0,
            "ARCHIVE_VERIFIED",
            "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80",
            json.dumps({"source_type": "BASELINE_ARCHIVE", "collection": "SENTINEL-2", "product_type": "S2MSI2A", "level": "L2A"}),
            now
        ),
        (
            "obs-s1-20260412",
            "aoi-amz-01",
            "Sentinel-1C C-SAR",
            "sar",
            "2026-04-12T14:22:00Z",
            0.0,
            "S1C_IW_GRDH_1SDV_20260412T142200_20260412T142225_001234_00ABCD_1234",
            10.0,
            "ARCHIVE_VERIFIED",
            "https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=800&q=80",
            json.dumps({"source_type": "BASELINE_ARCHIVE", "collection": "SENTINEL-1", "product_type": "S1_SAR_GRD", "polarization": "VV+VH"}),
            now
        ),
        (
            "obs-s2-20260328",
            "aoi-amz-01",
            "Sentinel-2A MSI",
            "optical",
            "2026-03-28T14:15:10Z",
            2.1,
            "S2A_MSIL2A_20260328T141510_N0500_R082_T21SYD_20260328T181200",
            10.0,
            "ARCHIVE_VERIFIED",
            "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80",
            json.dumps({"source_type": "BASELINE_ARCHIVE", "collection": "SENTINEL-2", "product_type": "S2MSI2A"}),
            now
        ),
        (
            "obs-s2-20260411",
            "aoi-amz-01",
            "Sentinel-2B MSI",
            "optical",
            "2026-04-11T10:15:00Z",
            8.4,
            "S2B_MSIL2A_20260411T101500_N0500_R082_T21SYD_20260411T135500",
            10.0,
            "ARCHIVE_VERIFIED",
            "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=800&q=80",
            json.dumps({"source_type": "BASELINE_ARCHIVE", "collection": "SENTINEL-2", "product_type": "S2MSI2A"}),
            now
        ),
        (
            "obs-cgo-s1-20260410",
            "aoi-cgo-02",
            "Sentinel-1A C-SAR",
            "sar",
            "2026-04-10T05:30:00Z",
            0.0,
            "S1A_IW_GRDH_1SDV_20260410T053000_053025_053120_067890_9876",
            10.0,
            "ARCHIVE_VERIFIED",
            "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
            json.dumps({"source_type": "BASELINE_ARCHIVE", "collection": "SENTINEL-1", "product_type": "S1_SAR_GRD"}),
            now
        ),
        (
            "obs-idn-s2-20260408",
            "aoi-idn-03",
            "Sentinel-2B MSI",
            "optical",
            "2026-04-08T03:45:00Z",
            14.2,
            "S2B_MSIL2A_20260408T034500_N0500_R046_T47NMF_20260408T071000",
            10.0,
            "ARCHIVE_VERIFIED",
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
            json.dumps({"source_type": "BASELINE_ARCHIVE", "collection": "SENTINEL-2", "product_type": "S2MSI2A"}),
            now
        )
    ]

    cursor.executemany("""
    INSERT INTO observations (
        id, region_id, sensor_name, sensor_type, acquisition_date,
        cloud_cover_pct, product_identifier, resolution_m, status,
        image_url, metadata_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, observations_data)
    conn.commit()
    logger.info("Baseline observations seeded successfully with BASELINE_ARCHIVE provenance.")

def seed_baseline_data_if_empty(conn):
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count FROM regions")
    if cursor.fetchone()["count"] > 0:
        return

    now = datetime.utcnow().isoformat() + "Z"

    regions_data = [
        (
            "aoi-amz-01",
            "Xingu Indigenous Basin Sector 4",
            "Brazil",
            "Amazonian Dense Ombrophilous Rainforest",
            "Strict Nature Reserve (IUCN Cat Ia)",
            -3.2280,
            -55.1380,
            420000.0,
            1840.5,
            91.4,
            "critical",
            "Sentinel-2 / Sentinel-1 SAR",
            json.dumps([-3.8, -55.8, -2.6, -54.5]),
            "2026-04-12 14:22 UTC",
            now
        ),
        (
            "aoi-cgo-02",
            "Salonga National Park Core",
            "DR Congo",
            "Congo Lowland Evergreen Rainforest",
            "UNESCO World Heritage Site",
            -2.1240,
            21.4580,
            3600000.0,
            420.2,
            97.8,
            "moderate",
            "Sentinel-1 SAR (Cloud Penetrating)",
            json.dumps([-2.8, 20.8, -1.4, 22.2]),
            "2026-04-12 11:05 UTC",
            now
        ),
        (
            "aoi-idn-03",
            "Gunung Leuser Peatland Corridor",
            "Indonesia",
            "Tropical Montane & Peat Swamp Forest",
            "National Park Core",
            3.7540,
            97.4520,
            792700.0,
            890.1,
            88.2,
            "warning",
            "Sentinel-2 L2A MSI",
            json.dumps([3.2, 97.0, 4.3, 97.9]),
            "2026-04-12 06:40 UTC",
            now
        )
    ]

    cursor.executemany("""
    INSERT INTO regions (
        id, name, country, biome, protected_zone,
        center_lat, center_lng, area_hectares,
        tree_cover_loss_ha, canopy_integrity_pct, risk_level,
        primary_sensor, bounds_json, last_pass_time, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, regions_data)

    incidents_data = [
        (
            "INC-2026-0891",
            "aoi-amz-01",
            "Active Logging Road Spur Penetration",
            -3.2280,
            -55.1380,
            "21S 595820 9643120",
            "2026-04-12 14:22 UTC",
            "Sentinel-1C (C-SAR) + S2 L2A",
            98.4,
            "critical",
            "CONFIRMED_ACTIVE",
            42.6,
            78.0,
            9800.0,
            17970.0,
            "Illegal Road & Selective Logging",
            "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
            "2026-04-05",
            "2026-04-12",
            "obs-s2-20260405",
            "obs-s1-20260412",
            "IBAMA Special Inspection Unit / Federal Police Sector 4",
            json.dumps({
                "deltaNdvi": -0.42,
                "radarCoherenceDropPct": 74.2,
                "machineryDetected": True,
                "roadWidthMeters": 6.8,
                "linearAdvanceMetersPerDay": 180.0
            }),
            json.dumps({
                "unitId": "IBAMA-TACTICAL-ALPHA",
                "distanceKm": 14.2,
                "status": "DISPATCHED",
                "eta": "45 min (Riverine Patrol)"
            }),
            now
        ),
        (
            "INC-2026-0892",
            "aoi-amz-01",
            "Clear-Cut Agricultural Encroachment",
            -3.3420,
            -55.2150,
            "21S 587210 9630540",
            "2026-04-11 10:15 UTC",
            "Sentinel-2B MSI (10m)",
            94.1,
            "critical",
            "INTERDICTION_DISPATCHED",
            128.4,
            94.0,
            29500.0,
            54100.0,
            "Pasture Conversion Clear-Cut",
            "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=800&q=80",
            "2026-03-28",
            "2026-04-11",
            "obs-s2-20260328",
            "obs-s2-20260411",
            "ICMBio Protected Area Warden Command",
            json.dumps({
                "deltaNdvi": -0.68,
                "radarCoherenceDropPct": 88.0,
                "machineryDetected": True,
                "roadWidthMeters": 12.0,
                "linearAdvanceMetersPerDay": 320.0
            }),
            json.dumps({
                "unitId": "ICMBio-RAPTOR-4",
                "distanceKm": 8.6,
                "status": "ON_SCENE",
                "eta": "Interdicted"
            }),
            now
        )
    ]

    cursor.executemany("""
    INSERT INTO incidents (
        id, region_id, title, coordinates_lat, coordinates_lng,
        utm_zone, timestamp, detected_by, confidence_score, severity,
        status, loss_area_hectares, estimated_canopy_loss_pct,
        biomass_loss_tonnes, carbon_emission_tco2e, threat_type,
        pre_image_url, post_image_url, change_mask_url, pre_date, post_date,
        baseline_observation_id, current_observation_id, legal_jurisdiction,
        target_reticle_json, patrol_unit_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, incidents_data)

    # Initial timeline entries
    timeline_data = [
        ("tl-01", "INC-2026-0891", "2026-04-12 14:22 UTC", "Sentinel-1C Synthetic Aperture Radar pass detected coherence drop of 74.2%", "Orbital Automated Ingestion", 1, now),
        ("tl-02", "INC-2026-0891", "2026-04-12 14:38 UTC", "Multi-temporal NDVI diffing verified 42.6 Ha tree canopy loss", "Multi-Spectral Analysis Core", 1, now),
        ("tl-03", "INC-2026-0891", "2026-04-12 15:10 UTC", "Incident classified CRITICAL; dispatched IBAMA Tactical Unit Alpha", "Duty Watch Officer", 1, now)
    ]
    cursor.executemany("""
    INSERT INTO incident_timeline (id, incident_id, timestamp, event, actor, verified, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, timeline_data)

    # Initial notes
    notes_data = [
        ("note-01", "INC-2026-0891", "2026-04-12 15:30 UTC", "Captain Silva (IBAMA)", "Riverine vessel navigating Rio Iriri tributary. Acoustic drone confirms active chainsaw and heavy diesel motor sounds.", now)
    ]
    cursor.executemany("""
    INSERT INTO incident_notes (id, incident_id, timestamp, author, text, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    """, notes_data)

    conn.commit()
    logger.info("Baseline monitoring regions and incidents seeded successfully.")
