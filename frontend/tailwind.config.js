/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0a0e1a',
          800: '#111827',
          700: '#1a1f2e',
          600: '#242b3d',
          500: '#2d3548',
        },
        cyber: {
          cyan: '#06b6d4',
          teal: '#22d3ee',
          blue: '#3b82f6',
        },
      },
    },
  },
  plugins: [],
};
