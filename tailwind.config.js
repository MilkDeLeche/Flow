/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      fontFamily: {
        mondwest: ['PPMondwest', 'ui-serif', 'Georgia', 'serif'],
      },
      colors: {
        surface: 'var(--surface)',
        'surface-muted': 'var(--surface-muted)',
        'surface-card': 'var(--surface-card)',
        ink: 'var(--ink)',
        'ink-secondary': 'var(--ink-secondary)',
        'ink-muted': 'var(--ink-muted)',
        line: 'var(--line)',
        'line-strong': 'var(--line-strong)',
        accent: 'var(--accent)',
        'accent-ink': 'var(--accent-ink)',
        highlight: 'var(--highlight)',
        'highlight-strong': 'var(--highlight-strong)',
        background: 'var(--surface)',
        'text-primary': 'var(--ink)',
        'text-secondary': 'var(--ink-secondary)',
        'text-tertiary': 'var(--ink-secondary)',
        'text-muted': 'var(--ink-muted)',
      },
    },
  },
  plugins: [],
};
