import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { ParetoChart } from "../components/charts/ParetoChart";
import { ReactionEnergyChart } from "../components/charts/ReactionEnergyChart";
import { MoleculeViewer } from "../components/viz/MoleculeViewer";
import { PathwayFlow } from "../components/viz/PathwayFlow";
import { GlassCard } from "../components/ui/GlassCard";
import { MetricBar } from "../components/ui/MetricBar";
import { NeonButton } from "../components/ui/NeonButton";
import { StatusBadge, UncertaintyBadge } from "../components/ui/StatusBadge";
import { TooltipLabel } from "../components/ui/TooltipLabel";
import { useDiscovery } from "../context/DiscoveryContext";
import type { ParetoPoint } from "../types/discovery";

type TabId = "known" | "ai" | "rank";

const tabs: { id: TabId; label: string; emoji: string }[] = [
  { id: "known", label: "Known Data", emoji: "🧪" },
  { id: "ai", label: "AI Generated", emoji: "✨" },
  { id: "rank", label: "Ranking & Optimization", emoji: "📊" },
];

function StructurePreview({ seed }: { seed: number }) {
  const rot = (seed % 360) + "deg";
  return (
    <div
      className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-neon-blue/10 to-neon-purple/10 shadow-inner"
      style={{ transform: `rotate(${rot})` }}
    >
      <div className="absolute h-10 w-10 rounded-full border-2 border-neon-blue/50 bg-neon-blue/20" />
      <div className="absolute h-6 w-6 translate-x-3 translate-y-2 rounded-full border border-neon-purple/60 bg-neon-purple/25" />
      <div className="absolute h-5 w-5 -translate-x-3 -translate-y-1 rounded-full border border-neon-orange/40 bg-neon-orange/15" />
      <span className="relative z-[1] text-[9px] font-medium uppercase tracking-wider text-zinc-500">
        3D
      </span>
    </div>
  );
}

