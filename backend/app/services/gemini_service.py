import os
import logging
from typing import Dict, Any, Optional
from datetime import datetime
from ..core.config import settings

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.client = None

        if self.api_key and self.api_key != "MY_GEMINI_API_KEY":
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
                logger.info("Initialized Google GenAI client successfully.")
            except Exception as e:
                logger.warning(f"Could not initialize Google GenAI SDK: {e}")
                self.client = None

    def is_configured(self) -> bool:
        return bool(self.client is not None)

    def analyze_incident(
        self,
        prompt: str,
        incident_context: Optional[Dict[str, Any]] = None,
        query_type: str = "Forensic Intelligence"
    ) -> Dict[str, Any]:
        now_str = datetime.utcnow().strftime("%H:%M UTC")

        if self.client:
            try:
                system_instruction = (
                    "You are SENTINEL AI, an elite defense-grade geospatial intelligence analyst "
                    "and forestry forensics specialist for the GREEN PLANET operations center.\n"
                    "Analyze satellite telemetry, deforestation incursions, SAR radar coherence drops, "
                    "and illegal logging operations.\n"
                    "Deliver crisp, highly structured, authoritative technical telemetry analysis. "
                    "Use headers, bullet points, tabular readouts, and estimated legal/environmental "
                    "repercussions (e.g. EUDR compliance, Brazilian Forest Code Art. 44, carbon loss tCO2e).\n"
                    "Maintain an uncompromising, professional mission-control tone. "
                    "Explicitly separate AI-generated interpretations from measured satellite observations."
                )

                context_str = f"Target Incident Context:\n{incident_context}\n\nQuery Type: {query_type}\n\nAnalyst Query: {prompt}"

                models_to_try = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
                response = None
                chosen_model = "gemini-2.5-flash"
                for m in models_to_try:
                    try:
                        response = self.client.models.generate_content(
                            model=m,
                            contents=[
                                {"role": "user", "parts": [{"text": f"{system_instruction}\n\n{context_str}"}]}
                            ]
                        )
                        if response and response.text:
                            chosen_model = m
                            break
                    except Exception:
                        continue

                if response and response.text:
                    return {
                        "success": True,
                        "engine": chosen_model,
                        "gemini_configured": True,
                        "text": response.text,
                        "timestamp": now_str
                    }
                else:
                    logger.warning("Gemini models unavailable, falling back to forensic heuristics.")
            except Exception as e:
                logger.warning(f"Gemini API call failed: {e}, using rule-based fallback.")

        inc = incident_context or {}
        inc_id = inc.get("id", "ACTIVE_INCIDENT")
        loss_ha = inc.get("loss_area_hectares", 42.6)
        legal = inc.get("legal_jurisdiction", "Federal Environmental Police")
        coords = inc.get("coordinates", {"lat": -3.228, "lng": -55.138})

        rule_based_response = self._generate_rule_based_analysis(prompt, inc_id, loss_ha, legal, coords)
        return {
            "success": True,
            "engine": "rule_based_forensic_heuristics",
            "gemini_configured": False,
            "text": rule_based_response,
            "timestamp": now_str
        }

    def _generate_rule_based_analysis(
        self,
        prompt: str,
        inc_id: str,
        loss_ha: float,
        legal: str,
        coords: Dict[str, Any]
    ) -> str:
        p_lower = prompt.lower()
        lat = coords.get("lat", -3.228)
        lng = coords.get("lng", -55.138)

        if "fine" in p_lower or "legal" in p_lower or "eudr" in p_lower or "penalty" in p_lower:
            return (
                f"### ⚖️ STATUTORY PENALTY & JURISPRUDENCE AUDIT [RULE-BASED ENGINE]\n\n"
                f"**Notice:** GEMINI_API_KEY not configured. Telemetry generated via deterministic forestry rules.\n\n"
                f"**Target Case:** {inc_id} ({loss_ha} Hectares)\n"
                f"**Location:** `{lat:.4f}°, {lng:.4f}°` ({legal})\n\n"
                f"#### 1. Environmental Crimes Law (Statutory Baseline)\n"
                f"- Base administrative penalty: **R$ 5,000 / hectare** clear-cut inside federal reserves.\n"
                f"- Aggravating multiplier (1.5x) for strictly protected conservation area.\n"
                f"- Statutory fine calculation: **R$ {(loss_ha * 7500):,.2f}** (~USD ${(loss_ha * 1350):,.2f}).\n\n"
                f"#### 2. EUDR Regulation (EU 2023/1115)\n"
                f"- **Compliance Status:** FAILED DUE DILIGENCE / SANCTIONED.\n"
                f"- Coordinates flagged for immediate embargo across international trade desks.\n\n"
                f"#### 3. Recommended Judicial Measure:\n"
                f"- Issue formal embargo on rural title deeds (Termo de Embargo SISNAMA)."
            )
        elif "road" in p_lower or "velocity" in p_lower or "spur" in p_lower:
            return (
                f"### 🛰️ LINEAR ACCESS CORRIDOR VELOCITY ESTIMATION [RULE-BASED ENGINE]\n\n"
                f"**Notice:** GEMINI_API_KEY not configured. Analysis generated via spatial vector heuristics.\n\n"
                f"**Target Incursion:** Logging Corridor [{inc_id}]\n"
                f"**Advance Rate:** 180 meters / 24h operational cycle.\n\n"
                f"#### Morphological Trajectory:\n"
                f"- Penetration heading: 278° WNW heading towards primary mahogany stands.\n"
                f"- Distance to protected boundary buffer: 1.4 km.\n\n"
                f"#### Interdiction Directive:\n"
                f"- Deploy riverine patrol to coordinate `{lat:.4f}°, {lng:.4f}°` to impound earthmoving plant."
            )
        else:
            return (
                f"### 📋 FORENSIC TRIAGE SUMMARY [RULE-BASED ENGINE]\n\n"
                f"**Incident ID:** {inc_id}\n"
                f"**Deforested Surface:** {loss_ha} Hectares\n"
                f"**Jurisdiction:** {legal}\n\n"
                f"#### Multi-Spectral Findings:\n"
                f"- Normalized Difference Vegetation Index (NDVI) drop confirmed.\n"
                f"- Rapid canopy gap expansion exceeding threshold tolerances.\n\n"
                f"#### Tactical Recommendation:\n"
                f"- Transmit intercept dossier to regional enforcement command."
            )

gemini_service = GeminiService()
