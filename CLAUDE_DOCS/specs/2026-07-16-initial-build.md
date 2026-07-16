# Spec 001 — Initial Build: Scaffold, Token Layer, Fleet Map, Recommendations, Trends, Simulated Telemetry

> Author: Orchestrator (Fable). Implementer: Sonnet. Status: READY FOR IMPLEMENTATION.
> Implementer: read `CLAUDE.md`, `CLAUDE_DOCS/architecture.md`, `CLAUDE_DOCS/security.md`, `CLAUDE_DOCS/known-issues.md` first. Do not deviate from this spec; ambiguity or disagreement → stop and surface to the orchestrator. Do not add dependencies beyond the locked list below.

---

## Design Read (declared, binding)

*A homeowner's premium daily solar console rendered as warm fired ceramic — the fleet map is a tactile clay model of their own roof where every panel is a soft-extruded, pressable tile and health reads at arm's length in color + icon.*

Dials: `DESIGN_VARIANCE 6 / MOTION_INTENSITY 4 / VISUAL_DENSITY 5`.

Anti-default hard bans (from CLAUDE.md): AI-purple gradients, dark mesh heroes, glassmorphism, Inter + slate-900, hand-tuned per-component shadows. The neu-clay token language below **is** the brand.

Signature element: the fleet map roof plinth — a single large raised clay slab holding two roof faces of pressable panel tiles with a subtle photovoltaic cell-grid texture; selecting a panel physically "presses" it (inset shadow) and opens the detail rail.

---

## 1. Stack & dependencies (LOCKED — flag, don't improvise, if any fails to install)

- Runtime deps: `react`, `react-dom`, `react-router-dom` (v7), `@tanstack/react-query` (v5), `zod` (v4), `recharts` (v3), `@fontsource-variable/bricolage-grotesque`, `@fontsource-variable/instrument-sans`, `@fontsource-variable/spline-sans-mono`
- Dev deps: `vite`, `@vitejs/plugin-react`, `typescript` (strict), `@types/react`, `@types/react-dom`, `@netlify/functions`
- Netlify CLI is installed globally (v26.2.0) — do **not** add `netlify-cli` as a dependency.
- If a `@fontsource-variable/*` package doesn't exist for a family, use the static `@fontsource/<name>` weights 400/500/700 instead and note it in the completion report.
- CSS: plain CSS Modules (`*.module.css`) + one global token sheet. No Tailwind, no CSS-in-JS, no component library, no icon library (icons are hand-rolled inline SVG).

Scaffold: standard Vite React-TS layout (`index.html`, `src/main.tsx`, `src/App.tsx`), `netlify.toml` with `[build] command="npm run build" publish="dist"`, functions dir `netlify/functions`, `[dev] framework="vite"`. `package.json` scripts: `dev` (vite), `build` (`tsc -b && vite build`), `preview`. `.gitignore` includes `node_modules`, `dist`, `.netlify`, `.env`, `.env.*`.

TypeScript: `strict: true`, `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`.

## 2. Token layer — create FIRST, verbatim: `src/styles/tokens/tokens.css`

Every color below is WCAG-AA verified (17 automated checks by the orchestrator, 2026-07-16). Do not alter values. No component may use a raw hex or a hand-tuned shadow — tokens only.

