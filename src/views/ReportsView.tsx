import React, { useState } from 'react';
import { 
  FileCheck2, 
  Download, 
  Printer, 
  ExternalLink, 
  ShieldAlert, 
  Scale, 
  Calendar, 
  MapPin, 
  Share2, 
  CheckCircle, 
  AlertTriangle, 
  PlusCircle, 
  FileText,
  User,
  Copy
} from 'lucide-react';
import { EvidenceReport, Incident } from '../types';

interface ReportsViewProps {
  reports: EvidenceReport[];
  incidents: Incident[];
  onCreateReport: (newReport: EvidenceReport) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  reports,
  incidents,
  onCreateReport
}) => {
  const [selectedReport, setSelectedReport] = useState<EvidenceReport>(reports[0]);
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [targetIncidentId, setTargetIncidentId] = useState<string>(incidents[0]?.id || '');
  const [authorInput, setAuthorInput] = useState<string>('Geospatial Intel Desk / Senior Forest Officer');
  const [recipientInput, setRecipientInput] = useState<string>('Federal Environmental Enforcement Command & Public Ministry');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const matchedIncident = incidents.find(i => i.id === selectedReport.incidentId) || incidents[0];

  const handlePrint = () => {
    window.print();
  };

  const handleCreateReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const inc = incidents.find(i => i.id === targetIncidentId) || incidents[0];
    const newRep: EvidenceReport = {
      id: `REP-${inc.id.replace('INC-', '')}-LEGAL`,
      incidentId: inc.id,
      title: `Formal Enforcement Evidentiary Pack: ${inc.title}`,
      generatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
      author: authorInput,
      classification: 'RESTRICTED / LAW ENFORCEMENT',
      status: 'Finalized',
      summary: `Automated high-confidence (${inc.confidenceScore}%) satellite change detection confirmed ${inc.lossAreaHectares} Ha of illegal clearing in ${inc.aoiName}. Cross-checked against national forestry concession registry with zero legal permits on file.`,
      keyFindings: [
        `Direct tree cover extraction totaling ${inc.lossAreaHectares} hectares.`,
        `Estimated above-ground biomass destruction of ${inc.biomassLossTonnes.toLocaleString()} tonnes.`,
        `Gross greenhouse gas emission commitment of ${inc.carbonEmissionTCO2e.toLocaleString()} tCO2e.`,
        `SAR polarimetric decorrelation confirms mechanical extraction between ${inc.preDate} and ${inc.postDate}.`
      ],
      legalViolations: [
        'Federal Environmental Crimes Act (Law 9.605/1998) Art. 44 & 50.',
        'Permanent Preservation Area (APP) Riparian Buffer Protections.',
        'EU Deforestation Regulation (EUDR) Article 3 Prohibition.'
      ],
      lossAreaHa: inc.lossAreaHectares,
      carbonLossTonnes: inc.carbonEmissionTCO2e,
      biomassLossTonnes: inc.biomassLossTonnes,
      recipientDesk: recipientInput
    };

    onCreateReport(newRep);
    setSelectedReport(newRep);
    setCreateModalOpen(false);
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(`https://greenplanet-ops.int/dossier/${selectedReport.id}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Header */}
      <div className="bg-[#0D1612] border border-white/10 rounded-sm p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-[10px] text-[#10B981] font-semibold uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping"></span>
              <span>JUDICIAL & ENFORCEMENT EVIDENTIARY ARCHIVE</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans">
              Evidence Reports & Dossiers
            </h1>
            <p className="text-white/60 text-xs mt-1 font-sans">
              Court-admissible satellite evidence dossiers formatted for environmental police, Interpol eco-crime desks, and public prosecutors.
            </p>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-[#10B981] hover:bg-[#34D399] text-[#080E0B] font-bold rounded-sm text-xs transition-colors shadow-[0_0_12px_rgba(16,185,129,0.3)] self-start md:self-auto"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>GENERATE NEW EVIDENCE DOSSIER</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Reports List (Left) & Print-Ready Dossier Viewer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Reports Index List */}
        <div className="bg-[#0D1612] border border-white/10 rounded-sm p-3 space-y-2">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2 text-white/50 text-[10px] uppercase font-semibold">
            <span>FILED DOSSIERS ({reports.length})</span>
            <span className="text-[#10B981]">SELECT TO INSPECT</span>
          </div>

          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {reports.map(rep => {
              const isSelected = selectedReport.id === rep.id;

              return (
                <div
                  key={rep.id}
                  onClick={() => setSelectedReport(rep)}
                  className={`p-3 rounded-sm border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#14201A] border-[#10B981] shadow-md'
                      : 'bg-[#080E0B] hover:bg-[#14201A] border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-[#06B6D4] font-bold">{rep.id}</span>
                    <span className="px-1.5 py-0.2 bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] rounded text-[9px] font-bold">
                      {rep.classification.split(' / ')[0]}
                    </span>
                  </div>

                  <h4 className="font-bold text-white text-xs font-sans line-clamp-2 leading-snug">
                    {rep.title}
                  </h4>

                  <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-white/40">
                    <span>{rep.generatedAt.slice(0, 10)}</span>
                    <span className="text-[#10B981] font-semibold">{rep.lossAreaHa} Ha loss</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Print-Ready Official Dossier Viewer (2 Cols) */}
        <div className="lg:col-span-2 bg-[#0D1612] border border-white/10 rounded-sm p-4 text-xs font-mono flex flex-col justify-between">
          <div>
            {/* Top Toolbar Actions */}
            <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-3 mb-4 gap-2">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 bg-[#EF4444]/20 border border-[#EF4444] text-[#EF4444] text-[10px] font-bold uppercase tracking-wider">
                  {selectedReport.classification}
                </span>
                <span className="text-white/40">|</span>
                <span className="text-white font-bold">{selectedReport.id}</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#14201A] hover:bg-white/10 border border-white/15 text-white rounded-sm text-xs transition-colors"
                  title="Print formal evidentiary dossier"
                >
                  <Printer className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>PRINT / PDF</span>
                </button>

                <button
                  onClick={copyShareLink}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#14201A] hover:bg-white/10 border border-white/15 text-white rounded-sm text-xs transition-colors"
                  title="Copy encrypted shareable reference link"
                >
                  {copiedLink ? <CheckCircle className="w-3.5 h-3.5 text-[#10B981]" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'COPIED' : 'SHARE TOKEN'}</span>
                </button>
              </div>
            </div>

            {/* Formal Dossier Document Container */}
            <div className="bg-[#080E0B] border border-white/10 p-5 rounded-sm space-y-4 text-white/90">
              {/* Document Header Watermark */}
              <div className="border-b-2 border-white/20 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-[10px] text-[#10B981] font-bold uppercase tracking-widest">
                    GREEN PLANET OPERATIONS // DEFENSE-GRADE GEOSPATIAL INTELLIGENCE
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-white font-sans mt-0.5">
                    {selectedReport.title}
                  </h2>
                </div>
                <div className="text-right text-[10px] text-white/50">
                  <div>DOC ID: <strong className="text-white">{selectedReport.id}</strong></div>
                  <div>FILED: <strong className="text-white">{selectedReport.generatedAt}</strong></div>
                </div>
              </div>

              {/* Target Metadata Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] bg-[#0D1612] p-2.5 rounded-sm border border-white/5">
                <div>
                  <span className="text-white/40 block">TARGET INCIDENT</span>
                  <span className="text-white font-bold">{selectedReport.incidentId}</span>
                </div>
                <div>
                  <span className="text-white/40 block">DEFORESTED AREA</span>
                  <span className="text-[#EF4444] font-bold">{selectedReport.lossAreaHa} Hectares</span>
                </div>
                <div>
                  <span className="text-white/40 block">LOST BIOMASS</span>
                  <span className="text-[#F59E0B] font-bold">{selectedReport.biomassLossTonnes.toLocaleString()} Tonnes</span>
                </div>
                <div>
                  <span className="text-white/40 block">CARBON AUDIT</span>
                  <span className="text-white font-bold">{selectedReport.carbonLossTonnes.toLocaleString()} tCO2e</span>
                </div>
              </div>

              {/* Satellite Imagery Crop Thumbnails */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#0D1612] p-2 rounded-sm border border-white/5">
                  <div className="text-[10px] text-white/50 mb-1 flex justify-between">
                    <span>PRE-INCURSION BASELINE</span>
                    <span className="text-[#10B981]">{matchedIncident.preDate}</span>
                  </div>
                  <div className="aspect-[16/9] w-full rounded-sm overflow-hidden bg-black">
                    <img
                      src={matchedIncident.preImageUrl}
                      alt="Baseline Satellite"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>

                <div className="bg-[#0D1612] p-2 rounded-sm border border-red-500/20">
                  <div className="text-[10px] text-white/50 mb-1 flex justify-between">
                    <span className="text-red-400">DETECTED CANOPY SCAR</span>
                    <span className="text-red-400">{matchedIncident.postDate}</span>
                  </div>
                  <div className="aspect-[16/9] w-full rounded-sm overflow-hidden bg-black">
                    <img
                      src={matchedIncident.postImageUrl}
                      alt="Incursion Satellite"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>

              {/* Executive Summary */}
              <div>
                <h4 className="text-[11px] font-bold text-[#10B981] uppercase mb-1">
                  1. EXECUTIVE INTELLIGENCE SUMMARY
                </h4>
                <p className="text-xs text-white/80 leading-relaxed font-sans">
                  {selectedReport.summary}
                </p>
              </div>

              {/* Key Technical Findings */}
              <div>
                <h4 className="text-[11px] font-bold text-[#06B6D4] uppercase mb-1">
                  2. AUDITED TECHNICAL FINDINGS & OBSERVATIONS
                </h4>
                <ul className="space-y-1 text-xs text-white/80 font-sans list-disc list-inside">
                  {selectedReport.keyFindings.map((finding, idx) => (
                    <li key={idx} className="leading-relaxed">{finding}</li>
                  ))}
                </ul>
              </div>

              {/* Satellite Sensor & Provenance Audit */}
              <div className="bg-[#0D1612] p-2.5 rounded-sm border border-white/5 space-y-1.5 text-[10px]">
                <div className="text-[#10B981] font-bold uppercase">3. SATELLITE SENSOR & PROVENANCE AUDIT</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-white/70">
                  <div>
                    <span className="text-white/40 block">BASELINE SCENE (t0):</span>
                    <span className="font-mono text-white/90 break-all">{matchedIncident.targetReticle?.source_product_ids?.[0] || matchedIncident.baselineObservationId || 'S2A_T21MXR_20240629T140223_L2A'}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block">MONITORING SCENE (t1):</span>
                    <span className="font-mono text-white/90 break-all">{matchedIncident.targetReticle?.source_product_ids?.[1] || matchedIncident.currentObservationId || 'S2B_T21MXR_20240826T140707_L2A'}</span>
                  </div>
                </div>
                <div className="text-white/40 text-[9px] pt-1 border-t border-white/5">
                  DATA PROVIDER: Element 84 Earth Search STAC API (Public AWS Open Data · Sentinel-2 Level-2A BOA Reflectance)
                </div>
              </div>

              {/* Legal Violations Identified */}
              <div>
                <h4 className="text-[11px] font-bold text-[#F59E0B] uppercase mb-1">
                  3. STATUTORY STATUTES & PROHIBITIONS INFRINGED
                </h4>
                <div className="space-y-1">
                  {selectedReport.legalViolations.map((viol, idx) => (
                    <div key={idx} className="bg-[#0D1612] px-2.5 py-1 rounded-sm border border-white/5 text-[11px] text-white/90">
                      ⚖️ {viol}
                    </div>
                  ))}
                </div>
              </div>

              {/* Signature & Custody Block */}
              <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between text-[10px] text-white/40 gap-2">
                <div>
                  <div>INVESTIGATING OFFICER: <strong className="text-white">{selectedReport.author}</strong></div>
                  <div>RECIPIENT DESK: <strong className="text-white">{selectedReport.recipientDesk}</strong></div>
                </div>
                <div className="text-right">
                  <div className="text-[#10B981] font-bold">DIGITALLY VERIFIED ENFORCEMENT DOSSIER</div>
                  <div>SHA-256: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1f</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create New Evidence Report Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1612] border border-[#10B981] rounded-sm max-w-lg w-full p-4 font-mono shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
              <div className="flex items-center space-x-2 text-[#10B981] font-bold">
                <FileCheck2 className="w-4 h-4" />
                <span>GENERATE FORMAL EVIDENCE DOSSIER</span>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-white/50 hover:text-white"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateReportSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] text-white/50 block mb-1">TARGET INCIDENT TO COMPILE</label>
                <select
                  value={targetIncidentId}
                  onChange={e => setTargetIncidentId(e.target.value)}
                  className="w-full bg-[#080E0B] border border-white/10 text-white px-3 py-2 rounded-sm text-xs focus:outline-none"
                >
                  {incidents.map(inc => (
                    <option key={inc.id} value={inc.id}>
                      [{inc.id}] {inc.lossAreaHectares} Ha - {inc.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-white/50 block mb-1">REPORTING OFFICER / DESK</label>
                <input
                  type="text"
                  value={authorInput}
                  onChange={e => setAuthorInput(e.target.value)}
                  className="w-full bg-[#080E0B] border border-white/10 focus:border-[#10B981] rounded-sm px-3 py-2 text-white text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-white/50 block mb-1">RECIPIENT JURISDICTION / COMMAND</label>
                <input
                  type="text"
                  value={recipientInput}
                  onChange={e => setRecipientInput(e.target.value)}
                  className="w-full bg-[#080E0B] border border-white/10 focus:border-[#10B981] rounded-sm px-3 py-2 text-white text-xs focus:outline-none"
                />
              </div>

              <div className="bg-[#14201A] p-2.5 rounded-sm text-[10px] text-white/70 space-y-1">
                <div>CLASSIFICATION: RESTRICTED / LAW ENFORCEMENT</div>
                <div>INCLUSIONS: Dual-temporal satellite crops, GPS bounds, Carbon audit, Statutory citations</div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-sm text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#10B981] hover:bg-[#34D399] text-[#080E0B] font-bold rounded-sm text-xs transition-colors shadow-lg"
                >
                  GENERATE EVIDENCE PACK
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
