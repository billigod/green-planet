import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR.parent / ".env")

class Settings:
    PROJECT_NAME: str = "GREEN PLANET Operations Center"
    VERSION: str = "2.4.0-ORBITAL"
    
    # Element 84 Earth Search STAC API Settings (Primary Provider)
    EARTH_SEARCH_URL: str = os.getenv("EARTH_SEARCH_URL", "https://earth-search.aws.element84.com/v1")
    PRIMARY_SATELLITE_PROVIDER: str = os.getenv("PRIMARY_SATELLITE_PROVIDER", "ELEMENT84")

    # Copernicus Data Space Ecosystem API Settings (Secondary Optional Provider)
    COPERNICUS_CLIENT_ID: str = os.getenv("COPERNICUS_CLIENT_ID", "")
    COPERNICUS_CLIENT_SECRET: str = os.getenv("COPERNICUS_CLIENT_SECRET", "")
    COPERNICUS_TOKEN_URL: str = os.getenv(
        "COPERNICUS_TOKEN_URL",
        "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
    )
    COPERNICUS_CATALOG_URL: str = os.getenv(
        "COPERNICUS_CATALOG_URL",
        "https://catalogue.dataspace.copernicus.eu/odata/v1"
    )
    
    # Gemini AI Forensic Intelligence Key
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # SQLite Database File Location
    DB_PATH: Path = BASE_DIR / "greenplanet.db"

    # Scheduling
    MONITORING_INTERVAL_HOURS: int = int(os.getenv("MONITORING_INTERVAL_HOURS", "12"))

settings = Settings()
