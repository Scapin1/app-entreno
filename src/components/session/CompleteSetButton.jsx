import React from 'react'
import { colors, borderRadius } from '../../styles/tokens'

// Complete Set Button - con gradiente néon
export const CompleteSetButton = ({ onClick, size = 'large', label = 'Complete Set', disabled = false }) => {
  const isLarge = size === 'large'
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryContainer})`,
        color: colors.onPrimaryFixed,
        border: 'none',
        borderRadius: isLarge ? borderRadius.xl : borderRadius.lg,
        padding: isLarge ? '1.5rem' : '1rem',
        fontSize: isLarge ? '1.25rem' : '1rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: isLarge ? '0.1em' : '0.05em',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isLarge ? '0.75rem' : '0.5rem',
        boxShadow: '0 0 40px rgba(246, 255, 192, 0.15)',
        opacity: disabled ? 0.65 : 1,
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: isLarge ? '28px' : '20px' }}>
        check_circle
      </span>
      <span>{label}</span>
    </button>
  )
}

export default CompleteSetButton
