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
      },
      boxShadow: {
        soft: "0 14px 40px rgba(23, 32, 51, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
