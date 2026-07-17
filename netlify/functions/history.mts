// GET /api/history?entity=&id=&days= — deterministic per-entity KPI series
// consistent with the demo payload story (same generator as mock mode).
import { buildMockHistory } from "../../mock/history";

export default async (req: Request) => {
  const params = new URL(req.url).searchParams;
  const entity = params.get("entity") ?? "panel";
  const id = params.get("id");
  const days = Math.min(90, Math.max(2, Number(params.get("days") ?? 7) || 7));
  if (!id) {
    return Response.json({ error: "id query param required" }, { status: 400 });
  }
  return new Response(JSON.stringify(buildMockHistory(entity, id, days)), {
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
};

export const config = { path: "/api/history" };
