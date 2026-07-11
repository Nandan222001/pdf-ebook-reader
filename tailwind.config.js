/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/renderer/**/*.{js,ts,jsx,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        serif: ['"EB Garamond"', 'Georgia', 'serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      colors: {
        'book-bg': 'rgb(var(--book-bg) / <alpha-value>)',
        'book-surface': 'rgb(var(--book-surface) / <alpha-value>)',
        'book-accent': 'rgb(var(--book-accent) / <alpha-value>)',
        'book-text': 'rgb(var(--book-text) / <alpha-value>)',
        'book-muted': 'rgb(var(--book-muted) / <alpha-value>)',
        'book-border': 'rgb(var(--book-border) / <alpha-value>)',
        'book-highlight': 'rgb(var(--book-highlight) / <alpha-value>)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        'book-open': 'bookOpen 0.5s ease-out',
        'page-curl': 'pageCurl 0.6s ease-in-out',
        'shimmer': 'shimmer 2s linear infinite'
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(20px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        slideRight: { '0%': { transform: 'translateX(-20px)', opacity: '0' }, '100%': { transform: 'translateX(0)', opacity: '1' } },
        bookOpen: { '0%': { transform: 'perspective(1000px) rotateY(-90deg)', opacity: '0' }, '100%': { transform: 'perspective(1000px) rotateY(0deg)', opacity: '1' } },
        pageCurl: { '0%': { transform: 'perspective(1000px) rotateY(0deg)' }, '50%': { transform: 'perspective(1000px) rotateY(-15deg)' }, '100%': { transform: 'perspective(1000px) rotateY(0deg)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } }
      }
    }
  },
  plugins: []
}