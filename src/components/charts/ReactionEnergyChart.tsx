import { useMemo } from "react";
import type { Data, Layout } from "plotly.js";
import { PlotlyPlot } from "./PlotlyPlot";

type Step = { label: string; energy: number };

export function ReactionEnergyChart({ steps }: { steps: Step[] }) {
  const xs = steps.map((_, i) => i);
  const ys = steps.map((s) => s.energy);
  const labels = steps.map((s) => s.label);

  const data: Data[] = useMemo(
    () => [
      {
        type: "scatter",
        mode: "lines+markers",
        x: xs,
        y: ys,
        text: labels,
        hovertemplate:
          "%{text}<br>Relative energy: %{y:.1f} kJ/mol<sub>rxn</sub> equiv.<extra></extra>",
        line: {
          shape: "spline",
          width: 2,
          color: "rgba(0, 212, 255, 0.85)",
        },
        marker: {
          size: 10,
          color: ys.map((_, i) =>
            i === 0 || i === ys.length - 1
              ? "rgba(251, 146, 60, 0.95)"
              : "rgba(168, 85, 247, 0.95)"
          ),
          line: { color: "rgba(255,255,255,0.4)", width: 1 },
        },
        fill: "tozeroy",
        fillcolor: "rgba(0, 212, 255, 0.08)",
      },
    ],
    [xs, ys, labels]
  );

  const layout: Partial<Layout> = {
    paper_bgcolor: "transparent",
    plot_bgcolor: "rgba(12,12,18,0.5)",
    font: { color: "#a1a1aa", family: "Inter, sans-serif", size: 10 },
    margin: { l: 40, r: 8, t: 8, b: 36 },
    xaxis: {
      title: { text: "Reaction coordinate" },
      tickmode: "linear",
      tick0: 0,
      dtick: 1,
      gridcolor: "rgba(255,255,255,0.06)",
    },
    yaxis: {
      title: { text: "Energy (arb.)" },
      gridcolor: "rgba(255,255,255,0.06)",
    },
  };

  return (
    <div className="h-[200px] w-full rounded-xl border border-white/10 bg-ink/40">
      <PlotlyPlot data={data} layout={layout} style={{ minHeight: 190 }} />
    </div>
  );
}
