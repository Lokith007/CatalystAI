import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

type Variant = "primary" | "ghost" | "outline";

type Props = Omit<HTMLMotionProps<"button">, "children"> & {
  children: ReactNode;
  variant?: Variant;
  loading?: boolean;
};

export function NeonButton({
  children,
  variant = "primary",
  loading,
  className = "",
  disabled,
  ...rest
}: Props) {
  const base =
    "relative inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue/60 disabled:opacity-50 disabled:pointer-events-none";

  const styles: Record<Variant, string> = {
    primary:
      "bg-gradient-to-r from-neon-blue/90 to-neon-violet/90 text-void shadow-glow-sm hover:shadow-glow border border-white/10",
    ghost: "bg-white/5 text-zinc-200 hover:bg-white/10 border border-white/10",
    outline:
      "bg-transparent text-zinc-200 border border-neon-blue/40 hover:border-neon-blue hover:bg-neon-blue/10",
  };

  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      className={`${base} ${styles[variant]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </motion.button>
  );
}
