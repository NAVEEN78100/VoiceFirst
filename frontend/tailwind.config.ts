import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)",
        secondary: "var(--secondary)",
        danger: "var(--danger)",
        surface: "var(--surface)",
        "surface-hover": "var(--surface-hover)",
        "text-muted": "var(--text-muted)",
      },
    },
  },
  plugins: [],
};
export default config;
