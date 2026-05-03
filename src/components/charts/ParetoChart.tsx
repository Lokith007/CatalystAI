import { useMemo } from "react";
import type { Data, Layout } from "plotly.js";
import type { ParetoPoint } from "../../types/discovery";
import { PlotlyPlot } from "./PlotlyPlot";

type Props = {
  points: ParetoPoint[];
};

export function ParetoChart({ points }: Props) {
  const knownPts = useMemo(
    () => points.filter((p) => p.source === "known"),
    [points]
  );
  const aiPts = useMemo(() => points.filter((p) => p.source === "ai"), [points]);

  const data: Data[] = useMemo(
    () => [
      {
        type: "scatter",
        mode: "markers",
        name: "Known data",
        x: knownPts.map((p) => p.cost),
        y: knownPts.map((p) => p.yield),
        text: knownPts.map((p) => p.name),
        marker: {
          size: knownPts.map((p) => 8 + p.stability * 0.12),
          color: "rgba(0, 212, 255, 0.85)",
          line: { color: "rgba(255,255,255,0.35)", width: 1 },
        },
        customdata: knownPts.map((p) => p.id),
      },
      {
        type: "scatter",
        mode: "markers",
        name: "AI candidates",
        x: aiPts.map((p) => p.cost),
        y: aiPts.map((p) => p.yield),
        text: aiPts.map((p) => p.name),
        marker: {
          size: aiPts.map((p) => 9 + p.stability * 0.1),
          color: "rgba(168, 85, 247, 0.9)",
          symbol: "diamond",
          line: { color: "rgba(255,255,255,0.3)", width: 1 },
        },
        customdata: aiPts.map((p) => p.id),
      },
    ],
    [knownPts, aiPts]
  );

  const layout: Partial<Layout> = useMemo(
    () => ({
      paper_bgcolor: "transparent",
      plot_bgcolor: "rgba(12,12,18,0.6)",
      font: { color: "#a1a1aa", family: "Inter, sans-serif", size: 11 },
      margin: { l: 48, r: 16, t: 28, b: 44 },
      showlegend: true,
      legend: {
        orientation: "h",
        yanchor: "bottom",
        y: 1.02,
        x: 0,
        bgcolor: "transparent",
      },
      xaxis: {
        title: { text: "Cost index (lower is better)" },
        gridcolor: "rgba(255,255,255,0.06)",
        zerolinecolor: "rgba(255,255,255,0.1)",
      },
      yaxis: {
        title: { text: "Predicted yield proxy" },
        gridcolor: "rgba(255,255,255,0.06)",
        zerolinecolor: "rgba(255,255,255,0.1)",
      },
      annotations: [
        {
          text: "Approximate Pareto front — trade-offs between cost & yield",
          xref: "paper",
          yref: "paper",
          x: 0.5,
          y: -0.22,
          showarrow: false,
          font: { size: 10, color: "#71717a" },
        },
      ],
    }),
    []
  );

  return (
    <div className="h-[280px] w-full min-h-[220px] rounded-xl border border-white/10 bg-ink/40 p-1">
      <PlotlyPlot
        data={data}
        layout={layout}
        className="h-full w-full"
        style={{ minHeight: 260 }}
      />
    </div>
  );
}
