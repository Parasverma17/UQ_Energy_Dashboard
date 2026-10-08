# UQ Energy Dashboard – Frontend (React + Vite)

A modern React frontend for the UQ Energy dashboard, featuring a public-facing dashboard and an authenticated private dashboard. It includes an interactive Sankey flow, real-time analytics, a 3D campus map, and per-chart export actions – all styled with UQ branding.

## Quick start

```bash
# From FRONTEND/
npm install

# Development
npm run dev

# Production build
npm run build
npm run preview
```

Backend API is expected at http://localhost:8080 (via Nginx). Adjust URLs if your deployment differs.

## Environment

Create FRONTEND/.env with your Mapbox token (required for the 3D map component):

```env
VITE_MAPBOX_TOKEN=your_mapbox_access_token_here
```

Also ensure the UQ logo SVG is available at FRONTEND/public/uq_logo.svg (used in headers/footers).

## Routing (src/routes/AppRoutes.jsx)

- `/` → Public dashboard (`pages/Publicdashboard.jsx`)
- `/login` → Login page (`pages/LoginPage.jsx`)
- `/dashboard` → Private dashboard (`pages/Dashboard.jsx`)
- `/home` → Optional landing
- `/public_dashboard` → Alias for the public dashboard

## Pages

### Private dashboard (`pages/Dashboard.jsx`)

The authenticated dashboard showing organization-wide insights.

- UQ-branded header with the logged-in username (from `localStorage.username`).
- Metrics cards for Cost, Energy (GJ), Emissions (t CO2-e), and Consumption (kWh) over the last 30 days.
- Monthly energy comparison chart (YoY) using Apache ECharts.
- 7-day forecast chart (if API is available).
- Sankey energy flow diagram, filtered by selected building (uses `building` ID, e.g., 0051).
- Facilities table populated from real API data.
- Building energy usage chart (Breakdown) sourced from API.
- 3D Campus Map (Mapbox GL) synced with selected facility.
- Per-chart export actions (image/JSON; PDF optional) handled via `ExportButton`.

APIs used (typical):

- `/api/analytics/usage_per_month`
- `/api/analytics/uq_overlook`
- `/api/forecast`
- `/api/buildings/sankey?building=<id>`
- `/api/buildings/facilities`

### Public dashboard (`pages/Publicdashboard.jsx`)

Public-facing, simplified view with UQ branding.

- Header with UQ logo/title and a Login button (top-right) routing to `/login`.
- Monthly energy chart (YoY) using ECharts.
- Compact “Public Dashboard” energy and temperature charts (`components/PublicDash.jsx`).
- Sankey energy flow diagram (graceful empty/loading states).
- Facilities table populated from `/api/buildings/energy_usage` (names shown; no fake data).
- Removed metrics card section to keep the public page focused.
- Uses `/public/uq_logo.svg` for consistent branding.

### Login (`pages/LoginPage.jsx`)

- Collects `username`, `email`, and `password`.
- Validates that username/email/password are provided.
- Stores `username` in `localStorage` and redirects to `/dashboard`.
- Uses `/public/uq_logo.svg`.

## Components (src/components)

- `Header.jsx` – Filters (date range) with a static “St Lucia” label for campus in line with recent UI requirements.
- `MonthlyChart.jsx` – Year-over-year energy bars (ECharts); click to drill into months.
- `ForecastChart.jsx` – 7-day energy predictions (line/area), with loading/error states.
- `SankeyDiagram.jsx` – Energy flow Sankey; validates and filters data; tooltip formatting.
- `FacilitiesTable.jsx` – Facility list showing real energy metrics; click to select.
- `BreakdownChart.jsx` – Building energy usage based on API (no fake sample data).
- `Campus3DMap.jsx` – Mapbox GL 3D campus; reflects selected facility/building.
- `PublicDash.jsx` – Compact energy vs temperature charts with smaller spacing.
- `SimpleDash.jsx` - Drill-down supported graph designed in Apache Echarts to visualize relations between energy, weather, cost
- `ExportButton.jsx` – Per-chart export. Prefers ECharts image export or falls back to image/JSON. PDF support can be enabled with `html2canvas`/`jspdf` in environments where installing them is possible.

## Dependencies

- React, React Router, Vite, Tailwind CSS
- Apache ECharts (`echarts`, `echarts-for-react`)
- Mapbox GL (`mapbox-gl`) – requires `VITE_MAPBOX_TOKEN`

Install (already in package.json):

```bash
npm install
```

Optional exports (PDF/JPG) can be powered by dynamic imports of `html2canvas` and `jspdf`. If not installed, the export button falls back gracefully (e.g., JSON metadata).

## Configuration notes

- API base URLs in components assume `http://localhost:8080`. If your reverse-proxy/ports differ, adjust the fetch URLs accordingly.
- Place `uq_logo.svg` in `public/` to ensure headers/footers render correctly.
- Mapbox requires a valid public token in `.env` as `VITE_MAPBOX_TOKEN`.

## Troubleshooting

- Mapbox token missing → add `VITE_MAPBOX_TOKEN` to `.env`.
- ECharts blank chart → ensure the container has explicit height (components set 400–500px).
- Sankey empty/connection reset → reduce date ranges, confirm FastAPI logs, and verify `/api/buildings/sankey` is reachable; Nginx/timeout issues can drop long-running queries.
- PDF/image export build errors → omit `html2canvas`/`jspdf` or rely on ECharts’ image export; the button will fall back to JSON when capture is unavailable.

## Design & branding

- UQ Purple: `#7C3AED`; UQ Gold: `#EAB308`.
- Tailwind utility classes with responsive, accessible states.
- Headers/footers use `/public/uq_logo.svg` for consistent branding.

## Data formats

Sankey links (expected):

```json
[{ "source": "0051", "end_point": "51.17-Bus B Feeder 2", "kwh": 321534000 }]
```

Facilities (public dashboard, derived from `/api/buildings/energy_usage`):

```json
[{ "facility": "Advanced Engineering Building", "kwh": 2290500 }]
```

The UI derives cost/emissions optionally from `kwh` when needed (estimates in code) and shows facility names directly.

## Contributing

- Keep components small and focused.
- Prefer real API data over hardcoded examples.
- Maintain accessibility (labels, focus states, readable colors).
