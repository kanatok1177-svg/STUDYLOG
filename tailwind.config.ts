import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#EEF0E6",
        paperDeep: "#E4E7D9",
        ink: "#223047",
        inkSoft: "#5B6B7A",
        stamp: "#A63D33",
        stampSoft: "#C97267",
        gold: "#B98F2C",
        line: "#D2CDBB",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        card: "14px",
      },
      boxShadow: {
        paper: "0 1px 0 rgba(34,48,71,0.06), 0 8px 24px -12px rgba(34,48,71,0.18)",
      },
      keyframes: {
        stampDown: {
          "0%": { transform: "scale(2.4) rotate(-18deg)", opacity: "0" },
          "55%": { transform: "scale(0.92) rotate(-10deg)", opacity: "1" },
          "75%": { transform: "scale(1.06) rotate(-12deg)" },
          "100%": { transform: "scale(1) rotate(-10deg)", opacity: "1" },
        },
        fadeUp: {
          "0%": { transform: "translateY(6px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        stampDown: "stampDown 420ms cubic-bezier(.2,.9,.3,1.2)",
        fadeUp: "fadeUp 320ms ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
