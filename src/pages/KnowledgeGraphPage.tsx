import { motion } from "framer-motion";
import { useMemo } from "react";
import { GlassCard } from "../components/ui/GlassCard";
import { useDiscovery } from "../context/DiscoveryContext";

type NodeT = "catalyst" | "reaction" | "pathway";

type GNode = {
  id: string;
  label: string;
  type: NodeT;
  x: number;
  y: number;
};

const baseNodes: GNode[] = [
  { id: "r1", label: "Ethanol dehydration", type: "reaction", x: 50, y: 18 },
  { id: "c1", label: "Zeolite Brønsted", type: "catalyst", x: 22, y: 42 },
  { id: "c2", label: "Metal oxide tandem", type: "catalyst", x: 78, y: 40 },
  { id: "p1", label: "Guerbet C–C", type: "pathway", x: 35, y: 72 },
  { id: "p2", label: "Hydrogen borrowing", type: "pathway", x: 68, y: 74 },
  { id: "c3", label: "ADH / ALDH stack", type: "catalyst", x: 50, y: 52 },
];

const edges: { a: string; b: string }[] = [
  { a: "c1", b: "r1" },
  { a: "c2", b: "r1" },
  { a: "r1", b: "c3" },
  { a: "c3", b: "p1" },
  { a: "c3", b: "p2" },
  { a: "c1", b: "p1" },
  { a: "c2", b: "p2" },
];

const typeStyle: Record<
  NodeT,
  { stroke: string; fill: string; glyph: string }
> = {
  catalyst: {
    stroke: "rgba(0,212,255,0.7)",
    fill: "rgba(0,212,255,0.12)",
    glyph: "C",
  },
  reaction: {
    stroke: "rgba(251,146,60,0.75)",
    fill: "rgba(251,146,60,0.12)",
    glyph: "R",
  },
  pathway: {
    stroke: "rgba(168,85,247,0.8)",
    fill: "rgba(168,85,247,0.12)",
    glyph: "P",
  },
};

export function KnowledgeGraphPage() {
  const { input, result } = useDiscovery();

  const nodes = useMemo(() => {
    if (!result) return baseNodes;
    const extra: GNode[] = result.candidates.slice(0, 3).map((c, i) => ({
      id: c.id,
      label: c.name.slice(0, 22) + (c.name.length > 22 ? "…" : ""),
      type: "catalyst" as const,
      x: 18 + i * 22,
      y: 88,
    }));
    return [...baseNodes, ...extra];
  }, [result]);

  const edgeList = useMemo(() => {
    const base = [...edges];
    if (result) {
      result.candidates.slice(0, 3).forEach((c) => {
        base.push({ a: "r1", b: c.id });
      });
    }
    return base;
  }, [result]);

  return (
    <div className="space-y-4">
      <GlassCard className="border-gradient p-5">
        <h2 className="text-base font-semibold text-white">
          Knowledge graph
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-zinc-400">
          Live mock graph linking catalysts, central reactions, and downstream
          pathways. New AI candidates attach to the active reaction hub after
          each discovery run:{" "}
          <span className="text-zinc-200">{input.reaction}</span>.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-zinc-500">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-neon-blue" /> Catalyst
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-neon-orange" /> Reaction
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-neon-purple" /> Pathway
          </span>
        </div>
      </GlassCard>

      <GlassCard className="border-gradient overflow-hidden p-0">
        <div className="relative aspect-[16/10] w-full bg-gradient-to-b from-ink/90 to-void">
          <svg
            className="h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="kg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(0,212,255,0.35)" />
                <stop offset="100%" stopColor="rgba(168,85,247,0.35)" />
              </linearGradient>
            </defs>
            {edgeList.map((e, i) => {
              const A = nodes.find((n) => n.id === e.a);
              const B = nodes.find((n) => n.id === e.b);
              if (!A || !B) return null;
              return (
                <motion.line
                  key={`${e.a}-${e.b}-${i}`}
                  x1={A.x}
                  y1={A.y}
                  x2={B.x}
                  y2={B.y}
                  stroke="url(#kg)"
                  strokeWidth={0.35}
                  strokeLinecap="round"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.55 }}
                  transition={{ delay: 0.02 * i }}
                />
              );
            })}
            {nodes.map((n, i) => {
              const s = typeStyle[n.type];
              return (
                <g key={n.id}>
                  <motion.circle
                    cx={n.x}
                    cy={n.y}
                    r={5}
                    fill={s.fill}
                    stroke={s.stroke}
                    strokeWidth={0.4}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.03 * i }}
                  />
                  <text
                    x={n.x}
                    y={n.y + 0.4}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#e4e4e7"
                    fontSize="3.2"
                    fontWeight="600"
                    fontFamily="Inter, sans-serif"
                  >
                    {s.glyph}
                  </text>
                  <text
                    x={n.x}
                    y={n.y + 9}
                    textAnchor="middle"
                    fill="#a1a1aa"
                    fontSize="2.8"
                    fontFamily="Inter, sans-serif"
                  >
                    {n.label}
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 border-t border-white/10 bg-black/40 px-4 py-2 text-[10px] text-zinc-500 backdrop-blur">
            Graph is illustrative — production would bind to your graph DB and
            literature NER pipeline.
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
