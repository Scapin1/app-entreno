import React, { useEffect, useRef, useState } from 'react'
import { colors, borderRadius, typography } from '../../styles/tokens'

// Rest Timer Overlay
export const RestOverlay = ({ restTime, maxTime, nextExercise, onSkip, logConfig, onSubmitLog }) => {
  const circumference = 2 * Math.PI * 90
  const progress = maxTime > 0 ? (restTime / maxTime) * circumference : 0
  const [actualWeight, setActualWeight] = useState('')
  const [actualReps, setActualReps] = useState('')
  const [feeling, setFeeling] = useState('ok')
  const [resistanceCompleted, setResistanceCompleted] = useState(false)
  const lastLogKeyRef = useRef('')

  useEffect(() => {
    if (!logConfig) return
    const logKey = `${logConfig?.base?.dayId ?? ''}-${logConfig?.base?.exerciseName ?? ''}-${logConfig?.base?.setNumber ?? ''}`
    if (lastLogKeyRef.current === logKey) return

    lastLogKeyRef.current = logKey
    setActualWeight(logConfig.defaultWeight != null ? String(logConfig.defaultWeight) : '')
    setActualReps(logConfig.defaultReps != null ? String(logConfig.defaultReps) : '')
    setFeeling(logConfig.defaultFeeling || 'ok')
    setResistanceCompleted(Boolean(logConfig.defaultResistanceCompleted))
  }, [logConfig])
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: `${colors.background}f0`,
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      padding: '1rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '520px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        maxHeight: '95vh',
        overflowY: 'auto',
        backgroundColor: colors.surfaceContainerLow,
        borderRadius: borderRadius.xl,
        padding: '1.25rem',
      }}>
        {/* Label */}
        <span style={{
          fontSize: '1rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          color: colors.secondary,
        }}>
          DESCANSO
        </span>

        {/* Circular Timer */}
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg style={{ width: '170px', height: '170px', transform: 'rotate(-90deg)' }}>
            <circle
              cx="85"
              cy="85"
              r="76"
              stroke={colors.surfaceContainerHighest}
              strokeWidth="7"
              fill="transparent"
            />
            <circle
              cx="85"
              cy="85"
              r="76"
              stroke={colors.secondary}
              strokeWidth="7"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 76}
              strokeDashoffset={(2 * Math.PI * 76) - ((maxTime > 0 ? (restTime / maxTime) : 0) * (2 * Math.PI * 76))}
              strokeLinecap="round"
            />
          </svg>
          <span style={{
            position: 'absolute',
            fontSize: '2.2rem',
            fontWeight: 900,
            color: colors.onSurface,
            fontFamily: typography.fontFamily.heading,
          }}>
            {formatTime(restTime)}
          </span>
        </div>

        {/* Next Exercise */}
        <p style={{
          fontSize: '0.875rem',
          color: colors.onSurfaceVariant,
        }}>
          Próximo: {nextExercise || 'Fin del bloque'}
        </p>

        {logConfig && (
          <div style={{
            width: '100%',
            maxWidth: '460px',
            backgroundColor: colors.surfaceContainer,
            borderRadius: borderRadius.lg,
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: colors.onSurfaceVariant,
            }}>
              Registrar set realizado
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: logConfig.showWeight ? '1fr 1fr' : '1fr', gap: '0.65rem' }}>
              {logConfig.showWeight && (
                <input
                  type="number"
                  value={actualWeight}
                  onChange={(e) => setActualWeight(e.target.value)}
                  placeholder="Peso (kg)"
                  style={{
                    backgroundColor: colors.surfaceContainerHigh,
                    border: `1px solid ${colors.surfaceContainerHighest}`,
                    borderRadius: borderRadius.md,
                    padding: '0.7rem 0.8rem',
                    color: colors.onSurface,
                    outline: 'none',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                />
              )}
              <input
                type="number"
                value={actualReps}
                onChange={(e) => setActualReps(e.target.value)}
                placeholder={logConfig.showResistance ? 'Reps reales (rot+emp)' : 'Reps reales'}
                style={{
                  backgroundColor: colors.surfaceContainerHigh,
                  border: `1px solid ${colors.surfaceContainerHighest}`,
                  borderRadius: borderRadius.md,
                  padding: '0.7rem 0.8rem',
                  color: colors.onSurface,
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.5rem' }}>
              {[
                { key: 'easy', label: 'Fácil' },
                { key: 'ok', label: 'Normal' },
                { key: 'hard', label: 'Difícil' },
              ].map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setFeeling(option.key)}
                  style={{
                    border: 'none',
                    borderRadius: borderRadius.full,
                    padding: '0.55rem 0.5rem',
                    cursor: 'pointer',
                    backgroundColor: feeling === option.key ? colors.primary : colors.surfaceContainerHigh,
                    color: feeling === option.key ? colors.onPrimaryFixed : colors.onSurfaceVariant,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    width: '100%',
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {logConfig.showResistance && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: colors.onSurfaceVariant,
                }}>
                  Resistencia completada
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setResistanceCompleted(true)}
                    style={{
                      border: 'none',
                      borderRadius: borderRadius.full,
                      padding: '0.55rem 0.5rem',
                      cursor: 'pointer',
                      backgroundColor: resistanceCompleted ? colors.primary : colors.surfaceContainerHigh,
                      color: resistanceCompleted ? colors.onPrimaryFixed : colors.onSurfaceVariant,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      width: '100%',
                    }}
                  >
                    Sí
                  </button>
                  <button
                    type="button"
                    onClick={() => setResistanceCompleted(false)}
                    style={{
                      border: 'none',
                      borderRadius: borderRadius.full,
                      padding: '0.55rem 0.5rem',
                      cursor: 'pointer',
                      backgroundColor: !resistanceCompleted ? colors.secondary : colors.surfaceContainerHigh,
                      color: !resistanceCompleted ? colors.onPrimaryFixed : colors.onSurfaceVariant,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      width: '100%',
                    }}
                  >
                    No
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => onSubmitLog?.({
                actualWeight: actualWeight === '' ? null : Number(actualWeight),
                actualReps: actualReps === '' ? null : Number(actualReps),
                feeling,
                resistanceCompleted,
              })}
              style={{
                border: 'none',
                borderRadius: borderRadius.md,
                padding: '0.75rem 0.9rem',
                cursor: 'pointer',
                backgroundColor: colors.primary,
                color: colors.onPrimaryFixed,
                fontWeight: 700,
                width: '100%',
              }}
            >
              Guardar resultado
            </button>
          </div>
        )}

        {/* Skip Button */}
        <button
          onClick={onSkip}
          style={{
            padding: '0.75rem 1.25rem',
            backgroundColor: colors.surfaceContainerLow,
            border: 'none',
            borderRadius: borderRadius.md,
            color: colors.onSurface,
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            marginTop: '0.25rem',
          }}
        >
          Saltar Descanso
        </button>
      </div>
    </div>
  )
}

export default RestOverlay
