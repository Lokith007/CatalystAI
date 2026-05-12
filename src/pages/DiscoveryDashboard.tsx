import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { ParetoChart } from "../components/charts/ParetoChart";
import { ReactionEnergyChart } from "../components/charts/ReactionEnergyChart";
import { MoleculeViewer } from "../components/viz/MoleculeViewer";
import { PathwayFlow } from "../components/viz/PathwayFlow";
import { useEffect } from "react";
import { GlassCard } from "../components/ui/GlassCard";
import { MetricBar } from "../components/ui/MetricBar";
import { NeonButton } from "../components/ui/NeonButton";
import { StatusBadge, UncertaintyBadge } from "../components/ui/StatusBadge";
import { TooltipLabel } from "../components/ui/TooltipLabel";
import { useDiscovery } from "../context/DiscoveryContext";
import type { KnownEntity, AICandidate, ParetoPoint } from "../types/discovery";

type TabId = "known" | "ai" | "rank";

const tabs: { id: TabId; label: string; emoji: string }[] = [
  { id: "known", label: "Known Data", emoji: "🧪" },
  { id: "ai", label: "AI Generated", emoji: "✨" },
  { id: "rank", label: "Ranking & Optimization", emoji: "📊" },
];

function CompositionBadges({ composition }: { composition?: Record<string, number> }) {
  if (!composition || Object.keys(composition).length === 0) return null;
  const entries = Object.entries(composition)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {entries.map(([el]) => (
        <span
          key={el}
          className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400"
        >
          {el}
        </span>
      ))}
    </div>
  );
}

