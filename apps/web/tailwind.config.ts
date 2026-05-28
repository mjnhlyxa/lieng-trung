import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "bg-page": "#0d1117",
        "bg-surface": "#161b22",
        "bg-elevated": "#21262d",
        "bg-table": "#1a3320",
        "accent-primary": "#10b981",
        "accent-gold": "#f59e0b",
        "card-back": "#1e3a5f",
      },
      fontFamily: {
        display: ["Outfit", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