```css
/* ── Solar Fleet Console · neu-clay design tokens ─────────────────
   Single light source: top-left. All depth comes from these recipes.
   AA-verified palette — do not edit values without orchestrator sign-off. */
:root {
  /* Surfaces (warm putty ceramic) */
  --surface-app: #E7E0D4;
  --surface-raised: #EDE7DC;
  --surface-sunken: #DFD7C9;

  /* Ink */
  --ink: #33291D;
  --ink-muted: #655847;

  /* Accent — sun gold */
  --accent: #E3A82B;          /* fills only; never as text on light surfaces */
  --accent-ink: #7A5A00;      /* gold as text/icon on light surfaces (AA 4.87:1) */

  /* Health palette — color + icon encode status, never shadow depth */
  --health-healthy-ink: #1E6B40;
  --health-healthy-fill: #CFE3CB;
  --health-degraded-ink: #8A4D00;
  --health-degraded-fill: #F0DDB8;
  --health-fault-ink: #A62E22;
  --health-fault-fill: #F1CFC6;
  --health-offline-ink: #5B5346;
  --health-offline-fill: #D8D0C1;

  /* Charts (strokes ≥3:1 vs --surface-app) */
  --chart-production-stroke: #8A6200;
  --chart-production-fill: rgba(227, 168, 43, 0.30);
  --chart-consumption-stroke: #46647A;
  --chart-consumption-fill: rgba(70, 100, 122, 0.16);

  /* Neu-clay shadow recipes — the ONLY shadows allowed in the app */
  --shadow-raise-sm: -3px -3px 6px rgba(255, 255, 255, 0.85), 3px 3px 6px rgba(93, 81, 68, 0.28);
  --shadow-raise-md: -6px -6px 14px rgba(255, 255, 255, 0.80), 6px 6px 14px rgba(93, 81, 68, 0.30);
  --shadow-raise-lg: -10px -10px 24px rgba(255, 255, 255, 0.75), 12px 12px 28px rgba(93, 81, 68, 0.32);
  --shadow-inset: inset 3px 3px 7px rgba(93, 81, 68, 0.30), inset -3px -3px 7px rgba(255, 255, 255, 0.85);
  --shadow-clay: inset 2px 3px 6px rgba(255, 255, 255, 0.65), inset -2px -4px 6px rgba(93, 81, 68, 0.18), 6px 10px 20px rgba(93, 81, 68, 0.28);
  --shadow-clay-pressed: inset 4px 5px 10px rgba(93, 81, 68, 0.30), inset -2px -3px 6px rgba(255, 255, 255, 0.55);

  /* Radii (clay = generous) */
  --radius-sm: 10px;
  --radius-md: 16px;
  --radius-lg: 24px;
  --radius-pill: 999px;

  /* Spacing (4px base) */
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-5: 24px; --space-6: 32px; --space-7: 48px; --space-8: 64px;

  /* Type */
  --font-display: 'Bricolage Grotesque Variable', 'Bricolage Grotesque', system-ui, sans-serif;
  --font-body: 'Instrument Sans Variable', 'Instrument Sans', system-ui, sans-serif;
  --font-data: 'Spline Sans Mono Variable', 'Spline Sans Mono', ui-monospace, monospace;
  --text-xs: 0.75rem; --text-sm: 0.875rem; --text-md: 1rem;
  --text-lg: 1.25rem; --text-xl: 1.625rem; --text-2xl: 2.125rem;

  /* Motion (intensity 4: one orchestrated load moment + micro-interactions) */
  --ease-clay: cubic-bezier(0.34, 1.3, 0.5, 1);
  --dur-fast: 150ms;
  --dur-slow: 420ms;

  /* Focus (keyboard visibility on soft surfaces) */
  --focus-ring: 0 0 0 3px var(--surface-app), 0 0 0 6px var(--accent-ink);
}

@media (prefers-reduced-motion: reduce) {
  :root { --dur-fast: 0ms; --dur-slow: 0ms; }
}
```

Also `src/styles/global.css`: font imports (`@fontsource-variable/...`), reset, `body { background: var(--surface-app); color: var(--ink); font-family: var(--font-body); }`, headings in `--font-display`, all numerals/readouts in `--font-data` with `font-variant-numeric: tabular-nums`, `:focus-visible { box-shadow: var(--focus-ring); outline: none; }`, `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }`.

White-label config (`src/config/brand.ts`): `export const brand = { productName: 'Solar Fleet Console', partnerName: 'Aurora Solar Partners', installationName: 'Hillside Residence' } as const;` — the only place brand strings live.

## 3. Shared domain types & simulation — single source of truth

`netlify/functions/_lib/` (underscore dir = not deployed as endpoints):

