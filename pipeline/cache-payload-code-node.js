// Fusion AI workflow — Code node: normalize the AI agent's response into the
// AI Dashboard Payload (contract: src/types/payload.ts) and emit one row for
// the payload-cache Google Sheet (columns: runId | generatedAt | payload).
//
// Place: AI agent node -> THIS node -> Google Sheets "Append Row".
// The first line is n8n-style input access; adapt if the platform differs.

const raw = $input.first().json;

// 1) Locate the AI output across common wrapper shapes.
let ai = raw.output ?? raw.text ?? raw.response ?? raw.content ?? raw;

// 2) LLMs often return JSON as fenced text — strip fences and parse.
if (typeof ai === "string") {
  const cleaned = ai
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "");
  try {
    ai = JSON.parse(cleaned);
  } catch (e) {
    throw new Error(
      "AI response is not valid JSON: " + e.message + " | starts with: " + cleaned.slice(0, 120),
    );
  }
}

// 3) Guarantee the contract's required top-level shape; never invent KPIs —
//    missing sections stay empty and the dashboard renders them as absent.
const now = new Date().toISOString();
const payload = {
  runId: ai.runId ?? now + "-" + Math.random().toString(16).slice(2, 6),
  generatedAt: ai.generatedAt ?? now,
  payloadVersion: ai.payloadVersion ?? "1.0.0",
  farm: ai.farm ?? {},
  stations: ai.stations ?? [],
  alerts: ai.alerts ?? [],
  criticalPanels: ai.criticalPanels ?? [],
  maintenancePlan: ai.maintenancePlan ?? [],
  aiInsights: ai.aiInsights,
  map: ai.map ?? [],
};

if (typeof payload.farm !== "object" || Array.isArray(payload.farm)) {
  throw new Error("payload.farm must be an object");
}
for (const key of ["stations", "alerts", "criticalPanels", "maintenancePlan", "map"]) {
  if (!Array.isArray(payload[key])) {
    throw new Error("payload." + key + " must be an array");
  }
}

// 4) One cache-sheet row per run; payload serialized into a single cell.
return [
  {
    json: {
      runId: payload.runId,
      generatedAt: payload.generatedAt,
      payload: JSON.stringify(payload),
    },
  },
];
