import React, { useState } from 'react';
import { 
  Settings2, 
  Save, 
  Sliders, 
  Bell, 
  Radio, 
  Compass, 
  ShieldCheck, 
  RotateCcw,
  Volume2,
  CheckCircle2
} from 'lucide-react';
import { MonitoringSettings } from '../types';

interface SettingsViewProps {
  settings: MonitoringSettings;
  onSaveSettings: (newSettings: MonitoringSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings
}) => {
  const [current, setCurrent] = useState<MonitoringSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(current);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const resetDefaults = () => {
    setCurrent({
      ndviDropThresholdPct: 20,
      sarCoherenceThreshold: 0.35,
      minLossAreaAlertHectares: 1.0,
      telemetryIngestRateSec: 30,
      cloudMaskingMaxPct: 30,
      alertChannels: {
        rangerMeshRadio: true,
        interpolEcoDesk: true,
        smsBroadcast: false,
        webhookDispatch: true
      },
      coordinateFormat: 'decimal',
      autoTaskPlanetScope: true,
      highContrastHUD: false,
      tacticalAudioAlerts: true
    });
  };

  return (
    <div className="space-y-4 font-mono text-xs max-w-4xl">
      {/* Header */}
      <div className="bg-[#0D1612] border border-white/10 rounded-sm p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-[10px] text-[#10B981] font-semibold uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping"></span>
              <span>OPERATIONS CENTER PARAMETERS</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans">
              Monitoring & Ingest Configuration
            </h1>
            <p className="text-white/60 text-xs mt-1 font-sans">
              Calibrate sensor sensitivity thresholds, SAR coherence trigger filters, and automated dispatch routing.
            </p>
          </div>

          {savedSuccess && (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#10B981]/20 border border-[#10B981] text-[#10B981] rounded-sm font-bold animate-pulse">
              <CheckCircle2 className="w-4 h-4" />
              <span>SETTINGS PERSISTED</span>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Section 1: Sensor & Algorithmic Detection Thresholds */}
        <div className="bg-[#0D1612] border border-white/10 rounded-sm p-4 space-y-4">
          <div className="flex items-center space-x-2 text-[#10B981] font-semibold text-[11px] uppercase border-b border-white/10 pb-2">
            <Sliders className="w-3.5 h-3.5" />
            <span>1. SENSOR INGESTION & ANOMALY THRESHOLDS</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* NDVI Drop Sensitivity */}
            <div>
              <div className="flex justify-between items-center mb-1 text-[11px]">
                <span className="text-white/80">NDVI Drop Threshold</span>
                <span className="text-[#10B981] font-bold">-{current.ndviDropThresholdPct}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="50"
                step="5"
                value={current.ndviDropThresholdPct}
                onChange={e => setCurrent({ ...current, ndviDropThresholdPct: parseInt(e.target.value, 10) })}
                className="w-full accent-[#10B981] bg-white/10 h-1.5 rounded cursor-pointer"
              />
              <span className="text-[10px] text-white/40 block mt-1">
                Minimum canopy chlorophyll spectral drop to flag automated incursion polygon.
              </span>
            </div>

            {/* SAR Coherence Threshold */}
            <div>
              <div className="flex justify-between items-center mb-1 text-[11px]">
                <span className="text-white/80">SAR Coherence Decorrelation Limit</span>
                <span className="text-[#06B6D4] font-bold">{current.sarCoherenceThreshold}</span>
              </div>
              <input
                type="range"
                min="0.15"
                max="0.65"
                step="0.05"
                value={current.sarCoherenceThreshold}
                onChange={e => setCurrent({ ...current, sarCoherenceThreshold: parseFloat(e.target.value) })}
                className="w-full accent-[#06B6D4] bg-white/10 h-1.5 rounded cursor-pointer"
              />
              <span className="text-[10px] text-white/40 block mt-1">
                Interferometric radar correlation boundary below which canopy felling is triggered.
              </span>
            </div>

            {/* Minimum Incursion Area */}
            <div>
              <div className="flex justify-between items-center mb-1 text-[11px]">
                <span className="text-white/80">Minimum Alert Area</span>
                <span className="text-[#F59E0B] font-bold">{current.minLossAreaAlertHectares} Hectares</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="10.0"
                step="0.5"
                value={current.minLossAreaAlertHectares}
                onChange={e => setCurrent({ ...current, minLossAreaAlertHectares: parseFloat(e.target.value) })}
                className="w-full accent-[#F59E0B] bg-white/10 h-1.5 rounded cursor-pointer"
              />
              <span className="text-[10px] text-white/40 block mt-1">
                Filters micro-canopy gaps and natural wind-throw events below selected threshold.
              </span>
            </div>

            {/* Cloud Masking Ceiling */}
            <div>
              <div className="flex justify-between items-center mb-1 text-[11px]">
                <span className="text-white/80">Max Optical Cloud Mask Tolerance</span>
                <span className="text-white font-bold">{current.cloudMaskingMaxPct}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                step="5"
                value={current.cloudMaskingMaxPct}
                onChange={e => setCurrent({ ...current, cloudMaskingMaxPct: parseInt(e.target.value, 10) })}
                className="w-full accent-white bg-white/10 h-1.5 rounded cursor-pointer"
              />
              <span className="text-[10px] text-white/40 block mt-1">
                Scenes with cloud coverage above this percentage automatically fallback to SAR radar passes.
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Alert Notification Channels */}
        <div className="bg-[#0D1612] border border-white/10 rounded-sm p-4 space-y-3">
          <div className="flex items-center space-x-2 text-[#06B6D4] font-semibold text-[11px] uppercase border-b border-white/10 pb-2">
            <Bell className="w-3.5 h-3.5" />
            <span>2. AUTOMATED TACTICAL DISPATCH CHANNELS</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-start space-x-3 bg-[#080E0B] p-2.5 rounded-sm border border-white/5 cursor-pointer hover:border-white/20 transition-colors">
              <input
                type="checkbox"
                checked={current.alertChannels.rangerMeshRadio}
                onChange={e => setCurrent({
                  ...current,
                  alertChannels: { ...current.alertChannels, rangerMeshRadio: e.target.checked }
                })}
                className="mt-0.5 w-4 h-4 accent-[#10B981] rounded-sm"
              />
              <div>
                <div className="font-semibold text-white text-xs">Ranger Field Mesh Radio (AES-256)</div>
                <div className="text-[10px] text-white/50 mt-0.5">
                  Direct encrypted radio packet dispatch to riverine and ground patrol teams.
                </div>
              </div>
            </label>

            <label className="flex items-start space-x-3 bg-[#080E0B] p-2.5 rounded-sm border border-white/5 cursor-pointer hover:border-white/20 transition-colors">
              <input
                type="checkbox"
                checked={current.alertChannels.interpolEcoDesk}
                onChange={e => setCurrent({
                  ...current,
                  alertChannels: { ...current.alertChannels, interpolEcoDesk: e.target.checked }
                })}
                className="mt-0.5 w-4 h-4 accent-[#10B981] rounded-sm"
              />
              <div>
                <div className="font-semibold text-white text-xs">Interpol Eco-Crime Desk Relay</div>
                <div className="text-[10px] text-white/50 mt-0.5">
                  Automated notices sent for cross-border illegal timber trafficking infractions.
                </div>
              </div>
            </label>

            <label className="flex items-start space-x-3 bg-[#080E0B] p-2.5 rounded-sm border border-white/5 cursor-pointer hover:border-white/20 transition-colors">
              <input
                type="checkbox"
                checked={current.alertChannels.webhookDispatch}
                onChange={e => setCurrent({
                  ...current,
                  alertChannels: { ...current.alertChannels, webhookDispatch: e.target.checked }
                })}
                className="mt-0.5 w-4 h-4 accent-[#10B981] rounded-sm"
              />
              <div>
                <div className="font-semibold text-white text-xs">Enforcement API Webhook Dispatch</div>
                <div className="text-[10px] text-white/50 mt-0.5">
                  Real-time JSON payload dispatch to government environmental agency systems.
                </div>
              </div>
            </label>

            <label className="flex items-start space-x-3 bg-[#080E0B] p-2.5 rounded-sm border border-white/5 cursor-pointer hover:border-white/20 transition-colors">
              <input
                type="checkbox"
                checked={current.alertChannels.smsBroadcast}
                onChange={e => setCurrent({
                  ...current,
                  alertChannels: { ...current.alertChannels, smsBroadcast: e.target.checked }
                })}
                className="mt-0.5 w-4 h-4 accent-[#10B981] rounded-sm"
              />
              <div>
                <div className="font-semibold text-white text-xs">SMS Emergency Broadcast</div>
                <div className="text-[10px] text-white/50 mt-0.5">
                  Sends high-priority SMS alerts to duty officers and regional command directors.
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Section 3: Tactical Display & Automation */}
        <div className="bg-[#0D1612] border border-white/10 rounded-sm p-4 space-y-3">
          <div className="flex items-center space-x-2 text-[#F59E0B] font-semibold text-[11px] uppercase border-b border-white/10 pb-2">
            <Compass className="w-3.5 h-3.5" />
            <span>3. HUD TELEMETRY & AUTOMATION RULES</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-white/50 block mb-1">COORDINATE FORMAT</label>
              <select
                value={current.coordinateFormat}
                onChange={e => setCurrent({ ...current, coordinateFormat: e.target.value as any })}
                className="w-full bg-[#080E0B] border border-white/10 text-white px-2.5 py-1.5 rounded-sm text-xs focus:outline-none"
              >
                <option value="decimal">Decimal Degrees (DD.ddddd°)</option>
                <option value="dms">Degrees Minutes Seconds (DMS)</option>
                <option value="mgrs">Military Grid Reference (MGRS / UTM)</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 pt-4">
              <input
                type="checkbox"
                id="autoTask"
                checked={current.autoTaskPlanetScope}
                onChange={e => setCurrent({ ...current, autoTaskPlanetScope: e.target.checked })}
                className="w-4 h-4 accent-[#10B981] rounded-sm"
              />
              <label htmlFor="autoTask" className="text-white/80 text-xs cursor-pointer">
                Auto-task PlanetScope 3m on critical alerts
              </label>
            </div>

            <div className="flex items-center space-x-2 pt-4">
              <input
                type="checkbox"
                id="tacticalAudio"
                checked={current.tacticalAudioAlerts}
                onChange={e => setCurrent({ ...current, tacticalAudioAlerts: e.target.checked })}
                className="w-4 h-4 accent-[#10B981] rounded-sm"
              />
              <label htmlFor="tacticalAudio" className="text-white/80 text-xs cursor-pointer flex items-center space-x-1">
                <Volume2 className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Tactical radar audio chimes</span>
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={resetDefaults}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-sm text-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET TO FACTORY DEFAULTS</span>
          </button>

          <button
            type="submit"
            className="flex items-center space-x-1.5 px-4 py-2 bg-[#10B981] hover:bg-[#34D399] text-[#080E0B] font-bold rounded-sm text-xs transition-colors shadow-[0_0_12px_rgba(16,185,129,0.3)]"
          >
            <Save className="w-3.5 h-3.5" />
            <span>SAVE CONFIGURATION</span>
          </button>
        </div>
      </form>
    </div>
  );
};
