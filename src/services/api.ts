import { 
  MonitoredAOI, 
  Incident, 
  IncidentStatus, 
  SatelliteSource 
} from '../types';

export interface HealthData {
  status: string;
  timestamp: string;
  version: string;
  database: string;
  scheduler: string;
  copernicus_integration: string;
  gemini_integration: string;
}

export interface SatelliteStatusData {
  primary_provider?: string;
  earthsearch_status?: string;
  earthsearch_endpoint?: string;
  earthsearch_auth_required?: boolean;
  copernicus_configured: boolean;
  copernicus_status: string;
  client_id_set: boolean;
  token_url: string;
  catalog_url: string;
  authenticated: boolean;
  sensors: SatelliteSource[];
}

export interface CopernicusConnectionTestResult {
  status: 'AUTHENTICATED' | 'NOT_CONFIGURED' | 'AUTHENTICATION_FAILED' | 'SERVICE_UNAVAILABLE';
  success: boolean;
  message: string;
  configured: boolean;
  token_url: string;
  catalog_url: string;
  timestamp: string;
  expires_at?: string | null;
}

export interface EarthSearchStatusData {
  provider: string;
  status: string;
  title?: string;
  stac_version?: string;
  endpoint: string;
  authentication_required: boolean;
  collections_supported: string[];
  message: string;
}

export interface EarthSearchDownloadResult {
  success: boolean;
  status: string;
  bytes_downloaded: number;
  local_path?: string | null;
  content_type?: string | null;
  elapsed_seconds?: number | null;
  requires_authentication: boolean;
  message: string;
}

export interface EarthSearchProcessResult {
  success: boolean;
  processed: boolean;
  scene_id: string;
  raster_dimensions?: number[] | null;
  raster_channels?: number | null;
  real_asset_source?: string | null;
  bytes_processed?: number | null;
  mean_vegetation_index?: number | null;
  canopy_coverage_pct?: number | null;
  cloud_coverage_pct?: number | null;
  provenance?: string;
  requires_authentication?: boolean;
  message: string;
}

export interface EarthSearchMultispectralResult {
  success: boolean;
  processed: boolean;
  scene_id: string;
  formula: string;
  bands_retrieved: string[];
  spatial_resolution_m: number;
  crs: string;
  raster_dimensions: number[];
  geotiff_path?: string | null;
  preview_url?: string | null;
  mean_ndvi: number;
  median_ndvi: number;
  min_ndvi: number;
  max_ndvi: number;
  dense_canopy_fraction: number;
  degraded_ground_fraction: number;
  valid_pixel_count: number;
  cloud_coverage_pct: number;
  provenance: string;
  message: string;
}

export interface EarthSearchCompareResult {
  success: boolean;
  loss_detected: boolean;
  region_id: string;
  pre_product_id: string;
  post_product_id: string;
  pre_date: string;
  post_date: string;
  mean_ndvi_t0: number;
  mean_ndvi_t1: number;
  mean_ndvi_drop: number;
  loss_area_hectares: number;
  loss_pixel_count: number;
  confidence_score: number;
  clusters_count: number;
  polygons: Array<{
    type: string;
    geometry: {
      type: string;
      coordinates: any;
    };
    properties: {
      loss_area_ha: number;
      cluster_id: number;
      confidence: number;
      mean_drop: number;
    };
  }>;
  incident_id?: string | null;
  pre_preview_url?: string | null;
  post_preview_url?: string | null;
  change_preview_url?: string | null;
  methodology: string;
  provenance: string;
  message: string;
}

export interface ProcessingJobData {
  job_id: string;
  region_id: string;
  job_type: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  params?: Record<string, any>;
  result?: any;
  error_message?: string | null;
  created_at: string;
  completed_at?: string | null;
}

export interface AoiDetectionData {
  success: boolean;
  status: 'COMPLETED' | 'INSUFFICIENT_OBSERVATIONS' | 'FAILED';
  region_id: string;
  observations_found: number;
  pre_product_id?: string | null;
  post_product_id?: string | null;
  pre_date?: string | null;
  post_date?: string | null;
  interval_days?: number | null;
  loss_detected: boolean;
  loss_area_hectares: number;
  confidence_score: number;
  clusters_count: number;
  incident_id?: string | null;
  polygons: Array<{
    cluster_id: number;
    area_hectares: number;
    bbox: number[];
    geojson: any;
    feature?: any;
  }>;
  pre_preview_url?: string | null;
  post_preview_url?: string | null;
  change_preview_url?: string | null;
  message: string;
}

