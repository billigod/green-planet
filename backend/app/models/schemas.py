from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class Coordinates(BaseModel):
    lat: float
    lng: float

class RegionCreate(BaseModel):
    name: str = Field(..., description="Name of the forest reserve or monitoring region")
    country: str
    biome: str
    protected_zone: str
    center_lat: float
    center_lng: float
    area_hectares: float
    bounds: List[float] = Field(..., description="[min_lat, min_lng, max_lat, max_lng]")
    primary_sensor: Optional[str] = "Sentinel-2 L2A"

class RegionResponse(BaseModel):
    id: str
    name: str
    country: str
    biome: str
    protected_zone: str
    center_coords: Coordinates
    area_hectares: float
    tree_cover_loss_ha: float
    canopy_integrity_pct: float
    risk_level: str
    primary_sensor: str
    bounds: List[float]
    active_alerts_count: int = 0
    last_pass_time: Optional[str] = "Checked by 12h scheduler"

class ObservationResponse(BaseModel):
    id: str
    region_id: str
    sensor_name: str
    sensor_type: str
    acquisition_date: str
    cloud_cover_pct: float
    product_identifier: str
    resolution_m: float
    status: str
    image_url: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class IncidentTimelineItem(BaseModel):
    id: str
    timestamp: str
    event: str
    actor: str
    verified: bool

class IncidentNoteItem(BaseModel):
    id: str
    timestamp: str
    author: str
    text: str

class NoteCreate(BaseModel):
    author: Optional[str] = "Analyst Console"
    text: str

class StatusUpdate(BaseModel):
    status: str

class IncidentResponse(BaseModel):
    id: str
    region_id: str
    title: str
    coordinates: Coordinates
    utm_zone: str
    timestamp: str
    detected_by: str
    confidence_score: float
    severity: str
    status: str
    loss_area_hectares: float
    estimated_canopy_loss_pct: float
    biomass_loss_tonnes: float
    carbon_emission_tco2e: float
    threat_type: str
    pre_image_url: Optional[str] = None
    post_image_url: Optional[str] = None
    change_mask_url: Optional[str] = None
    pre_date: str
    post_date: str
    baseline_observation_id: Optional[str] = None
    current_observation_id: Optional[str] = None
    legal_jurisdiction: str
    target_reticle: Dict[str, Any]
    ground_patrol_unit: Optional[Dict[str, Any]] = None
    notes: List[IncidentNoteItem] = []
    timeline: List[IncidentTimelineItem] = []

class SatelliteSourceStatus(BaseModel):
    id: str
    name: str
    constellation: str
    agency: str
    sensor_type: str
    resolution_m: float
    revisit_interval_hrs: float
    status: str
    connection_status: str  # CONNECTED | NOT_CONFIGURED | OFFLINE | SIMULATED_DEMO
    real_api_authenticated: bool
    api_message: str
    next_pass: str
    spectral_bands: List[str]
    altitude_km: float
    inclination_deg: float
    daily_processed_tiles: int
    health_pct: float
    mode: str

class SatelliteStatusResponse(BaseModel):
    primary_provider: str = "ELEMENT84"
    earthsearch_status: str = "OPERATIONAL"
    earthsearch_endpoint: str = "https://earth-search.aws.element84.com/v1"
    earthsearch_auth_required: bool = False
    copernicus_configured: bool
    copernicus_status: str  # AUTHENTICATED | NOT_CONFIGURED | AUTHENTICATION_FAILED | SERVICE_UNAVAILABLE
    client_id_set: bool
    token_url: str
    catalog_url: str
    authenticated: bool
    last_catalog_query: Optional[str] = None
    sensors: List[SatelliteSourceStatus]

class CopernicusConnectionTestResponse(BaseModel):
    status: str
    success: bool
    message: str
    configured: bool
    token_url: str
    catalog_url: str
    timestamp: str
    expires_at: Optional[str] = None

class SatelliteSearchRequest(BaseModel):
    provider: Optional[str] = "ELEMENT84"  # "ELEMENT84" (Primary) | "COPERNICUS" (Secondary)
    bounds: List[float] = Field(..., description="[min_lat, min_lng, max_lat, max_lng]")
    collection: Optional[str] = "SENTINEL-2"
    start_date: str
    end_date: str
    max_cloud_cover: Optional[float] = 30.0
    limit: Optional[int] = 10

