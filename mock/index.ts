import { buildMockPayload } from "./payload";
import { buildMockHistory } from "./history";

/**
 * In-memory mock adapter for the five n8n endpoints (?mock=1).
 * Returns raw unknown JSON — the api layer validates it through the same zod
 * schemas as live responses, so mock mode also proves the contract.
 */

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface MockAlert {
  alertId: string;
  status: string;
  [k: string]: unknown;
}

let payload = buildMockPayload();
// Session-local alert state so acknowledgements persist across refetches.
let alertStore: MockAlert[] = payload.alerts.map((a) => ({ ...a }));

function currentPayload() {
  return { ...payload, alerts: alertStore.map((a) => ({ ...a })) };
}

export async function mockLatest(): Promise<unknown> {
  await delay(450);
  return currentPayload();
}

export async function mockAnalyze(): Promise<unknown> {
  // A real pipeline run takes a while — long enough to show progress states.
  await delay(3200);
  payload = buildMockPayload();
  const known = new Map(alertStore.map((a) => [a.alertId, a]));
  alertStore = payload.alerts.map((a) => {
    const prev = known.get(a.alertId);
    return prev ? { ...a, status: prev.status } : { ...a };
  });
  return currentPayload();
}

export async function mockHistory(entityType: string, id: string, days: number): Promise<unknown> {
  await delay(500);
  return buildMockHistory(entityType, id, days);
}

export async function mockAlerts(status?: string): Promise<unknown> {
  await delay(350);
  const list = status ? alertStore.filter((a) => a.status === status) : alertStore;
  return list.map((a) => ({ ...a }));
}

export async function mockMaintenanceDone(entityId: string): Promise<unknown> {
  await delay(300);
  return { ok: true, entityId };
}

export async function mockAckAlert(alertId: string): Promise<unknown> {
  await delay(300);
  const found = alertStore.find((a) => a.alertId === alertId);
  if (!found) throw Object.assign(new Error("alert not found"), { status: 404 });
  found.status = "acknowledged";
  return { ok: true, alertId };
}
