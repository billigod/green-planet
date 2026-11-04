import React from 'react';
import { 
  ShieldAlert, 
  TreePine, 
  Activity, 
  Satellite, 
  MapPin, 
  ExternalLink, 
  ChevronRight, 
  ArrowUpRight, 
  Sparkles, 
  Layers,
  Radio,
  FileText,
  Clock,
  Compass,
  AlertCircle
} from 'lucide-react';
import { Incident, MonitoredAOI, ViewMode } from '../types';
import { CanopyLossChart } from '../components/CanopyLossChart';
import { TelemetryReticle } from '../components/TelemetryReticle';

interface OverviewViewProps {
  aoi: MonitoredAOI;
  incidents: Incident[];
  onSelectIncident: (incident: Incident) => void;
  onNavigate: (view: ViewMode) => void;
  onQuickTaskSatellite: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  aoi,
  incidents,
  onSelectIncident,
  onNavigate,
  onQuickTaskSatellite
}) => {
  const criticalIncidents = incidents.filter(i => i.severity === 'critical');
  const warningIncidents = incidents.filter(i => i.severity === 'warning');
  const recentIncidents = incidents.slice(0, 5);

  const totalLossHa = incidents.reduce((sum, i) => sum + i.lossAreaHectares, 0).toFixed(1);
  const totalCarbonLost = incidents.reduce((sum, i) => sum + i.carbonEmissionTCO2e, 0).toLocaleString();

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Target AOI Mission Status Banner */}
      <div className="bg-[#0D1612] border border-white/10 rounded-sm p-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-[#10B981]/5 via-transparent to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-[10px] text-[#10B981] font-semibold uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping"></span>
              <span>PRIMARY SURVEILLANCE SECTOR</span>
              <span className="text-white/30">|</span>
              <span className="text-[#06B6D4]">{aoi.protectedZone}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center space-x-2 font-sans">
              <span>{aoi.name}</span>
              <span className="text-white/40 font-mono text-sm font-normal">({aoi.country})</span>
            </h1>
            <p className="text-white/60 text-xs mt-1 max-w-2xl font-sans">
              {aoi.biome} — Multi-spectral synthetic aperture radar (SAR) monitoring active. Automated deforestation detection running every 12 minutes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate('map')}
              className="flex items-center space-x-1.5 px-3 py-2 bg-[#10B981] hover:bg-[#34D399] text-[#080E0B] font-bold rounded-sm text-xs transition-colors shadow-[0_0_12px_rgba(16,185,129,0.3)]"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>OPEN SATELLITE MAP</span>
            </button>
            <button
              onClick={onQuickTaskSatellite}
              className="flex items-center space-x-1.5 px-3 py-2 bg-[#06B6D4]/15 hover:bg-[#06B6D4]/25 border border-[#06B6D4]/40 text-[#4CD7F6] rounded-sm text-xs transition-colors"
            >
              <Satellite className="w-3.5 h-3.5" />
              <span>TASK HIGH-RES PASS</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Telemetry Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Critical Incursions */}
        <div className="bg-[#0D1612] border border-[#EF4444]/30 rounded-sm p-3 relative overflow-hidden group hover:border-[#EF4444] transition-colors">
          <div className="flex items-center justify-between text-white/50 text-[10px] uppercase font-semibold">
            <span>ACTIVE INCURSIONS</span>
            <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-ping"></span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#EF4444] font-mono">
              {criticalIncidents.length}
              <span className="text-xs text-white/40 font-normal ml-1">CRITICAL</span>
            </div>
            <div className="text-[10px] text-[#F59E0B] font-bold bg-[#F59E0B]/10 px-1.5 py-0.5 rounded-sm border border-[#F59E0B]/30">
              +{warningIncidents.length} ELEVATED
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-white/50">
            <span>Ground teams dispatched:</span>
            <span className="text-[#10B981] font-bold">2 UNITS</span>
          </div>
        </div>

        {/* Card 2: 30-Day Forest Loss */}
        <div className="bg-[#0D1612] border border-white/10 rounded-sm p-3 relative overflow-hidden group hover:border-white/20 transition-colors">
          <div className="flex items-center justify-between text-white/50 text-[10px] uppercase font-semibold">
            <span>CANOPY LOSS (30D)</span>
            <TreePine className="w-3.5 h-3.5 text-[#F59E0B]" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#F59E0B] font-mono">
              {totalLossHa}
              <span className="text-xs text-white/40 font-normal ml-1">HA</span>
            </div>
            <div className="text-[10px] text-red-400 font-bold">
              +14.2% vs prev mo
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-white/50">
            <span>Carbon impact:</span>
            <span className="text-white/80 font-bold">{totalCarbonLost} tCO2e</span>
          </div>
        </div>

        {/* Card 3: Canopy Retention Index */}
        <div className="bg-[#0D1612] border border-white/10 rounded-sm p-3 relative overflow-hidden group hover:border-[#10B981]/50 transition-colors">
          <div className="flex items-center justify-between text-white/50 text-[10px] uppercase font-semibold">
            <span>CANOPY INTEGRITY</span>
            <Activity className="w-3.5 h-3.5 text-[#10B981]" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#10B981] font-mono">
              {aoi.canopyIntegrityPct}%
            </div>
            <div className="text-[10px] text-[#10B981] font-bold bg-[#10B981]/10 px-1.5 py-0.5 rounded-sm border border-[#10B981]/30">
              NOMINAL
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-white/50">
            <span>Target Reserve Size:</span>
            <span className="text-white/80 font-bold">{aoi.areaHectares.toLocaleString()} Ha</span>
          </div>
        </div>

        {/* Card 4: Sensor Constellation */}
        <div className="bg-[#0D1612] border border-white/10 rounded-sm p-3 relative overflow-hidden group hover:border-[#06B6D4]/50 transition-colors">
          <div className="flex items-center justify-between text-white/50 text-[10px] uppercase font-semibold">
            <span>ORBITAL FLEET INGEST</span>
            <Satellite className="w-3.5 h-3.5 text-[#06B6D4]" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#06B6D4] font-mono">
              6 / 6
              <span className="text-xs text-white/40 font-normal ml-1">SENSORS</span>
            </div>
            <div className="text-[10px] text-[#06B6D4] font-bold">
              100% HEALTH
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-white/50">
            <span>Last pass overflight:</span>
            <span className="text-[#4EDEA3] font-bold">{aoi.lastPassTime}</span>
          </div>
        </div>
      </div>

      {/* Middle Grid: Canopy Loss Trend Chart & Tactical Reticle */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2">
          <CanopyLossChart />
        </div>

        <div className="space-y-3">
          <TelemetryReticle
            lat={aoi.centerCoords.lat}
            lng={aoi.centerCoords.lng}
            utmZone="21S 706820E 9642930N"
            elevationM={114}
            cloudCoverPct={8.5}
            radarCoherenceDropPct={76.8}
          />

          {/* AI Quick Insight Box */}
          <div className="bg-[#14201A] border border-[#06B6D4]/30 rounded-sm p-3">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#4CD7F6] mb-1.5">
              <span className="flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>SENTINEL AI TELEMETRY BRIEF</span>
              </span>
              <span className="text-[9px] bg-[#06B6D4]/20 px-1 py-0.2 rounded text-[#06B6D4]">AUTOMATED</span>
            </div>
            <p className="text-white/70 text-[11px] leading-relaxed font-sans">
              Acute SAR C-band decorrelation cluster identified in Tapajós Sector 7. Geometric signature indicates unauthorized heavy machinery bull-dozing towards riparian borders. High probability of commercial logging road branch development.
            </p>
            <button
              onClick={() => onNavigate('assistant')}
              className="mt-2 w-full py-1.5 bg-[#06B6D4]/20 hover:bg-[#06B6D4]/30 border border-[#06B6D4]/40 text-[#4CD7F6] rounded-sm text-[11px] font-bold flex items-center justify-center space-x-1 transition-colors"
            >
              <span>OPEN AI INVESTIGATION COPILOT</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Live Deforestation Alert Stream & Interactive Map Teaser */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Real-time Deforestation Alert Stream (2 Cols) */}
        <div className="lg:col-span-2 bg-[#0D1612] border border-white/10 rounded-sm p-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-2">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse"></span>
              <span className="text-[#10B981] font-semibold text-[11px] uppercase tracking-wider">
                REAL-TIME INCIDENT TELEMETRY STREAM
              </span>
            </div>
            <button
              onClick={() => onNavigate('incidents')}
              className="text-[#10B981] hover:text-[#34D399] flex items-center space-x-1 text-[11px]"
            >
              <span>VIEW ALL {incidents.length} INCIDENTS</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-white/5">
            {recentIncidents.map(incident => (
              <div
                key={incident.id}
                onClick={() => onSelectIncident(incident)}
                className="py-2.5 px-2 hover:bg-[#14201A] transition-colors rounded-sm cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 group"
              >
                <div className="flex items-start space-x-3">
                  <span
                    className={`mt-0.5 px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider ${
                      incident.severity === 'critical'
                        ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40'
                        : incident.severity === 'warning'
                        ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40'
                        : 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40'
                    }`}
                  >
                    {incident.severity}
                  </span>

                  <div>
                    <div className="font-semibold text-white/90 group-hover:text-white flex items-center space-x-1.5 font-sans text-xs">
                      <span>{incident.title}</span>
                      <span className="text-[10px] text-white/40 font-mono">[{incident.id}]</span>
                    </div>
                    <div className="text-[10px] text-white/50 flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                      <span>{incident.aoiName}</span>
                      <span className="text-[#06B6D4]">
                        {incident.coordinates.lat.toFixed(4)}°, {incident.coordinates.lng.toFixed(4)}°
                      </span>
                      <span>Sensor: {incident.detectedBy}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 self-end sm:self-center">
                  <div className="text-right">
                    <div className="text-sm font-bold text-white font-mono">
                      {incident.lossAreaHectares} Ha
                    </div>
                    <div className="text-[9px] text-[#4EDEA3]">
                      {incident.confidenceScore}% conf
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectIncident(incident);
                    }}
                    className="p-1 bg-white/5 group-hover:bg-[#10B981] text-white/60 group-hover:text-[#080E0B] rounded-sm transition-colors"
                    title="Open Incident Forensics"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tactical Quick Operations Actions */}
        <div className="bg-[#0D1612] border border-white/10 rounded-sm p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 border-b border-white/10 pb-2 mb-3 text-[11px] font-semibold text-[#10B981] uppercase tracking-wider">
              <Radio className="w-3.5 h-3.5 text-[#10B981]" />
              <span>COMMAND & DISPATCH</span>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => onNavigate('map')}
                className="w-full p-2.5 bg-[#14201A] hover:bg-[#182620] border border-white/10 hover:border-[#10B981]/50 rounded-sm text-left flex items-center justify-between transition-colors group"
              >
                <div>
                  <div className="font-semibold text-white group-hover:text-[#4EDEA3]">
                    1. Satellite Map Inspection
                  </div>
                  <div className="text-[10px] text-white/50 font-sans">
                    View active raster overlays & SAR radar scans
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-[#10B981]" />
              </button>

              <button
                onClick={() => onNavigate('investigation')}
                className="w-full p-2.5 bg-[#14201A] hover:bg-[#182620] border border-white/10 hover:border-[#10B981]/50 rounded-sm text-left flex items-center justify-between transition-colors group"
              >
                <div>
                  <div className="font-semibold text-white group-hover:text-[#4EDEA3]">
                    2. Dual-Temporal Forensic Wipe
                  </div>
                  <div className="text-[10px] text-white/50 font-sans">
                    Compare pre/post satellite imagery slider
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-[#10B981]" />
              </button>

              <button
                onClick={() => onNavigate('reports')}
                className="w-full p-2.5 bg-[#14201A] hover:bg-[#182620] border border-white/10 hover:border-[#10B981]/50 rounded-sm text-left flex items-center justify-between transition-colors group"
              >
                <div>
                  <div className="font-semibold text-white group-hover:text-[#4EDEA3]">
                    3. Generate Evidence Dossier
                  </div>
                  <div className="text-[10px] text-white/50 font-sans">
                    Produce court-admissible law enforcement report
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-[#10B981]" />
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 bg-[#080E0B] p-2 rounded-sm text-[10px] text-white/50 flex items-center justify-between">
            <span>OPERATIONAL READINESS:</span>
            <span className="text-[#10B981] font-bold">DEFCON-1 ENFORCEMENT</span>
          </div>
        </div>
      </div>
    </div>
  );
};
