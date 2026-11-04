---
name: Defense-Grade Geospatial Intelligence
colors:
  surface: '#0c1511'
  surface-dim: '#0c1511'
  surface-bright: '#323b36'
  surface-container-lowest: '#07100c'
  surface-container-low: '#141d19'
  surface-container: '#18221d'
  surface-container-high: '#232c27'
  surface-container-highest: '#2d3732'
  on-surface: '#dbe5de'
  on-surface-variant: '#bbcabf'
  inverse-surface: '#dbe5de'
  inverse-on-surface: '#29322e'
  outline: '#86948a'
  outline-variant: '#3c4a42'
  surface-tint: '#4edea3'
  primary: '#4edea3'
  on-primary: '#003824'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#006c49'
  secondary: '#4cd7f6'
  on-secondary: '#003640'
  secondary-container: '#03b5d3'
  on-secondary-container: '#00424e'
  tertiary: '#ffb95f'
  on-tertiary: '#472a00'
  tertiary-container: '#e29100'
  on-tertiary-container: '#523200'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#0c1511'
  on-background: '#dbe5de'
  surface-variant: '#2d3732'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 24px
    letterSpacing: 0em
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.06em
  label-sm:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.08em
  code-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 0.75rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

The design system establishes a high-precision, defense-grade environmental monitoring operations center. Designed for geospatial analysts, environmental enforcement officers, and intelligence teams, the aesthetic balances uncompromising operational utility with modern data telemetry.

The aesthetic philosophy centers on:
- **Utilitarian Discipline:** High data density, structured grid systems, and low visual noise designed for long shifts in mission-control environments.
- **Atmospheric Depth:** Deep obsidian and forest-charcoal field environments that eliminate monitor glare, paired with luminous spectral indicators that focus user attention on critical anomalies.
- **Precision Instrumentation:** Monoline borders, translucent HUD panels, telemetry badges, and micro-metrics that resemble targeting and orbital surveillance instruments.

## Colors

The palette operates under an absolute dark-mode discipline designed to preserve situational focus and visual acuity across multi-spectral imagery.

### Core Roles
- **Primary (`#10B981`):** Active sensor locks, confirmed baseline canopy integrity, system health, and primary interactive states.
- **Secondary (`#06B6D4`):** Orbital telemetry, SAR/optical satellite sensor streams, vector paths, and geospatial metadata coordinates.
- **Tertiary / Warning (`#F59E0B`):** Canopy stress anomalies, moderate deforestation alerts, and unverified spatial incursions.
- **Destructive / Incident Alert (`#EF4444`):** High-severity clear-cutting, unauthorized road developments, and verified illegal logging operations.

### Dark Surfaces & Backgrounds
- **Canvas Base (`#080E0B`):** Deepest obsidian tone reserved for root viewport backgrounds and base map canvas viewports.
- **Surface Elevation 1 (`#0D1612`):** Primary panel, drawer, and layout container surfaces.
- **Surface Elevation 2 (`#14201A`):** Interactive card backgrounds, elevated HUD modules, and active toolbar surfaces.
- **Surface Outlines (`rgba(16, 185, 129, 0.16)` / `rgba(255, 255, 255, 0.08)`): Technical containment borders delivering tactile structure without visual weight.

## Typography

Typography prioritizes fast scannability, compact horizontal footprint, and legibility at micro scales.

- **Headings & Body:** Set entirely in Inter to enforce visual coherence across telemetry layers, metrics tables, and spatial controls.
- **Labels & Micro-data:** Micro-labels (`label-md`, `label-sm`) use uppercase transforms and extended letter-spacing to delineate telemetry groups, coordinates, and layer states.
- **Numeric Readouts:** Metric readouts and coordinate streams use tabular figures (`font-variant-numeric: tabular-nums`) to prevent layout shift during real-time ingest updates.

## Layout & Spacing

The layout is built for high information density across multi-window consoles and widescreen operations displays.

### Grid & Density
- **Fluid Layout Structure:** Canvas-driven shell featuring fixed-width tool docks (64px collapsed, 320px expanded), collapsible telemetry inspector sidebars (360px), and a fluid central geospatial viewport.
- **Compact Spacing:** Built on a strict 4px grid. Standard padding in telemetry tables and parameter matrices remains compact (`space-xs` to `space-sm`) to maximize visible intelligence per viewport.

### Responsive Reflow
- **Desktop (>=1280px):** Simultaneous multi-panel layout with primary spatial map, timeline scrub bar, and persistent alert stream.
- **Tablet (768px - 1279px):** Inspector panels transform into sliding bottom sheets; timeline dock collapses into a toggle overlay.
- **Mobile (<768px):** Single-column stacked mode. The geospatial viewport retains precedence, while alert matrices and imagery comparisons switch into segmented swipe screens.

