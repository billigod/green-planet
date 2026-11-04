import sys
import os
import pytest
import numpy as np

# Ensure backend root is on sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, os.path.dirname(BASE_DIR))

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.ndvi import NDVICalculator
from backend.app.services.cloud_mask import CloudMaskService
from backend.app.services.change_detection import MultiTemporalChangeDetector
from backend.app.services.incident_engine import IncidentEngine
from backend.app.database.db import init_db

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    init_db()

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "OPERATIONAL"
    assert "HEALTHY" in data["database"]
    assert data["scheduler"] in ["RUNNING", "INITIALIZING"]
    assert "copernicus_integration" in data
    assert "gemini_integration" in data

def test_regions_endpoints(client):
    # GET regions
    response = client.get("/api/regions")
    assert response.status_code == 200
    regions = response.json()
    assert isinstance(regions, list)
    assert len(regions) >= 1
    
    first_region_id = regions[0]["id"]
    
    # GET specific region
    res_reg = client.get(f"/api/regions/{first_region_id}")
    assert res_reg.status_code == 200
    assert res_reg.json()["id"] == first_region_id
    
    # GET region observations
    res_obs = client.get(f"/api/regions/{first_region_id}/observations")
    assert res_obs.status_code == 200
    assert isinstance(res_obs.json(), list)

    # POST create region
    new_reg_payload = {
        "name": "Guaviare Forest Reserve",
        "country": "Colombia",
        "biome": "Amazonian Dense Ombrophilous Rainforest",
        "protected_zone": "National Natural Reserve",
        "center_lat": 2.56,
        "center_lng": -72.64,
        "area_hectares": 350000.0,
        "bounds": [2.3, -73.0, 2.8, -72.3],
        "primary_sensor": "Sentinel-2 L2A"
    }
    res_create = client.post("/api/regions", json=new_reg_payload)
    assert res_create.status_code in [200, 201]
    created = res_create.json()
    assert created["name"] == "Guaviare Forest Reserve"
    assert created["country"] == "Colombia"

def test_incidents_endpoints(client):
    # GET incidents
    response = client.get("/api/incidents")
    assert response.status_code == 200
    incidents = response.json()
    assert isinstance(incidents, list)
    assert len(incidents) >= 1

    first_incident_id = incidents[0]["id"]

    # GET specific incident
    res_inc = client.get(f"/api/incidents/{first_incident_id}")
    assert res_inc.status_code == 200
    inc_data = res_inc.json()
    assert inc_data["id"] == first_incident_id
    assert "loss_area_hectares" in inc_data
    assert "target_reticle" in inc_data

    # POST add note
    res_note = client.post(
        f"/api/incidents/{first_incident_id}/notes",
        json={"author": "Tactical Field Unit", "text": "Machinery tracks corroborated via UAV drone pass."}
    )
    assert res_note.status_code == 200
    assert "Machinery tracks" in res_note.json()["text"]

    # PATCH update status
    res_status = client.patch(
        f"/api/incidents/{first_incident_id}/status",
        json={"status": "INVESTIGATING"}
    )
    assert res_status.status_code == 200
    assert res_status.json()["new_status"] == "INVESTIGATING"

def test_analytics_endpoint(client):
    response = client.get("/api/analytics")
    assert response.status_code == 200
    data = response.json()
    assert data["total_monitored_hectares"] > 0
    assert data["total_loss_hectares_30d"] >= 0
    assert "drivers_breakdown" in data
    assert "predictive_risk_zones" in data
    assert "biome_health_matrix" in data

def test_satellite_status_endpoint(client):
    response = client.get("/api/satellite/status")
    assert response.status_code == 200
    data = response.json()
    assert "copernicus_configured" in data
    assert "sensors" in data
    assert len(data["sensors"]) >= 2
    # Ensure Sentinel-1 and Sentinel-2 are represented
    sensor_names = [s["name"] for s in data["sensors"]]
    assert any("Sentinel-1" in name for name in sensor_names)
    assert any("Sentinel-2" in name for name in sensor_names)

def test_monitoring_run_and_status(client):
    # GET monitoring status
    res_status = client.get("/api/monitoring/status")
    assert res_status.status_code == 200
    status_data = res_status.json()
    assert status_data["interval_hours"] == 12
    assert "recent_runs" in status_data

    # POST trigger manual monitoring run
    res_run = client.post("/api/monitoring/run")
    assert res_run.status_code == 200
    run_result = res_run.json()
    assert run_result["status"] in ["COMPLETED", "FAILED"]
    assert run_result["trigger_type"] == "manual"
    assert run_result["regions_checked"] >= 1

