import os
import json
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
from ...models.schemas import (
    SatelliteStatusResponse, 
    SatelliteSourceStatus, 
    MonitoringStatusResponse, 
    MonitoringRunResult,
    CopernicusConnectionTestResponse,
    SatelliteSearchRequest,
    SatelliteSearchResponse,
    SatelliteProductItem,
    EarthSearchStatusResponse,
    EarthSearchDownloadRequest,
    EarthSearchDownloadResponse,
    EarthSearchProcessRequest,
    EarthSearchProcessResponse,
    EarthSearchMultispectralRequest,
    EarthSearchMultispectralResponse,
    EarthSearchCompareRequest,
    EarthSearchCompareResponse,
    ProcessingJobCreate,
    ProcessingJobResponse,
    AoiDetectionRequest,
    AoiDetectionResponse,
    ObservationResponse
)
from ...services.copernicus import copernicus_service
from ...services.earth_search import earth_search_service
from ...scheduler.monitoring_scheduler import monitoring_scheduler
from ...database.db import get_connection

router = APIRouter()

@router.get("/satellite/status", response_model=SatelliteStatusResponse)
def get_satellite_status():
    cop_auth = copernicus_service.authenticate()
    is_conf = copernicus_service.is_configured()
    auth_ok = cop_auth.get("success", False)
    status_str = cop_auth.get("status", "NOT_CONFIGURED")

    sentinel1_msg = (
        "Connected to Copernicus Data Space Ecosystem (Sentinel-1 C-band SAR)."
        if auth_ok else
        "Copernicus API credentials not set. Running in verified baseline mode."
    )

    sentinel2_msg = (
        "Connected to Copernicus Data Space Ecosystem (Sentinel-2 Multi-Spectral)."
        if auth_ok else
        "Copernicus API credentials not set. Running in verified baseline mode."
    )

    sensors = [
        SatelliteSourceStatus(
            id="sat-sentinel-1c",
            name="Sentinel-1C (C-SAR)",
            constellation="Copernicus Earth Observation",
            agency="European Space Agency (ESA)",
            sensor_type="sar",
            resolution_m=10.0,
            revisit_interval_hrs=12.0,
            status="active_pass" if auth_ok else "nominal",
            connection_status="CONNECTED" if auth_ok else "NOT_CONFIGURED",
            real_api_authenticated=auth_ok,
            api_message=sentinel1_msg,
            next_pass="Dependent on orbital ephemeris",
            spectral_bands=["C-band SAR (5.405 GHz)", "VV/VH Polarimetry", "Interferometric Wide Swath"],
            altitude_km=693.0,
            inclination_deg=98.18,
            daily_processed_tiles=1420,
            health_pct=99.8,
            mode="Interferometric Coherence Loss Detection"
        ),
        SatelliteSourceStatus(
            id="sat-sentinel-2b",
            name="Sentinel-2B (MSI)",
            constellation="Copernicus Multi-Spectral",
            agency="European Space Agency (ESA)",
            sensor_type="optical",
            resolution_m=10.0,
            revisit_interval_hrs=5.0,
            status="nominal",
            connection_status="CONNECTED" if auth_ok else "NOT_CONFIGURED",
            real_api_authenticated=auth_ok,
            api_message=sentinel2_msg,
            next_pass="Dependent on sun-synchronous pass",
            spectral_bands=["B02 Blue (490nm)", "B03 Green (560nm)", "B04 Red (665nm)", "B08 NIR (842nm)", "B11 SWIR"],
            altitude_km=786.0,
            inclination_deg=98.62,
            daily_processed_tiles=2850,
            health_pct=98.6,
            mode="Multi-temporal Surface Reflectance (L2A)"
        ),
        SatelliteSourceStatus(
            id="sat-landsat-9",
            name="Landsat 9 (OLI-2 / TIRS-2)",
            constellation="USGS / NASA Landsat",
            agency="NASA / USGS",
            sensor_type="optical_thermal",
            resolution_m=15.0,
            revisit_interval_hrs=16.0,
            status="nominal",
            connection_status="SIMULATED_DEMO",
            real_api_authenticated=False,
            api_message="Thermal infrared corroboration and cross-calibration stream.",
            next_pass="T+14h 22m",
            spectral_bands=["VNIR (30m)", "Pan (15m)", "Thermal TIRS-2 (100m)"],
            altitude_km=705.0,
            inclination_deg=98.2,
            daily_processed_tiles=980,
            health_pct=99.1,
            mode="Thermal Canopy Emissivity Cross-Verification"
        ),
        SatelliteSourceStatus(
            id="sat-planetscope",
            name="PlanetScope Dove Constellation",
            constellation="Planet Labs PlanetScope",
            agency="Commercial Constellation",
            sensor_type="commercial_highres",
            resolution_m=3.0,
            revisit_interval_hrs=24.0,
            status="standby",
            connection_status="SIMULATED_DEMO",
            real_api_authenticated=False,
            api_message="Commercial high-resolution stereo tasking ready for judicial evidence dossiers.",
            next_pass="On Demand Rapid Revisit",
            spectral_bands=["RGB Visible", "NIR (8-band SuperDove)"],
            altitude_km=475.0,
            inclination_deg=98.0,
            daily_processed_tiles=5400,
            health_pct=97.4,
            mode="Selective Tasking for Machinery Identification"
        )
    ]

    return SatelliteStatusResponse(
        primary_provider="ELEMENT84",
        earthsearch_status="OPERATIONAL",
        earthsearch_endpoint=earth_search_service.endpoint,
        earthsearch_auth_required=False,
        copernicus_configured=is_conf,
        copernicus_status=status_str,
        client_id_set=bool(copernicus_service.client_id),
        token_url=copernicus_service.token_url,
        catalog_url=copernicus_service.catalog_url,
        authenticated=auth_ok,
        last_catalog_query=None,
        sensors=sensors
    )