class SatelliteProductItem(BaseModel):
    id: str
    name: str
    collection: str
    product_type: str
    acquisition_date: str
    content_date_end: Optional[str] = None
    footprint: Optional[Any] = None
    cloud_cover_pct: float = 0.0
    quicklook_url: Optional[str] = None
    download_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    visual_url: Optional[str] = None
    red_band_url: Optional[str] = None
    nir_band_url: Optional[str] = None
    available_bands: Optional[List[str]] = []
    assets: Optional[Dict[str, Any]] = None
    content_length_bytes: Optional[int] = None
    source_type: str = "ELEMENT84_REAL"
    provider: Optional[str] = "ELEMENT84"

class SatelliteSearchResponse(BaseModel):
    provider: str = "ELEMENT84"
    status: str
    total_found: int
    products: List[SatelliteProductItem]
    message: Optional[str] = None
    filter_applied: Optional[str] = None

class EarthSearchStatusResponse(BaseModel):
    provider: str
    status: str
    title: Optional[str] = None
    stac_version: Optional[str] = None
    endpoint: str
    authentication_required: bool
    collections_supported: List[str]
    message: str

class EarthSearchDownloadRequest(BaseModel):
    asset_url: str
    target_filename: Optional[str] = None
    max_bytes: Optional[int] = 40_000_000

class EarthSearchDownloadResponse(BaseModel):
    success: bool
    status: str
    bytes_downloaded: int
    local_path: Optional[str] = None
    content_type: Optional[str] = None
    elapsed_seconds: Optional[float] = None
    requires_authentication: bool = False
    message: str

class EarthSearchProcessRequest(BaseModel):
    scene_id: str
    thumbnail_url: Optional[str] = None
    red_url: Optional[str] = None
    nir_url: Optional[str] = None

class EarthSearchProcessResponse(BaseModel):
    success: bool
    processed: bool
    scene_id: str
    formula: Optional[str] = None
    bands_retrieved: Optional[List[str]] = None
    spatial_resolution_m: Optional[float] = None
    crs: Optional[str] = None
    raster_dimensions: Optional[List[int]] = None
    raster_channels: Optional[int] = None
    geotiff_path: Optional[str] = None
    preview_url: Optional[str] = None
    real_asset_source: Optional[str] = None
    bytes_processed: Optional[int] = None
    mean_ndvi: Optional[float] = None
    median_ndvi: Optional[float] = None
    min_ndvi: Optional[float] = None
    max_ndvi: Optional[float] = None
    dense_canopy_fraction: Optional[float] = None
    degraded_ground_fraction: Optional[float] = None
    valid_pixel_count: Optional[int] = None
    mean_vegetation_index: Optional[float] = None
    canopy_coverage_pct: Optional[float] = None
    cloud_coverage_pct: Optional[float] = None
    provenance: Optional[str] = "ELEMENT84_REAL_MULTISPECTRAL_RASTER"
    requires_authentication: bool = False
    message: str

class EarthSearchMultispectralRequest(BaseModel):
    scene_id: str
    b04_url: Optional[str] = None
    b08_url: Optional[str] = None
    scl_url: Optional[str] = None
    window_coords: Optional[List[int]] = None

class EarthSearchMultispectralResponse(BaseModel):
    success: bool
    processed: bool
    scene_id: str
    formula: str = "NDVI = (B08 - B04) / (B08 + B04)"
    bands_retrieved: List[str]
    spatial_resolution_m: float = 10.0
    crs: str
    raster_dimensions: List[int]
    geotiff_path: Optional[str] = None
    preview_url: Optional[str] = None
    mean_ndvi: float
    median_ndvi: float
    min_ndvi: float
    max_ndvi: float
    dense_canopy_fraction: float
    degraded_ground_fraction: float
    valid_pixel_count: int
    cloud_coverage_pct: float
    provenance: str = "ELEMENT84_REAL_MULTISPECTRAL_RASTER"
    message: str

class EarthSearchCompareRequest(BaseModel):
    region_id: str
    pre_product_id: str
    post_product_id: str
    window_coords: Optional[List[int]] = None
    ndvi_drop_threshold: Optional[float] = 0.18
    min_baseline_ndvi: Optional[float] = 0.45
    min_cluster_pixels: Optional[int] = 5