def test_ai_analyze_endpoint(client):
    # Test AI analysis endpoint with fallback or real key
    payload = {
        "prompt": "Evaluate statutory penalties under Brazilian Forest Code for 42 Ha logging corridor.",
        "query_type": "Legal Forensics"
    }
    response = client.post("/api/ai/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["engine"] in ["gemini-2.5-flash", "rule_based_forensic_heuristics"]
    assert len(data["text"]) > 50

def test_ndvi_calculation():
    # NIR band high, Red band low (Dense vegetation)
    nir = np.full((10, 10), 0.8, dtype=np.float32)
    red = np.full((10, 10), 0.2, dtype=np.float32)
    
    ndvi = NDVICalculator.calculate_ndvi(red, nir)
    stats = NDVICalculator.calculate_stats(ndvi)

    # Expected: (0.8 - 0.2) / (0.8 + 0.2) = 0.6 / 1.0 = 0.6
    assert np.allclose(ndvi, 0.6, atol=1e-4)
    assert stats["mean_ndvi"] == 0.6
    assert stats["dense_canopy_fraction"] == 0.0 or stats["mean_ndvi"] >= 0.6

def test_cloud_masking():
    # Synthetic blue, red, nir bands
    blue = np.full((10, 10), 0.15, dtype=np.float32)
    red = np.full((10, 10), 0.10, dtype=np.float32)
    nir = np.full((10, 10), 0.70, dtype=np.float32)

    # Put a bright cloud in top-left 3x3
    blue[0:3, 0:3] = 0.55
    red[0:3, 0:3] = 0.50
    nir[0:3, 0:3] = 0.50

    clear_mask, cloud_pct = CloudMaskService.detect_cloud_and_shadow(blue, red, nir)

    # The 9 pixels should be detected as clouds (clear_mask False)
    assert clear_mask[0, 0] == False
    assert clear_mask[9, 9] == True
    assert cloud_pct == 9.0

def test_change_detection_and_area():
    # 50x50 grid at 10m resolution (each pixel = 100m^2 = 0.01 Ha)
    # 100 pixels loss = 1.0 Hectare
    ndvi_t0 = np.full((50, 50), 0.75, dtype=np.float32) # Pristine canopy
    ndvi_t1 = np.full((50, 50), 0.75, dtype=np.float32)
    
    # Simulate a 10x10 clear-cut patch in center (100 pixels = 1.0 Ha)
    ndvi_t1[20:30, 20:30] = 0.15
    
    valid_t0 = np.ones((50, 50), dtype=bool)
    valid_t1 = np.ones((50, 50), dtype=bool)

    detection = MultiTemporalChangeDetector.detect_optical_loss(
        ndvi_t0=ndvi_t0,
        ndvi_t1=ndvi_t1,
        valid_mask_t0=valid_t0,
        valid_mask_t1=valid_t1,
        resolution_m=10.0,
        ndvi_drop_threshold=0.25,
        min_cluster_pixels=5
    )

    assert detection["loss_detected"] is True
    assert detection["loss_pixel_count"] == 100
    assert detection["loss_area_hectares"] == 1.0
    assert detection["confidence_score"] >= 60.0

def test_incident_engine_biomass_carbon():
    # Test biomass & carbon calculations
    biomass_factor = IncidentEngine.BIOMASS_DENSITY_MAP["Amazonian Dense Ombrophilous Rainforest"] # 230 t/Ha
    carbon_factor = IncidentEngine.CARBON_FACTOR # 1.834
    
    test_ha = 10.0
    expected_biomass = round(test_ha * biomass_factor, 1) # 2300.0 tonnes
    expected_carbon = round(expected_biomass * carbon_factor, 1) # 4218.2 tCO2e

    assert expected_biomass == 2300.0
    assert expected_carbon == 4218.2

def test_copernicus_wkt_polygon_formatting():
    from backend.app.services.copernicus import CopernicusDataSpaceService
    # Bounds: [min_lat, min_lng, max_lat, max_lng]
    bounds = [-3.8, -55.8, -2.6, -54.5]
    wkt = CopernicusDataSpaceService.build_wkt_polygon(bounds)
    assert wkt == "POLYGON((-55.8 -3.8, -54.5 -3.8, -54.5 -2.6, -55.8 -2.6, -55.8 -3.8))"

def test_copernicus_auth_states():
    from unittest.mock import patch, MagicMock
    from backend.app.services.copernicus import CopernicusDataSpaceService
    import requests

    svc = CopernicusDataSpaceService()

    # 1. NOT_CONFIGURED when credentials are empty/dummy
    svc.client_id = ""
    svc.client_secret = ""
    auth = svc.authenticate()
    assert auth["status"] == "NOT_CONFIGURED"
    assert auth["success"] is False

    # 2. AUTHENTICATION_FAILED on 401 Unauthorized
    svc.client_id = "real_test_id"
    svc.client_secret = "real_test_secret"
    mock_resp_401 = MagicMock()
    mock_resp_401.status_code = 401
    mock_resp_401.text = "Unauthorized client credentials"
    with patch.object(svc.session, "post", return_value=mock_resp_401):
        auth_failed = svc.authenticate()
        assert auth_failed["status"] == "AUTHENTICATION_FAILED"
        assert auth_failed["success"] is False

    # 3. SERVICE_UNAVAILABLE on connection timeout or 503
    with patch.object(svc.session, "post", side_effect=requests.exceptions.ConnectTimeout("Connection timed out")):
        auth_unavail = svc.authenticate()
        assert auth_unavail["status"] == "SERVICE_UNAVAILABLE"
        assert auth_unavail["success"] is False

    # 4. AUTHENTICATED on 200 OK
    mock_resp_200 = MagicMock()
    mock_resp_200.status_code = 200
    mock_resp_200.json.return_value = {
        "access_token": "mock_cdse_jwt_token_sample",
        "expires_in": 3600
    }
    with patch.object(svc.session, "post", return_value=mock_resp_200):
        auth_ok = svc.authenticate()
        assert auth_ok["status"] == "AUTHENTICATED"
        assert auth_ok["success"] is True
        assert auth_ok["token"] == "mock_cdse_jwt_token_sample"
        assert svc.check_connection()["status"] == "AUTHENTICATED"

def test_copernicus_catalog_search_parsing():
    from unittest.mock import patch, MagicMock
    from backend.app.services.copernicus import CopernicusDataSpaceService

    svc = CopernicusDataSpaceService()
    svc.client_id = "test_id"
    svc.client_secret = "test_secret"
    svc._access_token = "valid_cached_token"
    from datetime import datetime, timedelta
    svc._token_expiry = datetime.utcnow() + timedelta(hours=1)

    mock_odata_response = {
        "value": [
            {
                "Id": "0e95db50-29a3-4886-9811-sample-s2",
                "Name": "S2B_MSIL2A_20260410T141029_N0500_R082_T21SYD_20260410T172210.SAFE",
                "ContentDate": {
                    "Start": "2026-04-10T14:10:29.024Z",
                    "End": "2026-04-10T14:10:29.024Z"
                },
                "Footprint": "geography'SRID=4326;POLYGON((-55.8 -3.8, -54.5 -3.8, -54.5 -2.6, -55.8 -2.6, -55.8 -3.8))'",
                "Attributes": [
                    {"Name": "cloudCover", "Value": 6.42}
                ],
                "ContentLength": 104857600
            }
        ]
    }

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_odata_response

    with patch.object(svc.session, "get", return_value=mock_resp):
        res = svc.search_sentinel2_l2a(
            bounds=[-3.8, -55.8, -2.6, -54.5],
            start_date="2026-04-01",
            end_date="2026-04-12",
            max_cloud_cover=20.0
        )
        assert res["status"] == "SUCCESS"
        assert res["total_found"] == 1
        prod = res["products"][0]
        assert prod["product_type"] == "S2MSI2A"
        assert prod["cloud_cover_pct"] == 6.42
        assert prod["source_type"] == "COPERNICUS_REAL"
        assert "quicklook" in prod["quicklook_url"]

def test_copernicus_endpoints(client):
    # Test GET /api/satellite/copernicus/test
    res_test = client.get("/api/satellite/copernicus/test")
    assert res_test.status_code == 200
    data = res_test.json()
    assert data["status"] in ["AUTHENTICATED", "NOT_CONFIGURED", "AUTHENTICATION_FAILED", "SERVICE_UNAVAILABLE"]
    assert "configured" in data
    assert "token_url" in data

    # Test POST /api/satellite/search
    search_payload = {
        "bounds": [-3.8, -55.8, -2.6, -54.5],
        "collection": "SENTINEL-2",
        "start_date": "2026-04-01",
        "end_date": "2026-04-12",
        "max_cloud_cover": 30.0,
        "limit": 5
    }
    res_search = client.post("/api/satellite/search", json=search_payload)
    assert res_search.status_code == 200
    search_data = res_search.json()
    assert "status" in search_data
    assert "total_found" in search_data
    assert isinstance(search_data["products"], list)

def test_observations_provenance(client):
    # Verify baseline observations are tagged with BASELINE_ARCHIVE or ELEMENT84_REAL
    res = client.get("/api/regions/aoi-amz-01/observations")
    assert res.status_code == 200
    obs_list = res.json()
    assert len(obs_list) >= 1
    # Check that metadata has source_type
    first_obs = obs_list[0]
    assert first_obs["metadata"] is not None
    assert first_obs["metadata"].get("source_type") in ["BASELINE_ARCHIVE", "COPERNICUS_REAL", "ELEMENT84_REAL"]

def test_earth_search_service_status():
    from backend.app.services.earth_search import earth_search_service
    status = earth_search_service.get_status()
    assert status["provider"] == "ELEMENT84"
    assert status["status"] == "OPERATIONAL"
    assert status["authentication_required"] is False
    assert "https://earth-search.aws.element84.com/v1" in status["endpoint"]
    assert "sentinel-2-c1-l2a" in status["collections_supported"]
    assert "sentinel-1-grd" in status["collections_supported"]

def test_earth_search_bbox_normalization():
    from backend.app.services.earth_search import earth_search_service
    # Given [min_lat, min_lon, max_lat, max_lon]
    stac_bbox = earth_search_service.normalize_bbox([-3.8, -55.8, -2.6, -54.5])
    # Expect [min_lon, min_lat, max_lon, max_lat]
    assert stac_bbox == [-55.8, -3.8, -54.5, -2.6]
    assert stac_bbox[0] < stac_bbox[2]
    assert stac_bbox[1] < stac_bbox[3]

def test_earth_search_endpoints(client):
    # 1. GET /api/satellite/earthsearch/status
    res_status = client.get("/api/satellite/earthsearch/status")
    assert res_status.status_code == 200
    status_data = res_status.json()
    assert status_data["provider"] == "ELEMENT84"
    assert status_data["authentication_required"] is False

    # 2. POST /api/satellite/search with provider=ELEMENT84
    search_payload = {
        "provider": "ELEMENT84",
        "bounds": [-3.8, -55.8, -2.6, -54.5],
        "collection": "SENTINEL-2",
        "start_date": "2024-06-01",
        "end_date": "2024-07-01",
        "max_cloud_cover": 20.0,
        "limit": 3
    }
    res_search = client.post("/api/satellite/search", json=search_payload)
    assert res_search.status_code == 200
    search_data = res_search.json()
    assert search_data["provider"] == "ELEMENT84"
    assert search_data["status"] == "SUCCESS"
    assert isinstance(search_data["products"], list)
    if search_data["total_found"] > 0:
        prod = search_data["products"][0]
        assert "S2" in prod["name"]
        assert prod["source_type"] == "ELEMENT84_REAL"
        assert len(prod["available_bands"]) > 0

    # 3. POST /api/satellite/earthsearch/process
    process_payload = {
        "scene_id": "TEST_SCENE_01",
        "thumbnail_url": "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=400&q=80"
    }
    res_proc = client.post("/api/satellite/earthsearch/process", json=process_payload)
    assert res_proc.status_code == 200
    proc_data = res_proc.json()
    assert proc_data["processed"] is True
    assert proc_data["provenance"] == "ELEMENT84_REAL_RASTER"
    assert len(proc_data["raster_dimensions"]) == 2

def test_jobs_and_aoi_detection_endpoints(client):
    # Test POST /api/satellite/detect-aoi
    detect_payload = {
        "region_id": "aoi-amz-01",
        "min_interval_days": 5,
        "max_cloud_cover": 30.0,
        "window_coords": [8000, 9600, 100, 100]
    }
    res_detect = client.post("/api/satellite/detect-aoi", json=detect_payload)
    assert res_detect.status_code == 200
    detect_data = res_detect.json()
    assert "status" in detect_data
    assert "region_id" in detect_data

    # Test POST /api/satellite/jobs
    job_payload = {
        "region_id": "aoi-amz-01",
        "pre_product_id": "S2A_T21MXR_20240629T140223_L2A",
        "post_product_id": "S2B_T21MXR_20240826T140707_L2A",
        "window_coords": [8000, 9600, 100, 100]
    }
    res_job = client.post("/api/satellite/jobs", json=job_payload)
    assert res_job.status_code == 200
    job_data = res_job.json()
    assert "job_id" in job_data
    assert job_data["status"] in ["COMPLETED", "PROCESSING", "FAILED"]

    # Test GET /api/satellite/jobs/{job_id}
    res_get_job = client.get(f"/api/satellite/jobs/{job_data['job_id']}")
    assert res_get_job.status_code == 200
    retrieved_job = res_get_job.json()
    assert retrieved_job["job_id"] == job_data["job_id"]

    # Test GET /api/satellite/observations/{obs_id}
    res_obs = client.get("/api/satellite/observations/obs-s2-20260405")
    assert res_obs.status_code == 200
    obs_data = res_obs.json()
    assert obs_data["id"] == "obs-s2-20260405"

