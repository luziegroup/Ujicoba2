/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1B2430",
        inksoft: "#5B6472",
        gold: "#B8892B",
        golddeep: "#8F6A1E",
        teal: "#1F6F64",
        rust: "#A8432D",
        line: "#E2E5EA",
      },
      fontFamily: {
        serif: ["Source Serif 4", "serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
