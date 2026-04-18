import React from 'react'
import { colors, borderRadius, typography } from '../../styles/tokens'

// Card de Up Next (ejercicio siguiente) - sin fecha
export const UpNextCard = ({ name, sets, reps, onClick }) => (
  <div
    onClick={onClick}
    style={{
      backgroundColor: colors.surfaceContainerLow,
      borderRadius: borderRadius.lg,
      padding: '1.25rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      cursor: 'pointer',
    }}
  >
    {/* Icon */}
    <div style={{
      width: '48px',
      height: '48px',
      backgroundColor: colors.surfaceContainerHighest,
      borderRadius: borderRadius.md,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: colors.onSurfaceVariant,
    }}>
      <span className="material-symbols-outlined">fitness_center</span>
    </div>
    
    {/* Info - solo nombre, sin fecha */}
    <div style={{ flex: 1 }}>
      <h4 style={{
        fontSize: '1rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        color: colors.onSurface,
        fontFamily: typography.fontFamily.heading,
      }}>
        {name}
      </h4>
    </div>
    
    {/* Arrow */}
    <span className="material-symbols-outlined" style={{ color: colors.outline }}>
      chevron_right
    </span>
  </div>
)

// Section Up Next - solo 1 ejercicio
export const UpNextSection = ({ exercises = [] }) => {
  if (exercises.length === 0) return null
  
  return (
    <div>
      <h3 style={{
        fontSize: '0.875rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color: colors.onSurfaceVariant,
        marginBottom: '1rem',
        paddingLeft: '0.5rem',
      }}>
        Up Next
      </h3>
      {exercises.map((ex, i) => (
        <UpNextCard key={i} {...ex} />
      ))}
    </div>
  )
}

// Compact version for mobile
export const UpNextCardCompact = ({ name, sets, reps }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.lg,
    marginBottom: '0.5rem',
  }}>
    <span className="material-symbols-outlined" style={{ color: colors.onSurfaceVariant }}>
      fitness_center
    </span>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{
        fontSize: '0.875rem',
        fontWeight: 600,
        color: colors.onSurface,
        textTransform: 'uppercase',
      }}>
        {name}
      </span>
      <span style={{
        fontSize: '0.625rem',
        color: colors.onSurfaceVariant,
      }}>
        {sets} sets • {reps} reps
      </span>
    </div>
  </div>
)

export default UpNextSection