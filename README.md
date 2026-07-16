# Solar Farm Console

Decision-oriented dashboard for an AI-powered solar farm energy management
platform. The n8n (Fusion AI) workflow computes all engineering KPIs and an
LLM interprets them; this SPA only fetches, validates, and renders.

## Quickstart

```bash
npm install
npm run dev          # http://localhost:5173/?mock=1  <- full demo, no backend needed
npm run build        # tsc --noEmit + vite build -> dist/
npm run preview      # serve the production build locally
```

`?mock=1` serves every endpoint from `mock/` (in-memory, deterministic) and
runs the same zod validation as live traffic. Without the flag the app calls
`VITE_API_BASE` (default `/api`), which `netlify.toml` proxies to the n8n
webhook host — set `YOUR-N8N-HOST` there before go-live.

## Endpoints consumed (n8n webhooks)

| Endpoint | Method | Purpose |
|---|---|---|
| `/analyze` | POST | Trigger full pipeline run, returns fresh AI Dashboard Payload |
| `/latest` | GET | Most recent stored payload (no re-run) |
| `/history?entity=&id=&days=` | GET | Time-series KPIs per farm/station/inverter/string/panel |
| `/alerts?status=` | GET | Alert log |
| `/alerts/ack` | POST | Acknowledge alert `{alertId, user}` |
| `/maintenance/done` | POST | Mark plan item done `{entityId, priority, user}` (contract extension) |

The payload contract lives in `src/types/payload.ts` (zod schema + types,
`PAYLOAD_VERSION`). Any change is a documented version bump.

## Historical storage (n8n side — design requirement)

The workflow persists every run so trends never get recomputed client-side.
Recommended: Postgres/Supabase node (Google Sheets append as fallback) with:

- `telemetry_raw` — daily ingested rows, mirrors the source sheet exactly
  (PanelID, StationID, InverterID, StringID + 19 sensor columns).
- `kpi_history` — one row per entity per run: `run_id, ts, entity_type
  (farm|station|inverter|string|panel), entity_id, pr, inverter_eff, temp_c,
  soiling_index, health_score, failure_prob`.
- `alerts` — `alert_id, ts, severity, entity_id, rule, message, status`.

The AI Payload Builder reads the last N runs from `kpi_history` to embed
trend arrays, so the LLM sees validated trends, never raw history. The
`/history` webhook is a plain SELECT on `kpi_history`.

## Guardrails baked into the frontend

- Zero engineering math in the browser; only display derivations (deltas,
  ratio -> %). Missing field renders an em dash with a "not provided by
  pipeline" tooltip — values are never invented.
- Every payload is zod-validated; mismatches render a contract banner, and a
  failed refetch falls back to "showing last cached data from {ts}".
- All fetches retry 3x with exponential backoff; every view has loading /
  empty / error states.
- No GPS in `map[]` -> schematic grid grouped Station -> Inverter -> String
  (coordinates are never faked).

## CI/CD

`.github/workflows/ci-cd.yml`: every push/PR runs `npm ci` + `npm run build`
(typecheck + production build); pushes to `main` additionally deploy `dist/`
to Netlify. The deploy step skips with a warning until two repo secrets exist:

```bash
gh secret set NETLIFY_AUTH_TOKEN   # app.netlify.com -> User settings -> Applications -> New access token
gh secret set NETLIFY_SITE_ID     # netlify sites:create --name taqasight (or Site settings -> Site ID)
```

Alternative: connect the repo via Netlify's native Git integration instead —
the workflow then keeps acting as CI only (deploy stays skipped).
