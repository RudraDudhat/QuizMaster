/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          light: 'var(--color-primary-light)',
          soft: 'var(--color-primary-soft)',
          deep: 'var(--color-primary-deep)',
        },
        secondary: 'var(--color-secondary)',
        success: {
          DEFAULT: 'var(--color-success)',
          soft: 'var(--color-success-soft)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          soft: 'var(--color-warning-soft)',
        },
        danger: {
          DEFAULT: 'var(--color-danger)',
          soft: 'var(--color-danger-soft)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
          soft: 'var(--color-info-soft)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: 'var(--radius-card)',
        btn: 'var(--radius-btn)',
      },
      boxShadow: {
        'brutal-xs': 'var(--shadow-brutal-xs)',
        'brutal-sm': 'var(--shadow-brutal-sm)',
        brutal: 'var(--shadow-brutal)',
        'brutal-lg': 'var(--shadow-brutal-lg)',
        soft: 'var(--shadow-soft)',
        'soft-md': 'var(--shadow-soft-md)',
      },
      transitionTimingFunction: {
        brutal: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
