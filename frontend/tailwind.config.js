/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        secondary: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
          950: "#042f2e",
        },
        peach: "#F4A261",
        lavender: "#A78BFA",
        green: "#7BC89D",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Playfair Display", "serif"],
        handwritten: ["Caveat", "cursive"],
      },
      boxShadow: {
        card: "0 8px 30px rgba(0,0,0,.05)",
        "card-hover": "0 10px 35px rgba(0,0,0,.08)",
      },
      borderRadius: {
        card: "16px",
        button: "12px",
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
        "skew-scroll": {
          "0%": {
            transform:
              "rotatex(20deg) rotatez(-15deg) skewx(15deg) translatez(0) translatey(0)",
          },
          "100%": {
            transform:
              "rotatex(20deg) rotatez(-15deg) skewx(15deg) translatez(0) translatey(-50%)",
          },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "skew-scroll": "skew-scroll 20s linear infinite",
      },
    },
  },
  plugins: [],
};
