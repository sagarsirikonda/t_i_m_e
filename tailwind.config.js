/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#FAFAF9',
        'text-primary': '#1A1A18',
        accent: '#3D3A8C',
        'accent-hover': '#2E2B6B',
        border: '#E8E6DF',
        'speed-neg2': '#1E3A5F',
        'speed-neg1': '#93B4D4',
        'speed-0': '#9E9E8E',
        'speed-pos1': '#E8C87A',
        'speed-pos2': '#B5620A',
        'saved-green': '#2D7A4F',
      },
      fontFamily: {
        serif: ['"DM Serif Display"', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}