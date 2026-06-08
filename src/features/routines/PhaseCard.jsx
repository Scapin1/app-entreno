import React, { useState } from 'react'
import { colors, typography, borderRadius } from '../../styles/tokens'
import ExerciseList from './ExerciseList'

const PhaseCard = ({ phase, restMode, onChange, onDelete, isOnly }) => {
  const [collapsed, setCollapsed] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(phase.name)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const isCircuit = phase.type === 'circuit'
  const cfg = phase.config || {}
  const resolvedRestMode = phase.restMode ?? 'per-phase'

  const handleNameSubmit = () => {
    if (nameDraft.trim()) {
      onChange({ ...phase, name: nameDraft.trim() })
    }
    setEditingName(false)
  }

  const handleToggleType = () => {
    if (isCircuit) {
      const updated = { ...phase }
      delete updated.type
      onChange(updated)
    } else {
      onChange({
        ...phase,
        type: 'circuit',
        config: {
          work: cfg.work ?? 45,
          micro_pause: cfg.micro_pause ?? 30,
          macro_pause: cfg.macro_pause ?? 120,
          total_sets: cfg.total_sets ?? 3,
        },
      })
    }
  }

  const handleConfigChange = (key, value) => {
    onChange({
      ...phase,
      config: { ...cfg, [key]: Number(value) || 0 },
    })
  }

  const handleExercisesChange = (exercises) => {
    onChange({ ...phase, exercises })
  }

  const handleDelete = () => {
    if (!isOnly) onDelete()
  }

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            style={styles.collapseBtn}
            title={collapsed ? 'Expandir' : 'Contraer'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              {collapsed ? 'expand_more' : 'expand_less'}
            </span>
          </button>

          {editingName ? (
            <input
              type="text"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={(e) => { if (e.key === 'Enter') handleNameSubmit() }}
              style={styles.nameInput}
              autoFocus
            />
          ) : (
            <span
              style={styles.phaseName}
              onClick={() => { setNameDraft(phase.name); setEditingName(true) }}
              title="Click para renombrar"
            >
              {phase.name}
            </span>
          )}

          {isCircuit && (
            <span style={styles.circuitBadge}>Circuito</span>
          )}

          <span style={styles.exCount}>
            {(phase.exercises || []).length} ej.
          </span>
        </div>

        <div style={styles.headerRight}>
          <button
            type="button"
            onClick={handleToggleType}
            style={styles.toggleBtn}
            title={isCircuit ? 'Cambiar a fase normal' : 'Convertir en circuito'}
          >
            {isCircuit ? (
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>fitness_center</span>
            ) : (
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>repeat</span>
            )}
          </button>

          {deleteConfirm ? (
            <div style={styles.deleteConfirmInline}>
              <button type="button" onClick={() => setDeleteConfirm(false)} style={styles.cancelSmBtn}>No</button>
              <button type="button" onClick={handleDelete} style={styles.confirmDelBtn}>Sí</button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => isOnly ? null : setDeleteConfirm(true)}
              style={{ ...styles.deleteBtn, opacity: isOnly ? 0.3 : 1 }}
              disabled={isOnly}
              title={isOnly ? 'No se puede eliminar la única fase' : 'Eliminar fase'}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: colors.error }}>delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {!collapsed && (
        <div style={styles.content}>
          {/* Rest config */}
          <div style={styles.configSection}>
            {/* Rest mode toggle — only for non-circuit phases */}
            {!isCircuit && (
              <div style={styles.restModeRow}>
                <span style={styles.configLabel}>Descansos</span>
                <div style={styles.restModeToggle}>
                  <button
                    type="button"
                    onClick={() => onChange({ ...phase, restMode: 'per-phase', config: cfg })}
                    style={{
                      ...styles.restModeBtn,
                      ...(resolvedRestMode !== 'per-exercise' ? styles.restModeBtnActive : {}),
                    }}
                  >
                    Por fase
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ ...phase, restMode: 'per-exercise', config: cfg })}
                    style={{
                      ...styles.restModeBtn,
                      ...(resolvedRestMode === 'per-exercise' ? styles.restModeBtnActive : {}),
                    }}
                  >
                    Por ejercicio
                  </button>
                </div>
              </div>
            )}

            <div style={styles.configGrid}>
              {/* Circuit-specific fields */}
              {isCircuit && (
                <div style={styles.configField}>
                  <label style={styles.configLabel}>Trabajo (seg)</label>
                  <input
                    type="number"
                    min="1"
                    max="600"
                    value={cfg.work ?? 45}
                    onChange={(e) => handleConfigChange('work', e.target.value)}
                    style={styles.configInput}
                  />
                </div>
              )}

              {/* Rest inputs — hidden for per-exercise mode on non-circuit phases */}
              {(!isCircuit && resolvedRestMode !== 'per-exercise') || isCircuit ? (
                <>
                  <div style={styles.configField}>
                    <label style={styles.configLabel}>Descanso entre series (seg)</label>
                    <input
                      type="number"
                      min="0"
                      max="300"
                      value={cfg.micro_pause ?? 60}
                      onChange={(e) => handleConfigChange('micro_pause', e.target.value)}
                      style={styles.configInput}
                    />
                  </div>
                  <div style={styles.configField}>
                    <label style={styles.configLabel}>Descanso entre ejercicios (seg)</label>
                    <input
                      type="number"
                      min="0"
                      max="600"
                      value={cfg.macro_pause ?? 120}
                      onChange={(e) => handleConfigChange('macro_pause', e.target.value)}
                      style={styles.configInput}
                    />
                  </div>
                </>
              ) : null}

              {/* Per-exercise mode info */}
              {!isCircuit && resolvedRestMode === 'per-exercise' && (
                <div style={styles.configField}>
                  <label style={styles.configLabel}>Descansos</label>
                  <div style={styles.perExerciseInfo}>
                    Se configuran en cada ejercicio
                  </div>
                </div>
              )}

              {isCircuit && (
                <div style={styles.configField}>
                  <label style={styles.configLabel}>Rondas</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={cfg.total_sets ?? 3}
                    onChange={(e) => handleConfigChange('total_sets', e.target.value)}
                    style={styles.configInput}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Exercise list */}
          <ExerciseList
            exercises={phase.exercises || []}
            onChange={handleExercisesChange}
            phaseType={isCircuit ? 'circuit' : 'normal'}
            restMode={resolvedRestMode}
          />
        </div>
      )}
    </div>
  )
}

