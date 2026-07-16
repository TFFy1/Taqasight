import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, Loader2, Sparkles, Zap } from "lucide-react";
import { useMaintenanceDone, usePayload } from "@/lib/queries";
import { Card, EmptyState, ErrorState, SectionTitle, Skeleton, cx } from "@/components/ui";
import { fmtNum } from "@/lib/format";
import type { MaintenanceItem } from "@/types/payload";

const TYPE_TINT: Record<string, string> = {
  corrective: "bg-crit/15 text-crit",
  preventive: "bg-info/15 text-info",
};

function entityLink(entityId: string): string {
  if (/^P\d/i.test(entityId)) return `/panel/${entityId}`;
  if (/^(STR|INV)/i.test(entityId)) return "/stations";
  return "/map";
}

function PlanItem({ item }: { item: MaintenanceItem }) {
  const done = useMaintenanceDone();
  const [checked, setChecked] = useState(false);
  const isDone = checked && done.isSuccess;

  return (
    <Card
      className={cx(
        "flex items-start gap-4 p-4 transition-opacity",
        isDone && "opacity-50",
      )}
    >
      <span
        className={cx(
          "grid size-9 shrink-0 place-items-center rounded-full font-display text-sm font-bold",
          item.priority === 1
            ? "bg-crit/20 text-crit"
            : item.priority === 2
              ? "bg-warn/20 text-warn"
              : "bg-surface-2 text-text-mid",
        )}
        aria-label={`Priority ${fmtNum(item.priority, 0)}`}
      >
        {fmtNum(item.priority, 0)}
      </span>

      <div className="min-w-0 flex-1">
        <p className={cx("text-sm font-semibold", isDone && "line-through")}>{item.action}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
          <Link
            to={entityLink(item.entityId)}
            className="rounded-full bg-surface-2 px-2 py-0.5 font-mono font-semibold text-accent-2 hover:underline"
          >
            {item.entityId}
          </Link>
          {item.type ? (
            <span className={cx("rounded-full px-2 py-0.5 font-medium", TYPE_TINT[item.type])}>
              {item.type}
            </span>
          ) : null}
          {item.deadline ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 font-medium text-text-mid">
              <CalendarClock className="size-3" aria-hidden />
              {item.deadline}
            </span>
          ) : null}
          {item.estimatedGain_kWh_day !== undefined ? (
            <span className="inline-flex items-center gap-1 font-semibold text-ok tabular">
              <Zap className="size-3" aria-hidden />+{fmtNum(item.estimatedGain_kWh_day)} kWh/day
            </span>
          ) : null}
        </div>
        {item.rationale ? (
          <p className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-text-mid">
            <Sparkles className="mt-0.5 size-3 shrink-0 text-accent-2" aria-hidden />
            <span>
              <span className="font-medium text-accent-2">AI rationale: </span>
              {item.rationale}
            </span>
          </p>
        ) : null}
        {done.isError ? (
          <p className="mt-1.5 text-[11px] text-crit" role="alert">
            Could not record completion — {done.error.message}
          </p>
        ) : null}
      </div>

      <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs text-text-mid">
        {done.isPending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
        <input
          type="checkbox"
          checked={checked}
          disabled={done.isPending || isDone}
          onChange={(e) => {
            setChecked(e.target.checked);
            if (e.target.checked) {
              done.mutate({ entityId: item.entityId, priority: item.priority });
            }
          }}
          className="size-4 cursor-pointer accent-[#3ECF8E]"
          aria-label={`Mark ${item.entityId} task done`}
        />
        Done
      </label>
    </Card>
  );
}

export function Maintenance() {
  const { data, isPending, isError, error, refetch } = usePayload();

  if (isPending) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading maintenance plan">
        <Skeleton className="h-8 w-1/2" />
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }
  if (isError && !data) {
    return (
      <ErrorState
        title="Pipeline unreachable — maintenance plan unavailable."
        detail={error.message}
        onRetry={() => void refetch()}
      />
    );
  }
  const plan = [...(data?.maintenancePlan ?? [])].sort((a, b) => a.priority - b.priority);
  if (plan.length === 0) {
    return (
      <EmptyState
        title="No maintenance actions in this run"
        hint="The prioritization stage found nothing worth dispatching."
      />
    );
  }

  const totalGain = plan.reduce((sum, p) => sum + (p.estimatedGain_kWh_day ?? 0), 0);

  return (
    <div className="space-y-5">
      <SectionTitle hint={`≈ ${fmtNum(totalGain)} kWh/day recoverable across ${plan.length} actions`}>
        Maintenance planner
      </SectionTitle>
      <div className="space-y-3">
        {plan.map((item) => (
          <PlanItem key={`${item.priority}-${item.entityId}`} item={item} />
        ))}
      </div>
    </div>
  );
}
