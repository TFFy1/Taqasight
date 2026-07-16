# Solar Fleet Console — Architecture Reference

> Source of truth for system architecture. Update this when the architecture changes.
> Claude Code: read relevant sections before modifying components, Functions, or deploy config. This repo is greenfield — grow this doc as the code is written; every structural addition gets recorded here in the same commit.

---

## System Overview

```
┌──────────────────────────────┐
│  Browser — React + Vite SPA  │  presentation only; no keys, no third-party calls
└──────────────┬───────────────┘
               │ HTTPS (same-origin)
┌──────────────▼───────────────┐
│  Netlify CDN (static assets) │
│  Netlify Functions           │  the ONLY backend surface
│   /.netlify/functions/*      │  reads secrets from Netlify env
└──────┬───────────────┬───────┘
       │               │
┌──────▼──────┐ ┌──────▼──────────────────┐
│  Fusion AI  │ │ Panel telemetry source   │
│ (Netlify    │ │ demo phase: simulated /  │
│  node)      │ │ CSV; later: provider API │
└─────────────┘ └─────────────────────────┘
```

Transport: browser → Functions over same-origin HTTPS; Functions → Fusion AI via the Fusion AI Netlify integration ("Netlify node"), server-side only.

**Open item (task for the orchestrator, first integration session):** confirm the exact invocation shape of the Fusion AI Netlify node — endpoint, auth header, request/response schema — and record it here plus in `security.md`. Do not build the AI panel components against a guessed schema; stub behind a typed adapter until confirmed.

---

## Frontend Structure (as built — Spec 001, 2026-07-16)

```
src/
  styles/
    tokens/tokens.css   # neu-clay design tokens (verbatim, orchestrator-locked)
    global.css          # font imports, reset, focus-visible, reduced-motion override
  config/brand.ts        # white-label strings — the only place brand copy lives
  components/
    icons.tsx             # @phosphor-icons/react wrappers, one family/weight (Section 11 redesign pass)
    BrandMark.tsx           # geometric sun+panel-grid monogram (NavRail header, favicon) — hand-drawn SVG exception
    StateViews.tsx         # shared Loading/Empty/Error surfaces (every data view uses these)
    NavRail.tsx, Header.tsx
  lib/api/
    schemas.ts             # browser copy of the Functions zod schemas (see below — deliberate duplication)
    client.ts              # fetchFleet/fetchTrends/fetchRecommendations — safeParse on every response
    hooks.ts                # useFleet (60s poll), useTrends(range), useRecommendations (5min staleTime)
  features/
    fleet-map/            # hero surface: KpiStrip, RoofPlinth, PanelTile, DetailRail, healthTokens.ts,
                           # SunArc.tsx (daylight dial), EnergyFlow.tsx (solar/home/grid flow strip),
                           # HealthRing.tsx (24-segment donut) — all three hand-drawn SVG exceptions
    recommendations/       # RecommendationsView — cards render AI body as plain text only
    trends/                # TrendsView — Recharts AreaChart within dataviz-skill mark specs; toggleable
                           # legend, peak-production ReferenceDot, client-computed self-powered stat
  App.tsx, main.tsx, App.module.css

netlify/functions/
  _lib/
    schemas.ts    # zod source of truth (Functions side); byte-identical copy at src/lib/api/schemas.ts
    simulation.ts # seeded (mulberry32) deterministic demo telemetry for demo-aurora-24
    fusion.ts     # typed Fusion AI adapter — stub mode default, FUSION_SIMULATE_DOWN toggle, live branch stubbed (open item #1)
    http.ts       # json/errorResponse/rateLimit helpers
  fleet.mts             # GET ?installationId= → FleetSnapshot
  trends.mts            # GET ?installationId=&range= → TrendsPayload
  recommendations.mts   # GET ?installationId= → RecommendationsPayload (rate-limited, AI-cost endpoint)
```

Stack as built: Vite + React 18 + TypeScript strict, react-router-dom v7, TanStack Query v5 (retry:1 default), zod v4, Recharts v3, CSS Modules + tokens.css. No Tailwind/UI-kit/icon library — all per Spec 001 §1 (locked, no substitutions needed; every dependency in the locked list installed as specified).

---

## Data Model (seed — refine when telemetry schema is real)

| Entity | Purpose | Key fields | Notes |
|---|---|---|---|
| Installation | one client's fleet | id, partnerId, panelCount (≥20), layout | white-label brand keyed on partnerId |
| Panel | atomic map unit | id, installationId, position {row,col or x,y}, status | status ∈ healthy·degraded·fault·offline |
| Reading | telemetry point | panelId, ts, outputW, temp | demo: generated/CSV |
| FleetSnapshot (extended, Spec 002) | instantaneous fleet state | ...existing fields, `currentConsumptionW`, `gridW` | `gridW = currentOutputW - currentConsumptionW`; positive = exporting, negative = importing; consumption derived from the same morning/evening-peak curve as `getTrendSeries` |
| Recommendation | AI suggestion | id, installationId, text, severity, createdAt | zod-validated at the Function boundary |

---

## Request Flows

