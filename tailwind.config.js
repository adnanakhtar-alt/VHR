/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-body)'],
        display: ['var(--font-display)'],
      },
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#dde6ff',
          200: '#c3d0ff',
          300: '#9fb0ff',
          400: '#7a8bff',
          500: '#5a67fa',
          600: '#4347f0',
          700: '#3835d4',
          800: '#2f2dab',
          900: '#2c2c87',
          950: '#1a1a4e',
        },
        slate: {
          850: '#172033',
        }
      }
    },
  },
  plugins: [],
}