- **`schemas.ts`** — zod schemas + inferred types, exported for Functions. Mirror a browser copy in `src/lib/api/schemas.ts` (identical content; the SPA must not import across the functions boundary — the duplication is deliberate, keep in sync, note it in a comment at the top of both files).
  - `HealthStatus = z.enum(['healthy', 'degraded', 'fault', 'offline'])`
  - `Panel = { id: string /* P-NN */, row: number, col: number, face: 'south' | 'west', status: HealthStatus, outputW: number, capacityW: number, tempC: number | null, lastSeen: string /* ISO */ }`
  - `FleetSnapshot = { installation: { id, name, capacityKw: number, commissionedOn: string }, generatedAt: string, currentOutputW: number, todayEnergyKwh: number, panels: Panel[] }`
  - `TrendPoint = { ts: string, productionWh: number, consumptionWh: number }`
  - `TrendsPayload = { range: '24h' | '7d' | '30d', points: TrendPoint[], explanation: { summary: string, generatedAt: string, source: 'fusion-stub' | 'fusion-live' } }`
  - `Recommendation = { id: string, kind: 'anomaly' | 'trend' | 'maintenance', severity: 'action' | 'watch' | 'info', title: string, body: string, panelIds: string[], createdAt: string }`
  - `RecommendationsPayload = { generatedAt: string, source: 'fusion-stub' | 'fusion-live', recommendations: Recommendation[] }`
  - `ApiError = { error: string, code: string }`
  - String fields get max-length caps (`.max()`) per security.md DoS rules; arrays get `.max()` too (panels ≤ 500, recommendations ≤ 50).
- **`simulation.ts`** — deterministic (seeded PRNG, e.g. mulberry32 with fixed seed) demo installation `demo-aurora-24`, display name "Hillside Residence", 24 panels, 410 W capacity each:
  - South face: 3 rows × 6 cols (P-01…P-18). West face: 2 rows × 3 cols (P-19…P-24).
  - Story: **P-09 degraded** (afternoon shading, output ≈ 55–65% of neighbors), **P-14 fault** (string disconnect, 0 W, tempC null), **P-21 offline** (comms lost, `lastSeen` ≈ 6 h ago). All others healthy with a realistic solar bell curve over daylight hours and small per-panel jitter.
  - Exports: `getFleetSnapshot(now: Date)`, `getTrendSeries(range, now)` (hourly points for 24h, 3-hourly for 7d, daily for 30d; consumption shows morning/evening peaks; production follows the solar bell, slightly reduced by the story panels).
