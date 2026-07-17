import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError, type EntityType } from "@/lib/api";
import type { Alert, AlertStatus, DashboardPayload } from "@/types/payload";

/**
 * Query hooks — the only data access surface pages use. Retry/backoff lives
 * in the api layer, so React Query retries are off (no double-retry storms).
 * React Query keeps the last successful payload in memory on refetch failure,
 * which gives the "showing last cached data from {ts}" degraded state free.
 */

export const LATEST_KEY = ["latest"] as const;
export const ALERTS_KEY = ["alerts"] as const;

export function usePayload() {
  return useQuery<DashboardPayload, ApiError>({
    queryKey: LATEST_KEY,
    queryFn: () => api.latest(),
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
    retry: false,
  });
}

export function useHistory(entityType: EntityType, id: string | undefined, days = 7) {
  return useQuery({
    queryKey: ["history", entityType, id, days] as const,
    queryFn: () => api.history(entityType, id as string, days),
    enabled: Boolean(id),
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useAlerts(status?: AlertStatus) {
  return useQuery<Alert[], ApiError>({
    queryKey: [...ALERTS_KEY, status ?? "all"] as const,
    queryFn: () => api.alerts(status),
    staleTime: 60_000,
    retry: false,
  });
}

/**
 * "Last updated" reflects the moment the operator last ran an analysis, and
 * must survive background refetches of the static manual payload.
 */
let lastRunAt: string | undefined;
export function getLastRunAt(): string | undefined {
  return lastRunAt;
}

export function useRunAnalysis() {
  const qc = useQueryClient();
  return useMutation<DashboardPayload, ApiError>({
    mutationFn: () => api.analyze(),
    onSuccess: () => {
      lastRunAt = new Date().toISOString();
      // Reset (not set) so every view drops to its loading skeleton and
      // re-renders — the run visibly "refreshes the page" with fetched data.
      void qc.resetQueries({ queryKey: LATEST_KEY });
      void qc.invalidateQueries({ queryKey: ALERTS_KEY });
    },
  });
}

/** Demo identity until real auth exists — n8n logs it with the ack. */
export const OPERATOR = "console-operator";

export function useAckAlert() {
  const qc = useQueryClient();
  return useMutation<void, ApiError, { alertId: string }>({
    mutationFn: ({ alertId }) => api.ackAlert(alertId, OPERATOR),
    onMutate: async ({ alertId }) => {
      await qc.cancelQueries({ queryKey: ALERTS_KEY });
      const mark = (a: Alert): Alert =>
        a.alertId === alertId ? { ...a, status: "acknowledged" } : a;
      qc.setQueriesData<Alert[]>({ queryKey: ALERTS_KEY }, (list) => list?.map(mark));
      qc.setQueryData<DashboardPayload>(LATEST_KEY, (p) =>
        p ? { ...p, alerts: p.alerts.map(mark) } : p,
      );
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ALERTS_KEY });
      void qc.invalidateQueries({ queryKey: LATEST_KEY });
    },
  });
}

export function useMaintenanceDone() {
  return useMutation<void, ApiError, { entityId: string; priority: number }>({
    mutationFn: ({ entityId, priority }) => api.maintenanceDone(entityId, priority, OPERATOR),
  });
}

export type PipelineStage = "queued" | "computing" | "interpreting" | "done";

/**
 * The pipeline run is one HTTP round-trip; these stages pace the UI feedback
 * (queued → computing → interpreting) while the request is in flight.
 */
export function usePipelineStages(isPending: boolean, isSuccess: boolean): PipelineStage | null {
  const [stage, setStage] = useState<PipelineStage | null>(null);

  useEffect(() => {
    if (!isPending) return;
    setStage("queued");
    const t1 = setTimeout(() => setStage("computing"), 700);
    const t2 = setTimeout(() => setStage("interpreting"), 2000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isPending]);

  useEffect(() => {
    if (!isSuccess) return;
    setStage("done");
    const t = setTimeout(() => setStage(null), 2200);
    return () => clearTimeout(t);
  }, [isSuccess]);

  return stage;
}
