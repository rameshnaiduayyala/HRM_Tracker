/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        canvas:  '#07090f',
        surface: '#0d1117',
        card:    '#111827',
        'card-alt': '#141a28',
        elevated:'#1a2235',
        dark: {
          bg:     '#07090f',
          card:   '#111827',
          border: 'rgba(255,255,255,0.08)',
        },
        brand: {
          DEFAULT: '#6366f1',
          dim:     '#4f46e5',
          bright:  '#818cf8',
          glow:    'rgba(99,102,241,0.18)',
        },
      },
      borderColor: {
        subtle: 'rgba(255,255,255,0.05)',
        muted:  'rgba(255,255,255,0.08)',
        base:   'rgba(255,255,255,0.10)',
      },
      boxShadow: {
        'glow-indigo': '0 0 24px -4px rgba(99,102,241,0.35), 0 4px 16px rgba(0,0,0,0.4)',
        'glow-violet': '0 0 24px -4px rgba(139,92,246,0.35), 0 4px 16px rgba(0,0,0,0.4)',
        'glow-emerald':'0 0 24px -4px rgba(16,185,129,0.30), 0 4px 16px rgba(0,0,0,0.4)',
        'card':        '0 1px 3px rgba(0,0,0,0.4), 0 1px 24px rgba(0,0,0,0.2)',
        'card-hover':  '0 12px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(99,102,241,0.12)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-mesh':   'radial-gradient(ellipse 80% 50% at 20% -10%, rgba(99,102,241,0.07) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 110%, rgba(139,92,246,0.05) 0%, transparent 55%)',
      },
      animation: {
        'fade-up':    'fadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-in':   'slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer':    'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeUp:     { from: { transform: 'translateY(10px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        slideIn:    { from: { transform: 'translateX(100%)', opacity: 0 }, to: { transform: 'translateX(0)', opacity: 1 } },
        pulseGlow:  { '0%,100%': { boxShadow: '0 0 4px 1px rgba(99,102,241,0.5)' }, '50%': { boxShadow: '0 0 12px 4px rgba(99,102,241,0.8)' } },
        shimmer:    { '0%': { backgroundPosition: '-200% center' }, '100%': { backgroundPosition: '200% center' } },
      },
    },
  },
  plugins: [],
}
