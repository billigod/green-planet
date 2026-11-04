import os
import sys
import json
import pytest
import numpy as np
from affine import Affine

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, os.path.dirname(BASE_DIR))

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.ndvi import NDVICalculator
from backend.app.services.cloud_mask import CloudMaskService
from backend.app.services.change_detection import MultiTemporalChangeDetector
from backend.app.services.incident_engine import IncidentEngine
from backend.app.services.earth_search import EarthSearchService
from backend.app.database.db import init_db, get_connection

@pytest.fixture(scope="session", autouse=True)
def setup_db():
    init_db()

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

def test_ndvi_calculation_accuracy():
    """
    Validates genuine multispectral NDVI = (B08 - B04) / (B08 + B04).
    Ensures values are strictly calculated from near-infrared and red channels.
    """
    calc = NDVICalculator()
    # High canopy reflectance: NIR = 0.60, Red = 0.08 -> NDVI = 0.52 / 0.68 = 0.7647
    red = np.array([[0.08, 0.05], [0.30, 0.50]], dtype=np.float32)
    nir = np.array([[0.60, 0.45], [0.32, 0.50]], dtype=np.float32)
    
    ndvi = calc.calculate_ndvi(red, nir)
    assert ndvi.shape == (2, 2)
    
    expected_00 = (0.60 - 0.08) / (0.60 + 0.08)
    assert pytest.approx(ndvi[0, 0], 0.001) == expected_00
    assert ndvi[0, 0] > 0.7
    # Bare soil: Red ~ NIR -> NDVI near 0
    assert pytest.approx(ndvi[1, 1], 0.001) == 0.0
    # Water: NIR < Red -> NDVI negative
    red_water = np.array([[0.10]], dtype=np.float32)
    nir_water = np.array([[0.02]], dtype=np.float32)
    ndvi_water = calc.calculate_ndvi(red_water, nir_water)
    assert ndvi_water[0, 0] < 0

def test_scl_cloud_and_shadow_masking():
    """
    Validates Scene Classification Layer (SCL) masking:
    Classes 0 (No Data), 1 (Defective), 3 (Shadows), 8 (Med Cloud), 9 (High Cloud),
    10 (Cirrus), 11 (Snow) must be marked as invalid (masked out).
    Classes 4 (Vegetation) and 5 (Non-vegetated) must be preserved.
    """
    cms = CloudMaskService()
    scl = np.array([
        [0, 1, 3],
        [4, 5, 6],
        [8, 9, 10]
    ], dtype=np.uint8)

    valid_mask, cloud_pct = cms.mask_from_scl(scl)
    assert valid_mask.shape == (3, 3)
    # 0, 1, 3 are invalid
    assert not valid_mask[0, 0]
    assert not valid_mask[0, 1]
    assert not valid_mask[0, 2]
    # 4 (Vegetation) and 5 (Non-vegetated) are valid
    assert valid_mask[1, 0]
    assert valid_mask[1, 1]
    # 8, 9, 10 (Clouds) are invalid
    assert not valid_mask[2, 0]
    assert not valid_mask[2, 1]
    assert not valid_mask[2, 2]
    assert cloud_pct > 0

def test_two_date_distinct_validation():
    """
    Rule requirement: Never compare identical imagery and claim detection.
    Pre-product and post-product must have distinct acquisition dates.
    """
    es = EarthSearchService()
    res = es.compare_multitemporal_scenes(
        region_id="aoi-amz-01",
        pre_product_id="S2A_TEST_SAME_ID",
        post_product_id="S2A_TEST_SAME_ID"
    )
    assert res["success"] is False
    assert "distinct acquisition dates" in res["message"].lower()

def test_change_mask_and_morphology():
    """
    Validates multi-temporal change detection on synthetic test rasters:
    Computes Delta-NDVI = NDVI_t0 - NDVI_t1, applies threshold,
    filters isolated pixel noise via opening, and groups contiguous clusters.
    """
    detector = MultiTemporalChangeDetector()
    
    # Create 50x50 canopy with a cleared patch of 10x10 in the center
    ndvi_t0 = np.full((50, 50), 0.75, dtype=np.float32)
    ndvi_t1 = np.full((50, 50), 0.75, dtype=np.float32)
    # Clear 10x10 patch at [20:30, 20:30]
    ndvi_t1[20:30, 20:30] = 0.20
    # Add a single isolated noisy pixel at [5, 5]
    ndvi_t1[5, 5] = 0.10

    valid_mask = np.ones((50, 50), dtype=bool)
    transform = Affine.translation(500000.0, 9600000.0) @ Affine.scale(10.0, -10.0)

    res = detector.detect_optical_loss(
        ndvi_t0=ndvi_t0,
        ndvi_t1=ndvi_t1,
        valid_mask_t0=valid_mask,
        valid_mask_t1=valid_mask,
        ndvi_drop_threshold=0.15,
        min_cluster_pixels=10,
        transform=transform,
        crs="EPSG:32721"
    )

    assert res["loss_detected"] is True
    assert res["loss_pixel_count"] >= 95  # 10x10 minus border effects from opening
    # The isolated noise pixel at [5, 5] must be filtered out by morphology
    assert res["change_mask"][5, 5] == 0
    # Center clearing must be detected
    assert res["change_mask"][25, 25] == 1
    # Check hectare calculation (100 pixels * 100 m² = 10,000 m² = 1.0 Ha)
    assert pytest.approx(res["loss_area_hectares"], 0.2) == 1.0

