import React from 'react';
import { Crosshair, Compass, Mountain, CloudRain, Radio } from 'lucide-react';

interface TelemetryReticleProps {
  lat: number;
  lng: number;
  utmZone?: string;
  elevationM?: number;
  cloudCoverPct?: number;
  radarCoherenceDropPct?: number;
  compact?: boolean;
}

export const TelemetryReticle: React.FC<TelemetryReticleProps> = ({
  lat,
  lng,
  utmZone = '21S 706820E 9642930N',
  elevationM = 114,
  cloudCoverPct = 8.5,
  radarCoherenceDropPct = 76.8,
  compact = false
}) => {
  const formatCoord = (val: number, isLat: boolean) => {
    const dir = isLat ? (val >= 0 ? 'N' : 'S') : (val >= 0 ? 'E' : 'W');
    const abs = Math.abs(val);
    const deg = Math.floor(abs);
    const minFloat = (abs - deg) * 60;
    const min = Math.floor(minFloat);
    const sec = ((minFloat - min) * 60).toFixed(1);
    return `${deg}°${min.toString().padStart(2, '0')}'${sec}" ${dir}`;
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-2 text-[11px] font-mono bg-[#0D1612] px-2.5 py-1 border border-white/10 rounded-sm text-white/80">
        <Crosshair className="w-3.5 h-3.5 text-[#10B981]" />
        <span>{lat.toFixed(4)}°, {lng.toFixed(4)}°</span>
        <span className="text-white/40">|</span>
        <span className="text-[#06B6D4]">{utmZone}</span>
      </div>
    );
  }

  return (
    <div className="bg-[#0D1612] border border-white/10 rounded-sm p-3 relative overflow-hidden font-mono text-xs">
      {/* Decorative reticle target corner marks */}
      <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-[#10B981]"></div>
      <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-[#10B981]"></div>
      <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-[#10B981]"></div>
      <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-[#10B981]"></div>

      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2.5">
        <div className="flex items-center space-x-1.5 text-[#10B981] font-semibold text-[11px] uppercase tracking-wider">
          <Crosshair className="w-4 h-4 animate-spin" style={{ animationDuration: '12s' }} />
          <span>SPATIAL TARGET RETICLE</span>
        </div>
        <span className="text-[10px] text-white/50 bg-[#14201A] px-1.5 py-0.5 rounded-sm border border-white/5">
          LOCK: ACQUIRED
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        {/* Lat/Long DMS */}
        <div className="bg-[#080E0B] p-2 rounded-sm border border-white/5">
          <div className="text-[10px] text-white/40 flex items-center space-x-1 mb-0.5">
            <Compass className="w-3 h-3 text-[#06B6D4]" />
            <span>WGS84 GEODETIC</span>
          </div>
          <div className="text-[#DBE5DE] font-semibold">{formatCoord(lat, true)}</div>
          <div className="text-[#DBE5DE] font-semibold">{formatCoord(lng, false)}</div>
        </div>

        {/* Decimal & UTM */}
        <div className="bg-[#080E0B] p-2 rounded-sm border border-white/5">
          <div className="text-[10px] text-white/40 mb-0.5">DECIMAL & UTM</div>
          <div className="text-white/80">{lat.toFixed(5)}°, {lng.toFixed(5)}°</div>
          <div className="text-[#06B6D4] text-[10px] truncate" title={utmZone}>{utmZone}</div>
        </div>

        {/* Elevation & Cloud Cover */}
        <div className="bg-[#080E0B] p-2 rounded-sm border border-white/5 flex justify-between items-center">
          <div>
            <div className="text-[10px] text-white/40 flex items-center space-x-1">
              <Mountain className="w-3 h-3 text-white/40" />
              <span>ELEVATION</span>
            </div>
            <div className="text-[#DBE5DE] font-semibold">{elevationM} m ASL</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-white/40 flex items-center justify-end space-x-1">
              <CloudRain className="w-3 h-3 text-white/40" />
              <span>CLOUD</span>
            </div>
            <div className="text-[#DBE5DE]">{cloudCoverPct}%</div>
          </div>
        </div>

        {/* Radar Coherence Drop */}
        <div className="bg-[#080E0B] p-2 rounded-sm border border-white/5">
          <div className="text-[10px] text-white/40 flex items-center space-x-1 mb-0.5">
            <Radio className="w-3 h-3 text-[#EF4444]" />
            <span>SAR COHERENCE LOSS</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[#EF4444] font-bold text-sm">-{radarCoherenceDropPct}%</span>
            <div className="flex-1 bg-white/10 h-1.5 rounded-sm overflow-hidden">
              <div
                className="bg-[#EF4444] h-full"
                style={{ width: `${Math.min(100, radarCoherenceDropPct)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