@router.get("/satellite/earthsearch/status", response_model=EarthSearchStatusResponse)
def get_earthsearch_status():
    """
    Returns operational status of the primary satellite provider: Element 84 Earth Search STAC API.
    Publicly accessible open data without requiring OAuth credentials.
    """
    status = earth_search_service.get_status()
    return EarthSearchStatusResponse(
        provider=status.get("provider", "ELEMENT84"),
        status=status.get("status", "OPERATIONAL"),
        title=status.get("title", "Earth Search by Element 84"),
        stac_version=status.get("stac_version", "1.0.0"),
        endpoint=status.get("endpoint", earth_search_service.endpoint),
        authentication_required=False,
        collections_supported=status.get("collections_supported", ["sentinel-2-c1-l2a", "sentinel-2-l2a", "sentinel-1-grd"]),
        message=status.get("message", "Connected to Element 84 Earth Search STAC API v1.")
    )

@router.get("/satellite/copernicus/test", response_model=CopernicusConnectionTestResponse)
def test_copernicus_connection():
    """
    Probes connection to the secondary Copernicus Data Space Ecosystem OAuth2 endpoint.
    Strictly reports one of: AUTHENTICATED, NOT_CONFIGURED, AUTHENTICATION_FAILED, SERVICE_UNAVAILABLE.
    """
    result = copernicus_service.check_connection()
    return CopernicusConnectionTestResponse(
        status=result["status"],
        success=result["success"],
        message=result["message"],
        configured=result["configured"],
        token_url=result["token_url"],
        catalog_url=result["catalog_url"],
        timestamp=result["timestamp"],
        expires_at=result.get("expires_at")
    )