def test_polygon_extraction_geojson():
    """
    Validates polygon extraction from georeferenced raster mask to WGS84 GeoJSON polygons.
    """
    detector = MultiTemporalChangeDetector()
    loss_mask = np.zeros((40, 40), dtype=np.uint8)
    loss_mask[10:20, 10:20] = 1 # 10x10 block
    delta_ndvi = np.zeros((40, 40), dtype=np.float32)
    delta_ndvi[10:20, 10:20] = 0.45

    transform = Affine.translation(550000.0, 9640000.0) @ Affine.scale(10.0, -10.0)
    polys = detector.extract_polygons_from_mask_georeferenced(
        binary_mask=loss_mask,
        transform=transform,
        crs="EPSG:32721",
        min_pixels=5
    )

    assert len(polys) == 1
    poly = polys[0]
    assert "cluster_id" in poly
    assert "area_hectares" in poly
    assert poly["area_hectares"] > 0
    assert poly["geojson"]["type"] == "Polygon"
    assert len(poly["geojson"]["coordinates"][0]) >= 4
    # Coordinates must be in WGS84 range (Longitude approx -54 to -55, Latitude approx -3.2)
    lon, lat = poly["geojson"]["coordinates"][0][0]
    assert -60.0 <= lon <= -40.0
    assert -10.0 <= lat <= 5.0

def test_incident_engine_persistence():
    """
    Validates that incident creation stores required audit trails:
    - Source product IDs
    - Acquisition dates
    - Methodology 'S2_L2A_MULTISPECTRAL_NDVI_DELTA'
    - Human verification status 'UNVERIFIED_PENDING_GROUND_PATROL'
    - Statutory legal disclaimer
    """
    # Ensure clean test state for idempotency
    _conn = get_connection()
    _conn.cursor().execute("DELETE FROM incidents WHERE baseline_observation_id = 'S2A_TEST_T0'")
    _conn.commit()
    _conn.close()

    engine = IncidentEngine()
    detection_result = {
        "loss_area_hectares": 8.45,
        "confidence_score": 94.2,
        "clusters_count": 1,
        "polygons": [{"cluster_id": 1, "area_hectares": 8.45, "geojson": {"type": "Polygon", "coordinates": []}}],
        "mean_drop": 0.28
    }

    inc_id = engine.evaluate_and_record_incident(
        region_id="aoi-amz-01",
        detection_result=detection_result,
        baseline_obs_id="S2A_TEST_T0",
        current_obs_id="S2B_TEST_T1",
        pre_date="2024-06-29",
        post_date="2024-08-26"
    )

    assert inc_id is not None

    # Verify database persistence
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM incidents WHERE id = ?", (inc_id,))
    row = c.fetchone()
    conn.close()

    assert row is not None
    assert row["target_reticle_json"] is not None
    reticle = json.loads(row["target_reticle_json"])
    assert reticle["source_product_ids"] == ["S2A_TEST_T0", "S2B_TEST_T1"]
    assert reticle["methodology"] == "S2_L2A_MULTISPECTRAL_NDVI_DELTA"
    assert reticle["human_verification_status"] == "UNVERIFIED_PENDING_GROUND_PATROL"
    assert "Suspected vegetation canopy disturbance" in reticle["legal_disclaimer"]
    assert row["status"] == "UNVERIFIED"

def test_zero_denominator_ndvi():
    """
    Validates zero-division handling:
    When NIR + RED == 0, NDVI must safely return 0.0 without ZeroDivisionError.
    """
    calc = NDVICalculator()
    red = np.zeros((3, 3), dtype=np.float32)
    nir = np.zeros((3, 3), dtype=np.float32)
    ndvi = calc.calculate_ndvi(red, nir)
    assert ndvi.shape == (3, 3)
    assert np.all(ndvi == 0.0)

def test_insufficient_observations_error():
    """
    Rule requirement: If fewer than two usable observations are available,
    must return a clear insufficient-data status and never fabricate an observation.
    """
    es = EarthSearchService()
    # Search with impossible max_cloud_cover (e.g. -1.0%) over a tight timeframe
    res = es.search_multitemporal_pair(
        region_id="aoi-amz-01",
        max_cloud_cover=-1.0,
        search_days=1
    )
    assert res["success"] is False
    assert res["status"] == "INSUFFICIENT_OBSERVATIONS"
    assert "insufficient" in res["message"].lower()

