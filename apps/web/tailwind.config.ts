import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101311",
        panel: "#171c19",
        line: "#2c3330",
        brass: "#e4c27a",
        mist: "#9aa59c",
        pos: "#8fceab",
        neg: "#ef8d84",
      },
      fontFamily: {
        serif: ["Palatino", "Palatino Linotype", "Iowan Old Style", "Georgia", "serif"],
        sans: ["Avenir Next", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
