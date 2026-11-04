import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingDown, 
  TreePine, 
  Activity, 
  Layers, 
  ShieldAlert, 
  Download, 
  Sparkles, 
  PieChart, 
  Compass, 
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { CanopyLossChart } from '../components/CanopyLossChart';
import { MonitoredAOI } from '../types';

interface AnalyticsViewProps {
  aois: MonitoredAOI[];
  selectedAoi: MonitoredAOI;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  aois,
  selectedAoi
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'30D' | '90D' | '1Y'>('30D');

  // Deforestation Drivers Breakdown
  const drivers = [
    { name: 'Cattle Ranching & Pasture Expansion', pct: 54, ha: 222.9, color: '#EF4444' },
    { name: 'Commercial Logging Road Spurs', pct: 22, ha: 90.8, color: '#F59E0B' },
    { name: 'Illegal Alluvial Gold Mining', pct: 12, ha: 49.5, color: '#06B6D4' },
    { name: 'Slash & Burn Agriculture Fires', pct: 8, ha: 33.0, color: '#FF7043' },
    { name: 'Infrastructure & Encroachment', pct: 4, ha: 16.5, color: '#A78BFA' }
  ];

  // Predictive Risk AI Matrix
  const riskZones = [
    { sector: 'Tapajós Western Riverine Sector 4', vulnerabilityScore: 94, threatLevel: 'EXTREME', projectedLoss30d: '65 Ha', driver: 'Road Spur West' },
    { sector: 'Salonga Peat Buffer North', vulnerabilityScore: 78, threatLevel: 'HIGH', projectedLoss30d: '28 Ha', driver: 'Slash & Burn' },
    { sector: 'Danum Segama Tributary Riparian', vulnerabilityScore: 62, threatLevel: 'MODERATE', projectedLoss30d: '12 Ha', driver: 'Turbid Gold Dredging' },
    { sector: 'Gran Chaco Frontier Salta Block 8', vulnerabilityScore: 98, threatLevel: 'EXTREME', projectedLoss30d: '140 Ha', driver: 'Chaining Bulldozers' },
    { sector: 'Leuser Western Elephant Migration Corridor', vulnerabilityScore: 84, threatLevel: 'HIGH', projectedLoss30d: '45 Ha', driver: 'Illegal Oil Palm Nursery' }
  ];

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Header Banner */}
      <div className="bg-[#0D1612] border border-white/10 rounded-sm p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-[10px] text-[#10B981] font-semibold uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping"></span>
              <span>BIOME-WIDE ANALYTICAL TELEMETRY</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans">
              Forest Loss Analytics & Predictive AI Risk
            </h1>
            <p className="text-white/60 text-xs mt-1 font-sans">
              Multi-temporal canopy loss trends, biomass depletion calculations, and machine learning spatial vulnerability modeling.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-white/50 text-[10px]">ANALYSIS TIMEFRAME:</span>
            <div className="flex items-center space-x-1 bg-[#080E0B] p-1 border border-white/10 rounded-sm">
              {(['30D', '90D', '1Y'] as const).map(tf => (
                <button
                  key={tf}
                  onClick={() => setSelectedTimeframe(tf)}
                  className={`px-2.5 py-0.5 rounded-sm text-[10px] font-semibold transition-colors ${
                    selectedTimeframe === tf
                      ? 'bg-[#10B981] text-[#080E0B]'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Global Key Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 mt-4 border-t border-white/5 text-[11px]">
          <div className="bg-[#080E0B] p-2.5 rounded-sm border border-white/5">
            <div className="text-white/40">ACCUMULATED LOSS ({selectedTimeframe})</div>
            <div className="text-[#EF4444] font-bold text-lg mt-0.5">
              {selectedTimeframe === '30D' ? '412.8 Ha' : selectedTimeframe === '90D' ? '985.4 Ha' : '3,410 Ha'}
            </div>
          </div>

          <div className="bg-[#080E0B] p-2.5 rounded-sm border border-white/5">
            <div className="text-white/40">TOTAL CARBON FLUX</div>
            <div className="text-white font-bold text-lg mt-0.5">
              {selectedTimeframe === '30D' ? '82,400' : selectedTimeframe === '90D' ? '194,000' : '680,000'} tCO2e
            </div>
          </div>

          <div className="bg-[#080E0B] p-2.5 rounded-sm border border-white/5">
            <div className="text-white/40">PRIMARY DRIVER</div>
            <div className="text-[#F59E0B] font-bold text-lg mt-0.5">
              CATTLE PASTURE (54%)
            </div>
          </div>

          <div className="bg-[#080E0B] p-2.5 rounded-sm border border-white/5">
            <div className="text-white/40">PREDICTIVE MODEL ACCURACY</div>
            <div className="text-[#10B981] font-bold text-lg mt-0.5">
              96.8% (AUC-ROC)
            </div>
          </div>
        </div>
      </div>

      {/* Main Dual-Tone Area Chart */}
      <CanopyLossChart
        title={`HISTORICAL CANOPY LOSS DELTA (${selectedTimeframe})`}
        subtitle="Dual-tone area chart: Undisturbed Canopy Baseline vs Real-time Detected Scars"
      />

      {/* Secondary Grid: Drivers Breakdown & Predictive AI Risk Model */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Drivers Breakdown */}
        <div className="bg-[#0D1612] border border-white/10 rounded-sm p-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
            <div className="flex items-center space-x-2 text-[11px] font-semibold text-[#10B981] uppercase">
              <PieChart className="w-3.5 h-3.5 text-[#10B981]" />
              <span>DEFORESTATION DRIVERS CLASSIFICATION</span>
            </div>
            <span className="text-[10px] text-white/40">ALGORITHMIC ATTRIBUTION</span>
          </div>

          <div className="space-y-3">
            {drivers.map(driver => (
              <div key={driver.name} className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-white/80">{driver.name}</span>
                  <span className="font-bold font-mono" style={{ color: driver.color }}>
                    {driver.pct}% ({driver.ha} Ha)
                  </span>
                </div>
                {/* Visual bar */}
                <div className="w-full bg-[#080E0B] h-2 rounded-sm overflow-hidden border border-white/5">
                  <div
                    className="h-full rounded-sm transition-all duration-500"
                    style={{ width: `${driver.pct}%`, backgroundColor: driver.color }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-white/50 leading-relaxed font-sans">
            Attribution derived from high-resolution morphological vector shapes (linear roads vs grid clearing) combined with agricultural register cross-referencing.
          </div>
        </div>

        {/* Predictive AI Incursion Risk Matrix */}
        <div className="bg-[#0D1612] border border-white/10 rounded-sm p-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
            <div className="flex items-center space-x-2 text-[11px] font-semibold text-[#06B6D4] uppercase">
              <Sparkles className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span>PREDICTIVE AI VULNERABILITY MODEL (30-DAY FORECAST)</span>
            </div>
            <span className="text-[9px] bg-[#06B6D4]/10 text-[#06B6D4] px-1 py-0.2 rounded">HEURISTIC AI</span>
          </div>

          <div className="space-y-2">
            {riskZones.map(zone => (
              <div
                key={zone.sector}
                className="bg-[#080E0B] p-2.5 rounded-sm border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="font-semibold text-white/90 text-xs font-sans">
                    {zone.sector}
                  </div>
                  <div className="text-[10px] text-white/50 mt-0.5">
                    Lead Vector: <span className="text-white/80">{zone.driver}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 self-end sm:self-center">
                  <div className="text-right">
                    <span
                      className={`px-1.5 py-0.2 rounded-sm text-[9px] font-bold ${
                        zone.threatLevel === 'EXTREME'
                          ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30'
                          : 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30'
                      }`}
                    >
                      {zone.threatLevel} ({zone.vulnerabilityScore}%)
                    </span>
                    <div className="text-[10px] text-white/40 mt-0.5">
                      Proj: {zone.projectedLoss30d}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Biome Health Comparative Matrix */}
      <div className="bg-[#0D1612] border border-white/10 rounded-sm p-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
          <div className="flex items-center space-x-2 text-[11px] font-semibold text-[#10B981] uppercase">
            <TreePine className="w-3.5 h-3.5" />
            <span>GLOBAL BIOME CANOPY INTEGRITY COMPARISON</span>
          </div>
          <span className="text-[10px] text-white/40">5 MONITORED BIOSPHERE SECTORS</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {aois.map(a => (
            <div key={a.id} className="bg-[#080E0B] p-3 rounded-sm border border-white/5">
              <div className="text-[10px] text-white/40 truncate">{a.country}</div>
              <div className="font-bold text-white text-xs mt-0.5 truncate" title={a.name}>
                {a.name}
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-lg font-bold text-[#10B981]">{a.canopyIntegrityPct}%</span>
                <span className={`text-[9px] font-bold px-1 rounded ${
                  a.riskLevel === 'CRITICAL' ? 'bg-[#EF4444]/20 text-[#EF4444]' :
                  a.riskLevel === 'ELEVATED' ? 'bg-[#F59E0B]/20 text-[#F59E0B]' :
                  'bg-[#10B981]/20 text-[#10B981]'
                }`}>
                  {a.riskLevel}
                </span>
              </div>
              <div className="w-full bg-white/10 h-1 rounded-sm mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-[#10B981]"
                  style={{ width: `${a.canopyIntegrityPct}%` }}
                ></div>
              </div>
              <div className="text-[9px] text-white/40 mt-2 flex justify-between">
                <span>Loss: {a.treeCoverLossHa} Ha</span>
                <span>{a.activeAlertsCount} alerts</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
