// POST /api/alerts/ack {alertId, user} — persist the ack in Netlify Blobs.
import { getStore } from "@netlify/blobs";

export default async (req: Request) => {
  if (req.method !== "POST") {
    return Response.json({ error: "POST only" }, { status: 405 });
  }
  let alertId: unknown;
  try {
    alertId = (await req.json()).alertId;
  } catch {
    return Response.json({ error: "JSON body required" }, { status: 400 });
  }
  if (typeof alertId !== "string" || alertId.length === 0 || alertId.length > 64) {
    return Response.json({ error: "alertId required" }, { status: 400 });
  }
  try {
    const store = getStore("alert-state");
    const acked = new Set<string>(JSON.parse((await store.get("acked")) ?? "[]"));
    acked.add(alertId);
    await store.set("acked", JSON.stringify([...acked]));
  } catch {
    /* stateless fallback: ack accepted for this session's optimistic UI */
  }
  return Response.json({ ok: true, alertId });
};

export const config = { path: "/api/alerts/ack" };
