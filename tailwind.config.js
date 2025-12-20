/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: "#0c0c0f",
          muted: "#16161c",
          stroke: "#1f1f29",
          highlight: "#ffffff14",
        },
        copy: {
          DEFAULT: "#e8e8ea",
          muted: "#b8bcc5",  /* Improved contrast - was #9c9ca8 */
        },
        accent: {
          DEFAULT: "#f0473a",
          bright: "#ff6b2c",
          muted: "#c93124",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Impact", "sans-serif"],
        body: ["var(--font-body)", "Inter", "sans-serif"],
      },
      boxShadow: {
        card: "0 10px 30px rgba(0,0,0,0.45)",
      },
      backgroundImage: {
        "noise-light": "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(0,0,0,0.08))",
      },
    },
  },
  plugins: [],
};
