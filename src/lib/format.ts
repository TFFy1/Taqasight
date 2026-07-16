/**
 * Display formatting only — derived presentation (deltas between two received
 * numbers, ratios to percent) is allowed; engineering math is not.
 */

export const MISSING = "—";
export const MISSING_HINT = "not provided by pipeline";

export function fmtNum(v: number | undefined | null, digits = 1): string {
  if (v === undefined || v === null || !Number.isFinite(v)) return MISSING;
  return v.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function fmtInt(v: number | undefined | null): string {
  return fmtNum(v, 0);
}

/** Ratio (0–1) rendered as a percentage, e.g. 0.87 → "87%". */
export function fmtRatioPct(v: number | undefined | null, digits = 0): string {
  if (v === undefined || v === null || !Number.isFinite(v)) return MISSING;
  return `${fmtNum(v * 100, digits)}%`;
}

export function fmtPct(v: number | undefined | null, digits = 1): string {
  if (v === undefined || v === null || !Number.isFinite(v)) return MISSING;
  return `${fmtNum(v, digits)}%`;
}

export interface Delta {
  pct: number;
  dir: "up" | "down" | "flat";
}

/** % change between the last two values of a received trend series. */
export function seriesDelta(series: number[] | undefined): Delta | undefined {
  if (!series || series.length < 2) return undefined;
  const prev = series[series.length - 2];
  const curr = series[series.length - 1];
  if (!Number.isFinite(prev) || !Number.isFinite(curr) || prev === 0) return undefined;
  const pct = ((curr - prev) / Math.abs(prev)) * 100;
  return { pct, dir: pct > 0.05 ? "up" : pct < -0.05 ? "down" : "flat" };
}

export function fmtDateTime(ts: string | undefined): string {
  if (!ts) return MISSING;
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return MISSING;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(ts: string | undefined): string {
  if (!ts) return MISSING;
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return MISSING;
  const s = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.floor(h / 24)} d ago`;
}