- **`fusion.ts`** — the typed Fusion AI adapter (open item #1 in known-issues: real invocation shape unconfirmed):
  - `getRecommendations(snapshot): Promise<RecommendationsPayload>` and `getTrendExplanation(range, points): Promise<TrendsPayload['explanation']>`.
  - Stub mode (default, when `FUSION_AI_ENDPOINT` or `FUSION_AI_KEY` unset): deterministic content derived from the simulation story (below). **Stub output goes through the same zod validation as live output** — AI output is data to validate, not truth to trust.
  - Live mode: `fetch` to `process.env.FUSION_AI_ENDPOINT` with the key in a header; response `safeParse`d; failure → throw `FusionUpstreamError`. Leave an `// Open item #1:` comment pointing at known-issues.
  - `FUSION_SIMULATE_DOWN=true` env toggle → adapter throws `FusionUpstreamError` even in stub mode (demo/verify the AI-down path).
  - Stub recommendations (exactly these three, ids `rec-001…003`):
    1. `action` / `anomaly` — "Panel P-14 has stopped producing" — string-disconnect finding: 0 W since 09:40 today while string neighbors average 300+ W; recommend scheduling a service visit; `panelIds: ['P-14']`.
    2. `watch` / `anomaly` — "Afternoon shading is costing P-09 about 18% of its output" — recurring 14:00–17:00 dip over the last 12 days, likely a new obstruction (tree growth or debris); `panelIds: ['P-09']`.
    3. `info` / `trend` — "Production up 8% versus last week" — clearer skies plus longer daylight; the system covered 76% of household consumption; `panelIds: []`.
  - Stub trend explanation: 2–3 plain sentences tied to the visible chart story (solar bell, P-14 loss ≈ 4% of fleet output, evening consumption peak).
- **`http.ts`** — helpers: `json(status, body)`, `errorResponse(status, code, message)` (sanitized `ApiError`; internals never leak), and `rateLimit(key, { max, windowMs })` in-memory sliding window (document the per-instance limitation in a comment). Never log request contents or AI text.

## 4. Netlify Functions (v2 style: default-export `(req: Request, context: Context) => Response`)

All: validate query params with zod `safeParse` → 400 `errorResponse('BAD_REQUEST', …)`; `installationId` must equal `demo-aurora-24` → else 404 `NOT_FOUND` (multi-tenancy scoping per security.md); try/catch → 502 `UPSTREAM` for `FusionUpstreamError`, 500 `INTERNAL` otherwise (generic message; log only error name/message server-side, never bodies).

1. `netlify/functions/fleet.mts` — `GET ?installationId=` → `FleetSnapshot`.
2. `netlify/functions/trends.mts` — `GET ?installationId=&range=24h|7d|30d` (range zod enum, default `24h`) → `TrendsPayload`; explanation via fusion adapter, guarded by its own `rateLimit` key.
3. `netlify/functions/recommendations.mts` — `GET ?installationId=` → `RecommendationsPayload`, guarded by `rateLimit('recommendations:' + installationId, { max: 10, windowMs: 60_000 })` → 429 `RATE_LIMITED` (AI-cost endpoint).

## 5. SPA data layer — `src/lib/api/`

`client.ts`: `fetchFleet`, `fetchTrends(range)`, `fetchRecommendations` — typed fetchers to `/.netlify/functions/*`; responses `safeParse`d against the browser schema copy (invalid → typed `ApiShapeError`); non-2xx → parse `ApiError`, throw typed error carrying `code`. `hooks.ts` (TanStack Query): `useFleet()` (refetchInterval 60 s), `useTrends(range)`, `useRecommendations()` (staleTime 5 min — rate-limit friendly). QueryClient defaults: `retry: 1`.

## 6. Views & components

App shell (`src/App.tsx` + `src/components/`): left nav rail (clay slab; icon+label buttons; active = `--shadow-inset` pressed look + `--accent-ink` icon), header with `brand.installationName` (display font), partner name small, and a "Live · updated HH:MM" pill fed by fleet `generatedAt`. Routes: `/` Fleet, `/insights` Recommendations, `/trends` Trends. Responsive to 360 px (nav collapses to an icon bar; roof faces stack).

Every data surface implements **loading** (clay skeleton blocks, gentle pulse), **empty** (plain-language invitation to act, no mood copy), and **error** (what happened + a Retry button wired to `refetch`) — non-negotiable per CLAUDE.md.

### 6a. Fleet view (hero) — `src/features/fleet-map/`
- KPI strip: three raised stat tiles — "Producing now" (kW, `--font-data`), "Today" (kWh), "Fleet health" (four health count chips, each icon + count, using the SVG icon set).
- **Roof plinth** (signature): one large `--shadow-raise-lg` slab (`--radius-lg`) containing two labeled roof faces ("South face — 18 panels", "West face — 6 panels") laid out with CSS grid mirroring physical rows/cols; a small compass chip (N arrow) at the plinth's top-right.
- **PanelTile** (`role="button"`, keyboard operable, `aria-label` e.g. "Panel P-09, degraded, 210 watts"): portrait aspect ≈ 3/4, `--radius-md`, `--shadow-clay`, background = health fill token with a faint PV cell-grid texture (CSS `repeating-linear-gradient`, ≤ 6% opacity ink); status icon badge top-right (16 px SVG: check-circle / triangle-alert / octagon-x / cloud-off in the matching `-ink` token) — **every tile always shows its status icon; color is never the sole channel**. Panel id label at bottom (`--text-xs`, `--font-data`). Hover: translateY(-2px) + `--shadow-raise-md` over `--dur-fast`. Selected: `--shadow-clay-pressed` + scale(0.98).
- Selection → **detail rail** (right side ≥ 1024 px, bottom sheet below): panel id (display font), status chip, output W vs capacity, temperature (or "No signal" for offline), last-seen time, and a "Mentioned in insights" link when a recommendation references the panel. Close button + Esc.
- Deep-link: `/?panel=P-14` pre-selects that panel (zod-validate the param against `^P-\d{2}$` before use).
- The one orchestrated load moment: tiles cascade in (opacity + translateY(8px) + scale 0.96→1, 40 ms stagger by index, `--ease-clay`, runs once; disabled under reduced motion).

### 6b. Recommendations feed — `src/features/recommendations/`
- Cards (raised clay, `--radius-lg`): severity chip (action→fault tokens, watch→degraded tokens, info→offline fill with `--accent-ink` icon), kind eyebrow ("Anomaly" / "Trend" / "Maintenance", `--text-xs`, uppercase, tracked), title in display font, body **rendered as plain text** (`{rec.body}` — never `dangerouslySetInnerHTML`, per security.md), panel chips (pill, `--font-data`) linking to `/?panel=P-14`, relative timestamp.
- Feed header: "Fusion insights" + source pill: "Simulated" while `source === 'fusion-stub'` (honest demo), "Live" otherwise.

### 6c. Trends view — `src/features/trends/`
- **Before writing any chart code, invoke the `dataviz` skill** (Skill tool) and apply it within the locked token palette.
- Range segmented control (24h / 7d / 30d): inset track (`--shadow-inset`), raised active thumb (`--shadow-raise-sm`).
- Recharts `AreaChart`, two series using the `--chart-*` tokens (production gold, consumption slate), no vertical gridlines, hairline horizontal gridlines in `--surface-sunken`, axes in `--ink-muted` / `--font-data` / `--text-xs`, tooltip = small raised clay card, legend = two labeled chips above the chart. Chart container: sunken well (`--shadow-inset`, `--radius-lg`) — the chart sits *in* the ceramic, not on it.
- Beside the chart (stacks below at < 1024 px): "What Fusion sees" clay card with `explanation.summary` as plain text, `generatedAt`, and the same Simulated/Live source pill.

Icons (`src/components/icons.tsx`): hand-rolled 24×24 inline SVG set (`stroke="currentColor"`, `fill="none"`, stroke-width 2, round caps/joins): check-circle, triangle-alert, octagon-x, cloud-off, sun, grid (fleet), sparkles (insights), chart (trends), compass-north, close, retry.

## 7. Verification (Definition of Done — all required before reporting back)

1. `npx tsc --noEmit` clean.
2. `npm run build` clean.
3. `netlify dev` (background) then curl each Function:
   - happy: all three endpoints with `installationId=demo-aurora-24` return zod-valid payloads (spot-check fields).
   - failure: missing `installationId` → 400 `BAD_REQUEST`; wrong id → 404; `trends?range=bogus` → 400; with `FUSION_SIMULATE_DOWN=true` → recommendations returns 502 `UPSTREAM` `{ error, code }` with no stack trace.
4. Confirm the SPA at the netlify-dev URL returns HTML 200.
5. Update `CLAUDE_DOCS/architecture.md` (frontend structure as built, request flows incl. trends, change log) and `CLAUDE_DOCS/known-issues.md` (add low-severity active issue: in-memory rate limiter is per-instance; change log entry). Timestamp format per CLAUDE.md.
6. Report back: files created, verification transcript summary (actual curl outputs), any deviation or substitution, anything flagged.

## Out of scope (do NOT build)

Auth, real Fusion AI wiring beyond the adapter's live branch, a test harness, dark mode, anything listed under "Deferred Features" in known-issues.md. No extra pages, no settings screen.
