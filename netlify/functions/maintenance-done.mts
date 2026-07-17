// POST /api/maintenance/done {entityId, priority, user} — acknowledge the
// completion so the planner checkbox resolves; no persistence yet.
export default async (req: Request) => {
  if (req.method !== "POST") {
    return Response.json({ error: "POST only" }, { status: 405 });
  }
  try {
    const body = await req.json();
    return Response.json({ ok: true, entityId: body.entityId ?? null });
  } catch {
    return Response.json({ error: "JSON body required" }, { status: 400 });
  }
};

export const config = { path: "/api/maintenance/done" };
