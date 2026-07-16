import { Link } from "react-router-dom";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Sparkline } from "@/components/Sparkline";
import { cx } from "@/components/ui";
import { fmtNum, type Delta } from "@/lib/format";
import { palette } from "@/styles/tokens";

/**
 * Clickable KPI tile: value + unit, 7-day sparkline, delta vs. yesterday.
 * `goodDir` states which direction is an improvement so the delta color
 * carries meaning (soiling going up is bad; energy going up is good).
 */
export function KpiCard({
  label,
  value,
  unit,
  series,
  delta,
  goodDir = "up",
  to,
  sparkColor = palette.accent2,
}: {
  label: string;
  value: string;
  unit?: string;
  series?: number[];
  delta?: Delta;
  goodDir?: "up" | "down";
  to: string;
  sparkColor?: string;
}) {
  const deltaGood = delta && delta.dir !== "flat" ? delta.dir === goodDir : undefined;
  const DeltaIcon = delta?.dir === "up" ? ArrowUpRight : delta?.dir === "down" ? ArrowDownRight : Minus;

  return (
    <Link
      to={to}
      className="group block cursor-pointer rounded-card border border-line/40 bg-surface p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-2/60 hover:shadow-pop focus-visible:border-accent-2"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium tracking-wide text-text-mid uppercase">{label}</span>
        {delta ? (
          <span
            className={cx(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular",
              deltaGood === undefined
                ? "bg-text-low/10 text-text-low"
                : deltaGood
                  ? "bg-ok/15 text-ok"
                  : "bg-crit/15 text-crit",
            )}
            title="change vs. yesterday"
          >
            <DeltaIcon className="size-3" aria-hidden />
            {fmtNum(Math.abs(delta.pct), 1)}%
          </span>
        ) : null}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className="font-display text-[1.7rem] leading-none font-bold tabular">{value}</span>
        {unit ? <span className="text-xs text-text-low">{unit}</span> : null}
      </div>
      <div className="mt-2 opacity-80 transition-opacity group-hover:opacity-100">
        <Sparkline data={series} color={sparkColor} />
      </div>
    </Link>
  );
}
