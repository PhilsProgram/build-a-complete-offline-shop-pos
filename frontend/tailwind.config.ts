import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      colors: {
        ink: '#1f2937',
        paper: '#f7f7f2',
        till: '#0f766e',
        ledger: '#4f46e5',
        warning: '#b45309',
        danger: '#be123c'
      },
      boxShadow: {
        panel: '0 10px 30px rgba(31, 41, 55, 0.08)'
      }
    }
  },
  plugins: []
} satisfies Config;
