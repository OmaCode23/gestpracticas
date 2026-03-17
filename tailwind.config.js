/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/modules/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy:          "#0f1f3d",
        "navy-mid":    "#1a3260",
        blue:          "#2455c8",
        "blue-light":  "#3b6ef8",
        accent:        "#e8a838",
        surface:       "#f4f6fb",
        surface2:      "#eaedfa",
        border:        "#d8ddef",
        "text-mid":    "#4a5480",
        "text-light":  "#8b93b8",
      },
      fontFamily: {
        sans:    ["DM Sans", "sans-serif"],
        display: ["Playfair Display", "serif"],
      },
      boxShadow: {
        card:    "0 4px 24px rgba(15,31,61,0.10)",
        "card-lg":"0 8px 40px rgba(15,31,61,0.16)",
      },
    },
  },
  plugins: [],
};
