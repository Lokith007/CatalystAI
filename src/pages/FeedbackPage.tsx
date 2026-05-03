import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import type { Data, Layout } from "plotly.js";
import { PlotlyPlot } from "../components/charts/PlotlyPlot";
import { GlassCard } from "../components/ui/GlassCard";
import { NeonButton } from "../components/ui/NeonButton";
import { useDiscovery } from "../context/DiscoveryContext";

export function FeedbackPage() {
  const { result, submitFeedback, modelConfidence, lastFeedbackDelta } =
    useDiscovery();
  const [candidateId, setCandidateId] = useState("");
  const [actualYield, setActualYield] = useState(72);
  const [actualSelectivity, setActualSelectivity] = useState(70);
  const [actualStability, setActualStability] = useState(68);

  const candidate = useMemo(
    () => result?.candidates.find((c) => c.id === candidateId),
    [result, candidateId]
  );

  const chartData: Data[] = useMemo(() => {
    if (!candidate) return [];
    return [
      {
        type: "bar",
        name: "Predicted",
        x: ["Activity", "Selectivity", "Stability"],
        y: [
          candidate.predictedActivity,
          candidate.predictedSelectivity,
          candidate.predictedStability,
        ],
        marker: { color: "rgba(0, 212, 255, 0.85)" },
      },
      {
        type: "bar",
        name: "Actual (bench)",
        x: ["Activity", "Selectivity", "Stability"],
        y: [actualYield, actualSelectivity, actualStability],
        marker: { color: "rgba(168, 85, 247, 0.9)" },
      },
    ];
  }, [candidate, actualYield, actualSelectivity, actualStability]);

  const errors = useMemo(() => {
    if (!candidate) return null;
    return {
      activity: actualYield - candidate.predictedActivity,
      selectivity: actualSelectivity - candidate.predictedSelectivity,
      stability: actualStability - candidate.predictedStability,
    };
  }, [candidate, actualYield, actualSelectivity, actualStability]);

  const layout: Partial<Layout> = {
    barmode: "group",
    paper_bgcolor: "transparent",
    plot_bgcolor: "rgba(12,12,18,0.5)",
    font: { color: "#a1a1aa", family: "Inter, sans-serif", size: 11 },
    margin: { l: 40, r: 16, t: 24, b: 40 },
    legend: { orientation: "h", y: 1.08, bgcolor: "transparent" },
    xaxis: { gridcolor: "rgba(255,255,255,0.06)" },
    yaxis: {
      title: { text: "Score (%)" },
      gridcolor: "rgba(255,255,255,0.06)",
      range: [0, 100],
    },
  };

  if (!result) {
    return (
      <GlassCard className="mx-auto max-w-lg border-gradient p-8 text-center">
        <p className="text-sm text-zinc-400">
          Complete a discovery run, then log bench results to close the learning
          loop.
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <GlassCard className="border-gradient p-5">
        <h2 className="text-base font-semibold text-white">
          Experiment feedback
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Ground-truth measurements update calibration heads and active-learning
          acquisition (simulated).
        </p>
        <label className="mt-5 block text-xs font-medium text-zinc-400">
          Candidate
        </label>
        <select
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          value={candidateId}
          onChange={(e) => setCandidateId(e.target.value)}
        >
          <option value="">Select candidate…</option>
          {result.candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field
            label="Actual yield / activity"
            value={actualYield}
            onChange={setActualYield}
          />
          <Field
            label="Actual selectivity"
            value={actualSelectivity}
            onChange={setActualSelectivity}
          />
          <Field
            label="Actual stability"
            value={actualStability}
            onChange={setActualStability}
          />
        </div>
        <NeonButton
          className="mt-6 w-full"
          disabled={!candidate}
          onClick={() => {
            if (!candidate) return;
            submitFeedback({
              candidateId: candidate.id,
              actualYield,
              actualSelectivity,
              actualStability,
            });
          }}
        >
          Update Model
        </NeonButton>
        <AnimatePresence>
          {lastFeedbackDelta != null && (
            <motion.div
              key={modelConfidence}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center text-sm font-medium text-emerald-300"
            >
              Model confidence improved +{lastFeedbackDelta}%
            </motion.div>
          )}
        </AnimatePresence>
        <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-zinc-400">
          <span className="text-zinc-300">Aggregate model confidence:</span>{" "}
          <span className="font-semibold text-neon-blue">
            {modelConfidence}%
          </span>
        </div>
      </GlassCard>

      <GlassCard className="border-gradient p-5">
        <h3 className="text-sm font-semibold text-white">
          Predicted vs actual
        </h3>
        {!candidate ? (
          <p className="mt-4 text-sm text-zinc-500">
            Select a candidate to visualize error structure.
          </p>
        ) : (
          <>
            <div className="mt-3 h-[280px] w-full">
              <PlotlyPlot data={chartData} layout={layout} />
            </div>
            {errors && (
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px]">
                <ErrorPill label="Δ Activity" value={errors.activity} />
                <ErrorPill label="Δ Selectivity" value={errors.selectivity} />
                <ErrorPill label="Δ Stability" value={errors.stability} />
              </div>
            )}
          </>
        )}
      </GlassCard>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <label className="text-xs text-zinc-400">{label}</label>
      <input
        type="number"
        min={0}
        max={100}
        className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-sm text-white"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function ErrorPill({ label, value }: { label: string; value: number }) {
  const bad = Math.abs(value) > 8;
  return (
    <div
      className={`rounded-lg border px-2 py-2 ${
        bad
          ? "border-red-500/30 bg-red-500/10 text-red-300"
          : "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
      }`}
    >
      <div className="text-[10px] uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className="mt-1 font-mono text-sm">
        {value > 0 ? "+" : ""}
        {value.toFixed(1)}
      </div>
    </div>
  );
}
