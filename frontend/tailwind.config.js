/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#E4F5EE",
          100: "#C9EBDB",
          200: "#A8DFC5",
          300: "#87D3AF",
          400: "#6DC99E",
          500: "#5CBF9D",
          600: "#4DAF8A",
          700: "#3D786A",
          800: "#2E5C50",
          900: "#1F4036",
          950: "#10241E",
        },
        secondary: {
          50: "#E7F0FF",
          100: "#C8DDFF",
          200: "#A5C7FF",
          300: "#82B0FF",
          400: "#5C96FF",
          500: "#2E7DFF",
          600: "#1A6AE6",
          700: "#0D55C4",
          800: "#0A4096",
          900: "#072C69",
          950: "#03183B",
        },
        peach: "#F8A26B",
        "peach-light": "#FEEEE1",
        purple: "#7C5CFF",
        "purple-light": "#F0ECFF",
        "dark-green": "#3D786A",
      },
      fontFamily: {
        sans: ["Nunito Sans", "system-ui", "sans-serif"],
        heading: ["Playfair Display", "Georgia", "serif"],
        handwritten: ["Caveat", "cursive"],
        brand: ["Caveat Brush", "cursive"],
      },
      boxShadow: {
        card: "0 8px 24px rgba(30,31,34,0.06)",
        "card-hover": "0 8px 30px rgba(30,31,34,0.10)",
      },
      borderRadius: {
        card: "20px",
        button: "999px",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { opacity: "0", transform: "translateX(-10px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
      },
    },
  },
  plugins: [],
};
