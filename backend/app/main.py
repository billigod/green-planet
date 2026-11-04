import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .database.db import init_db
from .scheduler.monitoring_scheduler import monitoring_scheduler

from .api.routes import health, regions, incidents, analytics, monitoring, ai

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("greenplanet.ops")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Green Planet persistent database...")
    init_db()
    logger.info("Starting background orbital monitoring scheduler...")
    monitoring_scheduler.start()
    yield
    logger.info("Shutting down Green Planet background scheduler...")
    monitoring_scheduler.shutdown()

app = FastAPI(
    title="GREEN PLANET - Defense-Grade Geospatial Intelligence API",
    description="Operational API for orbital satellite monitoring, multi-temporal change detection, and forest law enforcement.",
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(regions.router, prefix="/api", tags=["Monitoring Regions"])
app.include_router(incidents.router, prefix="/api", tags=["Deforestation Incidents"])
app.include_router(analytics.router, prefix="/api", tags=["Forest Analytics"])
app.include_router(monitoring.router, prefix="/api", tags=["Satellite & Monitoring"])
app.include_router(ai.router, prefix="/api", tags=["AI Investigation Assistant"])

@app.get("/")
def root():
    return {
        "system": "GREEN PLANET Operations Center API",
        "version": settings.VERSION,
        "status": "ONLINE",
        "documentation": "/docs"
    }
