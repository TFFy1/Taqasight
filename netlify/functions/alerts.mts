// GET /api/alerts?status= — alert log from the published payload, with
// acknowledgements overlaid from Netlify Blobs so acks persist.
import { getStore } from "@netlify/blobs";

interface AlertRow {
  alertId: string;
  status: string;
  [k: string]: unknown;
}

export default async (req: Request) => {
  const base = process.env.URL;
  if (!base) return Response.json({ error: "site URL unavailable" }, { status: 500 });

  let alerts: AlertRow[] = [];
  try {
    const res = await fetch(`${base}/manual-payload.json`);
    if (res.ok) alerts = ((await res.json()).alerts ?? []) as AlertRow[];
  } catch {
    return Response.json({ error: "payload unavailable" }, { status: 502 });
  }

  // Acks are best-effort: if Blobs is unavailable the log still serves.
  try {
    const stored = await getStore("alert-state").get("acked");
    const acked = new Set<string>(JSON.parse(stored ?? "[]"));
    alerts = alerts.map((a) =>
      acked.has(a.alertId) && a.status === "open" ? { ...a, status: "acknowledged" } : a,
    );
  } catch {
    /* state layer down — serve unmodified log */
  }

  const status = new URL(req.url).searchParams.get("status");
  const list = status ? alerts.filter((a) => a.status === status) : alerts;
  return new Response(JSON.stringify(list), {
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
};

export const config = { path: "/api/alerts" };
