import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import {
  Bell,
  LayoutDashboard,
  Map,
  Server,
  Sparkles,
  Sun,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { RunAnalysis } from "@/components/RunAnalysis";
import { cx } from "@/components/ui";
import { usePayload } from "@/lib/queries";
import { isMockMode } from "@/lib/api";
import { timeAgo } from "@/lib/format";

const NAV: Array<{ to: string; label: string; icon: LucideIcon }> = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/map", label: "Farm Map", icon: Map },
  { to: "/stations", label: "Stations", icon: Server },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/insights", label: "AI Insights", icon: Sparkles },
];

export function Shell({ children }: { children: ReactNode }) {
  const { data } = usePayload();
  const openAlerts = data?.alerts.filter((a) => a.status === "open").length ?? 0;

  const navItems = NAV.map(({ to, label, icon: Icon }) => (
    <NavLink
      key={to}
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        cx(
          "flex shrink-0 cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-accent/20 text-text-hi"
            : "text-text-mid hover:bg-surface-2 hover:text-text-hi",
        )
      }
    >
      <Icon className="size-4" aria-hidden />
      {label}
      {to === "/alerts" && openAlerts > 0 ? (
        <span
          className="ml-auto rounded-full bg-crit/20 px-1.5 py-0.5 text-[10px] font-bold text-crit tabular"
          aria-live="polite"
          aria-label={`${openAlerts} open alerts`}
        >
          {openAlerts}
        </span>
      ) : null}
    </NavLink>
  ));

  return (
    <div className="min-h-dvh lg:pl-60">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-line/50 bg-bg-deep px-3 py-5 lg:flex">
        <div className="mb-6 flex items-center gap-2.5 px-2">
          <span className="grid size-9 place-items-center rounded-lg bg-amber/15">
            <Sun className="size-5 text-amber" aria-hidden />
          </span>
          <div>
            <p className="font-display text-sm leading-tight font-bold">Solar Farm Console</p>
            <p className="text-[11px] text-text-low">Fusion AI pipeline</p>
          </div>
        </div>
        <nav className="flex flex-col gap-1" aria-label="Primary">
          {navItems}
        </nav>
        <p className="mt-auto px-2 text-[10px] leading-relaxed text-text-low">
          AI insights are interpretations of validated KPIs computed by the deterministic pipeline.
        </p>
      </aside>

      <header className="sticky top-0 z-30 border-b border-line/50 bg-bg/90 backdrop-blur">
        <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-amber/15 lg:hidden">
              <Sun className="size-4 text-amber" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm text-text-mid">
                Last updated{" "}
                <span className="font-medium text-text-hi" title={data?.generatedAt}>
                  {data ? timeAgo(data.generatedAt) : "—"}
                </span>
              </p>
            </div>
            {isMockMode() ? (
              <span className="rounded-full border border-amber/40 bg-amber/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber uppercase">
                Mock data
              </span>
            ) : null}
          </div>
          <RunAnalysis />
        </div>
        <nav
          className="flex gap-1 overflow-x-auto px-4 pb-2 lg:hidden"
          aria-label="Primary mobile"
        >
          {navItems}
        </nav>
      </header>

      <main className="px-4 py-6 lg:px-8">{children}</main>
    </div>
  );
}