export function DiscoveryDashboard() {
  const {
    input,
    setInput,
    result,
    isRunning,
    pipelineStep,
    runDiscovery,
    exportJson,
  } = useDiscovery();
  const [tab, setTab] = useState<TabId>("known");
  const [sortKey, setSortKey] = useState<"yield" | "cost" | "stability">(
    "yield"
  );

  const sortedPareto = useMemo(() => {
    if (!result) return [];
    const list = [...result.pareto];
    list.sort((a, b) => {
      if (sortKey === "cost") return a.cost - b.cost;
      if (sortKey === "stability") return b.stability - a.stability;
      return b.yield - a.yield;
    });
    return list;
  }, [result, sortKey]);

  const pipelineLabel =
    pipelineStep === "retrieval"
      ? "Literature & database retrieval…"
      : pipelineStep === "generation"
        ? "Generative models sampling constrained space…"
        : pipelineStep === "prediction"
          ? "Surrogate ensemble predicting performance…"
          : "";

  return (
    <div className="relative flex flex-col gap-4 xl:flex-row xl:items-start">
      <AnimatePresence>
        {isRunning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-md rounded-2xl border border-white/15 bg-charcoal/95 p-8 text-center shadow-glow"
            >
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-neon-blue border-t-transparent" />
              <p className="text-lg font-semibold text-white">
                Running AI discovery…
              </p>
              <p className="mt-2 text-sm text-neon-blue">{pipelineLabel}</p>
              <p className="mt-4 text-xs text-zinc-500">
                Input → Retrieval → Generation → Prediction
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left — inputs */}
      <GlassCard className="w-full shrink-0 border-gradient p-5 xl:sticky xl:top-4 xl:max-w-[340px]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Discovery input</h2>
          <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-zinc-400">
            Constraints
          </span>
        </div>
        <label className="block text-xs font-medium text-zinc-400">
          Target reaction
        </label>
        <input
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none ring-neon-blue/30 focus:ring-2"
          value={input.reaction}
          onChange={(e) => setInput({ reaction: e.target.value })}
        />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-400">Temperature (°C)</label>
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-sm text-white"
              value={input.temperatureC}
              onChange={(e) =>
                setInput({ temperatureC: Number(e.target.value) })
              }
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400">Pressure (bar)</label>
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-sm text-white"
              value={input.pressureBar}
              onChange={(e) =>
                setInput({ pressureBar: Number(e.target.value) })
              }
            />
          </div>
        </div>
        <div className="mt-3">
          <label className="text-xs text-zinc-400">
            Cost sensitivity (weight)
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={input.costWeight}
            onChange={(e) =>
              setInput({ costWeight: Number(e.target.value) })
            }
            className="mt-1 w-full accent-neon-blue"
          />
          <div className="flex justify-between text-[10px] text-zinc-500">
            <span>Yield-first</span>
            <span>{input.costWeight}</span>
            <span>CAPEX-first</span>
          </div>
        </div>
        <div className="mt-3">
          <label className="text-xs text-zinc-400">
            Sustainability score
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={input.sustainabilityScore}
            onChange={(e) =>
              setInput({ sustainabilityScore: Number(e.target.value) })
            }
            className="mt-1 w-full accent-neon-purple"
          />
        </div>
        <p className="mt-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
          Modality
        </p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => setInput({ mode: "catalysis" })}
            className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
              input.mode === "catalysis"
                ? "border-neon-blue/50 bg-neon-blue/15 text-neon-blue"
                : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/20"
            }`}
          >
            Chemical catalysis
          </button>
          <button
            type="button"
            onClick={() => setInput({ mode: "synbio" })}
            className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
              input.mode === "synbio"
                ? "border-neon-purple/50 bg-neon-purple/15 text-neon-purple"
                : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/20"
            }`}
          >
            Synthetic biology
          </button>
        </div>
        <div className="mt-6 flex flex-col gap-2">
          <NeonButton
            className="w-full !py-3"
            loading={isRunning}
            disabled={isRunning}
            onClick={() => void runDiscovery()}
          >
            Run AI Discovery
          </NeonButton>
          <NeonButton
            variant="ghost"
            className="w-full !py-2 text-xs"
            onClick={exportJson}
            disabled={!result}
          >
            Export for Lab Testing
          </NeonButton>
        </div>
        <p className="mt-4 text-[11px] leading-relaxed text-zinc-500">
          Simulated pipeline: retrieval from a mock knowledge base, five
          generative candidates, ensemble prediction, and Pareto-aware ranking.
        </p>
      </GlassCard>

      {/* Center — results */}
      <div className="min-w-0 flex-1 space-y-4">
        <GlassCard className="border-gradient p-0 overflow-hidden">
          <div className="flex border-b border-white/10 bg-black/20">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`relative flex-1 px-3 py-3 text-left text-xs font-medium transition-colors md:text-sm ${
                  tab === t.id
                    ? "text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <span className="mr-1.5">{t.emoji}</span>
                {t.label}
                {tab === t.id && (
                  <motion.span
                    layoutId="tabline"
                    className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-gradient-to-r from-neon-blue to-neon-purple"
                  />
                )}
              </button>
            ))}
          </div>
          <div className="p-4 md:p-5">
            {!result && (
              <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/20 text-center">
                <p className="text-sm text-zinc-400">
                  Configure constraints, then run discovery to populate known
                  entities, AI candidates, and Pareto analytics.
                </p>
              </div>
            )}
            {result && tab === "known" && (
              <div className="grid gap-3 md:grid-cols-2">
                {result.known.map((k, i) => (
                  <motion.div
                    key={k.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 * i }}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {k.name}
                        </p>
                        <span className="mt-1 inline-block rounded border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
                          {k.type}
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-zinc-500">{k.notes}</p>
                    <div className="mt-3 space-y-2">
                      <MetricBar
                        label="Reported activity"
                        value={k.knownActivity}
                      />
                      <MetricBar
                        label="Selectivity proxy"
                        value={k.knownSelectivity}
                        colorClass="from-neon-purple to-neon-violet"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            {result && tab === "ai" && (
              <div className="grid gap-4 lg:grid-cols-2">
                {result.candidates.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 * i }}
                    className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-4"
                  >
                    <div className="flex gap-4">
                      <StructurePreview seed={i * 47 + c.name.length} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-sm font-semibold text-white">
                            {c.name}
                          </h3>
                          <StatusBadge badge={c.badge} />
                          <UncertaintyBadge level={c.uncertainty} />
                        </div>
                        <p className="mt-2 text-[11px] text-zinc-500">
                          Confidence {c.confidence}%
                          {c.activeLearningHint && (
                            <span className="mt-1 block text-neon-orange">
                              {c.activeLearningHint}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <TooltipLabel
                          label="Activity"
                          tooltip="Relative turnover or space–time yield vs. pilot baseline (0–100%)."
                        />
                      </div>
                      <MetricBar label="" value={c.predictedActivity} />
                      <TooltipLabel
                        label="Selectivity"
                        tooltip="Fraction of carbon flowing to desired product vs. light byproducts."
                        className="text-[11px] text-zinc-500"
                      />
                      <MetricBar
                        label=""
                        value={c.predictedSelectivity}
                        colorClass="from-neon-purple to-neon-blue"
                      />
                      <TooltipLabel
                        label="Stability"
                        tooltip="Projected deactivation resistance: sintering, coking, or enzyme half-life proxy."
                        className="text-[11px] text-zinc-500"
                      />
                      <MetricBar
                        label=""
                        value={c.predictedStability}
                        colorClass="from-neon-orange to-neon-purple"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            {result && tab === "rank" && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-zinc-500">Sort by</span>
                  {(
                    [
                      ["yield", "Yield"],
                      ["cost", "Cost"],
                      ["stability", "Stability"],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSortKey(key)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                        sortKey === key
                          ? "border-neon-blue/40 bg-neon-blue/10 text-neon-blue"
                          : "border-white/10 text-zinc-400 hover:border-white/20"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <ParetoChart points={result.pareto} />
                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full min-w-[520px] text-left text-xs">
                    <thead className="bg-black/40 text-zinc-500">
                      <tr>
                        <th className="px-3 py-2 font-medium">Name</th>
                        <th className="px-3 py-2 font-medium">Source</th>
                        <th className="px-3 py-2 font-medium">Yield</th>
                        <th className="px-3 py-2 font-medium">Cost</th>
                        <th className="px-3 py-2 font-medium">Stability</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedPareto.map((p: ParetoPoint) => (
                        <tr
                          key={p.id}
                          className="border-t border-white/5 hover:bg-white/[0.03]"
                        >
                          <td className="px-3 py-2 text-zinc-200">{p.name}</td>
                          <td className="px-3 py-2">
                            <span
                              className={
                                p.source === "ai"
                                  ? "text-neon-purple"
                                  : "text-neon-blue"
                              }
                            >
                              {p.source === "ai" ? "AI" : "Known"}
                            </span>
                          </td>
                          <td className="px-3 py-2 tabular-nums text-zinc-300">
                            {p.yield.toFixed(1)}
                          </td>
                          <td className="px-3 py-2 tabular-nums text-zinc-300">
                            {p.cost.toFixed(1)}
                          </td>
                          <td className="px-3 py-2 tabular-nums text-zinc-300">
                            {p.stability.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Right — viz */}
      <GlassCard className="w-full shrink-0 space-y-4 border-gradient p-4 xl:sticky xl:top-4 xl:max-w-[380px]">
        <div>
          <h2 className="text-sm font-semibold text-white">
            Visualization panel
          </h2>
          <p className="text-[11px] text-zinc-500">
            Structure, energetics, and pathway topology (mock).
          </p>
        </div>
        <MoleculeViewer />
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-400">
            Reaction energy diagram
          </p>
          {result ? (
            <ReactionEnergyChart steps={result.pathwaySteps} />
          ) : (
            <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/20 text-xs text-zinc-500">
              Run discovery to synthesize a pathway profile.
            </div>
          )}
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-400">
            Pathway flow
          </p>
          <PathwayFlow />
        </div>
      </GlassCard>
    </div>
  );
}
