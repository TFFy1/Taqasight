import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { usePayload } from "@/lib/queries";
import { PanelDrawer } from "@/components/PanelDrawer";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, EmptyState, ErrorState, SectionTitle, Skeleton, cx } from "@/components/ui";
import { normalizeStatus, STATUS_META, type HealthStatus } from "@/lib/status";
import type { MapPanel } from "@/types/payload";

const STATUS_FILTERS: Array<HealthStatus | "all"> = [
  "all",
  "healthy",
  "monitoring",
  "warning",
  "critical",
  "offline",
];

interface StringGroup {
  stringId: string;
  panels: MapPanel[];
}
interface InverterGroup {
  inverterId: string;
  strings: StringGroup[];
}
interface StationGroup {
  stationId: string;
  inverters: InverterGroup[];
  counts: Partial<Record<HealthStatus, number>>;
}

/** Group flat map[] into Station -> Inverter -> String (schematic layout). */
function groupMap(panels: MapPanel[]): StationGroup[] {
  const stations = new Map<string, Map<string, Map<string, MapPanel[]>>>();
  for (const p of panels) {
    const s = p.stationId ?? "Unassigned";
    const inv = p.inverterId ?? "—";
    const str = p.stringId ?? "—";
    if (!stations.has(s)) stations.set(s, new Map());
    const invMap = stations.get(s)!;
    if (!invMap.has(inv)) invMap.set(inv, new Map());
    const strMap = invMap.get(inv)!;
    if (!strMap.has(str)) strMap.set(str, []);
    strMap.get(str)!.push(p);
  }
  return [...stations.entries()].map(([stationId, invMap]) => {
    const counts: Partial<Record<HealthStatus, number>> = {};
    for (const invs of invMap.values())
      for (const ps of invs.values())
        for (const p of ps) {
          const st = normalizeStatus(p.status);
          counts[st] = (counts[st] ?? 0) + 1;
        }
    return {
      stationId,
      counts,
      inverters: [...invMap.entries()].map(([inverterId, strMap]) => ({
        inverterId,
        strings: [...strMap.entries()].map(([stringId, ps]) => ({ stringId, panels: ps })),
      })),
    };
  });
}

export function FarmMap() {
  const { data, isPending, isError, error, refetch } = usePayload();
  const [params, setParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<HealthStatus | "all">("all");
  const [stationFilter, setStationFilter] = useState<string | "all">("all");

  const selectedPanel = params.get("panel");
  const groups = useMemo(() => groupMap(data?.map ?? []), [data?.map]);

  if (isPending) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading farm map">
        <Skeleton className="h-10 w-2/3" />
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-44" />
        ))}
      </div>
    );
  }
  if (isError && !data) {
    return (
      <ErrorState
        title="Pipeline unreachable — map unavailable."
        detail={error.message}
        onRetry={() => void refetch()}
      />
    );
  }
  if (!data || data.map.length === 0) {
    return (
      <EmptyState
        title="No panel map in this payload"
        hint="The pipeline did not include map[] entries for this installation."
      />
    );
  }

  const openPanel = (id: string) => {
    params.set("panel", id);
    setParams(params, { replace: false });
  };
  const closePanel = () => {
    params.delete("panel");
    setParams(params, { replace: false });
  };
  const matches = (p: MapPanel) =>
    (statusFilter === "all" || normalizeStatus(p.status) === statusFilter) &&
    (stationFilter === "all" || p.stationId === stationFilter);

  return (
    <div className="space-y-5">
      <SectionTitle hint="schematic layout — grouped by station / inverter / string">
        Farm map
      </SectionTitle>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filters">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setStatusFilter(f)}
            className={cx(
              "cursor-pointer rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors",
              statusFilter === f
                ? "border-accent-2 bg-accent/20 text-text-hi"
                : "border-line/60 bg-surface text-text-mid hover:border-accent-2/50",
            )}
            aria-pressed={statusFilter === f}
          >
            {f === "all" ? "All statuses" : STATUS_META[f].label}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-line" aria-hidden />
        {["all", ...groups.map((g) => g.stationId)].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStationFilter(s)}
            className={cx(
              "cursor-pointer rounded-full border px-3 py-1 font-mono text-xs font-medium transition-colors",
              stationFilter === s
                ? "border-accent-2 bg-accent/20 text-text-hi"
                : "border-line/60 bg-surface text-text-mid hover:border-accent-2/50",
            )}
            aria-pressed={stationFilter === s}
          >
            {s === "all" ? "All stations" : s}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-mid">
        {(["healthy", "monitoring", "warning", "critical", "offline"] as const).map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block size-2.5 rounded-[3px]"
              style={{ backgroundColor: STATUS_META[s].hex }}
              aria-hidden
            />
            {STATUS_META[s].label}
          </span>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {groups
          .filter((g) => stationFilter === "all" || g.stationId === stationFilter)
          .map((g) => {
            const station = data.stations.find((s) => s.stationId === g.stationId);
            return (
              <Card key={g.stationId} className="p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-display text-base font-bold">{g.stationId}</h3>
                    <StatusBadge status={station?.status} />
                  </div>
                  <p className="text-xs text-text-low tabular">
                    {Object.entries(g.counts)
                      .map(([s, n]) => `${n} ${s}`)
                      .join(" · ")}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {g.inverters.map((inv) => (
                    <div
                      key={inv.inverterId}
                      className="rounded-lg border border-line/50 bg-bg-deep/40 p-3"
                    >
                      <p className="mb-2 font-mono text-[11px] font-semibold text-text-mid">
                        {inv.inverterId}
                      </p>
                      <div className="space-y-2">
                        {inv.strings.map((str) => (
                          <div key={str.stringId} className="flex items-center gap-2">
                            <span className="w-11 shrink-0 font-mono text-[10px] text-text-low">
                              {str.stringId}
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {str.panels.map((p) => {
                                const meta = STATUS_META[normalizeStatus(p.status)];
                                const dimmed = !matches(p);
                                const health =
                                  p.healthScore !== undefined ? ` · health ${p.healthScore}` : "";
                                return (
                                  <button
                                    key={p.panelId}
                                    type="button"
                                    onClick={() => openPanel(p.panelId)}
                                    title={`${p.panelId} · ${meta.label}${health}`}
                                    aria-label={`Panel ${p.panelId}, ${meta.label}`}
                                    className={cx(
                                      "size-4 cursor-pointer rounded-[3px] transition-all hover:scale-125 hover:ring-2 hover:ring-white/60 focus-visible:scale-125",
                                      dimmed && "opacity-20",
                                    )}
                                    style={{ backgroundColor: meta.hex }}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
      </div>

      <PanelDrawer panelId={selectedPanel} onClose={closePanel} />
    </div>
  );
}
