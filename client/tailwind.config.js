/*
 * CineStream Design Tokens
 *
 * Color class reference (use ONLY these in components):
 *   bg-background, bg-surface, bg-primary, bg-secondary
 *   text-txt, text-txt-muted, text-primary, text-secondary
 *   border-primary, border-secondary, border-surface
 *
 * Never use raw hex values inside components.
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0B0F',
        surface:    '#16161D',
        primary:    '#E63946',
        secondary:  '#C9962C',
        'txt':      '#F5F5F7',
        'txt-muted':'#9B9BA5',
      },
      borderRadius: {
        card:  '6px',
        modal: '10px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
