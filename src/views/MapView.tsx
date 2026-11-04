import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import L from 'leaflet';
import { 
  Trees, 
  MapPin, 
  Flame, 
  AlertTriangle, 
  Layers, 
  Sliders, 
  Crosshair, 
  ZoomIn, 
  ZoomOut, 
  Satellite, 
  Calendar, 
  Maximize2, 
  X, 
  ChevronRight, 
  CheckCircle2, 
  Compass, 
  Eye,
  Globe,
  Loader2,
  ExternalLink,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { Incident, MonitoredAOI } from '../types';
import { api } from '../services/api';
import { SatelliteImageSurferModal, SatellitePassData } from '../components/SatelliteImageSurferModal';

const leaflet = (L as any)?.default || L;

interface MapViewProps {
  aoi: MonitoredAOI;
  allAois: MonitoredAOI[];
  onSelectAoi: (aoi: MonitoredAOI) => void;
  incidents: Incident[];
  onSelectIncident: (incident: Incident) => void;
}

type BasemapType = 'googleHybrid' | 'esriSatellite' | 'darkTactical';

export type SatellitePassItem = SatellitePassData;

export const MapView: React.FC<MapViewProps> = ({
  aoi,
  allAois,
  onSelectAoi,
  incidents,
  onSelectIncident
}) => {
  // Basemap selection (Google Satellite Hybrid, Esri Aerial High-Res, Dark Tactical)
  const [basemap, setBasemap] = useState<BasemapType>('googleHybrid');

  // Layer toggles
  const [layers, setLayers] = useState({
    protectedBoundaries: true,
    deforestationPolygons: true,
    incidentMarkers: true,
    labels: true
  });

  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number }>({
    lat: aoi.centerCoords.lat,
    lng: aoi.centerCoords.lng
  });

  const [pinMode, setPinMode] = useState<boolean>(false);
  const pinModeRef = useRef<boolean>(pinMode);
  useEffect(() => {
    pinModeRef.current = pinMode;
  }, [pinMode]);
  const [activePin, setActivePin] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [activePopupIncident, setActivePopupIncident] = useState<Incident | null>(null);
  const [layerMenuOpen, setLayerMenuOpen] = useState<boolean>(false);
  const [forestListOpen, setForestListOpen] = useState<boolean>(true);
  const [previewPass, setPreviewPass] = useState<SatellitePassData | null>(null);
  const [modalInitialMode, setModalInitialMode] = useState<'single' | 'composite'>('single');

  // Selected sensor for STAC API satellite feed
  const [selectedSensor, setSelectedSensor] = useState<'sentinel-2' | 'sentinel-1' | 'landsat-9' | 'planetscope'>('sentinel-2');
  const [satellitePasses, setSatellitePasses] = useState<SatellitePassItem[]>([]);
  const [loadingPasses, setLoadingPasses] = useState<boolean>(false);

  // Leaflet Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const vectorLayerGroupRef = useRef<any>(null);
  const userPinLayerRef = useRef<any>(null);

  // Filter Indian forest reserves prominently
  const indianForests = useMemo(() => {
    return allAois.filter(a => 
      a.country.toLowerCase().includes('india') || 
      a.name.toLowerCase().includes('sundarbans') ||
      a.name.toLowerCase().includes('western ghats') ||
      a.name.toLowerCase().includes('kaziranga') ||
      a.name.toLowerCase().includes('corbett')
    );
  }, [allAois]);

  // If currently selected AOI is not Indian and Indian forests exist, default to first Indian forest
  const activeForest = useMemo(() => {
    if (aoi && (aoi.country.toLowerCase().includes('india') || indianForests.length === 0)) {
      return aoi;
    }
    return indianForests[0] || aoi;
  }, [aoi, indianForests]);

  // Incidents across Indian forest reserves
  const forestIncidents = useMemo(() => {
    const indianForestIds = new Set(indianForests.map(f => f.id));
    return incidents.filter(i => 
      indianForestIds.has(i.aoiId) || 
      indianForestIds.has((i as any).region_id) ||
      i.aoiId === activeForest.id ||
      (i.coordinates && activeForest.bounds && 
       i.coordinates.lat >= Math.min(activeForest.bounds[0], activeForest.bounds[2]) - 1.0 &&
       i.coordinates.lat <= Math.max(activeForest.bounds[0], activeForest.bounds[2]) + 1.0 &&
       i.coordinates.lng >= Math.min(activeForest.bounds[1], activeForest.bounds[3]) - 1.0 &&
       i.coordinates.lng <= Math.max(activeForest.bounds[1], activeForest.bounds[3]) + 1.0)
    );
  }, [incidents, activeForest, indianForests]);

  // 1. Initialize and maintain Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!leafletMapRef.current) {
      const map = leaflet.map(mapContainerRef.current, {
        center: [activeForest.centerCoords.lat, activeForest.centerCoords.lng],
        zoom: 11,
        minZoom: 4,
        maxZoom: 20,
        zoomControl: false,
        attributionControl: false
      });

      map.on('mousemove', (e: any) => {
        if (e && e.latlng) {
          setCursorCoords({
            lat: Number(e.latlng.lat.toFixed(5)),
            lng: Number(e.latlng.lng.toFixed(5))
          });
        }
      });

      // Pin Mode & Direct Click Handler
      map.on('click', (e: any) => {
        if (e && e.latlng && pinModeRef.current) {
          const lat = Number(e.latlng.lat.toFixed(5));
          const lng = Number(e.latlng.lng.toFixed(5));
          setActivePin({
            lat,
            lng,
            label: `Pinned Coordinate (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`
          });
          setPinMode(false);
        }
      });

      // Right-click anywhere on the map instantly drops a pin
      map.on('contextmenu', (e: any) => {
        if (e && e.latlng) {
          const lat = Number(e.latlng.lat.toFixed(5));
          const lng = Number(e.latlng.lng.toFixed(5));
          setActivePin({
            lat,
            lng,
            label: `Pinned Coordinate (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`
          });
          setPinMode(false);
        }
      });

      vectorLayerGroupRef.current = leaflet.layerGroup().addTo(map);
      userPinLayerRef.current = leaflet.layerGroup().addTo(map);
      leafletMapRef.current = map;

      setTimeout(() => {
        try {
          map.invalidateSize();
        } catch (_e) {}
      }, 150);
    }

    const map = leafletMapRef.current;

    // Update Basemap Tiles (High-Resolution Original Satellite Imagery)
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    let tileUrl = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
    let maxZoom = 20;

    if (basemap === 'esriSatellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      maxZoom = 20;
    } else if (basemap === 'darkTactical') {
      tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      maxZoom = 19;
    }

    tileLayerRef.current = leaflet.tileLayer(tileUrl, { 
      maxZoom, 
      maxNativeZoom: basemap === 'esriSatellite' ? 19 : 20,
      subdomains: 'abcd' 
    }).addTo(map);

    // Smoothly fly camera to active Indian Forest boundary
    if (activeForest.bounds && activeForest.bounds.length === 4) {
      map.flyToBounds(
        [
          [activeForest.bounds[0], activeForest.bounds[1]],
          [activeForest.bounds[2], activeForest.bounds[3]]
        ],
        { duration: 1.2, padding: [60, 60], maxZoom: 14 }
      );
    } else {
      map.flyTo([activeForest.centerCoords.lat, activeForest.centerCoords.lng], 11, { duration: 1.2 });
    }

    // Render Overlays: Forest Boundary, Incidents & Change Masks
    if (vectorLayerGroupRef.current) {
      vectorLayerGroupRef.current.clearLayers();

      // 1. Forest Reserve Boundaries (Glowing Emerald Line & Fill for all Indian Forests)
      if (layers.protectedBoundaries) {
        indianForests.forEach((f) => {
          if (!f.bounds || f.bounds.length !== 4) return;
          const isActive = f.id === activeForest.id;
          const boundsRect = leaflet.rectangle(
            [
              [f.bounds[0], f.bounds[1]],
              [f.bounds[2], f.bounds[3]]
            ],
            {
              color: '#10B981',
              weight: isActive ? 3 : 1.5,
              dashArray: isActive ? '8, 6' : '5, 5',
              fillColor: '#10B981',
              fillOpacity: isActive ? 0.14 : 0.04
            }
          );

          boundsRect.bindTooltip(
            `<div style="font-family:monospace; font-size:11px; font-weight:bold; color:#10B981; background:#080E0B; padding:4px 8px; border:1px solid #10B981; border-radius:3px;">
              🇮🇳 ${f.name.toUpperCase()} ${isActive ? '(ACTIVE SECTOR)' : '(CLICK TO ZOOM)'}
            </div>`, 
            { permanent: false, sticky: true }
          );

          boundsRect.on('click', () => {
            onSelectAoi(f);
          });

          vectorLayerGroupRef.current.addLayer(boundsRect);
        });
      }

      // 2. Active Forest Center Badge
      const centerIcon = leaflet.divIcon({
        className: 'custom-forest-center',
        html: `
          <div style="position:relative; width:40px; height:40px; display:flex; align-items:center; justify-content:center;">
            <div style="position:absolute; inset:0; border:2px dashed #10B981; border-radius:50%; animation:spin 16s linear infinite;"></div>
            <div style="width:14px; height:14px; background:#10B981; border-radius:50%; box-shadow:0 0 16px #10B981;"></div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });
      const centerMarker = leaflet.marker([activeForest.centerCoords.lat, activeForest.centerCoords.lng], { icon: centerIcon });
      centerMarker.bindPopup(`
        <div style="font-family:monospace; font-size:12px; color:#fff; background:#0D1612; padding:10px; border:1px solid #10B981; border-radius:4px; min-width:220px;">
          <div style="display:flex; align-items:center; gap:6px; color:#10B981; font-weight:bold; font-size:13px; margin-bottom:4px;">
            <span>🇮🇳</span>
            <span>${activeForest.name}</span>
          </div>
          <div style="color:#dbe5de; font-size:11px; margin-bottom:4px;">${activeForest.protectedZone}</div>
          <div style="color:#94a3b8; font-size:10px;">Country: <b style="color:#fff;">${activeForest.country}</b></div>
          <div style="color:#94a3b8; font-size:10px;">Canopy Integrity: <b style="color:#10B981;">${activeForest.canopyIntegrityPct}%</b></div>
          <div style="color:#94a3b8; font-size:10px;">Area: <b style="color:#fff;">${(activeForest.areaHectares / 1000).toLocaleString()}k Ha</b></div>
        </div>
      `);
      vectorLayerGroupRef.current.addLayer(centerMarker);

      // 3. Incidents: Heat (Red) and Deforestation (Orange)
      forestIncidents.forEach((inc) => {
        const isHeat = inc.threatType?.toLowerCase().includes('fire') || 
                       inc.threatType?.toLowerCase().includes('thermal') ||
                       inc.severity === 'critical';

        const color = isHeat ? '#EF4444' : '#F97316';
        const labelText = isHeat ? 'HEAT / THERMAL ANOMALY' : 'DEFORESTATION DISTURBANCE';

        // Deforestation Polygon
        if (layers.deforestationPolygons) {
          const poly = inc.targetReticle?.change_polygon;
          if (poly && poly.coordinates && poly.coordinates[0]) {
            const latLngCoords = poly.coordinates[0].map(([lng, lat]: [number, number]) => [lat, lng]);
            const lossPoly = leaflet.polygon(latLngCoords, {
              color,
              weight: 2,
              dashArray: '5, 5',
              fillColor: color,
              fillOpacity: 0.35
            });
            lossPoly.bindTooltip(`CANOPY LOSS: ${inc.lossAreaHectares} Ha (${inc.threatType})`, { permanent: false });
            vectorLayerGroupRef.current.addLayer(lossPoly);
          }
        }

        // Incident Pin (Red or Orange)
        if (layers.incidentMarkers && inc.coordinates) {
          const incIcon = leaflet.divIcon({
            className: 'custom-inc-dot',
            html: `
              <div style="position:relative; width:30px; height:30px; display:flex; align-items:center; justify-content:center; cursor:pointer;">
                <div style="position:absolute; inset:-4px; border-radius:50%; background:${color}44; animation:ping 1.6s cubic-bezier(0,0,0.2,1) infinite;"></div>
                <div style="width:16px; height:16px; background:#080E0B; border:2.5px solid ${color}; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 0 12px ${color};">
                  <div style="width:6px; height:6px; background:${color}; border-radius:50%;"></div>
                </div>
              </div>
            `,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          });

          const incMarker = leaflet.marker([inc.coordinates.lat, inc.coordinates.lng], { icon: incIcon });
          incMarker.on('click', () => {
            setActivePopupIncident(inc);
          });
          incMarker.bindTooltip(`<b>${labelText}</b><br/>Area: ${inc.lossAreaHectares} Ha • Confidence: ${inc.confidenceScore}%`, { permanent: false });
          vectorLayerGroupRef.current.addLayer(incMarker);
        }
      });
    }
  }, [activeForest, basemap, layers, forestIncidents]);

  // 2. User Pin Overlay Layer
  useEffect(() => {
    if (!userPinLayerRef.current) return;
    userPinLayerRef.current.clearLayers();

    if (activePin) {
      const pinIcon = leaflet.divIcon({
        className: 'custom-user-pin',
        html: `
          <div style="position:relative; width:44px; height:44px; display:flex; align-items:center; justify-content:center; cursor:pointer;">
            <div style="position:absolute; inset:0; border-radius:50%; border:2px solid #06B6D4; opacity:0.8; animation:ping 1.6s cubic-bezier(0,0,0.2,1) infinite;"></div>
            <div style="position:absolute; inset:6px; border-radius:50%; background:#06B6D425; border:1px dashed #06B6D4;"></div>
            <div style="width:20px; height:20px; background:#08100D; border:2.5px solid #06B6D4; transform:rotate(45deg); border-radius:3px; display:flex; align-items:center; justify-content:center; box-shadow:0 0 16px #06B6D4;">
              <div style="width:6px; height:6px; background:#06B6D4; border-radius:50%;"></div>
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      const pinMarker = leaflet.marker([activePin.lat, activePin.lng], { icon: pinIcon });
      pinMarker.bindPopup(`
        <div style="font-family:monospace; font-size:12px; color:#fff; background:#08100D; padding:10px; border:1px solid #06B6D4; border-radius:4px; min-width:240px; box-shadow:0 4px 20px rgba(0,0,0,0.8);">
          <div style="display:flex; align-items:center; gap:6px; color:#06B6D4; font-weight:bold; font-size:13px; margin-bottom:6px;">
            <span>📍</span>
            <span>TARGET PINNED LOCATION</span>
          </div>
          <div style="color:#dbe5de; font-size:11px; margin-bottom:2px;">Latitude: <b style="color:#fff;">${activePin.lat.toFixed(5)}°</b></div>
          <div style="color:#dbe5de; font-size:11px; margin-bottom:6px;">Longitude: <b style="color:#fff;">${activePin.lng.toFixed(5)}°</b></div>
          <div style="color:#10B981; font-size:10px; padding-top:6px; border-top:1px solid #ffffff15;">
            🛰️ Live satellite passes loaded below ↓
          </div>
        </div>
      `).openPopup();
      userPinLayerRef.current.addLayer(pinMarker);

      if (leafletMapRef.current) {
        leafletMapRef.current.panTo([activePin.lat, activePin.lng], { animate: true, duration: 0.8 });
      }
    }
  }, [activePin]);

  // 3. Query Real Satellite Imagery Passes from STAC API for this Indian Forest / Pinned Place
  useEffect(() => {
    let isMounted = true;
    const targetCoords = activePin 
      ? { lat: activePin.lat, lng: activePin.lng } 
      : activeForest.centerCoords;

    setLoadingPasses(true);

    api.getLatestSatellitePasses({
      lat: targetCoords.lat,
      lng: targetCoords.lng,
      sensor: selectedSensor,
      limit: 3
    })
      .then(res => {
        if (isMounted && res && res.passes && res.passes.length > 0) {
          setSatellitePasses(res.passes);
        }
      })
      .catch(err => {
        console.warn('Real satellite pass lookup fallback:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingPasses(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activePin, activeForest, selectedSensor]);

  return (
    <div className="relative flex flex-col h-[calc(100vh-140px)] min-h-[640px] bg-[#040806] border border-white/10 rounded-sm overflow-hidden select-none font-mono text-white">
      {/* Top Header Bar: Indian Forest Identity, Basemap Switcher, GPS Reticle & Controls */}
      <div className="absolute top-3 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        
        {/* Left: Indian Forest Title & Quick Selector */}
        <div className="pointer-events-auto flex items-center space-x-2 bg-[#0D1612]/96 backdrop-blur-md border border-[#10B981]/50 p-2 rounded-sm shadow-2xl">
          <Trees className="w-5 h-5 text-[#10B981]" />
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-bold text-white tracking-wide">{activeForest.name}</span>
              <span className="text-[10px] bg-[#10B981]/20 text-[#10B981] font-bold px-2 py-0.5 rounded-sm flex items-center space-x-1">
                <span>🇮🇳</span>
                <span>ORIGINAL SATELLITE MAP</span>
              </span>
            </div>
            <div className="text-[10px] text-white/60">
              {activeForest.protectedZone} • <strong>{activeForest.country}</strong> • Canopy Integrity: <b className="text-[#10B981]">{activeForest.canopyIntegrityPct}%</b>
            </div>
          </div>
        </div>

        {/* Center: Original Satellite Basemap Switcher */}
        <div className="pointer-events-auto flex items-center space-x-1 bg-[#0D1612]/96 backdrop-blur-md border border-white/10 p-1.5 rounded-sm text-xs shadow-2xl">
          <span className="text-white/40 px-1 text-[10px] hidden md:inline">ORIGINAL SATELLITE:</span>
          <button
            onClick={() => setBasemap('googleHybrid')}
            className={`px-3 py-1 rounded-sm transition-all font-bold ${
              basemap === 'googleHybrid'
                ? 'bg-[#10B981] text-[#080E0B] shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            GOOGLE SATELLITE
          </button>
          <button
            onClick={() => setBasemap('esriSatellite')}
            className={`px-3 py-1 rounded-sm transition-all font-bold ${
              basemap === 'esriSatellite'
                ? 'bg-[#10B981] text-[#080E0B] shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            ESRI AERIAL (SUB-METER)
          </button>
          <button
            onClick={() => setBasemap('darkTactical')}
            className={`px-3 py-1 rounded-sm transition-all font-bold ${
              basemap === 'darkTactical'
                ? 'bg-[#06B6D4] text-[#080E0B] shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            TACTICAL DARK
          </button>
        </div>

        {/* Right: GPS Reticle, Pin Tool, Zoom Buttons & Layers */}
        <div className="pointer-events-auto flex items-center space-x-2 bg-[#0D1612]/96 backdrop-blur-md border border-white/10 p-1.5 rounded-sm text-xs shadow-2xl">
          {/* Drop Pin / Pinned Location Controls */}
          {activePin ? (
            <div className="flex items-center space-x-1.5 bg-[#06B6D4]/15 border border-[#06B6D4]/60 px-2 py-0.5 rounded-sm text-xs">
              <span className="w-2 h-2 rounded-full bg-[#06B6D4] animate-ping"></span>
              <span className="font-bold text-[#06B6D4]">
                📍 {activePin.lat.toFixed(3)}°, {activePin.lng.toFixed(3)}°
              </span>
              <button
                onClick={() => setPinMode(true)}
                className="hover:underline text-[10px] text-white/80 hover:text-white px-1 font-bold"
                title="Click to reposition pin on map"
              >
                [Reposition]
              </button>
              <button
                onClick={() => setActivePin(null)}
                className="hover:bg-white/10 p-0.5 rounded-sm text-white/60 hover:text-[#EF4444] transition-colors"
                title="Clear Pin"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setPinMode(!pinMode)}
              className={`px-2.5 py-1 rounded-sm text-xs font-bold transition-all flex items-center space-x-1.5 ${
                pinMode
                  ? 'bg-[#06B6D4] text-[#080E0B] animate-pulse shadow-[0_0_12px_#06B6D4]'
                  : 'bg-transparent text-[#06B6D4] hover:bg-[#06B6D4]/10'
              }`}
              title="Click to drop a pin anywhere on the map (or right-click anytime)"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{pinMode ? 'CLICK MAP TO PIN...' : '📌 PIN ANY PLACE'}</span>
            </button>
          )}

          {/* GPS Coordinates */}
          <div className="flex items-center space-x-1 bg-[#080E0B] px-2 py-0.5 rounded-sm border border-white/5 text-white/90 text-[11px]">
            <Crosshair className="w-3.5 h-3.5 text-[#10B981] animate-spin" style={{ animationDuration: '18s' }} />
            <span>{cursorCoords.lat.toFixed(4)}°, {cursorCoords.lng.toFixed(4)}°</span>
          </div>

          {/* Zoom In / Out Buttons */}
          <div className="flex items-center space-x-0.5 border-l border-white/10 pl-1.5">
            <button
              onClick={() => leafletMapRef.current?.zoomIn()}
              className="p-1 hover:bg-white/10 text-white/80 hover:text-white rounded-sm"
              title="Zoom in closer to forest canopy (zoomable till tree level)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => leafletMapRef.current?.zoomOut()}
              className="p-1 hover:bg-white/10 text-white/80 hover:text-white rounded-sm"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLayerMenuOpen(!layerMenuOpen)}
              className={`p-1 rounded-sm transition-colors ${
                layerMenuOpen ? 'bg-[#10B981] text-[#080E0B]' : 'hover:bg-white/10 text-white/70 hover:text-white'
              }`}
              title="Filter Layers"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Indian Forests Quick Switcher Bar (Left Floating Strip with Close/Open toggle) */}
      <div className="absolute top-20 left-3 z-30 pointer-events-none max-w-xs">
        {forestListOpen ? (
          <div className="pointer-events-auto bg-[#0D1612]/96 backdrop-blur-md border border-[#10B981]/40 p-2.5 rounded-sm shadow-2xl">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/10 mb-2">
              <span className="text-[10px] font-bold text-[#10B981] tracking-wider flex items-center space-x-1.5">
                <span>🇮🇳</span>
                <span>SELECT INDIAN FOREST</span>
              </span>
              <div className="flex items-center space-x-1.5">
                <span className="text-[9px] text-white/40">{indianForests.length} RESERVES</span>
                <button
                  onClick={() => setForestListOpen(false)}
                  className="p-1 hover:bg-white/10 text-white/50 hover:text-white rounded-sm transition-colors"
                  title="Close list"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              {indianForests.map((f) => {
                const isSelected = f.id === activeForest.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => onSelectAoi(f)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-sm border transition-all flex items-center justify-between text-xs ${
                      isSelected
                        ? 'bg-[#10B981] text-[#080E0B] border-[#10B981] font-bold shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                        : 'bg-[#080E0B]/80 text-white/80 border-white/10 hover:border-[#10B981]/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 truncate">
                      <Trees className="w-3.5 h-3.5 flex-shrink-0 text-current" />
                      <span className="truncate">{f.name}</span>
                    </div>
                    <span className="text-[9px] opacity-70 ml-1 whitespace-nowrap">
                      {f.country.split('(')[1]?.replace(')', '') || 'India'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Legend Badge */}
            <div className="mt-3 pt-2 border-t border-white/10 text-[10px] space-y-1 text-white/70">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] shadow-[0_0_6px_#EF4444] animate-pulse"></span>
                <span>🔴 <strong>Red Dot:</strong> Heat / Fire Hotspot</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F97316] shadow-[0_0_6px_#F97316]"></span>
                <span>🟠 <strong>Orange Dot:</strong> Deforestation Loss</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3.5 h-1 bg-[#10B981] inline-block"></span>
                <span className="text-[#10B981]">🟢 <strong>Green Line:</strong> Reserve Boundary</span>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setForestListOpen(true)}
            className="pointer-events-auto bg-[#0D1612]/96 backdrop-blur-md border border-[#10B981]/60 hover:border-[#10B981] px-3 py-1.5 rounded-sm shadow-2xl text-xs font-bold text-[#10B981] flex items-center space-x-2 transition-all hover:shadow-[0_0_12px_rgba(16,185,129,0.3)]"
            title="Open Indian forests list"
          >
            <span>🇮🇳</span>
            <span>INDIAN FORESTS ({indianForests.length})</span>
            <ChevronRight className="w-3.5 h-3.5 text-white/60" />
          </button>
        )}
      </div>

      {/* Layer Settings Flyout */}
      {layerMenuOpen && (
        <div className="absolute top-16 right-3 z-40 w-64 bg-[#0D1612]/96 backdrop-blur-md border border-[#10B981]/30 rounded-sm p-3 shadow-2xl text-xs font-mono">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2 font-semibold text-[#10B981]">
            <span className="flex items-center space-x-1">
              <Layers className="w-3.5 h-3.5" />
              <span>FOREST GIS LAYERS</span>
            </span>
            <button onClick={() => setLayerMenuOpen(false)} className="text-white/40 hover:text-white text-sm">×</button>
          </div>

          <div className="space-y-2 text-[11px]">
            <label className="flex items-center space-x-2 cursor-pointer text-white/80 hover:text-white">
              <input
                type="checkbox"
                checked={layers.protectedBoundaries}
                onChange={e => setLayers(l => ({ ...l, protectedBoundaries: e.target.checked }))}
                className="w-3.5 h-3.5 accent-[#10B981] rounded-sm"
              />
              <span>Reserve & Protected Borders</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer text-white/80 hover:text-white">
              <input
                type="checkbox"
                checked={layers.incidentMarkers}
                onChange={e => setLayers(l => ({ ...l, incidentMarkers: e.target.checked }))}
                className="w-3.5 h-3.5 accent-[#EF4444] rounded-sm"
              />
              <span>Heat / Thermal Anomaly Pins (🔴)</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer text-white/80 hover:text-white">
              <input
                type="checkbox"
                checked={layers.deforestationPolygons}
                onChange={e => setLayers(l => ({ ...l, deforestationPolygons: e.target.checked }))}
                className="w-3.5 h-3.5 accent-[#F97316] rounded-sm"
              />
              <span>Deforestation Change Polygons (🟠)</span>
            </label>
          </div>
        </div>
      )}

      {/* MAIN LEAFLET MAP CANVAS (Ultra-Detailed, Deep Zoomable till Tree Level) */}
      <div className={`relative flex-1 w-full h-full min-h-[480px] ${pinMode ? 'cursor-crosshair' : ''}`}>
        <div ref={mapContainerRef} className={`w-full h-full min-h-[480px] bg-[#07100C] ${pinMode ? 'cursor-crosshair' : ''}`} />

        {/* Pin Mode Active Banner Notification */}
        {pinMode && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-[#06B6D4] text-[#080E0B] font-bold px-4 py-2 rounded-sm shadow-[0_0_25px_rgba(6,182,212,0.8)] flex items-center space-x-2 text-xs animate-bounce pointer-events-auto border border-white/40">
            <Crosshair className="w-4 h-4 animate-spin text-[#080E0B]" />
            <span>CLICK ANYWHERE ON MAP TO DROP PIN (OR RIGHT-CLICK)</span>
            <button 
              onClick={() => setPinMode(false)}
              className="ml-2 bg-black/20 hover:bg-black/30 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border border-black/30"
            >
              CANCEL
            </button>
          </div>
        )}

        {/* Selected Incident Telemetry Flyout Popup Card */}
        {activePopupIncident && (
          <div className="absolute top-20 right-4 z-40 max-w-sm w-full bg-[#14201A]/95 backdrop-blur-md border border-[#10B981]/50 rounded-sm p-3.5 shadow-2xl text-xs font-mono">
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
              <div className="flex items-center space-x-2">
                <span className={`px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase ${
                  activePopupIncident.severity === 'critical' ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30' :
                  activePopupIncident.severity === 'warning' ? 'bg-[#F97316]/20 text-[#F97316] border border-[#F97316]/30' :
                  'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30'
                }`}>
                  {activePopupIncident.threatType?.toLowerCase().includes('fire') ? 'HEAT DETECTED' : 'DEFORESTED AREA'}
                </span>
                <span className="text-white font-bold">{activePopupIncident.id}</span>
              </div>
              <button
                onClick={() => setActivePopupIncident(null)}
                className="text-white/50 hover:text-white text-base leading-none"
              >
                ×
              </button>
            </div>

            <h4 className="font-sans font-bold text-white text-sm leading-snug">
              {activePopupIncident.title}
            </h4>

            <div className="grid grid-cols-2 gap-2 my-2 text-[11px]">
              <div className="bg-[#080E0B] p-1.5 rounded-sm border border-white/5">
                <div className="text-white/40 text-[9px]">DEFORESTED AREA</div>
                <div className="text-[#EF4444] font-bold text-sm">
                  {activePopupIncident.lossAreaHectares} Ha
                </div>
              </div>
              <div className="bg-[#080E0B] p-1.5 rounded-sm border border-white/5">
                <div className="text-white/40 text-[9px]">ALGORITHM CONFIDENCE</div>
                <div className="text-[#10B981] font-bold text-sm">
                  {activePopupIncident.confidenceScore}%
                </div>
              </div>
            </div>

            <div className="text-[10px] text-white/60 space-y-1 mb-3">
              <div>Sensor: <span className="text-white/80">{activePopupIncident.detectedBy}</span></div>
              <div>Coordinates: <span className="text-[#06B6D4]">{activePopupIncident.coordinates.lat.toFixed(4)}°, {activePopupIncident.coordinates.lng.toFixed(4)}°</span></div>
              <div>Threat Type: <span className="text-white/80">{activePopupIncident.threatType}</span></div>
              <div className="flex items-center justify-between pt-1 border-t border-white/5">
                <span className="text-[9px] text-white/40">JURISDICTION:</span>
                <span className="text-[9px] font-bold text-[#4CD7F6]">{activePopupIncident.legalJurisdiction}</span>
              </div>
            </div>

            <button
              onClick={() => onSelectIncident(activePopupIncident)}
              className="w-full py-2 bg-[#10B981] hover:bg-[#34D399] text-[#080E0B] font-bold rounded-sm text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-md"
            >
              <span>OPEN DUAL-TEMPORAL FORENSIC WIPE</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* BOTTOM DOCK: Live Satellite API Telemetry & Latest 3 Satellite Images From Space */}
      <div className="bg-[#0D1612]/96 backdrop-blur-md border-t border-white/10 px-4 py-2.5 z-30 font-mono text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          {/* Left: Satellite Provider & Target Info */}
          <div className="flex items-center space-x-2 text-[10px] text-white/60">
            <Satellite className="w-4 h-4 text-[#10B981]" />
            <span className="font-bold text-white uppercase tracking-wider">LIVE SATELLITE PASS FEED</span>
            <span className="text-white/30">|</span>
            {activePin ? (
              <div className="flex items-center space-x-2 flex-wrap">
                <span className="w-2 h-2 rounded-full bg-[#06B6D4] animate-ping"></span>
                <span className="text-white/80">Target:</span>
                <span className="text-[#06B6D4] font-bold bg-[#06B6D4]/15 border border-[#06B6D4]/40 px-2 py-0.5 rounded-sm">
                  📍 Pinned Place ({activePin.lat.toFixed(4)}°, {activePin.lng.toFixed(4)}°)
                </span>
                <button
                  onClick={() => setActivePin(null)}
                  className="text-[9px] text-[#EF4444] hover:underline cursor-pointer ml-1"
                  title="Clear pin and return to reserve"
                >
                  [Clear Pin]
                </button>
              </div>
            ) : (
              <span>Target: <strong className="text-[#4EDEA3]">{activeForest.name}</strong></span>
            )}
          </div>

          {/* Right: Sensor Selection Buttons & Clear Composite Action */}
          <div className="flex items-center space-x-1.5 flex-wrap gap-1">
            {/* 3-Pass Multi-Satellite Fusion Button */}
            {satellitePasses.length > 0 && (
              <button
                onClick={() => {
                  setModalInitialMode('composite');
                  setPreviewPass(satellitePasses[0]);
                }}
                className="flex items-center space-x-1.5 px-3 py-1 bg-gradient-to-r from-[#10B981]/30 to-[#06B6D4]/30 hover:from-[#10B981]/50 hover:to-[#06B6D4]/50 border border-[#10B981] text-white text-[10px] font-bold rounded-sm shadow-[0_0_12px_rgba(16,185,129,0.35)] transition-all cursor-pointer"
                title="Synthesize all 3 satellite passes into a single clear, cloud-free, enhanced image"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#10B981] animate-pulse" />
                <span>✨ PROCESS 3-PASS CLEAR IMAGE</span>
              </button>
            )}

            <div className="flex items-center space-x-1 bg-[#080E0B] p-1 rounded-sm border border-white/5 text-[10px]">
              <button
                onClick={() => setSelectedSensor('sentinel-2')}
                className={`px-2 py-0.5 rounded-sm transition-colors ${
                  selectedSensor === 'sentinel-2' ? 'bg-[#10B981] text-[#080E0B] font-bold' : 'text-white/70 hover:text-white'
                }`}
              >
                Sentinel-2 (10m Optical)
              </button>
              <button
                onClick={() => setSelectedSensor('sentinel-1')}
                className={`px-2 py-0.5 rounded-sm transition-colors ${
                  selectedSensor === 'sentinel-1' ? 'bg-[#10B981] text-[#080E0B] font-bold' : 'text-white/70 hover:text-white'
                }`}
              >
                Sentinel-1 (Radar C-SAR)
              </button>
              <button
                onClick={() => setSelectedSensor('landsat-9')}
                className={`px-2 py-0.5 rounded-sm transition-colors ${
                  selectedSensor === 'landsat-9' ? 'bg-[#10B981] text-[#080E0B] font-bold' : 'text-white/70 hover:text-white'
                }`}
              >
                Landsat 9 (Thermal)
              </button>
            </div>
          </div>
        </div>

        {/* Latest 3 Real Photos Directly from Satellite API & 3-Pass Fusion */}
        {loadingPasses ? (
          <div className="flex items-center justify-center py-4 text-[#06B6D4] space-x-2 text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-[#06B6D4]" />
            <span>DOWNLOADING LATEST SATELLITE PASSES OVER {activePin ? `PINNED COORDINATE (${activePin.lat.toFixed(4)}°, ${activePin.lng.toFixed(4)}°)` : activeForest.name} FROM ELEMENT 84 STAC API...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {satellitePasses.map((img, idx) => (
              <div
                key={img.id || idx}
                onClick={() => {
                  setModalInitialMode('single');
                  setPreviewPass(img);
                }}
                className="group bg-[#080E0B] border border-white/10 hover:border-[#10B981]/60 rounded-sm overflow-hidden p-2 flex space-x-2.5 cursor-pointer transition-all shadow-md hover:shadow-[0_0_12px_rgba(16,185,129,0.2)]"
              >
                {/* Thumbnail */}
                <div className="relative w-20 h-16 rounded-sm overflow-hidden bg-black flex-shrink-0 border border-white/10">
                  <img 
                    src={img.url} 
                    alt={img.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/21/M/XS/2026/11/S2A_21MXS_20261101_1_L2A/preview.jpg";
                    }}
                  />
                  <span className="absolute top-1 left-1 bg-black/80 text-[8px] text-[#10B981] font-bold px-1 rounded-sm">
                    PASS {idx + 1}
                  </span>
                  <div className="absolute inset-0 bg-[#10B981]/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Maximize2 className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 text-[10px] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${activePin ? 'bg-[#06B6D4]' : 'bg-[#10B981]'} animate-pulse`}></span>
                      <span className={`text-[8px] ${activePin ? 'text-[#06B6D4]' : 'text-[#10B981]'} font-bold uppercase tracking-wider`}>
                        {activePin ? 'OVERFLIGHT (PINNED PLACE)' : 'REAL SATELLITE PASS'}
                      </span>
                    </div>
                    <div className="font-bold text-white truncate text-[11px] group-hover:text-[#4EDEA3] transition-colors mt-0.5">
                      {img.title}
                    </div>
                    <div className="text-white/60 text-[9px] flex items-center space-x-1.5 mt-0.5">
                      <Calendar className="w-2.5 h-2.5 text-[#10B981]" />
                      <span className="font-bold text-white/90">{img.date}</span>
                      {img.timeClicked && (
                        <>
                          <span className="text-white/30">•</span>
                          <span className="text-[#06B6D4] font-mono">{img.timeClicked.split(',')[1]?.trim() || img.timeClicked}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[9px] pt-1 border-t border-white/5 text-white/60">
                    <span>Cloud: <strong className="text-white">{img.cloudPct}%</strong></span>
                    <span className="text-[#06B6D4] font-bold">{img.resolution ? img.resolution.split(' ')[0] : '10m'}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* 4th Special Card: ✨ Multi-Satellite 3-Pass Clear Fusion */}
            {satellitePasses.length > 0 && (
              <div
                onClick={() => {
                  setModalInitialMode('composite');
                  setPreviewPass(satellitePasses[0]);
                }}
                className="group relative bg-gradient-to-br from-[#081811] via-[#05100B] to-[#040806] border-2 border-[#10B981]/70 hover:border-[#10B981] rounded-sm overflow-hidden p-2 flex space-x-2.5 cursor-pointer transition-all shadow-[0_0_16px_rgba(16,185,129,0.25)] hover:shadow-[0_0_24px_rgba(16,185,129,0.45)]"
              >
                {/* Thumbnail Preview with Shimmer */}
                <div className="relative w-20 h-16 rounded-sm overflow-hidden bg-black flex-shrink-0 border border-[#10B981]/50">
                  <img 
                    src={satellitePasses[0]?.url} 
                    alt="Composite Fusion"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 filter contrast-125 saturate-120"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                  <span className="absolute top-1 left-1 bg-[#10B981] text-[8px] text-[#050B08] font-black px-1.5 py-0.5 rounded-sm shadow flex items-center space-x-0.5">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>CLEAR FUSION</span>
                  </span>
                  <div className="absolute inset-0 bg-[#10B981]/15 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Maximize2 className="w-4 h-4 text-[#10B981]" />
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 text-[10px] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping"></span>
                      <span className="text-[8px] text-[#10B981] font-extrabold uppercase tracking-wider">
                        AI MULTI-PASS FUSION
                      </span>
                    </div>
                    <div className="font-bold text-white truncate text-[11px] group-hover:text-[#4EDEA3] transition-colors mt-0.5 flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-[#10B981]" />
                      <span>3-Pass Clear Fusion</span>
                    </div>
                    <div className="text-[#06B6D4] text-[9px] mt-0.5 font-medium truncate">
                      Clouds removed • Sharpened HD
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[9px] pt-1 border-t border-[#10B981]/20 text-white/70">
                    <span className="text-[#10B981] font-bold">Clear Ground</span>
                    <span className="text-[#06B6D4] font-bold">FUSED HD</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Zoomable & Surfable Fullscreen Satellite Modal with Drag-to-Pan, Mousewheel Zoom, D-Pad & Exact Capture Timestamp */}
      {previewPass && (
        <SatelliteImageSurferModal
          pass={previewPass}
          allPasses={satellitePasses}
          targetLabel={activePin ? activePin.label : activeForest.name}
          targetCoords={activePin ? { lat: activePin.lat, lng: activePin.lng } : activeForest.centerCoords}
          initialMode={modalInitialMode}
          onClose={() => setPreviewPass(null)}
        />
      )}
    </div>
  );
};
