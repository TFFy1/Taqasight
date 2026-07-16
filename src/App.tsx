import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { Shell } from "@/components/Shell";
import { Banner } from "@/components/Banner";
import { usePayload } from "@/lib/queries";
import { fmtDateTime } from "@/lib/format";
import { Overview } from "@/pages/Overview";
import { FarmMap } from "@/pages/FarmMap";
import { Stations } from "@/pages/Stations";
import { AlertsCenter } from "@/pages/AlertsCenter";
import { Maintenance } from "@/pages/Maintenance";
import { Insights } from "@/pages/Insights";

/** /panel/:id deep links open the panel drawer on the map view. */
function PanelRedirect() {
  const { id } = useParams();
  return <Navigate to={`/map?panel=${encodeURIComponent(id ?? "")}`} replace />;
}

export default function App() {
  const payload = usePayload();

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
    </Shell>
  );
}
