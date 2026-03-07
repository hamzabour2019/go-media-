import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    { pattern: /^(bg|text|border|ring|focus:ring|focus:border|hover:bg|hover:text)-accent(-(soft|second))?(\/50)?$/ },
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-rubik)", "system-ui", "sans-serif"],
        arabic: ["var(--font-cairo)", "system-ui", "sans-serif"],
      },
      colors: {
        /* GO Accent-first theme (primary UI = accent) */
        accent: {
          DEFAULT: "var(--accent)",
          soft: "var(--accent-soft)",
          "soft-hover": "var(--accent-soft-hover)",
          second: "var(--accent-2)",
        },
        /* Legacy / semantic */
        "go-dark": "var(--bg)",
        "go-glass": "var(--surface)",
        "go-glass-border": "var(--border)",
        surface: "var(--surface)",
        border: "var(--border)",
        muted: "var(--muted)",
        ring: "var(--ring)",
        danger: "var(--danger)",
        warning: "var(--warning)",
        success: "var(--success)",
      },
      backgroundImage: {
        "go-gradient": "var(--bg-gradient)",
        "go-gradient-card": "linear-gradient(135deg, var(--accent-soft) 0%, rgba(0, 150, 255, 0.05) 100%)",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.2)",
        "ring-accent": "0 0 0 3px var(--accent-soft)",
      },
      ringColor: {
        accent: "var(--ring)",
      },
      transitionDuration: {
        DEFAULT: "200ms",
      },
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
