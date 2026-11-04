# syntax=docker/dockerfile:1
# GREEN PLANET — Multi-stage Production Container

# --- STAGE 1: Frontend Build ---
FROM node:20-slim AS frontend-builder
WORKDIR /app

COPY package.json ./
RUN npm install --legacy-peer-deps

COPY index.html tsconfig.json vite.config.ts ./
COPY src ./src
COPY public ./public

RUN npm run build

# --- STAGE 2: Python Geospatial Backend & Production Gateway ---
FROM python:3.11-slim-bookworm AS runner

WORKDIR /app

# Install system geospatial libraries (GDAL, PROJ, GEOS) and Node.js
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    build-essential \
    libgdal-dev \
    gdal-bin \
    libproj-dev \
    libgeos-dev \
    sqlite3 \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Python backend dependencies
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Install production Node dependencies for Express gateway
COPY package.json ./
RUN npm install --omit=dev --legacy-peer-deps && npm install -g tsx

# Copy backend code, models, database scripts
COPY backend/ ./backend/

# Copy server gateway and built frontend assets
COPY server.ts ./
COPY --from=frontend-builder /app/dist ./dist

# Create persistent storage directories
RUN mkdir -p /app/backend/data /app/backend/cache/satellite_assets

# Environment defaults
ENV PORT=3000
ENV NODE_ENV=production
ENV PYTHONPATH=/app:/app/backend
ENV DB_PATH=/app/backend/data/greenplanet.db
ENV EARTH_SEARCH_URL=https://earth-search.aws.element84.com/v1

EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start Green Planet dual-stack runtime
CMD ["tsx", "server.ts"]
