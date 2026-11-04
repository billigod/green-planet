export type ViewMode = 
  | 'overview'
  | 'map'
  | 'incidents'
  | 'investigation'
  | 'satellites'
  | 'analytics'
  | 'assistant'
  | 'reports'
  | 'settings';

export type IncidentSeverity = 'critical' | 'warning' | 'nominal';

export type IncidentStatus = 
  | 'UNVERIFIED'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'active_investigation'
  | 'ground_dispatched'
  | 'verified_incursion'
  | 'permit_cleared'
  | 'closed';

export type ThreatType = 
  | 'Clear-cutting'
  | 'Illegal Logging Road'
  | 'Slash & Burn'
  | 'Mining Incursion'
  | 'Pasture Conversion';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface MonitoredAOI {
  id: string;
  name: string;
  country: string;
  biome: string;
  centerCoords: Coordinates;
  areaHectares: number;
  treeCoverLossHa: number;
  canopyIntegrityPct: number;
  riskLevel: 'CRITICAL' | 'ELEVATED' | 'NOMINAL';
  activeAlertsCount: number;
  primarySensor: string;
  lastPassTime: string;
  protectedZone: string;
  bounds: [number, number, number, number]; // [minLat, minLng, maxLat, maxLng]
}

export interface IncidentTimelineEvent {
  id: string;
  timestamp: string;
  event: string;
  actor: string;
  verified: boolean;
}

export interface IncidentNote {
  id: string;
  timestamp: string;
  author: string;
  text: string;
}

export interface Incident {
  id: string;
  title: string;
  aoiId: string;
  aoiName: string;
  coordinates: Coordinates;
  utmZone: string;
  timestamp: string;
  detectedBy: string;
  confidenceScore: number;
  severity: IncidentSeverity;
  status: IncidentStatus;
  lossAreaHectares: number;
  estimatedCanopyLossPct: number;
  biomassLossTonnes: number;
  carbonEmissionTCO2e: number;
  threatType: ThreatType;
  preImageUrl: string;
  postImageUrl: string;
  preDate: string;
  postDate: string;
  timeline: IncidentTimelineEvent[];
  notes: IncidentNote[];
  legalJurisdiction: string;
  baselineObservationId?: string;
  currentObservationId?: string;
  targetReticle: {
    gridRef: string;
    elevationM: number;
    cloudCoverPct: number;
    radarCoherenceDropPct: number;
    source_product_ids?: string[];
    methodology?: string;
    mean_ndvi_drop?: number;
    change_polygon?: any;
    pre_mean_ndvi?: number;
    post_mean_ndvi?: number;
    human_verification_status?: string;
    legal_disclaimer?: string;
  };
  groundPatrolUnit?: {
    id: string;
    unitName: string;
    etaHours: number;
    status: string;
  };
}

export interface SatelliteSource {
  id: string;
  name: string;
  constellation: string;
  agency: string;
  sensorType: 'optical' | 'sar' | 'thermal' | 'hyperspectral';
  resolutionM: number;
  revisitIntervalHrs: number;
  status: 'nominal' | 'active_pass' | 'calibrating';
  nextPass: string;
  spectralBands: string[];
  altitudeKm: number;
  inclinationDeg: number;
  dailyProcessedTiles: number;
  healthPct: number;
  mode: string;
  connection_status?: string;
  real_api_authenticated?: boolean;
  api_message?: string;
}

export interface EvidenceReport {
  id: string;
  incidentId: string;
  title: string;
  generatedAt: string;
  author: string;
  classification: 'RESTRICTED / LAW ENFORCEMENT' | 'OFFICIAL SENSITIVE' | 'PUBLIC DEMO';
  status: 'Draft' | 'Finalized' | 'Dispatched';
  summary: string;
  keyFindings: string[];
  legalViolations: string[];
  lossAreaHa: number;
  carbonLossTonnes: number;
  biomassLossTonnes: number;
  recipientDesk: string;
}

export interface MonitoringSettings {
  ndviDropThresholdPct: number;
  sarCoherenceThreshold: number;
  minLossAreaAlertHectares: number;
  telemetryIngestRateSec: number;
  cloudMaskingMaxPct: number;
  alertChannels: {
    rangerMeshRadio: boolean;
    interpolEcoDesk: boolean;
    smsBroadcast: boolean;
    webhookDispatch: boolean;
  };
  coordinateFormat: 'decimal' | 'dms' | 'mgrs';
  autoTaskPlanetScope: boolean;
  highContrastHUD: boolean;
  tacticalAudioAlerts: boolean;
}

// Runtime object fallbacks for ES module named imports in browsers
export const ViewMode = {} as any;
export const ThreatType = {} as any;
export const IncidentSeverity = {} as any;
export const IncidentStatus = {} as any;
export const Coordinates = {} as any;
export const MonitoredAOI = {} as any;
export const IncidentTimelineEvent = {} as any;
export const IncidentNote = {} as any;
export const Incident = {} as any;
export const SatelliteSource = {} as any;
export const BiomeHealthMetric = {} as any;
export const PredictiveRiskZone = {} as any;
export const EvidenceReport = {} as any;
export const MonitoringSettings = {} as any;
