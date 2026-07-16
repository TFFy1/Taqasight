import type { z } from "zod";
import {
  ackResponseSchema,
  alertsResponseSchema,
  historyResponseSchema,
  payloadSchema,
  type Alert,
  type AlertStatus,
  type DashboardPayload,
  type HistoryResponse,
} from "@/types/payload";

/**
 * The only place the dashboard talks to the network. All URLs are built from
 * VITE_API_BASE (default /api — netlify.toml proxies /api/* to the n8n host).
 * With ?mock=1 in the URL, every endpoint is served by the mock/ folder; mock
 * responses run through the exact same zod validation as live ones.
 */
export const API_BASE: string = import.meta.env.VITE_API_BASE ?? "/api";

export function isMockMode(): boolean {
  return new URLSearchParams(window.location.search).get("mock") === "1";
}

const mockMod = () => import("../../mock");

export type ApiErrorKind = "network" | "http" | "contract";

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly detail?: string;

  constructor(kind: ApiErrorKind, message: string, opts?: { status?: number; detail?: string }) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = opts?.status;
    this.detail = opts?.detail;
  }
}

const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 500;
/** Async analyze: how long we poll /latest for a fresh runId, and how often. */
const ANALYZE_TIMEOUT_MS = 180_000;
const ANALYZE_POLL_MS = 5_000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(
  path: string,
  init?: RequestInit,
  opts?: { allowNonJson?: boolean },
): Promise<unknown> {
  let lastError = new ApiError("network", "Pipeline unreachable");
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      await sleep(BASE_BACKOFF_MS * 2 ** (attempt - 1) + Math.random() * 250);
    }
    let res: Response;
    try {
      res = await fetch(path, {
        ...init,
        headers: { Accept: "application/json", ...init?.headers },
      });
    } catch {
      lastError = new ApiError("network", "Pipeline unreachable — network request failed");
      continue;
    }
    if (res.ok) {
      try {
        return await res.json();
      } catch {
        if (opts?.allowNonJson) return undefined;
        throw new ApiError("contract", "Pipeline returned a non-JSON response");
      }
    }
    lastError = new ApiError("http", `Pipeline responded ${res.status}`, { status: res.status });
    // Client errors won't heal on retry; server errors and throttling might.
    if (res.status < 500 && res.status !== 429) throw lastError;
  }
  throw lastError;
}

function validate<S extends z.ZodType>(schema: S, raw: unknown, endpoint: string): z.output<S> {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new ApiError("contract", `Data contract mismatch on /${endpoint}`, {
      detail: first ? `${first.path.join(".") || "(root)"}: ${first.message}` : undefined,
    });
  }
  return parsed.data;
}

export type EntityType = "farm" | "station" | "inverter" | "string" | "panel";

export const api = {
  /** GET /webhook/latest — most recent stored payload, no pipeline re-run. */
  async latest(): Promise<DashboardPayload> {
    const raw = isMockMode()
      ? await (await mockMod()).mockLatest()
      : await fetchJson(`${API_BASE}/latest`);
    return validate(payloadSchema, raw, "latest");
  },

  /**
   * POST /webhook/analyze — the Fusion AI trigger acks immediately
   * (RespondType: immediate) and runs the pipeline async; the flow's final
   * node writes the payload to the cache sheet. We poll /latest until a
   * payload with a new runId lands. Mock mode stays synchronous.
   */
  async analyze(currentRunId?: string): Promise<DashboardPayload> {
    if (isMockMode()) {
      const raw = await (await mockMod()).mockAnalyze();
      return validate(payloadSchema, raw, "analyze");
    }
    await fetchJson(
      `${API_BASE}/analyze`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" },
      { allowNonJson: true },
    );
    const deadline = Date.now() + ANALYZE_TIMEOUT_MS;
    let lastError: ApiError | undefined;
    while (Date.now() < deadline) {
      await sleep(ANALYZE_POLL_MS);
      try {
        const fresh = await api.latest();
        if (fresh.runId !== currentRunId) return fresh;
      } catch (err) {
        // /latest may 404 or briefly hold the old row mid-run; keep polling.
        lastError = err instanceof ApiError ? err : lastError;
      }
    }
    throw new ApiError(
      "http",
      "Run started, but no fresh payload appeared on /latest before timing out",
      { detail: lastError?.message ?? "Is the latest webhook live and the cache sheet written?" },
    );
  },

  /** GET /webhook/history?entity=&id=&days= — time-series KPIs per entity. */
  async history(entityType: EntityType, id: string, days = 7): Promise<HistoryResponse> {
    const raw = isMockMode()
      ? await (await mockMod()).mockHistory(entityType, id, days)
      : await fetchJson(
          `${API_BASE}/history?entity=${encodeURIComponent(entityType)}&id=${encodeURIComponent(id)}&days=${days}`,
        );
    return validate(historyResponseSchema, raw, "history");
  },

  /** GET /webhook/alerts?status= — alert log. */
  async alerts(status?: AlertStatus): Promise<Alert[]> {
    const raw = isMockMode()
      ? await (await mockMod()).mockAlerts(status)
      : await fetchJson(`${API_BASE}/alerts${status ? `?status=${encodeURIComponent(status)}` : ""}`);
    return validate(alertsResponseSchema, raw, "alerts");
  },

  /** POST /webhook/alerts/ack — acknowledge one alert. */
  async ackAlert(alertId: string, user: string): Promise<void> {
    const raw = isMockMode()
      ? await (await mockMod()).mockAckAlert(alertId)
      : await fetchJson(`${API_BASE}/alerts/ack`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ alertId, user }),
        });
    validate(ackResponseSchema, raw, "alerts/ack");
  },

  /**
   * POST /webhook/maintenance/done — mark a plan item completed.
   * Contract extension beyond spec §3.1 (documented in CLAUDE_DOCS).
   */
  async maintenanceDone(entityId: string, priority: number, user: string): Promise<void> {
    const raw = isMockMode()
      ? await (await mockMod()).mockMaintenanceDone(entityId)
      : await fetchJson(`${API_BASE}/maintenance/done`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entityId, priority, user }),
        });
    validate(ackResponseSchema, raw, "maintenance/done");
  },
};
