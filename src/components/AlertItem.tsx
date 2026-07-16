import { Check, Info, Loader2, OctagonAlert, TriangleAlert, type LucideIcon } from "lucide-react";
import type { Alert } from "@/types/payload";
import { useAckAlert } from "@/lib/queries";
import { timeAgo } from "@/lib/format";
import { cx } from "@/components/ui";

const SEV_ICON: Record<Alert["severity"], LucideIcon> = {
  critical: OctagonAlert,
  warning: TriangleAlert,
  info: Info,
};

const SEV_TINT: Record<Alert["severity"], string> = {
  critical: "text-crit",
  warning: "text-warn",
  info: "text-info",
};

/**
 * One alert row (used by the Overview strip and the Alerts Center).
 * `count` > 1 marks a grouped repeat of the same rule/entity.
 */
export function AlertItem({
  alert,
  count = 1,
  compact = false,
}: {
  alert: Alert;
  count?: number;
  compact?: boolean;
}) {
  const ack = useAckAlert();
  const Icon = SEV_ICON[alert.severity];

  return (
    <div
      className={cx(
        "flex items-center gap-3 rounded-lg border border-line/40 bg-surface px-3",
        compact ? "py-2" : "py-2.5",
      )}
    >
      <Icon className={cx("size-4 shrink-0", SEV_TINT[alert.severity])} aria-label={alert.severity} />
      <div className="min-w-0 flex-1">
        <p className={cx("truncate font-medium", compact ? "text-xs" : "text-sm")}>
          {alert.message ?? alert.rule ?? alert.alertId}
          {count > 1 ? (
            <span
              className="ml-2 rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold text-text-mid"
              title={`${count} occurrences of this rule on this entity`}
            >
              ×{count}
            </span>
          ) : null}
        </p>
        {!compact ? (
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-text-low">
            {alert.entityId ? <span className="font-mono">{alert.entityId}</span> : null}
            {alert.rule ? <span className="font-mono opacity-80">{alert.rule}</span> : null}
            <span>{timeAgo(alert.ts)}</span>
          </p>
        ) : null}
      </div>
      {alert.status === "open" ? (
        <button
          type="button"
          onClick={() => ack.mutate({ alertId: alert.alertId })}
          disabled={ack.isPending}
          className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md border border-line bg-surface-2 px-2 py-1 text-[11px] font-medium text-text-mid transition-colors hover:border-ok/60 hover:text-ok disabled:opacity-50"
          aria-label={`Acknowledge alert ${alert.alertId}`}
        >
          {ack.isPending ? (
            <Loader2 className="size-3 animate-spin" aria-hidden />
          ) : (
            <Check className="size-3" aria-hidden />
          )}
          Ack
        </button>
      ) : (
        <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-text-low capitalize">
          {alert.status}
        </span>
      )}
    </div>
  );
}
