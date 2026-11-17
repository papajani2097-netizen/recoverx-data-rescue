import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#080d1b',
        panel: '#101a30',
        electric: '#2878ff',
        violet: '#7657ff',
        success: '#16c784'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Manrope', 'sans-serif']
      }
    }
  },
  plugins: []
} satisfies Config;
