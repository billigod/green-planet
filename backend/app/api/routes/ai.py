import json
from fastapi import APIRouter, HTTPException
from ...models.schemas import AIAnalyzeRequest, AIAnalyzeResponse
from ...services.gemini_service import gemini_service
from ...database.db import get_connection

router = APIRouter()

@router.post("/ai/analyze", response_model=AIAnalyzeResponse)
def analyze_forest_incident(req: AIAnalyzeRequest):
    incident_context = req.custom_context

    if not incident_context and req.incident_id:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM incidents WHERE id = ?", (req.incident_id,))
        r = cursor.fetchone()
        conn.close()

        if r:
            target_reticle = json.loads(r["target_reticle_json"]) if r["target_reticle_json"] else {}
            incident_context = {
                "id": r["id"],
                "title": r["title"],
                "coordinates": {"lat": r["coordinates_lat"], "lng": r["coordinates_lng"]},
                "utm_zone": r["utm_zone"],
                "severity": r["severity"],
                "loss_area_hectares": r["loss_area_hectares"],
                "estimated_canopy_loss_pct": r["estimated_canopy_loss_pct"],
                "biomass_loss_tonnes": r["biomass_loss_tonnes"],
                "carbon_emission_tco2e": r["carbon_emission_tco2e"],
                "threat_type": r["threat_type"],
                "legal_jurisdiction": r["legal_jurisdiction"],
                "target_reticle": target_reticle
            }

    result = gemini_service.analyze_incident(
        prompt=req.prompt,
        incident_context=incident_context,
        query_type=req.query_type or "Forensic Intelligence"
    )

    return AIAnalyzeResponse(
        success=result["success"],
        engine=result["engine"],
        gemini_configured=result["gemini_configured"],
        text=result["text"],
        incident_id=req.incident_id,
        timestamp=result["timestamp"]
    )
