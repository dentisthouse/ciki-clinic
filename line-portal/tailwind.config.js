/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sarabun': ['Sarabun', 'sans-serif'],
      },
      colors: {
        'line': {
          'green': '#00C300',
          'dark-green': '#00A000',
        }
      }
    },
  },
  plugins: [],
}
