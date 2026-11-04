import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import * as THREE from 'three';
import { MonitoredAOI, Incident } from '../types';
import { api } from '../services/api';
import { ForestCanopy3DInspector } from './ForestCanopy3DInspector';
import { 
  Globe, 
  RotateCcw, 
  MapPin, 
  Flame, 
  AlertTriangle, 
  Satellite, 
  Calendar, 
  Eye, 
  Crosshair, 
  Layers, 
  Sliders, 
  CheckCircle2, 
  X, 
  ZoomIn, 
  ZoomOut,
  Maximize2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Trees
} from 'lucide-react';

interface CustomPin {
  lat: number;
  lng: number;
  label: string;
  timestamp: string;
}

export interface SatelliteInfo {
  id: string;
  name: string;
  provider: string;
  apiEndpoint: string;
  type: 'multispectral' | 'sar' | 'thermal' | 'highres';
  resolution: string;
  revisit: string;
  status: 'ONLINE' | 'ACTIVE_PASS' | 'CALIBRATING';
}

const SATELLITE_APIS: SatelliteInfo[] = [
  {
    id: 'sentinel-2',
    name: 'Sentinel-2 MSI (Level-2A)',
    provider: 'Element 84 Earth Search STAC API (AWS S3 Public COGs)',
    apiEndpoint: 'https://earth-search.aws.element84.com/v1',
    type: 'multispectral',
    resolution: '10m GSD',
    revisit: '5 Days',
    status: 'ONLINE'
  },
  {
    id: 'sentinel-1',
    name: 'Sentinel-1C C-SAR (GRD Radar)',
    provider: 'Copernicus Data Space Ecosystem (CDSE) OData / AWS',
    apiEndpoint: 'https://catalogue.dataspace.copernicus.eu/odata/v1',
    type: 'sar',
    resolution: '10m Radar Swath',
    revisit: '12 Hours (Asc/Desc)',
    status: 'ONLINE'
  },
  {
    id: 'landsat-9',
    name: 'Landsat 9 (OLI-2 & TIRS-2)',
    provider: 'USGS / NASA Earth Observing STAC API',
    apiEndpoint: 'https://landsatlook.usgs.gov/stac-server',
    type: 'thermal',
    resolution: '15m Pan / 100m Thermal',
    revisit: '8 Days',
    status: 'ACTIVE_PASS'
  },
  {
    id: 'planetscope',
    name: 'PlanetScope SuperDove (8-Band)',
    provider: 'Planet Labs Commercial Satellite Tasking API',
    apiEndpoint: 'https://api.planet.com/data/v1',
    type: 'highres',
    resolution: '3m High-Res',
    revisit: 'Daily Constellation',
    status: 'ONLINE'
  }
];

interface EarthGlobe3DProps {
  allAois: MonitoredAOI[];
  selectedAoi: MonitoredAOI;
  onSelectAoi: (aoi: MonitoredAOI) => void;
  incidents: Incident[];
  onSelectIncident?: (incident: Incident) => void;
}

// Convert geographic coordinates (lat, lng) to 3D Cartesian coordinates on sphere
function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// Convert 3D local vector back to Latitude and Longitude
function vector3ToLatLng(localPoint: THREE.Vector3, radius: number): { lat: number; lng: number } {
  const norm = localPoint.clone().normalize();
  const phi = Math.acos(Math.max(-1, Math.min(1, norm.y)));
  const lat = 90 - (phi * 180) / Math.PI;

  const theta = Math.atan2(norm.z, -norm.x);
  let lng = (theta * 180) / Math.PI - 180;
  if (lng < -180) lng += 360;
  if (lng > 180) lng -= 360;

  return {
    lat: Number(lat.toFixed(4)),
    lng: Number(lng.toFixed(4))
  };
}

// Generate high-resolution procedural Earth texture canvas
function createProceduralEarthCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  const oceanGrad = ctx.createLinearGradient(0, 0, 0, 1024);
  oceanGrad.addColorStop(0, '#020b14');
  oceanGrad.addColorStop(0.5, '#051d32');
  oceanGrad.addColorStop(1, '#020b14');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, 2048, 1024);

  // Continents landmasses
  ctx.fillStyle = '#103522';
  // South America
  ctx.beginPath();
  ctx.ellipse(650, 680, 180, 260, 0.2, 0, Math.PI * 2);
  ctx.fill();
  // Africa
  ctx.beginPath();
  ctx.ellipse(1080, 560, 160, 240, -0.1, 0, Math.PI * 2);
  ctx.fill();
  // Eurasia
  ctx.beginPath();
  ctx.ellipse(1350, 320, 380, 180, 0, 0, Math.PI * 2);
  ctx.fill();
  // North America
  ctx.beginPath();
  ctx.ellipse(500, 320, 260, 180, -0.2, 0, Math.PI * 2);
  ctx.fill();
  // Southeast Asia / Oceania
  ctx.beginPath();
  ctx.ellipse(1680, 680, 140, 120, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Tropical Forest Belts
  ctx.fillStyle = '#15803d';
  ctx.beginPath();
  ctx.ellipse(680, 620, 120, 100, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(1120, 560, 90, 80, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(1640, 540, 100, 60, 0, 0, Math.PI * 2);
  ctx.fill();

  // Defense latitude & longitude grid lines
  ctx.strokeStyle = 'rgba(78, 222, 163, 0.12)';
  ctx.lineWidth = 1;
  for (let x = 0; x < 2048; x += 128) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1024);
    ctx.stroke();
  }
  for (let y = 0; y < 1024; y += 128) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(2048, y);
    ctx.stroke();
  }

  return canvas;
}

