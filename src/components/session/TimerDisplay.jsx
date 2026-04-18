import React from 'react'
import { colors, borderRadius, typography } from '../../styles/tokens'

// Timer Display - Large timer for session
export const TimerDisplay = ({ mins, secs, size = 'large' }) => {
  const isLarge = size === 'large'
  
  // Default values if props are undefined
  const displayMins = mins || '00'
  const displaySecs = secs || '00'
  
  const styles = {
    container: { display: 'flex', alignItems: 'baseline', justifyContent: 'center' },
    number: {
      fontSize: isLarge ? '8rem' : '3rem',
      fontWeight: 900,
      color: colors.primary,
      lineHeight: 1,
      fontFamily: typography.fontFamily.heading,
    },
    colon: {
      fontSize: isLarge ? '8rem' : '3rem',
      fontWeight: 900,
      color: colors.primary,
      opacity: 0.5,
      lineHeight: 1,
      margin: isLarge ? '0 0.25rem' : '0 0.125rem',
    },
  }

  return (
    <div style={styles.container}>
      <span style={styles.number}>{displayMins}</span>
      <span style={styles.colon}>:</span>
      <span style={styles.number}>{displaySecs}</span>
    </div>
  )
}

// Elapsed Label
export const ElapsedLabel = ({ label = 'Elapsed Time' }) => (
  <div style={{
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.2em',
    color: colors.onSurfaceVariant,
    marginBottom: '1rem',
    textAlign: 'center',
  }}>
    {label}
  </div>
)

export default TimerDisplay
