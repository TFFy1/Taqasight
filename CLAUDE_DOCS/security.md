# Solar Fleet Console — Security Reference

> Read before touching any Netlify Function, the Fusion AI integration, or anything that handles client installation data.
> These are not suggestions — they are requirements.

---

## Secret & Key Handling

- Fusion AI credentials exist only as **Netlify environment variables**, read only inside Functions. Never in Vite env (`VITE_*` vars ship to the browser — this is the footgun), never in the repo, never in logs.
- The browser must never be able to reach Fusion AI directly. Every AI call is proxied by a Function.
- Never-commit list: `.env`, `.env.*`, any key material, any real client installation export.

## Input Validation

- Library: **zod**, `safeParse` → structured 400 on failure. Every Function validates: query params, body, and headers it depends on.
- Numeric clamps on anything used in loops or queries (e.g. date ranges, panel counts). Max-length caps on all strings as a DoS control.

## AI Output Is Untrusted Input

- Fusion AI responses are validated with zod like any external input. Missing/extra fields → handled, never crashed on.
- Recommendation and trend-explanation text is **display-only**: rendered as plain text, never `dangerouslySetInnerHTML`, never interpolated into further prompts or requests without sanitization, never executed.
- If AI text could contain client-identifying data, do not log it.

## Errors & Logging

- Functions return sanitized error shapes (`{ error: string, code }`); internal stack traces and upstream error bodies never reach the client.
- Never log secrets, tokens, or client-identifying installation data.

## Cost & Rate Control

- Every Function that triggers a Fusion AI call is debounced/rate-limited (key on installation id). A polling bug must not become a billing incident. Default restrictive; loosen only with data.

## Multi-Tenancy (B2B2C)

- Every data access is scoped by `installationId`, and once auth exists: **auth ≠ authorization** — verify the session owns that installation before returning anything; never trust an id from the query string as proof of ownership.
- **Open item (task):** auth is not yet designed. Until it is, treat all installation data as demo/simulated only — no real client data enters the system before the ownership check exists. Orchestrator records the auth design in `decisions.md` when made.

## Common Mistakes — Do Not Repeat

- Putting a key in a `VITE_`-prefixed env var.
- Rendering AI text as HTML/markdown with raw injection.
- Calling Fusion AI from a `useEffect` on every render.

---

## Change Log
- 2026-07-16 00:00 UTC — Doc seeded from product intent (greenfield) — claud-md-builder
