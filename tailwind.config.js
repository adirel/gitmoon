/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./src/renderer/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0a0e14',
        surface: '#1a1f2e',
        'surface-elevated': '#222836',
        accent: '#00d4ff',
        'accent-purple': '#a78bfa',
        'accent-hover': '#00b8e6',
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        muted: '#6b7280',
        'text-primary': '#f3f4f6',
        'text-secondary': '#9ca3af',
        border: '#2d3748',
        'border-accent': '#00d4ff33',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        lg: '12px',
        md: '8px',
        sm: '4px',
      },
      boxShadow: {
        glow: '0 0 20px rgba(0, 212, 255, 0.3)',
        'glow-sm': '0 0 10px rgba(0, 212, 255, 0.2)',
        'glow-purple': '0 0 20px rgba(167, 139, 250, 0.3)',
      },
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in': 'slideIn 0.2s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      backdropBlur: {
        glass: '12px',
      },
    },
  },
  plugins: [],
};
