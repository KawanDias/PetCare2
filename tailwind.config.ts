import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/pages/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}", "./src/app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { ink: "#F4F5F7", panel: "#FFFFFF", gold: "#B4533A", cream: "#F4F5F7", price: "#9A3412" },
      fontFamily: { sans: ["var(--font-inter)", "Inter", "Arial", "sans-serif"] }
    }
  },
  plugins: []
};

export default config;
