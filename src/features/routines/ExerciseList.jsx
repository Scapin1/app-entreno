import React, { useState } from 'react'
import { colors, typography, borderRadius } from '../../styles/tokens'
import ExerciseEditor from './ExerciseEditor'

const TYPE_LABELS = {
  strength: 'Fuerza',
  hypertrophy: 'Hipertrofia',
  timer: 'Temporizador',
  warmup: 'Calentamiento',
  cardio: 'Cardio',
  stretching: 'Elongación',
}

const ExerciseList = ({ exercises, onChange, phaseType = 'normal', restMode }) => {
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState(null)
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState(null)

  const handleMoveUp = (idx) => {
    if (idx <= 0) return
    const updated = [...exercises]
    ;[updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]]
    onChange(updated)
  }

  const handleMoveDown = (idx) => {
    if (idx >= exercises.length - 1) return
    const updated = [...exercises]
    ;[updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]]
    onChange(updated)
  }

  const handleDelete = (idx) => {
    const updated = exercises.filter((_, i) => i !== idx)
    onChange(updated)
    setDeleteConfirmIndex(null)
  }

  const handleEdit = (idx) => {
    setEditingIndex(idx)
    setEditorOpen(true)
  }

  const handleSaveExercise = (exerciseData) => {
    if (editingIndex !== null) {
      // Edit existing
      const updated = [...exercises]
      updated[editingIndex] = exerciseData
      onChange(updated)
    } else {
      // Add new
      onChange([...exercises, exerciseData])
    }
    setEditorOpen(false)
    setEditingIndex(null)
  }

  const handleAddNew = () => {
    setEditingIndex(null)
    setEditorOpen(true)
  }

  const handleCloseEditor = () => {
    setEditorOpen(false)
    setEditingIndex(null)
  }

  const getExerciseSummary = (ex) => {
    if (phaseType === 'circuit') {
      const parts = [
        ...(ex.weight ? [ex.weight] : []),
        ...(ex.implement ? [ex.implement] : []),
      ]
      return parts.join(' · ')
    }
    const parts = []
    const hasSets = ex.sets && ex.sets > 0
    const hasReps = ex.reps && ex.reps.toString().trim()
    if (hasSets && hasReps) parts.push(`${ex.sets} × ${ex.reps}`)
    else if (hasSets) parts.push(`${ex.sets} series`)
    else if (hasReps) parts.push(`${ex.reps} reps`)
    return parts.join(' · ')
  }

  return (
    <div>
      <div style={styles.header}>
        <span style={styles.headerLabel}>
          {exercises.length} ejercicio{exercises.length !== 1 ? 's' : ''}
        </span>
        <button type="button" onClick={handleAddNew} style={styles.addButton}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
          Agregar ejercicio
        </button>
      </div>

      {exercises.length === 0 && (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>No hay ejercicios todavía. Agregá uno para empezar.</p>
        </div>
      )}

          {exercises.length > 0 && (
            <div style={styles.list}>
              {exercises.map((ex, idx) => {
                const typeLabel = TYPE_LABELS[ex.type] || ex.type
                const summary = getExerciseSummary(ex)

                return (
                  <div key={idx} style={styles.item}>
                    <div style={styles.itemMain}>
                      <div style={styles.itemInfo}>
                        <div style={styles.itemNameRow}>
                          <span style={styles.itemIndex}>{(idx + 1).toString().padStart(2, '0')}</span>
                          <span style={styles.itemName}>{ex.name}</span>
                          {typeLabel && <span style={styles.typeBadge}>{typeLabel}</span>}
                        </div>
                        {(summary || ex.custom_timer > 0) && (
                          <span style={styles.itemSummary}>
                            {summary}{summary && ex.custom_timer > 0 && ' · '}{ex.custom_timer > 0 && `${ex.custom_timer}s`}
                          </span>
                        )}
                      </div>

                  <div style={styles.itemActions}>
                    <button
                      type="button"
                      onClick={() => handleMoveUp(idx)}
                      disabled={idx === 0}
                      style={{ ...styles.moveBtn, opacity: idx === 0 ? 0.3 : 1 }}
                      title="Mover arriba"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_upward</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveDown(idx)}
                      disabled={idx === exercises.length - 1}
                      style={{ ...styles.moveBtn, opacity: idx === exercises.length - 1 ? 0.3 : 1 }}
                      title="Mover abajo"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_downward</span>
                    </button>
                    <button type="button" onClick={() => handleEdit(idx)} style={styles.editBtn} title="Editar">
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                    </button>
                    {deleteConfirmIndex === idx ? (
                      <div style={styles.deleteConfirmInline}>
                        <button type="button" onClick={() => setDeleteConfirmIndex(null)} style={styles.cancelSmBtn}>Cancelar</button>
                        <button type="button" onClick={() => handleDelete(idx)} style={styles.confirmDelBtn}>Eliminar</button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setDeleteConfirmIndex(idx)} style={styles.deleteBtn} title="Eliminar">
                        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: colors.error }}>delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Exercise Editor Modal */}
      {editorOpen && (
        <ExerciseEditor
          exercise={editingIndex !== null ? exercises[editingIndex] : null}
          onSave={handleSaveExercise}
          onCancel={handleCloseEditor}
          phaseType={phaseType}
          restMode={restMode}
        />
      )}
    </div>
  )
}

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.75rem',
  },
  headerLabel: {
    fontSize: '0.78rem',
    fontWeight: 700,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  addButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
    border: 'none',
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    color: colors.onPrimaryFixed,
    padding: '0.35rem 0.65rem',
    fontSize: '0.72rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  emptyState: {
    padding: '2rem 1rem',
    textAlign: 'center',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.md,
    border: `1px dashed ${colors.surfaceContainerHighest}`,
  },
  emptyText: {
    color: colors.onSurfaceVariant,
    fontSize: '0.85rem',
    margin: 0,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  item: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.md,
    padding: '0.65rem 0.75rem',
    border: `1px solid ${colors.surfaceContainerHighest}`,
  },
  itemMain: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
  },
  itemInfo: {
    flex: 1,
    minWidth: 0,
  },
  itemNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    flexWrap: 'wrap',
  },
  itemIndex: {
    fontSize: '0.72rem',
    fontWeight: 800,
    color: colors.primary,
    fontFamily: typography.fontFamily.heading,
    minWidth: '20px',
  },
  itemName: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: colors.onSurface,
  },
  typeBadge: {
    fontSize: '0.55rem',
    fontWeight: 700,
    color: colors.onSurfaceVariant,
    backgroundColor: colors.surfaceContainerLowest,
    padding: '0.15rem 0.4rem',
    borderRadius: borderRadius.full,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    border: `1px solid ${colors.outlineVariant}`,
  },
  itemSummary: {
    fontSize: '0.72rem',
    color: colors.onSurfaceVariant,
    marginTop: '0.15rem',
    display: 'block',
  },
  itemActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    flexShrink: 0,
  },
  moveBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: 'transparent',
    border: 'none',
    color: colors.onSurfaceVariant,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: colors.surfaceContainerLow,
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
}

export default ExerciseList
