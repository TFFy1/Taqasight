# Spec 002 - Personality Pass: Brand Mark, Daylight Dial, Panel Realism, Energy Flow, Health Ring, Trends Upgrades

> Author: Orchestrator (Fable). Implementer: Sonnet. Status: READY.
> Context: human feedback "dashboard is too basic, lacks personality; imagined solar panel graph with solar panel logo and image." Improvements grounded in the ui-ux-pro-max skill (Real-Time Monitoring pattern) and the design-taste-frontend skill (installed at `.claude/skills/design-taste-frontend/SKILL.md`).
> Read first: CLAUDE.md, CLAUDE_DOCS/decisions.md (palette + icon decisions are LOCKED), Spec 001 for conventions.

## Hard constraints (unchanged from the redesign pass)

- Tokens only; the Terracotta + Slate values in `src/styles/tokens/tokens.css` are locked. No new colors. No raw hex in components (SVG fills reference `var(--*)` or `currentColor`).
- ZERO em-dashes and en-dashes in any user-visible string. Hyphens only.
- UI icons come from the existing `src/components/icons.tsx` Phosphor wrappers ONLY. Exception explicitly granted by the orchestrator: the brand monogram and the data visualizations below (sun arc, health ring, flow connectors) are hand-drawn SVG because they are a logo and charts, not icons.
- Every new data surface handles loading/empty/error. Reduced motion collapses all new animation to static. Keyboard and screen-reader support per existing patterns (aria-labels on graphics: `role="img"` + descriptive `aria-label`).
- A GateGuard hook blocks the first Bash command and the first Write/Edit per file: present the facts it asks for as text, then retry the same call.

## 1. Brand mark - `src/components/BrandMark.tsx`

