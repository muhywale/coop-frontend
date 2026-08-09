/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eef7ff",
          100: "#d9edff",
          500: "#2f7ed8",
          600: "#2166b8",
          700: "#1a5296",
        },
      },
    },
  },
  plugins: [],
};
