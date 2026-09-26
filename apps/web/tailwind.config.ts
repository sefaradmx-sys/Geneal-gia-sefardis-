import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#070a12",
        surface: "#0c1120",
        elevated: "#131a2c",
        line: "#1d2539",
        fg: "#e6e9f2",
        muted: "#8b95ab",
        primary: "#7c5cff",
        accent: "#22d3ee",
        pos: "#34d399",
        neg: "#fb7185",
        neu: "#94a3b8",
        warn: "#fbbf24",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(0,-18px,0) scale(1.04)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        "bar-grow": {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
        dash: {
          "0%": { strokeDashoffset: "1000" },
          "100%": { strokeDashoffset: "0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.45s cubic-bezier(0.22, 1, 0.36, 1) both",
        float: "float 9s ease-in-out infinite",
        shimmer: "shimmer 1.4s linear infinite",
        "bar-grow": "bar-grow 0.8s cubic-bezier(0.22, 1, 0.36, 1) both",
        dash: "dash 2.4s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
