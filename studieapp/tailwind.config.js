/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Huvudpalett - vibrant och modern
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        // Ämnesfärger - mer mättade med varianter
        svenska: {
          light: '#FF6B9D',
          DEFAULT: '#FF6B9D',
          dark: '#E64980',
        },
        engelska: {
          light: '#4ECDC4',
          DEFAULT: '#44A08D',
          dark: '#3A8B7D',
        },
        matte: {
          light: '#667EEA',
          DEFAULT: '#764BA2',
          dark: '#5B3A7E',
        },
        no: {
          light: '#A8E063',
          DEFAULT: '#56AB2F',
          dark: '#498D26',
        },
        so: {
          light: '#FFB75E',
          DEFAULT: '#ED8F03',
          dark: '#C47503',
        },
        idrott: {
          light: '#FF6B6B',
          DEFAULT: '#EE5A6F',
          dark: '#C44569',
        },
        // Semantiska färger
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
        'gradient-svenska': 'linear-gradient(135deg, #FF6B9D 0%, #E64980 100%)',
        'gradient-engelska': 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
        'gradient-matte': 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
        'gradient-no': 'linear-gradient(135deg, #A8E063 0%, #56AB2F 100%)',
        'gradient-so': 'linear-gradient(135deg, #FFB75E 0%, #ED8F03 100%)',
        'gradient-idrott': 'linear-gradient(135deg, #FF6B6B 0%, #EE5A6F 100%)',
        'gradient-hero': 'linear-gradient(135deg, #667EEA 0%, #764BA2 50%, #F093FB 100%)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
      animation: {
        'confetti': 'confetti 0.5s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'bounce-in': 'bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        confetti: {
          '0%': { transform: 'scale(0) rotate(0deg)', opacity: '0' },
          '50%': { transform: 'scale(1.2) rotate(180deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(360deg)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(102, 126, 234, 0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(102, 126, 234, 0.8)' },
        },
      },
      boxShadow: {
        'glow': '0 0 20px rgba(102, 126, 234, 0.5)',
        'glow-lg': '0 0 40px rgba(102, 126, 234, 0.8)',
      },
    },
  },
  plugins: [],
}
