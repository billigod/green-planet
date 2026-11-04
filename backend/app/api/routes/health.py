from fastapi import APIRouter
from datetime import datetime
from ...models.schemas import HealthResponse
from ...core.config import settings
from ...database.db import get_connection
from ...services.copernicus import copernicus_service
from ...services.gemini_service import gemini_service
from ...scheduler.monitoring_scheduler import monitoring_scheduler

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
def get_health():
    db_status = "HEALTHY"
    try:
        conn = get_connection()
        conn.cursor().execute("SELECT 1")
        conn.close()
    except Exception as e:
        db_status = f"ERROR: {str(e)}"

    scheduler_status = "RUNNING" if monitoring_scheduler.is_running else "INITIALIZING"
    cop_auth = copernicus_service.authenticate()
    cop_status = cop_auth.get("status", "NOT_CONFIGURED")
    gem_status = "CONFIGURED (gemini-2.5-flash)" if gemini_service.is_configured() else "NOT_CONFIGURED (rule_based_fallback)"

    return HealthResponse(
        status="OPERATIONAL",
        timestamp=datetime.utcnow().isoformat() + "Z",
        version=settings.VERSION,
        database=db_status,
        scheduler=scheduler_status,
        copernicus_integration=cop_status,
        gemini_integration=gem_status
    )
