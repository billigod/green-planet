import json
import uuid
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from ...models.schemas import (
    IncidentResponse, IncidentNoteItem, IncidentTimelineItem,
    NoteCreate, StatusUpdate, Coordinates
)
from ...database.db import get_connection

router = APIRouter()

@router.get("/incidents", response_model=List[IncidentResponse])
def get_incidents(
    region_id: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None)
):
    conn = get_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM incidents WHERE 1=1"
    params = []

    if region_id:
        query += " AND region_id = ?"
        params.append(region_id)
    if severity:
        query += " AND severity = ?"
        params.append(severity)
    if status:
        query += " AND status = ?"
        params.append(status)

    query += " ORDER BY timestamp DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()

    incidents = []
    for r in rows:
        cursor.execute("SELECT * FROM incident_notes WHERE incident_id = ? ORDER BY timestamp DESC", (r["id"],))
        notes = [
            IncidentNoteItem(id=n["id"], timestamp=n["timestamp"], author=n["author"], text=n["text"])
            for n in cursor.fetchall()
        ]

        cursor.execute("SELECT * FROM incident_timeline WHERE incident_id = ? ORDER BY timestamp ASC", (r["id"],))
        timeline = [
            IncidentTimelineItem(id=t["id"], timestamp=t["timestamp"], event=t["event"], actor=t["actor"], verified=bool(t["verified"]))
            for t in cursor.fetchall()
        ]

        target_reticle = json.loads(r["target_reticle_json"]) if r["target_reticle_json"] else {}
        ground_unit = json.loads(r["patrol_unit_json"]) if r["patrol_unit_json"] else None

        incidents.append(IncidentResponse(
            id=r["id"],
            region_id=r["region_id"],
            title=r["title"],
            coordinates=Coordinates(lat=r["coordinates_lat"], lng=r["coordinates_lng"]),
            utm_zone=r["utm_zone"],
            timestamp=r["timestamp"],
            detected_by=r["detected_by"],
            confidence_score=r["confidence_score"],
            severity=r["severity"],
            status=r["status"],
            loss_area_hectares=r["loss_area_hectares"],
            estimated_canopy_loss_pct=r["estimated_canopy_loss_pct"],
            biomass_loss_tonnes=r["biomass_loss_tonnes"],
            carbon_emission_tco2e=r["carbon_emission_tco2e"],
            threat_type=r["threat_type"],
            pre_image_url=r["pre_image_url"],
            post_image_url=r["post_image_url"],
            change_mask_url=r["change_mask_url"],
            pre_date=r["pre_date"],
            post_date=r["post_date"],
            baseline_observation_id=r["baseline_observation_id"],
            current_observation_id=r["current_observation_id"],
            legal_jurisdiction=r["legal_jurisdiction"],
            target_reticle=target_reticle,
            ground_patrol_unit=ground_unit,
            notes=notes,
            timeline=timeline
        ))

    conn.close()
    return incidents

@router.get("/incidents/{incident_id}", response_model=IncidentResponse)
def get_incident(incident_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM incidents WHERE id = ?", (incident_id,))
    r = cursor.fetchone()

    if not r:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")

    cursor.execute("SELECT * FROM incident_notes WHERE incident_id = ? ORDER BY timestamp DESC", (incident_id,))
    notes = [
        IncidentNoteItem(id=n["id"], timestamp=n["timestamp"], author=n["author"], text=n["text"])
        for n in cursor.fetchall()
    ]

    cursor.execute("SELECT * FROM incident_timeline WHERE incident_id = ? ORDER BY timestamp ASC", (incident_id,))
    timeline = [
        IncidentTimelineItem(id=t["id"], timestamp=t["timestamp"], event=t["event"], actor=t["actor"], verified=bool(t["verified"]))
        for t in cursor.fetchall()
    ]

    target_reticle = json.loads(r["target_reticle_json"]) if r["target_reticle_json"] else {}
    ground_unit = json.loads(r["patrol_unit_json"]) if r["patrol_unit_json"] else None
    conn.close()

    return IncidentResponse(
        id=r["id"],
        region_id=r["region_id"],
        title=r["title"],
        coordinates=Coordinates(lat=r["coordinates_lat"], lng=r["coordinates_lng"]),
        utm_zone=r["utm_zone"],
        timestamp=r["timestamp"],
        detected_by=r["detected_by"],
        confidence_score=r["confidence_score"],
        severity=r["severity"],
        status=r["status"],
        loss_area_hectares=r["loss_area_hectares"],
        estimated_canopy_loss_pct=r["estimated_canopy_loss_pct"],
        biomass_loss_tonnes=r["biomass_loss_tonnes"],
        carbon_emission_tco2e=r["carbon_emission_tco2e"],
        threat_type=r["threat_type"],
        pre_image_url=r["pre_image_url"],
        post_image_url=r["post_image_url"],
        change_mask_url=r["change_mask_url"],
        pre_date=r["pre_date"],
        post_date=r["post_date"],
        baseline_observation_id=r["baseline_observation_id"],
        current_observation_id=r["current_observation_id"],
        legal_jurisdiction=r["legal_jurisdiction"],
        target_reticle=target_reticle,
        ground_patrol_unit=ground_unit,
        notes=notes,
        timeline=timeline
    )

@router.post("/incidents/{incident_id}/notes", response_model=IncidentNoteItem)
def add_incident_note(incident_id: str, note_data: NoteCreate):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM incidents WHERE id = ?", (incident_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Incident not found")

    note_id = f"n-{uuid.uuid4().hex[:6]}"
    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")

    cursor.execute("""
    INSERT INTO incident_notes (id, incident_id, timestamp, author, text, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (note_id, incident_id, now_str, note_data.author or "Duty Analyst", note_data.text, datetime.utcnow().isoformat() + "Z"))
    conn.commit()
    conn.close()

    return IncidentNoteItem(
        id=note_id,
        timestamp=now_str,
        author=note_data.author or "Duty Analyst",
        text=note_data.text
    )

@router.post("/incidents/{incident_id}/status")
@router.patch("/incidents/{incident_id}/status")
def update_incident_status(incident_id: str, status_data: StatusUpdate):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM incidents WHERE id = ?", (incident_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Incident not found")

    cursor.execute("UPDATE incidents SET status = ? WHERE id = ?", (status_data.status, incident_id))

    tl_id = f"tl-{uuid.uuid4().hex[:6]}"
    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    cursor.execute("""
    INSERT INTO incident_timeline (id, incident_id, timestamp, event, actor, verified, created_at)
    VALUES (?, ?, ?, ?, ?, 1, ?)
    """, (tl_id, incident_id, now_str, f"Operational status updated to: {status_data.status.replace('_', ' ').upper()}", "Duty Officer Console", datetime.utcnow().isoformat() + "Z"))

    conn.commit()
    conn.close()
    return {"success": True, "incident_id": incident_id, "new_status": status_data.status}
