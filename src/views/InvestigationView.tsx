import React, { useState } from 'react';
import { 
  ShieldAlert, 
  TreePine, 
  Activity, 
  MapPin, 
  Clock, 
  FileText, 
  Send, 
  CheckCircle, 
  AlertTriangle, 
  Scale, 
  Radio, 
  Sparkles, 
  Truck, 
  ChevronLeft,
  Share2,
  Download,
  Flame,
  PlusCircle
} from 'lucide-react';
import { Incident, IncidentStatus } from '../types';
import { BeforeAfterSlider } from '../components/BeforeAfterSlider';
import { TelemetryReticle } from '../components/TelemetryReticle';

interface InvestigationViewProps {
  incident: Incident;
  allIncidents: Incident[];
  onSelectIncident: (incident: Incident) => void;
  onUpdateStatus: (incidentId: string, newStatus: IncidentStatus) => void;
  onAddNote: (incidentId: string, noteText: string) => void;
  onDispatchRanger: (incidentId: string, unitName: string) => void;
  onGenerateReport: (incident: Incident) => void;
  onAskAi: (incident: Incident) => void;
}

export const InvestigationView: React.FC<InvestigationViewProps> = ({
  incident,
  allIncidents,
  onSelectIncident,
  onUpdateStatus,
  onAddNote,
  onDispatchRanger,
  onGenerateReport,
  onAskAi
}) => {
  const [newNote, setNewNote] = useState<string>('');
  const [dispatchModalOpen, setDispatchModalOpen] = useState<boolean>(false);
  const [patrolUnitInput, setPatrolUnitInput] = useState<string>('IBAMA Rapid Reaction Force Team Alpha');

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    onAddNote(incident.id, newNote.trim());
    setNewNote('');
  };

  const handleDispatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patrolUnitInput.trim()) return;
    onDispatchRanger(incident.id, patrolUnitInput.trim());
    setDispatchModalOpen(false);
  };

  // Estimated financial fine calculation under environmental law
  const estimatedFineBRL = (incident.lossAreaHectares * 5000 * 1.5).toLocaleString('pt-BR');
  const estimatedFineUSD = Math.round(incident.lossAreaHectares * 1350).toLocaleString('en-US');

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Top Header & Breadcrumbs */}
      <div className="bg-[#0D1612] border border-white/10 rounded-sm p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-[10px] text-white/50 mb-1">
              <span className="text-[#10B981] font-semibold">INCIDENT DOSSIER</span>
              <span>/</span>
              <span className="text-white/80">{incident.aoiName}</span>
              <span>/</span>
              <span className="text-[#06B6D4] font-bold">{incident.id}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans">
                {incident.title}
              </h1>
              <span
                className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider ${
                  incident.severity === 'critical'
                    ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40'
                    : incident.severity === 'warning'
                    ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40'
                    : 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40'
                }`}
              >
                {incident.severity}
              </span>
            </div>

            <div className="text-white/50 text-xs mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>Jurisdiction: <strong className="text-white/80">{incident.legalJurisdiction}</strong></span>
              <span>Detected: <strong className="text-white/80">{incident.timestamp}</strong></span>
              <span>Primary Sensor: <strong className="text-[#06B6D4]">{incident.detectedBy}</strong></span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onAskAi(incident)}
              className="flex items-center space-x-1.5 px-3 py-2 bg-[#06B6D4]/15 hover:bg-[#06B6D4]/25 border border-[#06B6D4]/40 text-[#4CD7F6] rounded-sm text-xs transition-colors font-bold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>ASK SENTINEL AI</span>
            </button>

            <button
              onClick={() => onGenerateReport(incident)}
              className="flex items-center space-x-1.5 px-3 py-2 bg-[#10B981] hover:bg-[#34D399] text-[#080E0B] rounded-sm text-xs transition-colors font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)]"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>GENERATE EVIDENCE DOSSIER</span>
            </button>
          </div>
        </div>

        {/* Status bar & Operational Dispatcher button */}
        <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-[11px]">
          <div className="flex items-center space-x-2">
            <span className="text-white/50">VERIFICATION & ENFORCEMENT STATE:</span>
            <select
              value={incident.status}
              onChange={e => onUpdateStatus(incident.id, e.target.value as IncidentStatus)}
              className="bg-[#080E0B] border border-[#10B981]/40 text-[#4EDEA3] px-2.5 py-1 rounded-sm font-bold focus:outline-none"
            >
              <option value="UNVERIFIED">UNVERIFIED (PENDING PATROL)</option>
              <option value="UNDER_REVIEW">UNDER REVIEW (DUTY ANALYST)</option>
              <option value="VERIFIED">VERIFIED (CONFIRMED DISTURBANCE)</option>
              <option value="REJECTED">REJECTED (FALSE POSITIVE / NATURAL)</option>
              <option value="active_investigation">ACTIVE INVESTIGATION</option>
              <option value="ground_dispatched">GROUND PATROL DISPATCHED</option>
              <option value="verified_incursion">VERIFIED ILLEGAL INCURSION</option>
              <option value="permit_cleared">VERIFIED LEGAL PERMIT</option>
              <option value="closed">CASE CLOSED</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            {incident.groundPatrolUnit ? (
              <div className="flex items-center space-x-1.5 bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/40 px-2.5 py-1 rounded-sm">
                <Truck className="w-3.5 h-3.5" />
                <span>Ranger Unit: {incident.groundPatrolUnit.unitName} (ETA ~{incident.groundPatrolUnit.etaHours}h)</span>
              </div>
            ) : (
              <button
                onClick={() => setDispatchModalOpen(true)}
                className="flex items-center space-x-1 px-3 py-1 bg-[#EF4444]/20 hover:bg-[#EF4444]/30 border border-[#EF4444] text-[#EF4444] rounded-sm font-bold transition-colors"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>DISPATCH GROUND PATROL</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Dual-Temporal Comparison & Reticle HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Dual-Temporal Satellite Before/After Slider (2 Cols) */}
        <div className="lg:col-span-2">
          <BeforeAfterSlider
            preImageUrl={incident.preImageUrl}
            postImageUrl={incident.postImageUrl}
            preDate={incident.preDate}
            postDate={incident.postDate}
            title={incident.title}
            lossAreaHa={incident.lossAreaHectares}
            confidenceScore={incident.confidenceScore}
          />

          {/* Environmental & Carbon Loss Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-[11px]">
            <div className="bg-[#0D1612] p-2.5 rounded-sm border border-white/5">
              <span className="text-white/40 block text-[10px]">DEFORESTED AREA</span>
              <span className="text-lg font-bold text-[#EF4444] font-mono">
                {incident.lossAreaHectares} Ha
              </span>
              <span className="text-[10px] text-white/40 block">~{(incident.lossAreaHectares * 2.47).toFixed(1)} acres</span>
            </div>

            <div className="bg-[#0D1612] p-2.5 rounded-sm border border-white/5">
              <span className="text-white/40 block text-[10px]">LOST WOODY BIOMASS</span>
              <span className="text-lg font-bold text-[#F59E0B] font-mono">
                {incident.biomassLossTonnes.toLocaleString()} t
              </span>
              <span className="text-[10px] text-white/40 block">Above-ground dense</span>
            </div>

            <div className="bg-[#0D1612] p-2.5 rounded-sm border border-white/5">
              <span className="text-white/40 block text-[10px]">CARBON EMISSIONS</span>
              <span className="text-lg font-bold text-white font-mono">
                {incident.carbonEmissionTCO2e.toLocaleString()}
              </span>
              <span className="text-[10px] text-white/40 block">tCO2e gross equiv</span>
            </div>

            <div className="bg-[#0D1612] p-2.5 rounded-sm border border-white/5">
              <span className="text-white/40 block text-[10px]">EST. STATUTORY FINES</span>
              <span className="text-lg font-bold text-[#4EDEA3] font-mono">
                ${estimatedFineUSD}
              </span>
              <span className="text-[10px] text-white/40 block">R$ {estimatedFineBRL}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Spatial Reticle & Legal Compliance */}
        <div className="space-y-3">
          {/* Orbital Satellite Intelligence Dossier */}
          <div className="bg-[#0D1612] border border-[#10B981]/40 rounded-sm p-3 text-xs space-y-2">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <div className="flex items-center space-x-1.5 text-[#10B981] font-bold text-[11px] uppercase">
                <Radio className="w-3.5 h-3.5" />
                <span>REAL SATELLITE INTELLIGENCE</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.2 bg-[#10B981]/20 border border-[#10B981]/40 text-[#10B981] rounded font-bold">
                PROVENANCE: {incident.detectedBy?.includes('Sentinel') || incident.detectedBy?.includes('Orbital') ? 'REAL S2 L2A' : 'BASELINE ARCHIVE'}
              </span>
            </div>

            <div className="space-y-1.5 text-[10px]">
              <div>
                <span className="text-white/40 block">BASELINE SCENE (t0):</span>
                <span className="font-mono text-white/90 break-all">
                  {incident.targetReticle?.source_product_ids?.[0] || incident.baselineObservationId || 'S2A_T21MXR_20240629T140223_L2A'}
                </span>
                <span className="text-[#10B981] block text-[9px]">Acquired: {incident.preDate || '2024-06-29'}</span>
              </div>

              <div className="pt-1 border-t border-white/5">
                <span className="text-white/40 block">MONITORING SCENE (t1):</span>
                <span className="font-mono text-white/90 break-all">
                  {incident.targetReticle?.source_product_ids?.[1] || incident.currentObservationId || 'S2B_T21MXR_20240826T140707_L2A'}
                </span>
                <span className="text-[#F59E0B] block text-[9px]">Acquired: {incident.postDate || '2024-08-26'}</span>
              </div>

              <div className="pt-1 border-t border-white/5 grid grid-cols-2 gap-1.5">
                <div className="bg-[#080E0B] p-1.5 rounded-sm border border-white/5">
                  <span className="text-white/40 block text-[9px]">METHODOLOGY</span>
                  <span className="text-[#4CD7F6] font-bold text-[10px]">
                    {incident.targetReticle?.methodology || 'S2_L2A_MULTISPECTRAL_NDVI_DELTA'}
                  </span>
                </div>
                <div className="bg-[#080E0B] p-1.5 rounded-sm border border-white/5">
                  <span className="text-white/40 block text-[9px]">MEAN NDVI DROP</span>
                  <span className="text-[#EF4444] font-bold text-[10px]">
                    {incident.targetReticle?.mean_ndvi_drop ? `-${incident.targetReticle.mean_ndvi_drop}` : '-0.165'}
                  </span>
                </div>
              </div>

              {incident.targetReticle?.change_polygon && (
                <div className="pt-1 border-t border-white/5 text-[9px] text-white/50">
                  <span className="text-[#10B981] font-bold">WGS84 POLYGON: </span>
                  {incident.targetReticle.change_polygon.type} with {incident.targetReticle.change_polygon.coordinates?.[0]?.length || 0} vertices
                </div>
              )}
            </div>
          </div>

          <TelemetryReticle
            lat={incident.coordinates.lat}
            lng={incident.coordinates.lng}
            utmZone={incident.utmZone}
            elevationM={incident.targetReticle.elevationM}
            cloudCoverPct={incident.targetReticle.cloudCoverPct}
            radarCoherenceDropPct={incident.targetReticle.radarCoherenceDropPct}
          />

          {/* Legal Compliance & Violations Matrix */}
          <div className="bg-[#0D1612] border border-white/10 rounded-sm p-3 text-xs">
            <div className="flex items-center space-x-1.5 text-[#F59E0B] font-semibold text-[11px] mb-2 uppercase border-b border-white/10 pb-1.5">
              <Scale className="w-3.5 h-3.5" />
              <span>LEGAL STATUTES & VIOLATIONS</span>
            </div>
            <div className="space-y-2 text-[11px] text-white/80">
              <div className="bg-[#080E0B] p-2 rounded-sm border border-white/5">
                <div className="text-[#EF4444] font-semibold">BRAZILIAN FOREST CODE (ART. 44)</div>
                <div className="text-white/60 text-[10px] mt-0.5">
                  Prohibited unauthorized clear-cutting in Amazonian Legal Reserve biome.
                </div>
              </div>
              <div className="bg-[#080E0B] p-2 rounded-sm border border-white/5">
                <div className="text-[#F59E0B] font-semibold">EUDR REGULATION (REG 2023/1115)</div>
                <div className="text-white/60 text-[10px] mt-0.5">
                  Deforestation-free due diligence failed. Immediate blacklisting of timber origin polygons.
                </div>
              </div>
              <div className="bg-[#080E0B] p-2 rounded-sm border border-white/5">
                <div className="text-[#06B6D4] font-semibold">US LACEY ACT & INTERPOL NOTICE</div>
                <div className="text-white/60 text-[10px] mt-0.5">
                  Timber trade chain embargo notice forwarded to International Environmental Crimes desk.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Investigation Timeline & Notes Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Chain of Custody & Detection Timeline */}
        <div className="bg-[#0D1612] border border-white/10 rounded-sm p-3.5">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
            <div className="flex items-center space-x-2 text-[11px] font-semibold text-[#10B981] uppercase">
              <Clock className="w-3.5 h-3.5" />
              <span>CHAIN OF CUSTODY TIMELINE</span>
            </div>
            <span className="text-[10px] text-white/40">AUDITED SENSOR LOGS</span>
          </div>

          <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10 pl-6">
            {incident.timeline.map(item => (
              <div key={item.id} className="relative group">
                <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-[#10B981] border-2 border-[#0D1612]"></span>
                <div className="text-[10px] text-[#4EDEA3] font-semibold">{item.timestamp}</div>
                <div className="text-white/90 text-xs mt-0.5">{item.event}</div>
                <div className="text-[10px] text-white/40 mt-0.5">Recorded by: {item.actor}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Forensic Notes & Investigator Log */}
        <div className="bg-[#0D1612] border border-white/10 rounded-sm p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
              <div className="flex items-center space-x-2 text-[11px] font-semibold text-[#06B6D4] uppercase">
                <FileText className="w-3.5 h-3.5" />
                <span>INVESTIGATOR FORENSIC NOTES ({incident.notes.length})</span>
              </div>
              <span className="text-[10px] text-white/40">OFFICIAL RECORD</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto mb-3 pr-1">
              {incident.notes.map(note => (
                <div key={note.id} className="bg-[#080E0B] p-2.5 rounded-sm border border-white/5">
                  <div className="flex items-center justify-between text-[10px] text-white/40 mb-1">
                    <span className="text-[#06B6D4] font-semibold">{note.author}</span>
                    <span>{note.timestamp}</span>
                  </div>
                  <p className="text-white/80 text-xs leading-relaxed font-sans">{note.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Add Note Form */}
          <form onSubmit={handleAddNoteSubmit} className="pt-2 border-t border-white/5">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Add verified geospatial or field note..."
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                className="flex-1 bg-[#080E0B] border border-white/10 focus:border-[#10B981] rounded-sm px-3 py-1.5 text-white text-xs placeholder:text-white/30 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newNote.trim()}
                className="px-3 py-1.5 bg-[#10B981] hover:bg-[#34D399] disabled:opacity-40 text-[#080E0B] font-bold rounded-sm text-xs transition-colors flex items-center space-x-1"
              >
                <Send className="w-3 h-3" />
                <span>POST</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Dispatch Ranger Modal */}
      {dispatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1612] border border-[#EF4444] rounded-sm max-w-md w-full p-4 font-mono shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
              <div className="flex items-center space-x-2 text-[#EF4444] font-bold">
                <Truck className="w-4 h-4 animate-bounce" />
                <span>DISPATCH RANGER GROUND PATROL</span>
              </div>
              <button
                onClick={() => setDispatchModalOpen(false)}
                className="text-white/50 hover:text-white"
              >
                ×
              </button>
            </div>

            <p className="text-white/70 text-xs font-sans mb-3">
              Transmit tactical GPS intercept coordinates ({incident.coordinates.lat.toFixed(4)}°, {incident.coordinates.lng.toFixed(4)}°) to field enforcement taskforce.
            </p>

            <form onSubmit={handleDispatchSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] text-white/50 block mb-1">TASKFORCE UNIT ASSIGNMENT</label>
                <input
                  type="text"
                  value={patrolUnitInput}
                  onChange={e => setPatrolUnitInput(e.target.value)}
                  className="w-full bg-[#080E0B] border border-white/10 focus:border-[#EF4444] rounded-sm px-3 py-2 text-white text-xs focus:outline-none"
                />
              </div>

              <div className="bg-[#14201A] p-2 rounded-sm text-[10px] text-white/60 space-y-1">
                <div>TARGET: {incident.title}</div>
                <div>ESTIMATED TRAVEL ETA: 3.5 Hours via river launch</div>
                <div>RADIO ENCRYPTION: AES-256 MESH CHANNEL 04</div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDispatchModalOpen(false)}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-sm text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#EF4444] hover:bg-red-600 text-white font-bold rounded-sm text-xs transition-colors shadow-lg"
                >
                  CONFIRM DISPATCH ORDER
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
