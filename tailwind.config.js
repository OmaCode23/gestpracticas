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
        navy:          "#3b1822",
        "navy-mid":    "#5a2f3b",
        blue:          "#8f1f3e",
        "blue-light":  "#b33157",
        accent:        "#9f1d3e",
        surface:       "#f8f3ef",
        surface2:      "#efe5df",
        border:        "#dbc8c3",
        "text-mid":    "#6d5a59",
        "text-light":  "#947d7b",
      },
      fontFamily: {
        sans:    ["DM Sans", "sans-serif"],
        display: ["DM Sans", "sans-serif"],
      },
      boxShadow: {
        card:    "0 16px 40px rgba(83, 42, 53, 0.08)",
        "card-lg":"0 22px 56px rgba(83, 42, 53, 0.16)",
      },
    },
  },
  plugins: [],
};
