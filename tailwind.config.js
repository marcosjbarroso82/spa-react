/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'landscape': {'raw': '(orientation: landscape) and (max-height: 500px)'},
        'mobile-landscape': {'raw': '(orientation: landscape) and (max-height: 600px)'},
      },
    },
  },
  plugins: [],
}
