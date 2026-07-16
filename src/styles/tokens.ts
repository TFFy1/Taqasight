/**
 * Design tokens — single TS source for values that must reach JS (Recharts
 * renders SVG attributes, which cannot resolve CSS var()). The @theme block in
 * src/index.css mirrors these hex values; change them together.
 */
export const palette = {
  bg: "#071C3D",
  bgDeep: "#051225",
  surface: "#0B2A5B",
  surface2: "#123B6E",
  line: "#1E4B85",
  text: "#EAF2FC",
  text2: "#A8BFDC",
  text3: "#7E95B5",
  accent: "#2A7ACB",
  accent2: "#5B9FE3",
  amber: "#F0C42A",
  ok: "#3ECF8E",
  warn: "#F0C42A",
  crit: "#F26D6D",
  info: "#5B9FE3",
  offline: "#5C6F8C",
} as const;

export const chart = {
  grid: "#163A69",
  axis: palette.text3,
  tooltipBg: palette.bgDeep,
  series: [palette.accent2, palette.amber, palette.ok, palette.crit, "#B58BE8", "#4FD8C6"],
} as const;
