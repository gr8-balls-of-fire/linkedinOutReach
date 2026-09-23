import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef1ff",
          100: "#e0e5ff",
          500: "#4f6ef7",
          600: "#3f57e0",
          700: "#3345b8",
        },
      },
    },
  },
  plugins: [],
};

export default config;
