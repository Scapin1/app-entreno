/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'display': ['Space Grotesk', 'sans-serif'],
        'body': ['Manrope', 'sans-serif'],
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        kinetic: {
          // Primary - Neon lime/green (#DFFF00)
          "primary": "#DFFF00",
          "primary-content": "#3f4900",
          "primary-container": "#cdea00",
          "primary-container-content": "#505d00",
          // Secondary - Orange (#FF6D00)
          "secondary": "#FF6D00",
          "secondary-content": "#ffffff",
          "secondary-container": "#9f4200",
          "secondary-container-content": "#fff6f3",
          // Tertiary - Green (#00E676)
          "tertiary": "#00E676",
          "tertiary-content": "#003d1f",
          "tertiary-container": "#005d2c",
          "tertiary-container-content": "#004820",
          // Neutrals - Dark tones
          "neutral": "#1a1919",
          "neutral-content": "#ffffff",
          "neutral-container": "#262626",
          "neutral-container-content": "#adaaaa",
          // Base - Background (#0e0e0e)
          "base-100": "#0e0e0e",
          "base-200": "#131313",
          "base-300": "#1a1919",
          "base-content": "#ffffff",
          "base-content-inverse": "#0e0e0e",
          // Status colors
          "info": "#64b5f6",
          "info-content": "#003258",
          "success": "#00E676",
          "success-content": "#003d1f",
          "warning": "#ffb300",
          "warning-content": "#3d2e00",
          "error": "#ff7351",
          "error-content": "#450900",
          // Border radius
          "--rounded-box": "1.5rem",
          "--rounded-btn": "9999px",
          "--rounded-badge": "9999px",
          "--animation-btn": "0.2s",
          "--animation-input": "0.2s",
          "--btn-focus-scale": "0.98",
          "--border-btn": "1px",
          "--tab-border": "1px",
          "--tab-radius": "0.5rem",
        },
      },
    ],
  },
}