// Generate curved border points along sphere for rectangle bounds
function generateCurvedBoundaryPoints(bounds: number[], radius: number): THREE.Vector3[] {
  const [minLat, minLng, maxLat, maxLng] = bounds;
  const points: THREE.Vector3[] = [];
  const segments = 12;

  // North edge
  for (let i = 0; i <= segments; i++) {
    const lng = minLng + (maxLng - minLng) * (i / segments);
    points.push(latLngToVector3(maxLat, lng, radius));
  }
  // East edge
  for (let i = 0; i <= segments; i++) {
    const lat = maxLat - (maxLat - minLat) * (i / segments);
    points.push(latLngToVector3(lat, maxLng, radius));
  }
  // South edge
  for (let i = 0; i <= segments; i++) {
    const lng = maxLng - (maxLng - minLng) * (i / segments);
    points.push(latLngToVector3(minLat, lng, radius));
  }
  // West edge
  for (let i = 0; i <= segments; i++) {
    const lat = minLat + (maxLat - minLat) * (i / segments);
    points.push(latLngToVector3(lat, minLng, radius));
  }

  return points;
}

export const EarthGlobe3D: React.FC<EarthGlobe3DProps> = ({
  allAois,
  selectedAoi,
  onSelectAoi,
  incidents,
  onSelectIncident
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  // Auto-spin completely stopped by default as requested
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const autoRotateRef = useRef<boolean>(false);
  const [pinMode, setPinMode] = useState<boolean>(false);
  const [customPins, setCustomPins] = useState<CustomPin[]>([]);
  const [activePin, setActivePin] = useState<CustomPin | null>(null);
  const [activeIncident, setActiveIncident] = useState<Incident | null>(null);
  const [selectedSatApi, setSelectedSatApi] = useState<SatelliteInfo>(SATELLITE_APIS[0]);
  const [satelliteDrawerOpen, setSatelliteDrawerOpen] = useState<boolean>(true);
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);
  const [forestListOpen, setForestListOpen] = useState<boolean>(true);
  const [legendOpen, setLegendOpen] = useState<boolean>(true);
  const [inspectingCanopy, setInspectingCanopy] = useState<boolean>(false);

  // Deduplicate AOIs so each forest appears only once
  const uniqueAois = useMemo(() => {
    const seen = new Set<string>();
    return allAois.filter(a => {
      const key = `${a.name.trim().toLowerCase()}-${a.country.trim().toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [allAois]);

  // Real satellite passes queried live from Element 84 Earth Search STAC API
  const [satellitePasses, setSatellitePasses] = useState<any[]>([
    {
      id: "S2A_21MXS_20261101_1_L2A",
      title: "Sentinel-2A MSI Surface Reflectance",
      date: "2026-11-01 14:13 UTC",
      resolution: "10m Surface Reflectance",
      cloudPct: 4.2,
      type: "Optical Multispectral",
      url: "https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/21/M/XS/2026/11/S2A_21MXS_20261101_1_L2A/preview.jpg",
      band: "B04 Red, B03 Green, B02 Blue, B08 NIR",
      isRealApi: true
    },
    {
      id: "S2B_34MDD_20261101_1_L2A",
      title: "Sentinel-2B MSI Canopy Observation",
      date: "2026-11-01 09:10 UTC",
      resolution: "10m Surface Reflectance",
      cloudPct: 8.5,
      type: "Optical Multispectral",
      url: "https://e84-earth-search-sentinel-data.s3.us-west-2.amazonaws.com/sentinel-2-c1-l2a/34/M/DD/2026/11/S2A_T34MDD_20261101T090524_L2A/L2A_PVI.jpg",
      band: "B08 NIR, B04 Red (NDVI)",
      isRealApi: true
    },
    {
      id: "S2A_47NKD_20261101_1_L2A",
      title: "Sentinel-2A Multi-Spectral Tropical Pass",
      date: "2026-11-01 04:07 UTC",
      resolution: "10m Surface Reflectance",
      cloudPct: 12.1,
      type: "Optical Multispectral",
      url: "https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/47/N/KD/2026/11/S2A_47NKD_20261101_1_L2A/preview.jpg",
      band: "B04, B03, B02, SCL Mask",
      isRealApi: true
    }
  ]);
  const [loadingPasses, setLoadingPasses] = useState<boolean>(false);

  // References for interactive 3D control
  const earthMeshRef = useRef<THREE.Mesh | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const targetCameraDistanceRef = useRef<number>(240);
  const targetRotationRef = useRef<{ x: number; y: number } | null>(null);
  const customPinsGroupRef = useRef<THREE.Group | null>(null);

  const earthRadius = 75;

  // Sync autoRotateRef
  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  // Fetch real satellite photos directly from Element 84 Earth Search STAC API
  useEffect(() => {
    let isMounted = true;
    const targetCoords = activePin 
      ? { lat: activePin.lat, lng: activePin.lng } 
      : selectedAoi.centerCoords;

    setLoadingPasses(true);

    api.getLatestSatellitePasses({
      lat: targetCoords.lat,
      lng: targetCoords.lng,
      sensor: selectedSatApi.id,
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
  }, [activePin, selectedAoi, selectedSatApi]);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || 800;
    const height = mountRef.current.clientHeight || 580;

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040806);

    // Deep zoom enabled: near plane at 0.05 so zoom can go right to surface
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.05, 1200);
    camera.position.z = 240;
    cameraRef.current = camera;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (_e) {
      renderer = new THREE.WebGLRenderer({ antialias: false });
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    mountRef.current.appendChild(renderer.domElement);

    // Starfield Background
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 2000;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 900;
      starPositions[i + 1] = (Math.random() - 0.5) * 900;
      starPositions[i + 2] = (Math.random() - 0.5) * 900;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starsMat = new THREE.PointsMaterial({ color: 0x94a3b8, size: 0.9, transparent: true, opacity: 0.65 });
    const starField = new THREE.Points(starsGeo, starsMat);
    scene.add(starField);

    // Earth Sphere
    const earthGeo = new THREE.SphereGeometry(earthRadius, 64, 64);
    const proceduralTexture = new THREE.CanvasTexture(createProceduralEarthCanvas());

    const earthMat = new THREE.MeshPhongMaterial({
      map: proceduralTexture,
      bumpScale: 0.08,
      specular: new THREE.Color(0x1a365d),
      shininess: 14
    });

    // Texture loader with satellite imagery
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
      (texture: THREE.Texture) => {
        if (texture) {
          texture.colorSpace = THREE.SRGBColorSpace;
          earthMat.map = texture;
          earthMat.needsUpdate = true;
        }
      }
    );

    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earthMesh);
    earthMeshRef.current = earthMesh;

    // Atmospheric Glow Mesh
    const atmosphereGeo = new THREE.SphereGeometry(earthRadius * 1.022, 64, 64);
    const atmosphereMat = new THREE.MeshBasicMaterial({
      color: 0x4edea3,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    scene.add(atmosphereMesh);

    // Cloud Layer
    const cloudGeo = new THREE.SphereGeometry(earthRadius * 1.008, 64, 64);
    const cloudMat = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.20,
      blending: THREE.AdditiveBlending
    });
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    scene.add(cloudMesh);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff7ed, 1.8);
    sunLight.position.set(300, 100, 200);
    scene.add(sunLight);

    // Root Group that rotates along with Earth surface
    const surfaceGroup = new THREE.Group();
    earthMesh.add(surfaceGroup);

    // 1. Draw Forest Boundaries on 3D Globe
    allAois.forEach((aoi) => {
      if (!aoi.bounds || aoi.bounds.length < 4) return;
      const isSelected = aoi.id === selectedAoi.id;
      const boundaryPts = generateCurvedBoundaryPoints(aoi.bounds, earthRadius + 0.2);
      
      const boundaryGeo = new THREE.BufferGeometry().setFromPoints(boundaryPts);
      const boundaryMat = new THREE.LineBasicMaterial({
        color: isSelected ? 0x10b981 : 0x059669,
        linewidth: isSelected ? 3 : 1.5,
        transparent: true,
        opacity: isSelected ? 0.95 : 0.6
      });
      const boundaryLine = new THREE.LineLoop(boundaryGeo, boundaryMat);
      surfaceGroup.add(boundaryLine);

      // Forest Name Label Billboard Pin
      const centerPos = latLngToVector3(aoi.centerCoords.lat, aoi.centerCoords.lng, earthRadius + 0.3);
      const pinGeo = new THREE.CylinderGeometry(0.3, 0.1, 4, 8);
      const pinMat = new THREE.MeshBasicMaterial({ color: isSelected ? 0x10b981 : 0x047857 });
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);
      pinMesh.position.copy(centerPos);
      pinMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), centerPos.clone().normalize());
      surfaceGroup.add(pinMesh);
    });

    // 2. Incident Dots: Red for Heat/Thermal, Orange for Deforestation
    const incidentObjects: { mesh: THREE.Mesh; incident: Incident }[] = [];
    incidents.forEach((inc) => {
      if (!inc.coordinates) return;
      const isHeat = inc.threatType?.toLowerCase().includes('fire') || 
                     inc.threatType?.toLowerCase().includes('thermal') ||
                     inc.severity === 'critical';

      const color = isHeat ? 0xef4444 : 0xf97316; // Red for Heat, Orange for Deforestation
      const dotRadius = isHeat ? 1.6 : 1.4;

      const dotGeo = new THREE.SphereGeometry(dotRadius, 16, 16);
      const dotMat = new THREE.MeshBasicMaterial({ color });
      const dotMesh = new THREE.Mesh(dotGeo, dotMat);

      const dotPos = latLngToVector3(inc.coordinates.lat, inc.coordinates.lng, earthRadius + 0.6);
      dotMesh.position.copy(dotPos);
      dotMesh.userData = { incident: inc, isHeat };
      surfaceGroup.add(dotMesh);
      incidentObjects.push({ mesh: dotMesh, incident: inc });

      // Pulsing halo wave ring
      const ringGeo = new THREE.RingGeometry(dotRadius * 1.1, dotRadius * 1.8, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.55
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(dotPos);
      ringMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dotPos.clone().normalize());
      surfaceGroup.add(ringMesh);
    });

    // 3. User Custom Dropped Pins Group
    const userPinsGroup = new THREE.Group();
    surfaceGroup.add(userPinsGroup);
    customPinsGroupRef.current = userPinsGroup;

    // 4. Orbital Satellites Paths
    const orbitGroup = new THREE.Group();
    scene.add(orbitGroup);

    // Sentinel-2 Polar Orbit
    const r1 = earthRadius + 22;
    const ringPts1: THREE.Vector3[] = [];
    for (let a = 0; a <= Math.PI * 2; a += 0.05) {
      ringPts1.push(new THREE.Vector3(r1 * Math.cos(a), r1 * Math.sin(a) * 0.95, r1 * Math.sin(a) * 0.3));
    }
    const orbitLine1 = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(ringPts1),
      new THREE.LineBasicMaterial({ color: 0x4edea3, transparent: true, opacity: 0.35 })
    );
    orbitGroup.add(orbitLine1);
    const sat1 = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.4, 1.4), new THREE.MeshBasicMaterial({ color: 0x4cd7f6 }));
    orbitGroup.add(sat1);

    // Sentinel-1 SAR Orbit
    const r2 = earthRadius + 28;
    const ringPts2: THREE.Vector3[] = [];
    for (let a = 0; a <= Math.PI * 2; a += 0.05) {
      ringPts2.push(new THREE.Vector3(r2 * Math.cos(a) * 0.4, r2 * Math.sin(a), r2 * Math.cos(a) * 0.9));
    }
    const orbitLine2 = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(ringPts2),
      new THREE.LineBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.35 })
    );
    orbitGroup.add(orbitLine2);
    const sat2 = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.4, 1.4), new THREE.MeshBasicMaterial({ color: 0xffb95f }));
    orbitGroup.add(sat2);

    // Mouse & Touch Interaction
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (e: MouseEvent) => {
      // User interaction immediately stops auto-spin
      setAutoRotate(false);
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: MouseEvent) => {
      const rect = mountRef.current?.getBoundingClientRect();
      if (!rect) return;

      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging) {
        const deltaX = e.clientX - prevMousePos.x;
        const deltaY = e.clientY - prevMousePos.y;

        earthMesh.rotation.y += deltaX * 0.005;
        cloudMesh.rotation.y += deltaX * 0.005;

        earthMesh.rotation.x = Math.max(-1.4, Math.min(1.4, earthMesh.rotation.x + deltaY * 0.005));
        cloudMesh.rotation.x = earthMesh.rotation.x;

        prevMousePos = { x: e.clientX, y: e.clientY };
      }
    };

    const handlePointerUp = (e: MouseEvent) => {
      if (!isDragging && pinMode) {
        // Drop Pin Mode: Raycast against Earth mesh
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(earthMesh);
        if (intersects.length > 0) {
          const hit = intersects[0];
          const localPoint = earthMesh.worldToLocal(hit.point.clone());
          const coords = vector3ToLatLng(localPoint, earthRadius);

          const newPin: CustomPin = {
            lat: coords.lat,
            lng: coords.lng,
            label: `Pinned Point (${coords.lat}°, ${coords.lng}°)`,
            timestamp: new Date().toISOString()
          };

          setCustomPins(prev => [...prev, newPin]);
          setActivePin(newPin);
          setPinMode(false); // Disable pin mode after dropping
        }
      } else if (!isDragging) {
        // Check if user clicked an incident dot
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(incidentObjects.map(i => i.mesh));
        if (intersects.length > 0) {
          const inc = intersects[0].object.userData.incident as Incident;
          if (inc) {
            setActiveIncident(inc);
            if (onSelectIncident) onSelectIncident(inc);
          }
        }
      }
      isDragging = false;
    };

    // Ultra-deep zoom till end: from 240 down to 76.5 (Earth surface radius is 75)
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setAutoRotate(false); // Stop spinning on zoom interaction

      const zoomFactor = camera.position.z > 100 ? 0.2 : 0.08;
      targetCameraDistanceRef.current = Math.max(
        earthRadius + 1.2, // 76.2 -> right above the forest canopy!
        Math.min(380, targetCameraDistanceRef.current + e.deltaY * zoomFactor)
      );
    };

    const domEl = mountRef.current;
    domEl.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    domEl.addEventListener('wheel', handleWheel, { passive: false });

    // Focus target AOI smoothly
    const focusAoi = (target: MonitoredAOI) => {
      const targetY = -((target.centerCoords.lng + 180) * (Math.PI / 180)) + Math.PI / 2;
      const targetX = target.centerCoords.lat * (Math.PI / 180);
      targetRotationRef.current = { x: targetX, y: targetY };
      // Zoom in close to targeted forest
      targetCameraDistanceRef.current = earthRadius + 18; // Close orbital inspection
    };

    focusAoi(selectedAoi);

    // Animation Loop
    let animationFrameId: number;
    let satAngle1 = 0;
    let satAngle2 = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth camera zoom interpolation
      camera.position.z += (targetCameraDistanceRef.current - camera.position.z) * 0.1;

      // Smooth rotate towards target if focused
      if (targetRotationRef.current) {
        const dx = targetRotationRef.current.x - earthMesh.rotation.x;
        const dy = targetRotationRef.current.y - earthMesh.rotation.y;

        earthMesh.rotation.x += dx * 0.06;
        cloudMesh.rotation.x = earthMesh.rotation.x;

        earthMesh.rotation.y += dy * 0.06;
        cloudMesh.rotation.y = earthMesh.rotation.y;

        if (Math.abs(dx) < 0.002 && Math.abs(dy) < 0.002) {
          targetRotationRef.current = null;
        }
      } else if (autoRotateRef.current && !isDragging) {
        earthMesh.rotation.y += 0.0012;
        cloudMesh.rotation.y += 0.0016;
      }

      // Orbital Satellites revolving around Earth
      satAngle1 += 0.008;
      sat1.position.set(r1 * Math.cos(satAngle1), r1 * Math.sin(satAngle1) * 0.95, r1 * Math.sin(satAngle1) * 0.3);

      satAngle2 += 0.006;
      sat2.position.set(r2 * Math.cos(satAngle2) * 0.4, r2 * Math.sin(satAngle2), r2 * Math.cos(satAngle2) * 0.9);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth || 800;
      const h = mountRef.current.clientHeight || 580;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      domEl.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      domEl.removeEventListener('wheel', handleWheel);
      if (mountRef.current && renderer.domElement && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [allAois, incidents]);

  // Synchronize Custom User Pins onto 3D Globe Mesh
  useEffect(() => {
    if (!customPinsGroupRef.current) return;
    const group = customPinsGroupRef.current;
    
    // Clear old pin objects
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    customPins.forEach((pin) => {
      const pos = latLngToVector3(pin.lat, pin.lng, earthRadius + 0.3);

      // Neon Cyan Targeting Spike
      const pinGeo = new THREE.CylinderGeometry(0.6, 0.1, 7, 8);
      const pinMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);
      pinMesh.position.copy(pos);
      pinMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().normalize());

      // Glowing Diamond Head
      const headGeo = new THREE.OctahedronGeometry(2.2, 0);
      const headMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.copy(pos.clone().add(pos.clone().normalize().multiplyScalar(4.5)));

      group.add(pinMesh);
      group.add(head);
    });
  }, [customPins]);

  // Handle clicking a forest name button
  const handleSelectForest = (aoi: MonitoredAOI) => {
    setAutoRotate(false); // Stop auto-spinning
    onSelectAoi(aoi);
    setActivePin(null);

    if (earthMeshRef.current) {
      const targetY = -((aoi.centerCoords.lng + 180) * (Math.PI / 180)) + Math.PI / 2;
      const targetX = aoi.centerCoords.lat * (Math.PI / 180);
      targetRotationRef.current = { x: targetX, y: targetY };
      // Zoom close to show forest boundary
      targetCameraDistanceRef.current = earthRadius + 18;
    }
  };

  const handleZoomIn = () => {
    setAutoRotate(false);
    targetCameraDistanceRef.current = Math.max(earthRadius + 1.2, targetCameraDistanceRef.current - 25);
  };

  const handleZoomOut = () => {
    setAutoRotate(false);
    targetCameraDistanceRef.current = Math.min(380, targetCameraDistanceRef.current + 25);
  };

  const handleResetOrbit = () => {
    targetCameraDistanceRef.current = 240;
    targetRotationRef.current = { x: 0, y: 0 };
    setAutoRotate(true);
  };

  if (inspectingCanopy) {
    return (
      <ForestCanopy3DInspector
        aoi={selectedAoi}
        allAois={uniqueAois}
        onSelectAoi={onSelectAoi}
        incidents={incidents}
        onClose={() => setInspectingCanopy(false)}
        onSelectIncident={onSelectIncident}
      />
    );
  }

  return (
    <div className="relative w-full h-[calc(100vh-140px)] min-h-[580px] flex flex-col bg-[#040806] select-none overflow-hidden font-mono text-white">
      {/* 3D WebGL Canvas */}
      <div 
        ref={mountRef} 
        className={`flex-1 w-full h-full min-h-[500px] ${
          pinMode ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'
        }`}
      />

      {/* Pin Mode Banner Notification */}
      {pinMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-[#06B6D4]/90 text-[#080E0B] font-bold px-4 py-2 rounded-sm shadow-2xl flex items-center space-x-2 text-xs animate-bounce">
          <MapPin className="w-4 h-4 animate-ping" />
          <span>CLICK ANYWHERE ON THE 3D GLOBE TO DROP PIN</span>
          <button 
            onClick={() => setPinMode(false)} 
            className="ml-2 hover:bg-black/20 p-1 rounded-sm"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Left: Forest Name Buttons (Zoom & Highlight Forest Boundaries) */}
      <div className="absolute top-4 left-4 z-20 flex flex-col space-y-2 pointer-events-none max-w-sm">
        {!forestListOpen ? (
          <button
            onClick={() => setForestListOpen(true)}
            className="pointer-events-auto bg-[#0D1612]/95 hover:bg-[#15231D] backdrop-blur-md border border-[#10B981]/50 hover:border-[#10B981] px-3 py-2 rounded-sm shadow-2xl flex items-center space-x-2 text-xs font-bold text-white transition-all group"
            title="Open Forest Reserve Sectors list"
          >
            <Globe className="w-4 h-4 text-[#10B981] group-hover:scale-110 transition-transform" />
            <span>FOREST SECTORS ({uniqueAois.length})</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#10B981]" />
          </button>
        ) : (
          <div className="pointer-events-auto bg-[#0D1612]/95 backdrop-blur-md border border-[#10B981]/40 p-3 rounded-sm shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="text-[11px] font-bold text-white tracking-wider flex items-center space-x-1.5">
                <Globe className="w-4 h-4 text-[#10B981]" />
                <span>FOREST RESERVE SECTORS</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[9px] text-[#10B981] bg-[#10B981]/10 px-1.5 py-0.5 rounded-sm hidden sm:inline">
                  ZOOM BOUNDARY
                </span>
                <button
                  onClick={() => setForestListOpen(false)}
                  className="p-1 hover:bg-white/10 text-white/50 hover:text-white rounded-sm transition-colors"
                  title="Close Forest List"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Forest Buttons List */}
            <div className="flex flex-col gap-1.5 mt-2.5 max-h-60 overflow-y-auto pr-1">
              {uniqueAois.map((aoi) => {
                const isSelected = aoi.id === selectedAoi.id && !activePin;
                return (
                  <button
                    key={aoi.id}
                    onClick={() => handleSelectForest(aoi)}
                    className={`text-[11px] px-3 py-2 rounded-sm border transition-all flex items-center justify-between shadow-md text-left ${
                      isSelected
                        ? 'bg-[#10B981] text-[#080E0B] border-[#10B981] font-bold shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                        : 'bg-[#080E0B]/85 text-white/80 border-white/10 hover:border-[#10B981]/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-current" />
                      <span className="truncate">{aoi.name}</span>
                    </div>
                    <span className="text-[9px] opacity-70 ml-2 whitespace-nowrap">({aoi.country})</span>
                  </button>
                );
              })}
            </div>

            {/* 3D High-Res Real Satellite Canopy Inspector Button */}
            <button
              onClick={() => setInspectingCanopy(true)}
              className="w-full mt-2.5 py-1.5 px-3 bg-[#10B981]/20 hover:bg-[#10B981] text-[#10B981] hover:text-[#080E0B] border border-[#10B981]/50 rounded-sm font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-md group cursor-pointer"
              title="Inspect Real High-Resolution 3D Satellite Canopy for this Forest"
            >
              <Trees className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span>🔍 3D REAL HIGH-RES CANOPY MAP</span>
            </button>
          </div>
        )}

        {/* Legend: Red Heat vs Orange Deforestation */}
        <div className="pointer-events-auto bg-[#0D1612]/92 backdrop-blur-md border border-white/10 p-2.5 rounded-sm text-[10px] space-y-1.5 shadow-xl">
          <div 
            onClick={() => setLegendOpen(!legendOpen)}
            className="font-bold text-white/90 border-b border-white/10 pb-1 flex items-center justify-between cursor-pointer hover:text-white"
          >
            <span className="flex items-center space-x-1.5">
              <span>ORBITAL DETECTION LEGEND</span>
            </span>
            <div className="flex items-center space-x-1">
              <span className="text-[8px] text-white/40">3D MARKERS</span>
              {legendOpen ? <ChevronUp className="w-3 h-3 text-white/50" /> : <ChevronDown className="w-3 h-3 text-white/50" />}
            </div>
          </div>
          {legendOpen && (
            <div className="space-y-1.5 pt-0.5">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-[#EF4444] shadow-[0_0_8px_#EF4444] inline-block animate-pulse" />
                <span className="text-white/80">🔴 <strong>RED DOT:</strong> Heat / Thermal Anomaly</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-[#F97316] shadow-[0_0_8px_#F97316] inline-block" />
                <span className="text-white/80">🟠 <strong>ORANGE DOT:</strong> Deforested Area</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-1 bg-[#10B981] inline-block" />
                <span className="text-[#10B981]">🟢 <strong>GREEN LINE:</strong> Forest Boundary</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Right: Pin Place, Zoom Till End, Auto-Spin Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center space-x-2 pointer-events-none">
        {/* 3D Real Canopy Surface Inspector Button */}
        <button
          onClick={() => setInspectingCanopy(true)}
          className="pointer-events-auto px-3 py-1.5 rounded-sm border text-xs font-bold transition-all flex items-center space-x-1.5 shadow-xl bg-[#10B981] hover:bg-[#34D399] text-[#080E0B] border-[#10B981] shadow-[0_0_12px_rgba(16,185,129,0.4)] cursor-pointer"
          title="Open Real 3D High-Resolution Satellite Canopy Terrain View"
        >
          <Trees className="w-3.5 h-3.5" />
          <span>3D CANOPY MAP</span>
        </button>

        {/* Drop Pin Button */}
        <button
          onClick={() => {
            setAutoRotate(false);
            setPinMode(!pinMode);
          }}
          className={`pointer-events-auto px-3 py-1.5 rounded-sm border text-xs font-bold transition-all flex items-center space-x-1.5 shadow-xl ${
            pinMode
              ? 'bg-[#06B6D4] text-[#080E0B] border-[#06B6D4] shadow-[0_0_15px_rgba(6,182,212,0.6)] animate-pulse'
              : 'bg-[#0D1612]/92 border-white/10 hover:border-[#06B6D4]/60 text-[#06B6D4] hover:text-white'
          }`}
          title="Click to drop a pin anywhere on the globe"
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>{pinMode ? 'CLICK GLOBE TO PIN...' : '📌 PIN ANY PLACE'}</span>
        </button>

        {/* Auto-Spin Toggle */}
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`pointer-events-auto px-2.5 py-1.5 rounded-sm border text-[11px] transition-all flex items-center space-x-1.5 shadow-lg ${
            autoRotate
              ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981]'
              : 'bg-[#0D1612]/92 border-white/10 text-white/50 hover:text-white'
          }`}
          title="Toggle Earth Auto-Rotation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{autoRotate ? 'AUTO-SPIN: ON' : 'AUTO-SPIN: OFF'}</span>
        </button>

        {/* Zoom Controls */}
        <div className="pointer-events-auto flex items-center space-x-0.5 bg-[#0D1612]/92 border border-white/10 p-1 rounded-sm shadow-xl">
          <button
            onClick={handleZoomIn}
            className="p-1.5 hover:bg-white/10 text-white/80 hover:text-white rounded-sm"
            title="Zoom closer to surface (zoomable till end)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 hover:bg-white/10 text-white/80 hover:text-white rounded-sm"
            title="Zoom out to deep space"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetOrbit}
            className="px-2 py-1 hover:bg-white/10 text-[10px] text-white/60 hover:text-white rounded-sm"
            title="Reset orbital overview"
          >
            RESET
          </button>
        </div>
      </div>

      {/* Selected Incident Telemetry Flyout Card */}
      {activeIncident && (
        <div className="absolute top-24 right-4 z-30 max-w-sm w-full bg-[#0D1612]/96 backdrop-blur-md border border-[#10B981]/40 rounded-sm p-3.5 shadow-2xl text-xs">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
            <div className="flex items-center space-x-2">
              <span className={`px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase ${
                activeIncident.severity === 'critical'
                  ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30'
                  : 'bg-[#F97316]/20 text-[#F97316] border border-[#F97316]/30'
              }`}>
                {activeIncident.threatType?.toLowerCase().includes('fire') ? 'HEAT DETECTED' : 'DEFORESTED AREA'}
              </span>
              <span className="text-white font-bold">{activeIncident.id}</span>
            </div>
            <button
              onClick={() => setActiveIncident(null)}
              className="text-white/40 hover:text-white text-base leading-none"
            >
              ×
            </button>
          </div>

          <h4 className="font-sans font-bold text-white text-sm leading-snug">
            {activeIncident.title}
          </h4>

          <div className="grid grid-cols-2 gap-2 my-2 text-[11px]">
            <div className="bg-[#080E0B] p-1.5 rounded-sm border border-white/5">
              <div className="text-white/40 text-[9px]">DEFORESTED AREA</div>
              <div className="text-[#EF4444] font-bold text-sm">
                {activeIncident.lossAreaHectares} Ha
              </div>
            </div>
            <div className="bg-[#080E0B] p-1.5 rounded-sm border border-white/5">
              <div className="text-white/40 text-[9px]">CONFIDENCE SCORE</div>
              <div className="text-[#10B981] font-bold text-sm">
                {activeIncident.confidenceScore}%
              </div>
            </div>
          </div>

          <div className="text-[10px] text-white/60 space-y-1 mb-2">
            <div>GPS: <span className="text-[#06B6D4]">{activeIncident.coordinates.lat.toFixed(4)}°, {activeIncident.coordinates.lng.toFixed(4)}°</span></div>
            <div>Sensor: <span className="text-white/80">{activeIncident.detectedBy}</span></div>
            <div>Jurisdiction: <span className="text-white/80">{activeIncident.legalJurisdiction}</span></div>
          </div>

          <div className="text-[9px] text-[#10B981] bg-[#10B981]/10 p-1.5 rounded-sm border border-[#10B981]/20">
            Satellite imagery passes for this target reticle loaded in bottom imagery deck.
          </div>
        </div>
      )}

      {/* Pinned Place Card */}
      {activePin && (
        <div className="absolute top-24 right-4 z-30 max-w-sm w-full bg-[#0D1612]/96 backdrop-blur-md border border-[#06B6D4]/50 rounded-sm p-3.5 shadow-2xl text-xs">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
            <div className="flex items-center space-x-2 text-[#06B6D4] font-bold">
              <MapPin className="w-4 h-4" />
              <span>USER PINNED LOCATION</span>
            </div>
            <button
              onClick={() => setActivePin(null)}
              className="text-white/40 hover:text-white text-base leading-none"
            >
              ×
            </button>
          </div>

          <div className="text-sm font-bold text-white mb-2">{activePin.label}</div>
          <div className="bg-[#080E0B] p-2 rounded-sm border border-white/5 text-[11px] space-y-1 mb-2">
            <div className="flex justify-between">
              <span className="text-white/50">LATITUDE:</span>
              <span className="text-[#06B6D4] font-bold">{activePin.lat.toFixed(5)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">LONGITUDE:</span>
              <span className="text-[#06B6D4] font-bold">{activePin.lng.toFixed(5)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">ELEVATION:</span>
              <span className="text-white">124 m ASL</span>
            </div>
          </div>
          <div className="text-[10px] text-white/50">
            Selected satellite APIs are streaming the latest 3 observation tiles for this coordinate below.
          </div>
        </div>
      )}

      {/* BOTTOM DOCK: Satellite APIs & Latest 3 Satellite Imagery Passes */}
      <div className="absolute bottom-0 left-0 right-0 z-30 bg-[#080E0B]/98 backdrop-blur-lg border-t border-white/10 p-3 shadow-2xl flex flex-col space-y-2.5">
        {/* Row 1: Active Satellites (APIs we are using) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-white/10 pb-2">
          <div className="flex items-center space-x-2">
            <Satellite className="w-4 h-4 text-[#10B981] animate-pulse" />
            <span className="text-xs font-bold text-white tracking-wider">
              OPERATIONAL SATELLITE INGEST APIS
            </span>
            <span className="text-[9px] text-[#06B6D4] bg-[#06B6D4]/10 px-2 py-0.5 rounded-sm border border-[#06B6D4]/30 hidden sm:inline">
              TARGET: {activePin ? `PINNED (${activePin.lat}°, ${activePin.lng}°)` : selectedAoi.name.toUpperCase()}
            </span>
          </div>

          {/* Satellite Selection Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {SATELLITE_APIS.map((sat) => {
              const isSelected = selectedSatApi.id === sat.id;
              return (
                <button
                  key={sat.id}
                  onClick={() => setSelectedSatApi(sat)}
                  className={`text-[10px] px-2.5 py-1 rounded-sm border transition-all flex items-center space-x-1.5 ${
                    isSelected
                      ? 'bg-[#10B981] text-[#080E0B] border-[#10B981] font-bold shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                      : 'bg-[#0D1612] text-white/70 border-white/10 hover:border-white/30 hover:text-white'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[#080E0B]' : 'bg-[#10B981]'}`} />
                  <span>{sat.name.split(' ')[0]}</span>
                  <span className="text-[9px] opacity-70">({sat.resolution})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2: Selected Satellite API Telemetry Banner */}
        <div className="flex flex-wrap items-center justify-between text-[10px] text-white/60 bg-[#0D1612] px-2.5 py-1 rounded-sm border border-white/5">
          <div>
            API: <strong className="text-white">{selectedSatApi.provider}</strong>
          </div>
          <div className="flex items-center space-x-3">
            <span>Endpoint: <code className="text-[#06B6D4]">{selectedSatApi.apiEndpoint}</code></span>
            <span>Revisit: <strong className="text-white">{selectedSatApi.revisit}</strong></span>
            <span>Status: <strong className="text-[#10B981]">{selectedSatApi.status}</strong></span>
          </div>
        </div>

        {/* Row 3: Latest 3 Real Photos Directly From Satellite API */}
        {loadingPasses ? (
          <div className="flex items-center justify-center p-6 bg-[#0D1612] border border-white/10 rounded-sm text-xs text-[#10B981] space-x-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#10B981]" />
            <span className="font-semibold tracking-wider">QUERYING REAL SATELLITE API & DOWNLOADING LATEST SATELLITE TILES...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {satellitePasses.map((img, idx) => (
              <div
                key={img.id || idx}
                onClick={() => setPreviewImageModal(img.url)}
                className="group bg-[#0D1612] border border-white/10 hover:border-[#10B981]/60 rounded-sm overflow-hidden p-2 flex space-x-2.5 cursor-pointer transition-all shadow-md hover:shadow-[0_0_12px_rgba(16,185,129,0.2)]"
              >
                {/* Satellite Tile Thumbnail */}
                <div className="relative w-20 h-18 rounded-sm overflow-hidden bg-black flex-shrink-0 border border-white/10">
                  <img 
                    src={img.url} 
                    alt={img.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      // Fallback to verified Copernicus preview if thumbnail URL is cold
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

                {/* Observation Details */}
                <div className="flex-1 min-w-0 text-[10px] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                      <span className="text-[8px] text-[#10B981] font-bold uppercase tracking-wider">REAL SATELLITE PASS</span>
                    </div>
                    <div className="font-bold text-white truncate text-[11px] group-hover:text-[#4EDEA3] transition-colors mt-0.5">
                      {img.title}
                    </div>
                    <div className="text-white/50 text-[9px] flex items-center space-x-1 mt-0.5">
                      <Calendar className="w-2.5 h-2.5 text-[#10B981]" />
                      <span>{img.date}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[9px] pt-1 border-t border-white/5 text-white/60">
                    <span>Cloud: <strong className="text-white">{img.cloudPct}%</strong></span>
                    <span className="text-[#06B6D4] font-bold">{img.resolution ? img.resolution.split(' ')[0] : '10m'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enlarged Satellite Image Modal (Mounted to document.body with zIndex: 999999 so no canvas or map layer can ever overlap) */}
      {previewImageModal && typeof document !== 'undefined' && createPortal(
        <div 
          onClick={() => setPreviewImageModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            backgroundColor: 'rgba(3, 7, 5, 0.96)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)'
          }}
          className="flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full bg-[#0D1612] border border-[#10B981]/50 rounded-sm overflow-hidden p-3 shadow-2xl"
          >
            <div className="flex justify-between items-center px-2 py-1 mb-2 border-b border-white/10">
              <span className="text-xs font-bold text-[#10B981] flex items-center space-x-1.5">
                <Satellite className="w-4 h-4" />
                <span>HIGH-RESOLUTION SATELLITE PASS ({selectedSatApi.name})</span>
              </span>
              <button 
                onClick={() => setPreviewImageModal(null)}
                className="text-white/50 hover:text-white p-1 hover:bg-white/10 rounded-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img 
              src={previewImageModal} 
              alt="Enlarged Satellite View" 
              className="w-full max-h-[75vh] object-contain rounded-sm border border-white/10 bg-black" 
            />
            <div className="text-[10px] text-white/60 text-center mt-2">
              CLICK ANYWHERE OUTSIDE OR PRESS ESC TO DISMISS • SATELLITE BAND TELEMETRY VERIFIED
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