@router.post("/satellite/search", response_model=SatelliteSearchResponse)
def search_satellite_catalog(req: SatelliteSearchRequest):
    """
    Executes real satellite catalog search.
    Defaults to Element 84 Earth Search STAC API (Primary, Public, No Auth Required),
    with Copernicus Data Space Ecosystem available as secondary provider.
    """
    provider = (req.provider or "ELEMENT84").upper()

    if provider == "COPERNICUS":
        search_res = copernicus_service.search_products(
            bounds=req.bounds,
            start_date=req.start_date,
            end_date=req.end_date,
            collection=req.collection or "SENTINEL-2",
            max_cloud_cover=req.max_cloud_cover if req.max_cloud_cover is not None else 30.0,
            limit=req.limit or 10
        )
        products = [
            SatelliteProductItem(
                id=str(p["id"]),
                name=p["name"],
                collection=p["collection"],
                product_type=p["product_type"],
                acquisition_date=p["acquisition_date"],
                content_date_end=p.get("content_date_end"),
                footprint=p.get("footprint"),
                cloud_cover_pct=p.get("cloud_cover_pct", 0.0),
                quicklook_url=p.get("quicklook_url"),
                download_url=p.get("download_url"),
                thumbnail_url=p.get("quicklook_url"),
                visual_url=p.get("quicklook_url"),
                available_bands=["B02", "B03", "B04", "B08", "B11"],
                content_length_bytes=p.get("content_length_bytes"),
                source_type="COPERNICUS_REAL",
                provider="COPERNICUS"
            )
            for p in search_res.get("products", [])
        ]
        return SatelliteSearchResponse(
            provider="COPERNICUS",
            status=search_res.get("status", "SUCCESS"),
            total_found=search_res.get("total_found", len(products)),
            products=products,
            message=search_res.get("message"),
            filter_applied=search_res.get("filter_applied")
        )

    # Primary: Element 84 Earth Search STAC
    collection = (req.collection or "SENTINEL-2").upper()
    if collection == "SENTINEL-1":
        search_res = earth_search_service.search_sentinel1_grd(
            bounds=req.bounds,
            start_date=req.start_date,
            end_date=req.end_date,
            limit=req.limit or 10
        )
    else:
        search_res = earth_search_service.search_sentinel2_l2a(
            bounds=req.bounds,
            start_date=req.start_date,
            end_date=req.end_date,
            max_cloud_cover=req.max_cloud_cover if req.max_cloud_cover is not None else 30.0,
            limit=req.limit or 10
        )

    products = [
        SatelliteProductItem(
            id=str(p["id"]),
            name=p["name"],
            collection=p["collection"],
            product_type=p["product_type"],
            acquisition_date=p["acquisition_date"],
            footprint=p.get("footprint"),
            cloud_cover_pct=p.get("cloud_cover_pct", 0.0),
            thumbnail_url=p.get("thumbnail_url"),
            visual_url=p.get("visual_url"),
            red_band_url=p.get("red_band_url"),
            nir_band_url=p.get("nir_band_url"),
            available_bands=p.get("available_bands", []),
            assets=p.get("assets"),
            quicklook_url=p.get("thumbnail_url"),
            download_url=p.get("visual_url") or p.get("thumbnail_url"),
            source_type="ELEMENT84_REAL",
            provider="ELEMENT84"
        )
        for p in search_res.get("products", [])
    ]

    return SatelliteSearchResponse(
        provider="ELEMENT84",
        status=search_res.get("status", "SUCCESS"),
        total_found=search_res.get("total_found", len(products)),
        products=products,
        message=search_res.get("message"),
        filter_applied=f"BBOX: {search_res.get('query_bbox')} | Datetime: {search_res.get('query_datetime')}"
    )

@router.get("/satellite/latest-passes")
def get_latest_satellite_passes(
    lat: float = Query(-3.228, description="Target Latitude"),
    lng: float = Query(-55.138, description="Target Longitude"),
    sensor: str = Query("sentinel-2", description="Satellite Sensor"),
    limit: int = Query(3, description="Number of passes to retrieve")
):
    """
    Returns real latest satellite images and telemetry directly from the Element 84 Earth Search STAC API
    for any pinned location or monitored forest.
    """
    passes = earth_search_service.get_latest_passes(lat=lat, lng=lng, sensor=sensor, limit=limit)
    return {
        "success": True,
        "lat": lat,
        "lng": lng,
        "sensor": sensor,
        "total": len(passes),
        "passes": passes
    }

@router.post("/satellite/earthsearch/download", response_model=EarthSearchDownloadResponse)
def download_earthsearch_asset(req: EarthSearchDownloadRequest):
    """
    Downloads publicly accessible satellite assets (COG GeoTIFF, thumbnails, previews).
    Reports download progress, size, and explicitly flags if authentication or requester-pays is required.
    """
    result = earth_search_service.download_asset(
        asset_url=req.asset_url,
        target_filename=req.target_filename,
        max_bytes=req.max_bytes or 40_000_000
    )
    return EarthSearchDownloadResponse(
        success=result["success"],
        status=result["status"],
        bytes_downloaded=result["bytes_downloaded"],
        local_path=result.get("local_path"),
        content_type=result.get("content_type"),
        elapsed_seconds=result.get("elapsed_seconds"),
        requires_authentication=result.get("requires_authentication", False),
        message=result["message"]
    )

