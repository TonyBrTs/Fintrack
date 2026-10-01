/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#0a0f1d",
        card: {
          DEFAULT: "#111827",
          subtle: "#161f36",
          dark: "#07090e",
        },
        border: {
          subtle: "rgba(255, 255, 255, 0.06)",
          light: "rgba(255, 255, 255, 0.1)",
        },
        primary: {
          DEFAULT: "#2563eb",
          hover: "#1d4ed8",
          light: "#60a5fa",
        },
        income: {
          DEFAULT: "#10b981",
          light: "#34d399",
        },
        expense: {
          DEFAULT: "#f43f5e",
          light: "#fb7185",
        },
      },
    },
  },
  plugins: [],
};
