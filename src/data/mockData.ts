import { MonitoredAOI, Incident, SatelliteSource, EvidenceReport, MonitoringSettings } from '../types';

export const MONITORED_AOIS: MonitoredAOI[] = [
  {
    id: 'aoi-ind-sundarbans',
    name: 'Sundarbans Mangrove Tiger Reserve',
    country: 'India (West Bengal)',
    biome: 'Mangrove Tidal Forest & Coastal Wetland',
    centerCoords: { lat: 21.9497, lng: 88.8996 },
    areaHectares: 426000,
    treeCoverLossHa: 142.3,
    canopyIntegrityPct: 96.4,
    riskLevel: 'ELEVATED',
    activeAlertsCount: 1,
    primarySensor: 'Sentinel-2 L2A / Sentinel-1 SAR',
    lastPassTime: '4 min ago (04:42 UTC)',
    protectedZone: 'UNESCO World Heritage & Tiger Reserve Core',
    bounds: [21.5, 88.4, 22.4, 89.4]
  },
  {
    id: 'aoi-ind-westernghats',
    name: 'Western Ghats - Silent Valley Rainforest',
    country: 'India (Kerala / Nilgiri)',
    biome: 'Tropical Wet Evergreen & Shola Montane Rainforest',
    centerCoords: { lat: 11.0833, lng: 76.4500 },
    areaHectares: 237500,
    treeCoverLossHa: 342.1,
    canopyIntegrityPct: 95.8,
    riskLevel: 'ELEVATED',
    activeAlertsCount: 1,
    primarySensor: 'Sentinel-2 L2A MSI',
    lastPassTime: '15 min ago (05:26 UTC)',
    protectedZone: 'Nilgiri Biosphere Core (UNESCO Global Hotspot)',
    bounds: [10.8, 76.2, 11.4, 76.8]
  },
  {
    id: 'aoi-ind-kaziranga',
    name: 'Kaziranga National Park & Corridor',
    country: 'India (Assam)',
    biome: 'Sub-Himalayan Alluvial Plain & Semi-Evergreen Forest',
    centerCoords: { lat: 26.5775, lng: 93.1711 },
    areaHectares: 118000,
    treeCoverLossHa: 210.8,
    canopyIntegrityPct: 93.2,
    riskLevel: 'CRITICAL',
    activeAlertsCount: 1,
    primarySensor: 'Sentinel-1 SAR / Sentinel-2 L2A',
    lastPassTime: '22 min ago (04:31 UTC)',
    protectedZone: 'UNESCO World Heritage & Tiger Reserve',
    bounds: [26.4, 93.0, 26.8, 93.4]
  },
  {
    id: 'aoi-ind-corbett',
    name: 'Jim Corbett Terai Tiger Reserve',
    country: 'India (Uttarakhand)',
    biome: 'Sub-Himalayan Sal & Moist Deciduous Forest',
    centerCoords: { lat: 29.5300, lng: 78.7747 },
    areaHectares: 128800,
    treeCoverLossHa: 95.4,
    canopyIntegrityPct: 94.6,
    riskLevel: 'ELEVATED',
    activeAlertsCount: 1,
    primarySensor: 'Sentinel-2 L2A',
    lastPassTime: '30 min ago (04:15 UTC)',
    protectedZone: 'Project Tiger Reserve #1',
    bounds: [29.3, 78.5, 29.8, 79.1]
  },
  {
    id: 'aoi-amazon-tapajos',
    name: 'Tapajós National Forest & Corridor',
    country: 'Brazil (Pará State)',
    biome: 'Amazonian Dense Ombrophilous Rainforest',
    centerCoords: { lat: -3.214, lng: -55.123 },
    areaHectares: 549310,
    treeCoverLossHa: 412.8,
    canopyIntegrityPct: 94.2,
    riskLevel: 'CRITICAL',
    activeAlertsCount: 4,
    primarySensor: 'Sentinel-1C SAR + Sentinel-2 L2A',
    lastPassTime: '12 min ago (03:36 UTC)',
    protectedZone: 'Federal Conservation Unit #BR-FLONA-044',
    bounds: [-3.8, -55.6, -2.6, -54.7]
  },
  {
    id: 'aoi-congo-salonga',
    name: 'Salonga North Biosphere Sector',
    country: 'Democratic Republic of Congo',
    biome: 'Congo Lowland Evergreen Rainforest',
    centerCoords: { lat: -1.025, lng: 20.892 },
    areaHectares: 3600000,
    treeCoverLossHa: 198.4,
    canopyIntegrityPct: 98.1,
    riskLevel: 'ELEVATED',
    activeAlertsCount: 2,
    primarySensor: 'Sentinel-2 L2A & Landsat 9',
    lastPassTime: '48 min ago (03:00 UTC)',
    protectedZone: 'UNESCO World Heritage Site / ICCN Ranger Sector',
    bounds: [-1.6, 20.2, -0.4, 21.6]
  },
  {
    id: 'aoi-borneo-danum',
    name: 'Danum Valley & Ulu Segama Buffer',
    country: 'Malaysia (Sabah, Borneo)',
    biome: 'Tropical Dipterocarp Rainforest',
    centerCoords: { lat: 4.981, lng: 117.804 },
    areaHectares: 43800,
    treeCoverLossHa: 68.2,
    canopyIntegrityPct: 96.8,
    riskLevel: 'NOMINAL',
    activeAlertsCount: 1,
    primarySensor: 'Sentinel-1C SAR & PlanetScope SuperDove',
    lastPassTime: '1h 14m ago (02:34 UTC)',
    protectedZone: 'Class I Protection Forest Reserve',
    bounds: [4.7, 117.5, 5.2, 118.1]
  },
  {
    id: 'aoi-chaco-salta',
    name: 'Gran Chaco Deforestation Front (Salta)',
    country: 'Argentina',
    biome: 'Semi-Arid Dry Chaco Forest & Woodland',
    centerCoords: { lat: -24.782, lng: -63.197 },
    areaHectares: 890000,
    treeCoverLossHa: 840.5,
    canopyIntegrityPct: 83.4,
    riskLevel: 'CRITICAL',
    activeAlertsCount: 5,
    primarySensor: 'Sentinel-2 MSI + Terra MODIS',
    lastPassTime: '2h 05m ago (01:43 UTC)',
    protectedZone: 'Native Forest Law Yellow/Red Zone Category I',
    bounds: [-25.3, -63.8, -24.2, -62.6]
  },
  {
    id: 'aoi-sumatra-leuser',
    name: 'Leuser Mega-Ecosystem Western Range',
    country: 'Indonesia (Aceh / North Sumatra)',
    biome: 'Tropical Montane & Peat Swamp Forest',
    centerCoords: { lat: 3.784, lng: 97.452 },
    areaHectares: 2600000,
    treeCoverLossHa: 132.0,
    canopyIntegrityPct: 95.3,
    riskLevel: 'ELEVATED',
    activeAlertsCount: 2,
    primarySensor: 'Sentinel-1C SAR (Cloud Piercing)',
    lastPassTime: '3h 18m ago (00:30 UTC)',
    protectedZone: 'Gunung Leuser National Park Biosphere Reserve',
    bounds: [3.2, 96.9, 4.3, 98.0]
  }
];

