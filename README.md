# GREEN PLANET — Operational Forest Intelligence & Geospatial Law Enforcement Platform

A defense-grade orbital surveillance, multi-temporal change detection, and forest law enforcement operations center. Built to monitor high-risk biomes, ingest open-access multispectral, thermal, and SAR satellite observations, compute vegetation loss using rigorous scientific indices, and generate court-admissible forensic dossiers.

---

## 1. System Architecture

```
                                  +------------------------------------+
                                  |         Web Browser Client         |
                                  |   React 19 + TypeScript + Tailwind |
                                  |    (9 Operational Mission Views)   |
                                  +-----------------+------------------+
                                                    | HTTP (Port 3000)
                                                    v
                                  +------------------------------------+
                                  |       Node.js Express Gateway      |
                                  |             server.ts              |
                                  |  - Static asset serving (Vite SPA) |
                                  |  - STAC Point-Intersection queries |
                                  |  - High-speed Multi-Thread Cache   |
                                  |  - Transparent proxy to FastAPI    |
                                  +-----------------+------------------+
                                                    | HTTP (Port 8005)
                                                    v
                      +-------------------------------------------------------------+
                      |                 FastAPI Application Core                    |
                      |                         main.py                             |
                      +-----------------------------+-------------------------------+
                                                    |
         +------------------+-----------------------+------------------------+------------------+
         |                  |                       |                        |                  |
         v                  v                       v                        v                  v
+-----------------+ +-----------------+   +--------------------+   +-------------------+ +--------------+
|  Earth Search   | | Copernicus CDSE |   | Multispectral & SAR|   |  Incident Engine  | |  Gemini AI   |
|   STAC Service  | |  OData Service  |   | Change Detection   |   |   & Biomass       | | Legal Dossier|
| (Zero-Auth S2)  | |  (OAuth2 Token) |   | - NDVI (B08 - B04) |   | - Biomass/Carbon  | | Assistant &  |
| - Sentinel-2    | | - Sentinel-2    |   | - SCL Cloud Mask   |   | - GeoJSON Polys   | | Rule-Based   |
|   L2A (AWS S3)  | |   MSIL2A        |   | - Delta-NDVI       |   | - Duplication     | | Heuristics   |
| - Sentinel-1    | | - Sentinel-1    |   | - Morph. Opening   |   |   Prevention      | | Fallback     |
|   GRD (STAC)    | |   GRD SAR       |   | - Windowed Raster  |   | - UNVERIFIED      | |              |
| - Landsat-9     | |                 |   | - 3-Pass Composite |   |                   | |              |
|   Thermal TIRS  | |                 |   |   Temporal Median  |   |                   | |              |
+--------+--------+ +--------+--------+   +---------+----------+   +---------+---------+ +------+-------+
         |                   |                      |                        |                  |
         +-------------------+----------------------+------------------------+------------------+
                                                    |
                                                    v
                                  +------------------------------------+
                                  |      SQLite Relational Storage     |
                                  |          data/forest.db            |
                                  | - regions (Monitored AOIs)         |
                                  | - observations (Satellite passes)  |
                                  | - incidents (Suspected alerts)     |
                                  | - processing_jobs (Async tasks)    |
                                  | - monitoring_runs (Scheduler log)  |
                                  +------------------------------------+
```

---

## 2. Key Features & Capabilities

### 🗺️ Interactive Detailed Forest Map & Pin Drop
- High-resolution zoomable and pannable map interface.
- Instant **Pin Dropping**: Click anywhere on the map to anchor an operational pin with exact WGS84 GPS latitude and longitude coordinates.
- Full support for major global biomes as well as **Indian Forests & Reserves**:
  - Sundarbans Mangrove Tiger Reserve (West Bengal)
  - Western Ghats Biodiversity Hotspot (Nilgiri & Silent Valley)
  - Kaziranga National Park (Assam)
  - Jim Corbett Tiger Reserve (Uttarakhand)
  - Gir Forest National Park (Gujarat - Asiatic Lion Sanctuary)
  - Amazon Tropical Rainforest (Brazil)
  - Congo Basin Peatland Forest (DRC)
  - Sumatra Tropical Peatland (Indonesia)

### 🛰️ Real-Time Satellite Passes & Exact Ground Pin Reticle
- **Zero-Auth STAC Integration:** Connected to AWS Element 84 Earth Search STAC API v1 (`https://earth-search.aws.element84.com/v1`).
- **Point-Intersection Spatial Query:** Uses GeoJSON Point intersection query `intersects: { type: 'Point', coordinates: [lng, lat] }` ensuring every returned satellite pass directly covers the pinned ground target.
- **Top 3 Latest Satellite Passes:**
  - **Sentinel-2C / 2A MSI:** 10m multispectral surface reflectance (Red, Green, Blue, Near-Infrared).
  - **Sentinel-1 C-SAR:** 10m Synthetic Aperture Radar (all-weather, day-and-night cloud penetration).
  - **Landsat 9 OLI/TIRS:** 15m panchromatic / 100m thermal infrared surface temperature radiometry.
