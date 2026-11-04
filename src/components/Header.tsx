import React, { useState, useEffect } from 'react';
import { 
  Globe2, 
  Satellite, 
  AlertTriangle, 
  Volume2, 
  VolumeX, 
  Radio, 
  Clock, 
  MapPin, 
  ChevronDown, 
  Maximize2, 
  Search,
  Sparkles
} from 'lucide-react';
import { MonitoredAOI } from '../types';

interface HeaderProps {
  aois: MonitoredAOI[];
  selectedAoi: MonitoredAOI;
  onSelectAoi: (aoi: MonitoredAOI) => void;
  activeCriticalAlertsCount: number;
  onOpenAlerts: () => void;
  onOpenQuickAssistant: () => void;
  tacticalAudio: boolean;
  onToggleTacticalAudio: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  aois,
  selectedAoi,
  onSelectAoi,
  activeCriticalAlertsCount,
  onOpenAlerts,
  onOpenQuickAssistant,
  tacticalAudio,
  onToggleTacticalAudio
}) => {
  const [utcTime, setUtcTime] = useState<string>('');
  const [aoiDropdownOpen, setAoiDropdownOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().replace('GMT', 'UTC'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0D1612]/95 backdrop-blur-md border-b border-white/10 text-xs font-mono">
      {/* Top micro-ticker bar */}
      <div className="bg-[#07100C] border-b border-white/5 px-4 py-1 flex items-center justify-between text-[10px] text-white/50">
        <div className="flex items-center space-x-3 overflow-hidden">
          <span className="flex items-center space-x-1 text-[#10B981] font-semibold">
            <Radio className="w-3 h-3 animate-pulse" />
            <span>ORBITAL INGEST: LIVE</span>
          </span>
          <span className="hidden md:inline text-white/30">|</span>
          <span className="hidden md:inline text-white/60">
            RADAR COHERENCE: SENTINEL-1C (5.405 GHz) SYNCED
          </span>
          <span className="hidden lg:inline text-white/30">|</span>
          <span className="hidden lg:inline text-[#06B6D4]">
            AOI TELEMETRY: {selectedAoi.name}
          </span>
        </div>

        {/* DEMO DATA DISCLAIMER BADGE */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 bg-[#F59E0B]/10 border border-[#F59E0B]/40 px-2 py-0.5 rounded-sm text-[#F59E0B]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]"></span>
            <span className="font-semibold text-[9px] tracking-widest uppercase">DEMO DATA MODE</span>
          </div>

          <div className="flex items-center space-x-1 text-white/60">
            <Clock className="w-3 h-3 text-[#10B981]" />
            <span className="text-[#4EDEA3] font-bold">{utcTime || 'SYNCHRONIZING UTC...'}</span>
          </div>
        </div>
      </div>

      {/* Main Command Bar */}
      <div className="px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-sm bg-[#14201A] border border-[#10B981]/50 text-[#10B981] shadow-[0_0_10px_rgba(16,185,129,0.25)]">
            <Globe2 className="w-5 h-5 text-[#4EDEA3]" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#10B981] animate-ping"></span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-sm sm:text-base tracking-wider text-white">
                GREEN <span className="text-[#4EDEA3]">PLANET</span>
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.2 bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 text-[9px] font-bold rounded-sm uppercase tracking-wider">
                GEO-OPS v3.4
              </span>
            </div>
            <div className="text-[10px] text-white/50 tracking-tight hidden sm:block">
              DEFENSE-GRADE GEOSPATIAL INTELLIGENCE & CANOPY TELEMETRY
            </div>
          </div>
        </div>

        {/* Center: Monitored AOI Selector */}
        <div className="relative">
          <button
            onClick={() => setAoiDropdownOpen(!aoiDropdownOpen)}
            className="flex items-center space-x-2 bg-[#14201A] hover:bg-[#182620] border border-white/10 hover:border-[#10B981]/50 px-3 py-1.5 rounded-sm transition-all text-xs"
          >
            <MapPin className="w-3.5 h-3.5 text-[#10B981]" />
            <div className="text-left">
              <div className="text-[9px] text-white/50 uppercase leading-none">TARGET ZONE (AOI)</div>
              <div className="font-semibold text-white/90 truncate max-w-[140px] sm:max-w-[220px]">
                {selectedAoi.name}
              </div>
            </div>
            <span className={`px-1.5 py-0.5 rounded-sm text-[9px] font-bold ${
              selectedAoi.riskLevel === 'CRITICAL' ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40' :
              selectedAoi.riskLevel === 'ELEVATED' ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40' :
              'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40'
            }`}>
              {selectedAoi.riskLevel}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-white/50" />
          </button>

          {/* AOI Dropdown menu */}
          {aoiDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-72 bg-[#0D1612] border border-[#10B981]/40 rounded-sm shadow-2xl z-50 overflow-hidden font-mono text-xs">
              <div className="px-3 py-2 bg-[#14201A] border-b border-white/10 text-[10px] text-white/50 uppercase flex justify-between">
                <span>SELECT MONITORED AOI</span>
                <span className="text-[#10B981]">{aois.length} SITES</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
                {aois.map(aoi => (
                  <button
                    key={aoi.id}
                    onClick={() => {
                      onSelectAoi(aoi);
                      setAoiDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2.5 text-left flex items-start justify-between hover:bg-[#14201A] transition-colors ${
                      aoi.id === selectedAoi.id ? 'bg-[#14201A] border-l-2 border-[#10B981]' : ''
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-white/90">{aoi.name}</div>
                      <div className="text-[10px] text-white/50">{aoi.country}</div>
                      <div className="text-[9px] text-[#06B6D4] mt-0.5 font-mono">
                        {aoi.centerCoords.lat.toFixed(3)}°, {aoi.centerCoords.lng.toFixed(3)}°
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-1.5 py-0.5 rounded-sm text-[9px] font-bold ${
                        aoi.riskLevel === 'CRITICAL' ? 'bg-[#EF4444]/20 text-[#EF4444]' :
                        aoi.riskLevel === 'ELEVATED' ? 'bg-[#F59E0B]/20 text-[#F59E0B]' :
                        'bg-[#10B981]/20 text-[#10B981]'
                      }`}>
                        {aoi.riskLevel}
                      </span>
                      <div className="text-[9px] text-white/40 mt-1">
                        {aoi.activeAlertsCount} alerts
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Tactical Action Cluster */}
        <div className="flex items-center space-x-2">
          {/* AI Intelligence Assistant Quick Button */}
          <button
            onClick={onOpenQuickAssistant}
            className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 bg-[#06B6D4]/15 hover:bg-[#06B6D4]/25 border border-[#06B6D4]/40 text-[#4CD7F6] rounded-sm text-xs transition-colors"
            title="Launch Sentinel AI Forest Intelligence Assistant"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="font-semibold">SENTINEL AI</span>
          </button>

          {/* Active Alerts Dispatcher Button */}
          <button
            onClick={onOpenAlerts}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-sm border transition-colors ${
              activeCriticalAlertsCount > 0
                ? 'bg-[#EF4444]/20 border-[#EF4444] text-[#EF4444] hover:bg-[#EF4444]/30'
                : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${activeCriticalAlertsCount > 0 ? 'animate-bounce' : ''}`} />
            <span className="font-bold">{activeCriticalAlertsCount} CRITICAL</span>
          </button>

          {/* Audio toggle */}
          <button
            onClick={onToggleTacticalAudio}
            className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white rounded-sm"
            title={tacticalAudio ? 'Mute telemetry audio chimes' : 'Enable telemetry audio chimes'}
          >
            {tacticalAudio ? <Volume2 className="w-3.5 h-3.5 text-[#10B981]" /> : <VolumeX className="w-3.5 h-3.5 text-white/40" />}
          </button>

          {/* Fullscreen toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white rounded-sm hidden sm:block"
            title="Toggle full screen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
