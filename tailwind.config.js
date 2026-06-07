/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mondwest: ['PPMondwest', 'ui-serif', 'Georgia', 'serif'],
      },
      colors: {
        background: '#fefffc',
        'text-primary': '#2c2c2c',
        'text-secondary': '#444141',
        'text-tertiary': '#646464',
        'text-muted': '#b4b8b4',
      },
    },
  },
  plugins: [],
};
