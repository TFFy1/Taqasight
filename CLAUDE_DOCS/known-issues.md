# Solar Fleet Console — Known Issues & Intentional Decisions

> **This is a living document.** It must be kept current.
> When an issue is fixed: remove it from Active Issues immediately.
> When a new issue is found: add it with a short description and the affected file.
> When an intentional decision changes: update the section and note why.
>
> Claude Code: read this before starting any task. Do not "fix" intentional decisions without being asked.

---

## Active Issues

| # | Severity | Issue | File | Notes |
|---|---|---|---|---|
| 1 | High | Fusion AI Netlify-node invocation schema unconfirmed | `netlify/functions/*` | Build behind a typed adapter + stub until confirmed; see architecture.md open item |
| 2 | High | No auth/ownership check yet | — | Demo/simulated data only until designed; see security.md |
| 3 | Low | In-memory rate limiter is per-instance, not global | `netlify/functions/_lib/http.ts` | Netlify Functions may run across multiple warm instances; the sliding-window limiter only sees requests on the instance handling them, so the effective cap can exceed the configured `max` under multi-instance load. Acceptable for demo/single-instance use; revisit (shared store, e.g. a KV/Redis) before this is a real cost control. |
| 4 | Low | `netlify dev` must be invoked via `npx --package netlify-cli@<version> netlify dev` on this Windows/Git-Bash setup | — | Plain `npx netlify dev` resolved to the unrelated npm package `netlify` (the API SDK, not the CLI) and failed with "could not determine executable to run"; forcing the package name fixed it. Note for the next agent running `netlify dev` locally. |
| 5 | Low | Killing `netlify dev` leaves its Vite child process alive on Windows | — | Orphaned Vite servers squat ports 5173+; the next `netlify dev` then "detects" the stale Vite on 5173 while its real child lands on another port, and the proxy 500s with "Could not proxy request". Before restarting: kill listeners on 5173-5176 (`netstat -ano \| grep :517`, then `taskkill //PID <pid> //F`). |

## Intentional Decisions — Do Not Change Without Explicit Instruction

- **Neumorphism × claymorphism blend is the brand** — do not "modernize" it toward flat/glass defaults. The soft-clay language is a commercial requirement (bundled retail product).
- **Health states encoded by color + icon, not shadow depth** — deliberate accessibility override on the neumorphic language.
- **All AI calls proxied through Functions even in the demo** — no "temporary" direct browser calls; the demo is built to production standard.
- **Telemetry is simulated/CSV in the demo phase** — deliberate; do not integrate a real provider feed unless asked.

## Deferred Features — Do Not Implement Unless Explicitly Asked

- Partner (installer) admin portal / multi-installation switcher
- Real telemetry provider integration
- Email/push alerting
- Billing / subscription surface
- Native mobile app
- Dark mode (theme deliberately locked to light porcelain ceramic; see decisions.md 2026-07-16 theme-lock entry)
- Weather/irradiance overlay on the fleet map or trends (Spec 002 out of scope)
- Per-panel sparklines (Spec 002 out of scope)
- CO2/savings card (Spec 002 out of scope)
- Theme switcher (Spec 002 out of scope; see Dark mode entry above)

---

## Change Log
- 2026-07-16 03:15 UTC — Spec 002 (personality pass) implemented and verified: BrandMark, SunArc, EnergyFlow, HealthRing shipped; FleetSnapshot gained currentConsumptionW/gridW (both schema copies + simulation.ts); PanelTile texture/glint/frame (CSS only); Trends legend toggles, peak ReferenceDot, self-powered stat card. Added four Deferred Features per Spec 002 "Out of scope" (weather/irradiance overlay, per-panel sparklines, CO2/savings card, theme switcher). tsc x2 + build clean; fleet/trends/recommendations re-curled 200 against running netlify dev; em/en-dash and raw-hex greps clean — implementer (Sonnet)
- 2026-07-16 00:00 UTC — Doc seeded from product intent (greenfield) — claud-md-builder
- 2026-07-16 01:10 UTC — Added issue #3 (per-instance rate limiter, low severity, expected per Spec 001) and issue #4 (local `netlify dev` invocation gotcha) after initial build verification — implementer (Sonnet)
- 2026-07-16 01:40 UTC — Reviewer Definition-of-Done pass complete: independent tsc/build re-run, all Function happy+failure+AI-down paths re-verified by curl, security greps clean (no dangerouslySetInnerHTML / VITE_ secrets / raw hex outside tokens), removed redundant `role="button"` in PanelTile. Visual browser QA not yet performed (no Playwright in env) — human should eyeball the running demo — reviewer (Fable)
- 2026-07-16 02:35 UTC — design-taste-frontend redesign pass applied and verified: palette rotated to Terracotta + Slate (20 WCAG checks pass), icons swapped to @phosphor-icons/react, visible em/en-dashes purged, dark mode added to Deferred Features. tsc/build clean; SPA + all three Functions re-smoked on netlify dev — orchestrator (Fable)

## Dashboard/ app (n8n Solar Farm Console) — 2026-07-16

| # | Sev | Issue | Where | Notes |
|---|-----|-------|-------|-------|
| D1 | High | `netlify.toml` proxy target is the placeholder `YOUR-N8N-HOST` | `netlify.toml` | Must be set to the real n8n instance before non-mock deploy; until then only `?mock=1` works in production. |
| D2 | Med | Browser-rendered UI not yet verified in a real browser this session | all pages | Verified: tsc clean, build clean, 8/8 payload contract+degradation checks, preview serves 200 + SPA fallback. Run `npm run dev` and eyeball `/?mock=1` before demo; Lighthouse pass still pending. |
| D3 | Low | `POST /maintenance/done` is a dashboard-defined contract extension | `src/lib/api.ts` | n8n workflow must add this webhook or the Done checkbox shows a visible error (graceful, non-blocking). |
| D4 | Low | Recharts chunk is 367 kB (gzip 107 kB) | build | Split into its own chunk; lazy route-level import is the next lever if Lighthouse perf < 90. |
