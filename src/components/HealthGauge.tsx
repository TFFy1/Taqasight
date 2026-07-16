import { useEffect, useState } from "react";
import { healthBand, normalizeStatus, STATUS_META } from "@/lib/status";
import { palette } from "@/styles/tokens";
import { fmtInt } from "@/lib/format";

const R = 84;
const STROKE = 13;
const CIRCUMFERENCE = Math.PI * R; // semicircle

/**
 * 0–100 farm health gauge, color-banded by the pipeline status (falls back to
 * display banding of the score). Fill animates on load via dashoffset.
 */
export function HealthGauge({
  score,
  status,
}: {
  score: number | undefined;
  status: string | undefined;
}) {
  const band = normalizeStatus(status) !== "unknown" ? normalizeStatus(status) : healthBand(score);
  const meta = STATUS_META[band];
  const frac = score !== undefined && Number.isFinite(score) ? Math.max(0, Math.min(1, score / 100)) : 0;

  // Start empty, then transition to the real value after mount.
  const [drawn, setDrawn] = useState(0);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setDrawn(frac));
    return () => cancelAnimationFrame(raf);
  }, [frac]);

  const size = R * 2 + STROKE;
  const cy = R + STROKE / 2;

  return (
    <div
      role="img"
      aria-label={
        score !== undefined
          ? `Farm health score ${fmtInt(score)} out of 100 — ${meta.label}`
          : "Farm health score not provided by pipeline"
      }
      className="relative mx-auto w-fit"
    >
      <svg width={size} height={cy + STROKE / 2} viewBox={`0 0 ${size} ${cy + STROKE / 2}`}>
        <path
          d={`M ${STROKE / 2} ${cy} A ${R} ${R} 0 0 1 ${size - STROKE / 2} ${cy}`}
          fill="none"
          stroke={palette.surface2}
          strokeWidth={STROKE}
          strokeLinecap="round"
        />
        <path
          d={`M ${STROKE / 2} ${cy} A ${R} ${R} 0 0 1 ${size - STROKE / 2} ${cy}`}
          fill="none"
          stroke={meta.hex}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - drawn)}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-0.5 pb-1">
        <span className="font-display text-5xl font-bold tabular">
          {score !== undefined ? fmtInt(score) : "—"}
        </span>
        <span className={`text-xs font-semibold tracking-widest uppercase ${meta.text}`}>
          {meta.label}
        </span>
      </div>
    </div>
  );
}