@router.post("/satellite/earthsearch/process", response_model=EarthSearchProcessResponse)
def process_earthsearch_scene(req: EarthSearchProcessRequest):
    """
    Retrieves and processes real satellite imagery using NDVI and cloud masking algorithms.
    Returns calculated canopy metrics derived from actual satellite observations.
    """
    result = earth_search_service.process_real_scene(
        scene_id=req.scene_id,
        thumbnail_url=req.thumbnail_url,
        red_url=req.red_url,
        nir_url=req.nir_url
    )
    return EarthSearchProcessResponse(
        success=result.get("success", False),
        processed=result.get("processed", False),
        scene_id=result.get("scene_id", req.scene_id),
        raster_dimensions=result.get("raster_dimensions"),
        raster_channels=result.get("raster_channels"),
        real_asset_source=result.get("real_asset_source"),
        bytes_processed=result.get("bytes_processed"),
        mean_vegetation_index=result.get("mean_vegetation_index"),
        canopy_coverage_pct=result.get("canopy_coverage_pct"),
        cloud_coverage_pct=result.get("cloud_coverage_pct"),
        provenance=result.get("provenance", "ELEMENT84_REAL_RASTER"),
        requires_authentication=result.get("requires_authentication", False),
        message=result.get("message", "Processing completed.")
    )

@router.post("/satellite/earthsearch/multispectral", response_model=EarthSearchMultispectralResponse)
def process_earthsearch_multispectral(req: EarthSearchMultispectralRequest):
    """
    Processes real Sentinel-2 L2A multispectral bands: B04 (Red 10m), B08 (NIR 10m), and SCL.
    Calculates genuine NDVI = (B08 - B04) / (B08 + B04), applies SCL cloud/shadow masking,
    and produces georeferenced GeoTIFF and preview PNG outputs.
    """
    coords = tuple(req.window_coords) if req.window_coords and len(req.window_coords) == 4 else None
    result = earth_search_service.process_sentinel2_multispectral(
        scene_id=req.scene_id,
        b04_url=req.b04_url,
        b08_url=req.b08_url,
        scl_url=req.scl_url,
        window_coords=coords
    )
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message", "Multispectral processing failed."))

    return EarthSearchMultispectralResponse(
        success=result["success"],
        processed=result["processed"],
        scene_id=result["scene_id"],
        formula=result.get("formula", "NDVI = (B08 - B04) / (B08 + B04)"),
        bands_retrieved=result.get("bands_retrieved", ["B04", "B08"]),
        spatial_resolution_m=result.get("spatial_resolution_m", 10.0),
        crs=result.get("crs", "EPSG:32721"),
        raster_dimensions=result.get("raster_dimensions", [300, 300]),
        geotiff_path=result.get("geotiff_path"),
        preview_url=result.get("preview_url"),
        mean_ndvi=result.get("mean_ndvi", 0.0),
        median_ndvi=result.get("median_ndvi", 0.0),
        min_ndvi=result.get("min_ndvi", -1.0),
        max_ndvi=result.get("max_ndvi", 1.0),
        dense_canopy_fraction=result.get("dense_canopy_fraction", 0.0),
        degraded_ground_fraction=result.get("degraded_ground_fraction", 0.0),
        valid_pixel_count=result.get("valid_pixel_count", 0),
        cloud_coverage_pct=result.get("cloud_coverage_pct", 0.0),
        provenance=result.get("provenance", "ELEMENT84_REAL_MULTISPECTRAL_RASTER"),
        message=result.get("message", "Multispectral NDVI extraction completed.")
    )

