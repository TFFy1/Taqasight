# Solar Fleet Console — Decision Record

> Every meaningful technical or design decision (tool choice, infra change, architectural pattern, design-dial override) gets an entry here.
> Claude Code (orchestrator role): record decisions here as you make them instead of pausing for approval. Implementer: read before starting; never re-litigate a recorded decision — surface disagreement to the orchestrator.

Entry format: **Date — Decision — Reasoning — Alternatives considered — Status.**

---

- 2026-07-16 — **React + Vite SPA on Netlify, backend = Netlify Functions only** — simplest stack that ships a polished demo; keys stay server-side; single deploy surface — Alternatives: Next.js (SSR unneeded for an authenticated console), separate backend (overhead) — Accepted.
- 2026-07-16 — **Multi-agent operation: Fable orchestrates/designs/decides, Sonnet implements to spec, either model verifies** — matches team capability plan — Alternatives: single-model — Accepted.
- 2026-07-16 — **Design language: neumorphism × claymorphism blend, tokenized; `design-taste-frontend` skill mandatory for all UI work; starting dials 6/4/5** — anti-slop requirement from product owner; dashboard density needs override of the skill's landing-page defaults — Alternatives: flat/Material (rejected: generic) — Accepted.
- 2026-07-16 — **zod at every Function boundary, including on Fusion AI responses** — AI output is untrusted input — Accepted.

- 2026-07-16 — **`design-taste-frontend` skill unavailable in this environment → substituted `example-skills:frontend-design` (same anti-default discipline)** — CLAUDE.md's named skill is not installed; the substitute covers brief-grounding, anti-default calibration, and self-critique; Design Read + dials from the mandate still declared and binding (see Spec 001) — Alternatives: proceed skill-less (rejected: mandate) — Accepted (orchestrator/Fable).
- 2026-07-16 — **Design Read locked: "warm fired ceramic; the fleet map is a tactile clay model of the client's own roof; health reads at arm's length in color + icon." Dials 6/4/5 kept from CLAUDE.md** — Accepted.
- 2026-07-16 — **Typography: Bricolage Grotesque (display) / Instrument Sans (body) / Spline Sans Mono (data readouts), self-hosted via @fontsource** — characterful without being novelty; avoids the banned Inter default; no external font requests in production — Alternatives: Inter (banned), Google Fonts CDN (external request) — Accepted.
- 2026-07-16 — **Palette AA-verified before tokenization: 17 automated WCAG checks (text 4.5:1, non-text 3:1) pass on the warm-putty surface set, ink pair, sun-gold accent, and all four health ink/fill pairs** — accessibility overrides aesthetics per mandate; values locked in Spec 001 / `src/styles/tokens/tokens.css` — Accepted.
- 2026-07-16 — **Frontend stack: react-router v7, TanStack Query v5, zod v4, Recharts v3, CSS Modules + one global token sheet; no Tailwind/UI-kit/icon lib** — Query gives disciplined loading/error/empty + polling control; Recharts is token-themeable; hand-rolled SVG icons keep the clay language coherent — Alternatives: hand-rolled chart (implementer risk), styled-components (runtime cost) — Accepted.
- 2026-07-16 — **Netlify Functions v2 style (`.mts`, Request→Response), shared `_lib/` for schemas/simulation/fusion adapter; zod schemas duplicated (not imported) across the functions/SPA boundary** — keeps the SPA bundle free of server code and the boundary explicit; duplication is deliberate and commented — Accepted.
- 2026-07-16 — **Demo story: installation `demo-aurora-24` (24 panels: south face 3×6 = 18, west face 2×3 = 6): P-09 degraded (shading), P-14 fault (string disconnect), P-21 offline (comms)** — exercises all four health states and gives recommendations a narrative — Accepted.
- 2026-07-16 — **`FUSION_SIMULATE_DOWN=true` env toggle makes the fusion adapter throw** — makes the AI-down failure path demonstrable and testable per Definition of Done — Accepted.
- 2026-07-16 — **Spec 001 written to `CLAUDE_DOCS/specs/2026-07-16-initial-build.md`; implementation handed to Sonnet implementer agent** — per multi-agent protocol — Accepted.

