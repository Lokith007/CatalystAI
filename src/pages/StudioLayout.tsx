import { motion } from "framer-motion";
import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/studio", label: "Discovery", end: true },
  { to: "/studio/compare", label: "Compare" },
  { to: "/studio/experiments", label: "Experiments" },
];

export function StudioLayout() {
  return (
    <div className="min-h-screen bg-void">
      <div className="pointer-events-none fixed inset-0 bg-hero-gradient opacity-50" />
      <div className="pointer-events-none fixed inset-0 bg-grid-fade bg-[length:56px_56px] opacity-30" />

      <header className="relative z-20 border-b border-white/10 bg-charcoal/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1920px] flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5">
              <span className="text-sm font-bold text-gradient">C</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white">
                CatalystAI Studio
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500">
                AI Discovery Engine · Sustainable fuels
              </p>
            </div>
          </div>
          <nav className="flex flex-wrap gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                    isActive
                      ? "bg-white/10 text-white shadow-glow-sm"
                      : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <motion.div
          className="h-px bg-gradient-to-r from-transparent via-neon-blue/50 to-transparent"
          layoutId="studioGlow"
        />
      </header>

      <main className="relative z-10 mx-auto max-w-[1920px] px-3 pb-8 pt-4 md:px-5">
        <Outlet />
      </main>
    </div>
  );
}
