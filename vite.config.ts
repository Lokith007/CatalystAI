import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "plotly.js/dist/plotly": "plotly.js-dist-min",
    },
  },
  optimizeDeps: {
    include: ["plotly.js-dist-min", "react-plotly.js", "three"],
  },
});
