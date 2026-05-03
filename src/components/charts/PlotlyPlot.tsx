import Plotly from "plotly.js-dist-min";
import createPlotlyComponent from "react-plotly.js/factory";
import type { ComponentProps } from "react";

const Plot = createPlotlyComponent(Plotly as never);

export type PlotlyPlotProps = ComponentProps<typeof Plot>;

const defaultConfig: PlotlyPlotProps["config"] = {
  responsive: true,
  displayModeBar: true,
  displaylogo: false,
  modeBarButtonsToRemove: ["lasso2d", "select2d"],
};

export function PlotlyPlot(props: PlotlyPlotProps) {
  return (
    <Plot
      config={{ ...defaultConfig, ...props.config }}
      useResizeHandler
      style={{ width: "100%", height: "100%", ...props.style }}
      {...props}
    />
  );
}
