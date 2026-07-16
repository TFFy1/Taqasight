import { Sparkles } from "lucide-react";
import { Drawer } from "@/components/Drawer";
import { StatusBadge } from "@/components/StatusBadge";
import { TrendChart } from "@/components/TrendChart";
import { ErrorState, Missing, ProbBar, Skeleton } from "@/components/ui";
import { useHistory, usePayload } from "@/lib/queries";
import { fmtNum, fmtRatioPct } from "@/lib/format";
import { palette } from "@/styles/tokens";

function Metric({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-line/40 bg-surface p-3">
      <p className="text-[11px] font-medium tracking-wide text-text-low uppercase">{label}</p>
      <div className="mt-1 font-display text-lg font-semibold tabular">{children}</div>
    </div>
  );
}

/** Panel detail: topology, KPIs, 7-day history charts, AI read, plan slot. */
export function PanelDrawer({
  panelId,
  onClose,
}: {
  panelId: string | null;
  onClose: () => void;
}) {
  const { data } = usePayload();
  const history = useHistory("panel", panelId ?? undefined, 7);

  const mapPanel = data?.map.find((p) => p.panelId === panelId);
  const critical = data?.criticalPanels.find((p) => p.panelId === panelId);
  const planItems =
    data?.maintenancePlan.filter(
      (m) =>
        m.entityId === panelId ||
        (mapPanel?.stringId !== undefined && m.entityId === mapPanel.stringId) ||
        (mapPanel?.inverterId !== undefined && m.entityId === mapPanel.inverterId),
    ) ?? [];
  const anomaly = data?.aiInsights?.anomalies.find(
    (a) =>
      a.entityId === panelId ||
      a.entityId === mapPanel?.stringId ||
      a.entityId === mapPanel?.inverterId,
  );
  const prediction = data?.aiInsights?.predictions.find((p) => p.entityId === panelId);

  const points =
    history.data?.points.map((p) => ({
      x: new Date(p.ts).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      pr: p.pr,
      temp: p.temp_C,
      soiling: p.soilingIndex,
      energy: p.energy_kWh,
    })) ?? [];

  return (
    <Drawer
      open={Boolean(panelId)}
      onClose={onClose}
      title={
        <span className="flex items-center gap-3">
          <span className="font-mono">{panelId}</span>
          <StatusBadge status={mapPanel?.status} />
        </span>
      }
    >
      <div className="space-y-5">
        <p className="font-mono text-xs text-text-low">
          {[mapPanel?.stationId, mapPanel?.inverterId, mapPanel?.stringId]
            .filter(Boolean)
            .join(" / ") || "topology not provided"}
        </p>

        <div className="grid grid-cols-2 gap-2.5">
          <Metric label="Performance ratio">
            {critical?.pr !== undefined ? fmtRatioPct(critical.pr) : <Missing />}
          </Metric>
          <Metric label="Temperature">
            {critical?.temp_C !== undefined ? `${fmtNum(critical.temp_C)} °C` : <Missing />}
          </Metric>
          <Metric label="Soiling index">
            {critical?.soilingIndex !== undefined ? fmtNum(critical.soilingIndex, 2) : <Missing />}
          </Metric>
          <Metric label="Health score">
            {mapPanel?.healthScore !== undefined ? fmtNum(mapPanel.healthScore, 0) : <Missing />}
          </Metric>
        </div>

        <div>
          <p className="mb-1.5 text-[11px] font-medium tracking-wide text-text-low uppercase">
            Failure probability
          </p>
          <ProbBar pct={critical?.failureProb_pct} />
        </div>

        {anomaly || prediction ? (
          <div className="rounded-lg border border-accent/30 bg-accent/10 p-3">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-accent-2 uppercase">
              <Sparkles className="size-3" aria-hidden />
              AI interpretation of validated KPIs
            </p>
            {anomaly ? (
              <p className="mt-1.5 text-sm leading-relaxed text-text-hi">
                {anomaly.explanation}
                {anomaly.confidence ? (
                  <span className="ml-2 rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] text-text-mid">
                    confidence: {anomaly.confidence}
                  </span>
                ) : null}
              </p>
            ) : null}
            {prediction ? (
              <p className="mt-1.5 text-sm leading-relaxed text-text-hi">{prediction.prediction}</p>
            ) : null}
          </div>
        ) : null}

        {planItems.length > 0 ? (
          <div>
            <p className="mb-1.5 text-[11px] font-medium tracking-wide text-text-low uppercase">
              In the maintenance plan
            </p>
            {planItems.map((m) => (
              <p key={`${m.priority}-${m.entityId}`} className="text-sm text-text-mid">
                <span className="font-display font-bold text-amber">#{m.priority}</span> {m.action}{" "}
                <span className="text-text-low">({m.deadline ?? "no deadline"})</span>
              </p>
            ))}
          </div>
        ) : null}

        <div>
          <p className="mb-2 text-[11px] font-medium tracking-wide text-text-low uppercase">
            7-day history
          </p>
          {history.isPending ? (
            <div className="space-y-2.5" aria-busy="true" aria-label="Loading panel history">
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </div>
          ) : history.isError ? (
            <ErrorState
              title="History unavailable"
              detail={history.error.message}
              onRetry={() => void history.refetch()}
            />
          ) : points.length === 0 ? (
            <p className="text-xs text-text-low">No history stored for this panel yet.</p>
          ) : (
            <div className="space-y-4">
              <TrendChart
                points={points}
                lines={[{ key: "pr", name: "PR", color: palette.accent2 }]}
                height={130}
              />
              <TrendChart
                points={points}
                lines={[{ key: "temp", name: "Temp", color: palette.crit }]}
                height={130}
                unit="°C"
              />
              <TrendChart
                points={points}
                lines={[
                  { key: "soiling", name: "Soiling", color: palette.amber },
                  { key: "energy", name: "Energy kWh", color: palette.ok },
                ]}
                height={150}
              />
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
