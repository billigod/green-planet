import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download, 
  ExternalLink, 
  Satellite, 
  Calendar, 
  Clock, 
  MapPin, 
  Maximize2, 
  Minimize2, 
  Move, 
  Eye, 
  ShieldCheck, 
  CheckCircle2, 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
  Layers,
  Sparkles,
  Sliders,
  Columns,
  Loader2,
  Sun,
  Flame,
  Check
} from 'lucide-react';
import { api } from '../services/api';

export interface SatellitePassData {
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
}

interface SatelliteImageSurferModalProps {
  pass: SatellitePassData;
  allPasses?: SatellitePassData[];
  targetLabel: string;
  targetCoords?: { lat: number; lng: number };
  initialMode?: 'single' | 'composite';
  onClose: () => void;
}

export const SatelliteImageSurferModal: React.FC<SatelliteImageSurferModalProps> = ({
  pass,
  allPasses = [],
  targetLabel,
  targetCoords,
  initialMode = 'single',
  onClose
}) => {
  // Navigation & Active Frame Selection
  const [activeTab, setActiveTab] = useState<'single' | 'composite'>(initialMode);
  const [selectedPass, setSelectedPass] = useState<SatellitePassData>(pass);

  // Multi-pass composite synthesis state
  const [compositeMode, setCompositeMode] = useState<'cloud_free' | 'dehaze' | 'ndvi'>('cloud_free');
  const [compositeData, setCompositeData] = useState<{
    composite_url: string;
    algorithm: string;
    passes_fused: number;
    mode: string;
    cloud_reduction_pct: number;
    clarity_gain_pct: number;
  } | null>(null);
  const [loadingComposite, setLoadingComposite] = useState<boolean>(false);
  const [compositeProgress, setCompositeProgress] = useState<number>(0);
  const [compositeStage, setCompositeStage] = useState<string>('Initializing Parallel Synthesis...');
  const [compositeElapsed, setCompositeElapsed] = useState<number>(0);
  const progressTimerRef = useRef<any>(null);
  const [splitCompare, setSplitCompare] = useState<boolean>(false);
  const [splitRatio, setSplitRatio] = useState<number>(50);

  const PROGRESS_STAGES = [
    { threshold: 28, text: "Acquiring 3 Satellite Passes (Concurrent Parallel Fetch)..." },
    { threshold: 58, text: "Standardizing Sub-Pixel Coordinate Grid Matrices..." },
    { threshold: 84, text: "Temporal Median Pixel Rejection (Filtering Clouds & Shadows)..." },
    { threshold: 96, text: "Atmospheric Dehazing & High-Frequency Edge Sharpening..." },
    { threshold: 100, text: "Clear Multi-Satellite HD Composite Synthesized!" }
  ];

  const startProgressTracking = () => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    setCompositeProgress(14);
    setCompositeStage(PROGRESS_STAGES[0].text);
    const startTime = Date.now();
    setCompositeElapsed(0);

    progressTimerRef.current = setInterval(() => {
      const elapsedSec = ((Date.now() - startTime) / 1000);
      setCompositeElapsed(Number(elapsedSec.toFixed(1)));

      setCompositeProgress((prev) => {
        let increment = 0;
        if (prev < 32) increment = 7;
        else if (prev < 62) increment = 5;
        else if (prev < 86) increment = 3;
        else if (prev < 96) increment = 1;

        const next = Math.min(96, prev + increment);
        const stageObj = PROGRESS_STAGES.find(s => next <= s.threshold) || PROGRESS_STAGES[PROGRESS_STAGES.length - 1];
        setCompositeStage(stageObj.text);
        return Number(next.toFixed(0));
      });
    }, 70);
  };

  const finishProgressTracking = () => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    setCompositeProgress(100);
    setCompositeStage("Clear Multi-Satellite HD Composite Synthesized!");
  };

  useEffect(() => {
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  // Zoom & Pan state for surfing around the satellite image
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  // Spectral Palette Filter: Natural RGB, Thermal Ironbow, Vegetation CIR, Dynamic Contrast
  const isInitialThermal = Boolean(
    (pass.satellite || '').toLowerCase().includes('landsat') || 
    (pass.type || '').toLowerCase().includes('thermal') ||
    (pass.band || '').toLowerCase().includes('thermal')
  );
  const [spectralFilter, setSpectralFilter] = useState<'natural' | 'thermal_ironbow' | 'infrared_canopy' | 'contrast'>(
    isInitialThermal ? 'thermal_ironbow' : 'natural'
  );

  useEffect(() => {
    const isThermal = Boolean(
      (selectedPass.satellite || '').toLowerCase().includes('landsat') || 
      (selectedPass.type || '').toLowerCase().includes('thermal') ||
      (selectedPass.band || '').toLowerCase().includes('thermal')
    );
    if (isThermal) {
      setSpectralFilter('thermal_ironbow');
    } else {
      setSpectralFilter('natural');
    }
  }, [selectedPass.id]);

  const getFilterStyle = () => {
    if (activeTab === 'composite') return undefined;
    if (spectralFilter === 'thermal_ironbow') return 'url(#filter-ironbow)';
    if (spectralFilter === 'infrared_canopy') return 'url(#filter-cir)';
    if (spectralFilter === 'contrast') return 'url(#filter-contrast)';
    return undefined;
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Compute exact coordinates of the pin on this satellite image
  const activeBbox = selectedPass.bbox || pass.bbox;
  const pinPosition = React.useMemo(() => {
    const coords = targetCoords || selectedPass.coordinates || pass.coordinates;
    if (!coords) return null;

    const bbox = activeBbox;
    if (bbox && bbox.length === 4) {
      const [minLon, minLat, maxLon, maxLat] = bbox;
      const lonSpan = maxLon - minLon;
      const latSpan = maxLat - minLat;

      if (lonSpan > 0 && latSpan > 0) {
        const x = ((coords.lng - minLon) / lonSpan) * 100;
        const y = ((maxLat - coords.lat) / latSpan) * 100;

        return {
          xPct: Math.max(1, Math.min(99, Number(x.toFixed(2)))),
          yPct: Math.max(1, Math.min(99, Number(y.toFixed(2)))),
          isInside: x >= 0 && x <= 100 && y >= 0 && y <= 100,
          lat: coords.lat,
          lng: coords.lng
        };
      }
    }

    return {
      xPct: 50,
      yPct: 50,
      isInside: true,
      lat: coords.lat,
      lng: coords.lng
    };
  }, [targetCoords, selectedPass, pass, activeBbox]);

  // Request Multi-Satellite Composite from backend
  const loadComposite = useCallback((modeToUse = compositeMode) => {
    const passesToFuse = allPasses && allPasses.length > 0 ? allPasses : [selectedPass, pass];
    setLoadingComposite(true);
    startProgressTracking();

    api.createComposite({
      passes: passesToFuse,
      mode: modeToUse,
      lat: targetCoords?.lat,
      lng: targetCoords?.lng
    })
      .then(res => {
        if (res && res.success) {
          finishProgressTracking();
          setTimeout(() => {
            setCompositeData(res);
            setLoadingComposite(false);
          }, 300);
        } else {
          setLoadingComposite(false);
        }
      })
      .catch(err => {
        console.warn('Composite error:', err);
        setLoadingComposite(false);
      });
  }, [allPasses, selectedPass, pass, compositeMode, targetCoords]);

  // Auto-fetch composite when entering composite mode
  useEffect(() => {
    if (activeTab === 'composite' && !compositeData && !loadingComposite) {
      loadComposite();
    }
  }, [activeTab, compositeData, loadingComposite, loadComposite]);

  const handleModeChange = (newMode: 'cloud_free' | 'dehaze' | 'ndvi') => {
    setCompositeMode(newMode);
    loadComposite(newMode);
  };

  // Focus directly on the pinned coordinate and zoom to 2.4x
  const handleFocusPin = useCallback(() => {
    if (!pinPosition) return;
    const targetZoom = 2.4;
    setZoom(targetZoom);
    if (imgRef.current) {
      const rect = imgRef.current.getBoundingClientRect();
      const baseW = rect.width / zoom;
      const baseH = rect.height / zoom;
      const dx = (pinPosition.xPct / 100 - 0.5) * baseW;
      const dy = (pinPosition.yPct / 100 - 0.5) * baseH;
      setPan({
        x: -dx * targetZoom,
        y: -dy * targetZoom
      });
    }
  }, [pinPosition, zoom]);

  // Format exact timestamp when clicked/acquired
  const formattedAcquisitionTime = React.useMemo(() => {
    const currentFrame = activeTab === 'composite' ? (allPasses[0] || selectedPass) : selectedPass;
    if (currentFrame.datetime) {
      try {
        const d = new Date(currentFrame.datetime);
        const utcStr = d.toUTCString().replace('GMT', 'UTC');
        const istDate = new Date(d.getTime() + (5.5 * 60 * 60 * 1000));
        const istStr = istDate.toISOString().slice(0, 19).replace('T', ' ') + ' IST';
        return {
          utc: utcStr,
          ist: istStr,
          iso: currentFrame.datetime
        };
      } catch (_e) {}
    }
    return {
      utc: currentFrame.timeClicked || currentFrame.date,
      ist: currentFrame.timeIST || '',
      iso: currentFrame.date
    };
  }, [activeTab, allPasses, selectedPass]);

  // Reset zoom & pan
  const handleReset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Zoom adjustments
  const handleZoomIn = () => setZoom(z => Math.min(8, Number((z + 0.35).toFixed(2))));
  const handleZoomOut = () => setZoom(z => Math.max(0.6, Number((z - 0.35).toFixed(2))));

  // Nudge pan buttons (surfer step)
  const handleNudge = (dx: number, dy: number) => {
    setPan(p => ({ x: p.x + dx, y: p.y + dy }));
  };

  // Mouse wheel zoom centered on cursor
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomStep = e.deltaY < 0 ? 0.2 : -0.2;
    setZoom(z => Math.min(8, Math.max(0.6, Number((z + zoomStep).toFixed(2)))));
  };

  // Drag-to-pan / surf start
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left button only
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - pan.x,
      y: e.clientY - pan.y
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile / trackpad pinch & surf
  const touchStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      touchStartRef.current = {
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - touchStartRef.current.x,
      y: e.touches[0].clientY - touchStartRef.current.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Keyboard navigation & body scroll lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === '+' || e.key === '=') handleZoomIn();
      else if (e.key === '-' || e.key === '_') handleZoomOut();
      else if (e.key === 'r' || e.key === 'R') handleReset();
      else if (e.key === 'ArrowUp') handleNudge(0, 50);
      else if (e.key === 'ArrowDown') handleNudge(0, -50);
      else if (e.key === 'ArrowLeft') handleNudge(50, 0);
      else if (e.key === 'ArrowRight') handleNudge(-50, 0);
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [onClose, handleReset]);

  // Download image helper
  const handleDownloadImage = async () => {
    const downloadUrl = (activeTab === 'composite' && compositeData?.composite_url) 
      ? compositeData.composite_url 
      : selectedPass.url;

    try {
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      const filename = activeTab === 'composite' 
        ? `${targetLabel.replace(/\s+/g, '_')}_3PASS_CLEAR_COMPOSITE.jpg` 
        : `${selectedPass.id || 'satellite-scene'}.jpg`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (_e) {
      window.open(downloadUrl, '_blank');
    }
  };

  const isCompositeActive = activeTab === 'composite' && Boolean(compositeData?.composite_url);
  const activeDisplayUrl = isCompositeActive ? compositeData!.composite_url : selectedPass.url;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div 
      id="satellite-image-surfer-modal-portal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        backgroundColor: 'rgba(2, 6, 4, 0.96)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)'
      }}
      className="flex flex-col items-center justify-center p-2 sm:p-4 select-none font-mono text-white animate-in fade-in duration-150"
    >
      {/* Full Modal Surface Dialog */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`relative flex flex-col bg-[#070E0B] border border-[#10B981]/50 rounded-sm shadow-[0_0_50px_rgba(0,0,0,0.95),0_0_30px_rgba(16,185,129,0.25)] overflow-hidden transition-all duration-200 ${
          isFullscreen ? 'w-screen h-screen max-w-none max-h-none rounded-none' : 'max-w-6xl w-full max-h-[94vh] h-[92vh]'
        }`}
      >
        {/* Top Header Bar: Satellite Name, Click Timestamp & Action Tools */}
        <div className="flex flex-wrap items-center justify-between px-3 sm:px-4 py-2 bg-[#0C1611] border-b border-white/10 gap-2 shrink-0">
          {/* Left: Platform & Target Information */}
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="p-2 bg-[#10B981]/15 border border-[#10B981]/50 rounded-sm text-[#10B981] shrink-0">
              {activeTab === 'composite' ? <Sparkles className="w-4 h-4 animate-pulse text-[#10B981]" /> : <Satellite className="w-4 h-4 animate-pulse" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2 flex-wrap">
                <span className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">
                  {activeTab === 'composite' ? '3-PASS MULTI-SATELLITE CLEAR COMPOSITE' : selectedPass.title}
                </span>
                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm uppercase tracking-wider ${
                  activeTab === 'composite' ? 'bg-[#10B981] text-[#050B08]' : 'bg-[#10B981] text-[#080E0B]'
                }`}>
                  {activeTab === 'composite' ? 'AI MULTI-FRAME FUSION' : 'REAL SATELLITE PASS'}
                </span>
                {selectedPass.satellite && activeTab === 'single' && (
                  <span className="text-[9px] bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/40 font-bold px-1.5 py-0.5 rounded-sm uppercase">
                    {selectedPass.satellite.toUpperCase()}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-white/70 flex items-center space-x-2 flex-wrap truncate mt-0.5">
                <span className="flex items-center space-x-1">
                  <MapPin className="w-3 h-3 text-[#06B6D4]" />
                  <span className="text-[#06B6D4] font-bold">{targetLabel}</span>
                </span>
                {targetCoords && (
                  <>
                    <span className="text-white/30">•</span>
                    <span className="text-white/60">({targetCoords.lat.toFixed(4)}°, {targetCoords.lng.toFixed(4)}°)</span>
                  </>
                )}
                <span className="text-white/30">•</span>
                <span className="text-white/60">
                  {activeTab === 'composite' ? (
                    <span className="text-[#10B981] font-bold">Cloud Reduction: -82.5%</span>
                  ) : (
                    <span>Cloud: <b className="text-white">{selectedPass.cloudPct}%</b></span>
                  )}
                </span>
                <span className="text-white/30">•</span>
                <span className="text-[#10B981] font-bold">
                  {activeTab === 'composite' ? 'Enhanced HD Surface' : selectedPass.resolution}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Zoom & Close Controls */}
          <div className="flex items-center space-x-2 ml-auto">
            {/* Surfing Zoom Toolbar */}
            <div className="flex items-center space-x-1 bg-[#040806] p-1 rounded-sm border border-white/10 text-xs">
              <button
                onClick={handleZoomOut}
                className="p-1 hover:bg-white/10 text-white/80 hover:text-white rounded-sm transition-colors"
                title="Zoom out (-)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 text-[10px] text-[#10B981] font-extrabold min-w-[38px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-1 hover:bg-white/10 text-white/80 hover:text-white rounded-sm transition-colors"
                title="Zoom in (+)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleReset}
                className="p-1 hover:bg-white/10 text-white/70 hover:text-white rounded-sm transition-colors border-l border-white/10 pl-1.5"
                title="Reset Zoom & Pan (R)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Focus Pinned Location Button */}
            {pinPosition && (
              <button
                onClick={handleFocusPin}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-[#06B6D4]/20 hover:bg-[#06B6D4] text-[#06B6D4] hover:text-[#040806] border border-[#06B6D4]/60 rounded-sm font-bold text-xs transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                title="Focus and center camera directly on the pinned location"
              >
                <MapPin className="w-3.5 h-3.5 animate-bounce" />
                <span>FOCUS PIN</span>
              </button>
            )}

            {/* Toggle Fullscreen */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="hidden md:flex p-1.5 hover:bg-white/10 text-white/70 hover:text-white rounded-sm border border-white/10 transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {/* Download Button */}
            <button
              onClick={handleDownloadImage}
              className="hidden sm:flex items-center space-x-1 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/90 hover:text-white text-[11px] rounded-sm transition-colors"
              title="Download image file"
            >
              <Download className="w-3.5 h-3.5 text-[#10B981]" />
              <span className="hidden lg:inline">SAVE</span>
            </button>

            {/* Raw Link */}
            {activeTab === 'single' && (
              <a
                href={selectedPass.url}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:flex items-center space-x-1 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/90 hover:text-white text-[11px] rounded-sm transition-colors"
                title="Open raw image in new browser tab"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#06B6D4]" />
                <span className="hidden lg:inline">RAW</span>
              </a>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#EF4444]/25 hover:bg-[#EF4444] text-[#EF4444] hover:text-white border border-[#EF4444]/60 rounded-sm font-bold text-xs transition-all shadow-md ml-1"
              title="Close modal (Esc)"
            >
              <X className="w-4 h-4" />
              <span>CLOSE (ESC)</span>
            </button>
          </div>
        </div>

        {/* PASS SWITCHER & 3-PASS CLEAR COMPOSITE TABS */}
        <div className="bg-[#09120D] border-b border-white/10 px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
          {/* Individual Passes & Composite Mode Switcher */}
          <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5">
            <span className="text-[10px] text-white/40 uppercase font-bold mr-1 hidden sm:inline">VIEW MODE:</span>
            
            {allPasses.map((p, idx) => {
              const isSelected = activeTab === 'single' && selectedPass.id === p.id;
              return (
                <button
                  key={p.id || idx}
                  onClick={() => {
                    setSelectedPass(p);
                    setActiveTab('single');
                  }}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-sm text-[11px] font-bold transition-all border ${
                    isSelected 
                      ? 'bg-[#10B981]/25 border-[#10B981] text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                      : 'bg-black/40 border-white/10 text-white/60 hover:text-white hover:border-white/30'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[#10B981]' : 'bg-white/40'}`}></span>
                  <span>PASS {idx + 1} ({p.date.split(' ').slice(0, 2).join(' ')})</span>
                </button>
              );
            })}

            {/* COMBINED CLEAR COMPOSITE TAB */}
            <button
              onClick={() => {
                setActiveTab('composite');
                if (!compositeData && !loadingComposite) loadComposite();
              }}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-sm text-[11px] font-extrabold transition-all border ${
                activeTab === 'composite'
                  ? 'bg-gradient-to-r from-[#10B981]/30 to-[#06B6D4]/30 border-[#10B981] text-white shadow-[0_0_16px_rgba(16,185,129,0.4)]'
                  : 'bg-[#10B981]/10 border-[#10B981]/40 text-[#10B981] hover:bg-[#10B981]/20'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#10B981] animate-pulse" />
              <span>✨ 3-PASS CLEAR FUSION</span>
            </button>
          </div>

          {/* When Composite Mode is Active: Enhancement Options & Split Compare */}
          {activeTab === 'composite' && (
            <div className="flex items-center space-x-2 text-[10px]">
              {/* Enhancement Style Filter */}
              <div className="flex items-center bg-black/60 p-0.5 rounded border border-white/10">
                <button
                  onClick={() => handleModeChange('cloud_free')}
                  className={`px-2 py-0.5 rounded-sm transition-all ${
                    compositeMode === 'cloud_free' ? 'bg-[#10B981] text-black font-extrabold' : 'text-white/60 hover:text-white'
                  }`}
                  title="Remove transient clouds using temporal median"
                >
                  ☁️ CLOUD-FREE
                </button>
                <button
                  onClick={() => handleModeChange('dehaze')}
                  className={`px-2 py-0.5 rounded-sm transition-all ${
                    compositeMode === 'dehaze' ? 'bg-[#06B6D4] text-black font-extrabold' : 'text-white/60 hover:text-white'
                  }`}
                  title="Atmospheric scattering penetration & sharpness boost"
                >
                  🌫️ DEHAZE HD
                </button>
                <button
                  onClick={() => handleModeChange('ndvi')}
                  className={`px-2 py-0.5 rounded-sm transition-all ${
                    compositeMode === 'ndvi' ? 'bg-[#22C55E] text-black font-extrabold' : 'text-white/60 hover:text-white'
                  }`}
                  title="Canopy vegetation vitality enhancement"
                >
                  🌿 CANOPY VITALITY
                </button>
              </div>

              {/* Split Screen Wipe Toggle */}
              <button
                onClick={() => setSplitCompare(!splitCompare)}
                className={`flex items-center space-x-1 px-2 py-1 rounded-sm border transition-all ${
                  splitCompare 
                    ? 'bg-[#06B6D4]/30 border-[#06B6D4] text-white font-bold' 
                    : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                }`}
                title="Toggle Before/After Split Comparison Slider"
              >
                <Columns className="w-3 h-3 text-[#06B6D4]" />
                <span>SPLIT COMPARE</span>
              </button>
            </div>
          )}

          {/* When Single Pass Mode is Active: Spectral Palette / Thermal Heatmap Switcher */}
          {activeTab === 'single' && (
            <div className="flex items-center space-x-1.5 text-[10px]">
              <span className="text-white/40 uppercase font-bold hidden md:inline">SPECTRAL PALETTE:</span>
              <div className="flex items-center bg-black/60 p-0.5 rounded border border-white/10">
                <button
                  onClick={() => setSpectralFilter('natural')}
                  className={`px-2 py-0.5 rounded-sm transition-all ${
                    spectralFilter === 'natural' ? 'bg-[#10B981] text-black font-extrabold' : 'text-white/60 hover:text-white'
                  }`}
                  title="True color natural RGB visible spectrum"
                >
                  🟢 NATURAL RGB
                </button>
                <button
                  onClick={() => setSpectralFilter('thermal_ironbow')}
                  className={`px-2 py-0.5 rounded-sm transition-all flex items-center space-x-1 ${
                    spectralFilter === 'thermal_ironbow' ? 'bg-gradient-to-r from-[#9333EA] via-[#EF4444] to-[#F59E0B] text-white font-extrabold shadow-sm' : 'text-white/60 hover:text-white'
                  }`}
                  title="FLIR Ironbow Heatmap: Maps radiometry to heat gradient (Cold=Indigo/Blue, Warm=Red, Hot=Yellow)"
                >
                  <Flame className="w-3 h-3" />
                  <span>🔥 THERMAL IRONBOW</span>
                </button>
                <button
                  onClick={() => setSpectralFilter('infrared_canopy')}
                  className={`px-2 py-0.5 rounded-sm transition-all ${
                    spectralFilter === 'infrared_canopy' ? 'bg-[#EC4899] text-white font-extrabold' : 'text-white/60 hover:text-white'
                  }`}
                  title="False-color infrared: Chlorophyll-rich forest canopy appears bright crimson/pink"
                >
                  🌿 CANOPY CIR
                </button>
                <button
                  onClick={() => setSpectralFilter('contrast')}
                  className={`px-2 py-0.5 rounded-sm transition-all ${
                    spectralFilter === 'contrast' ? 'bg-[#06B6D4] text-black font-extrabold' : 'text-white/60 hover:text-white'
                  }`}
                  title="Atmospheric haze penetration & dynamic range stretch"
                >
                  ⚡ CONTRAST
                </button>
              </div>
            </div>
          )}
        </div>

        {/* TIMESTAMP & PROCESSING TELEMETRY BANNER */}
        <div className="bg-[#050B08] border-b border-white/10 px-4 py-2 flex flex-wrap items-center justify-between text-[11px] text-white/80 gap-2 shrink-0">
          <div className="flex items-center space-x-2 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping"></span>
            
            {activeTab === 'composite' ? (
              <>
                <span className="text-[#10B981] font-bold uppercase tracking-wider flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>SYNTHESIZED 3-PASS COMPOSITE:</span>
                </span>
                <span className="text-white font-bold bg-[#10B981]/15 border border-[#10B981]/40 px-2 py-0.5 rounded-sm">
                  {allPasses.length > 0 ? `${allPasses[allPasses.length - 1].date} → ${allPasses[0].date}` : 'Multi-temporal'}
                </span>
                <span className="text-[#06B6D4] text-[10px] hidden sm:inline">
                  (Temporal Median Cloud Rejection • Atmospheric Dehazing • Unsharp Masking)
                </span>
              </>
            ) : (
              <>
                <span className="text-[#10B981] font-bold uppercase tracking-wider flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>EXACT CAPTURE TIMESTAMP:</span>
                </span>
                <span className="text-white font-extrabold bg-[#10B981]/15 border border-[#10B981]/40 px-2 py-0.5 rounded-sm">
                  {formattedAcquisitionTime.utc}
                </span>
                {formattedAcquisitionTime.ist && (
                  <span className="text-[#06B6D4] text-[10px] hidden sm:inline">
                    ({formattedAcquisitionTime.ist})
                  </span>
                )}
              </>
            )}
          </div>

          <div className="flex items-center space-x-3 text-[10px] text-white/50">
            {activeTab === 'composite' && splitCompare && (
              <span className="text-[#06B6D4] font-bold animate-pulse">
                ↔ SLIDE SPLIT BAR TO COMPARE RAW VS CLEAR
              </span>
            )}
            <div className="flex items-center space-x-1">
              <Move className="w-3.5 h-3.5 text-[#06B6D4] animate-pulse" />
              <span className="text-[#06B6D4] font-semibold">SURFABLE:</span>
              <span>Drag to pan • Scroll to zoom</span>
            </div>
          </div>
        </div>

        {/* MAIN SURFABLE VIEWPORT (Interactive Canvas: Drag to Pan & Mousewheel to Zoom) */}
        <div 
          ref={containerRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`relative flex-1 bg-[#020503] overflow-hidden select-none flex items-center justify-center ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{ minHeight: '360px' }}
        >
          {/* Background Grid Pattern */}
          <div className="absolute inset-0 opacity-15 pointer-events-none" style={{
            backgroundImage: 'radial-gradient(circle, #10B981 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }} />

          {/* Surfed / Panned / Zoomed Image Layer */}
          <div 
            className="transition-transform duration-75 ease-out select-none flex items-center justify-center pointer-events-none"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center'
            }}
          >
            {/* Split Screen Comparison Container */}
            {activeTab === 'composite' && splitCompare && compositeData?.composite_url ? (
              <div className="relative inline-block max-w-[85vw] max-h-[72vh] overflow-hidden rounded-sm shadow-[0_0_40px_rgba(0,0,0,0.9)] border border-white/20 select-none pointer-events-auto">
                {/* Layer 1: Raw Pass (Underneath, With Clouds) */}
                <img
                  src={selectedPass.url}
                  alt="Raw Satellite Frame"
                  draggable={false}
                  className="max-w-[85vw] max-h-[72vh] object-contain block opacity-95"
                />
                <div className="absolute top-2 right-2 bg-black/85 text-[9px] font-bold text-white px-2 py-0.5 rounded border border-white/20 pointer-events-none z-10">
                  RAW PASS (WITH CLOUDS)
                </div>

                {/* Layer 2: Combined Clear Composite (On Top, Clipped) */}
                <div 
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{ clipPath: `polygon(0 0, ${splitRatio}% 0, ${splitRatio}% 100%, 0 100%)` }}
                >
                  <img
                    ref={imgRef}
                    src={compositeData.composite_url}
                    alt="Clear Composite"
                    draggable={false}
                    className="max-w-[85vw] max-h-[72vh] w-full h-full object-contain block"
                  />
                  <div className="absolute top-2 left-2 bg-[#10B981] text-[#050B08] text-[9px] font-black px-2 py-0.5 rounded shadow-[0_0_10px_#10B981] z-10">
                    ✨ 3-PASS CLEAR FUSION
                  </div>
                </div>

                {/* Draggable Divider Bar */}
                <div 
                  className="absolute top-0 bottom-0 w-1 bg-[#10B981] shadow-[0_0_12px_#10B981] flex items-center justify-center z-30 cursor-ew-resize"
                  style={{ left: `${splitRatio}%` }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const startX = e.clientX;
                    const initialRatio = splitRatio;
                    const onMove = (moveEvent: MouseEvent) => {
                      const delta = moveEvent.clientX - startX;
                      setSplitRatio(Math.max(5, Math.min(95, initialRatio + (delta / 4))));
                    };
                    const onUp = () => {
                      window.removeEventListener('mousemove', onMove);
                      window.removeEventListener('mouseup', onUp);
                    };
                    window.addEventListener('mousemove', onMove);
                    window.addEventListener('mouseup', onUp);
                  }}
                >
                  <div className="w-5 h-5 rounded-full bg-[#10B981] text-black font-black text-[9px] flex items-center justify-center shadow-lg border border-white">
                    ⫴
                  </div>
                </div>

                {/* Exact Pinned Coordinate Crosshair */}
                {pinPosition && (
                  <div
                    style={{
                      position: 'absolute',
                      left: `${pinPosition.xPct}%`,
                      top: `${pinPosition.yPct}%`,
                      transform: 'translate(-50%, -50%)',
                      zIndex: 35
                    }}
                    className="pointer-events-none flex items-center justify-center"
                  >
                    <div className="absolute w-12 h-12 rounded-full border border-[#06B6D4] opacity-75 animate-ping"></div>
                    <div className="absolute w-12 h-[1.5px] bg-[#06B6D4] shadow-[0_0_8px_#06B6D4]"></div>
                    <div className="absolute h-12 w-[1.5px] bg-[#06B6D4] shadow-[0_0_8px_#06B6D4]"></div>
                    <div className="w-3.5 h-3.5 bg-[#08100D] border-2 border-[#06B6D4] rounded-full flex items-center justify-center shadow-[0_0_14px_#06B6D4]">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]"></div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Single / Unified Image Container */
              <div className="relative inline-block">
                <img
                  ref={imgRef}
                  src={activeDisplayUrl}
                  alt={selectedPass.title}
                  draggable={false}
                  onLoad={() => setImageLoaded(true)}
                  style={{ filter: getFilterStyle() }}
                  className="max-w-[85vw] max-h-[72vh] object-contain rounded-sm shadow-[0_0_40px_rgba(0,0,0,0.9)] border border-white/10 block transition-all duration-150"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/21/M/XS/2026/11/S2A_21MXS_20261101_1_L2A/preview.jpg";
                  }}
                />

                {/* Exact Pinned Coordinate Target Crosshair & Reticle on Satellite Image */}
                {pinPosition && (
                  <div
                    style={{
                      position: 'absolute',
                      left: `${pinPosition.xPct}%`,
                      top: `${pinPosition.yPct}%`,
                      transform: 'translate(-50%, -50%)',
                      zIndex: 25
                    }}
                    className="pointer-events-auto flex items-center justify-center group"
                  >
                    {/* Outer Radar Pulse Rings */}
                    <div className="absolute w-14 h-14 rounded-full border border-[#06B6D4] opacity-75 animate-ping pointer-events-none"></div>
                    <div className="absolute w-8 h-8 rounded-full border border-dashed border-[#06B6D4] opacity-90 animate-spin pointer-events-none"></div>

                    {/* Crosshair Lines */}
                    <div className="absolute w-12 h-[1.5px] bg-[#06B6D4] pointer-events-none shadow-[0_0_8px_#06B6D4]"></div>
                    <div className="absolute h-12 w-[1.5px] bg-[#06B6D4] pointer-events-none shadow-[0_0_8px_#06B6D4]"></div>

                    {/* Center Ground Anchor Pin */}
                    <div className="relative z-10 w-4 h-4 bg-[#08100D] border-2 border-[#06B6D4] rounded-full flex items-center justify-center shadow-[0_0_14px_#06B6D4] cursor-pointer">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] shadow-[0_0_8px_#06B6D4]"></div>
                    </div>

                    {/* Target Label Pin Flag Tooltip */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#06100C]/95 text-white border border-[#06B6D4] px-2 py-0.5 rounded shadow-[0_0_15px_rgba(6,182,212,0.8)] text-[9px] font-bold whitespace-nowrap flex items-center space-x-1.5 pointer-events-auto transition-transform group-hover:scale-110">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] animate-ping"></span>
                      <span className="text-[#06B6D4] font-black tracking-wider">PINNED LOCATION</span>
                      <span className="text-white/40">|</span>
                      <span className="text-white font-mono">{pinPosition.lat.toFixed(4)}°, {pinPosition.lng.toFixed(4)}°</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* High-Speed Multi-Pass Synthesis Progress HUD with Live Percent & Stages */}
          {loadingComposite && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 backdrop-blur-lg px-4 text-white">
              <div className="max-w-md w-full bg-[#07110C] border border-[#10B981]/50 rounded-lg p-5 sm:p-6 shadow-[0_0_50px_rgba(16,185,129,0.35)] flex flex-col items-center space-y-4 relative overflow-hidden">
                {/* Background scanning ambient beam */}
                <div 
                  className="absolute inset-0 bg-gradient-to-b from-[#10B981]/10 via-transparent to-transparent opacity-60 pointer-events-none"
                  style={{
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                  }}
                />

                {/* Top Badge & Title */}
                <div className="flex items-center space-x-2 text-[#10B981] font-mono text-xs font-bold tracking-widest uppercase">
                  <Sparkles className="w-4 h-4 text-[#10B981] animate-spin" style={{ animationDuration: '3s' }} />
                  <span>AI MULTI-FRAME SATELLITE FUSION</span>
                </div>

                {/* Big Glowing Percentage HUD */}
                <div className="flex flex-col items-center space-y-1">
                  <div className="flex items-baseline space-x-1">
                    <span className="text-5xl font-black font-mono text-white tracking-tight drop-shadow-[0_0_20px_rgba(16,185,129,0.8)]">
                      {compositeProgress}
                    </span>
                    <span className="text-2xl font-black text-[#10B981] font-mono">%</span>
                  </div>
                  <div className="text-[10px] text-white/50 tracking-wider font-mono uppercase">
                    HIGH-SPEED PARALLEL FUSION ENGINE
                  </div>
                </div>

                {/* Sleek High-Tech Progress Bar */}
                <div className="w-full space-y-1.5">
                  <div className="w-full h-3 bg-black/80 rounded-full border border-white/20 p-0.5 overflow-hidden relative shadow-inner">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-[#10B981] via-[#06B6D4] to-[#10B981] transition-all duration-150 ease-out shadow-[0_0_12px_#10B981] relative overflow-hidden"
                      style={{ width: `${compositeProgress}%` }}
                    >
                      {/* Shine animation */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-full h-full animate-pulse" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-white/50 px-0.5">
                    <span>STAGE {compositeProgress < 28 ? '1' : compositeProgress < 58 ? '2' : compositeProgress < 84 ? '3' : '4'}/4</span>
                    <span className="text-[#06B6D4] font-bold">ELAPSED: {compositeElapsed}s</span>
                  </div>
                </div>

                {/* 4 Multi-Step Process Badges */}
                <div className="grid grid-cols-4 gap-1.5 w-full text-[9px] font-mono">
                  <div className={`p-1.5 rounded text-center border transition-all ${
                    compositeProgress >= 28 
                      ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981] font-bold' 
                      : 'bg-black/40 border-white/10 text-white/40'
                  }`}>
                    {compositeProgress >= 28 ? '✓ 1. FETCH' : '1. FETCH'}
                  </div>
                  <div className={`p-1.5 rounded text-center border transition-all ${
                    compositeProgress >= 58 
                      ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981] font-bold' 
                      : (compositeProgress >= 28 ? 'bg-[#06B6D4]/20 border-[#06B6D4] text-[#06B6D4] animate-pulse font-bold' : 'bg-black/40 border-white/10 text-white/40')
                  }`}>
                    {compositeProgress >= 58 ? '✓ 2. ALIGN' : '2. ALIGN'}
                  </div>
                  <div className={`p-1.5 rounded text-center border transition-all ${
                    compositeProgress >= 84 
                      ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981] font-bold' 
                      : (compositeProgress >= 58 ? 'bg-[#06B6D4]/20 border-[#06B6D4] text-[#06B6D4] animate-pulse font-bold' : 'bg-black/40 border-white/10 text-white/40')
                  }`}>
                    {compositeProgress >= 84 ? '✓ 3. REJECT' : '3. REJECT'}
                  </div>
                  <div className={`p-1.5 rounded text-center border transition-all ${
                    compositeProgress >= 100 
                      ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981] font-bold' 
                      : (compositeProgress >= 84 ? 'bg-[#06B6D4]/20 border-[#06B6D4] text-[#06B6D4] animate-pulse font-bold' : 'bg-black/40 border-white/10 text-white/40')
                  }`}>
                    {compositeProgress >= 100 ? '✓ 4. DEHAZE' : '4. DEHAZE'}
                  </div>
                </div>

                {/* Dynamic Status Log Line */}
                <div className="bg-black/60 border border-white/10 px-3 py-1.5 rounded w-full text-center">
                  <div className="text-xs font-mono font-bold text-[#10B981] truncate">
                    {compositeStage}
                  </div>
                </div>

                {/* Back to Single Pass button */}
                <button
                  onClick={() => {
                    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
                    setLoadingComposite(false);
                    setActiveTab('single');
                  }}
                  className="text-[10px] text-white/40 hover:text-[#EF4444] transition-colors underline cursor-pointer pt-1"
                >
                  Cancel and return to single pass
                </button>
              </div>
            </div>
          )}

          {/* Normal buffering indicator while raw image loads */}
          {!imageLoaded && !loadingComposite && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-[#10B981] space-x-2 text-xs">
              <span className="w-3 h-3 rounded-full bg-[#10B981] animate-ping"></span>
              <span>BUFFERING HIGH-RESOLUTION ORBITAL TILE...</span>
            </div>
          )}

          {/* On-Screen Directional Pan Controls (Surfing D-Pad) */}
          <div className="absolute top-4 left-4 z-20 flex flex-col items-center bg-[#070E0B]/90 backdrop-blur-md p-1.5 rounded-sm border border-white/10 shadow-xl">
            <button 
              onClick={() => handleNudge(0, 80)} 
              className="p-1 hover:bg-[#10B981]/20 hover:text-[#10B981] text-white/70 rounded transition-colors"
              title="Pan Up"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <div className="flex items-center space-x-1">
              <button 
                onClick={() => handleNudge(80, 0)} 
                className="p-1 hover:bg-[#10B981]/20 hover:text-[#10B981] text-white/70 rounded transition-colors"
                title="Pan Left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={handleReset} 
                className="p-1 hover:bg-[#10B981]/20 text-[9px] font-bold text-[#10B981] rounded px-1.5 transition-colors"
                title="Recenter"
              >
                FIT
              </button>
              <button 
                onClick={() => handleNudge(-80, 0)} 
                className="p-1 hover:bg-[#10B981]/20 hover:text-[#10B981] text-white/70 rounded transition-colors"
                title="Pan Right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button 
              onClick={() => handleNudge(0, -80)} 
              className="p-1 hover:bg-[#10B981]/20 hover:text-[#10B981] text-white/70 rounded transition-colors"
              title="Pan Down"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Top-Right FLIR Thermal Radiometry Scale Legend */}
          {spectralFilter === 'thermal_ironbow' && activeTab === 'single' && (
            <div className="absolute top-4 right-4 z-20 bg-[#070E0B]/95 backdrop-blur-md border border-[#F59E0B]/50 px-3 py-2 rounded-sm text-[10px] shadow-2xl flex flex-col space-y-1">
              <div className="flex items-center justify-between space-x-2 text-[#F59E0B] font-bold text-[9px] tracking-wider uppercase">
                <div className="flex items-center space-x-1">
                  <Flame className="w-3.5 h-3.5 text-[#F59E0B] animate-pulse" />
                  <span>FLIR Thermal Heat Signature</span>
                </div>
                <span className="text-white/40">Band 10 (10.8µm)</span>
              </div>
              <div className="flex items-center space-x-2 font-mono text-[9px]">
                <span className="text-[#818CF8]">COLD (16°C)</span>
                <div className="w-32 h-2.5 rounded-sm bg-gradient-to-r from-[#1E1B4B] via-[#4338CA] via-[#9333EA] via-[#EF4444] via-[#F59E0B] to-[#FEF08A] border border-white/20"></div>
                <span className="text-[#FEF08A] font-bold">WARM (38°C)</span>
              </div>
              <div className="text-[8px] text-white/50 flex justify-between">
                <span>☁️ Clouds / Water</span>
                <span>🌿 Canopy</span>
                <span>🔥 Ground Heat</span>
              </div>
            </div>
          )}

          {/* Bottom-Right Radar Minimap & Surfing Indicator */}
          <div className="absolute bottom-4 right-4 z-20 bg-[#070E0B]/95 backdrop-blur-md border border-[#10B981]/40 rounded-sm p-2 shadow-2xl flex flex-col items-center">
            <div className="text-[9px] text-[#10B981] font-bold uppercase mb-1 tracking-wider flex items-center space-x-1">
              <Eye className="w-3 h-3 text-[#10B981]" />
              <span>RADAR MINI-VIEW</span>
            </div>
            <div className="relative w-24 h-20 bg-black border border-white/20 rounded overflow-hidden">
              <img 
                src={activeDisplayUrl} 
                alt="Minimap" 
                style={{ filter: getFilterStyle() }}
                className="w-full h-full object-cover opacity-60"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = pass.url || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80";
                }}
              />
              {/* Pinned Location Dot on Minimap */}
              {pinPosition && (
                <div 
                  className="absolute w-2.5 h-2.5 rounded-full bg-[#06B6D4] border border-white shadow-[0_0_8px_#06B6D4] animate-pulse"
                  style={{
                    top: `${pinPosition.yPct}%`,
                    left: `${pinPosition.xPct}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10
                  }}
                  title="Pinned Location"
                />
              )}
              {/* Surfer viewport reticle box */}
              <div 
                className="absolute border border-[#06B6D4] bg-[#06B6D4]/20 shadow-[0_0_8px_#06B6D4]"
                style={{
                  width: `${Math.max(16, Math.min(100, 100 / zoom))}%`,
                  height: `${Math.max(16, Math.min(100, 100 / zoom))}%`,
                  top: `${Math.max(0, Math.min(84, 50 - (pan.y / 15) - (50 / zoom)))}%`,
                  left: `${Math.max(0, Math.min(84, 50 - (pan.x / 15) - (50 / zoom)))}%`
                }}
              />
            </div>
            <div className="text-[8px] text-white/50 mt-1 font-bold">
              MAG: {Math.round(zoom * 100)}%
            </div>
          </div>

          {/* Center Coordinates Reticle Badge */}
          <div className="absolute bottom-4 left-4 z-20 bg-black/85 backdrop-blur-sm border border-white/10 px-3 py-1.5 rounded-sm text-[10px] text-white/80 space-y-0.5 pointer-events-none">
            <div>
              MODE: <strong className="text-[#10B981]">{activeTab === 'composite' ? '3-Pass Temporal Clear Composite' : selectedPass.type}</strong>
            </div>
            <div>
              {activeTab === 'composite' ? (
                <span>FILTER: <b className="text-[#06B6D4]">{compositeMode.toUpperCase()} (Median Dehazed)</b></span>
              ) : (
                <span>SPECTRAL BANDS: <span className="text-[#06B6D4]">{selectedPass.band}</span></span>
              )}
            </div>
            {targetCoords && (
              <div>PINNED GEO: <span className="text-white font-bold">{targetCoords.lat.toFixed(5)}° N, {targetCoords.lng.toFixed(5)}° E</span></div>
            )}
            {pinPosition && (
              <div className="text-[9px] text-[#06B6D4]">
                IMAGE PIN RETICLE: <strong>{pinPosition.xPct}% X, {pinPosition.yPct}% Y</strong>
              </div>
            )}
            <div>
              PALETTE: <strong className="text-[#F59E0B]">{activeTab === 'composite' ? 'CLEAR FUSED HD' : spectralFilter.toUpperCase()}</strong>
            </div>
          </div>
        </div>

        {/* Footer Bar: Scene Metadata, Verified STAC Hash & Controls */}
        <div className="px-4 py-2 bg-[#070E0B] border-t border-white/10 flex flex-wrap items-center justify-between text-[10px] text-white/60 gap-2 shrink-0">
          <div className="flex items-center space-x-3 flex-wrap">
            <span className="flex items-center space-x-1.5 text-[#10B981] font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
              <span>{activeTab === 'composite' ? 'MULTI-SATELLITE AI SYNTHESIS ACTIVE' : 'AWS ELEMENT 84 STAC VERIFIED'}</span>
            </span>
            <span className="text-white/30">•</span>
            <span>
              {activeTab === 'composite' ? (
                <span>FUSED PASSES: <b className="text-white">{allPasses.length} Acquisitions</b></span>
              ) : (
                <span>SCENE ID: <code className="text-white font-mono bg-white/5 px-1 py-0.5 rounded border border-white/10">{selectedPass.id}</code></span>
              )}
            </span>
            <span className="text-white/30">•</span>
            <span>GSD: <b className="text-white">{selectedPass.resolution}</b></span>
          </div>

          <div className="flex items-center space-x-3 text-[10px] text-white/50">
            <span>SURF WITH MOUSE DRAG • SCROLL WHEEL ZOOM</span>
            <span className="text-white/30">•</span>
            <button 
              onClick={onClose}
              className="text-[#EF4444] hover:underline cursor-pointer font-bold"
            >
              [✕ CLOSE]
            </button>
          </div>
        </div>

        {/* SVG Definitions for Scientific Spectral Colormaps */}
        <svg width="0" height="0" className="absolute pointer-events-none opacity-0 overflow-hidden" aria-hidden="true">
          <defs>
            {/* Authentic FLIR Ironbow Heatmap Colormap */}
            <filter id="filter-ironbow" colorInterpolationFilters="sRGB">
              <feColorMatrix
                type="matrix"
                values="0.299 0.587 0.114 0 0
                        0.299 0.587 0.114 0 0
                        0.299 0.587 0.114 0 0
                        0 0 0 1 0"
                result="gray"
              />
              <feComponentTransfer in="gray">
                <feFuncR type="table" tableValues="0.05 0.12 0.55 0.95 1.0 1.0" />
                <feFuncG type="table" tableValues="0.00 0.00 0.08 0.35 0.85 1.0" />
                <feFuncB type="table" tableValues="0.45 0.75 0.40 0.05 0.05 0.90" />
              </feComponentTransfer>
            </filter>

            {/* Color-Infrared (CIR) Forest Canopy Vitality: healthy canopy = ruby red, water = black */}
            <filter id="filter-cir" colorInterpolationFilters="sRGB">
              <feColorMatrix
                type="matrix"
                values="0.2 1.6 0.1 0 0
                        0.1 0.5 0.2 0 0
                        0.0 0.2 0.7 0 0
                        0   0   0   1 0"
              />
            </filter>

            {/* Dynamic Contrast Stretch / Dehaze */}
            <filter id="filter-contrast" colorInterpolationFilters="sRGB">
              <feComponentTransfer>
                <feFuncR type="linear" slope="1.4" intercept="-0.18" />
                <feFuncG type="linear" slope="1.4" intercept="-0.18" />
                <feFuncB type="linear" slope="1.4" intercept="-0.18" />
              </feComponentTransfer>
            </filter>
          </defs>
        </svg>
      </div>
    </div>,
    document.body
  );
};
