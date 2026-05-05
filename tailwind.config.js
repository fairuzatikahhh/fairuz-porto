/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['"DM Serif Display"', 'serif'],
      },
      colors: {
        pink: { DEFAULT: '#E8417B', light: '#FF6B9D', dark: '#C2305E' },
        dark: { DEFAULT: '#141414', card: '#1E1E1E', border: '#2A2A2A' },
      },
    },
  },
  plugins: [],
}
