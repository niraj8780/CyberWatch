/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark mode surfaces
        surface: {
          950: '#050810',
          900: '#080c14',
          800: '#0d1117',
          700: '#111620',
          600: '#161c28',
          500: '#1a2235',
          400: '#1f2a3f',
        },
        // Neon green accent (from reference)
        neon: {
          500: '#00ff88',
          400: '#1aff94',
          300: '#33ffa0',
          200: '#66ffb8',
          600: '#00cc6e',
          700: '#009950',
          glow: 'rgba(0,255,136,0.25)',
        },
        // Light mode surfaces
        light: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
        },
      },
      boxShadow: {
        'neon-sm': '0 0 8px rgba(0,255,136,0.3)',
        'neon-md': '0 0 16px rgba(0,255,136,0.3)',
        'neon-lg': '0 0 30px rgba(0,255,136,0.25)',
        'neon-xl': '0 0 50px rgba(0,255,136,0.2)',
        'card-dark': '0 4px 24px rgba(0,0,0,0.5)',
        'card-light': '0 4px 24px rgba(0,0,0,0.08)',
      },
      animation: {
        'pulse-neon': 'pulse-neon 2s ease-in-out infinite',
        'glow-line': 'glow-line 3s ease-in-out infinite',
      },
      keyframes: {
        'pulse-neon': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 8px rgba(0,255,136,0.4)' },
          '50%': { opacity: '0.8', boxShadow: '0 0 20px rgba(0,255,136,0.7)' },
        },
      },
    },
  },
  plugins: [],
};
