import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        void: '#050816',
        deep: '#0D1117',
        glass: '#111827',
        frost: '#182536',
        ultraviolet: '#7C3AED',
        cyan: '#06B6D4',
        gold: '#F59E0B',
        success: '#10B981',
        danger: '#EF4444'
      },
      boxShadow: {
        glow: '0 0 24px rgba(124, 58, 237, 0.28)'
      },
      borderRadius: {
        xl: '16px',
        '2xl': '24px'
      }
    }
  },
  plugins: []
};

export default config;