const styles = {
  card: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.md,
    border: `1px solid ${colors.surfaceContainerHighest}`,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.6rem 0.75rem',
    gap: '0.5rem',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    flex: 1,
    minWidth: 0,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    flexShrink: 0,
  },
  collapseBtn: {
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    backgroundColor: 'transparent',
    border: 'none',
    color: colors.onSurfaceVariant,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  phaseName: {
    fontSize: '0.85rem',
    fontWeight: 700,
    color: colors.onSurface,
    fontFamily: typography.fontFamily.heading,
    cursor: 'pointer',
    padding: '0.1rem 0.2rem',
    borderRadius: borderRadius.sm,
    ':hover': {
      backgroundColor: colors.surfaceContainerHigh,
    },
  },
  nameInput: {
    fontSize: '0.85rem',
    fontWeight: 700,
    fontFamily: typography.fontFamily.heading,
    backgroundColor: colors.surfaceContainerHigh,
    border: `1px solid ${colors.primary}`,
    borderRadius: borderRadius.sm,
    padding: '0.2rem 0.35rem',
    color: colors.onSurface,
    outline: 'none',
    width: '180px',
  },
  circuitBadge: {
    fontSize: '0.55rem',
    fontWeight: 700,
    color: colors.onPrimaryFixed,
    backgroundColor: colors.primary,
    padding: '0.12rem 0.4rem',
    borderRadius: borderRadius.full,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap',
  },
  exCount: {
    fontSize: '0.65rem',
    color: colors.onSurfaceVariant,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  toggleBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: colors.surfaceContainerHigh,
    border: 'none',
    color: colors.onSurfaceVariant,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteConfirmInline: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  cancelSmBtn: {
    border: 'none',
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceContainerHighest,
    color: colors.onSurfaceVariant,
    padding: '0.2rem 0.45rem',
    fontSize: '0.65rem',
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  confirmDelBtn: {
    border: 'none',
    borderRadius: borderRadius.md,
    backgroundColor: colors.error,
    color: colors.onPrimaryFixed,
    padding: '0.2rem 0.45rem',
    fontSize: '0.65rem',
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  content: {
    borderTop: `1px solid ${colors.surfaceContainerHighest}`,
    padding: '0.75rem',
  },
  configSection: {
    marginBottom: '0.75rem',
    paddingBottom: '0.75rem',
    borderBottom: `1px solid ${colors.surfaceContainerHighest}`,
  },
  configGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.5rem',
  },
  configField: {
    marginBottom: 0,
  },
  configLabel: {
    display: 'block',
    fontSize: '0.62rem',
    fontWeight: 700,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.2rem',
  },
  configInput: {
    width: '100%',
    backgroundColor: colors.surfaceContainerHigh,
    border: `1px solid ${colors.surfaceContainerHighest}`,
    borderRadius: borderRadius.md,
    padding: '0.4rem 0.5rem',
    color: colors.onSurface,
    fontFamily: typography.fontFamily.body,
    fontSize: '0.8rem',
    outline: 'none',
    boxSizing: 'border-box',
  },
  restModeRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.65rem',
    paddingBottom: '0.65rem',
    borderBottom: `1px solid ${colors.surfaceContainerHighest}`,
  },
  restModeToggle: {
    display: 'flex',
    gap: '2px',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.md,
    padding: '2px',
  },
  restModeBtn: {
    border: 'none',
    borderRadius: borderRadius.sm,
    backgroundColor: 'transparent',
    color: colors.onSurfaceVariant,
    padding: '0.3rem 0.55rem',
    fontSize: '0.68rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  restModeBtnActive: {
    backgroundColor: colors.primary,
    color: colors.onPrimaryFixed,
  },
  perExerciseInfo: {
    fontSize: '0.72rem',
    color: colors.onSurfaceVariant,
    fontStyle: 'italic',
    padding: '0.35rem 0',
  },
}

export default PhaseCard