export const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'INC-2026-0842',
    title: 'Tapajós Sector 7 Riparian Clear-cut Incursion',
    aoiId: 'aoi-amazon-tapajos',
    aoiName: 'Tapajós National Forest & Corridor',
    coordinates: { lat: -3.2284, lng: -55.1389 },
    utmZone: '21S 706820E 9642930N',
    timestamp: '2026-11-02 21:18 UTC',
    detectedBy: 'Sentinel-1C SAR + Sentinel-2 L2A',
    confidenceScore: 98.4,
    severity: 'critical',
    status: 'ground_dispatched',
    lossAreaHectares: 42.6,
    estimatedCanopyLossPct: 89.2,
    biomassLossTonnes: 9840,
    carbonEmissionTCO2e: 18050,
    threatType: 'Clear-cutting',
    preImageUrl: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1200&q=80', // Dense intact lush canopy
    postImageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80', // Stripped clearing / deforestation scar
    preDate: '2026-09-14 (Sentinel-2 MSI)',
    postDate: '2026-11-02 (Sentinel-1C SAR + PlanetScope)',
    legalJurisdiction: 'IBAMA & Federal Environmental Police (Art. 44 & 50 Brazilian Federal Law 9.605/98)',
    targetReticle: {
      gridRef: 'WGS84 -03°13\'42.2" -055°08\'19.9"',
      elevationM: 114,
      cloudCoverPct: 8.5,
      radarCoherenceDropPct: 76.8
    },
    groundPatrolUnit: {
      id: 'PATROL-BRAVO-4',
      unitName: 'IBAMA Tactical Riverine Unit Bravo-4',
      etaHours: 3.5,
      status: 'En route via Tapajós river launch'
    },
    notes: [
      {
        id: 'n1',
        timestamp: '2026-11-02 21:24 UTC',
        author: 'Capt. E. Silva (Geospatial Intel)',
        text: 'Automated SAR C-band interferometry flagged acute decorrelation across 42ha. Optical PlanetScope pass confirms heavy machinery and tree felling.'
      },
      {
        id: 'n2',
        timestamp: '2026-11-02 22:05 UTC',
        author: 'Duty Officer M. Rossi',
        text: 'Cross-checked CAR (Rural Environmental Registry) database. Coordinate falls strictly within prohibited Indigenous perimeter. Zero authorized logging permits on file.'
      }
    ],
    timeline: [
      {
        id: 't1',
        timestamp: '2026-11-02 20:45 UTC',
        event: 'Sentinel-1C SAR orbit #1489 pass ingested. Polarimetric coherence drop detected.',
        actor: 'ESA Sentinel Ingest Pipeline',
        verified: true
      },
      {
        id: 't2',
        timestamp: '2026-11-02 21:18 UTC',
        event: 'AI Multi-Spectral Change Classifier flagged critical 42.6 Ha loss cluster (Confidence 98.4%).',
        actor: 'GREEN PLANET Automated Classifier',
        verified: true
      },
      {
        id: 't3',
        timestamp: '2026-11-02 21:30 UTC',
        event: 'Incident triage by Senior Geospatial Analyst. Severity escalated to CRITICAL.',
        actor: 'Intel Analyst Ramos',
        verified: true
      },
      {
        id: 't4',
        timestamp: '2026-11-02 22:15 UTC',
        event: 'Dispatch orders transmitted to IBAMA Tactical Riverine Unit Bravo-4.',
        actor: 'Regional Enforcement Command',
        verified: true
      }
    ]
  },
  {
    id: 'INC-2026-0841',
    title: 'Tapajós Logging Spur Extension Branch #3',
    aoiId: 'aoi-amazon-tapajos',
    aoiName: 'Tapajós National Forest & Corridor',
    coordinates: { lat: -3.3102, lng: -55.0814 },
    utmZone: '21S 713210E 9633890N',
    timestamp: '2026-11-02 18:42 UTC',
    detectedBy: 'PlanetScope SuperDove 3m',
    confidenceScore: 94.1,
    severity: 'warning',
    status: 'active_investigation',
    lossAreaHectares: 14.8,
    estimatedCanopyLossPct: 62.0,
    biomassLossTonnes: 3250,
    carbonEmissionTCO2e: 5960,
    threatType: 'Illegal Logging Road',
    preImageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
    postImageUrl: 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1200&q=80',
    preDate: '2026-10-12 (PlanetScope)',
    postDate: '2026-11-02 (PlanetScope SuperDove)',
    legalJurisdiction: 'Federal Public Ministry (MPF) Pará',
    targetReticle: {
      gridRef: 'WGS84 -03°18\'36.7" -055°04\'53.0"',
      elevationM: 98,
      cloudCoverPct: 4.2,
      radarCoherenceDropPct: 54.1
    },
    notes: [
      {
        id: 'n1',
        timestamp: '2026-11-02 19:10 UTC',
        author: 'Analyst K. Chen',
        text: 'Linear corridor extension observed moving west toward primary mahogany stands. Rate of penetration estimated at 180 meters per day.'
      }
    ],
    timeline: [
      {
        id: 't1',
        timestamp: '2026-11-02 18:42 UTC',
        event: 'Linear road feature detected penetrating 2.4 km into dense canopy reserve.',
        actor: 'Optical Vector Extractor',
        verified: true
      },
      {
        id: 't2',
        timestamp: '2026-11-02 19:05 UTC',
        event: 'Road trajectory calculated heading towards high-value Tabebuia serratifolia trees.',
        actor: 'Forensic Analytics Suite',
        verified: true
      }
    ]
  },
  {
    id: 'INC-2026-0839',
    title: 'Gran Chaco Industrial Clear-Cut Sector 12',
    aoiId: 'aoi-chaco-salta',
    aoiName: 'Gran Chaco Deforestation Front (Salta)',
    coordinates: { lat: -24.7541, lng: -63.1528 },
    utmZone: '20K 282100E 7260400N',
    timestamp: '2026-11-02 14:10 UTC',
    detectedBy: 'Sentinel-2 L2A & Landsat 9',
    confidenceScore: 99.1,
    severity: 'critical',
    status: 'verified_incursion',
    lossAreaHectares: 112.4,
    estimatedCanopyLossPct: 96.5,
    biomassLossTonnes: 15700,
    carbonEmissionTCO2e: 28900,
    threatType: 'Clear-cutting',
    preImageUrl: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80',
    postImageUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
    preDate: '2026-08-20 (Sentinel-2)',
    postDate: '2026-11-02 (Landsat 9 OLI-2)',
    legalJurisdiction: 'Provincial Environmental Secretariat & National Forest Law 26.331',
    targetReticle: {
      gridRef: 'WGS84 -24°45\'14.8" -063°09\'10.1"',
      elevationM: 260,
      cloudCoverPct: 0.0,
      radarCoherenceDropPct: 88.2
    },
    notes: [
      {
        id: 'n1',
        timestamp: '2026-11-02 15:00 UTC',
        author: 'Dr. G. Alvarez',
        text: 'Total bull-dozing observed using two crawler tractors and heavy chains (desmonte con cadenamiento). Direct infringement of Red Category zone.'
      }
    ],
    timeline: [
      {
        id: 't1',
        timestamp: '2026-11-02 14:10 UTC',
        event: 'Large polygon anomaly flagged (112.4 Ha). Bare soil reflectance spike in SWIR bands.',
        actor: 'Landsat 9 Processing Chain',
        verified: true
      },
      {
        id: 't2',
        timestamp: '2026-11-02 16:30 UTC',
        event: 'Dossier generated and submitted to Provincial Environmental Prosecutor.',
        actor: 'Legal Dispatch Module',
        verified: true
      }
    ]
  },
  {
    id: 'INC-2026-0836',
    title: 'Salonga Northern Peat Fringe Burn Hotspot',
    aoiId: 'aoi-congo-salonga',
    aoiName: 'Salonga North Biosphere Sector',
    coordinates: { lat: -0.9982, lng: 20.9145 },
    utmZone: '34M 490450E 9889600N',
    timestamp: '2026-11-02 11:32 UTC',
    detectedBy: 'VIIRS Thermal + Sentinel-1C SAR',
    confidenceScore: 91.8,
    severity: 'warning',
    status: 'active_investigation',
    lossAreaHectares: 26.1,
    estimatedCanopyLossPct: 58.4,
    biomassLossTonnes: 5400,
    carbonEmissionTCO2e: 12200,
    threatType: 'Slash & Burn',
    preImageUrl: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=1200&q=80',
    postImageUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=1200&q=80',
    preDate: '2026-09-28 (Sentinel-2)',
    postDate: '2026-11-02 (VIIRS + SAR)',
    legalJurisdiction: 'ICCN (Institut Congolais pour la Conservation de la Nature)',
    targetReticle: {
      gridRef: 'WGS84 -00°59\'53.5" +020°54\'52.2"',
      elevationM: 345,
      cloudCoverPct: 42.0,
      radarCoherenceDropPct: 61.5
    },
    notes: [
      {
        id: 'n1',
        timestamp: '2026-11-02 12:15 UTC',
        author: 'Officer T. Lumumba',
        text: 'Cloud cover 42% over Salonga; thermal signature pierced clouds via VIIRS 375m I-band. Peatland substrate ignition risk monitored.'
      }
    ],
    timeline: [
      {
        id: 't1',
        timestamp: '2026-11-02 11:32 UTC',
        event: 'VIIRS 375m thermal fire anomaly confirmed with FRP (Fire Radiative Power) 48.2 MW.',
        actor: 'VIIRS Active Fire System',
        verified: true
      }
    ]
  },
  {
    id: 'INC-2026-0834',
    title: 'Leuser Western Buffer Illegal Palm Encroachment',
    aoiId: 'aoi-sumatra-leuser',
    aoiName: 'Leuser Mega-Ecosystem Western Range',
    coordinates: { lat: 3.7912, lng: 97.4380 },
    utmZone: '47N 326500E 419200N',
    timestamp: '2026-11-01 23:45 UTC',
    detectedBy: 'Sentinel-1C SAR & PlanetScope',
    confidenceScore: 96.7,
    severity: 'critical',
    status: 'ground_dispatched',
    lossAreaHectares: 34.0,
    estimatedCanopyLossPct: 82.5,
    biomassLossTonnes: 7200,
    carbonEmissionTCO2e: 14500,
    threatType: 'Pasture Conversion',
    preImageUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80',
    postImageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80',
    preDate: '2026-08-30 (PlanetScope)',
    postDate: '2026-11-01 (Sentinel-1C SAR)',
    legalJurisdiction: 'Ministry of Environment and Forestry (KLHK) Indonesia',
    targetReticle: {
      gridRef: 'WGS84 +03°47\'28.3" +097°26\'16.8"',
      elevationM: 88,
      cloudCoverPct: 65.0,
      radarCoherenceDropPct: 79.4
    },
    groundPatrolUnit: {
      id: 'PATROL-LEUSER-RANGER-2',
      unitName: 'Aceh Forest Ranger Taskforce (SPORC)',
      etaHours: 5.0,
      status: 'Deploying all-terrain team from Subulussalam'
    },
    notes: [
      {
        id: 'n1',
        timestamp: '2026-11-02 01:20 UTC',
        author: 'Analyst D. Sari',
        text: 'Deforested area is terraced in grid formation indicative of oil palm nursery preparation. Inside Orangutan critical migration corridor.'
      }
    ],
    timeline: [
      {
        id: 't1',
        timestamp: '2026-11-01 23:45 UTC',
        event: 'SAR radar backscatter decline detected despite thick monsoon cloud ceiling.',
        actor: 'Sentinel-1C SAR Pipeline',
        verified: true
      },
      {
        id: 't2',
        timestamp: '2026-11-02 02:00 UTC',
        event: 'Ranger taskforce notified with target GPS boundaries.',
        actor: 'Operations Dispatcher',
        verified: true
      }
    ]
  },
  {
    id: 'INC-2026-0830',
    title: 'Danum Valley Gold Dredging Stream Excavation',
    aoiId: 'aoi-borneo-danum',
    aoiName: 'Danum Valley & Ulu Segama Buffer',
    coordinates: { lat: 4.9654, lng: 117.8192 },
    utmZone: '50N 590800E 548900N',
    timestamp: '2026-11-01 16:15 UTC',
    detectedBy: 'Sentinel-2 L2A Turbidity & NDVI',
    confidenceScore: 89.2,
    severity: 'warning',
    status: 'active_investigation',
    lossAreaHectares: 8.4,
    estimatedCanopyLossPct: 45.0,
    biomassLossTonnes: 1800,
    carbonEmissionTCO2e: 3200,
    threatType: 'Mining Incursion',
    preImageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    postImageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
    preDate: '2026-10-01 (Sentinel-2)',
    postDate: '2026-11-01 (Sentinel-2 L2A)',
    legalJurisdiction: 'Sabah Forestry Department & Environmental Protection Dept',
    targetReticle: {
      gridRef: 'WGS84 +04°57\'55.4" +117°49\'09.1"',
      elevationM: 195,
      cloudCoverPct: 18.0,
      radarCoherenceDropPct: 48.0
    },
    notes: [
      {
        id: 'n1',
        timestamp: '2026-11-01 17:00 UTC',
        author: 'Investigator J. Wong',
        text: 'River sediment plume downstream of Segama river detected alongside riparian forest clearings. Excavator track scars evident.'
      }
    ],
    timeline: [
      {
        id: 't1',
        timestamp: '2026-11-01 16:15 UTC',
        event: 'River turbidity index surged 340% coincident with 8.4 Ha riparian tree clearing.',
        actor: 'Hydrological Multi-Sensor Watch',
        verified: true
      }
    ]
  },
  {
    id: 'INC-2026-0828',
    title: 'Tapajós Authorized Sustainable Forestry Coupe #4',
    aoiId: 'aoi-amazon-tapajos',
    aoiName: 'Tapajós National Forest & Corridor',
    coordinates: { lat: -3.1890, lng: -55.1950 },
    utmZone: '21S 700600E 9647200N',
    timestamp: '2026-10-31 10:20 UTC',
    detectedBy: 'Sentinel-2 L2A',
    confidenceScore: 92.0,
    severity: 'nominal',
    status: 'permit_cleared',
    lossAreaHectares: 12.1,
    estimatedCanopyLossPct: 22.0,
    biomassLossTonnes: 1400,
    carbonEmissionTCO2e: 2600,
    threatType: 'Clear-cutting',
    preImageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80',
    postImageUrl: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80',
    preDate: '2026-09-01',
    postDate: '2026-10-31',
    legalJurisdiction: 'ICMBio / Approved Forest Management Plan (PMFS #089-2025)',
    targetReticle: {
      gridRef: 'WGS84 -03°11\'20.4" -055°11\'42.0"',
      elevationM: 130,
      cloudCoverPct: 5.0,
      radarCoherenceDropPct: 18.2
    },
    notes: [
      {
        id: 'n1',
        timestamp: '2026-10-31 11:45 UTC',
        author: 'Auditor M. Rossi',
        text: 'Selective reduced-impact logging verified against certified concession boundaries. Canopy extraction index within 5 trees/hectare quota.'
      }
    ],
    timeline: [
      {
        id: 't1',
        timestamp: '2026-10-31 10:20 UTC',
        event: 'Canopy thinning alert registered.',
        actor: 'Sentinel-2 Alert Module',
        verified: true
      },
      {
        id: 't2',
        timestamp: '2026-10-31 11:50 UTC',
        event: 'Matched with ICMBio concession permit database. Flagged as PERMIT CLEARED.',
        actor: 'Permit Verification System',
        verified: true
      }
    ]
  }
];