Geometric SVG monogram, one simple mark (design-taste skill allowance): a terracotta semicircle sun (`var(--accent)`) rising behind a 2x3 rounded-cell panel grid (6 equal rounded rects, `var(--ink)`) on a `var(--surface-sunken)` rounded-square plate. No text inside the SVG.
- Placement: top of NavRail above the nav links, 40px, with `brand.productName` beneath at `--text-xs` (hidden when the rail collapses to icons).
- Favicon: inline the same mark as an SVG data URI in `index.html` `<link rel="icon">` (static hex values are acceptable ONLY here since CSS vars don't resolve in favicons; use #C05B33 / #2B2926 / #EBEAE7 verbatim from tokens with a comment).
- White-label note: mark colors come from tokens; when a partner rebrands, tokens change and the mark follows. Add one line to the docs comment in `src/config/brand.ts`.

## 2. Daylight dial - `src/features/fleet-map/SunArc.tsx`

SVG semicircular arc placed in the fleet view header row (right of the title area, above the KPI strip; stacks below it under 1024px).
- Geometry: 180-degree arc, track = `var(--surface-sunken)` stroke 6, elapsed daylight portion = `var(--accent)` stroke 6 round caps, sun = 10px circle `var(--accent)` with 2px `var(--surface-raised)` ring, positioned at the current time fraction of daylight (06:00-18:00, matching the simulation's solar bell).
- Labels under the arc ends and apex: "06:00", "Solar noon", "18:00" in `--text-xs` `--font-data` `--ink-muted`.
- Night state (before 06:00 / after 18:00): sun sits at the nearest horizon end at 40% opacity, and a small line under the arc reads "The sun is down. Production resumes around 06:00." in `--ink-muted`. This explains zero nighttime output.
- `role="img"` with aria-label like "Sun position: 14:30, about 70 percent through the solar day" (or the night sentence).
- No animation; this is a static readout per render (it re-renders with the fleet query's 60s refetch).
- Time source: derive from the fleet snapshot's `generatedAt` (not the client clock) so it matches the data.

## 3. Panel tile realism - `PanelTile.module.css` only (no TSX changes)

- Cell grid: strengthen the repeating-gradient PV texture to a clearly visible module grid (two crossed repeating-linear-gradients forming ~4 columns x 6 rows of cells, line color `color-mix(in srgb, var(--ink) 14%, transparent)`).
- Glass glint: one diagonal highlight band via `linear-gradient(115deg, transparent 38%, rgba(255,255,255,0.28) 46%, rgba(255,255,255,0.10) 52%, transparent 60%)` layered over the texture.
- Module frame: 1px solid `color-mix(in srgb, var(--ink) 22%, transparent)` border (reads as an anodized frame).
- Keep the id label legible: give the label a solid pill background `var(--surface-raised)` so texture never sits behind text (AA preserved).
- Keep all existing shadows/hover/pressed behavior; layered backgrounds combine health fill + texture + glint in one `background-image` stack with `background-color` = health fill.

## 4. Energy flow strip - replaces the "Producing now"/"Today" tiles in `KpiStrip`

New component `src/features/fleet-map/EnergyFlow.tsx` + module.css, rendered where the first two KPI tiles were; the "Fleet health" tile gains the health ring (section 5). Layout: one raised clay slab containing three nodes connected by two horizontal connectors:
- Nodes: "Solar array" (SunIcon), "Home" (new HouseIcon added to icons.tsx from Phosphor `House`), "Grid" (new GridPowerIcon from Phosphor `Lightning`). Each node: icon in a small sunken circle + label `--text-xs` + value `--font-data` (kW with one decimal; W under 1 kW). Show "Today: X kWh" as a small line under the Solar node (preserves the old "Today" KPI).
- Data: extend `FleetSnapshot` with `currentConsumptionW: number` and `gridW: number` (positive = exporting to grid, negative = importing). Update BOTH schema copies (`netlify/functions/_lib/schemas.ts` and `src/lib/api/schemas.ts`) and `simulation.ts`: consumption from the same morning/evening-peak curve used in trends (scaled to instantaneous watts), `gridW = currentOutputW - currentConsumptionW`.
- Grid node label reads "Exporting" or "Importing" (or "Idle" when |gridW| < 50) with the value as `Math.abs`.
- Flow dots: 3 dots per active connector animated along it (CSS `@keyframes` translating along the connector, 1.8s linear infinite, `var(--accent)` 4px circles). Direction: solar to home when producing; home/grid direction follows the gridW sign. When production is 0 (night): solar connector static at 30% opacity, grid connector dots flow toward home (importing). Under `prefers-reduced-motion`: dots hidden, connectors show a static CSS arrowhead indicating direction.
- The strip has `role="img"` + an aria-label summarizing, e.g. "Solar 0 W, home using 320 W, importing 320 W from the grid."

## 5. Fleet health ring - `src/features/fleet-map/HealthRing.tsx`

SVG donut, 24 equal segments (one per panel, ordered P-01..P-24), each stroked in its panel's health ink token, 2px gaps, 72px diameter, center shows healthy count over total in `--font-data` ("21/24"). Sits in the third KPI slot next to the existing four count chips (keep the chips; they carry icon+count semantics). `role="img"` aria-label "Fleet health: 21 healthy, 1 degraded, 1 fault, 1 offline."

## 6. Trends upgrades - `TrendsView.tsx`

- Legend chips become toggle buttons (aria-pressed) that show/hide each series; 0.45 opacity when hidden; at least one series always visible (ignore a click that would hide the last one).
- Peak production point gets a direct label: small `--font-data` annotation "Peak 4.2 kW" via Recharts `ReferenceDot` + `Label` at the max production point (skip when the production series is hidden).
- New stat card "Self-powered" beside the Fusion insight card: percentage = sum of min(production, consumption) per point / total consumption over the range, `--text-2xl` `--font-data`, one-line explainer "Share of home use covered by solar over this range." Computed client-side from the fetched points.

## Out of scope

Weather/irradiance overlay, per-panel sparklines, CO2/savings card, theme switcher (record as Deferred Features in known-issues.md). No backend endpoints beyond the FleetSnapshot field additions. Do not touch tokens.css, the fusion.ts stub copy, or the recommendations feature.

## Verification (all required)

1. `npx tsc --noEmit -p tsconfig.app.json` and `-p tsconfig.node.json` clean; `npm run build` clean.
2. With `netlify dev` running: the fleet endpoint returns the two new fields and still zod-validates in the browser copy (curl + spot-check); trends/recommendations unaffected (200s).
3. Grep: no em/en-dashes in new visible strings; no raw hex outside tokens.css and the favicon data URI; no new hand-rolled icon paths outside BrandMark/SunArc/HealthRing/EnergyFlow connectors.
4. Update CLAUDE_DOCS/architecture.md (new components + FleetSnapshot fields) and known-issues.md (new deferred features + change log). Timestamps YYYY-MM-DD HH:MM UTC.
5. Report: files changed, verification outputs, any deviation.
