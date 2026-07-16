import { palette } from "@/styles/tokens";
import type { AlertSeverity } from "@/types/payload";

export type HealthStatus =
  | "healthy"
  | "monitoring"
  | "warning"
  | "critical"
  | "offline"
  | "unknown";

const KNOWN: HealthStatus[] = ["healthy", "monitoring", "warning", "critical", "offline"];

/** Pipeline sends status labels in mixed case ("Monitoring", "healthy"). */
export function normalizeStatus(s: string | undefined): HealthStatus {
  const v = s?.toLowerCase().trim() as HealthStatus | undefined;
  return v && KNOWN.includes(v) ? v : "unknown";
}

export interface StatusMeta {
  label: string;
  /** Tailwind text color class */
  text: string;
  /** Tailwind bg class for fills/chips */
  fill: string;
  /** Concrete hex for SVG/chart use */
  hex: string;
}

export const STATUS_META: Record<HealthStatus, StatusMeta> = {
  healthy: { label: "Healthy", text: "text-ok", fill: "bg-ok", hex: palette.ok },
  monitoring: { label: "Monitoring", text: "text-info", fill: "bg-info", hex: palette.info },
  warning: { label: "Warning", text: "text-warn", fill: "bg-warn", hex: palette.warn },
  critical: { label: "Critical", text: "text-crit", fill: "bg-crit", hex: palette.crit },
  offline: { label: "Offline", text: "text-offline", fill: "bg-offline", hex: palette.offline },
  unknown: { label: "Unknown", text: "text-text-low", fill: "bg-text-low", hex: palette.text3 },
};

export function statusMeta(s: string | undefined): StatusMeta {
  return STATUS_META[normalizeStatus(s)];
}

/**
 * Display banding for a pipeline-provided 0–100 health score when no status
 * label accompanies it (display categorization, not computation).
 */
export function healthBand(score: number | undefined): HealthStatus {
  if (score === undefined || !Number.isFinite(score)) return "unknown";
  if (score >= 85) return "healthy";
  if (score >= 70) return "monitoring";
  if (score >= 50) return "warning";
  return "critical";
}

export const SEVERITY_META: Record<AlertSeverity, StatusMeta> = {
  critical: STATUS_META.critical,
  warning: STATUS_META.warning,
  info: STATUS_META.monitoring,
};
