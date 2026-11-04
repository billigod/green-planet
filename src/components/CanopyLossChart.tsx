import React, { useState } from 'react';
import { TrendingDown, Calendar, ShieldAlert } from 'lucide-react';

interface CanopyLossChartProps {
  title?: string;
  subtitle?: string;
}

export const CanopyLossChart: React.FC<CanopyLossChartProps> = ({
  title = 'CANOPY LOSS ACCUMULATION & BASELINE DELTA',
  subtitle = 'Dual-tone area chart: Intact Canopy Baseline vs Detected Deforestation Incursions'
}) => {
  const [timeframe, setTimeframe] = useState<'7D' | '30D' | '90D' | '1Y'>('30D');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Timeframe datasets
  const dataMap = {
    '7D': [
      { date: 'Oct 27', baseline: 100, loss: 4.2, incursionRate: 18 },
      { date: 'Oct 28', baseline: 99.8, loss: 7.8, incursionRate: 35 },
      { date: 'Oct 29', baseline: 99.5, loss: 12.1, incursionRate: 42 },
      { date: 'Oct 30', baseline: 99.1, loss: 16.4, incursionRate: 38 },
      { date: 'Oct 31', baseline: 98.7, loss: 24.5, incursionRate: 64 },
      { date: 'Nov 01', baseline: 98.2, loss: 33.0, incursionRate: 85 },
      { date: 'Nov 02', baseline: 97.6, loss: 42.6, incursionRate: 98 }
    ],
    '30D': [
      { date: 'Wk 1 (Oct 05)', baseline: 100, loss: 18.4, incursionRate: 22 },
      { date: 'Wk 2 (Oct 12)', baseline: 99.2, loss: 46.8, incursionRate: 48 },
      { date: 'Wk 3 (Oct 19)', baseline: 98.1, loss: 94.2, incursionRate: 75 },
      { date: 'Wk 4 (Oct 26)', baseline: 96.5, loss: 158.7, incursionRate: 110 },
      { date: 'Wk 5 (Nov 02)', baseline: 94.2, loss: 248.5, incursionRate: 142 }
    ],
    '90D': [
      { date: 'Aug 2026', baseline: 100, loss: 124.0, incursionRate: 80 },
      { date: 'Sep 2026', baseline: 97.4, loss: 380.5, incursionRate: 145 },
      { date: 'Oct 2026', baseline: 94.8, loss: 712.0, incursionRate: 210 },
      { date: 'Nov 2026', baseline: 92.1, loss: 985.4, incursionRate: 265 }
    ],
    '1Y': [
      { date: 'Q4 2025', baseline: 100, loss: 310.0, incursionRate: 90 },
      { date: 'Q1 2026', baseline: 98.2, loss: 720.0, incursionRate: 120 },
      { date: 'Q2 2026', baseline: 95.8, loss: 1450.0, incursionRate: 195 },
      { date: 'Q3 2026', baseline: 93.1, loss: 2380.0, incursionRate: 280 },
      { date: 'Q4 2026', baseline: 90.4, loss: 3410.0, incursionRate: 340 }
    ]
  };

  const currentData = dataMap[timeframe];
  const maxLoss = Math.max(...currentData.map(d => d.loss)) * 1.15;

  // SVG coordinate calculations
  const svgWidth = 600;
  const svgHeight = 200;
  const paddingX = 40;
  const paddingY = 25;

  const points = currentData.map((d, i) => {
    const x = paddingX + (i / (currentData.length - 1)) * (svgWidth - paddingX * 2);
    const y = svgHeight - paddingY - (d.loss / maxLoss) * (svgHeight - paddingY * 2);
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`;

  return (
    <div className="bg-[#0D1612] border border-white/10 rounded-sm p-4 text-xs font-mono">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3 mb-3">
        <div>
          <div className="flex items-center space-x-2 text-[#10B981] font-semibold text-[11px] tracking-wider">
            <TrendingDown className="w-4 h-4 text-[#EF4444]" />
            <span>{title}</span>
          </div>
          <div className="text-white/50 text-[10px] mt-0.5">{subtitle}</div>
        </div>

        {/* Timeframe pill selector */}
        <div className="flex items-center space-x-1 bg-[#080E0B] p-1 border border-white/10 rounded-sm">
          {(['7D', '30D', '90D', '1Y'] as const).map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-0.5 rounded-sm text-[10px] font-semibold transition-colors ${
                timeframe === tf
                  ? 'bg-[#10B981] text-[#080E0B]'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-44 overflow-visible"
        >
          <defs>
            {/* Deforestation incursion crimson-amber gradient */}
            <linearGradient id="lossGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.45" />
              <stop offset="70%" stopColor="#F59E0B" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>

            {/* Subtle horizontal grid lines */}
            <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            </pattern>
          </defs>

          {/* Grid Background */}
          <rect width={svgWidth} height={svgHeight} fill="url(#grid)" />

          {/* Baseline Canopy Reference Line (Top Green Boundary) */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={svgWidth - paddingX}
            y2={paddingY}
            stroke="#10B981"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.4"
          />
          <text
            x={paddingX + 6}
            y={paddingY - 6}
            fill="#10B981"
            fontSize="9"
            opacity="0.7"
          >
            UNDISTURBED CANOPY INTEGRITY BASELINE
          </text>

          {/* Incursion Area Fill */}
          <path d={areaD} fill="url(#lossGradient)" />

          {/* Incursion Perimeter Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#EF4444"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {points.map((pt, i) => (
            <g
              key={i}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoveredIndex === i ? 6 : 4}
                fill="#080E0B"
                stroke={hoveredIndex === i ? '#FFFFFF' : '#EF4444'}
                strokeWidth="2"
                className="transition-all"
              />
              {/* X Axis Date labels */}
              <text
                x={pt.x}
                y={svgHeight - 6}
                fill="rgba(255,255,255,0.4)"
                fontSize="9"
                textAnchor="middle"
              >
                {pt.date}
              </text>
            </g>
          ))}

          {/* Active Hover Marker */}
          {hoveredIndex !== null && (
            <g>
              <line
                x1={points[hoveredIndex].x}
                y1={paddingY}
                x2={points[hoveredIndex].x}
                y2={svgHeight - paddingY}
                stroke="rgba(255,255,255,0.25)"
                strokeDasharray="2 2"
              />
            </g>
          )}
        </svg>

        {/* Hover Floating Tooltip HUD */}
        {hoveredIndex !== null && (
          <div
            className="absolute top-2 pointer-events-none bg-[#14201A] border border-[#EF4444] p-2 rounded-sm shadow-xl text-[10px] z-20"
            style={{
              left: `${(points[hoveredIndex].x / svgWidth) * 100}%`,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="text-white/60 font-semibold">{points[hoveredIndex].date}</div>
            <div className="text-[#EF4444] font-bold text-xs mt-0.5">
              Accumulated Loss: {points[hoveredIndex].loss} Ha
            </div>
            <div className="text-white/80">
              Canopy Retention: {points[hoveredIndex].baseline}%
            </div>
            <div className="text-[#F59E0B]">
              Incursion Velocity: {points[hoveredIndex].incursionRate} Ha/wk
            </div>
          </div>
        )}
      </div>

      {/* Metric Readout Matrix Footer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 mt-2 border-t border-white/5 text-[10px]">
        <div className="bg-[#080E0B] p-2 rounded-sm border border-white/5">
          <div className="text-white/40">NET CANOPY LOSS ({timeframe})</div>
          <div className="text-[#EF4444] text-sm font-bold mt-0.5">
            {currentData[currentData.length - 1].loss} HECTARES
          </div>
        </div>

        <div className="bg-[#080E0B] p-2 rounded-sm border border-white/5">
          <div className="text-white/40">MAX VELOCITY DETECTED</div>
          <div className="text-[#F59E0B] text-sm font-bold mt-0.5">
            {Math.max(...currentData.map(d => d.incursionRate))} HA / CYCLE
          </div>
        </div>

        <div className="bg-[#080E0B] p-2 rounded-sm border border-white/5">
          <div className="text-white/40">MEAN CANOPY RETENTION</div>
          <div className="text-[#10B981] text-sm font-bold mt-0.5">
            {(currentData.reduce((acc, d) => acc + d.baseline, 0) / currentData.length).toFixed(1)}%
          </div>
        </div>

        <div className="bg-[#080E0B] p-2 rounded-sm border border-white/5">
          <div className="text-white/40">SAR COHERENCE STATE</div>
          <div className="text-[#06B6D4] text-sm font-bold mt-0.5 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] animate-ping"></span>
            <span>POLARIMETRIC SYNC</span>
          </div>
        </div>
      </div>
    </div>
  );
};
