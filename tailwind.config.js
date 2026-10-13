/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        display: ["'Barlow Condensed'", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        // Rouge « course » pour l'accent, gris anthracite pour les surfaces sombres.
        accent: {
          50: "#fff3ef",
          100: "#ffe2d8",
          200: "#ffc0ab",
          300: "#ff9474",
          400: "#ff6a3d",
          500: "#f2481a",
          600: "#d6360c",
          700: "#b12a0c",
          800: "#8d2511",
          900: "#722212",
        },
        asphalte: {
          50: "#f6f7f8",
          100: "#eceef1",
          200: "#d5d9df",
          300: "#b0b7c1",
          400: "#858f9d",
          500: "#667081",
          600: "#515969",
          700: "#424956",
          800: "#2a2f38",
          900: "#1b1f26",
          950: "#111418",
        },
      },
      boxShadow: {
        carte: "0 1px 2px rgb(0 0 0 / 0.06), 0 8px 24px -12px rgb(0 0 0 / 0.18)",
        "carte-survol": "0 2px 4px rgb(0 0 0 / 0.08), 0 20px 40px -16px rgb(0 0 0 / 0.35)",
      },
      keyframes: {
        apparition: { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "none" } },
      },
      animation: { apparition: "apparition .35s ease-out both" },
    },
  },
  plugins: [],
};