@router.post("/satellite/earthsearch/compare", response_model=EarthSearchCompareResponse)
def compare_earthsearch_scenes(req: EarthSearchCompareRequest):
    """
    Executes multi-date satellite comparison for deforestation detection.
    Processes two distinct acquisition dates, computes Delta-NDVI, extracts georeferenced
    loss polygons in WGS84 GeoJSON format, and creates an incident in the database.
    """
    coords = tuple(req.window_coords) if req.window_coords and len(req.window_coords) == 4 else None
    result = earth_search_service.compare_multitemporal_scenes(
        region_id=req.region_id,
        pre_product_id=req.pre_product_id,
        post_product_id=req.post_product_id,
        window_coords=coords,
        ndvi_drop_threshold=req.ndvi_drop_threshold or 0.18,
        min_baseline_ndvi=req.min_baseline_ndvi or 0.45,
        min_cluster_pixels=req.min_cluster_pixels or 5
    )
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message", "Multi-temporal comparison failed."))

    return EarthSearchCompareResponse(
        success=result["success"],
        loss_detected=result.get("loss_detected", False),
        region_id=result["region_id"],
        pre_product_id=result["pre_product_id"],
        post_product_id=result["post_product_id"],
        pre_date=result["pre_date"],
        post_date=result["post_date"],
        mean_ndvi_t0=result.get("mean_ndvi_t0", 0.0),
        mean_ndvi_t1=result.get("mean_ndvi_t1", 0.0),
        mean_ndvi_drop=result.get("mean_ndvi_drop", 0.0),
        loss_area_hectares=result.get("loss_area_hectares", 0.0),
        loss_pixel_count=result.get("loss_pixel_count", 0),
        confidence_score=result.get("confidence_score", 0.0),
        clusters_count=result.get("clusters_count", 0),
        polygons=result.get("polygons", []),
        incident_id=result.get("incident_id"),
        pre_preview_url=result.get("pre_preview_url"),
        post_preview_url=result.get("post_preview_url"),
        change_preview_url=result.get("change_preview_url"),
        methodology=result.get("methodology", "S2_L2A_MULTISPECTRAL_NDVI_DELTA"),
        provenance=result.get("provenance", "ELEMENT84_REAL_MULTISPECTRAL"),
        message=result.get("message", "Comparison completed.")
    )

@router.post("/satellite/detect-aoi", response_model=AoiDetectionResponse)
def detect_aoi_changes_endpoint(req: AoiDetectionRequest):
    """
    Automated Sentinel-2 change detection pipeline for a monitored region.
    Discovers at least two usable observations separated by a meaningful interval,
    applies SCL masking, calculates NDVI delta, identifies loss clusters, and emits incidents.
    """
    coords = tuple(req.window_coords) if req.window_coords and len(req.window_coords) == 4 else None
    result = earth_search_service.detect_aoi_changes(
        region_id=req.region_id,
        min_interval_days=req.min_interval_days or 5,
        max_cloud_cover=req.max_cloud_cover if req.max_cloud_cover is not None else 30.0,
        ndvi_drop_threshold=req.ndvi_drop_threshold or 0.18,
        min_baseline_ndvi=req.min_baseline_ndvi or 0.45,
        min_cluster_pixels=req.min_cluster_pixels or 5,
        window_coords=coords
    )

    return AoiDetectionResponse(
        success=result.get("success", False),
        status=result.get("status", "COMPLETED"),
        region_id=result["region_id"],
        observations_found=result.get("observations_found", 0),
        pre_product_id=result.get("pre_product_id"),
        post_product_id=result.get("post_product_id"),
        pre_date=result.get("pre_date"),
        post_date=result.get("post_date"),
        interval_days=result.get("interval_days"),
        loss_detected=result.get("loss_detected", False),
        loss_area_hectares=result.get("loss_area_hectares", 0.0),
        confidence_score=result.get("confidence_score", 0.0),
        clusters_count=result.get("clusters_count", 0),
        incident_id=result.get("incident_id"),
        polygons=result.get("polygons", []),
        pre_preview_url=result.get("pre_preview_url"),
        post_preview_url=result.get("post_preview_url"),
        change_preview_url=result.get("change_preview_url"),
        message=result.get("message", "AOI change detection completed.")
    )

@router.post("/satellite/jobs", response_model=ProcessingJobResponse)
def create_satellite_processing_job(req: ProcessingJobCreate):
    """
    Creates and persists a satellite processing job in SQLite.
    Survives restarts and allows polling for status.
    """
    coords = tuple(req.window_coords) if req.window_coords and len(req.window_coords) == 4 else None
    job = earth_search_service.create_processing_job(
        region_id=req.region_id,
        pre_product_id=req.pre_product_id,
        post_product_id=req.post_product_id,
        window_coords=coords,
        ndvi_drop_threshold=req.ndvi_drop_threshold or 0.18,
        min_baseline_ndvi=req.min_baseline_ndvi or 0.45,
        min_cluster_pixels=req.min_cluster_pixels or 5,
        job_type=req.job_type or "MULTISPECTRAL_CHANGE_DETECTION"
    )

    return ProcessingJobResponse(
        job_id=job["job_id"],
        region_id=job["region_id"],
        job_type=job["job_type"],
        status=job["status"],
        params=job.get("params"),
        result=job.get("result"),
        error_message=job.get("error_message"),
        created_at=job["created_at"],
        completed_at=job.get("completed_at")
    )