## Elevation & Depth

Depth is articulated through tinted translucent planes and low-contrast borders rather than heavy blur shadows, maintaining a technical, heads-up display aesthetic.

### Surface Stratification
- **Ground (Map Canvas):** Dark base `#080E0B` hosting satellite imagery tiles, vector polygons, and GIS layers.
- **Dock & Sidebars (HUD Layer 1):** `#0D1612` at 92% opacity with `backdrop-filter: blur(8px)`. Border: 1px solid `rgba(255, 255, 255, 0.08)`.
- **Floating Modals & Flyouts (HUD Layer 2):** `#14201A` at 96% opacity with `backdrop-filter: blur(12px)`. Border: 1px solid `rgba(16, 185, 129, 0.28)`.

### Optical Highlights
- Interactive cards and alert badges utilize subtle internal specular highlights (`box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06)`).
- Critical incidents deploy a localized, restrained crimson aura (`box-shadow: 0 0 16px rgba(239, 68, 68, 0.25)`).

## Shapes

The interface embraces a structured, utilitarian silhouette defined by level 1 soft roundedness (`0.25rem` / `4px`).

- **Controls & Buttons:** Strictly 4px corners, reinforcing a machine-tooled, modular device finish.
- **HUD Panels & Overlay Docks:** Base 4px corner radii, maintaining tight seam alignment when panels dock against adjacent edges.
- **Telemetry Pills & Status Indicators:** Fixed 2px to 4px boundaries. Full pill shapes are restricted exclusively to small operational status dots or coordinate chips to preserve the tactical aesthetic.

## Components

### Buttons
- **Primary:** Background `#10B981`, text `#080E0B`, font-weight 600. Hover state `#34D399`. Active state `#059669`.
- **Secondary (Telemetry/Sensor Action):** Background `rgba(6, 182, 212, 0.12)`, text `#06B6D4`, border 1px solid `rgba(6, 182, 212, 0.3)`. Hover state `rgba(6, 182, 212, 0.2)`.
- **Ghost/Tertiary:** Transparent background, text `#9CA3AF`, border 1px solid `rgba(255, 255, 255, 0.1)`. Hover state text `#F3F4F6`, border `rgba(255, 255, 255, 0.2)`.
- **Dimensions:** Compact 28px height for inline actions; standard 36px for global actions.

### Chips & Telemetry Badges
- **Incident Severity Chips:** 20px height, uppercase `label-sm`, letter spacing 0.08em.
  - Critical: Background `rgba(239, 68, 68, 0.15)`, text `#EF4444`, border `1px solid rgba(239, 68, 68, 0.4)`.
  - Warning: Background `rgba(245, 158, 11, 0.15)`, text `#F59E0B`, border `1px solid rgba(245, 158, 11, 0.4)`.
  - Nominal: Background `rgba(16, 185, 129, 0.12)`, text `#10B981`, border `1px solid rgba(16, 185, 129, 0.3)`.

### Lists & Incident Streams
- Compact rows with bottom border `1px solid rgba(255, 255, 255, 0.04)`.
- Hover state: Background `rgba(20, 32, 26, 0.7)`.
- Active selection: Border-left 2px solid `#10B981`, background `#14201A`.

### Checkboxes & Radios
- Size: 14x14px with 2px corner radius.
- Unchecked: Border `1px solid rgba(255, 255, 255, 0.2)`, background `rgba(8, 14, 11, 0.6)`.
- Checked: Border `#10B981`, background `#10B981`, checkmark glyph in `#080E0B`.

### Input Fields & Filter Dropdowns
- Background `#0D1612`, border `1px solid rgba(255, 255, 255, 0.12)`, text `#F3F4F6`.
- Focus state: Border `1px solid #10B981`, outline `none`, subtle shadow `0 0 0 1px rgba(16, 185, 129, 0.3)`.
- Placeholder text: `#6B7280`.

### Cards & Telemetry Panels
- Background `#0D1612` (or `#14201A` for active overlays), border `1px solid rgba(255, 255, 255, 0.08)`.
- Header: Integrated horizontal border with uppercase `label-md` section titles and metric badges.

### Domain-Specific Components
- **Multi-Temporal Imagery Scrubber:** Minimalist horizontal slider bar with step pins indicating satellite pass timestamps, optical resolution coverage, and cloud occlusion percentages.
- **Spatial Target Reticle:** 1px monoline crosshairs with dynamic lat/long coordinates rendered in tabular text.
- **Canopy Loss Delta Chart:** Dual-tone area chart featuring historic baseline canopy against detected deforestation incursions.