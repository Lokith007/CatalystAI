import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { GlassCard } from "../components/ui/GlassCard";
import { MetricBar } from "../components/ui/MetricBar";
import { NeonButton } from "../components/ui/NeonButton";
import { useDiscovery } from "../context/DiscoveryContext";
import type { AICandidate } from "../types/discovery";

function bestFlags(rows: AICandidate[]) {
  const act = Math.max(...rows.map((r) => r.predictedActivity));
  const sel = Math.max(...rows.map((r) => r.predictedSelectivity));
  const stab = Math.max(...rows.map((r) => r.predictedStability));
  const conf = Math.max(...rows.map((r) => r.confidence));
  return rows.map((r) => ({
    activity: r.predictedActivity === act,
    selectivity: r.predictedSelectivity === sel,
    stability: r.predictedStability === stab,
    confidence: r.confidence === conf,
  }));
}

export function ComparePage() {
  const { result } = useDiscovery();
  const [selected, setSelected] = useState<string[]>([]);

  const candidates = useMemo(
    () => result?.candidates ?? [],
    [result]
  );

  const selectedRows = useMemo(
    () => candidates.filter((c) => selected.includes(c.id)),
    [candidates, selected]
  );

  const flags = useMemo(
    () => bestFlags(selectedRows),
    [selectedRows]
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return [...prev.slice(1), id];
      return [...prev, id];
    });
  };

  if (!result) {
    return (
      <GlassCard className="mx-auto max-w-lg border-gradient p-8 text-center">
        <p className="text-sm text-zinc-400">
          Run a discovery job from the Discovery tab to unlock side-by-side
          candidate comparison.
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <GlassCard className="border-gradient p-5">
        <h2 className="text-base font-semibold text-white">
          Candidate comparison
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Select up to three AI-generated candidates. Best values per metric are
          highlighted in green; lower confidence is tinted cautiously.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {candidates.map((c) => {
            const on = selected.includes(c.id);
            return (
              <NeonButton
                key={c.id}
                type="button"
                variant={on ? "primary" : "ghost"}
                className="!px-3 !py-1.5 !text-xs"
                onClick={() => toggle(c.id)}
              >
                {c.name}
              </NeonButton>
            );
          })}
        </div>
      </GlassCard>

      {selectedRows.length === 0 ? (
        <GlassCard className="border-dashed border-white/15 p-8 text-center text-sm text-zinc-500">
          Choose at least one candidate to compare.
        </GlassCard>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {selectedRows.map((c, idx) => {
            const f = flags[idx];
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * idx }}
              >
                <GlassCard className="h-full border-gradient p-4">
                  <h3 className="text-sm font-semibold text-white">{c.name}</h3>
                  <p className="mt-1 text-[11px] text-zinc-500">{c.id}</p>
                  <div className="mt-4 space-y-3">
                    <MetricRow
                      label="Activity"
                      value={c.predictedActivity}
                      isBest={f.activity}
                    />
                    <MetricRow
                      label="Selectivity"
                      value={c.predictedSelectivity}
                      isBest={f.selectivity}
                    />
                    <MetricRow
                      label="Stability"
                      value={c.predictedStability}
                      isBest={f.stability}
                    />
                    <MetricRow
                      label="Model confidence"
                      value={c.confidence}
                      isBest={f.confidence}
                    />
                  </div>
                  <div className="mt-4">
                    <MetricBar
                      label="Composite view"
                      value={
                        (c.predictedActivity +
                          c.predictedSelectivity +
                          c.predictedStability) /
                        3
                      }
                    />
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MetricRow({
  label,
  value,
  isBest,
}: {
  label: string;
  value: number;
  isBest: boolean;
}) {
  return (
    <div>
      <div className="flex justify-between text-[11px]">
        <span className="text-zinc-400">{label}</span>
        <span
          className={`tabular-nums font-medium ${
            isBest
              ? "text-emerald-400"
              : value < 58
                ? "text-red-300"
                : "text-zinc-300"
          }`}
        >
          {value}%
          {isBest ? " · best" : ""}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all ${
            isBest
              ? "bg-gradient-to-r from-emerald-400 to-neon-blue"
              : value < 58
                ? "bg-gradient-to-r from-red-500/60 to-red-900/40"
                : "bg-gradient-to-r from-zinc-500/50 to-zinc-700/40"
          }`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
