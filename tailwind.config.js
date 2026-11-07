/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: { center: true, padding: { DEFAULT: '1.25rem', md: '2rem', lg: '3rem' }, screens: { '2xl': '1320px' } },
    extend: {
      colors: {
        ink: { DEFAULT: '#0F0E0C', 900: '#0F0E0C', 800: '#17150F', 700: '#221F18', 600: '#2E2A21' },
        ivory: { DEFAULT: '#F8F4EC', 100: '#FBF9F4', 200: '#F3EDE1', 300: '#E9E0CE' },
        gold: { DEFAULT: '#B8945A', light: '#D9BE8C', pale: '#EADBBE', dark: '#8C6D3B' },
        stone: { 450: '#8A8273' },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Manrope', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      letterSpacing: { luxe: '0.32em' },
      keyframes: {
        kenburns: { '0%': { transform: 'scale(1.0)' }, '100%': { transform: 'scale(1.12)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        scrollcue: { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(200%)' } },
      },
      animation: {
        kenburns: 'kenburns 14s ease-out forwards',
        shimmer: 'shimmer 6s linear infinite',
        scrollcue: 'scrollcue 2.2s cubic-bezier(.6,0,.4,1) infinite',
      },
    },
  },
  plugins: [],
};
