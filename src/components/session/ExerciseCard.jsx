import React from 'react'
import { colors, borderRadius, typography } from '../../styles/tokens'

// Card de ejercicio actual
export const ExerciseCard = ({ 
  exercise, 
  setNumber, 
  totalSets,
  onSwap,
  children,
}) => {
  // Guard: si exercise es undefined, no renderizar
  if (!exercise) {
    return null
  }

  return (
  <div style={{
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.xl,
    padding: '2rem',
    borderLeft: `4px solid ${colors.primary}`,
    marginBottom: '2rem',
  }}>
    {/* Header */}
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '1.5rem',
    }}>
      <div>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          color: colors.onSurface,
          fontFamily: typography.fontFamily.heading,
          lineHeight: 1.2,
        }}>
          {exercise.name}
        </h1>
        {totalSets > 1 && (
          <p style={{
            fontSize: '0.875rem',
            color: colors.onSurfaceVariant,
            marginTop: '0.5rem',
          }}>
            {exercise.type === 'timer'
              ? `Interval ${setNumber} of ${totalSets} · ${Math.floor((exercise.value || 0) / 60)}:${((exercise.value || 0) % 60).toString().padStart(2, '0')} work`
              : exercise.type === 'reps'
                ? `Set ${setNumber} of ${totalSets} · Target: ${exercise.value || '-'} reps`
                : exercise.type === 'manual'
                  ? `Set ${setNumber} of ${totalSets} · Guided movement`
                  : `Set ${setNumber} of ${totalSets} · Target: ${exercise.reps || 8}-${exercise.reps ? exercise.reps + 2 : 10} reps`}
          </p>
        )}
      </div>
      {onSwap && (
        <button
          onClick={onSwap}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: colors.surfaceContainerHighest,
            border: 'none',
            color: colors.onSurfaceVariant,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span className="material-symbols-outlined">swap_horiz</span>
        </button>
      )}
    </div>

    {children}
  </div>
)
}

// Previous Set Display
export const PreviousSet = ({ weight, reps }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 0',
    marginBottom: '1.5rem',
    borderBottom: `1px solid ${colors.surfaceContainerHighest}`,
  }}>
    <span style={{
      fontSize: '0.75rem',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      color: colors.onSurfaceVariant,
    }}>
      Previous Set
    </span>
    <span style={{
      fontSize: '0.875rem',
      fontWeight: 700,
      color: colors.onSurface,
    }}>
      {weight || '-'} lbs × {reps || '-'}
    </span>
  </div>
)

export default ExerciseCard
