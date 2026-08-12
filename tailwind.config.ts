import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0B0C12",
        panel: "#111320",
        paper: "#F4F5F7",
        steel: "#9AA0B4",
        line: "rgba(244,245,247,0.10)",
        brand: {
          red: "#C8102E",
          redBright: "#F2233F",
          blue: "#2E3192",
          blueBright: "#5A5FF0",
        },
      },
      fontFamily: {
        display: ["Archivo", "Arial Narrow", "Arial", "sans-serif"],
        sans: ["'IBM Plex Sans'", "Segoe UI", "Helvetica", "Arial", "sans-serif"],
        mono: ["'IBM Plex Mono'", "SFMono-Regular", "Menlo", "monospace"],
      },
      maxWidth: {
        shell: "80rem",
      },
      transitionTimingFunction: {
        power: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
