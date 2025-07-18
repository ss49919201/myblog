/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        retro: {
          cream: '#FFF8DC',
          orange: '#FF6B35',
          brown: '#8B4513',
          yellow: '#FFD700',
          green: '#228B22',
          blue: '#4169E1',
          purple: '#8A2BE2',
          pink: '#FF1493',
          dark: '#2F1B14',
        }
      },
      fontFamily: {
        'mono': ['Courier New', 'monospace'],
        'retro': ['Georgia', 'serif'],
      },
      boxShadow: {
        'retro': '4px 4px 0px 0px rgba(0,0,0,0.8)',
        'retro-inset': 'inset 2px 2px 4px rgba(0,0,0,0.3)',
        'retro-sm': '2px 2px 0px 0px rgba(0,0,0,0.8)',
      },
      animation: {
        'blink': 'blink 1s linear infinite',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
    },
  },
  plugins: [],
}