- **Sub-Pixel Pin Reticle Anchoring:** Calculates the exact $(X\%, Y\%)$ position of the dropped pin on the satellite scene using the STAC bounding box:
  $$x\% = \frac{\text{lng} - \text{minLon}}{\text{maxLon} - \text{minLon}} \times 100, \quad y\% = \frac{\text{maxLat} - \text{lat}}{\text{maxLat} - \text{minLat}} \times 100$$
  The pin scales and pans synchronously with the satellite image, featuring pulsing cyan radar rings, crosshairs, and a floating coordinate badge.

### ✨ High-Speed 3-Pass Multi-Satellite Clear Composite Engine
- **Parallel Multi-Threaded Retrieval:** Uses Python `ThreadPoolExecutor(max_workers=3)` to fetch 3 historical satellite passes concurrently in parallel.
- **Temporal Median Cloud & Shadow Rejection:** Outlier clouds (bright high reflectance in all bands) and transient cloud shadows are rejected by computing the temporal pixel median across passes:
  $$\text{Composite}(x, y) = \text{median}\big(P_1(x, y), P_2(x, y), P_3(x, y)\big)$$
- **Atmospheric Dehazing & Unsharp Sharpening:** Removes atmospheric scattering, boosts vegetation micro-contrast, and applies high-pass edge sharpening.
- **Live Processing Progress HUD:** Real-time 0% to 100% animated percentage counter, dynamic stage steps (Fetch $\rightarrow$ Align $\rightarrow$ Reject $\rightarrow$ Dehaze), elapsed time indicator, and cancel support.
- **Two-Tier Instant Caching:** In-memory Node.js gateway cache and tempdir LRU disk cache return repeat composite requests in $< 0.3$ seconds.

### 🎨 Live Spectral Palette & Thermal Heatmap (FLIR Ironbow)
- **`🟢 NATURAL RGB`:** True-color optical visible spectrum (B04, B03, B02).
- **`🔥 THERMAL IRONBOW`:** Authentic FLIR radiometric color ramp mapping surface temperature radiometry:
  - 🥶 **Cold (High-altitude clouds & deep water):** Deep Indigo / Navy Blue / Purple
  - 🌿 **Moderate (Canopy vegetation & moist soil):** Crimson Red / Amber / Rust
  - 🔥 **Warm (Dry land & high thermal emission):** Bright Gold / Yellow / White
  - Includes a floating **Radiometric Temperature Scale Legend (16°C – 38°C)**.
- **`🌿 CANOPY CIR`:** Color-Infrared vegetation health where chlorophyll reflects bright ruby-red and water appears black.
- **`⚡ CONTRAST`:** Dynamic range atmospheric penetration and contrast stretch.

### 🔍 Interactive Surfer Modal Controls
- **Smooth Mousewheel Zoom:** 60% up to 800% magnification centered on cursor.
- **Click-and-Drag Surfing:** Pan effortlessly across high-resolution orbital swaths.
- **Directional D-Pad:** On-screen nudge buttons with one-click `FIT` recentering.
- **One-Click `FOCUS PIN`:** Instantly flies camera directly to the sub-pixel pin location at 240% magnification.
- **Split-Screen Wipe Slider:** Interactive draggable before/after divider comparing raw cloudy pass vs. 3-pass clear composite.
- **Radar Mini-View:** Bottom-right picture-in-picture minimap showing active viewport reticle and pinned location marker.

---

## 3. Technology Stack

- **Frontend:** React 19, TypeScript 5, Vite 6, Tailwind CSS v4, Lucide React, Motion.
- **Backend Gateway:** Node.js Express, TypeScript, Child Process Spawner.
- **Python Backend:** FastAPI, Uvicorn, Pydantic v2.
- **Geospatial & Image Processing:** NumPy, Pillow (PIL), Rasterio, SciPy (morphological filtering), Shapely (vector polygon geometry), PyPROJ / Affine.
- **Satellite Ingestion Providers:**
  - **Primary (Zero-Auth):** Element 84 Earth Search STAC API v1 (`https://earth-search.aws.element84.com/v1`) accessing public Sentinel-2 L2A, Sentinel-1 GRD, and Landsat-9 COGs on AWS Open Data.
  - **Secondary (OAuth2):** Copernicus Data Space Ecosystem (CDSE) OData Catalog & Token Service.
- **Database:** SQLite 3 with WAL mode, parameterized queries, and composite index deduplication.
- **Background Scheduler:** APScheduler with 12-hour cadence and automated pass detection.
- **AI Investigation:** Gemini 2.5 Flash API with institutional legal-forensic prompt framing and fallback rule heuristics.
- **Containerization:** Multi-stage Dockerfile and `docker-compose.yml`.

