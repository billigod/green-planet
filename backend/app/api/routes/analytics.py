from fastapi import APIRouter
from ...models.schemas import AnalyticsResponse
from ...database.db import get_connection

router = APIRouter()

@router.get("/analytics", response_model=AnalyticsResponse)
def get_analytics():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT SUM(area_hectares) as total_ha, AVG(canopy_integrity_pct) as avg_int, SUM(tree_cover_loss_ha) as total_loss FROM regions")
    reg_stats = cursor.fetchone()

    cursor.execute("SELECT COUNT(*) as cnt FROM incidents WHERE severity = 'critical' AND status != 'RESOLVED'")
    crit_cnt = cursor.fetchone()["cnt"]

    cursor.execute("SELECT COUNT(*) as cnt FROM incidents WHERE severity = 'warning' AND status != 'RESOLVED'")
    warn_cnt = cursor.fetchone()["cnt"]

    cursor.execute("SELECT SUM(carbon_emission_tco2e) as total_c, SUM(loss_area_hectares) as total_inc_loss FROM incidents")
    inc_stats = cursor.fetchone()

    conn.close()

    total_monitored = float(reg_stats["total_ha"] or 4812700.0)
    canopy_mean = round(float(reg_stats["avg_int"] or 92.4), 1)
    total_loss_30d = round(float(inc_stats["total_inc_loss"] or 171.0), 1)
    total_carbon = round(float(inc_stats["total_c"] or 72070.0), 1)

    drivers_breakdown = [
        {"driver": "Illegal Logging Roads", "pct": 42.0, "hectares": round(total_loss_30d * 0.42, 1), "trend": "+14%"},
        {"driver": "Cattle Pasture Clearance", "pct": 31.0, "hectares": round(total_loss_30d * 0.31, 1), "trend": "-5%"},
        {"driver": "Wildfire Canopy Incursions", "pct": 16.0, "hectares": round(total_loss_30d * 0.16, 1), "trend": "+22%"},
        {"driver": "Artisanal Alluvial Mining", "pct": 11.0, "hectares": round(total_loss_30d * 0.11, 1), "trend": "+8%"}
    ]

    predictive_risk_zones = [
        {"zone": "Xingu Buffer Tier-1", "risk": "Critical", "urgency": "Immediate Interdiction", "advanceRate": "180 m/day"},
        {"zone": "Salonga Riverine Flank", "risk": "Elevated", "urgency": "Radar Ingestion Priority", "advanceRate": "45 m/day"},
        {"zone": "Gunung Leuser Peat Frontier", "risk": "High", "urgency": "Canopy Moisture Watch", "advanceRate": "90 m/day"}
    ]

    biome_health = [
        {"biome": "Amazonian Ombrophilous", "health": "Stressed", "coherenceDropAvg": 28.4, "status": "SURVEILLANCE_ACTIVE"},
        {"biome": "Congo Lowland Evergreen", "health": "Resilient", "coherenceDropAvg": 12.1, "status": "NOMINAL"},
        {"biome": "Sumatran Peatland", "health": "Degrading", "coherenceDropAvg": 34.6, "status": "ELEVATED_WATCH"}
    ]

    time_series = [
        {"week": "W-1", "lossHectares": 24.2, "carbonTCO2e": 10200},
        {"week": "W-2", "lossHectares": 38.6, "carbonTCO2e": 16400},
        {"week": "W-3", "lossHectares": 49.1, "carbonTCO2e": 20800},
        {"week": "W-4", "lossHectares": round(total_loss_30d - 111.9, 1), "carbonTCO2e": round(total_carbon - 47400, 1)}
    ]

    return AnalyticsResponse(
        total_monitored_hectares=total_monitored,
        total_loss_hectares_30d=total_loss_30d,
        total_carbon_emissions_tco2e=total_carbon,
        active_critical_incidents=crit_cnt,
        active_warning_incidents=warn_cnt,
        canopy_integrity_mean_pct=canopy_mean,
        drivers_breakdown=drivers_breakdown,
        predictive_risk_zones=predictive_risk_zones,
        biome_health_matrix=biome_health,
        time_series_data=time_series
    )