export const SATELLITE_SOURCES: SatelliteSource[] = [
  {
    id: 'sat-sentinel-1c',
    name: 'Sentinel-1C (C-SAR)',
    constellation: 'Copernicus Earth Observation',
    agency: 'European Space Agency (ESA)',
    sensorType: 'sar',
    resolutionM: 10,
    revisitIntervalHrs: 12,
    status: 'active_pass',
    nextPass: 'Overflying Tapajós in 22m',
    spectralBands: ['C-band SAR (5.405 GHz)', 'VV/VH Polarimetry', 'Interferometric Wide Swath'],
    altitudeKm: 693,
    inclinationDeg: 98.18,
    dailyProcessedTiles: 1420,
    healthPct: 99.8,
    mode: 'Interferometric Coherence Loss Detection'
  },
  {
    id: 'sat-sentinel-2b',
    name: 'Sentinel-2B (MSI)',
    constellation: 'Copernicus Multi-Spectral',
    agency: 'European Space Agency (ESA)',
    sensorType: 'optical',
    resolutionM: 10,
    revisitIntervalHrs: 5,
    status: 'nominal',
    nextPass: 'Next orbit pass: 04:12 UTC',
    spectralBands: ['B2 Blue (490nm)', 'B3 Green (560nm)', 'B4 Red (665nm)', 'B8 NIR (842nm)', 'B11 SWIR-1', 'B12 SWIR-2'],
    altitudeKm: 786,
    inclinationDeg: 98.62,
    dailyProcessedTiles: 3850,
    healthPct: 100.0,
    mode: 'Multi-Spectral NDVI & Canopy Chemistry'
  },
  {
    id: 'sat-landsat-9',
    name: 'Landsat 9 (OLI-2 & TIRS-2)',
    constellation: 'USGS / NASA Landsat Program',
    agency: 'USGS / NASA',
    sensorType: 'optical',
    resolutionM: 15,
    revisitIntervalHrs: 8,
    status: 'nominal',
    nextPass: 'Next orbit pass: 06:45 UTC',
    spectralBands: ['VNIR', 'SWIR', 'TIRS Thermal Infrared (100m)'],
    altitudeKm: 705,
    inclinationDeg: 98.2,
    dailyProcessedTiles: 1980,
    healthPct: 98.6,
    mode: 'Radiometric Calibration Baseline'
  },
  {
    id: 'sat-planetscope',
    name: 'PlanetScope SuperDove Flock 4B',
    constellation: 'Planet Commercial Constellation',
    agency: 'Planet Labs PBC',
    sensorType: 'optical',
    resolutionM: 3.0,
    revisitIntervalHrs: 24,
    status: 'nominal',
    nextPass: 'Continuous Sun-Synchronous Daily Pass',
    spectralBands: ['8-band Planet RGB', 'RedEdge', 'Coastal Blue', 'Yellow', 'NIR'],
    altitudeKm: 500,
    inclinationDeg: 97.5,
    dailyProcessedTiles: 12400,
    healthPct: 97.4,
    mode: 'High-Resolution Tactical Tasking'
  },
  {
    id: 'sat-modis-viirs',
    name: 'VIIRS / Terra-Aqua MODIS',
    constellation: 'Suomi NPP / JPSS',
    agency: 'NASA / NOAA',
    sensorType: 'thermal',
    resolutionM: 375,
    revisitIntervalHrs: 4,
    status: 'nominal',
    nextPass: 'Real-time 15m Telemetry Ingest',
    spectralBands: ['I4 Thermal (3.74µm)', 'I5 Thermal (11.45µm)', 'M13 (4.05µm)'],
    altitudeKm: 824,
    inclinationDeg: 98.7,
    dailyProcessedTiles: 8900,
    healthPct: 99.1,
    mode: 'Fire Radiative Power (FRP) & Thermal Incursions'
  },
  {
    id: 'sat-tandem-x',
    name: 'TanDEM-X / TerraSAR-X',
    constellation: 'German Aerospace Center Radar',
    agency: 'DLR',
    sensorType: 'sar',
    resolutionM: 1.0,
    revisitIntervalHrs: 48,
    status: 'calibrating',
    nextPass: 'Scheduled pass in 14h 22m',
    spectralBands: ['X-band Spotlight (9.65 GHz)', 'High Resolution InSAR'],
    altitudeKm: 514,
    inclinationDeg: 97.4,
    dailyProcessedTiles: 450,
    healthPct: 95.0,
    mode: 'Digital Elevation & Canopy Height Model (CHM)'
  }
];

