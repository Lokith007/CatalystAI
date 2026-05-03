import { motion } from "framer-motion";

const nodes = [
  { id: "n1", label: "Feed", x: 6, y: 42 },
  { id: "n2", label: "Activation", x: 28, y: 22 },
  { id: "n3", label: "C–C build", x: 52, y: 48 },
  { id: "n4", label: "Oxygenate cut", x: 74, y: 28 },
  { id: "n5", label: "Jet cut", x: 92, y: 44 },
];

const edges = [
  { from: "n1", to: "n2" },
  { from: "n2", to: "n3" },
  { from: "n3", to: "n4" },
  { from: "n4", to: "n5" },
];

export function PathwayFlow() {
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
              key={`${e.from}-${e.to}`}
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
          <g key={n.id}>
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
              fontSize="3.2"
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
