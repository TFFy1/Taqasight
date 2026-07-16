import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";
import { palette } from "@/styles/tokens";

/** Tiny 7-point trend line for KPI cards; decorative, so aria-hidden. */
export function Sparkline({
  data,
  color = palette.accent2,
  height = 34,
}: {
  data: number[] | undefined;
  color?: string;
  height?: number;
}) {
  if (!data || data.length < 2) return <div style={{ height }} aria-hidden />;
  const points = data.map((v, i) => ({ i, v }));
  const min = Math.min(...data);
  const max = Math.max(...data);
  const pad = (max - min || Math.abs(max) || 1) * 0.15;
  return (
    <div style={{ height }} aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 4, right: 2, bottom: 2, left: 2 }}>
          <YAxis hide domain={[min - pad, max + pad]} />
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.75}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