@router.get("/satellite/jobs/{job_id}", response_model=ProcessingJobResponse)
def get_satellite_processing_job(job_id: str):
    """
    Fetches the persistent execution status and result of a satellite processing job.
    """
    job = earth_search_service.get_processing_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Processing job {job_id} not found")

    return ProcessingJobResponse(
        job_id=job["job_id"],
        region_id=job["region_id"],
        job_type=job["job_type"],
        status=job["status"],
        params=job.get("params"),
        result=job.get("result"),
        error_message=job.get("error_message"),
        created_at=job["created_at"],
        completed_at=job.get("completed_at")
    )

@router.get("/satellite/observations/{obs_id}", response_model=ObservationResponse)
def get_satellite_observation(obs_id: str):
    """
    Retrieves detailed metadata, cloud coverage, and asset references for an observation.
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM observations WHERE id = ? OR product_identifier = ?", (obs_id, obs_id))
    r = cursor.fetchone()
    conn.close()

    if not r:
        raise HTTPException(status_code=404, detail=f"Observation {obs_id} not found")

    meta = json.loads(r["metadata_json"]) if r["metadata_json"] else None
    return ObservationResponse(
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
        metadata=meta
    )

@router.get("/satellite/earthsearch/raster/{filename}")
def get_cached_raster_file(filename: str):
    """
    Serves georeferenced GeoTIFF or preview PNG files from local cache safely.
    Validates against path traversal vulnerabilities.
    """
    clean_name = os.path.basename(filename)
    cache_root = os.path.abspath(earth_search_service.cache_dir)
    file_path = os.path.abspath(os.path.join(cache_root, clean_name))

    if not file_path.startswith(cache_root):
        raise HTTPException(status_code=403, detail="Forbidden: Path traversal attempt.")

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Raster asset file not found in cache.")

    media_type = "image/png" if clean_name.endswith(".png") else "image/tiff"
    return FileResponse(file_path, media_type=media_type, filename=clean_name)

@router.post("/monitoring/run", response_model=MonitoringRunResult)
def run_monitoring_cycle():
    result = monitoring_scheduler.execute_monitoring_cycle(trigger_type="manual")
    return MonitoringRunResult(
        job_id=result["job_id"],
        started_at=result["started_at"],
        completed_at=result["completed_at"],
        status=result["status"],
        trigger_type=result["trigger_type"],
        regions_checked=result["regions_checked"],
        new_observations_found=result["new_observations_found"],
        incidents_created=result["incidents_created"],
        copernicus_status=result["copernicus_status"],
        details=result.get("details"),
        error_message=result.get("error_message")
    )

@router.get("/monitoring/status", response_model=MonitoringStatusResponse)
def get_monitoring_status():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as cnt FROM monitoring_runs")
    total_runs = cursor.fetchone()["cnt"]

    cursor.execute("SELECT * FROM monitoring_runs ORDER BY started_at DESC LIMIT 5")
    rows = cursor.fetchall()
    conn.close()

    recent_runs = [
        MonitoringRunResult(
            job_id=r["id"],
            started_at=r["started_at"],
            completed_at=r["completed_at"],
            status=r["status"],
            trigger_type=r["trigger_type"],
            regions_checked=r["regions_checked"],
            new_observations_found=r["new_observations_found"],
            incidents_created=r["incidents_created"],
            copernicus_status=r["copernicus_status"],
            details=json.loads(r["details_json"]) if r["details_json"] else None,
            error_message=r["error_message"]
        )
        for r in rows
    ]

    return MonitoringStatusResponse(
        scheduler_running=monitoring_scheduler.is_running,
        interval_hours=monitoring_scheduler.interval_hours,
        next_run_time="Continuous background timer (12 hours)",
        total_runs_completed=total_runs,
        recent_runs=recent_runs
    )
