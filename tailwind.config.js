/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx}"], // Include all files for Tailwind's purge feature
  theme: {
    extend: {
      colors: {
        customDark: "#242424", // Optional: Your custom dark color
      },
    },
  },
  plugins: [],
};
