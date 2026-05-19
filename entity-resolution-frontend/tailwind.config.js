/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
        display: ['Poppins', 'sans-serif'],
      },
      colors: {
        ink: {
          950: '#f8fafc',
          900: '#f1f5f9',
          800: '#e2e8f0',
          700: '#cbd5e1',
          600: '#94a3b8',
          500: '#64748b',
          400: '#475569',
          300: '#334155',
          200: '#1f2937',
          100: '#111827',
          50:  '#0b1220',
        },
        brand: {
          500: '#5B8FBF',
          400: '#7BAFD4',
          300: '#A8BED0',
          600: '#4f7fa9',
        },
        emerald: {
          500: '#10b981',
          400: '#34d399',
          300: '#6ee7b7',
          600: '#059669',
        },
        amber: {
          500: '#f59e0b',
          400: '#fbbf24',
          300: '#fcd34d',
        },
        rose: {
          500: '#f43f5e',
          400: '#fb7185',
          300: '#fda4af',
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.4s ease forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: 0, transform: 'translateY(12px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
