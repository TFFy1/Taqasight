import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Shell } from "@/components/Shell";
import { Banner } from "@/components/Banner";
import { Skeleton } from "@/components/ui";
import { useAnalysisRunning, usePayload } from "@/lib/queries";
import { fmtDateTime } from "@/lib/format";
import { Overview } from "@/pages/Overview";
import { FarmMap } from "@/pages/FarmMap";
import { Stations } from "@/pages/Stations";
import { AlertsCenter } from "@/pages/AlertsCenter";
import { Maintenance } from "@/pages/Maintenance";
import { Insights } from "@/pages/Insights";

/** Full-page fetch state shown while a Run analysis is in flight. */
function FetchingScreen() {
  return (
    <div aria-busy="true" aria-live="polite" className="animate-rise space-y-6">
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <Loader2 className="size-8 animate-spin text-accent-2" aria-hidden />
        <p className="font-display text-lg font-semibold">Fetching fresh analysis…</p>
        <p className="text-sm text-text-mid">
          Running the pipeline and interpreting the latest telemetry.
        </p>
      </div>
      <Skeleton className="h-48" />
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
    </div>
  );
}

/** /panel/:id deep links open the panel drawer on the map view. */
function PanelRedirect() {
  const { id } = useParams();
  return <Navigate to={`/map?panel=${encodeURIComponent(id ?? "")}`} replace />;
}

export default function App() {
  const payload = usePayload();
  const analysisRunning = useAnalysisRunning();

  // Degraded modes: stale cache after a failed refetch, or a schema mismatch.
  const showOffline = payload.isError && payload.data && payload.error.kind !== "contract";
  const showContract = payload.isError && payload.error.kind === "contract";

  return (
    <Shell>
      {showContract ? (
        <div className="mb-4">
          <Banner
            tone="contract"
            title="Data contract mismatch — the pipeline payload failed validation."
            detail={payload.error.detail ?? "Check payloadVersion on both sides."}
          />
        </div>
      ) : null}
      {showOffline ? (
        <div className="mb-4">
          <Banner
            tone="offline"
            title="Pipeline unreachable — showing last cached data."
            detail={`Cached run from ${fmtDateTime(payload.data?.generatedAt)}`}
          />
        </div>
      ) : null}
      {analysisRunning ? (
        <FetchingScreen />
      ) : (
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/map" element={<FarmMap />} />
          <Route path="/stations" element={<Stations />} />
          <Route path="/alerts" element={<AlertsCenter />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/panel/:id" element={<PanelRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </Shell>
  );
}
