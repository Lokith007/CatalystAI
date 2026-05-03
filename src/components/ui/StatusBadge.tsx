import type { PerformanceBadge } from "../../types/discovery";

const map: Record<
  PerformanceBadge,
  { className: string; label: string }
> = {
  High: {
    className:
      "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
    label: "High",
  },
  Medium: {
    className: "border-amber-500/40 bg-amber-500/15 text-amber-200",
    label: "Medium",
  },
  Experimental: {
    className: "border-neon-orange/40 bg-neon-orange/10 text-neon-orange",
    label: "Experimental",
  },
};

export function StatusBadge({ badge }: { badge: PerformanceBadge }) {
  const s = map[badge];
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${s.className}`}
    >
      {s.label}
    </span>
  );
}

export function UncertaintyBadge({
  level,
}: {
  level: "low" | "medium" | "high";
}) {
  const cls =
    level === "low"
      ? "border-neon-blue/40 text-neon-blue bg-neon-blue/10"
      : level === "medium"
        ? "border-amber-400/40 text-amber-200 bg-amber-400/10"
        : "border-neon-purple/50 text-neon-purple bg-neon-purple/10";
  return (
    <span
      className={`rounded-md border px-2 py-0.5 text-[10px] font-medium capitalize ${cls}`}
    >
      {level} uncertainty
    </span>
  );
}