export const INITIAL_REPORTS: EvidenceReport[] = [
  {
    id: 'REP-2026-0842-DOSSIER',
    incidentId: 'INC-2026-0842',
    title: 'Geospatial Forensic Intelligence Dossier: Tapajós Sector 7 Riparian Incursion',
    generatedAt: '2026-11-02 22:30 UTC',
    author: 'Capt. E. Silva / Sentinel AI Automated Triage',
    classification: 'RESTRICTED / LAW ENFORCEMENT',
    status: 'Dispatched',
    summary: 'High-confidence (98.4%) detected clear-cut polygon spanning 42.6 hectares inside Tapajós National Forest reserve. Pre-incursion imagery confirms mature dense tropical canopy with primary timber species. Multiple SAR coherence drop events indicate rapid mechanization between October 28 and November 2, 2026.',
    keyFindings: [
      'Unlawful removal of 42.6 ha of mature tropical rainforest without approved Environmental Impact Assessment (EIA/RIMA).',
      'Infringement into 100m Permanent Preservation Area (APP - Área de Preservação Permanente) bordering river tributaries.',
      'Calculated 9,840 tonnes of lost woody biomass resulting in ~18,050 tCO2e immediate gross emissions.',
      'Cross-correlation with CAR registry confirms zero authorized logging concessions or rural property claims on coordinates.'
    ],
    legalViolations: [
      'Federal Law 9.605/1998 (Environmental Crimes Law) Articles 38, 44, and 50.',
      'Brazilian Forest Code (Federal Law 12.651/2012) Riparian Buffer Protections.',
      'European Union Deforestation Regulation (EUDR) Article 3 non-compliance notice.'
    ],
    lossAreaHa: 42.6,
    carbonLossTonnes: 18050,
    biomassLossTonnes: 9840,
    recipientDesk: 'IBAMA Division of Environmental Inspection (DIPRO) & Federal Public Prosecutor (MPF)'
  },
  {
    id: 'REP-2026-0839-CHACO',
    incidentId: 'INC-2026-0839',
    title: 'Deforestation Enforcement Evidentiary Pack: Gran Chaco Sector 12 Bulldozing',
    generatedAt: '2026-11-02 16:45 UTC',
    author: 'Dr. G. Alvarez (Geospatial Enforcement Unit)',
    classification: 'RESTRICTED / LAW ENFORCEMENT',
    status: 'Finalized',
    summary: 'Rapid clear-cut and chaining event of 112.4 hectares inside strictly protected Red Category Native Forest zone in Salta Province. Dual Landsat 9 and Sentinel-2 multi-temporal spectral index demonstrates 100% loss of native Quebracho and Algarrobo dry forest species.',
    keyFindings: [
      'Violent deforestation carried out via heavy crawler tractor chain sweeping.',
      'Direct violation of National Forest Law 26.331 territorial zoning categorization.',
      'Loss of critical corridor connecting protected provincial nature reserves.'
    ],
    legalViolations: [
      'Argentine National Law 26.331 (Ley de Bosques Nativos) Section 16.',
      'Provincial Criminal Environmental Sanctions Code 7070.'
    ],
    lossAreaHa: 112.4,
    carbonLossTonnes: 28900,
    biomassLossTonnes: 15700,
    recipientDesk: 'Ministry of Environment and Sustainable Development Argentina'
  }
];

export const INITIAL_SETTINGS: MonitoringSettings = {
  ndviDropThresholdPct: 20,
  sarCoherenceThreshold: 0.35,
  minLossAreaAlertHectares: 1.0,
  telemetryIngestRateSec: 30,
  cloudMaskingMaxPct: 30,
  alertChannels: {
    rangerMeshRadio: true,
    interpolEcoDesk: true,
    smsBroadcast: false,
    webhookDispatch: true
  },
  coordinateFormat: 'decimal',
  autoTaskPlanetScope: true,
  highContrastHUD: false,
  tacticalAudioAlerts: true
};