---

## 4. Getting Started & Installation

### Prerequisites
- **Node.js:** v18.0.0 or higher (v20+ recommended)
- **Python:** v3.10 or higher
- **Package Managers:** `npm` and `pip`

### Step 1: Clone or Extract the Repository
```bash
git clone https://github.com/your-username/green-planet.git
cd green-planet
```

### Step 2: Install Node.js Frontend & Gateway Dependencies
```bash
npm install
```

### Step 3: Set Up Python Virtual Environment & Dependencies
```bash
# Windows PowerShell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt

# Linux / macOS
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

### Step 4: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default configuration runs out-of-the-box with public AWS Element 84 STAC open data (no API key required). Optional keys:
- `GEMINI_API_KEY`: For Gemini AI legal dossier synthesis.
- `COPERNICUS_CLIENT_ID` / `COPERNICUS_CLIENT_SECRET`: For CDSE secondary catalog access.

### Step 5: Start Development Server
```bash
npm run dev
```
- **Web Dashboard:** Open [http://localhost:3000](http://localhost:3000)
- **FastAPI Core:** Running at [http://127.0.0.1:8005](http://127.0.0.1:8005) (Swagger docs at [http://127.0.0.1:8005/docs](http://127.0.0.1:8005/docs))

---

## 5. Complete API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System health check (database, scheduler, STAC & Copernicus status). |
| `GET` | `/api/regions` | List all registered Areas of Interest (AOIs) with geographic coordinates. |
| `GET` | `/api/satellite/status` | Real-time orbital constellation status (Sentinel-2, Sentinel-1, Landsat 9). |
| `GET` | `/api/satellite/latest-passes?lat={lat}&lng={lng}&sensor={sensor}&limit=3` | Live STAC query returning latest 3 satellite passes with exact timestamps and bounding boxes. |
| `POST` | `/api/satellite/composite` | High-speed 3-pass temporal median fusion, cloud removal, and atmospheric dehazing. |
| `GET` | `/api/satellite/earthsearch/status` | Element 84 Earth Search public STAC endpoint status and collections. |
| `POST` | `/api/satellite/search` | Search Sentinel-2 L2A or Sentinel-1 imagery across Element 84 or Copernicus. |
| `POST` | `/api/satellite/earthsearch/download-process` | Download multispectral raster bands (B04, B08, SCL) and calculate NDVI. |
| `POST` | `/api/satellite/earthsearch/compare` | Bi-temporal change detection on two distinct scenes with configurable thresholds. |
| `GET` | `/api/incidents` | Filterable list of deforestation alerts with pagination and status filter. |
| `GET` | `/api/incidents/{id}` | Complete forensic dossier, target reticle, WGS84 coordinates, and timeline. |
| `PATCH` | `/api/incidents/{id}/status` | Transition verification status (`UNVERIFIED`, `UNDER_REVIEW`, `VERIFIED`, `REJECTED`). |
| `POST` | `/api/incidents/{id}/notes` | Append law enforcement patrol field notes to an incident dossier. |
| `GET` | `/api/analytics` | Aggregated forest loss statistics, biomass destruction, and legal risk index. |
| `POST` | `/api/monitoring/run` | Trigger immediate monitoring cycle across all registered forest regions. |
| `GET` | `/api/monitoring/status` | APScheduler status, execution history, and next scheduled pass. |
| `POST` | `/api/ai/analyze` | Request AI legal analysis using Gemini 2.5 Flash with rule-based fallback. |

---

## 6. Docker Deployment

Deploy the entire full-stack application with a single command using Docker Compose:

```bash
docker-compose up --build -d
```

- Multi-stage Docker build compiles the Vite frontend, prepares the GDAL/rasterio runtime, and starts both Express and FastAPI.
- Access the dashboard at `http://localhost:3000`.

---

## 7. Automated Testing Suite

Run the Python test suite:
```bash
# Windows PowerShell
.\.venv\Scripts\pytest backend/tests/ -v

# Linux / macOS
pytest backend/tests/ -v
```

The test suite validates:
- True multispectral NDVI calculation: $NDVI = (B08 - B04)/(B08 + B04)$
- SCL Cloud, cloud shadow, cirrus, and snow masking formulas.
- Morphological noise filtering and contiguous pixel clustering.
- Georeferenced raster mask to WGS84 GeoJSON polygon conversion.
- STAC Point-intersection query and deduplication.
- Multi-temporal 3-pass temporal median fusion and cloud rejection.
- SQLite audit trail, incident lifecycle, and duplication prevention.

---

## 8. License

This project is licensed under the MIT License — see the LICENSE file for details. Satellite imagery provided via open access by the European Space Agency (ESA) Copernicus Programme, NASA / USGS Landsat Programme, and AWS Open Data Sponsorship.
