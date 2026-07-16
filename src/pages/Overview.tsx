import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { usePayload } from "@/lib/queries";
import { HealthGauge } from "@/components/HealthGauge";
import { KpiCard } from "@/components/KpiCard";
import { AlertItem } from "@/components/AlertItem";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Card,
  EmptyState,
  ErrorState,
  LevelBadge,
  SectionTitle,
  Skeleton,
} from "@/components/ui";
import { fmtNum, fmtPct, fmtRatioPct, seriesDelta } from "@/lib/format";
import { palette } from "@/styles/tokens";
import type { Alert } from "@/types/payload";

const SEV_RANK: Record<Alert["severity"], number> = { critical: 0, warning: 1, info: 2 };

function OverviewSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading farm overview">
      <Skeleton className="h-56" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-40" />
    </div>
  );
}

/** The 10-second read: health, what is wrong, what to do about it. */
export function Overview() {
  const { data, isPending, isError, error, refetch } = usePayload();

  if (isPending) return <OverviewSkeleton />;
  if (isError && !data) {
    return (
      <ErrorState
        title="Pipeline unreachable — no cached data yet."
        detail={error.message}
        onRetry={() => void refetch()}
      />
    );
  }
  if (!data) {
    return (
      <EmptyState
        title="No analysis run yet"
        hint="Press Run analysis to trigger the first pipeline run."
      />
    );
  }

  const { farm, aiInsights, alerts, stations } = data;
  const kpis = farm.kpis;
  const trend = farm.trend ?? {};
  const openAlerts = alerts
    .filter((a) => a.status === "open")
    .sort((a, b) => SEV_RANK[a.severity] - SEV_RANK[b.severity])
    .slice(0, 4);
  const recommendations = aiInsights?.recommendations.slice(0, 3) ?? [];

  return (
    <div className="space-y-7">
      <Card className="animate-rise p-6">
        <div className="grid gap-6 lg:grid-cols-[auto_1fr_auto] lg:items-center">
          <HealthGauge score={farm.healthScore} status={farm.status} />
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-accent-2 uppercase">
              <Sparkles className="size-3.5" aria-hidden />
              AI interpretation of validated KPIs
            </p>
            <h1 className="mt-2 font-display text-2xl leading-tight font-bold lg:text-[1.9rem]">
              {aiInsights?.headline ?? "Analysis pending — run the pipeline for a fresh read."}
            </h1>
            {aiInsights?.summary ? (
              <p className="mt-2 line-clamp-3 max-w-2xl text-sm leading-relaxed text-text-mid">
                {aiInsights.summary}{" "}
                <Link to="/insights" className="whitespace-nowrap text-accent-2 hover:underline">
                  Full briefing
                </Link>
              </p>
            ) : null}
          </div>
          {stations.length > 0 ? (
            <div className="flex flex-wrap gap-2 lg:flex-col">
              {stations.map((s) => (
                <Link
                  key={s.stationId}
                  to="/stations"
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-line/40 bg-surface-2/50 px-3 py-1.5 transition-colors hover:border-accent-2/60"
                >
                  <span className="font-mono text-xs font-semibold">{s.stationId}</span>
                  <StatusBadge status={s.status} />
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </Card>

      <section>
        <SectionTitle hint="7-day trend, delta vs. yesterday">Farm KPIs</SectionTitle>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <KpiCard
            label="Performance ratio"
            value={fmtRatioPct(kpis?.avgPerformanceRatio)}
            series={trend.pr7d}
            delta={seriesDelta(trend.pr7d)}
            to="/stations"
          />
          <KpiCard
            label="Inverter efficiency"
            value={fmtPct(kpis?.avgInverterEff_pct)}
            series={trend.inverterEff7d}
            delta={seriesDelta(trend.inverterEff7d)}
            to="/stations"
          />
          <KpiCard
            label="AC power"
            value={fmtNum(kpis?.totalACPower_kW)}
            unit="kW"
            series={trend.acPower7d}
            delta={seriesDelta(trend.acPower7d)}
            to="/stations"
            sparkColor={palette.amber}
          />
          <KpiCard
            label="Daily energy"
            value={fmtNum(kpis?.totalDailyEnergy_kWh)}
            unit="kWh"
            series={trend.energy7d}
            delta={seriesDelta(trend.energy7d)}
            to="/insights"
            sparkColor={palette.amber}
          />
          <KpiCard
            label="Self-sufficiency"
            value={fmtPct(kpis?.selfSufficiency_pct, 0)}
            series={trend.selfSufficiency7d}
            delta={seriesDelta(trend.selfSufficiency7d)}
            to="/insights"
            sparkColor={palette.ok}
          />
          <KpiCard
            label="Soiling index"
            value={fmtNum(kpis?.avgSoilingIndex, 2)}
            series={trend.soiling7d}
            delta={seriesDelta(trend.soiling7d)}
            goodDir="down"
            to="/maintenance"
            sparkColor={palette.crit}
          />
        </div>
      </section>

      <section>
        <SectionTitle hint="from the AI agent">Do these next</SectionTitle>
        {recommendations.length === 0 ? (
          <EmptyState title="No recommendations in this run" />
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {recommendations.map((rec, i) => (
              <Link
                key={i}
                to="/maintenance"
                className="group flex cursor-pointer flex-col rounded-card border border-amber/25 bg-surface p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-amber/60 hover:shadow-pop"
              >
                <div className="flex items-center gap-2">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-amber/15 font-display text-xs font-bold text-amber">
                    {i + 1}
                  </span>
                  <LevelBadge kind="impact" level={rec.impact} />
                  <LevelBadge kind="effort" level={rec.effort} />
                </div>
                <p className="mt-2.5 flex-1 text-sm leading-relaxed text-text-hi">{rec.text}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-amber opacity-0 transition-opacity group-hover:opacity-100">
                  Open planner <ArrowRight className="size-3" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section aria-live="polite">
        <SectionTitle hint={openAlerts.length > 0 ? "one-click acknowledge" : undefined}>
          Open alerts
        </SectionTitle>
        {openAlerts.length === 0 ? (
          <EmptyState title="No open alerts" hint="Everything the rule engine watches is quiet." />
        ) : (
          <div className="space-y-2">
            {openAlerts.map((a) => (
              <AlertItem key={a.alertId} alert={a} compact />
            ))}
            <Link
              to="/alerts"
              className="inline-flex items-center gap-1 pt-1 text-xs font-medium text-accent-2 hover:underline"
            >
              All alerts <ArrowRight className="size-3" aria-hidden />
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