def test_no_change_scenario_zero_incidents():
    """
    Rule requirement: If no valid vegetation loss is detected, return zero incidents.
    When pre and post are identical or improving, no incident must be created.
    """
    # Ensure clean test state for idempotency
    _conn = get_connection()
    _conn.cursor().execute("DELETE FROM incidents WHERE baseline_observation_id = 'S2A_TEST_T0'")
    _conn.commit()
    _conn.close()

    engine = IncidentEngine()
    # Stable canopy result
    detection_stable = {
        "loss_detected": False,
        "loss_area_hectares": 0.0,
        "confidence_score": 0.0,
        "clusters_count": 0,
        "polygons": [],
        "mean_ndvi_drop": 0.0
    }

    inc_id = engine.evaluate_and_record_incident(
        region_id="aoi-amz-01",
        detection_result=detection_stable,
        baseline_obs_id="S2A_STABLE_T0",
        current_obs_id="S2B_STABLE_T1",
        pre_date="2024-06-29",
        post_date="2024-08-26"
    )
    assert inc_id is None

def test_duplicate_incident_prevention():
    """
    Rule requirement: Prevent duplicate incidents for the same detected change.
    Re-evaluating the same observation pair must return the existing incident ID.
    """
    # Ensure clean test state for idempotency
    _conn = get_connection()
    _conn.cursor().execute("DELETE FROM incidents WHERE baseline_observation_id = 'S2A_TEST_T0'")
    _conn.commit()
    _conn.close()

    engine = IncidentEngine()
    detection_result = {
        "loss_detected": True,
        "loss_area_hectares": 12.5,
        "confidence_score": 88.0,
        "clusters_count": 2,
        "polygons": [{"cluster_id": 1, "area_hectares": 12.5, "geojson": {"type": "Polygon", "coordinates": []}}],
        "mean_ndvi_drop": 0.22
    }

    # First run creates incident
    inc_id_1 = engine.evaluate_and_record_incident(
        region_id="aoi-amz-01",
        detection_result=detection_result,
        baseline_obs_id="S2A_PAIR_UNIQ_A",
        current_obs_id="S2B_PAIR_UNIQ_B",
        pre_date="2024-06-29",
        post_date="2024-08-26"
    )
    assert inc_id_1 is not None

    # Second run with identical observation pair must return the SAME ID without duplicate insert
    inc_id_2 = engine.evaluate_and_record_incident(
        region_id="aoi-amz-01",
        detection_result=detection_result,
        baseline_obs_id="S2A_PAIR_UNIQ_A",
        current_obs_id="S2B_PAIR_UNIQ_B",
        pre_date="2024-06-29",
        post_date="2024-08-26"
    )
    assert inc_id_2 == inc_id_1

    # Verify only 1 record exists in SQLite for this observation pair
    conn = get_connection()
    c = conn.cursor()
    c.execute("""
    SELECT COUNT(*) as count FROM incidents 
    WHERE region_id = 'aoi-amz-01' AND baseline_observation_id = 'S2A_PAIR_UNIQ_A' AND current_observation_id = 'S2B_PAIR_UNIQ_B'
    """)
    count = c.fetchone()["count"]
    conn.close()
    assert count == 1

def test_incident_verification_status_lifecycle():
    """
    Validates allowed verification statuses: UNVERIFIED, UNDER_REVIEW, VERIFIED, REJECTED.
    """
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT id, status FROM incidents LIMIT 1")
    row = c.fetchone()
    inc_id = row["id"]

    for new_status in ["UNVERIFIED", "UNDER_REVIEW", "VERIFIED", "REJECTED"]:
        c.execute("UPDATE incidents SET status = ? WHERE id = ?", (new_status, inc_id))
        conn.commit()
        c.execute("SELECT status FROM incidents WHERE id = ?", (inc_id,))
        updated = c.fetchone()["status"]
        assert updated == new_status
    conn.close()

def test_processing_jobs_persistence():
    """
    Validates that satellite processing jobs are persisted to SQLite table `processing_jobs`
    and can be retrieved across sessions.
    """
    es = EarthSearchService()
    # Create job
    job = es.create_processing_job(
        region_id="aoi-amz-01",
        pre_product_id="S2A_T21MXR_20240629T140223_L2A",
        post_product_id="S2B_T21MXR_20240826T140707_L2A",
        window_coords=(8000, 9600, 100, 100)
    )
    assert job["job_id"] is not None
    assert job["status"] in ["COMPLETED", "PROCESSING"]

    # Retrieve job
    retrieved = es.get_processing_job(job["job_id"])
    assert retrieved is not None
    assert retrieved["job_id"] == job["job_id"]
    assert retrieved["region_id"] == "aoi-amz-01"

def test_earth_search_stac_asset_resolution():
    """
    Validates that EarthSearchService properly resolves real B04, B08, and SCL asset URLs
    from the public Element 84 STAC endpoint.
    """
    es = EarthSearchService()
    # Query known real public product
    scene_id = "S2A_T21MXR_20240629T140223_L2A"
    resolved = es.resolve_product_assets(scene_id)
    assert resolved["id"] == scene_id
    assert "red_band_url" in resolved
    assert "nir_band_url" in resolved
    # Check URLs point to public AWS S3 Sentinel-2 bucket or STAC
    red_url = resolved["red_band_url"]
    nir_url = resolved["nir_band_url"]
    assert "sentinel-s2-l2a" in red_url or "earth-search" in red_url
    assert "sentinel-s2-l2a" in nir_url or "earth-search" in nir_url