export interface SatelliteProductItem {
  id: string;
  name: string;
  collection: string;
  product_type: string;
  acquisition_date: string;
  content_date_end?: string | null;
  footprint?: any;
  cloud_cover_pct: number;
  quicklook_url?: string | null;
  download_url?: string | null;
  thumbnail_url?: string | null;
  visual_url?: string | null;
  red_band_url?: string | null;
  nir_band_url?: string | null;
  available_bands?: string[];
  assets?: Record<string, any>;
  content_length_bytes?: number | null;
  source_type: string;
  provider?: string;
}

export interface SatelliteSearchResult {
  provider?: string;
  status: string;
  total_found: number;
  products: SatelliteProductItem[];
  message?: string;
  filter_applied?: string;
}

export interface MonitoringStatusData {
  scheduler_running: boolean;
  interval_hours: number;
  next_run_time: string | null;
  total_runs_completed: number;
  recent_runs: Array<{
    job_id: string;
    started_at: string;
    completed_at: string | null;
    status: string;
    trigger_type: string;
    regions_checked: number;
    new_observations_found: number;
    incidents_created: number;
    copernicus_status: string;
    details?: any;
    error_message?: string | null;
  }>;
}

export interface AnalyticsData {
  total_monitored_hectares: number;
  total_loss_hectares_30d: number;
  total_carbon_emissions_tco2e: number;
  active_critical_incidents: number;
  active_warning_incidents: number;
  canopy_integrity_mean_pct: number;
  drivers_breakdown: Array<{
    name: string;
    pct: number;
    ha: number;
    color: string;
  }>;
  predictive_risk_zones: Array<{
    sector: string;
    vulnerabilityScore: number;
    threatLevel: string;
    projectedLoss30d: string;
    driver: string;
  }>;
  biome_health_matrix: Array<{
    id: string;
    name: string;
    country: string;
    canopy_integrity_pct: number;
    risk_level: string;
    tree_cover_loss_ha: number;
  }>;
  time_series_data: Array<{
    date: string;
    baseline: number;
    loss: number;
    incursionRate: number;
  }>;
}