1. **Fleet map load:** SPA → `GET /.netlify/functions/fleet?installationId=…` → Function validates `installationId` (zod; must equal `demo-aurora-24` else 404) → `getFleetSnapshot(now)` derives panel statuses from the seeded simulation → returns typed `FleetSnapshot` → `useFleet()` polls every 60s → map renders with cascade-in animation on first load; loading/empty/error states present. Deep link `/?panel=P-14` validated against `^P-\d{2}$` before use.
2. **Recommendations:** SPA → `GET /.netlify/functions/recommendations?installationId=…` → rate-limited (`max:10/60s` per installation, in-memory) → Function builds a `FleetSnapshot` → `fusion.ts` adapter (stub mode by default; `FUSION_SIMULATE_DOWN=true` forces the AI-down path) → zod-validates AI output → returns sanitized, display-only `RecommendationsPayload`. Body text is rendered as plain text in the SPA, never `dangerouslySetInnerHTML`.
3. **Trends:** SPA → `GET /.netlify/functions/trends?installationId=&range=24h|7d|30d` (zod enum, default `24h`, rate-limited `max:20/60s`) → `getTrendSeries()` (simulation) for chart points + `fusion.ts#getTrendExplanation()` (stub/live, same validation/down-toggle as recommendations) → returns `TrendsPayload` → Recharts `AreaChart` renders within the locked token palette (dataviz skill applied for mark specs/legend/tooltip, colors untouched).

All three Functions: bad/missing params → 400 `BAD_REQUEST`; unknown installation → 404 `NOT_FOUND`; upstream Fusion failure → 502 `UPSTREAM`; anything else → 500 `INTERNAL`. No internal error detail ever reaches the client.

Record every new flow here as it's built.

---

## Change Log
- 2026-07-16 03:15 UTC — Spec 002 (personality pass) implemented: `BrandMark.tsx` (NavRail + favicon monogram), `SunArc.tsx` (daylight dial, time sourced from snapshot `generatedAt` not client clock), `EnergyFlow.tsx` (solar/home/grid flow strip, replaces old Producing-now/Today KPI tiles), `HealthRing.tsx` (24-segment donut in the Fleet-health tile); `FleetSnapshot` extended with `currentConsumptionW`/`gridW` in both schema copies + `simulation.ts`; `PanelTile.module.css` texture/glint/frame realism (CSS only); `TrendsView` legend chips are now visibility-toggle buttons, peak-production `ReferenceDot`, client-computed "Self-powered" stat card. `icons.tsx` gained `HouseIcon`/`GridPowerIcon` (Phosphor `House`/`Lightning`). tsc (both tsconfigs) and `npm run build` clean; fleet/trends/recommendations re-verified 200 on running `netlify dev` — implementer (Sonnet)
- 2026-07-16 00:00 UTC — Doc seeded from product intent (greenfield; no code yet) — claud-md-builder
- 2026-07-16 01:10 UTC — Initial build per Spec 001: full scaffold (Vite/React/TS strict), token layer + global styles, brand config, Netlify Functions (`fleet`, `trends`, `recommendations`) with shared `_lib/` (schemas, seeded simulation, Fusion adapter, http helpers), SPA data layer (browser schema copy, client, TanStack Query hooks), app shell (nav rail, header, routes), fleet-map feature (KPI strip, roof plinth, panel tiles, detail rail, deep-link, cascade animation), recommendations feed, trends view (Recharts, dataviz skill applied). Verified: `tsc --noEmit` clean (app + node tsconfig projects), `npm run build` clean, `netlify dev` happy/failure/AI-down paths all exercised — implementer (Sonnet)

---

## Dashboard/ app — n8n Solar Farm Console (added 2026-07-16)

Separate SPA in this folder (distinct from `../frontend`). Presentation only:
n8n (Fusion AI) computes KPIs/anomalies/priorities, an LLM interprets them,
and this app fetches/validates/renders. No engineering math in the browser.

```
Browser (Vite + React 19 + TS)
  -> /api/* (Netlify redirect proxy, see netlify.toml)
  -> n8n webhooks: POST /analyze, GET /latest, GET /history, GET /alerts,
     POST /alerts/ack, POST /maintenance/done (extension)
```

Structure:
```
src/
  types/payload.ts    # THE contract (zod + types, PAYLOAD_VERSION) — spec §4
  lib/api.ts          # only network surface: base URL, retry/backoff, zod gate, mock switch
  lib/queries.ts      # TanStack Query hooks (usePayload/useHistory/useAlerts/ack/analyze/done)
  lib/format.ts       # display-only formatting ("—" for missing, deltas)
  lib/status.ts       # status normalization + color/icon meta (never color alone)
  styles/tokens.ts    # hex tokens for SVG/charts — mirrors @theme in index.css
  index.css           # Tailwind v4 @theme design tokens (dark energy-ops palette)
  components/         # Shell, HealthGauge, KpiCard, Sparkline, TrendChart, Drawer,
                      # PanelDrawer, StatusBadge, AlertItem, RunAnalysis, Banner, ui primitives
  pages/              # Overview, FarmMap (schematic grid), Stations, AlertsCenter,
                      # Maintenance, Insights
mock/                 # ?mock=1 fixtures + deterministic history generator (demo story §9)
```

Data-flow rules: every fetch is zod-validated (`ApiError.kind = network|http|
contract`); contract failure -> red banner; refetch failure with cache ->
amber "last cached data from {ts}" banner; deep link `/panel/:id` -> map
drawer via `?panel=` search param. History endpoint response contract is
`historyResponseSchema` in payload.ts (documented for the n8n SELECT).
