/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#050508",
        charcoal: "#0c0c12",
        slate: "#12121a",
        ink: "#1a1a24",
        neon: {
          blue: "#00d4ff",
          purple: "#a855f7",
          violet: "#7c3aed",
          orange: "#fb923c",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        display: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
        glow: "0 0 40px rgba(0, 212, 255, 0.15), 0 0 80px rgba(168, 85, 247, 0.08)",
        "glow-sm": "0 0 20px rgba(0, 212, 255, 0.2)",
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to bottom, transparent, #050508), linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
        "hero-gradient":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0, 212, 255, 0.15), transparent), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(168, 85, 247, 0.12), transparent)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
    },
  },
  plugins: [],
};
