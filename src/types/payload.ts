import { z } from "zod";

/**
 * Single source of truth for the AI Dashboard Payload contract (spec §4).
 * Any change here is a documented version bump — update PAYLOAD_VERSION and
 * CLAUDE_DOCS/architecture.md together.
 *
 * Guardrail: fields the pipeline may omit are optional; the UI renders "—"
 * for them. The frontend never invents or corrects values.
 */
export const PAYLOAD_VERSION = "1.0.0";

const finite = z.number().finite();
const series = z.array(finite);

/** Trend keys are pipeline-defined (e.g. healthScore7d, pr7d) — keep open. */
const trendSchema = z.record(z.string(), series);

export const farmKpisSchema = z.object({
  avgPerformanceRatio: finite.optional(),
  avgInverterEff_pct: finite.optional(),
  avgPanelTemp_C: finite.optional(),
  avgSoilingIndex: finite.optional(),
  totalACPower_kW: finite.optional(),
  totalDailyEnergy_kWh: finite.optional(),
  selfSufficiency_pct: finite.optional(),
  gridDependency_pct: finite.optional(),
});

export const farmSchema = z.object({
  healthScore: finite.optional(),
  status: z.string().optional(),
  kpis: farmKpisSchema.optional(),
  trend: trendSchema.optional(),
});

export const stringSchema = z.object({
  stringId: z.string(),
  avgPR: finite.optional(),
  imbalance_pct: finite.optional(),
});

export const inverterSchema = z.object({
  inverterId: z.string(),
  avgEff_pct: finite.optional(),
  status: z.string().optional(),
  strings: z.array(stringSchema).default([]),
});

export const stationSchema = z.object({
  stationId: z.string(),
  healthScore: finite.optional(),
  status: z.string().optional(),
  kpis: z
    .object({
      avgPR: finite.optional(),
      avgInverterEff_pct: finite.optional(),
      avgSoilingIndex: finite.optional(),
    })
    .optional(),
  trend: trendSchema.optional(),
  inverters: z.array(inverterSchema).default([]),
});

export const alertSeveritySchema = z.enum(["critical", "warning", "info"]);
export const alertStatusSchema = z.enum(["open", "acknowledged", "resolved"]);

export const alertSchema = z.object({
  alertId: z.string(),
  severity: alertSeveritySchema,
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  rule: z.string().optional(),
  value: finite.optional(),
  message: z.string().optional(),
  ts: z.string().optional(),
  status: alertStatusSchema.default("open"),
});

export const criticalPanelSchema = z.object({
  panelId: z.string(),
  stationId: z.string().optional(),
  inverterId: z.string().optional(),
  stringId: z.string().optional(),
  pr: finite.optional(),
  temp_C: finite.optional(),
  soilingIndex: finite.optional(),
  failureProb_pct: finite.optional(),
  trend: trendSchema.optional(),
});

export const maintenanceItemSchema = z.object({
  priority: finite,
  entityId: z.string(),
  action: z.string(),
  type: z.enum(["corrective", "preventive"]).optional(),
  deadline: z.string().optional(),
  estimatedGain_kWh_day: finite.optional(),
  rationale: z.string().optional(),
});

export const aiInsightsSchema = z.object({
  headline: z.string().optional(),
  summary: z.string().optional(),
  anomalies: z
    .array(
      z.object({
        entityId: z.string(),
        explanation: z.string(),
        confidence: z.enum(["high", "medium", "low"]).optional(),
      }),
    )
    .default([]),
  predictions: z
    .array(
      z.object({
        entityId: z.string(),
        prediction: z.string(),
        failureProb_pct: finite.optional(),
      }),
    )
    .default([]),
  recommendations: z
    .array(
      z.object({
        text: z.string(),
        impact: z.enum(["high", "medium", "low"]).optional(),
        effort: z.enum(["high", "medium", "low"]).optional(),
      }),
    )
    .default([]),
});

export const mapPanelSchema = z.object({
  panelId: z.string(),
  stationId: z.string().optional(),
  inverterId: z.string().optional(),
  stringId: z.string().optional(),
  lat: finite.optional(),
  lng: finite.optional(),
  status: z.string().optional(),
  healthScore: finite.optional(),
});

export const payloadSchema = z.object({
  runId: z.string(),
  generatedAt: z.string(),
  payloadVersion: z.string().optional(),
  farm: farmSchema,
  stations: z.array(stationSchema).default([]),
  alerts: z.array(alertSchema).default([]),
  criticalPanels: z.array(criticalPanelSchema).default([]),
  maintenancePlan: z.array(maintenanceItemSchema).default([]),
  aiInsights: aiInsightsSchema.optional(),
  map: z.array(mapPanelSchema).default([]),
});

/**
 * GET /history response — one point per pipeline run for the requested
 * entity. Documented dashboard-side contract for the n8n SELECT on
 * kpi_history (see CLAUDE_DOCS/architecture.md).
 */
export const historyPointSchema = z.object({
  ts: z.string(),
  pr: finite.optional(),
  inverterEff_pct: finite.optional(),
  temp_C: finite.optional(),
  soilingIndex: finite.optional(),
  energy_kWh: finite.optional(),
  healthScore: finite.optional(),
  failureProb_pct: finite.optional(),
});

export const historyResponseSchema = z.object({
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  days: finite.optional(),
  points: z.array(historyPointSchema).default([]),
});

/** GET /webhook/alerts — accept a bare array or an { alerts: [...] } wrapper. */
export const alertsResponseSchema = z
  .union([z.array(alertSchema), z.object({ alerts: z.array(alertSchema) })])
  .transform((value) => (Array.isArray(value) ? value : value.alerts));

export const ackResponseSchema = z.looseObject({});

export type DashboardPayload = z.infer<typeof payloadSchema>;
export type Farm = z.infer<typeof farmSchema>;
export type FarmKpis = z.infer<typeof farmKpisSchema>;
export type Station = z.infer<typeof stationSchema>;
export type Inverter = z.infer<typeof inverterSchema>;
export type StringUnit = z.infer<typeof stringSchema>;
export type Alert = z.infer<typeof alertSchema>;
export type AlertSeverity = z.infer<typeof alertSeveritySchema>;
export type AlertStatus = z.infer<typeof alertStatusSchema>;
export type CriticalPanel = z.infer<typeof criticalPanelSchema>;
export type MaintenanceItem = z.infer<typeof maintenanceItemSchema>;
export type AiInsights = z.infer<typeof aiInsightsSchema>;
export type MapPanel = z.infer<typeof mapPanelSchema>;
export type HistoryPoint = z.infer<typeof historyPointSchema>;
export type HistoryResponse = z.infer<typeof historyResponseSchema>;
