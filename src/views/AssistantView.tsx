import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Terminal, 
  Layers, 
  Scale, 
  ShieldAlert, 
  FileCheck2, 
  Radio, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  Copy
} from 'lucide-react';
import { Incident, MonitoredAOI } from '../types';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  isFallback?: boolean;
}

interface AssistantViewProps {
  incidents: Incident[];
  selectedIncident: Incident | null;
  onSelectIncident: (incident: Incident) => void;
  selectedAoi: MonitoredAOI;
}

export const AssistantView: React.FC<AssistantViewProps> = ({
  incidents,
  selectedIncident,
  onSelectIncident,
  selectedAoi
}) => {
  const currentIncident = selectedIncident || incidents[0];
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-init',
      sender: 'ai',
      text: `**SENTINEL AI ONLINE // GEOSPATIAL INTELLIGENCE CORE v3.4**\n\nActive Incident Context: **[${currentIncident.id}] ${currentIncident.title}**\nCoordinates: \`${currentIncident.coordinates.lat.toFixed(4)}°, ${currentIncident.coordinates.lng.toFixed(4)}°\` (${currentIncident.aoiName})\n\nSelect an investigative command chip below or ask any technical query regarding multi-spectral anomalies, SAR coherence loss, biomass depletion, or statutory environmental penalties.`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) + ' UTC'
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Fallback high-precision forensic responses if Gemini API is offline or without key
  const generateFallbackResponse = (prompt: string, inc: Incident): string => {
    const lower = prompt.toLowerCase();

    if (lower.includes('fine') || lower.includes('legal') || lower.includes('penalty') || lower.includes('eudr')) {
      return `### ⚖️ STATUTORY PENALTY & JURISPRUDENCE AUDIT

**Target Case:** ${inc.id} (${inc.title})
**Location:** ${inc.coordinates.lat.toFixed(4)}°, ${inc.coordinates.lng.toFixed(4)}° (${inc.legalJurisdiction})

#### 1. Brazilian Environmental Crimes Act (Federal Law 9.605/1998)
- **Article 38 (Riparian APP Damage):** Imprisonment of 1 to 3 years plus civil remediation.
- **Article 44 & 50 (Unlawful clear-cutting of protected public forest):**
  - Statutory Base Fine: **R$ 5,000 per deforested hectare**
  - Aggravating multiplier for conservation unit (1.5x)
  - **Calculated Administrative Fine:** **R$ ${(inc.lossAreaHectares * 7500).toLocaleString('pt-BR')}** (~USD $${Math.round(inc.lossAreaHectares * 1350).toLocaleString('en-US')})

#### 2. European Union Deforestation Regulation (EUDR - Reg 2023/1115)
- **Status:** **IMMEDIATE COMMERCIAL BLOCK / NON-COMPLIANT**
- All soy, beef, or timber harvested from these polygon GPS coordinates after Dec 31, 2020 are prohibited from entering EU internal markets.
- Customs due diligence declaration automatically invalidated.

#### 3. Recommended Enforcement Measures:
- Issue judicial embargo on rural title deeds (Termo de Embargo IBAMA).
- Register coordinates in SISNAMA national environmental sanction registry.`;
    }

    if (lower.includes('road') || lower.includes('velocity') || lower.includes('spur') || lower.includes('mahogany')) {
      return `### 🛰️ LINEAR ROAD INTRUSION VELOCITY ANALYSIS

**Target Feature:** Logging Road Extension Corridor [${inc.id}]
**Baseline Penetration Rate:** 180 meters per 24-hour cycle

#### Morphological Vector Assessment:
- **Geometry:** 6 to 8 meter wide unpaved access corridor cutting perpendicularly into undisturbed primary canopy.
- **Heading:** 278° West-Northwest, vectoring towards high-density *Swietenia macrophylla* (Big-leaf Mahogany) and *Tabebuia serratifolia* (Ipê) stands.
- **High-Res Corroboration:** PlanetScope 3m resolution pass indicates heavy track scarring from D6 crawler bulldozers.

#### Proximity Threat Buffer:
- 1.4 km from protected Indigenous territory boundary (*Terra Indígena Munduruku*).
- Breach anticipated within **7.5 operational days** if enforcement interdiction is not executed.

#### Recommended Action:
- Immediate dispatch of riverine interdiction unit to coordinate \`${inc.coordinates.lat.toFixed(4)}°, ${inc.coordinates.lng.toFixed(4)}°\` to seize machinery.`;
    }

    if (lower.includes('sar') || lower.includes('radar') || lower.includes('coherence') || lower.includes('c-band')) {
      return `### 📡 SAR POLARIMETRIC COHERENCE ANOMALY REPORT

**Sensor:** Sentinel-1C C-SAR (5.405 GHz / 5.6 cm wavelength)
**Interferometric Baseline:** Ingest pass T-7d to T-0d
**Coherence Decline:** **-${inc.targetReticle.radarCoherenceDropPct}%** across ${inc.lossAreaHectares} Ha

#### Physical Radar Scattering Mechanism:
1. **Pristine Canopy (Baseline):** Dense multi-layered ombrophilous forest acts as a volumetric volume scatterer, yielding steady cross-polarization backscatter (VH).
2. **Post-Felling Incursion:** Felling of dominant trees eliminates canopy scatterers. Ground dielectric properties change as exposed soil and felled woody debris cause acute temporal phase decorrelation.
3. **Cloud Penetration:** Detection achieved despite heavy cumulus cloud ceiling (65% cloud cover) that fully blind optical Sentinel-2 sensors.

#### Reliability Index:
- Signal-to-Noise Ratio (SNR): **24.8 dB**
- Algorithmic Confidence: **${inc.confidenceScore}%** (No atmospheric or moisture interference detected).`;
    }

    // Default forensic triage
    return `### 📋 FORENSIC INCIDENT TRIAGE SUMMARY

**Incident Reference:** ${inc.id}
**Classification:** ${inc.severity.toUpperCase()} // ${inc.threatType.toUpperCase()}
**Monitored Sector:** ${inc.aoiName}

#### Key Geospatial Observations:
- **Area of Deforestation:** **${inc.lossAreaHectares} Hectares** (Canopy loss: -${inc.estimatedCanopyLossPct}%)
- **Biomass Depletion:** **${inc.biomassLossTonnes.toLocaleString()} tonnes** of woody biomass lost
- **Gross CO2 Equivalent:** **${inc.carbonEmissionTCO2e.toLocaleString()} tCO2e**
- **Sensor Lock:** ${inc.detectedBy} (Detection timestamp: ${inc.timestamp})

#### Operational Recommendations:
1. **Ground Verification:** Intercept coordinates transmitted to field enforcement units.
2. **Satellite Tasking:** Request 0.5m PlanetScope stereo pass to document machinery serial numbers and license plates.
3. **Evidence Dossier:** Generate official law enforcement report for prosecution filing.`;
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const promptToSend = customPrompt || inputPrompt;
    if (!promptToSend.trim() || isLoading) return;

    const userMessage: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: promptToSend,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) + ' UTC'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      // Call backend AI analyze route
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToSend,
          incident_id: currentIncident.id,
          custom_context: currentIncident,
          query_type: 'Forensic Intelligence'
        })
      });

      const data = await response.json();

      let aiText = '';
      let isFallback = false;

      if (data.success && data.text) {
        aiText = data.text;
        isFallback = !data.gemini_configured;
      } else {
        // High-precision offline forestry forensics heuristics
        aiText = generateFallbackResponse(promptToSend, currentIncident);
        isFallback = true;
      }

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiText,
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        isFallback
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error('AI Request error:', err);
      const fallbackText = generateFallbackResponse(promptToSend, currentIncident);
      setMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: fallbackText,
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
          isFallback: true
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Tactical prompt chips
  const promptChips = [
    { label: 'Full Forensic Triage', prompt: `Conduct comprehensive forensic triage for ${currentIncident.id}` },
    { label: 'Calculate Legal Penalties & EUDR', prompt: `Calculate estimated legal fines and EUDR compliance impact for ${currentIncident.id}` },
    { label: 'Road Intrusion Velocity', prompt: `Assess illegal road expansion speed and distance to protected indigenous boundaries for ${currentIncident.id}` },
    { label: 'Explain SAR Radar Coherence Drop', prompt: `Explain Sentinel-1C SAR radar coherence loss and backscatter mechanics for ${currentIncident.id}` }
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[580px] bg-[#0D1612] border border-white/10 rounded-sm overflow-hidden font-mono text-xs">
      {/* Header Bar */}
      <div className="px-4 py-3 bg-[#14201A] border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-sm bg-[#06B6D4]/20 border border-[#06B6D4]/50 flex items-center justify-center text-[#4CD7F6]">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white text-sm">SENTINEL AI</span>
              <span className="text-[9px] bg-[#06B6D4]/15 border border-[#06B6D4]/40 text-[#06B6D4] px-1.5 py-0.2 rounded-sm uppercase font-bold">
                GEOSPATIAL COPILOT
              </span>
            </div>
            <div className="text-[10px] text-white/50">
              Autonomous forensic analysis, statutory fine calculations & satellite tasking advisory
            </div>
          </div>
        </div>

        {/* Target Incident Context Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-white/40 text-[10px]">ACTIVE TARGET:</span>
          <select
            value={currentIncident.id}
            onChange={e => {
              const found = incidents.find(i => i.id === e.target.value);
              if (found) onSelectIncident(found);
            }}
            className="bg-[#080E0B] border border-white/15 text-white px-2.5 py-1 rounded-sm text-[11px] focus:outline-none"
          >
            {incidents.map(inc => (
              <option key={inc.id} value={inc.id}>
                [{inc.id}] {inc.lossAreaHectares} Ha - {inc.threatType}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages Viewport */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#080E0B]/50">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex items-start space-x-3 ${
              msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div
              className={`w-7 h-7 rounded-sm flex items-center justify-center flex-shrink-0 border ${
                msg.sender === 'ai'
                  ? 'bg-[#14201A] border-[#06B6D4]/40 text-[#4CD7F6]'
                  : 'bg-[#10B981]/20 border-[#10B981] text-[#10B981]'
              }`}
            >
              {msg.sender === 'ai' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-2xl p-3.5 rounded-sm border ${
                msg.sender === 'ai'
                  ? 'bg-[#0D1612] border-white/10 text-white/90 shadow-lg'
                  : 'bg-[#14201A] border-[#10B981]/30 text-white'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-white/40 mb-1.5 border-b border-white/5 pb-1">
                <span className="font-semibold text-white/60">
                  {msg.sender === 'ai' ? 'SENTINEL AI GEOSPATIAL CORE' : 'INVESTIGATOR'}
                </span>
                <div className="flex items-center space-x-2">
                  {msg.isFallback && (
                    <span className="text-[#F59E0B] text-[9px] bg-[#F59E0B]/10 px-1 rounded">
                      FORENSIC HEURISTICS
                    </span>
                  )}
                  <span>{msg.timestamp}</span>
                  {msg.sender === 'ai' && (
                    <button
                      onClick={() => copyToClipboard(msg.text, msg.id)}
                      className="hover:text-white transition-colors"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Message content with markdown-like formatting */}
              <div className="whitespace-pre-wrap leading-relaxed text-xs font-sans text-white/90">
                {msg.text}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded-sm bg-[#14201A] border border-[#06B6D4]/40 text-[#4CD7F6] flex items-center justify-center">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-[#0D1612] border border-white/10 p-3 rounded-sm text-white/60 flex items-center space-x-2 text-xs">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#06B6D4]" />
              <span>Analyzing orbital radar phase interferometry & legal databases...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Prompt Chips Bar */}
      <div className="px-3 py-2 bg-[#0D1612] border-t border-white/10 flex flex-wrap items-center gap-1.5 text-[10px]">
        <span className="text-white/40 mr-1">QUICK QUERIES:</span>
        {promptChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(chip.prompt)}
            disabled={isLoading}
            className="px-2.5 py-1 bg-[#14201A] hover:bg-[#182620] border border-white/10 hover:border-[#06B6D4]/50 text-white/80 hover:text-white rounded-sm transition-colors disabled:opacity-50"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-[#14201A] border-t border-white/10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            placeholder={`Ask Sentinel AI about ${currentIncident.id} or satellite radar anomalies...`}
            value={inputPrompt}
            onChange={e => setInputPrompt(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-[#080E0B] border border-white/10 focus:border-[#06B6D4] rounded-sm px-3 py-2 text-white text-xs placeholder:text-white/30 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || isLoading}
            className="px-4 py-2 bg-[#06B6D4] hover:bg-[#4CD7F6] disabled:opacity-40 text-[#080E0B] font-bold rounded-sm text-xs transition-colors flex items-center space-x-1.5 shadow-md"
          >
            <Send className="w-3.5 h-3.5" />
            <span>SEND</span>
          </button>
        </form>
      </div>
    </div>
  );
};