export function DiscoveryDashboard() {
  const {
    input,
    setInput,
    reactions,
    result,
    isRunning,
    pipelineStep,
    runDiscovery,
    exportJson,
  } = useDiscovery();
  const [tab, setTab] = useState<TabId>("known");
  const [sortKey, setSortKey] = useState<"yield" | "cost" | "stability">("yield");
  const [selectedCatalystId, setSelectedCatalystId] = useState<string | null>(null);

  useEffect(() => {
    if (result) {
      if (tab === "known" && result.known.length > 0) {
        setSelectedCatalystId(result.known[0].id);
      } else if (tab === "ai" && result.candidates.length > 0) {
        setSelectedCatalystId(result.candidates[0].id);
      } else {
        setSelectedCatalystId(null);
      }
    }
  }, [result, tab]);

  // Find composition of selected entity for MoleculeViewer
  const selectedComposition = useMemo(() => {
    if (!result || !selectedCatalystId) return undefined;
    const known = result.known.find((k) => k.id === selectedCatalystId);
    if (known) return known.composition;
    const candidate = result.candidates.find((c) => c.id === selectedCatalystId);
    if (candidate) return candidate.composition;
    return undefined;
  }, [result, selectedCatalystId]);

  const selectedSeed = useMemo(() => {
    if (!selectedCatalystId) return 0;
    let hash = 0;
    for (let i = 0; i < selectedCatalystId.length; i++) {
      hash = selectedCatalystId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  }, [selectedCatalystId]);

  const dynamicPathwaySteps = useMemo(() => {
    if (!result?.pathwaySteps) return [];
    if (!selectedCatalystId) return result.pathwaySteps;
    return result.pathwaySteps.map((step, i) => {
      const noise = i > 0 && i < result.pathwaySteps.length - 1 ? (selectedSeed % (i * 3 + 5)) - 2 : 0;
      return { ...step, energy: step.energy + noise };
    });
  }, [result, selectedCatalystId, selectedSeed]);

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

  // Reaction dropdown handler
  function handleReactionSelect(reactionId: string) {
    if (reactionId === "") {
      setInput({ reactionId: undefined });
      return;
    }
    const rxn = reactions.find((r) => r.id === reactionId);
    if (!rxn) return;
    setInput({
      reaction: rxn.name,
      reactionId: rxn.id,
      temperatureC: rxn.defaultTempC,
      pressureBar: rxn.defaultPressureBar,
      costWeight: rxn.defaultCostWeight,
      sustainabilityScore: rxn.defaultSustainability,
    });
  }

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
              <p className="text-lg font-semibold text-white">Running AI discovery…</p>
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

        {/* Reaction dropdown (shown when reactions loaded from backend) */}
        {reactions.length > 0 && (
          <div className="mb-3">
            <label className="block text-xs font-medium text-zinc-400">
              Select reaction
            </label>
            <select
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none ring-neon-blue/30 focus:ring-2 appearance-none"
              value={input.reactionId ?? ""}
              onChange={(e) => handleReactionSelect(e.target.value)}
            >
              <option value="">Custom / type below</option>
              {reactions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <label htmlFor="reaction-input" className="block text-xs font-medium text-zinc-400">
          Target reaction
        </label>
        <input
          id="reaction-input"
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none ring-neon-blue/30 focus:ring-2"
          value={input.reaction}
          onChange={(e) => setInput({ reaction: e.target.value, reactionId: undefined })}
        />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="temp-input" className="text-xs text-zinc-400">Temperature (°C)</label>
            <input
              id="temp-input"
              type="number"
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-sm text-white"
              value={input.temperatureC}
              onChange={(e) => setInput({ temperatureC: Number(e.target.value) })}
            />
          </div>
          <div>
            <label htmlFor="pressure-input" className="text-xs text-zinc-400">Pressure (bar)</label>
            <input
              id="pressure-input"
              type="number"
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-sm text-white"
              value={input.pressureBar}
              onChange={(e) => setInput({ pressureBar: Number(e.target.value) })}
            />
          </div>
        </div>
        <div className="mt-3">
          <label htmlFor="cost-range" className="text-xs text-zinc-400">Cost sensitivity (weight)</label>
          <input
            id="cost-range"
            type="range"
            min={0}
            max={100}
            value={input.costWeight}
            onChange={(e) => setInput({ costWeight: Number(e.target.value) })}
            className="mt-1 w-full accent-neon-blue"
          />
          <div className="flex justify-between text-[10px] text-zinc-500">
            <span>Yield-first</span>
            <span>{input.costWeight}</span>
            <span>CAPEX-first</span>
          </div>
        </div>
        <div className="mt-3">
          <label htmlFor="sustainability-range" className="text-xs text-zinc-400">Sustainability score</label>
          <input
            id="sustainability-range"
            type="range"
            min={0}
            max={100}
            value={input.sustainabilityScore}
            onChange={(e) => setInput({ sustainabilityScore: Number(e.target.value) })}
            className="mt-1 w-full accent-neon-purple"
          />
        </div>
        <p className="mt-4 text-xs font-medium uppercase tracking-wider text-zinc-500">Modality</p>
        <div className="mt-2">
          <div className="rounded-lg border border-neon-blue/30 bg-neon-blue/10 px-3 py-2 text-xs font-medium text-neon-blue">
            Chemical catalysis
          </div>
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
          Chemistry-aware pipeline: retrieval from seeded catalyst database,
          3 AI candidates via deterministic mutation strategies, Pareto-aware ranking.
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
                  tab === t.id ? "text-white" : "text-zinc-500 hover:text-zinc-300"
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

            {/* Known catalysts tab */}
            {result && tab === "known" && (
              <div className="grid gap-3 md:grid-cols-2">
                {result.known.map((k: KnownEntity, i) => (
                  <motion.div
                    key={k.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 * i }}
                    onClick={() => setSelectedCatalystId(k.id)}
                    className={`cursor-pointer rounded-xl border p-4 transition-all ${
                      selectedCatalystId === k.id
                        ? "border-neon-blue/60 bg-neon-blue/10 shadow-[0_0_15px_rgba(0,212,255,0.15)]"
                        : "border-white/10 bg-white/[0.03] hover:border-white/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-white">{k.name}</p>
                        <span className="mt-1 inline-block rounded border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
                          {k.type}
                        </span>
                        <CompositionBadges composition={k.composition} />
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-zinc-500">{k.notes}</p>
                    <div className="mt-3 space-y-2">
                      <MetricBar label="Reported activity" value={k.knownActivity} />
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

            {/* AI candidates tab */}
            {result && tab === "ai" && (
              <div className="grid gap-4 lg:grid-cols-2">
                {result.candidates.map((c: AICandidate, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 * i }}
                    onClick={() => setSelectedCatalystId(c.id)}
                    className={`cursor-pointer rounded-xl border p-4 transition-all bg-gradient-to-br from-white/[0.04] to-transparent ${
                      selectedCatalystId === c.id
                        ? "border-neon-purple/60 bg-neon-purple/10 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                        : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-sm font-semibold text-white">{c.name}</h3>
                          <StatusBadge badge={c.badge} />
                          <UncertaintyBadge level={c.uncertainty} />
                        </div>
                        <p className="mt-1 text-[11px] italic text-zinc-400 leading-relaxed">
                          {c.description}
                        </p>
                        <CompositionBadges composition={c.composition} />
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

            {/* Ranking tab */}
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
                            <span className={p.source === "ai" ? "text-neon-purple" : "text-neon-blue"}>
                              {p.source === "ai" ? "AI" : "Known"}
                            </span>
                          </td>
                          <td className="px-3 py-2 tabular-nums text-zinc-300">{p.yield.toFixed(1)}</td>
                          <td className="px-3 py-2 tabular-nums text-zinc-300">{p.cost.toFixed(1)}</td>
                          <td className="px-3 py-2 tabular-nums text-zinc-300">{p.stability.toFixed(1)}</td>
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
          <h2 className="text-sm font-semibold text-white">Visualization panel</h2>
          <p className="text-[11px] text-zinc-500">
            Structure, energetics, and pathway topology.
          </p>
        </div>
        {!result ? (
          <div className="flex min-h-[520px] flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/20 px-6 text-center">
            <p className="text-sm font-medium text-white">No discovery run yet</p>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500">
              Click <span className="text-zinc-300">Run AI Discovery</span> to
              generate a candidate-specific structure preview, reaction energy
              diagram, and pathway flow.
            </p>
          </div>
        ) : (
          <>
            <MoleculeViewer seed={selectedSeed} composition={selectedComposition} />
            <div>
              <p className="mb-2 text-xs font-medium text-zinc-400">Reaction energy diagram</p>
              <ReactionEnergyChart steps={dynamicPathwaySteps} />
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-zinc-400">Pathway flow</p>
              <PathwayFlow seed={selectedSeed} steps={dynamicPathwaySteps} />
            </div>
          </>
        )}
      </GlassCard>
    </div>
  );
}
