import { useMemo, useState } from "react";
import { useAlerts } from "@/lib/queries";
import { AlertItem } from "@/components/AlertItem";
import { EmptyState, ErrorState, SectionTitle, Skeleton, cx } from "@/components/ui";
import type { Alert, AlertSeverity, AlertStatus } from "@/types/payload";

type StatusFilter = AlertStatus | "all";
type SeverityFilter = AlertSeverity | "all";

const STATUS_OPTIONS: StatusFilter[] = ["all", "open", "acknowledged", "resolved"];
const SEVERITY_OPTIONS: SeverityFilter[] = ["all", "critical", "warning", "info"];

interface AlertGroup {
  latest: Alert;
  count: number;
}

/**
 * Alert-throttling awareness: repeats of the same rule on the same entity are
 * grouped into one row (latest occurrence shown with a ×N badge) instead of
 * stacking duplicates.
 */
function groupAlerts(alerts: Alert[]): AlertGroup[] {
  const byKey = new Map<string, Alert[]>();
  for (const a of alerts) {
    const key = `${a.rule ?? a.alertId}|${a.entityId ?? ""}|${a.status}`;
    byKey.set(key, [...(byKey.get(key) ?? []), a]);
  }
  return [...byKey.values()]
    .map((group) => {
      const sorted = [...group].sort((a, b) => (b.ts ?? "").localeCompare(a.ts ?? ""));
      return { latest: sorted[0], count: group.length };
    })
    .sort((a, b) => (b.latest.ts ?? "").localeCompare(a.latest.ts ?? ""));
}

function FilterChips<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={label}>
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          aria-pressed={value === opt}
          className={cx(
            "cursor-pointer rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors",
            value === opt
              ? "border-accent-2 bg-accent/20 text-text-hi"
              : "border-line/60 bg-surface text-text-mid hover:border-accent-2/50",
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export function AlertsCenter() {
  const { data, isPending, isError, error, refetch } = useAlerts();
  const [status, setStatus] = useState<StatusFilter>("open");
  const [severity, setSeverity] = useState<SeverityFilter>("all");

  const groups = useMemo(() => {
    const filtered = (data ?? []).filter(
      (a) =>
        (status === "all" || a.status === status) &&
        (severity === "all" || a.severity === severity),
    );
    return groupAlerts(filtered);
  }, [data, status, severity]);

  const openCount = data?.filter((a) => a.status === "open").length ?? 0;

  if (isPending) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading alerts">
        <Skeleton className="h-8 w-1/2" />
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-14" />
        ))}
      </div>
    );
  }
  if (isError) {
    return (
      <ErrorState
        title="Alert log unavailable — pipeline unreachable."
        detail={error.message}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="space-y-5">
      <SectionTitle
        hint={`${openCount} open across the farm`}
      >
        Alerts center
      </SectionTitle>
      <p className="sr-only" aria-live="polite">
        {openCount} open alerts
      </p>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <FilterChips options={STATUS_OPTIONS} value={status} onChange={setStatus} label="Status" />
        <span className="h-4 w-px bg-line" aria-hidden />
        <FilterChips
          options={SEVERITY_OPTIONS}
          value={severity}
          onChange={setSeverity}
          label="Severity"
        />
      </div>

      {groups.length === 0 ? (
        <EmptyState
          title="No alerts match these filters"
          hint={status === "open" ? "Nothing needs attention right now." : undefined}
        />
      ) : (
        <div className="space-y-2">
          {groups.map((g) => (
            <AlertItem key={g.latest.alertId} alert={g.latest} count={g.count} />
          ))}
        </div>
      )}
    </div>
  );
}
