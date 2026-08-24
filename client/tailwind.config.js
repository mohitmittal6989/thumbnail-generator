/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          pink: "#ff4fd8",
          purple: "#8b5cf6",
          cyan: "#22d3ee",
          slate: "#0f172a"
        }
      },
      boxShadow: {
        glow: "0 0 40px rgba(255, 79, 216, 0.25)"
      },
      backgroundImage: {
        "hero-radial":
          "radial-gradient(circle at top left, rgba(255,79,216,0.25), transparent 35%), radial-gradient(circle at top right, rgba(139,92,246,0.22), transparent 30%), linear-gradient(180deg, #020617 0%, #0f172a 100%)"
      }
    }
  },
  plugins: []
};
