// Design Tokens - Colores y valores base del diseño "The Kinetic Edge"
export const colors = {
  // Backgrounds
  background: '#0e0e0e',
  surfaceContainerLow: '#131313',
  surfaceContainerHigh: '#201f1f',
  surfaceContainerHighest: '#262626',
  surfaceContainerLowest: '#000000',
  
  // Primary (Neón Verde)
  primary: '#DFFF00',
  primaryContainer: '#daf900',
  primaryDim: '#d0ed00',
  onPrimaryFixed: '#3f4900',
  onPrimaryFixedVariant: '#596700',
  
  // Secondary (Naranja)
  secondary: '#FF6D00',
  secondaryContainer: '#9f4200',
  onSecondary: '#3c1400',
  
  // Tertiary (Verde)
  tertiary: '#00E676',
  tertiaryContainer: '#3fff8b',
  onTertiary: '#006731',
  
  // Text
  onSurface: '#ffffff',
  onSurfaceVariant: '#adaaaa',
  
  // Estados
  error: '#ff7351',
  errorContainer: '#b92902',
  outlineVariant: '#484847',
}

export const typography = {
  fontFamily: {
    heading: 'Space Grotesk, sans-serif',
    body: 'Manrope, sans-serif',
  },
  fontSize: {
    display: '3rem',      // 48px - títulos grandes
    h1: '2.5rem',        // 40px
    h2: '1.875rem',      // 30px
    h3: '1.5rem',        // 24px
    h4: '1.25rem',       // 20px
    body: '1rem',        // 16px
    small: '0.875rem',   // 14px
    caption: '0.75rem',  // 12px
    tiny: '0.625rem',    // 10px
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 900,
  },
}

export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  xxl: '3rem',     // 48px
}

export const borderRadius = {
  sm: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.5rem',
  full: '9999px',
}

export const shadows = {
  glow: '0 0 30px rgba(223,255,0,0.4)',
  subtle: '0 0 20px rgba(223,255,0,0.15)',
}

// Breakpoints
export const breakpoints = {
  mobile: '480px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1440px',
}

// Export default
export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  breakpoints,
}