- 2026-07-16 — **`design-taste-frontend` skill provided by the human and installed at `.claude/skills/design-taste-frontend/SKILL.md`; full redesign audit run under it (Section 11 redesign protocol)** — supersedes the earlier substitute-skill decision; the skill self-scopes to landing pages, applied contextually per CLAUDE.md (design read, dials, anti-default discipline, pre-flight) — Accepted (human-directed).
- 2026-07-16 — **Palette rotated to the skill-sanctioned "Terracotta + Slate" family: cool porcelain surfaces (#E4E3E0/#EBEAE7/#DAD8D3), graphite ink (#2B2926/#5A5650), terracotta accent (#C05B33 fills / #8E3D1A text), health fills retuned; 20 automated WCAG checks pass** — the original warm putty + sun gold + espresso palette fell in the skill's banned "beige+brass+espresso" AI-default family; human chose rotation over the documented brand override (AskUserQuestion, this session) — Alternatives: keep warm ceramic under override, Forest family — Accepted (human-approved).
- 2026-07-16 — **Icons switched from hand-rolled SVG to `@phosphor-icons/react` (weight "bold", single family), wrapped in `src/components/icons.tsx` keeping the original export names** — the skill hard-bans hand-rolled icon paths (SKILL.md §3.C); amends Spec 001 §1's "no icon library" line — Accepted.
- 2026-07-16 — **Em/en-dashes purged from all user-visible strings (roof face labels, rate-limit errors, Fusion stub copy) per SKILL.md §9.G; code comments exempt (ban covers rendered copy)** — Accepted.
- 2026-07-16 — **Theme locked to light porcelain ceramic (skill §8.C brand-insistence clause): neumorphic dual-source depth is the brand and degrades on dark surfaces; dark mode added to Deferred Features** — Accepted.

- 2026-07-16 — **Spec 002 "personality pass" (human feedback: dashboard too basic): brand monogram, daylight dial (SunArc), PV-realistic panel tiles, energy flow strip (FleetSnapshot + `currentConsumptionW`/`gridW`), 24-segment health ring, trends legend toggles + peak label + self-powered stat** — grounded in ui-ux-pro-max (Real-Time Monitoring pattern; its dark-OLED/blue palette suggestion rejected: brand palette is locked and human-approved) — spec at `CLAUDE_DOCS/specs/2026-07-16-002-personality-pass.md`, implemented by Sonnet, reviewer-verified — Accepted.
- 2026-07-16 — **Implementer deviation approved: SunArc lives in a new FleetView-local header row ("Fleet map" h2), not the shared Header** — keeps the dial scoped to the map context and the global Header route-agnostic — Accepted (orchestrator).

---

## Change Log
- 2026-07-16 00:00 UTC — Doc seeded with founding decisions — claud-md-builder
- 2026-07-16 00:45 UTC — Recorded initial-build decisions (design read, palette verification, stack, demo story) + Spec 001 handoff — orchestrator (Fable)
- 2026-07-16 02:30 UTC — Recorded design-taste-frontend redesign pass: skill installed, palette rotation (human-approved), Phosphor icons, dash purge, theme lock — orchestrator (Fable)
- 2026-07-16 03:30 UTC — Recorded Spec 002 personality pass + approved SunArc placement deviation — orchestrator (Fable)

## Dashboard/ app — n8n Solar Farm Console (2026-07-16 mission)

- 2026-07-16 — **`Dashboard/` is a separate app from `../frontend` (neu-clay Solar Fleet Console): a Solar Farm Console wired to the n8n/Fusion AI webhook pipeline, built to the product owner's 2026-07-16 mission spec** — the spec's §7 design direction (dark energy-ops: deep navy #0B2A5B base, electric blue #2A7ACB, solar amber #F0C42A) supersedes the neu-clay mandate *for this app only*; `ui-ux-pro-max` skill applied per explicit user instruction — Accepted (user-directed).
- 2026-07-16 — **Stack: Vite 7 + React 19 + TS strict, Tailwind v4 (tokens in `@theme`, mirrored in `src/styles/tokens.ts` for Recharts SVG), TanStack Query v5, zod v4, Recharts 3, lucide-react; fonts self-hosted via @fontsource (Space Grotesk display / IBM Plex Sans text / IBM Plex Mono data)** — per spec §6; token duplication CSS<->TS is deliberate (SVG attrs cannot resolve CSS var()) and documented in both files — Accepted.
- 2026-07-16 — **Connectivity: all calls go to `VITE_API_BASE` (default `/api`); `netlify.toml` proxies `/api/*` to the n8n host (CORS-free); retry 3 attempts with exponential backoff in `src/lib/api.ts`; React Query retries off to avoid double-retry storms** — Accepted.
- 2026-07-16 — **Mock mode `?mock=1` (spec §6): `mock/` fixtures served through the same zod validation as live responses; deterministic seeded data telling the §9 demo story (farm 78/Monitoring, S2/INV3 flagged, STR2 soiling ramp P017–P019, P042 hotspot, P063 61% failure prediction)** — Accepted.
- 2026-07-16 — **Contract extension: `POST /webhook/maintenance/done` for the Maintenance Planner checkbox** — spec §5.6 requires the action but §3.1 defines no endpoint; extension documented in README; n8n side must implement or the checkbox errors visibly — Accepted (flag to pipeline owner).
- 2026-07-16 — **Alert actions: acknowledge only; "resolve" renders as read-only status** — no resolve endpoint exists in the spec contract; deferred until n8n exposes one — Accepted.
- 2026-07-16 — **CI/CD: GitHub Actions (`.github/workflows/ci-cd.yml`) — build+typecheck on every push/PR, Netlify prod deploy on `main` via netlify-cli, gated on `NETLIFY_AUTH_TOKEN`/`NETLIFY_SITE_ID` repo secrets (skips with warning when absent, so it coexists with Netlify native Git integration)** — Netlify CLI was unauthenticated locally, so site creation + secrets are a one-time human step (documented in README) — Accepted.
