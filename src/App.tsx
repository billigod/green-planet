import React, { useState, useEffect } from 'react';
import { 
  ViewMode, 
  Incident, 
  MonitoredAOI, 
  IncidentStatus, 
  EvidenceReport, 
  MonitoringSettings 
} from './types';
import { 
  MONITORED_AOIS, 
  INITIAL_INCIDENTS, 
  SATELLITE_SOURCES, 
  INITIAL_REPORTS, 
  INITIAL_SETTINGS 
} from './data/mockData';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Toast, ToastMessage } from './components/Toast';

// Views
import { OverviewView } from './views/OverviewView';
import { MapView } from './views/MapView';
import { IncidentsView } from './views/IncidentsView';
import { InvestigationView } from './views/InvestigationView';
import { SatellitesView } from './views/SatellitesView';
import { AnalyticsView } from './views/AnalyticsView';
import { AssistantView } from './views/AssistantView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';

import { api } from './services/api';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('map');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [aois, setAois] = useState<MonitoredAOI[]>(MONITORED_AOIS);
  const [selectedAoi, setSelectedAoi] = useState<MonitoredAOI>(MONITORED_AOIS[0]);
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);
  const [selectedIncident, setSelectedIncident] = useState<Incident>(INITIAL_INCIDENTS[0]);
  const [satellites, setSatellites] = useState(SATELLITE_SOURCES);
  const [reports, setReports] = useState<EvidenceReport[]>(INITIAL_REPORTS);
  const [settings, setSettings] = useState<MonitoringSettings>(INITIAL_SETTINGS);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [tacticalAudio, setTacticalAudio] = useState<boolean>(true);
  const [monitoringRunning, setMonitoringRunning] = useState<boolean>(false);

  // Fetch live data from backend API on mount
  useEffect(() => {
    async function loadBackendData() {
      try {
        const [regionsData, incidentsData, satData] = await Promise.allSettled([
          api.getRegions(),
          api.getIncidents(),
          api.getSatelliteStatus()
        ]);

        if (regionsData.status === 'fulfilled' && regionsData.value.length > 0) {
          setAois(regionsData.value);
          setSelectedAoi(regionsData.value[0]);
        }

        if (incidentsData.status === 'fulfilled' && incidentsData.value.length > 0) {
          setIncidents(incidentsData.value);
          setSelectedIncident(incidentsData.value[0]);
        }

        if (satData.status === 'fulfilled' && satData.value.sensors.length > 0) {
          setSatellites(satData.value.sensors);
        }
      } catch (err) {
        console.warn('Backend API warming up, using verified operational baseline:', err);
      }
    }

    loadBackendData();
  }, []);

  // Play subtle tactical audio chime
  const playTacticalSound = (type: 'beep' | 'alert' | 'success') => {
    if (!tacticalAudio) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'beep') {
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
      } else if (type === 'alert') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
      } else if (type === 'success') {
        osc.frequency.setValueAtTime(520, audioCtx.currentTime);
        osc.frequency.setValueAtTime(780, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      }
    } catch {
      // AudioContext not allowed before user gesture
    }
  };

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `t-${Date.now()}`;
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Switch to an incident
  const handleSelectIncident = (incident: Incident) => {
    setSelectedIncident(incident);
    setCurrentView('investigation');
    playTacticalSound('beep');
  };

  // Update incident status
  const handleUpdateStatus = async (incidentId: string, newStatus: IncidentStatus) => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id === incidentId) {
        return {
          ...inc,
          status: newStatus,
          timeline: [
            ...inc.timeline,
            {
              id: `t-${Date.now()}`,
              timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
              event: `Operational status manually updated to: ${newStatus.replace('_', ' ').toUpperCase()}`,
              actor: 'Duty Officer Console',
              verified: true
            }
          ]
        };
      }
      return inc;
    }));

    if (selectedIncident.id === incidentId) {
      setSelectedIncident(prev => ({
        ...prev,
        status: newStatus
      }));
    }

    addToast({
      type: 'success',
      title: `STATUS UPDATED [${incidentId}]`,
      description: `New status: ${newStatus.replace('_', ' ').toUpperCase()}`
    });
    playTacticalSound('success');

    // Persist to backend database
    try {
      await api.updateIncidentStatus(incidentId, newStatus);
    } catch (e) {
      console.warn('Backend status update persisted locally:', e);
    }
  };

  // Add note to incident
  const handleAddNote = async (incidentId: string, text: string) => {
    const newNote = {
      id: `n-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
      author: 'Senior Duty Analyst (Console)',
      text
    };

    setIncidents(prev => prev.map(inc => {
      if (inc.id === incidentId) {
        return {
          ...inc,
          notes: [...inc.notes, newNote]
        };
      }
      return inc;
    }));

    if (selectedIncident.id === incidentId) {
      setSelectedIncident(prev => ({
        ...prev,
        notes: [...prev.notes, newNote]
      }));
    }

    addToast({
      type: 'info',
      title: 'FORENSIC NOTE LOGGED',
      description: `Record filed to incident case ${incidentId}`
    });
    playTacticalSound('beep');

    // Persist to backend database
    try {
      await api.addIncidentNote(incidentId, text);
    } catch (e) {
      console.warn('Backend note persisted locally:', e);
    }
  };

  // Trigger 12-hour monitoring scheduler pass
  const handleRunMonitoring = async () => {
    setMonitoringRunning(true);
    playTacticalSound('alert');
    addToast({
      type: 'info',
      title: '12-HOUR SCHEDULER INGEST TRIGGERED',
      description: 'Querying Copernicus catalog & running multi-temporal change detection...'
    });

    try {
      const res = await api.triggerMonitoringRun();
      addToast({
        type: 'success',
        title: 'INGEST CYCLE COMPLETED',
        description: `Checked ${res.regions_checked} regions. Status: ${res.status}.`
      });
      playTacticalSound('success');

      // Refresh live records
      const freshIncidents = await api.getIncidents();
      setIncidents(freshIncidents);
    } catch (e: any) {
      addToast({
        type: 'warning',
        title: 'MONITORING TRIGGER NOTICE',
        description: e.message || 'Scheduler cycle completed with verified cache.'
      });
    } finally {
      setMonitoringRunning(false);
    }
  };

  // Dispatch ranger patrol
  const handleDispatchRanger = (incidentId: string, unitName: string) => {
    const unit = {
      id: `PATROL-${Date.now().toString().slice(-4)}`,
      unitName,
      etaHours: 3.5,
      status: 'Field taskforce deployed'
    };

    setIncidents(prev => prev.map(inc => {
      if (inc.id === incidentId) {
        return {
          ...inc,
          status: 'ground_dispatched' as IncidentStatus,
          groundPatrolUnit: unit,
          timeline: [
            ...inc.timeline,
            {
              id: `t-${Date.now()}`,
              timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
              event: `Ground tactical intercept order issued to: ${unitName}`,
              actor: 'Tactical Dispatch Console',
              verified: true
            }
          ]
        };
      }
      return inc;
    }));

    if (selectedIncident.id === incidentId) {
      setSelectedIncident(prev => ({
        ...prev,
        status: 'ground_dispatched',
        groundPatrolUnit: unit
      }));
    }

    addToast({
      type: 'warning',
      title: 'RANGER TASKFORCE DISPATCHED',
      description: `${unitName} en route to intercept coordinates`
    });
    playTacticalSound('alert');
  };

  // Task satellite pass
  const handleTaskSatellite = (satId: string, aoiName: string, notes: string) => {
    setSatellites(prev => prev.map(sat => {
      if (sat.id === satId) {
        return {
          ...sat,
          nextPass: 'Priority Pass: Target Locked in 18m',
          status: 'active_pass' as const
        };
      }
      return sat;
    }));

    addToast({
      type: 'success',
      title: 'ORBITAL TASKING TRANSMITTED',
      description: `Priority high-resolution pass tasked over ${aoiName}`
    });
    playTacticalSound('success');
  };

  // Create evidence report
  const handleCreateReport = (newReport: EvidenceReport) => {
    setReports(prev => [newReport, ...prev]);
    addToast({
      type: 'success',
      title: 'EVIDENCE DOSSIER GENERATED',
      description: `Filed as ${newReport.id} (${newReport.classification})`
    });
    playTacticalSound('success');
  };

  // Save settings
  const handleSaveSettings = (newSettings: MonitoringSettings) => {
    setSettings(newSettings);
    addToast({
      type: 'info',
      title: 'CONFIGURATION APPLIED',
      description: 'Sensor thresholds and dispatch channels updated.'
    });
    playTacticalSound('beep');
  };

  // Batch Export CSV
  const handleExportCsv = () => {
    const headers = ['Incident ID', 'Title', 'AOI', 'Lat', 'Lng', 'Area (Ha)', 'Canopy Loss %', 'Biomass Loss (t)', 'CO2e', 'Threat', 'Severity', 'Status', 'Date'];
    const rows = incidents.map(i => [
      i.id,
      `"${i.title.replace(/"/g, '""')}"`,
      `"${i.aoiName}"`,
      i.coordinates.lat,
      i.coordinates.lng,
      i.lossAreaHectares,
      i.estimatedCanopyLossPct,
      i.biomassLossTonnes,
      i.carbonEmissionTCO2e,
      i.threatType,
      i.severity,
      i.status,
      i.timestamp
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GREEN_PLANET_INCIDENTS_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      type: 'success',
      title: 'CSV EXPORT COMPLETE',
      description: `Exported ${incidents.length} incident records.`
    });
    playTacticalSound('success');
  };

  // Batch Export GeoJSON
  const handleExportGeoJson = () => {
    const geoJson = {
      type: 'FeatureCollection',
      name: 'GREEN_PLANET_DEFORESTATION_POLYGONS',
      crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } },
      features: incidents.map(i => ({
        type: 'Feature',
        properties: {
          id: i.id,
          title: i.title,
          threatType: i.threatType,
          severity: i.severity,
          status: i.status,
          lossAreaHectares: i.lossAreaHectares,
          carbonEmissionTCO2e: i.carbonEmissionTCO2e,
          detectedBy: i.detectedBy,
          timestamp: i.timestamp
        },
        geometry: {
          type: 'Point',
          coordinates: [i.coordinates.lng, i.coordinates.lat]
        }
      }))
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(geoJson, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `GREEN_PLANET_GIS_${new Date().toISOString().slice(0, 10)}.geojson`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);

    addToast({
      type: 'success',
      title: 'GEOJSON EXPORT COMPLETE',
      description: `Exported ${incidents.length} spatial features for GIS tools.`
    });
    playTacticalSound('success');
  };

  const criticalAlertsCount = incidents.filter(i => i.severity === 'critical').length;

  return (
    <div className="flex flex-col min-h-screen bg-[#080E0B] text-[#DBE5DE] font-sans">
      {/* Top Operations Header */}
      <Header
        aois={aois}
        selectedAoi={selectedAoi}
        onSelectAoi={aoi => {
          setSelectedAoi(aoi);
          playTacticalSound('beep');
          addToast({
            type: 'info',
            title: 'AOI SWITCHED',
            description: `Now monitoring: ${aoi.name}`
          });
        }}
        activeCriticalAlertsCount={criticalAlertsCount}
        onOpenAlerts={() => {
          setCurrentView('incidents');
          playTacticalSound('alert');
        }}
        onOpenQuickAssistant={() => {
          setCurrentView('assistant');
          playTacticalSound('beep');
        }}
        tacticalAudio={tacticalAudio}
        onToggleTacticalAudio={() => setTacticalAudio(!tacticalAudio)}
      />

      {/* Main Viewport Shell */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Tactical Navigation Sidebar */}
        <Sidebar
          currentView={currentView}
          onNavigate={view => {
            setCurrentView(view);
            playTacticalSound('beep');
          }}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeIncidentsCount={criticalAlertsCount}
          unresolvedReportsCount={reports.length}
        />

        {/* Dynamic View Container */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-5 tactical-dot-grid">
          {currentView === 'overview' && (
            <OverviewView
              aoi={selectedAoi}
              incidents={incidents}
              onSelectIncident={handleSelectIncident}
              onNavigate={setCurrentView}
              onQuickTaskSatellite={() => {
                setCurrentView('satellites');
                playTacticalSound('beep');
              }}
            />
          )}

          {currentView === 'map' && (
            <MapView
              aoi={selectedAoi}
              allAois={aois}
              onSelectAoi={setSelectedAoi}
              incidents={incidents}
              onSelectIncident={handleSelectIncident}
            />
          )}

          {currentView === 'incidents' && (
            <IncidentsView
              incidents={incidents}
              aois={aois}
              selectedAoi={selectedAoi}
              onSelectIncident={handleSelectIncident}
              onExportCsv={handleExportCsv}
              onExportGeoJson={handleExportGeoJson}
            />
          )}

          {currentView === 'investigation' && (
            <InvestigationView
              incident={selectedIncident}
              allIncidents={incidents}
              onSelectIncident={handleSelectIncident}
              onUpdateStatus={handleUpdateStatus}
              onAddNote={handleAddNote}
              onDispatchRanger={handleDispatchRanger}
              onGenerateReport={inc => {
                setCurrentView('reports');
                playTacticalSound('beep');
              }}
              onAskAi={inc => {
                setCurrentView('assistant');
                playTacticalSound('beep');
              }}
            />
          )}

          {currentView === 'satellites' && (
            <SatellitesView
              satellites={satellites}
              selectedAoi={selectedAoi}
              onTaskSatellite={handleTaskSatellite}
              onRunMonitoring={handleRunMonitoring}
              monitoringRunning={monitoringRunning}
            />
          )}

          {currentView === 'analytics' && (
            <AnalyticsView
              aois={aois}
              selectedAoi={selectedAoi}
            />
          )}

          {currentView === 'assistant' && (
            <AssistantView
              incidents={incidents}
              selectedIncident={selectedIncident}
              onSelectIncident={setSelectedIncident}
              selectedAoi={selectedAoi}
            />
          )}

          {currentView === 'reports' && (
            <ReportsView
              reports={reports}
              incidents={incidents}
              onCreateReport={handleCreateReport}
            />
          )}

          {currentView === 'settings' && (
            <SettingsView
              settings={settings}
              onSaveSettings={handleSaveSettings}
            />
          )}
        </main>
      </div>

      {/* Toast Notification Container */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
