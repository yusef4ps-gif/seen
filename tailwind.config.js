/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7fc',
          100: '#e0eff9',
          200: '#bfe0f3',
          300: '#8ec9eb',
          400: '#53ace0',
          500: '#2b8fd0',
          600: '#1d72b2',
          700: '#195a8f',
          800: '#15466f',
          900: '#0f2b48', // Deep Navy from the official SEEN logo
          950: '#081729',
        },
        accent: {
          DEFAULT: '#2dd4bf', // Signature Mint-Cyan / Aquamarine from the SEEN top arc
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        slateDark: {
          800: '#14283e',
          850: '#0f2135',
          900: '#0a1727',
          950: '#060f1b',
        },
        navy: {
          900: '#0f2b48',
          950: '#081729',
        }
      },
      fontFamily: {
        sans: ['var(--font-tajawal)', 'Tajawal', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
