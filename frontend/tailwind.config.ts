import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          night: "#18264c",
          navy: "#243661",
          copper: "#b7733c",
          gold: "#db9a5b",
          sand: "#f6eee5",
          ink: "#0f172a"
        }
      },
      boxShadow: {
        panel: "0 20px 45px -24px rgba(24, 38, 76, 0.45)"
      },
      backgroundImage: {
        "brand-mesh":
          "radial-gradient(circle at top left, rgba(219,154,91,0.22), transparent 30%), radial-gradient(circle at top right, rgba(36,54,97,0.28), transparent 38%), linear-gradient(135deg, rgba(24,38,76,0.96), rgba(17,24,39,0.98))"
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "sans-serif"],
        display: ["var(--font-sora)", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
