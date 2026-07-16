import { CloudOff, ShieldAlert, type LucideIcon } from "lucide-react";
import { cx } from "@/components/ui";

type Tone = "offline" | "contract";

const TONE: Record<Tone, { icon: LucideIcon; classes: string }> = {
  offline: { icon: CloudOff, classes: "border-warn/40 bg-warn/10 text-warn" },
  contract: { icon: ShieldAlert, classes: "border-crit/40 bg-crit/10 text-crit" },
};

/** Degraded-state banner: pipeline unreachable / data contract mismatch. */
export function Banner({
  tone,
  title,
  detail,
}: {
  tone: Tone;
  title: string;
  detail?: string;
}) {
  const { icon: Icon, classes } = TONE[tone];
  return (
    <div
      role="alert"
      className={cx("flex items-start gap-3 rounded-card border px-4 py-3", classes)}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 text-sm">
        <p className="font-semibold">{title}</p>
        {detail ? <p className="mt-0.5 text-xs opacity-80">{detail}</p> : null}
      </div>
    </div>
  );
}
