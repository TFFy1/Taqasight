import { seededRand } from "./payload";

/**
 * Deterministic per-entity KPI history for GET /history in mock mode.
 * Story entities get authored anchor series (matching the payload trends);
 * everything else gets a stable flat-ish series derived from its id.
 */

type MetricSeries = Partial<
  Record<"pr" | "inverterEff_pct" | "temp_C" | "soilingIndex" | "energy_kWh" | "healthScore" | "failureProb_pct", number[]>
>;

/** 7-point anchor series per story entity; other ids fall back to generated. */
const STORY: Record<string, MetricSeries> = {
  farm: {
    healthScore: [82, 81, 80, 79, 77, 78, 78],
    pr: [0.9, 0.89, 0.89, 0.88, 0.86, 0.87, 0.87],
    energy_kWh: [238.1, 236.4, 234.9, 231.2, 226.8, 227.5, 228.4],
    soilingIndex: [0.11, 0.11, 0.12, 0.12, 0.13, 0.14, 0.14],
    inverterEff_pct: [95.8, 95.7, 95.6, 95.4, 95.0, 95.1, 95.1],
  },
  S2: {
    pr: [0.88, 0.87, 0.86, 0.85, 0.83, 0.82, 0.81],
    healthScore: [78, 76, 74, 72, 69, 67, 66],
    inverterEff_pct: [94.6, 94.2, 93.8, 93.4, 93.1, 93.0, 92.9],
  },
  INV3: {
    inverterEff_pct: [94.5, 94.1, 93.5, 92.8, 92.1, 91.7, 91.4],
    pr: [0.86, 0.85, 0.84, 0.82, 0.81, 0.8, 0.79],
  },
  STR5: {
    pr: [0.86, 0.85, 0.83, 0.82, 0.81, 0.8, 0.79],
  },
  STR2: {
    pr: [0.88, 0.87, 0.86, 0.84, 0.83, 0.81, 0.8],
    soilingIndex: [0.12, 0.18, 0.29, 0.44, 0.58, 0.71, 0.82],
  },
  P042: {
    pr: [0.86, 0.85, 0.84, 0.82, 0.79, 0.75, 0.71],
    temp_C: [45.1, 46.8, 49.2, 52.6, 56.9, 60.8, 63.5],
    soilingIndex: [0.11, 0.11, 0.12, 0.12, 0.12, 0.12, 0.12],
    energy_kWh: [1.9, 1.85, 1.8, 1.7, 1.55, 1.4, 1.2],
    healthScore: [72, 66, 59, 52, 45, 38, 31],
    failureProb_pct: [22, 29, 38, 47, 58, 67, 74],
  },
  P063: {
    pr: [0.85, 0.84, 0.82, 0.8, 0.78, 0.76, 0.74],
    temp_C: [44.9, 45.4, 45.8, 46.2, 46.6, 46.9, 47.1],
    soilingIndex: [0.15, 0.15, 0.16, 0.16, 0.17, 0.18, 0.18],
    energy_kWh: [1.88, 1.84, 1.78, 1.72, 1.66, 1.6, 1.55],
    healthScore: [76, 73, 69, 65, 61, 58, 55],
    failureProb_pct: [18, 24, 31, 39, 47, 54, 61],
  },
  P018: {
    pr: [0.88, 0.87, 0.85, 0.83, 0.81, 0.79, 0.78],
    temp_C: [44.8, 45.0, 45.1, 45.2, 45.2, 45.3, 45.3],
    soilingIndex: [0.12, 0.18, 0.3, 0.45, 0.6, 0.73, 0.82],
    energy_kWh: [1.92, 1.89, 1.83, 1.77, 1.7, 1.64, 1.6],
    healthScore: [88, 84, 79, 73, 68, 62, 58],
  },
};

/** Resize an anchor series to `days` points (pad front / slice tail). */
function fit(series: number[], days: number): number[] {
  if (days <= series.length) return series.slice(series.length - days);
  const first = series[0];
  return [...Array.from({ length: days - series.length }, () => first), ...series];
}

function generated(id: string, metric: string, days: number, base: number, spread: number): number[] {
  return Array.from({ length: days }, (_, i) => {
    const wobble = (seededRand(`${id}:${metric}:${i}`) - 0.5) * spread;
    return Number((base + wobble).toFixed(3));
  });
}

function defaultSeries(entityType: string, id: string, days: number): MetricSeries {
  const bias = seededRand(id) * 0.04;
  const common: MetricSeries = {
    pr: generated(id, "pr", days, 0.88 - bias, 0.02),
    temp_C: generated(id, "temp", days, 44 + bias * 100, 2.4),
    soilingIndex: generated(id, "soil", days, 0.1 + bias, 0.03),
    energy_kWh: generated(id, "energy", days, 1.9 - bias * 4, 0.12),
    healthScore: generated(id, "health", days, 91 - bias * 150, 4).map(Math.round),
  };
  if (entityType === "inverter") {
    common.inverterEff_pct = generated(id, "eff", days, 95.6 - bias * 20, 0.5);
  }
  return common;
}

export function buildMockHistory(entityType: string, id: string, days: number) {
  const now = Date.now();
  const authored = STORY[id];
  const metrics: MetricSeries = { ...defaultSeries(entityType, id, days) };
  if (authored) {
    for (const [k, v] of Object.entries(authored)) {
      metrics[k as keyof MetricSeries] = fit(v, days);
    }
  }
  const points = Array.from({ length: days }, (_, i) => {
    const ts = new Date(now - (days - 1 - i) * 24 * 3600_000).toISOString();
    const point: Record<string, number | string> = { ts };
    for (const [metric, values] of Object.entries(metrics)) {
      if (values && values[i] !== undefined) point[metric] = values[i];
    }
    return point;
  });
  return { entityType, entityId: id, days, points };
}
