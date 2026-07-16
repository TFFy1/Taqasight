import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { usePayload } from "@/lib/queries";
import { Sparkline } from "@/components/Sparkline";
import {
  Card,
  EmptyState,
  ErrorState,
  LevelBadge,
  Missing,
  ProbBar,
  SectionTitle,
  Skeleton,
  cx,
} from "@/components/ui";
import { fmtNum, fmtRatioPct } from "@/lib/format";
import { palette } from "@/styles/tokens";

const CONFIDENCE_TINT: Record<string, string> = {
  high: "bg-ok/15 text-ok",
  medium: "bg-warn/15 text-warn",
  low: "bg-text-low/15 text-text-low",
};

export function Insights() {
  const { data, isPending, isError, error, refetch } = usePayload();

  if (isPending) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading AI insights">
        <Skeleton className="h-36" />
        <div className="grid gap-3 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }
  if (isError && !data) {
    return (
      <ErrorState
        title="Pipeline unreachable — insights unavailable."
        detail={error.message}
        onRetry={() => void refetch()}
      />
    );
  }
  const ai = data?.aiInsights;
  if (!ai) {
    return (
      <EmptyState
        title="No AI insights in this payload"
        hint="Run the analysis to generate a fresh interpretation."
      />
    );
  }

  return (
    <div className="space-y-7">
      <div>
        <SectionTitle hint="the model never sees raw telemetry, only validated KPIs">
          AI interpretation of validated KPIs
        </SectionTitle>
        <Card className="border-accent/30 p-5">
          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-accent-2 uppercase">
            <Sparkles className="size-3.5" aria-hidden />
            Executive briefing
          </p>
          <h1 className="mt-2 font-display text-xl leading-snug font-bold">
            {ai.headline ?? <Missing />}
          </h1>
          <p className="mt-2.5 max-w-3xl text-sm leading-relaxed text-text-mid">
            {ai.summary ?? <Missing />}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section>
          <SectionTitle hint="with confidence tags">Anomaly explanations</SectionTitle>
          {ai.anomalies.length === 0 ? (
            <EmptyState title="No anomalies explained in this run" />
          ) : (
            <div className="space-y-2.5">
              {ai.anomalies.map((a) => (
                <Card key={a.entityId} className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-bold text-accent-2">{a.entityId}</span>
                    {a.confidence ? (
                      <span
                        className={cx(
                          "rounded-full px-2 py-0.5 text-[11px] font-medium",
                          CONFIDENCE_TINT[a.confidence],
                        )}
                      >
                        confidence: {a.confidence}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-text-mid">{a.explanation}</p>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionTitle hint="operational outcomes from validated trends">Predictions</SectionTitle>
          {ai.predictions.length === 0 ? (
            <EmptyState title="No predictions in this run" />
          ) : (
            <div className="space-y-2.5">
              {ai.predictions.map((p) => (
                <Card key={p.entityId} className="p-4">
                  <span className="font-mono text-sm font-bold text-accent-2">{p.entityId}</span>
                  <p className="mt-1.5 text-sm leading-relaxed text-text-mid">{p.prediction}</p>
                  {p.failureProb_pct !== undefined ? (
                    <div className="mt-2.5">
                      <ProbBar pct={p.failureProb_pct} />
                    </div>
                  ) : null}
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      <section>
        <SectionTitle hint="ranked by impact and effort">Recommendations</SectionTitle>
        {ai.recommendations.length === 0 ? (
          <EmptyState title="No recommendations in this run" />
        ) : (
          <div className="space-y-2.5">
            {ai.recommendations.map((rec, i) => (
              <Card key={i} className="flex items-start gap-3 p-4">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-amber/15 font-display text-xs font-bold text-amber">
                  {i + 1}
                </span>
                <p className="min-w-0 flex-1 text-sm leading-relaxed">{rec.text}</p>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <LevelBadge kind="impact" level={rec.impact} />
                  <LevelBadge kind="effort" level={rec.effort} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionTitle hint="highest failure risk first">Critical panels</SectionTitle>
        {!data || data.criticalPanels.length === 0 ? (
          <EmptyState title="No critical panels flagged" />
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-line/60 text-left text-xs text-text-low uppercase">
                  <th className="px-4 py-2.5 font-medium">Panel</th>
                  <th className="px-4 py-2.5 font-medium">Location</th>
                  <th className="px-4 py-2.5 text-right font-medium">PR</th>
                  <th className="px-4 py-2.5 text-right font-medium">Temp</th>
                  <th className="px-4 py-2.5 text-right font-medium">Soiling</th>
                  <th className="px-4 py-2.5 font-medium">Failure risk</th>
                  <th className="px-4 py-2.5 font-medium">PR 7d</th>
                </tr>
              </thead>
              <tbody>
                {[...data.criticalPanels]
                  .sort((a, b) => (b.failureProb_pct ?? 0) - (a.failureProb_pct ?? 0))
                  .map((p) => (
                    <tr key={p.panelId} className="border-b border-line/30 last:border-0">
                      <td className="px-4 py-2.5">
                        <Link
                          to={`/panel/${p.panelId}`}
                          className="font-mono font-bold text-accent-2 hover:underline"
                        >
                          {p.panelId}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-text-mid">
                        {[p.stationId, p.inverterId, p.stringId].filter(Boolean).join(" / ") || "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold tabular">
                        {fmtRatioPct(p.pr)}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular">
                        {p.temp_C !== undefined ? `${fmtNum(p.temp_C)} °C` : <Missing />}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular">
                        {p.soilingIndex !== undefined ? fmtNum(p.soilingIndex, 2) : <Missing />}
                      </td>
                      <td className="px-4 py-2.5 align-middle">
                        <ProbBar pct={p.failureProb_pct} />
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="w-24">
                          <Sparkline data={p.trend?.pr7d} color={palette.crit} height={24} />
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>
    </div>
  );
}