export const api = {
  async getHealth(): Promise<HealthData> {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  async getRegions(): Promise<MonitoredAOI[]> {
    const res = await fetch('/api/regions');
    if (!res.ok) throw new Error('Failed to fetch regions');
    const data = await res.json();
    return data.map((r: any) => ({
      id: r.id,
      name: r.name,
      country: r.country,
      biome: r.biome,
      centerCoords: r.center_coords,
      areaHectares: r.area_hectares,
      treeCoverLossHa: r.tree_cover_loss_ha,
      canopyIntegrityPct: r.canopy_integrity_pct,
      riskLevel: r.risk_level,
      activeAlertsCount: r.active_alerts_count,
      primarySensor: r.primary_sensor,
      lastPassTime: r.last_pass_time,
      protectedZone: r.protected_zone,
      bounds: r.bounds
    }));
  },

  async getRegionObservations(regionId: string): Promise<any[]> {
    const res = await fetch(`/api/regions/${regionId}/observations`);
    if (!res.ok) throw new Error('Failed to fetch region observations');
    return res.json();
  },

  async createRegion(region: {
    name: string;
    country: string;
    biome: string;
    protected_zone: string;
    center_lat: number;
    center_lng: number;
    area_hectares: number;
    bounds: number[];
  }): Promise<MonitoredAOI> {
    const res = await fetch('/api/regions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(region)
    });
    if (!res.ok) throw new Error('Failed to create region');
    const r = await res.json();
    return {
      id: r.id,
      name: r.name,
      country: r.country,
      biome: r.biome,
      centerCoords: r.center_coords,
      areaHectares: r.area_hectares,
      treeCoverLossHa: r.tree_cover_loss_ha,
      canopyIntegrityPct: r.canopy_integrity_pct,
      riskLevel: r.risk_level,
      activeAlertsCount: r.active_alerts_count,
      primarySensor: r.primary_sensor,
      lastPassTime: r.last_pass_time,
      protectedZone: r.protected_zone,
      bounds: r.bounds
    };
  },

  async getIncidents(filters?: {
    region_id?: string;
    severity?: string;
    status?: string;
    threat_type?: string;
  }): Promise<Incident[]> {
    const params = new URLSearchParams();
    if (filters?.region_id && filters.region_id !== 'all') params.append('region_id', filters.region_id);
    if (filters?.severity && filters.severity !== 'all') params.append('severity', filters.severity);
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters?.threat_type && filters.threat_type !== 'all') params.append('threat_type', filters.threat_type);

    const res = await fetch(`/api/incidents?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch incidents');
    const data = await res.json();

    return data.map((i: any) => ({
      id: i.id,
      title: i.title,
      aoiId: i.region_id,
      aoiName: i.title.split(' ')[0] + ' Sector',
      coordinates: i.coordinates,
      utmZone: i.utm_zone,
      timestamp: i.timestamp,
      detectedBy: i.detected_by,
      confidenceScore: i.confidence_score,
      severity: i.severity,
      status: i.status,
      lossAreaHectares: i.loss_area_hectares,
      estimatedCanopyLossPct: i.estimated_canopy_loss_pct,
      biomassLossTonnes: i.biomass_loss_tonnes,
      carbonEmissionTCO2e: i.carbon_emission_tco2e,
      threatType: i.threat_type,
      preImageUrl: i.pre_image_url || 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1200&q=80',
      postImageUrl: i.post_image_url || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80',
      preDate: i.pre_date,
      postDate: i.post_date,
      timeline: i.timeline || [],
      notes: i.notes || [],
      legalJurisdiction: i.legal_jurisdiction,
      targetReticle: i.target_reticle || { gridRef: 'WGS84', elevationM: 114, cloudCoverPct: 5.0, radarCoherenceDropPct: 75.0 },
      groundPatrolUnit: i.ground_patrol_unit
    }));
  },

  async updateIncidentStatus(incidentId: string, status: IncidentStatus) {
    const res = await fetch(`/api/incidents/${incidentId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed to update incident status');
    return res.json();
  },

  async addIncidentNote(incidentId: string, text: string, author?: string) {
    const res = await fetch(`/api/incidents/${incidentId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, author: author || 'Duty Officer Console' })
    });
    if (!res.ok) throw new Error('Failed to add incident note');
    return res.json();
  },

  async getAnalytics(): Promise<AnalyticsData> {
    const res = await fetch('/api/analytics');
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  },

  async getSatelliteStatus(): Promise<SatelliteStatusData> {
    const res = await fetch('/api/satellite/status');
    if (!res.ok) throw new Error('Failed to fetch satellite status');
    const data = await res.json();
    if (data.sensors && Array.isArray(data.sensors)) {
      data.sensors = data.sensors.map((s: any) => ({
        ...s,
        spectralBands: s.spectralBands || s.spectral_bands || [],
        dailyProcessedTiles: s.dailyProcessedTiles ?? s.daily_processed_tiles ?? 0,
        healthPct: s.healthPct ?? s.health_pct ?? 100,
        revisitIntervalHrs: s.revisitIntervalHrs ?? s.revisit_interval_hrs ?? 24,
        resolutionM: s.resolutionM ?? s.resolution_m ?? 10,
        altitudeKm: s.altitudeKm ?? s.altitude_km ?? 786,
        inclinationDeg: s.inclinationDeg ?? s.inclination_deg ?? 98.6,
        nextPass: s.nextPass || s.next_pass || 'In Orbit',
        sensorType: s.sensorType || s.sensor_type || 'optical',
      }));
    }
    return data;
  },

  async getEarthSearchStatus(): Promise<EarthSearchStatusData> {
    const res = await fetch('/api/satellite/earthsearch/status');
    if (!res.ok) throw new Error('Failed to fetch Earth Search status');
    return res.json();
  },

  async downloadEarthSearchAsset(asset_url: string, max_bytes?: number): Promise<EarthSearchDownloadResult> {
    const res = await fetch('/api/satellite/earthsearch/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ asset_url, max_bytes })
    });
    if (!res.ok) throw new Error('Earth Search asset download failed');
    return res.json();
  },

  async processEarthSearchScene(params: {
    scene_id: string;
    thumbnail_url?: string;
    red_url?: string;
    nir_url?: string;
  }): Promise<EarthSearchProcessResult> {
    const res = await fetch('/api/satellite/earthsearch/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error('Earth Search scene processing failed');
    return res.json();
  },

  async processEarthSearchMultispectral(params: {
    scene_id: string;
    window_coords?: number[];
  }): Promise<EarthSearchMultispectralResult> {
    const res = await fetch('/api/satellite/earthsearch/multispectral', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Multispectral processing failed' }));
      throw new Error(err.detail || err.message || 'Multispectral processing failed');
    }
    return res.json();
  },

  async compareEarthSearchScenes(params: {
    region_id: string;
    pre_product_id: string;
    post_product_id: string;
    window_coords?: number[];
  }): Promise<EarthSearchCompareResult> {
    const res = await fetch('/api/satellite/earthsearch/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Multi-temporal comparison failed' }));
      throw new Error(err.detail || err.message || 'Multi-temporal comparison failed');
    }
    return res.json();
  },

  async testCopernicusConnection(): Promise<CopernicusConnectionTestResult> {
    const res = await fetch('/api/satellite/copernicus/test');
    if (!res.ok) throw new Error('Copernicus connection test failed');
    return res.json();
  },

  async searchSatelliteCatalog(params: {
    bounds: number[];
    provider?: 'ELEMENT84' | 'COPERNICUS';
    collection?: 'SENTINEL-2' | 'SENTINEL-1';
    start_date: string;
    end_date: string;
    max_cloud_cover?: number;
    limit?: number;
  }): Promise<SatelliteSearchResult> {
    const res = await fetch('/api/satellite/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: params.provider || 'ELEMENT84',
        ...params
      })
    });
    if (!res.ok) throw new Error('Satellite catalog search failed');
    return res.json();
  },

  async getLatestSatellitePasses(params: {
    lat: number;
    lng: number;
    sensor?: string;
    limit?: number;
  }): Promise<{
    success: boolean;
    lat: number;
    lng: number;
    sensor: string;
    total: number;
    passes: Array<{
      id: string;
      title: string;
      date: string;
      datetime?: string;
      timeClicked?: string;
      timeIST?: string;
      satellite?: string;
      resolution: string;
      cloudPct: number;
      type: string;
      url: string;
      band: string;
      isRealApi?: boolean;
      coordinates?: { lat: number; lng: number };
      bbox?: number[];
    }>;
  }> {
    const query = new URLSearchParams({
      lat: params.lat.toString(),
      lng: params.lng.toString(),
      sensor: params.sensor || 'sentinel-2',
      limit: (params.limit || 3).toString()
    });
    const res = await fetch(`/api/satellite/latest-passes?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch latest satellite passes');
    return res.json();
  },

  async createComposite(params: {
    passes?: any[];
    urls?: string[];
    mode?: 'cloud_free' | 'dehaze' | 'ndvi';
    lat?: number;
    lng?: number;
  }): Promise<{
    success: boolean;
    composite_url: string;
    algorithm: string;
    passes_fused: number;
    width: number;
    height: number;
    mode: string;
    cloud_reduction_pct: number;
    clarity_gain_pct: number;
    message?: string;
  }> {
    const res = await fetch('/api/satellite/composite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Composite generation failed' }));
      throw new Error(err.message || 'Composite generation failed');
    }
    return res.json();
  },

  async getMonitoringStatus(): Promise<MonitoringStatusData> {
    const res = await fetch('/api/monitoring/status');
    if (!res.ok) throw new Error('Failed to fetch monitoring status');
    return res.json();
  },

  async triggerMonitoringRun() {
    const res = await fetch('/api/monitoring/run', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to trigger monitoring run');
    return res.json();
  },

  async detectAoiChanges(params: {
    region_id: string;
    min_interval_days?: number;
    max_cloud_cover?: number;
    ndvi_drop_threshold?: number;
    min_baseline_ndvi?: number;
    min_cluster_pixels?: number;
    window_coords?: number[];
  }): Promise<AoiDetectionData> {
    const res = await fetch('/api/satellite/detect-aoi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'AOI change detection failed' }));
      throw new Error(err.message || 'AOI change detection failed');
    }
    return res.json();
  },

  async createProcessingJob(params: {
    region_id: string;
    pre_product_id?: string;
    post_product_id?: string;
    window_coords?: number[];
    ndvi_drop_threshold?: number;
    min_baseline_ndvi?: number;
    min_cluster_pixels?: number;
    job_type?: string;
  }): Promise<ProcessingJobData> {
    const res = await fetch('/api/satellite/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Job creation failed' }));
      throw new Error(err.detail || 'Job creation failed');
    }
    return res.json();
  },

  async getProcessingJob(jobId: string): Promise<ProcessingJobData> {
    const res = await fetch(`/api/satellite/jobs/${jobId}`);
    if (!res.ok) throw new Error(`Failed to fetch job ${jobId}`);
    return res.json();
  },

  async getObservation(obsId: string): Promise<any> {
    const res = await fetch(`/api/satellite/observations/${obsId}`);
    if (!res.ok) throw new Error(`Failed to fetch observation ${obsId}`);
    return res.json();
  },

  async analyzeWithAI(prompt: string, incidentId?: string, customContext?: any) {
    const res = await fetch('/api/ai/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        incident_id: incidentId,
        custom_context: customContext
      })
    });
    if (!res.ok) throw new Error('Failed to analyze with AI');
    return res.json();
  }
};
