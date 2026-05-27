import React, { useEffect, useState } from 'react'
import { colors, typography, borderRadius } from '../../styles/tokens'
import { routinesAPI } from '../../utils/api'

const RoutineSelector = ({ profileId, onRoutineChange }) => {
  const [routines, setRoutines] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profileId) return

    const load = async () => {
      setLoading(true)
      try {
        const data = await routinesAPI.list(profileId)
        const list = Array.isArray(data) ? data : []
        setRoutines(list)
        const active = list.find((r) => r.is_selected === 1)
        if (active) setSelectedId(active.id)
      } catch (e) {
        console.warn('[RoutineSelector] No se pudieron cargar rutinas:', e.message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [profileId])

  const handleChange = async (routineId) => {
    try {
      await routinesAPI.select(profileId, routineId)
      setSelectedId(routineId)
      setRoutines((prev) =>
        prev.map((r) => ({
          ...r,
          is_selected: r.id === routineId ? 1 : 0,
        }))
      )
      onRoutineChange?.(routineId)
    } catch (e) {
      console.warn('[RoutineSelector] Error al cambiar rutina:', e.message)
    }
  }

  if (loading) return null
  if (routines.length <= 1) return null

  return (
    <div style={styles.container}>
      <span style={styles.label}>Rutina activa</span>
      <div style={styles.tabs}>
        {routines.map((routine) => (
          <button
            key={routine.id}
            type="button"
            onClick={() => handleChange(routine.id)}
            style={routine.id === selectedId ? styles.activeTab : styles.tab}
          >
            {routine.id === selectedId && (
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
            )}
            {routine.name}
          </button>
        ))}
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.lg,
    flexWrap: 'wrap',
  },
  label: {
    fontSize: '0.72rem',
    fontWeight: 700,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    whiteSpace: 'nowrap',
  },
  tabs: {
    display: 'flex',
    gap: '0.4rem',
    flexWrap: 'wrap',
  },
  tab: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
    border: 'none',
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainerHigh,
    color: colors.onSurfaceVariant,
    padding: '0.35rem 0.75rem',
    fontSize: '0.78rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: typography.fontFamily.body,
  },
  activeTab: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
    border: 'none',
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    color: colors.onPrimaryFixed,
    padding: '0.35rem 0.75rem',
    fontSize: '0.78rem',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: typography.fontFamily.body,
  },
}

export default RoutineSelector