class EarthSearchCompareResponse(BaseModel):
    success: bool
    loss_detected: bool
    region_id: str
    pre_product_id: str
    post_product_id: str
    pre_date: str
    post_date: str
    mean_ndvi_t0: float
    mean_ndvi_t1: float
    mean_ndvi_drop: float
    loss_area_hectares: float
    loss_pixel_count: int
    confidence_score: float
    clusters_count: int
    polygons: List[Dict[str, Any]] = []
    incident_id: Optional[str] = None
    pre_preview_url: Optional[str] = None
    post_preview_url: Optional[str] = None
    change_preview_url: Optional[str] = None
    methodology: str = "S2_L2A_MULTISPECTRAL_NDVI_DELTA"
    provenance: str = "ELEMENT84_REAL_MULTISPECTRAL"
    message: str

class ProcessingJobCreate(BaseModel):
    region_id: str
    pre_product_id: Optional[str] = None
    post_product_id: Optional[str] = None
    window_coords: Optional[List[int]] = None
    ndvi_drop_threshold: Optional[float] = 0.18
    min_baseline_ndvi: Optional[float] = 0.45
    min_cluster_pixels: Optional[int] = 5
    job_type: Optional[str] = "MULTISPECTRAL_CHANGE_DETECTION"

class ProcessingJobResponse(BaseModel):
    job_id: str
    region_id: str
    job_type: str
    status: str
    params: Optional[Dict[str, Any]] = None
    result: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    created_at: str
    completed_at: Optional[str] = None

class AoiDetectionRequest(BaseModel):
    region_id: str
    min_interval_days: Optional[int] = 5
    max_cloud_cover: Optional[float] = 30.0
    ndvi_drop_threshold: Optional[float] = 0.18
    min_baseline_ndvi: Optional[float] = 0.45
    min_cluster_pixels: Optional[int] = 5
    window_coords: Optional[List[int]] = None

class AoiDetectionResponse(BaseModel):
    success: bool
    status: str  # "COMPLETED" | "INSUFFICIENT_OBSERVATIONS" | "FAILED"
    region_id: str
    observations_found: int = 0
    pre_product_id: Optional[str] = None
    post_product_id: Optional[str] = None
    pre_date: Optional[str] = None
    post_date: Optional[str] = None
    interval_days: Optional[int] = None
    loss_detected: bool = False
    loss_area_hectares: float = 0.0
    confidence_score: float = 0.0
    clusters_count: int = 0
    incident_id: Optional[str] = None
    polygons: List[Dict[str, Any]] = []
    pre_preview_url: Optional[str] = None
    post_preview_url: Optional[str] = None
    change_preview_url: Optional[str] = None
    message: str

class AnalyticsResponse(BaseModel):
    total_monitored_hectares: float
    total_loss_hectares_30d: float
    total_carbon_emissions_tco2e: float
    active_critical_incidents: int
    active_warning_incidents: int
    canopy_integrity_mean_pct: float
    drivers_breakdown: List[Dict[str, Any]]
    predictive_risk_zones: List[Dict[str, Any]]
    biome_health_matrix: List[Dict[str, Any]]
    time_series_data: List[Dict[str, Any]]

class MonitoringRunResult(BaseModel):
    job_id: str
    started_at: str
    completed_at: Optional[str]
    status: str
    trigger_type: str
    regions_checked: int
    new_observations_found: int
    incidents_created: int
    copernicus_status: str
    details: Optional[Any] = None
    error_message: Optional[str] = None

class MonitoringStatusResponse(BaseModel):
    scheduler_running: bool
    interval_hours: int
    next_run_time: Optional[str]
    total_runs_completed: int
    recent_runs: List[MonitoringRunResult]

class AIAnalyzeRequest(BaseModel):
    incident_id: Optional[str] = None
    prompt: str
    query_type: Optional[str] = "Forensic Intelligence"
    custom_context: Optional[Dict[str, Any]] = None

class AIAnalyzeResponse(BaseModel):
    success: bool
    engine: str  # "gemini-2.5-flash" | "rule_based_forensic_heuristics"
    gemini_configured: bool
    text: str
    incident_id: Optional[str] = None
    timestamp: str

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    version: str
    database: str
    scheduler: str
    copernicus_integration: str
    gemini_integration: str
