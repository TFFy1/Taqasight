import { Link } from "react-router-dom";
import { usePayload } from "@/lib/queries";
import { Sparkline } from "@/components/Sparkline";
import { StatusBadge } from "@/components/StatusBadge";
import { TrendChart, type TrendLine } from "@/components/TrendChart";
import { Card, EmptyState, ErrorState, Missing, SectionTitle, Skeleton, cx } from "@/components/ui";
import { fmtNum, fmtPct, fmtRatioPct } from "@/lib/format";
import { normalizeStatus } from "@/lib/status";
import { chart } from "@/styles/tokens";

/** Day labels for 7-point trend arrays received from the pipeline. */
function dayLabels(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.now() - (n - 1 - i) * 24 * 3600_000);
    return d.toLocaleDateString("en-US", { weekday: "short" });
  });
}

export function Stations() {
  const { data, isPending, isError, error, refetch } = usePayload();

  if (isPending) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading station analysis">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-56" />
      </div>
    );
  }
  if (isError && !data) {
    return (
      <ErrorState
        title="Pipeline unreachable — station data unavailable."
        detail={error.message}
        onRetry={() => void refetch()}
      />
    );
  }
  if (!data || data.stations.length === 0) {
    return <EmptyState title="No stations in this payload" />;
  }

  const stations = data.stations;
  const fleetEff = data.farm.kpis?.avgInverterEff_pct;
  const maxLen = Math.max(...stations.map((s) => s.trend?.pr7d?.length ?? 0), 0);
  const labels = dayLabels(maxLen);
  const prPoints = labels.map((x, i) => {
    const row: Record<string, number | string | undefined> = { x };
    for (const s of stations) row[s.stationId] = s.trend?.pr7d?.[i];
    return row;
  });
  const prLines: TrendLine[] = stations.map((s, i) => ({
    key: s.stationId,
    name: s.stationId,
    color: chart.series[i % chart.series.length],
  }));

  const inverters = stations.flatMap((s) =>
    s.inverters.map((inv) => ({ station: s.stationId, ...inv })),
  );
  const strings = stations.flatMap((s) =>
    s.inverters.flatMap((inv) =>
      inv.strings.map((str) => ({ station: s.stationId, inverter: inv.inverterId, ...str })),
    ),
  );
  strings.sort((a, b) => (b.imbalance_pct ?? -1) - (a.imbalance_pct ?? -1));

  return (
    <div className="space-y-7">
      <section>
        <SectionTitle hint="side-by-side comparison">Stations</SectionTitle>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {stations.map((s) => {
            const flagged = ["warning", "critical"].includes(normalizeStatus(s.status));
            return (
              <Card
                key={s.stationId}
                className={cx("p-4", flagged && "border-warn/40")}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold">{s.stationId}</h3>
                  <StatusBadge status={s.status} />
                </div>
                <p className="mt-2 font-display text-3xl font-bold tabular">
                  {s.healthScore !== undefined ? fmtNum(s.healthScore, 0) : <Missing />}
                  <span className="ml-1 text-xs font-normal text-text-low">health</span>
                </p>
                <dl className="mt-3 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-text-low">Avg PR</dt>
                    <dd className="font-semibold tabular">{fmtRatioPct(s.kpis?.avgPR)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-low">Inverter eff</dt>
                    <dd className="font-semibold tabular">{fmtPct(s.kpis?.avgInverterEff_pct)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-low">Soiling</dt>
                    <dd className="font-semibold tabular">{fmtNum(s.kpis?.avgSoilingIndex, 2)}</dd>
                  </div>
                </dl>
                <div className="mt-2">
                  <Sparkline data={s.trend?.pr7d} height={28} />
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <SectionTitle hint="performance ratio, last 7 runs">PR trend by station</SectionTitle>
        <Card className="p-4">
          {maxLen > 1 ? (
            <TrendChart points={prPoints} lines={prLines} height={260} />
          ) : (
            <EmptyState title="No trend data" hint="The payload carried no pr7d arrays." />
          )}
        </Card>
      </section>

      <section>
        <SectionTitle hint="efficiency vs. fleet mean">Inverters</SectionTitle>
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[540px] text-sm">
            <thead>
              <tr className="border-b border-line/60 text-left text-xs text-text-low uppercase">
                <th className="px-4 py-2.5 font-medium">Inverter</th>
                <th className="px-4 py-2.5 font-medium">Station</th>
                <th className="px-4 py-2.5 text-right font-medium">Efficiency</th>
                <th className="px-4 py-2.5 text-right font-medium">vs fleet</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {inverters.map((inv) => {
                const flagged = ["warning", "critical"].includes(normalizeStatus(inv.status));
                const diff =
                  inv.avgEff_pct !== undefined && fleetEff !== undefined
                    ? inv.avgEff_pct - fleetEff
                    : undefined;
                return (
                  <tr
                    key={inv.inverterId}
                    className={cx(
                      "border-b border-line/30 last:border-0",
                      flagged && "bg-warn/5",
                    )}
                  >
                    <td className="px-4 py-2.5 font-mono font-semibold">{inv.inverterId}</td>
                    <td className="px-4 py-2.5 font-mono text-text-mid">{inv.station}</td>
                    <td className="px-4 py-2.5 text-right font-semibold tabular">
                      {fmtPct(inv.avgEff_pct)}
                    </td>
                    <td
                      className={cx(
                        "px-4 py-2.5 text-right tabular",
                        diff === undefined
                          ? "text-text-low"
                          : diff < -1
                            ? "font-semibold text-crit"
                            : diff < 0
                              ? "text-warn"
                              : "text-ok",
                      )}
                    >
                      {diff !== undefined ? `${diff > 0 ? "+" : ""}${fmtNum(diff)} pts` : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={inv.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </section>

      <section>
        <SectionTitle hint="imbalance over 5% flags a DC-side fault">String imbalance</SectionTitle>
        <Card className="p-4">
          {strings.length === 0 ? (
            <EmptyState title="No string data in this payload" />
          ) : (
            <ul className="space-y-2.5">
              {strings.map((str) => {
                const imb = str.imbalance_pct;
                const over = imb !== undefined && imb > 5;
                return (
                  <li key={str.stringId} className="flex items-center gap-3 text-xs">
                    <Link
                      to={`/map?panel=`}
                      className="w-14 shrink-0 font-mono font-semibold hover:text-accent-2"
                      title={`${str.station} / ${str.inverter}`}
                    >
                      {str.stringId}
                    </Link>
                    <span className="w-20 shrink-0 font-mono text-text-low">{str.inverter}</span>
                    <span className="w-16 shrink-0 text-right tabular text-text-mid">
                      PR {fmtRatioPct(str.avgPR)}
                    </span>
                    <div
                      className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2"
                      role="meter"
                      aria-valuenow={imb ?? 0}
                      aria-valuemin={0}
                      aria-valuemax={8}
                      aria-label={`${str.stringId} imbalance ${imb !== undefined ? fmtNum(imb) : "unknown"} percent`}
                    >
                      <div
                        className={cx("h-full rounded-full", over ? "bg-crit" : "bg-accent-2")}
                        style={{ width: `${Math.min(100, ((imb ?? 0) / 8) * 100)}%` }}
                      />
                    </div>
                    <span
                      className={cx(
                        "w-12 shrink-0 text-right font-semibold tabular",
                        over ? "text-crit" : "text-text-mid",
                      )}
                    >
                      {imb !== undefined ? fmtPct(imb) : "—"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}
