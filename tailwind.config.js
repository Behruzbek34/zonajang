/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0a0a0f',
          surface: '#111118',
          elevated: '#1a1a28',
          border: '#1e1e2e',
        },
        neon: {
          purple: '#6366f1',
          cyan: '#22d3ee',
          amber: '#f59e0b',
          green: '#10b981',
          red: '#ef4444',
          pink: '#ec4899',
        },
        text: {
          primary: '#f8fafc',
          secondary: '#94a3b8',
          muted: '#475569',
        },
      },
      fontFamily: {
        game: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neon-purple': '0 0 20px rgba(99, 102, 241, 0.4)',
        'neon-cyan': '0 0 20px rgba(34, 211, 238, 0.4)',
        'neon-green': '0 0 20px rgba(16, 185, 129, 0.4)',
        'neon-red': '0 0 20px rgba(239, 68, 68, 0.4)',
        'neon-amber': '0 0 20px rgba(245, 158, 11, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'capture-ring': 'captureRing 1.5s ease-out forwards',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(99,102,241,0.3)' },
          '100%': { boxShadow: '0 0 25px rgba(99,102,241,0.8)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        captureRing: {
          '0%': { transform: 'scale(0.5)', opacity: '1' },
          '100%': { transform: 'scale(3)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
