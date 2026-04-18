/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#090f1f",
        panel: "#111a31",
      },
    },
  },
  plugins: [],
}

