import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1a2744",
        panel: "#f5f7fb",
        line: "#d6ddef",
        accent: "#3759bb",
        secondary: "#4a6fa5",
        muted: "#7a9bc7",
        subtle: "#3a5a8a",
        page: "#f7f9fd",
        dark: "#0a1e3d",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 14px 40px rgba(23, 32, 51, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
