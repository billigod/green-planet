import React, { useState, useRef, useEffect } from 'react';
import { Eye, Layers, Sparkles, AlertTriangle, ShieldCheck } from 'lucide-react';

interface BeforeAfterSliderProps {
  preImageUrl: string;
  postImageUrl: string;
  preDate: string;
  postDate: string;
  title?: string;
  lossAreaHa?: number;
  confidenceScore?: number;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  preImageUrl,
  postImageUrl,
  preDate,
  postDate,
  title,
  lossAreaHa,
  confidenceScore
}) => {
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showNdviOverlay, setShowNdviOverlay] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percent);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, []);

  return (
    <div className="flex flex-col bg-[#0D1612] border border-white/10 rounded-sm overflow-hidden select-none">
      {/* Top Telemetry Header Bar */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 border-b border-white/8 bg-[#14201A] text-xs">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
          <span className="font-mono text-[#4EDEA3] font-semibold uppercase tracking-wider text-[11px]">
            DUAL-TEMPORAL ORBITAL WIPE
          </span>
          {title && <span className="text-white/60 hidden sm:inline">| {title}</span>}
        </div>

        <div className="flex items-center space-x-2 mt-1 sm:mt-0">
          <button
            onClick={() => setShowNdviOverlay(!showNdviOverlay)}
            className={`flex items-center space-x-1.5 px-2 py-1 rounded-sm text-[11px] font-mono transition-colors border ${
              showNdviOverlay
                ? 'bg-[#EF4444]/20 border-[#EF4444] text-[#EF4444]'
                : 'bg-black/30 border-white/15 text-white/70 hover:text-white hover:border-white/30'
            }`}
            title="Toggle SAR / NDVI incursion delta mask"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{showNdviOverlay ? 'NDVI DELTA: ACTIVE' : 'NDVI DELTA: OFF'}</span>
          </button>

          <button
            onClick={() => setZoomLevel(prev => prev === 1 ? 1.5 : prev === 1.5 ? 2 : 1)}
            className="flex items-center space-x-1 px-2 py-1 bg-black/30 border border-white/15 text-white/70 hover:text-white rounded-sm text-[11px] font-mono"
            title="Cycle optical zoom magnification"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>ZOOM: {zoomLevel}x</span>
          </button>
        </div>
      </div>

      {/* Wipe Canvas Viewport */}
      <div
        ref={containerRef}
        onMouseDown={(e) => {
          setIsDragging(true);
          handleMove(e.clientX);
        }}
        onTouchStart={(e) => {
          setIsDragging(true);
          handleMove(e.touches[0].clientX);
        }}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        className="relative w-full aspect-[16/10] sm:aspect-[16/9] max-h-[460px] overflow-hidden cursor-ew-resize bg-[#07100C]"
      >
        {/* POST Image (Background / Incursion) */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: `${sliderPos}% 50%` }}
        >
          <img
            src={postImageUrl}
            alt="Post Incursion Satellite Scan"
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {showNdviOverlay && (
            <div className="absolute inset-0 bg-red-950/40 mix-blend-color-burn pointer-events-none flex items-center justify-center">
              <div className="border border-red-500/80 bg-red-500/20 px-3 py-1.5 rounded-sm font-mono text-[11px] text-red-300 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>CANOPY SPECTRAL COLLAPSE: -78% NDVI</span>
              </div>
            </div>
          )}
        </div>

        {/* PRE Image (Foreground / Intact Baseline - Clipped by Slider) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            width: `${sliderPos}%`,
            transform: `scale(${zoomLevel})`,
            transformOrigin: `${sliderPos}% 50%`
          }}
        >
          <div
            className="absolute inset-0 w-full h-full"
            style={{ width: `${containerRef.current ? containerRef.current.clientWidth : 800}px` }}
          >
            <img
              src={preImageUrl}
              alt="Pre Incursion Pristine Baseline"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>

        {/* Divider Bar Handle */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-[#10B981] shadow-[0_0_12px_#10B981] pointer-events-none z-20 flex flex-col items-center justify-center"
          style={{ left: `${sliderPos}%` }}
        >
          {/* Central Scrub Reticle */}
          <div className="w-7 h-7 -ml-[13px] rounded-sm bg-[#080E0B] border border-[#10B981] flex items-center justify-center text-[#10B981] text-[9px] font-mono shadow-md">
            ◀▶
          </div>
        </div>

        {/* Floating Labels */}
        <div className="absolute top-3 left-3 z-10 pointer-events-none">
          <div className="bg-[#080E0B]/85 backdrop-blur-md border border-white/15 px-2 py-1 rounded-sm text-[10px] font-mono text-white/90 flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
            <span className="font-semibold text-[#4EDEA3]">PRE-INCURSION BASELINE</span>
            <span className="text-white/50">({preDate})</span>
          </div>
        </div>

        <div className="absolute top-3 right-3 z-10 pointer-events-none">
          <div className="bg-[#080E0B]/85 backdrop-blur-md border border-red-500/40 px-2 py-1 rounded-sm text-[10px] font-mono text-white/90 flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-ping"></span>
            <span className="font-semibold text-red-400">DETECTED INCURSION</span>
            <span className="text-white/50">({postDate})</span>
          </div>
        </div>

        {/* Telemetry bottom stamp */}
        <div className="absolute bottom-2 left-2 right-2 z-10 pointer-events-none flex justify-between items-center text-[10px] font-mono">
          <div className="bg-[#080E0B]/80 px-2 py-0.5 rounded-sm border border-white/10 text-white/60">
            SLIDER RATIO: {Math.round(sliderPos)}% / {Math.round(100 - sliderPos)}%
          </div>
          {lossAreaHa && (
            <div className="bg-red-950/80 px-2 py-0.5 rounded-sm border border-red-500/50 text-red-300 font-semibold flex items-center space-x-1">
              <AlertTriangle className="w-3 h-3 text-red-400" />
              <span>FOREST SCAR: {lossAreaHa} HA</span>
            </div>
          )}
        </div>
      </div>

      {/* Instruction footer */}
      <div className="px-3 py-1.5 bg-[#080E0B] border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-white/50">
        <span>DRAG SLIDER HORIZONTALLY TO REVEAL DEFORESTATION DELTA</span>
        {confidenceScore && (
          <span className="text-[#4EDEA3] flex items-center space-x-1">
            <ShieldCheck className="w-3 h-3" />
            <span>ALGORITHM CONFIDENCE: {confidenceScore}%</span>
          </span>
        )}
      </div>
    </div>
  );
};
