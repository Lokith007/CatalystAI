import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ParticleField } from "../components/landing/ParticleField";
import { NeonButton } from "../components/ui/NeonButton";
import { GlassCard } from "../components/ui/GlassCard";

const features = [
  {
    title: "Generative AI",
    body: "Propose novel catalyst scaffolds and enzyme variants constrained by your process window.",
    icon: "✨",
  },
  {
    title: "Performance prediction",
    body: "Activity, selectivity, and stability estimates with calibrated uncertainty bands.",
    icon: "📈",
  },
  {
    title: "Closed-loop learning",
    body: "Bench results tighten the model — every experiment sharpens the next design wave.",
    icon: "🔁",
  },
  {
    title: "Visual analytics",
    body: "Pareto trade-offs, energy profiles, and pathway graphs for fast team alignment.",
    icon: "🧬",
  },
];

export function Landing() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden bg-void">
      <div className="pointer-events-none absolute inset-0 bg-hero-gradient" />
      <div className="pointer-events-none absolute inset-0 bg-grid-fade bg-[length:48px_48px]" />

      <div className="absolute inset-0 opacity-40">
        <ParticleField />
      </div>

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 shadow-glow-sm">
            <span className="text-lg font-bold text-gradient">C</span>
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight text-white">
              CatalystAI
            </p>
            <p className="text-[11px] uppercase tracking-widest text-zinc-500">
              Discovery Engine
            </p>
          </div>
        </div>
        <NeonButton
          type="button"
          variant="outline"
          className="!py-2 !px-4 text-xs"
          onClick={() => navigate("/studio")}
        >
          Enter Studio
        </NeonButton>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-8 md:pt-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl"
        >
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-neon-blue/25 bg-neon-blue/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-neon-blue">
            Sustainable fuels · Deep tech R&amp;D
          </p>
          <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-white md:text-6xl md:leading-[1.08]">
            Accelerate{" "}
            <span className="text-gradient">Sustainable Fuel Discovery</span>{" "}
            with AI
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-zinc-400 md:text-xl">
            A research-grade copilot for catalyst, enzyme, and pathway discovery —
            from literature-scale retrieval to generative candidates, multi-objective
            ranking, and experiment-informed model updates.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <NeonButton
              type="button"
              className="!px-8 !py-3 text-base"
              onClick={() => navigate("/studio")}
            >
              Start Discovery
            </NeonButton>
            <p className="text-sm text-zinc-500">
              Mock intelligence · investor-ready UX
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mt-16 grid gap-4 md:grid-cols-3"
        >
          {[
            {
              t: "Slow iteration",
              d: "Wet-lab cycles are long; hypotheses compete for scarce reactor time.",
            },
            {
              t: "Huge search space",
              d: "Compositional degrees of freedom explode — humans alone cannot span it.",
            },
            {
              t: "Fragmented knowledge",
              d: "Papers, patents, and internal logs rarely sit in one optimizable surface.",
            },
          ].map((item, i) => (
            <GlassCard
              key={item.t}
              delay={0.05 * i}
              className="border-gradient p-5"
            >
              <h3 className="text-sm font-semibold text-white">{item.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {item.d}
              </p>
            </GlassCard>
          ))}
        </motion.div>

        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-20 text-center text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500"
        >
          Platform capabilities
        </motion.h2>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {features.map((f, i) => (
            <GlassCard
              key={f.title}
              delay={0.04 * i}
              glow={i === 0}
              className="group p-6 transition-shadow hover:shadow-glow"
            >
              <div className="flex items-start gap-4">
                <span className="text-2xl opacity-90">{f.icon}</span>
                <div>
                  <h3 className="text-base font-semibold text-white group-hover:text-neon-blue transition-colors">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    {f.body}
                  </p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-20 flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-gradient-to-br from-slate/80 to-charcoal/90 p-10 text-center shadow-glow"
        >
          <p className="max-w-lg text-sm text-zinc-400">
            The loop is explicit:{" "}
            <span className="text-zinc-200">
              constraints → retrieval → generation → prediction → decision →
              experiment → feedback → retrain
            </span>
            . Built for teams who ship molecules, not slides.
          </p>
          <NeonButton type="button" onClick={() => navigate("/studio")}>
            Open Discovery Studio
          </NeonButton>
        </motion.div>
      </main>

      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-xs text-zinc-600">
        CatalystAI prototype — design for hackathon &amp; pitch demos.
      </footer>
    </div>
  );
}
