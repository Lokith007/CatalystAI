import { motion } from "framer-motion";
import { useMemo } from "react";

interface PathwayFlowProps {
  seed?: number;
  steps?: { label: string; energy: number }[];
}

export function PathwayFlow({ seed = 0, steps }: PathwayFlowProps) {
  const { nodes, edges } = useMemo(() => {
    // Generate pseudo-random perturbation based on seed
    const rand = (i: number) => {
      const x = Math.sin(seed * 9999 + i * 777) * 10000;
      return x - Math.floor(x);
    };

    const baseNodes = steps && steps.length > 0 
      ? steps.map((s, i) => ({
          id: `n${i}`,
          label: s.label,
          // distribute evenly across x axis
          x: 10 + (80 / Math.max(1, steps.length - 1)) * i,
          // energy loosely translates to y axis, but just make it wavy if no steps
          y: 30 + ((i % 2 === 0) ? 10 : -10)
        }))
      : [
          { id: "n1", label: "Feed", x: 6, y: 42 },
          { id: "n2", label: "Activation", x: 28, y: 22 },
          { id: "n3", label: "C–C build", x: 52, y: 48 },
          { id: "n4", label: "Oxygenate cut", x: 74, y: 28 },
          { id: "n5", label: "Jet cut", x: 92, y: 44 },
        ];

    const finalNodes = baseNodes.map((n, i) => {
      // Perturb positions slightly if it's not the first or last node
      const dx = (i > 0 && i < baseNodes.length - 1) ? (rand(i * 5) - 0.5) * 8 : 0;
      const dy = (i > 0 && i < baseNodes.length - 1) ? (rand(i * 5 + 1) - 0.5) * 15 : 0;
      return { ...n, x: Math.max(5, Math.min(95, n.x + dx)), y: Math.max(10, Math.min(50, n.y + dy)) };
    });

    const finalEdges = [];
    for (let i = 0; i < finalNodes.length - 1; i++) {
      finalEdges.push({ from: finalNodes[i].id, to: finalNodes[i+1].id });
    }

    return { nodes: finalNodes, edges: finalEdges };
  }, [seed, steps]);

  return (
    <div className="relative h-[180px] w-full overflow-hidden rounded-xl border border-white/10 bg-ink/50">
      <svg
        className="h-full w-full"
        viewBox="0 0 100 60"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(0,212,255,0.5)" />
            <stop offset="100%" stopColor="rgba(168,85,247,0.6)" />
          </linearGradient>
        </defs>
        {edges.map((e, i) => {
          const a = nodes.find((n) => n.id === e.from)!;
          const b = nodes.find((n) => n.id === e.to)!;
          return (
            <motion.line
              key={`${e.from}-${e.to}-${seed}`} // force re-animate on seed change
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="url(#edgeGrad)"
              strokeWidth={0.7}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.1 * i }}
            />
          );
        })}
        {nodes.map((n, i) => (
          <g key={`${n.id}-${seed}`}>
            <motion.circle
              cx={n.x}
              cy={n.y}
              r={3.2}
              fill="rgba(18,18,26,0.95)"
              stroke="rgba(0,212,255,0.55)"
              strokeWidth={0.5}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.08 * i }}
            />
            <motion.circle
              cx={n.x}
              cy={n.y}
              r={1.6}
              fill="rgba(168,85,247,0.9)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 + 0.06 * i }}
            />
            <text
              x={n.x}
              y={n.y + 8}
              textAnchor="middle"
              fill="#a1a1aa"
              fontSize="2.8"
              fontFamily="Inter, sans-serif"
            >
              {n.label}
            </text>
          </g>
        ))}
      </svg>
      <div className="absolute right-2 top-2 rounded border border-white/10 bg-black/35 px-2 py-0.5 text-[9px] uppercase tracking-wider text-zinc-500">
        Pathway DAG
      </div>
    </div>
  );
}
