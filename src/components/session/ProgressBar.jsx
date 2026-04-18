import React from 'react'
import { colors, borderRadius, typography } from '../../styles/tokens'

// Progress Bar
export const ProgressBar = ({ value = 0, label, showPercent = true }) => (
  <div style={{ width: '100%', maxWidth: '400px' }}>
    {(label || showPercent) && (
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '0.5rem',
      }}>
        {label && (
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: colors.onSurfaceVariant,
          }}>
            {label}
          </span>
        )}
        {showPercent && (
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: colors.primary,
          }}>
            {Math.round(value)}%
          </span>
        )}
      </div>
    )}
    <div style={{
      height: '8px',
      backgroundColor: colors.surfaceContainerHighest,
      borderRadius: '4px',
      overflow: 'hidden',
    }}>
      <div style={{
        height: '100%',
        width: `${value}%`,
        background: `linear-gradient(90deg, ${colors.primary}, ${colors.primaryContainer})`,
        borderRadius: '4px',
        transition: 'width 0.3s ease',
      }} />
    </div>
  </div>
)

// Compact Progress for header
export const ProgressCompact = ({ current, total }) => (
  <span style={{
    fontSize: '0.875rem',
    fontWeight: 700,
    color: colors.primary,
    fontFamily: typography.fontFamily.heading,
  }}>
    {current}/{total}
  </span>
)

// Segmented phase progress (warmup / main / cooldown)
export const ProgressPhases = ({ phases = [], currentPhaseIndex = 0 }) => (
  <div style={{ width: '100%', maxWidth: '560px' }}>
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${Math.max(phases.length, 1)}, 1fr)`,
      gap: '0.5rem',
    }}>
      {phases.map((phase, idx) => {
        const isActive = idx === currentPhaseIndex
        return (
          <div key={`${phase.name}-${idx}`}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.35rem',
            }}>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: isActive ? colors.primary : colors.onSurfaceVariant,
              }}>
                {phase.name}
              </span>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                color: isActive ? colors.primary : colors.onSurfaceVariant,
              }}>
                {Math.round(phase.progress || 0)}%
              </span>
            </div>
            <div style={{
              height: '8px',
              backgroundColor: colors.surfaceContainerHighest,
              borderRadius: borderRadius.full,
              overflow: 'hidden',
              boxShadow: isActive ? `0 0 0 1px ${colors.primary}33 inset` : 'none',
            }}>
              <div style={{
                height: '100%',
                width: `${Math.max(0, Math.min(100, phase.progress || 0))}%`,
                background: `linear-gradient(90deg, ${colors.primary}, ${colors.primaryContainer})`,
                transition: 'width 0.25s ease',
              }} />
            </div>
          </div>
        )
      })}
    </div>
  </div>
)

export default ProgressBar
