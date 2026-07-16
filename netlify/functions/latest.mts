// GET /api/latest — serves the newest cached AI Dashboard Payload straight
// from the cache Google Sheet. Replaces the second orchestrator workflow.
// The sheet must be shared "Anyone with the link: Viewer"; no keys involved,
// so nothing secret ever reaches this code or the browser.

const SHEET_ID = process.env.CACHE_SHEET_ID ?? "1eylJHRKIsvBiLpfk_qn8i9uSfZc5ZdJp-wnUO58PJfA";
const SHEET_TAB = process.env.CACHE_SHEET_TAB ?? "Sheet1";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

/** Deep-scan any gviz cell structure for payload JSON strings. */
function collectPayloads(value: unknown, found: Record<string, unknown>[], depth = 0): void {
  if (value == null || depth > 8) return;
  if (typeof value === "string") {
    const s = value.trim();
    if (s.startsWith("{") && s.includes('"farm"')) {
      try {
        const o = JSON.parse(s);
        if (o && typeof o === "object" && o.farm !== undefined) found.push(o);
      } catch {
        /* not a payload cell */
      }
    }
    return;
  }
  if (typeof value === "object") {
    for (const v of Object.values(value)) collectPayloads(v, found, depth + 1);
  }
}

export default async () => {
  const url =
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json` +
    `&sheet=${encodeURIComponent(SHEET_TAB)}`;

  let text: string;
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return json({ error: `cache sheet fetch failed (${res.status})` }, 502);
    text = await res.text();
  } catch {
    return json({ error: "cache sheet unreachable" }, 502);
  }

  // gviz wraps JSON in a JS call; a private sheet returns an HTML login page.
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (text.trimStart().startsWith("<") || start === -1 || end <= start) {
    return json(
      { error: "cache sheet not readable — share it as 'Anyone with the link: Viewer'" },
      502,
    );
  }

  let table: unknown;
  try {
    table = JSON.parse(text.slice(start, end + 1));
  } catch {
    return json({ error: "cache sheet returned unparseable data" }, 502);
  }

  const payloads: Record<string, unknown>[] = [];
  collectPayloads(table, payloads);
  if (payloads.length === 0) {
    return json({ error: "cache sheet has no payload rows yet — run an analysis first" }, 404);
  }

  payloads.sort((a, b) =>
    String(a.generatedAt ?? "").localeCompare(String(b.generatedAt ?? "")),
  );
  return json(payloads[payloads.length - 1]);
};

export const config = { path: "/api/latest" };
