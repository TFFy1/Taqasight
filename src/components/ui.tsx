import type { ReactNode } from "react";
import { CircleSlash2, RefreshCw, SearchX } from "lucide-react";
import { fmtPct, MISSING, MISSING_HINT } from "@/lib/format";

export function cx(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cx("rounded-card border border-line/40 bg-surface shadow-card", className)}>
      {children}
    </div>
  );
}

export function SectionTitle({
  children,
  hint,
  className,
}: {
  children: ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cx("mb-3 flex items-baseline justify-between gap-3", className)}>
      <h2 className="font-display text-sm font-semibold tracking-wide text-text-mid uppercase">
        {children}
      </h2>
      {hint ? <span className="text-xs text-text-low">{hint}</span> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-md bg-surface-2/70", className)} aria-hidden />;
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <SearchX className="size-6 text-text-low" aria-hidden />
      <p className="text-sm font-medium text-text-mid">{title}</p>
      {hint ? <p className="max-w-sm text-xs text-text-low">{hint}</p> : null}
    </div>
  );
}

export function ErrorState({
  title,
  detail,
  onRetry,
}: {
  title: string;
  detail?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center" role="alert">
      <CircleSlash2 className="size-6 text-crit" aria-hidden />
      <p className="text-sm font-medium text-text-hi">{title}</p>
      {detail ? <p className="max-w-sm text-xs text-text-low">{detail}</p> : null}
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-line bg-surface-2 px-3 py-1.5 text-xs font-medium text-text-hi transition-colors hover:border-accent-2"
        >
          <RefreshCw className="size-3.5" aria-hidden />
          Retry
        </button>
      ) : null}
    </div>
  );
}

/** Explicit "not provided by pipeline" marker — never render invented data. */
export function Missing() {
  return (
    <span className="cursor-help text-text-low" title={MISSING_HINT}>
      {MISSING}
    </span>
  );
}

const LEVEL_CLASSES: Record<"impact" | "effort", Record<string, string>> = {
  impact: {
    high: "bg-amber/15 text-amber",
    medium: "bg-info/15 text-info",
    low: "bg-text-low/15 text-text-low",
  },
  effort: {
    low: "bg-ok/15 text-ok",
    medium: "bg-info/15 text-info",
    high: "bg-crit/15 text-crit",
  },
};

export function LevelBadge({
  kind,
  level,
}: {
  kind: "impact" | "effort";
  level: "high" | "medium" | "low" | undefined;
}) {
  if (!level) return null;
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        LEVEL_CLASSES[kind][level],
      )}
    >
      {kind} · {level}
    </span>
  );
}

/** Probability meter (failure risk) — color banded, value always visible. */
export function ProbBar({ pct, label = "Failure probability" }: { pct: number | undefined; label?: string }) {
  if (pct === undefined || !Number.isFinite(pct)) return <Missing />;
  const clamped = Math.min(100, Math.max(0, pct));
  const band = clamped >= 70 ? "bg-crit" : clamped >= 40 ? "bg-warn" : "bg-ok";
  return (
    <div className="flex w-full items-center gap-2">
      <div
        className="h-1.5 min-w-16 flex-1 overflow-hidden rounded-full bg-surface-2"
        role="meter"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label} ${fmtPct(clamped, 0)}`}
      >
        <div className={`h-full rounded-full ${band}`} style={{ width: `${clamped}%` }} />
      </div>
      <span className="shrink-0 text-xs font-semibold tabular">{fmtPct(pct, 0)}</span>
    </div>
  );
}
