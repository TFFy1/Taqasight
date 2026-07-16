import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { chart, palette } from "@/styles/tokens";

export interface TrendLine {
  key: string;
  name: string;
  color: string;
}

/**
 * Shared multi-series line chart (station comparison, panel detail).
 * `points` rows carry an `x` label plus one numeric field per line key.
 */
export function TrendChart({
  points,
  lines,
  height = 220,
  unit,
  yDomain,
}: {
  points: Array<Record<string, number | string | undefined>>;
  lines: TrendLine[];
  height?: number;
  unit?: string;
  yDomain?: [number | "auto", number | "auto"];
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid stroke={chart.grid} strokeDasharray="3 6" vertical={false} />
          <XAxis
            dataKey="x"
            tick={{ fill: chart.axis, fontSize: 11 }}
            axisLine={{ stroke: chart.grid }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: chart.axis, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            domain={yDomain ?? ["auto", "auto"]}
            width={52}
            tickFormatter={(v: number) => `${v}${unit ?? ""}`}
          />
          <Tooltip
            contentStyle={{
              background: chart.tooltipBg,
              border: `1px solid ${palette.line}`,
              borderRadius: 10,
              color: palette.text,
              fontSize: 12,
            }}
            labelStyle={{ color: palette.text2, marginBottom: 4 }}
            formatter={(value) => [`${value}${unit ?? ""}`]}
          />
          {lines.length > 1 ? (
            <Legend
              wrapperStyle={{ fontSize: 12, color: palette.text2 }}
              iconType="plainline"
            />
          ) : null}
          {lines.map((l) => (
            <Line
              key={l.key}
              type="monotone"
              dataKey={l.key}
              name={l.name}
              stroke={l.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls
              animationDuration={400}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
