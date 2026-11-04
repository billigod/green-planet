import logging
import requests
from requests.adapters import HTTPAdapter
from urllib3.util import Retry
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from ..core.config import settings

logger = logging.getLogger(__name__)

class CopernicusDataSpaceService:
    """
    Copernicus Data Space Ecosystem (CDSE) client for Earth Observation data.
    Provides verified OAuth2 client credentials authentication and real OData catalog
    searches for Sentinel-2 Level-2A (Optical) and Sentinel-1 GRD (Synthetic Aperture Radar).
    """
    def __init__(self):
        self.client_id = settings.COPERNICUS_CLIENT_ID
        self.client_secret = settings.COPERNICUS_CLIENT_SECRET
        self.token_url = settings.COPERNICUS_TOKEN_URL
        self.catalog_url = settings.COPERNICUS_CATALOG_URL
        self._access_token: Optional[str] = None
        self._token_expiry: Optional[datetime] = None

        # Robust connection session with retry policy for transient network drops
        self.session = requests.Session()
        retries = Retry(
            total=3,
            backoff_factor=0.5,
            status_forcelist=[429, 500, 502, 503, 504],
            raise_on_status=False
        )
        adapter = HTTPAdapter(max_retries=retries)
        self.session.mount("https://", adapter)
        self.session.mount("http://", adapter)

    def is_configured(self) -> bool:
        """
        Validates whether real Copernicus Data Space credentials are provided.
        Returns False if unset, empty, or dummy placeholder.
        """
        invalid_placeholders = {
            "", 
            "YOUR_COPERNICUS_CLIENT_ID", 
            "MY_COPERNICUS_CLIENT_ID",
            "COPERNICUS_CLIENT_ID_PLACEHOLDER"
        }
        return bool(
            self.client_id and 
            self.client_secret and 
            self.client_id.strip() not in invalid_placeholders and 
            self.client_secret.strip() not in invalid_placeholders
        )

    def authenticate(self) -> Dict[str, Any]:
        """
        Executes or verifies OAuth2 Client Credentials authentication against CDSE Keycloak realm.
        Strictly returns one of the required status codes:
        - AUTHENTICATED
        - NOT_CONFIGURED
        - AUTHENTICATION_FAILED
        - SERVICE_UNAVAILABLE
        """
        if not self.is_configured():
            return {
                "success": False,
                "status": "NOT_CONFIGURED",
                "message": (
                    "Copernicus API credentials not configured in environment. "
                    "Set COPERNICUS_CLIENT_ID and COPERNICUS_CLIENT_SECRET to enable live satellite ingest."
                )
            }

        # Check cached token with 120-second safety margin
        if self._access_token and self._token_expiry:
            if datetime.utcnow() < self._token_expiry:
                return {
                    "success": True,
                    "status": "AUTHENTICATED",
                    "token": self._access_token,
                    "expires_at": self._token_expiry.isoformat() + "Z"
                }

        # Acquire fresh token from Keycloak
        payload = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "grant_type": "client_credentials"
        }
        headers = {"Content-Type": "application/x-www-form-urlencoded"}

        try:
            res = self.session.post(self.token_url, data=payload, headers=headers, timeout=12)
            if res.status_code == 200:
                data = res.json()
                self._access_token = data.get("access_token")
                expires_in = int(data.get("expires_in", 3600))
                # Refresh buffer: 120 seconds before actual token expiry
                self._token_expiry = datetime.utcnow() + timedelta(seconds=max(30, expires_in - 120))
                logger.info("Copernicus CDSE OAuth2 token acquired successfully.")
                return {
                    "success": True,
                    "status": "AUTHENTICATED",
                    "token": self._access_token,
                    "expires_in": expires_in,
                    "expires_at": self._token_expiry.isoformat() + "Z"
                }
            elif res.status_code in (401, 403):
                logger.warning(f"Copernicus authentication rejected: HTTP {res.status_code}")
                return {
                    "success": False,
                    "status": "AUTHENTICATION_FAILED",
                    "message": f"Copernicus authentication failed (HTTP {res.status_code}). Verify COPERNICUS_CLIENT_ID and COPERNICUS_CLIENT_SECRET."
                }
            else:
                logger.warning(f"Copernicus Identity service HTTP {res.status_code}: {res.text[:200]}")
                return {
                    "success": False,
                    "status": "SERVICE_UNAVAILABLE",
                    "message": f"Copernicus Identity service returned HTTP {res.status_code}."
                }
        except (requests.exceptions.ConnectionError, requests.exceptions.Timeout) as e:
            logger.error(f"Copernicus connection timeout/error: {str(e)}")
            return {
                "success": False,
                "status": "SERVICE_UNAVAILABLE",
                "message": f"Copernicus Identity service unreachable: {str(e)}"
            }
        except Exception as e:
            logger.error(f"Unexpected Copernicus auth error: {str(e)}")
            return {
                "success": False,
                "status": "SERVICE_UNAVAILABLE",
                "message": f"Authentication exception: {str(e)}"
            }

    def check_connection(self) -> Dict[str, Any]:
        """
        Diagnostic connection probe returning verified operational status.
        Status is strictly one of: AUTHENTICATED, NOT_CONFIGURED, AUTHENTICATION_FAILED, SERVICE_UNAVAILABLE.
        """
        auth_result = self.authenticate()
        return {
            "status": auth_result.get("status", "NOT_CONFIGURED"),
            "success": auth_result.get("success", False),
            "message": auth_result.get("message", "Copernicus token verified and active."),
            "configured": self.is_configured(),
            "token_url": self.token_url,
            "catalog_url": self.catalog_url,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "expires_at": auth_result.get("expires_at")
        }

    @staticmethod
    def build_wkt_polygon(bounds: List[float]) -> str:
        """
        Converts bounding box [min_lat, min_lng, max_lat, max_lng]
        to counter-clockwise WGS84 WKT Polygon (lng lat order).
        """
        min_lat, min_lng, max_lat, max_lng = bounds
        return f"POLYGON(({min_lng} {min_lat}, {max_lng} {min_lat}, {max_lng} {max_lat}, {min_lng} {max_lat}, {min_lng} {min_lat}))"

    def parse_product_entity(self, item: Dict[str, Any], collection: str) -> Dict[str, Any]:
        """
        Parses OData entity into standardized Green Planet observation representation.
        Extracts cloud cover, geographic footprint, quicklook preview, and download links.
        """
        prod_id = item.get("Id")
        name = item.get("Name", "")
        content_date = item.get("ContentDate", {})
        start_date = content_date.get("Start", "")
        end_date = content_date.get("End", "")

        # Extract cloud cover attribute if present in Attributes array
        cloud_cover = 0.0
        attributes = item.get("Attributes", [])
        if isinstance(attributes, list):
            for attr in attributes:
                if attr.get("Name") == "cloudCover":
                    cloud_cover = float(attr.get("Value", 0.0))
                    break

        # Determine product type
        if "MSIL2A" in name:
            product_type = "S2MSI2A"
        elif "GRD" in name:
            product_type = "S1_SAR_GRD"
        else:
            product_type = item.get("ProductType", "UNKNOWN")

        return {
            "id": prod_id,
            "name": name,
            "collection": collection,
            "product_type": product_type,
            "acquisition_date": start_date,
            "content_date_end": end_date,
            "footprint": item.get("Footprint"),
            "cloud_cover_pct": round(cloud_cover, 2),
            "quicklook_url": f"{self.catalog_url}/Products({prod_id})/Products('quicklook')/$value",
            "download_url": f"{self.catalog_url}/Products({prod_id})/$value",
            "content_length_bytes": item.get("ContentLength"),
            "source_type": "COPERNICUS_REAL"
        }

    def search_sentinel2_l2a(
        self,
        bounds: List[float],
        start_date: str,
        end_date: str,
        max_cloud_cover: float = 30.0,
        limit: int = 10
    ) -> Dict[str, Any]:
        """
        Real catalog search for Sentinel-2 Level-2A Bottom-Of-Atmosphere (BOA) reflectance products.
        """
        return self._execute_catalog_search(
            collection="SENTINEL-2",
            product_filter="contains(Name, 'MSIL2A')",
            bounds=bounds,
            start_date=start_date,
            end_date=end_date,
            max_cloud_cover=max_cloud_cover,
            limit=limit
        )

    def search_sentinel1_grd(
        self,
        bounds: List[float],
        start_date: str,
        end_date: str,
        limit: int = 10
    ) -> Dict[str, Any]:
        """
        Real catalog search for Sentinel-1 Ground Range Detected (GRD) C-band SAR products.
        All-weather, cloud-piercing synthetic aperture radar.
        """
        return self._execute_catalog_search(
            collection="SENTINEL-1",
            product_filter="contains(Name, 'GRD')",
            bounds=bounds,
            start_date=start_date,
            end_date=end_date,
            max_cloud_cover=None,
            limit=limit
        )

    def search_products(
        self,
        bounds: List[float],
        start_date: str,
        end_date: str,
        collection: str = "SENTINEL-2",
        max_cloud_cover: float = 30.0,
        limit: int = 10
    ) -> Dict[str, Any]:
        """
        High-level dispatcher for Copernicus satellite catalog queries.
        """
        if collection == "SENTINEL-1":
            return self.search_sentinel1_grd(bounds, start_date, end_date, limit=limit)
        else:
            return self.search_sentinel2_l2a(bounds, start_date, end_date, max_cloud_cover=max_cloud_cover, limit=limit)

    def _execute_catalog_search(
        self,
        collection: str,
        product_filter: str,
        bounds: List[float],
        start_date: str,
        end_date: str,
        max_cloud_cover: Optional[float],
        limit: int
    ) -> Dict[str, Any]:
        """
        Constructs and issues OData v1 REST queries against Copernicus Data Space catalog.
        """
        if not self.is_configured():
            return {
                "status": "NOT_CONFIGURED",
                "total_found": 0,
                "products": [],
                "message": (
                    "Copernicus API not connected. Provide active COPERNICUS_CLIENT_ID and "
                    "COPERNICUS_CLIENT_SECRET to query real orbital data."
                )
            }

        auth = self.authenticate()
        if not auth.get("success"):
            return {
                "status": auth.get("status", "AUTHENTICATION_FAILED"),
                "total_found": 0,
                "products": [],
                "message": auth.get("message", "Authentication required")
            }

        polygon_wkt = self.build_wkt_polygon(bounds)

        filter_parts = [
            f"Collection/Name eq '{collection}'",
            product_filter,
            f"ContentDate/Start ge {start_date}T00:00:00.000Z",
            f"ContentDate/Start le {end_date}T23:59:59.999Z",
            f"OData.CSC.Intersects(area=geography'SRID=4326;{polygon_wkt}')"
        ]

        if max_cloud_cover is not None and collection == "SENTINEL-2":
            filter_parts.append(
                f"Attributes/OData.CSC.DoubleAttribute/any(att:att/Name eq 'cloudCover' and att/OData.CSC.DoubleAttribute/Value le {max_cloud_cover})"
            )

        filter_query = " and ".join(filter_parts)
        endpoint = f"{self.catalog_url}/Products"
        headers = {
            "Authorization": f"Bearer {self._access_token}",
            "Accept": "application/json"
        }
        params = {
            "$filter": filter_query,
            "$top": limit,
            "$orderby": "ContentDate/Start desc"
        }

        try:
            res = self.session.get(endpoint, headers=headers, params=params, timeout=18)
            if res.status_code == 200:
                data = res.json()
                raw_items = data.get("value", [])
                products = [self.parse_product_entity(it, collection) for it in raw_items]
                return {
                    "status": "SUCCESS",
                    "total_found": len(products),
                    "products": products,
                    "filter_applied": filter_query
                }
            elif res.status_code in (401, 403):
                # Token might have expired remotely; invalidate cache
                self._access_token = None
                return {
                    "status": "AUTHENTICATION_FAILED",
                    "total_found": 0,
                    "products": [],
                    "message": f"Catalog query authorization rejected (HTTP {res.status_code})."
                }
            else:
                return {
                    "status": "SERVICE_UNAVAILABLE",
                    "total_found": 0,
                    "products": [],
                    "message": f"Catalog query returned HTTP {res.status_code}: {res.text[:200]}"
                }
        except (requests.exceptions.ConnectionError, requests.exceptions.Timeout) as e:
            return {
                "status": "SERVICE_UNAVAILABLE",
                "total_found": 0,
                "products": [],
                "message": f"Catalog service unreachable: {str(e)}"
            }
        except Exception as e:
            return {
                "status": "ERROR",
                "total_found": 0,
                "products": [],
                "message": f"Catalog search exception: {str(e)}"
            }

copernicus_service = CopernicusDataSpaceService()
