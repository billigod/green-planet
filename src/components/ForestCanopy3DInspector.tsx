import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { MonitoredAOI, Incident } from '../types';
import { 
  Globe, 
  MapPin, 
  Flame, 
  AlertTriangle, 
  Maximize2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Layers, 
  X, 
  Compass, 
  ChevronRight, 
  Sliders, 
  Trees,
  CheckCircle2,
  Calendar,
  Eye
} from 'lucide-react';

interface ForestCanopy3DInspectorProps {
  aoi: MonitoredAOI;
  allAois: MonitoredAOI[];
  onSelectAoi: (aoi: MonitoredAOI) => void;
  incidents: Incident[];
  onClose: () => void;
  onSelectIncident?: (incident: Incident) => void;
}

type SatelliteBasemap = 'google' | 'esri' | 'ndvi';

// Convert Lat/Lng to Slippy Map Tile Coordinates
function latLngToTile(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const latRad = (lat * Math.PI) / 180;
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180.0) / 360.0) * n);
  const y = Math.floor(((1.0 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2.0) * n);
  return { x, y };
}

export const ForestCanopy3DInspector: React.FC<ForestCanopy3DInspectorProps> = ({
  aoi,
  allAois,
  onSelectAoi,
  incidents,
  onClose,
  onSelectIncident
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [basemap, setBasemap] = useState<SatelliteBasemap>('google');
  const [activeIncident, setActiveIncident] = useState<Incident | null>(null);
  const [pitchAngle, setPitchAngle] = useState<number>(55); // degrees
  const [canopyLoaded, setCanopyLoaded] = useState<boolean>(false);
  const [showBoundaries, setShowBoundaries] = useState<boolean>(true);
  const [showIncidents, setShowIncidents] = useState<boolean>(true);

  // References
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const targetDistanceRef = useRef<number>(50);
  const targetRotationRef = useRef<{ x: number; y: number }>({ x: 0.7, y: 0 });
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);

  // Filter incidents for this AOI
  const aoiIncidents = useMemo(() => {
    return incidents.filter(i => i.aoiId === aoi.id || i.regionId === aoi.id);
  }, [incidents, aoi.id]);

  // Three.js 3D Canopy Setup
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || 800;
    const height = mountRef.current.clientHeight || 580;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040806);
    scene.fog = new THREE.FogExp2(0x040806, 0.007);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, -35, 45);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    mountRef.current.replaceChildren(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 2.0);
    sunLight.position.set(40, -50, 70);
    scene.add(sunLight);

    // Root Terrain Group
    const terrainGroup = new THREE.Group();
    scene.add(terrainGroup);

    // 1. Generate 3x3 High-Resolution Satellite Canvas Texture
    const zoomLevel = 13;
    const centerTile = latLngToTile(aoi.centerCoords.lat, aoi.centerCoords.lng, zoomLevel);

    const canvas = document.createElement('canvas');
    const tileSize = 256;
    canvas.width = tileSize * 3;
    canvas.height = tileSize * 3;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = '#0a1a10';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let loadedTiles = 0;
      const totalTiles = 9;

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const tx = centerTile.x + dx;
          const ty = centerTile.y + dy;
          const img = new Image();
          img.crossOrigin = 'anonymous';

          if (basemap === 'google') {
            img.src = `https://mt1.google.com/vt/lyrs=y&x=${tx}&y=${ty}&z=${zoomLevel}`;
          } else if (basemap === 'ndvi') {
            img.src = `https://mt1.google.com/vt/lyrs=s&x=${tx}&y=${ty}&z=${zoomLevel}`;
          } else {
            img.src = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoomLevel}/${ty}/${tx}`;
          }

          const px = (dx + 1) * tileSize;
          const py = (dy + 1) * tileSize;

          img.onload = () => {
            if (ctx) {
              ctx.drawImage(img, px, py, tileSize, tileSize);
              loadedTiles++;
              if (loadedTiles >= 4 && terrainMeshRef.current) {
                const mat = terrainMeshRef.current.material as THREE.MeshStandardMaterial;
                if (mat.map) mat.map.needsUpdate = true;
                setCanopyLoaded(true);
              }
            }
          };

          img.onerror = () => {
            loadedTiles++;
            // Fallback fill with tactical satellite color
            if (ctx) {
              ctx.fillStyle = '#11291b';
              ctx.fillRect(px, py, tileSize, tileSize);
            }
          };
        }
      }
    }

    const satelliteTexture = new THREE.CanvasTexture(canvas);
    satelliteTexture.wrapS = THREE.ClampToEdgeWrapping;
    satelliteTexture.wrapT = THREE.ClampToEdgeWrapping;
    satelliteTexture.generateMipmaps = true;
    satelliteTexture.minFilter = THREE.LinearMipmapLinearFilter;

    // 2. 3D Terrain Plane with Relief
    const planeSize = 80;
    const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize, 96, 96);
    
    // Add subtle procedural topographical relief based on coordinates
    const posAttr = planeGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const u = posAttr.getX(i) / (planeSize * 0.5);
      const v = posAttr.getY(i) / (planeSize * 0.5);
      const elevation = Math.sin(u * 3.5) * Math.cos(v * 3.5) * 2.8 + Math.cos(u * 7) * 1.2;
      posAttr.setZ(i, elevation);
    }
    planeGeo.computeVertexNormals();

    const planeMat = new THREE.MeshStandardMaterial({
      map: satelliteTexture,
      roughness: 0.85,
      metalness: 0.1,
      flatShading: false
    });

    const terrainMesh = new THREE.Mesh(planeGeo, planeMat);
    terrainGroup.add(terrainMesh);
    terrainMeshRef.current = terrainMesh;

    // 3. Forest Boundary 3D Perimeter Line
    if (showBoundaries && aoi.bounds && aoi.bounds.length === 4) {
      const hw = planeSize * 0.42;
      const hh = planeSize * 0.42;
      const pts = [
        new THREE.Vector3(-hw, -hh, 2.5),
        new THREE.Vector3(hw, -hh, 2.5),
        new THREE.Vector3(hw, hh, 2.5),
        new THREE.Vector3(-hw, hh, 2.5),
        new THREE.Vector3(-hw, -hh, 2.5)
      ];
      const boundaryLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: 0x10b981, linewidth: 2 })
      );
      terrainGroup.add(boundaryLine);

      // Translucent boundary fill
      const fillGeo = new THREE.PlaneGeometry(hw * 2, hh * 2);
      const fillMat = new THREE.MeshBasicMaterial({
        color: 0x10b981,
        transparent: true,
        opacity: 0.08,
        side: THREE.DoubleSide
      });
      const fillMesh = new THREE.Mesh(fillGeo, fillMat);
      fillMesh.position.z = 1.0;
      terrainGroup.add(fillMesh);
    }

    // 4. Incident Overlays: Heat & Deforestation Markers in 3D
    const incidentClickableObjects: { mesh: THREE.Mesh; incident: Incident }[] = [];
    if (showIncidents) {
      aoiIncidents.forEach((inc, idx) => {
        const isHeat = inc.threatType?.toLowerCase().includes('fire') || 
                       inc.threatType?.toLowerCase().includes('thermal') ||
                       inc.severity === 'critical';

        const color = isHeat ? 0xef4444 : 0xf97316;
        
        // Relative offset from forest center
        const offsetX = ((idx % 3) - 1) * 14;
        const offsetY = ((Math.floor(idx / 3) % 3) - 1) * 14;

        // 3D Incident Marker Pin
        const markerGeo = new THREE.SphereGeometry(1.6, 20, 20);
        const markerMat = new THREE.MeshBasicMaterial({ color });
        const markerMesh = new THREE.Mesh(markerGeo, markerMat);
        markerMesh.position.set(offsetX, offsetY, 3.5);
        markerMesh.userData = { incident: inc };
        terrainGroup.add(markerMesh);
        incidentClickableObjects.push({ mesh: markerMesh, incident: inc });

        // Pulsing Ring
        const ringGeo = new THREE.RingGeometry(1.8, 3.2, 24);
        const ringMat = new THREE.MeshBasicMaterial({
          color,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.6
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.set(offsetX, offsetY, 3.4);
        terrainGroup.add(ringMesh);

        // Deforestation Polygon Area
        const defoPolyGeo = new THREE.BufferGeometry();
        const polyPts = [
          new THREE.Vector3(offsetX - 5, offsetY - 5, 2.0),
          new THREE.Vector3(offsetX + 6, offsetY - 3, 2.0),
          new THREE.Vector3(offsetX + 4, offsetY + 6, 2.0),
          new THREE.Vector3(offsetX - 4, offsetY + 4, 2.0)
        ];
        defoPolyGeo.setFromPoints(polyPts);
        const defoLine = new THREE.LineLoop(
          defoPolyGeo,
          new THREE.LineBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.85 })
        );
        terrainGroup.add(defoLine);
      });
    }

    // 5. Mouse Interaction for 3D Orbit, Tilt & Pan
    let isDragging = false;
    let isRightDragging = false;
    let prevMouse = { x: 0, y: 0 };
    const raycaster = new THREE.Raycaster();
    const mouseVec = new THREE.Vector2();

    const onPointerDown = (e: MouseEvent) => {
      if (e.button === 2 || e.shiftKey) {
        isRightDragging = true;
      } else {
        isDragging = true;
      }
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: MouseEvent) => {
      const rect = mountRef.current?.getBoundingClientRect();
      if (!rect) return;
      mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging) {
        const dx = e.clientX - prevMouse.x;
        const dy = e.clientY - prevMouse.y;

        targetRotationRef.current.y += dx * 0.007;
        targetRotationRef.current.x = Math.max(0.1, Math.min(1.4, targetRotationRef.current.x + dy * 0.007));
        setPitchAngle(Math.round((targetRotationRef.current.x / 1.4) * 85));
        prevMouse = { x: e.clientX, y: e.clientY };
      } else if (isRightDragging) {
        const dx = e.clientX - prevMouse.x;
        const dy = e.clientY - prevMouse.y;
        terrainGroup.position.x += dx * 0.08;
        terrainGroup.position.y -= dy * 0.08;
        prevMouse = { x: e.clientX, y: e.clientY };
      }
    };

    const onPointerUp = (e: MouseEvent) => {
      if (!isDragging && !isRightDragging) {
        // Raycast against incident markers
        raycaster.setFromCamera(mouseVec, camera);
        const intersects = raycaster.intersectObjects(incidentClickableObjects.map(i => i.mesh));
        if (intersects.length > 0) {
          const inc = intersects[0].object.userData.incident as Incident;
          if (inc) {
            setActiveIncident(inc);
            if (onSelectIncident) onSelectIncident(inc);
          }
        }
      }
      isDragging = false;
      isRightDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY * 0.05;
      targetDistanceRef.current = Math.max(8, Math.min(110, targetDistanceRef.current + zoomFactor));
    };

    const domEl = mountRef.current;
    domEl.addEventListener('pointerdown', onPointerDown);
    domEl.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    domEl.addEventListener('wheel', onWheel, { passive: false });
    domEl.addEventListener('contextmenu', e => e.preventDefault());

    // 6. Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Smooth camera orbit & tilt interpolation
      const dist = targetDistanceRef.current;
      const rotX = targetRotationRef.current.x;
      const rotY = targetRotationRef.current.y;

      camera.position.x = terrainGroup.position.x + dist * Math.sin(rotY) * Math.cos(rotX);
      camera.position.y = terrainGroup.position.y - dist * Math.cos(rotY) * Math.cos(rotX);
      camera.position.z = Math.max(4, dist * Math.sin(rotX));
      camera.lookAt(terrainGroup.position.x, terrainGroup.position.y, 0);

      renderer.render(scene, camera);
    };

    animate();

    const onResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth || 800;
      const h = mountRef.current.clientHeight || 580;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      domEl.removeEventListener('pointerdown', onPointerDown);
      domEl.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      domEl.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      satelliteTexture.dispose();
      planeGeo.dispose();
      planeMat.dispose();
    };
  }, [aoi, basemap, showBoundaries, showIncidents, aoiIncidents]);

  return (
    <div className="relative w-full h-[calc(100vh-140px)] min-h-[580px] flex flex-col bg-[#040806] select-none overflow-hidden font-mono text-white">
      {/* 3D WebGL Canvas */}
      <div 
        ref={mountRef} 
        className="flex-1 w-full h-full min-h-[500px] cursor-grab active:cursor-grabbing"
        title="Left drag to rotate 3D, Right drag / Shift-drag to pan, Scroll to zoom deep"
      />

      {/* Top Header Bar: Forest Identity & Return to 3D Globe Button */}
      <div className="absolute top-3 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Forest Title & Region Selector */}
        <div className="pointer-events-auto flex items-center space-x-2 bg-[#0D1612]/95 backdrop-blur-md border border-[#10B981]/50 px-3 py-2 rounded-sm shadow-2xl">
          <Trees className="w-5 h-5 text-[#10B981]" />
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white text-sm tracking-wide">{aoi.name}</span>
              <span className="text-[10px] bg-[#10B981]/20 text-[#10B981] font-bold px-1.5 py-0.5 rounded-sm">
                3D HIGH-RES CANOPY
              </span>
            </div>
            <div className="text-[10px] text-white/60">
              {aoi.protectedZone} • <strong className="text-white">{aoi.country}</strong>
            </div>
          </div>
        </div>

        {/* Center: Basemap Switcher (Free Public Satellite Imagery) */}
        <div className="pointer-events-auto flex items-center space-x-1 bg-[#0D1612]/95 backdrop-blur-md border border-white/10 p-1 rounded-sm text-xs shadow-xl">
          <span className="text-white/40 px-1 text-[10px] hidden sm:inline">IMAGERY:</span>
          <button
            onClick={() => setBasemap('google')}
            className={`px-2.5 py-1 rounded-sm transition-all font-bold ${
              basemap === 'google' 
                ? 'bg-[#10B981] text-[#080E0B]' 
                : 'text-white/70 hover:text-white'
            }`}
          >
            GOOGLE SATELLITE
          </button>
          <button
            onClick={() => setBasemap('esri')}
            className={`px-2.5 py-1 rounded-sm transition-all font-bold ${
              basemap === 'esri' 
                ? 'bg-[#10B981] text-[#080E0B]' 
                : 'text-white/70 hover:text-white'
            }`}
          >
            ESRI AERIAL
          </button>
          <button
            onClick={() => setBasemap('ndvi')}
            className={`px-2.5 py-1 rounded-sm transition-all font-bold ${
              basemap === 'ndvi' 
                ? 'bg-[#06B6D4] text-[#080E0B]' 
                : 'text-white/70 hover:text-white'
            }`}
          >
            CANOPY OPTICAL
          </button>
        </div>

        {/* Right: Return to Orbital Globe Button */}
        <div className="pointer-events-auto flex items-center space-x-2">
          <button
            onClick={onClose}
            className="px-3.5 py-2 bg-[#10B981] hover:bg-[#34D399] text-[#080E0B] font-bold text-xs rounded-sm shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center space-x-2 transition-all cursor-pointer"
            title="Return to global 3D Earth Globe view"
          >
            <Globe className="w-4 h-4" />
            <span>🌍 RETURN TO 3D GLOBE</span>
          </button>
        </div>
      </div>

      {/* Forest Sectors Switcher Pill Bar (Bottom-Left) */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-none max-w-lg">
        <div className="pointer-events-auto bg-[#0D1612]/95 backdrop-blur-md border border-white/10 p-2 rounded-sm shadow-2xl flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] text-white/50 font-bold px-1">SWITCH FOREST:</span>
          {allAois.slice(0, 6).map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectAoi(item)}
              className={`text-[10px] px-2 py-1 rounded-sm border transition-all flex items-center space-x-1 ${
                item.id === aoi.id
                  ? 'bg-[#10B981] text-[#080E0B] border-[#10B981] font-bold'
                  : 'bg-[#080E0B]/80 text-white/70 border-white/10 hover:text-white hover:border-[#10B981]/50'
              }`}
            >
              <span>{item.name.split(' ')[0]}</span>
              <span className="text-[8px] opacity-70">({item.country.includes('India') ? '🇮🇳' : (item.country.includes('Brazil') ? '🇧🇷' : '🌐')})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Floating 3D Controls (Bottom-Right) */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center space-x-2 pointer-events-none">
        <div className="pointer-events-auto bg-[#0D1612]/95 backdrop-blur-md border border-white/10 p-1.5 rounded-sm shadow-xl flex items-center space-x-1 text-xs">
          <button
            onClick={() => {
              targetDistanceRef.current = Math.max(8, targetDistanceRef.current - 12);
            }}
            className="p-1.5 hover:bg-white/10 text-white/80 hover:text-white rounded-sm"
            title="Zoom In (Close to Tree Canopy)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              targetDistanceRef.current = Math.min(110, targetDistanceRef.current + 12);
            }}
            className="p-1.5 hover:bg-white/10 text-white/80 hover:text-white rounded-sm"
            title="Zoom Out (Aerial View)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              targetRotationRef.current = { x: 0.7, y: 0 };
              targetDistanceRef.current = 50;
            }}
            className="px-2 py-1 hover:bg-white/10 text-[10px] text-white/70 hover:text-white rounded-sm"
            title="Reset 3D Angle"
          >
            RESET 3D
          </button>
        </div>

        {/* 3D Pitch Angle Readout */}
        <div className="pointer-events-auto bg-[#0D1612]/95 backdrop-blur-md border border-white/10 px-2.5 py-1.5 rounded-sm shadow-xl text-[10px] text-white/70">
          <span>PITCH: <strong className="text-[#10B981]">{pitchAngle}°</strong></span>
        </div>
      </div>

      {/* Selected Incident Details Drawer */}
      {activeIncident && (
        <div className="absolute top-20 right-4 z-30 max-w-sm w-full bg-[#0D1612]/96 backdrop-blur-md border border-[#10B981]/40 rounded-sm p-3.5 shadow-2xl text-xs font-mono">
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
              <div className="text-white/40 text-[9px]">ALGORITHM CONFIDENCE</div>
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
        </div>
      )}
    </div>
  );
};
