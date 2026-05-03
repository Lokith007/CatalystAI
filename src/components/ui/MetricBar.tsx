import { motion } from "framer-motion";

type Props = {
  label: string;
  value: number;
  colorClass?: string;
};

export function MetricBar({
  label,
  value,
  colorClass = "from-neon-blue to-neon-purple",
}: Props) {
  const v = Math.max(0, Math.min(100, value));
  const showHeader = label.trim().length > 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px] text-zinc-400">
        {showHeader ? <span>{label}</span> : <span />}
        <span className="tabular-nums text-zinc-200">{v}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${colorClass}`}
          initial={{ width: 0 }}
          animate={{ width: `${v}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
