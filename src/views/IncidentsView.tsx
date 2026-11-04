import React, { useState, useMemo } from 'react';
import { 
  AlertOctagon, 
  Search, 
  Filter, 
  Download, 
  ExternalLink, 
  ShieldAlert, 
  ArrowUpDown, 
  TreePine, 
  Radio, 
  MapPin, 
  FileSpreadsheet, 
  FileJson, 
  Calendar,
  Layers,
  ChevronRight,
  Flame,
  Truck
} from 'lucide-react';
import { Incident, IncidentSeverity, IncidentStatus, ThreatType, MonitoredAOI } from '../types';

interface IncidentsViewProps {
  incidents: Incident[];
  aois: MonitoredAOI[];
  selectedAoi: MonitoredAOI;
  onSelectIncident: (incident: Incident) => void;
  onExportCsv: () => void;
  onExportGeoJson: () => void;
}

export const IncidentsView: React.FC<IncidentsViewProps> = ({
  incidents,
  aois,
  selectedAoi,
  onSelectIncident,
  onExportCsv,
  onExportGeoJson
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [threatFilter, setThreatFilter] = useState<string>('all');
  const [aoiFilter, setAoiFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'area' | 'confidence'>('date');
  const [viewLayout, setViewLayout] = useState<'table' | 'cards'>('table');

  const filteredIncidents = useMemo(() => {
    return incidents.filter(i => {
      // Search
      const matchesSearch = 
        i.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.threatType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.aoiName.toLowerCase().includes(searchQuery.toLowerCase());

      // Filters
      const matchesSeverity = severityFilter === 'all' || i.severity === severityFilter;
      const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
      const matchesThreat = threatFilter === 'all' || i.threatType === threatFilter;
      const matchesAoi = aoiFilter === 'all' || i.aoiId === aoiFilter;

      return matchesSearch && matchesSeverity && matchesStatus && matchesThreat && matchesAoi;
    }).sort((a, b) => {
      if (sortBy === 'area') return b.lossAreaHectares - a.lossAreaHectares;
      if (sortBy === 'confidence') return b.confidenceScore - a.confidenceScore;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [incidents, searchQuery, severityFilter, statusFilter, threatFilter, aoiFilter, sortBy]);

  const totalAreaLost = filteredIncidents.reduce((sum, i) => sum + i.lossAreaHectares, 0).toFixed(1);
  const criticalCount = filteredIncidents.filter(i => i.severity === 'critical').length;
  const dispatchedCount = filteredIncidents.filter(i => i.status === 'ground_dispatched').length;

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Header and Telemetry Summary */}
      <div className="bg-[#0D1612] border border-white/10 rounded-sm p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-[10px] text-[#10B981] font-semibold uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping"></span>
              <span>FORENSIC TELEMETRY DATABASE</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans">
              Deforestation Incidents Catalog
            </h1>
            <p className="text-white/60 text-xs mt-1 font-sans">
              Algorithmic satellite change detection register across active conservation sectors. Verified against environmental law databases.
            </p>
          </div>

          {/* Export Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onExportCsv}
              className="flex items-center space-x-1.5 px-3 py-2 bg-[#14201A] hover:bg-[#182620] border border-white/10 hover:border-white/30 text-white rounded-sm text-xs transition-colors"
              title="Export filtered records as CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#10B981]" />
              <span>EXPORT CSV</span>
            </button>
            <button
              onClick={onExportGeoJson}
              className="flex items-center space-x-1.5 px-3 py-2 bg-[#14201A] hover:bg-[#182620] border border-white/10 hover:border-white/30 text-white rounded-sm text-xs transition-colors"
              title="Export GIS boundary coordinates as GeoJSON"
            >
              <FileJson className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span>GEOJSON</span>
            </button>
          </div>
        </div>

        {/* Quick Filter Counts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 mt-4 border-t border-white/5 text-[11px]">
          <div className="bg-[#080E0B] p-2.5 rounded-sm border border-white/5">
            <div className="text-white/40">MATCHED INCIDENTS</div>
            <div className="text-white font-bold text-lg mt-0.5">{filteredIncidents.length}</div>
          </div>
          <div className="bg-[#080E0B] p-2.5 rounded-sm border border-white/5">
            <div className="text-white/40">CRITICAL INCURSIONS</div>
            <div className="text-[#EF4444] font-bold text-lg mt-0.5">{criticalCount}</div>
          </div>
          <div className="bg-[#080E0B] p-2.5 rounded-sm border border-white/5">
            <div className="text-white/40">TOTAL DEFORESTED</div>
            <div className="text-[#F59E0B] font-bold text-lg mt-0.5">{totalAreaLost} Ha</div>
          </div>
          <div className="bg-[#080E0B] p-2.5 rounded-sm border border-white/5">
            <div className="text-white/40">RANGER PATROLS ACTIVE</div>
            <div className="text-[#10B981] font-bold text-lg mt-0.5">{dispatchedCount} TEAMS</div>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-[#0D1612] border border-white/10 rounded-sm p-3 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search by ID, coordinates, sector, or threat type..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#080E0B] border border-white/10 focus:border-[#10B981] rounded-sm pl-9 pr-3 py-2 text-white text-xs placeholder:text-white/30 focus:outline-none transition-colors"
            />
          </div>

          {/* Sort By & View mode toggles */}
          <div className="flex items-center space-x-2 text-[11px]">
            <div className="flex items-center space-x-1 text-white/50 bg-[#080E0B] px-2 py-1 border border-white/10 rounded-sm">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>SORT:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
              >
                <option value="date" className="bg-[#080E0B]">DATE (NEWEST)</option>
                <option value="area" className="bg-[#080E0B]">AREA (LARGEST)</option>
                <option value="confidence" className="bg-[#080E0B]">CONFIDENCE</option>
              </select>
            </div>

            <div className="flex items-center bg-[#080E0B] p-0.5 border border-white/10 rounded-sm">
              <button
                onClick={() => setViewLayout('table')}
                className={`px-2 py-1 rounded-sm text-[10px] ${
                  viewLayout === 'table' ? 'bg-[#10B981] text-[#080E0B] font-bold' : 'text-white/50 hover:text-white'
                }`}
              >
                TABLE
              </button>
              <button
                onClick={() => setViewLayout('cards')}
                className={`px-2 py-1 rounded-sm text-[10px] ${
                  viewLayout === 'cards' ? 'bg-[#10B981] text-[#080E0B] font-bold' : 'text-white/50 hover:text-white'
                }`}
              >
                CARDS
              </button>
            </div>
          </div>
        </div>

        {/* Filter Pills row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5 text-[11px]">
          <span className="text-white/40 flex items-center space-x-1">
            <Filter className="w-3 h-3" />
            <span>SEVERITY:</span>
          </span>
          {(['all', 'critical', 'warning', 'nominal'] as const).map(sev => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2 py-0.5 rounded-sm uppercase text-[10px] transition-colors border ${
                severityFilter === sev
                  ? sev === 'critical' ? 'bg-[#EF4444]/20 border-[#EF4444] text-[#EF4444] font-bold' :
                    sev === 'warning' ? 'bg-[#F59E0B]/20 border-[#F59E0B] text-[#F59E0B] font-bold' :
                    sev === 'nominal' ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981] font-bold' :
                    'bg-[#10B981] text-black font-bold border-[#10B981]'
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/20'
              }`}
            >
              {sev}
            </button>
          ))}

          <span className="text-white/30 mx-1">|</span>

          <span className="text-white/40">STATUS:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-[#080E0B] border border-white/10 text-white px-2 py-1 rounded-sm text-[10px] focus:outline-none"
          >
            <option value="all">ALL STATUSES</option>
            <option value="UNVERIFIED">UNVERIFIED</option>
            <option value="UNDER_REVIEW">UNDER REVIEW</option>
            <option value="VERIFIED">VERIFIED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="active_investigation">ACTIVE INVESTIGATION</option>
            <option value="ground_dispatched">GROUND DISPATCHED</option>
            <option value="verified_incursion">VERIFIED INCURSION</option>
            <option value="permit_cleared">PERMIT CLEARED</option>
            <option value="closed">CLOSED</option>
          </select>

          <span className="text-white/30 mx-1">|</span>

          <span className="text-white/40">TARGET AOI:</span>
          <select
            value={aoiFilter}
            onChange={e => setAoiFilter(e.target.value)}
            className="bg-[#080E0B] border border-white/10 text-white px-2 py-1 rounded-sm text-[10px] focus:outline-none"
          >
            <option value="all">ALL REGIONS</option>
            {aois.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Incidents Content: Table or Cards */}
      {filteredIncidents.length === 0 ? (
        <div className="bg-[#0D1612] border border-white/10 rounded-sm p-12 text-center text-white/50">
          <AlertOctagon className="w-10 h-10 mx-auto text-white/20 mb-2" />
          <p className="font-semibold text-white/80">No incidents match current filter parameters</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSeverityFilter('all');
              setStatusFilter('all');
              setThreatFilter('all');
              setAoiFilter('all');
            }}
            className="mt-3 px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-sm text-[11px]"
          >
            Reset Filters
          </button>
        </div>
      ) : viewLayout === 'table' ? (
        <div className="bg-[#0D1612] border border-white/10 rounded-sm overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-[#14201A] text-white/50 text-[10px] uppercase">
                <th className="py-2.5 px-3">Incident ID</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Title & Threat</th>
                <th className="py-2.5 px-3">Location & AOI</th>
                <th className="py-2.5 px-3">Forest Loss</th>
                <th className="py-2.5 px-3">Confidence</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[11px]">
              {filteredIncidents.map(incident => (
                <tr
                  key={incident.id}
                  onClick={() => onSelectIncident(incident)}
                  className="hover:bg-[#14201A] transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-3 font-bold text-white font-mono whitespace-nowrap">
                    {incident.id}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider ${
                        incident.severity === 'critical'
                          ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40'
                          : incident.severity === 'warning'
                          ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40'
                          : 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40'
                      }`}
                    >
                      {incident.severity}
                    </span>
                  </td>
                  <td className="py-3 px-3 max-w-xs">
                    <div className="font-semibold text-white/90 group-hover:text-white truncate font-sans text-xs">
                      {incident.title}
                    </div>
                    <div className="text-[10px] text-white/50 flex items-center space-x-1.5 mt-0.5">
                      <span>{incident.threatType}</span>
                      <span className="text-white/30">•</span>
                      <span>{incident.detectedBy}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="text-white/80">{incident.aoiName}</div>
                    <div className="text-[10px] text-[#06B6D4] font-mono">
                      {incident.coordinates.lat.toFixed(4)}°, {incident.coordinates.lng.toFixed(4)}°
                    </div>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="font-bold text-white font-mono text-xs">
                      {incident.lossAreaHectares} Ha
                    </div>
                    <div className="text-[9px] text-[#EF4444]">
                      -{incident.estimatedCanopyLossPct}% canopy
                    </div>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="text-[#10B981] font-bold font-mono">
                      {incident.confidenceScore}%
                    </div>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 bg-[#080E0B] border border-white/10 rounded-sm text-[10px] text-white/70">
                      {incident.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectIncident(incident);
                      }}
                      className="px-2.5 py-1 bg-white/5 group-hover:bg-[#10B981] text-white/70 group-hover:text-black font-semibold rounded-sm text-[10px] transition-colors"
                    >
                      INVESTIGATE
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredIncidents.map(incident => (
            <div
              key={incident.id}
              onClick={() => onSelectIncident(incident)}
              className="bg-[#0D1612] hover:bg-[#14201A] border border-white/10 hover:border-[#10B981]/50 rounded-sm p-3.5 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider ${
                      incident.severity === 'critical'
                        ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40'
                        : incident.severity === 'warning'
                        ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40'
                        : 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40'
                    }`}
                  >
                    {incident.severity}
                  </span>
                  <span className="text-white/40 text-[10px] font-mono">{incident.id}</span>
                </div>

                <h3 className="font-sans font-bold text-white text-sm group-hover:text-[#4EDEA3] transition-colors line-clamp-1">
                  {incident.title}
                </h3>
                <div className="text-[10px] text-white/50 mt-1 mb-3">
                  {incident.aoiName} • {incident.threatType}
                </div>

                {/* Satellite thumbnail preview */}
                <div className="relative aspect-[16/9] w-full rounded-sm overflow-hidden mb-3 border border-white/5 bg-[#080E0B]">
                  <img
                    src={incident.postImageUrl}
                    alt="Satellite Incursion"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute bottom-1 right-1 bg-[#080E0B]/85 px-1.5 py-0.5 rounded text-[9px] text-white/80 font-mono">
                    {incident.lossAreaHectares} Ha Deforested
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] mb-3">
                  <div className="bg-[#080E0B] p-1.5 rounded-sm border border-white/5">
                    <span className="text-white/40 block">RADAR COHERENCE</span>
                    <span className="text-[#EF4444] font-bold">-{incident.targetReticle.radarCoherenceDropPct}%</span>
                  </div>
                  <div className="bg-[#080E0B] p-1.5 rounded-sm border border-white/5">
                    <span className="text-white/40 block">CONFIDENCE</span>
                    <span className="text-[#10B981] font-bold">{incident.confidenceScore}%</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                <span className="text-white/50">{incident.timestamp.slice(0, 10)}</span>
                <span className="text-[#10B981] font-bold group-hover:translate-x-1 transition-transform flex items-center space-x-1">
                  <span>FORENSIC DOSSIER</span>
                  <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
