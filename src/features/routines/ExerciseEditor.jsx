import React, { useState } from 'react'
import { colors, typography, borderRadius } from '../../styles/tokens'

const EXERCISE_TYPES = [
  { value: 'strength', label: 'Fuerza', showSets: true },
  { value: 'hypertrophy', label: 'Hipertrofia', showSets: true },
  { value: 'timer', label: 'Temporizador', showSets: false },
  { value: 'warmup', label: 'Calentamiento', showSets: true },
  { value: 'cardio', label: 'Cardio', showSets: false },
  { value: 'stretching', label: 'Elongación', showSets: false },
]

const ExerciseEditor = ({ exercise, onSave, onCancel }) => {
  const isNew = !exercise
  const [name, setName] = useState(exercise?.name || '')
  const [type, setType] = useState(exercise?.type || 'strength')
  const [sets, setSets] = useState(exercise?.sets ?? 4)
  const [reps, setReps] = useState(exercise?.reps ?? '')
  const [rest, setRest] = useState(exercise?.rest ?? 60)
  const [weight, setWeight] = useState(exercise?.weight ?? '')
  const [videoUrl, setVideoUrl] = useState(exercise?.videoUrl ?? '')
  const [notes, setNotes] = useState(exercise?.notes ?? '')
  const [configText, setConfigText] = useState(
    exercise?.config ? JSON.stringify(exercise.config, null, 2) : '{}'
  )
  const [error, setError] = useState('')

  const currentType = EXERCISE_TYPES.find((t) => t.value === type)
  const showSetsFields = currentType?.showSets ?? true

  const handleSave = () => {
    if (!name.trim()) {
      setError('El nombre del ejercicio es obligatorio')
      return
    }

    let config = {}
    try {
      config = JSON.parse(configText)
      if (typeof config !== 'object' || config === null) throw new Error()
    } catch {
      setError('Config debe ser un JSON válido (ej: {"intensity": "media"})')
      return
    }

    const exerciseData = {
      name: name.trim(),
      type,
      sets: showSetsFields ? Number(sets) || 0 : 0,
      reps: showSetsFields ? reps.trim() : '',
      rest: Number(rest) || 0,
      weight: weight.trim(),
      config,
      videoUrl: videoUrl.trim(),
      notes: notes.trim(),
    }

    onSave(exerciseData)
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3 style={styles.title}>{isNew ? 'Nuevo ejercicio' : 'Editar ejercicio'}</h3>
          <button type="button" onClick={onCancel} style={styles.closeButton}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
          </button>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <div style={styles.formGrid}>
          {/* Name */}
          <div style={styles.field}>
            <label style={styles.label}>Nombre *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError('') }}
              placeholder="Ej: Press de banca"
              style={styles.input}
              autoFocus
            />
          </div>

          {/* Type */}
          <div style={styles.field}>
            <label style={styles.label}>Tipo</label>
            <select value={type} onChange={(e) => setType(e.target.value)} style={styles.input}>
              {EXERCISE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Sets */}
          {showSetsFields && (
            <div style={styles.field}>
              <label style={styles.label}>Series</label>
              <input
                type="number"
                min="1"
                max="99"
                value={sets}
                onChange={(e) => setSets(e.target.value)}
                style={styles.input}
              />
            </div>
          )}

          {/* Reps */}
          {showSetsFields && (
            <div style={styles.field}>
              <label style={styles.label}>Repeticiones</label>
              <input
                type="text"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                placeholder="Ej: 8-12 o 10"
                style={styles.input}
              />
            </div>
          )}

          {/* Rest */}
          <div style={styles.field}>
            <label style={styles.label}>Descanso (seg)</label>
            <input
              type="number"
              min="0"
              max="600"
              value={rest}
              onChange={(e) => setRest(e.target.value)}
              style={styles.input}
            />
          </div>

          {/* Weight */}
          <div style={styles.field}>
            <label style={styles.label}>Peso (opcional)</label>
            <input
              type="text"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Ej: 20 kg"
              style={styles.input}
            />
          </div>
        </div>

        {/* Config JSON */}
        <div style={styles.field}>
          <label style={styles.label}>Config (JSON, opcional)</label>
          <textarea
            value={configText}
            onChange={(e) => setConfigText(e.target.value)}
            style={styles.textarea}
            rows={3}
            placeholder='{"intensity": "media", "rpe": 7}'
          />
        </div>

        {/* Video URL */}
        <div style={styles.field}>
          <label style={styles.label}>URL de video (opcional)</label>
          <input
            type="text"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://..."
            style={styles.input}
          />
        </div>

        {/* Notes */}
        <div style={styles.field}>
          <label style={styles.label}>Notas (opcional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={styles.textarea}
            rows={2}
            placeholder="Notas sobre el ejercicio..."
          />
        </div>

        {/* Actions */}
        <div style={styles.actions}>
          <button type="button" onClick={onCancel} style={styles.cancelButton}>
            Cancelar
          </button>
          <button type="button" onClick={handleSave} style={styles.saveButton}>
            {isNew ? 'Agregar' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem',
  },
  modal: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.lg,
    padding: '1.5rem',
    maxWidth: '560px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    border: `1px solid ${colors.surfaceContainerHighest}`,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1rem',
  },
  title: {
    fontSize: '1.125rem',
    fontFamily: typography.fontFamily.heading,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
    color: colors.onSurface,
  },
  closeButton: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: colors.surfaceContainerHigh,
    border: 'none',
    color: colors.onSurfaceVariant,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.75rem',
    marginBottom: '0.75rem',
  },
  field: {
    marginBottom: '0.75rem',
  },
  label: {
    display: 'block',
    fontSize: '0.72rem',
    fontWeight: 700,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.35rem',
  },
  input: {
    width: '100%',
    backgroundColor: colors.surfaceContainerHigh,
    border: `1px solid ${colors.surfaceContainerHighest}`,
    borderRadius: borderRadius.md,
    padding: '0.6rem 0.75rem',
    color: colors.onSurface,
    fontFamily: typography.fontFamily.body,
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    backgroundColor: colors.surfaceContainerHigh,
    border: `1px solid ${colors.surfaceContainerHighest}`,
    borderRadius: borderRadius.md,
    padding: '0.6rem 0.75rem',
    color: colors.onSurface,
    fontFamily: typography.fontFamily.body,
    fontSize: '0.85rem',
    outline: 'none',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  errorBox: {
    backgroundColor: colors.errorContainer,
    color: colors.error,
    padding: '0.5rem 0.75rem',
    borderRadius: borderRadius.md,
    marginBottom: '0.75rem',
    fontSize: '0.8rem',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.5rem',
    marginTop: '0.5rem',
    paddingTop: '0.75rem',
    borderTop: `1px solid ${colors.surfaceContainerHighest}`,
  },
  cancelButton: {
    border: 'none',
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceContainerHigh,
    color: colors.onSurfaceVariant,
    padding: '0.5rem 0.85rem',
    fontSize: '0.78rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  saveButton: {
    border: 'none',
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    color: colors.onPrimaryFixed,
    padding: '0.5rem 0.85rem',
    fontSize: '0.78rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
}

export default ExerciseEditor
