import React, { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { colors, typography, borderRadius } from '../../styles/tokens'
import { Sidebar, BottomNav } from '../../components/navigation'
import { trainingDaysAPI } from '../../utils/api'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import ExerciseList from './ExerciseList'

const DAY_TYPES = [
  { value: 'strength', label: 'Fuerza' },
  { value: 'hypertrophy', label: 'Hipertrofia' },
  { value: 'endurance', label: 'Resistencia' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'recovery', label: 'Recuperación' },
]

const DayEditor = ({ day, onBack, onNavigate }) => {
  const { profile } = useAuth()
  const { isDesktop } = useBreakpoint()

  const [title, setTitle] = useState(day?.title || '')
  const [focus, setFocus] = useState(day?.focus || '')
  const [dayType, setDayType] = useState(day?.type || '')
  const [implementsList, setImplementsList] = useState(
    Array.isArray(day?.implements) ? [...day.implements] : []
  )
  const [newImplement, setNewImplement] = useState('')
  const [exercises, setExercises] = useState([])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load exercises from the day's blocks
  useEffect(() => {
    if (!day?.blocks) {
      setLoading(false)
      return
    }

    // Check if blocks have the nested format (with exercises arrays)
    const hasNestedExercises = Array.isArray(day.blocks[0]?.exercises)

    if (hasNestedExercises) {
      // Collect exercises from all blocks
      const allExercises = []
      for (const block of day.blocks) {
        if (Array.isArray(block.exercises)) {
          allExercises.push(...block.exercises)
        }
      }
      setExercises(allExercises)
    } else if (Array.isArray(day.blocks)) {
      // Flat format — each block element IS an exercise
      setExercises(day.blocks)
    }

    setLoading(false)
  }, [day?.id])

  const handleAddImplement = () => {
    const val = newImplement.trim()
    if (!val || implementsList.includes(val)) return
    setImplementsList([...implementsList, val])
    setNewImplement('')
  }

  const handleRemoveImplement = (idx) => {
    setImplementsList(implementsList.filter((_, i) => i !== idx))
  }

  const handleSave = async () => {
    if (!profile?.id || !day?.id) return

    setSaving(true)
    setSaveError('')
    setSaved(false)

    try {
      // Build blocks array — wrap exercises in a single "Ejercicios" block
      const blocks = [
        {
          name: 'Ejercicios',
          config: { micro_pause: 60, macro_pause: 120 },
          exercises: exercises.map((ex) => ({
            name: ex.name,
            type: ex.type || 'strength',
            sets: typeof ex.sets === 'number' ? ex.sets : 0,
            reps: ex.reps ? String(ex.reps) : '',
            rest: typeof ex.rest === 'number' ? ex.rest : 0,
            weight: ex.weight || '',
            config: ex.config || {},
            videoUrl: ex.videoUrl || '',
            notes: ex.notes || '',
          })),
        },
      ]

      const data = {
        title: title.trim(),
        focus: focus.trim(),
        type: dayType,
        implements: implementsList,
        blocks,
      }

      await trainingDaysAPI.update(profile.id, day.id, data)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setSaveError('No se pudo guardar el día: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  // =====================
  // DESKTOP VERSION
  // =====================
  const DesktopView = () => (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar profile={profile} activeItem="routines" onNavigate={onNavigate} />

      <main style={styles.desktopMain}>
        <div style={styles.desktopContent}>
          <div style={styles.desktopBackRow}>
            <button type="button" onClick={onBack} style={styles.desktopBackButton}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
              Volver a la rutina
            </button>
          </div>

          <h1 style={styles.title}>
            {day?.id ? 'Editar día' : 'Nuevo día'}
          </h1>

          {loading && <div style={styles.infoBox}>Cargando datos del día...</div>}
          {saveError && <div style={styles.errorBox}>{saveError}</div>}
          {saved && <div style={styles.successBox}>¡Guardado correctamente!</div>}

          {!loading && (
            <>
              {/* Basic Fields */}
              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Información del día</h2>

                <div style={styles.fieldsGrid}>
                  <div style={styles.field}>
                    <label style={styles.label}>Título</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ej: Día 1: Fuerza"
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Tipo de día</label>
                    <select value={dayType} onChange={(e) => setDayType(e.target.value)} style={styles.input}>
                      <option value="">Sin tipo</option>
                      {DAY_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
                    <label style={styles.label}>Foco / Descripción</label>
                    <input
                      type="text"
                      value={focus}
                      onChange={(e) => setFocus(e.target.value)}
                      placeholder="Ej: Empuje y Tracción (Fuerza)"
                      style={styles.input}
                    />
                  </div>
                </div>
              </div>

              {/* Implements */}
              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Implementos</h2>
                <div style={styles.implementInputRow}>
                  <input
                    type="text"
                    value={newImplement}
                    onChange={(e) => setNewImplement(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddImplement() }}
                    placeholder="Ej: barra, mancuernas, banda..."
                    style={{ ...styles.input, flex: 1 }}
                  />
                  <button type="button" onClick={handleAddImplement} style={styles.chipAddButton}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                  </button>
                </div>
                {implementsList.length > 0 && (
                  <div style={styles.chipsRow}>
                    {implementsList.map((item, idx) => (
                      <span key={idx} style={styles.chip}>
                        {item}
                        <button
                          type="button"
                          onClick={() => handleRemoveImplement(idx)}
                          style={styles.chipRemove}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Exercises */}
              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Ejercicios</h2>
                <ExerciseList
                  exercises={exercises}
                  onChange={setExercises}
                />
              </div>

              {/* Save */}
              <div style={styles.saveRow}>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  style={{ ...styles.saveButton, opacity: saving ? 0.6 : 1 }}
                >
                  {saving ? 'Guardando...' : 'Guardar día'}
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )

  // =====================
  // MOBILE VERSION
  // =====================
  const MobileView = () => (
    <div style={{ minHeight: '100vh', backgroundColor: colors.background, fontFamily: typography.fontFamily.body }}>
      <header style={styles.mobileHeader}>
        <button onClick={onBack} style={styles.mobileBackButton}>
          <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>arrow_back</span>
        </button>
        <span style={styles.mobileTitle}>{day?.id ? 'Editar día' : 'Nuevo día'}</span>
        <div style={{ width: '40px' }} />
      </header>

      <main style={styles.mobileMain}>
        {loading && <div style={styles.infoBox}>Cargando...</div>}
        {saveError && <div style={styles.errorBox}>{saveError}</div>}
        {saved && <div style={styles.successBox}>¡Guardado!</div>}

        {!loading && (
          <>
            <div style={styles.mobileSection}>
              <h2 style={styles.mobileSectionTitle}>Información</h2>
              <div style={styles.field}>
                <label style={styles.label}>Título</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Día 1: Fuerza"
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Tipo</label>
                <select value={dayType} onChange={(e) => setDayType(e.target.value)} style={styles.input}>
                  <option value="">Sin tipo</option>
                  {DAY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Foco</label>
                <input
                  type="text"
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                  placeholder="Foco del día"
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.mobileSection}>
              <h2 style={styles.mobileSectionTitle}>Implementos</h2>
              <div style={styles.implementInputRow}>
                <input
                  type="text"
                  value={newImplement}
                  onChange={(e) => setNewImplement(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddImplement() }}
                  placeholder="Agregar implemento..."
                  style={{ ...styles.input, flex: 1 }}
                />
                <button type="button" onClick={handleAddImplement} style={styles.chipAddButton}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                </button>
              </div>
              {implementsList.length > 0 && (
                <div style={styles.chipsRow}>
                  {implementsList.map((item, idx) => (
                    <span key={idx} style={styles.chip}>
                      {item}
                      <button type="button" onClick={() => handleRemoveImplement(idx)} style={styles.chipRemove}>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div style={styles.mobileSection}>
              <h2 style={styles.mobileSectionTitle}>Ejercicios</h2>
              <ExerciseList exercises={exercises} onChange={setExercises} />
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                ...styles.mobileSaveButton,
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Guardando...' : 'Guardar día'}
            </button>
          </>
        )}
      </main>

      <BottomNav activeItem="routines" onNavigate={onNavigate} />
    </div>
  )

  return (
    <div className="day-editor-container">
      {isDesktop ? DesktopView() : MobileView()}
    </div>
  )
}

const styles = {
  // Desktop
  title: { fontSize: '3rem', fontFamily: typography.fontFamily.heading, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '1.5rem' },
  desktopBackRow: { marginBottom: '0.75rem' },
  desktopBackButton: { border: 'none', borderRadius: borderRadius.full, backgroundColor: colors.surfaceContainerLow, color: colors.onSurfaceVariant, padding: '0.42rem 0.72rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' },
  desktopMain: { marginLeft: '280px', flex: 1, minHeight: '100vh', display: 'flex', justifyContent: 'center', padding: '2rem' },
  desktopContent: { maxWidth: '900px', width: '100%' },

  // Sections
  section: { marginBottom: '2rem' },
  sectionTitle: { fontSize: '0.82rem', fontFamily: typography.fontFamily.heading, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: colors.onSurfaceVariant, marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: `1px solid ${colors.surfaceContainerHighest}` },
  fieldsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' },

  // Form fields
  field: { marginBottom: '0.75rem' },
  label: { display: 'block', fontSize: '0.72rem', fontWeight: 700, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' },
  input: { width: '100%', backgroundColor: colors.surfaceContainerHigh, border: `1px solid ${colors.surfaceContainerHighest}`, borderRadius: borderRadius.md, padding: '0.6rem 0.75rem', color: colors.onSurface, fontFamily: typography.fontFamily.body, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' },

  // Implement chips
  implementInputRow: { display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' },
  chipAddButton: { width: '36px', height: '36px', borderRadius: borderRadius.md, backgroundColor: colors.primary, color: colors.onPrimaryFixed, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  chipsRow: { display: 'flex', flexWrap: 'wrap', gap: '0.4rem' },
  chip: { display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', fontWeight: 600, color: colors.onSurfaceVariant, backgroundColor: colors.surfaceContainerHigh, padding: '0.3rem 0.6rem', borderRadius: borderRadius.full, border: `1px solid ${colors.surfaceContainerHighest}` },
  chipRemove: { width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'transparent', border: 'none', color: colors.onSurfaceVariant, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 },

  // Save
  saveRow: { display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' },
  saveButton: { border: 'none', borderRadius: borderRadius.md, backgroundColor: colors.primary, color: colors.onPrimaryFixed, padding: '0.7rem 1.5rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' },

  // Status boxes
  infoBox: { backgroundColor: colors.surfaceContainerHigh, color: colors.onSurfaceVariant, padding: '0.6rem 0.8rem', borderRadius: borderRadius.md, marginBottom: '1rem', fontSize: '0.8rem', border: `1px solid ${colors.surfaceContainerHighest}` },
  errorBox: { backgroundColor: colors.errorContainer, color: colors.error, padding: '0.75rem 1rem', borderRadius: borderRadius.md, marginBottom: '1rem', fontSize: '0.875rem' },
  successBox: { backgroundColor: colors.tertiaryContainer, color: colors.onTertiary, padding: '0.6rem 0.8rem', borderRadius: borderRadius.md, marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 600 },

  // Mobile
  mobileHeader: { position: 'fixed', top: 0, left: 0, right: 0, height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem', backgroundColor: colors.background, borderBottom: `1px solid ${colors.surfaceContainerHighest}`, zIndex: 50 },
  mobileBackButton: { width: '40px', height: '40px', borderRadius: '50%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.onSurface },
  mobileTitle: { fontFamily: typography.fontFamily.heading, fontWeight: 700, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: colors.onSurface },
  mobileMain: { padding: '80px 1rem 100px' },
  mobileSection: { marginBottom: '1.5rem' },
  mobileSectionTitle: { fontSize: '0.75rem', fontWeight: 700, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem', paddingBottom: '0.35rem', borderBottom: `1px solid ${colors.surfaceContainerHighest}` },
  mobileSaveButton: { width: '100%', border: 'none', borderRadius: borderRadius.md, backgroundColor: colors.primary, color: colors.onPrimaryFixed, padding: '0.85rem', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', marginBottom: '1rem' },
}

export default DayEditor
