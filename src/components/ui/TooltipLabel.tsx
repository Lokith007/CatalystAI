import { motion, AnimatePresence } from "framer-motion";
import { useId, useState } from "react";

type Props = {
  label: string;
  tooltip: string;
  className?: string;
};

export function TooltipLabel({ label, tooltip, className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span className={`relative inline-flex items-center gap-1 ${className}`}>
      <span>{label}</span>
      <button
        type="button"
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/20 text-[10px] text-zinc-400 hover:border-neon-blue/50 hover:text-neon-blue transition-colors"
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        ?
      </button>
      <AnimatePresence>
        {open && (
          <motion.span
            id={id}
            role="tooltip"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border border-white/10 bg-charcoal/95 px-3 py-2 text-xs font-normal text-zinc-300 shadow-glow backdrop-blur-md"
          >
            {tooltip}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
