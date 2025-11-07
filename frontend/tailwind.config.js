/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef4ff',
          100: '#d9e7ff',
          200: '#b6cfff',
          300: '#8db3ff',
          400: '#5f92ff',
          500: '#3b82f6',
          600: '#2f6ae0',
          700: '#2554ba',
          800: '#1f4595',
          900: '#1c3a7a',
        },
        accent: '#22d3ee',
        glass: 'rgba(255,255,255,0.06)'
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
      },
      backdropBlur: {
        xs: '2px'
      },
      fontFamily: {
        inter: ['Inter', 'ui-sans-serif', 'system-ui']
      }
    },
  },
  plugins: [],
}


