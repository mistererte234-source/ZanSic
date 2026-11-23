import animate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        arabic: ['Amiri', 'serif'],
      },
      colors: {
        ios: {
          bg: '#05070f',
          surface: 'rgba(255, 255, 255, 0.05)',
          surfaceHover: 'rgba(255, 255, 255, 0.09)',
          border: 'rgba(255, 255, 255, 0.12)',
          accent: '#FA2D48', // Apple Music Red / Pink
          accentHover: '#FB435B',
          cyan: '#00F0FF',
          purple: '#A855F7',
          blue: '#0A84FF',
        }
      },
      backdropBlur: {
        '3xl': '48px',
        '4xl': '64px',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 18s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [animate],
}
