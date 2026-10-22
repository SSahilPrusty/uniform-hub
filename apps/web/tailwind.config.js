/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#0A192F",
          "navy-light": "#1E293B",
          blue: "#1E40AF",
          "blue-light": "#3B82F6",
          accent: "#D97706",
          "accent-light": "#FBBF24",
          surface: "#F8FAFC",
        },
      },
    },
  },
  plugins: [],
}
