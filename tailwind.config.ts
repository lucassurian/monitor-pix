import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta do Monitor Pix: base neutra escura + verde "Pix" como acento de confirmação
        ink: {
          950: "#0B0F0E",
          900: "#101614",
          800: "#171F1D",
          700: "#212B28",
          600: "#324039",
        },
        paper: {
          50: "#F6F7F4",
          100: "#ECEEE8",
        },
        pix: {
          500: "#32BCAD", // verde-azulado característico do Pix
          600: "#259488",
          400: "#5FD3C6",
        },
        amber: {
          500: "#E2A33D",
        },
        coral: {
          500: "#E2604F",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  plugins: [],
};
export default config;
