import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

type Props = Omit<HTMLMotionProps<"div">, "children"> & {
  children: ReactNode;
  glow?: boolean;
  delay?: number;
};

export function GlassCard({
  children,
  className = "",
  glow,
  delay = 0,
  ...rest
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`rounded-2xl glass ${glow ? "shadow-glow" : ""} ${className}`}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
