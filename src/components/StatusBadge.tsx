import {
  Activity,
  CircleCheck,
  CircleHelp,
  OctagonAlert,
  TriangleAlert,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import { normalizeStatus, STATUS_META, type HealthStatus } from "@/lib/status";
import { cx } from "@/components/ui";

/** Status is always encoded color + icon + label — never color alone. */
const ICONS: Record<HealthStatus, LucideIcon> = {
  healthy: CircleCheck,
  monitoring: Activity,
  warning: TriangleAlert,
  critical: OctagonAlert,
  offline: WifiOff,
  unknown: CircleHelp,
};

const BADGE_TINT: Record<HealthStatus, string> = {
  healthy: "bg-ok/15 text-ok",
  monitoring: "bg-info/15 text-info",
  warning: "bg-warn/15 text-warn",
  critical: "bg-crit/15 text-crit",
  offline: "bg-offline/20 text-text-mid",
  unknown: "bg-text-low/15 text-text-low",
};

export function StatusBadge({
  status,
  className,
}: {
  status: string | undefined;
  className?: string;
}) {
  const key = normalizeStatus(status);
  const Icon = ICONS[key];
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        BADGE_TINT[key],
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {STATUS_META[key].label}
    </span>
  );
}

export function StatusDot({ status, className }: { status: string | undefined; className?: string }) {
  const key = normalizeStatus(status);
  const Icon = ICONS[key];
  return (
    <Icon
      className={cx("size-4", STATUS_META[key].text, className)}
      aria-label={STATUS_META[key].label}
    />
  );
}
