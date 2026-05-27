import React, { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { colors, typography, borderRadius } from '../../styles/tokens'
import { Sidebar, BottomNav } from '../../components/navigation'
import { routinesAPI, trainingDaysAPI } from '../../utils/api'
import { useBreakpoint } from '../../hooks/useBreakpoint'

const RoutineEditor = ({ routineId, onEditDay, onBack, onNavigate }) => {
  const { profile } = useAuth()
  const { isDesktop } = useBreakpoint()

  const [routine, setRoutine] = useState(null)
  const [days, setDays] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [deleteDayId, setDeleteDayId] = useState(null)
  const [deletingDay, setDeletingDay] = useState(false)
  const [creatingDay, setCreatingDay] = useState(false)

  const loadRoutine = async () => {
    if (!profile?.id || !routineId) return
    setLoading(true)
    setError('')
    try {
      const data = await routinesAPI.get(profile.id, routineId)
      setRoutine(data)
      setName(data.name || '')

      // Load days — from relationship or via API
      let daysData = []
      if (data.training_days && Array.isArray(data.training_days)) {
        daysData = data.training_days
      }
      // Also try loading days filtered by this routine
      try {
        const remoteDays = await trainingDaysAPI.list(profile.id, routineId)
        if (Array.isArray(remoteDays) && remoteDays.length > 0) {
          daysData = remoteDays
        }
      } catch {
        // Fall back to what we have
      }

      setDays(daysData)
    } catch (e) {
      setError('No se pudo cargar la rutina')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRoutine()
  }, [profile?.id, routineId])

  const handleSaveName = async () => {
    if (!profile?.id || !routineId || !name.trim()) return
    setSavingName(true)
    try {
      const updated = await routinesAPI.update(profile.id, routineId, { name: name.trim() })
      setRoutine((prev) => ({ ...prev, name: updated.name || name.trim() }))
      setEditingName(false)
    } catch {
      setError('No se pudo actualizar el nombre')
    } finally {
      setSavingName(false)
    }
  }

  const handleAddDay = async () => {
    if (!profile?.id || !routineId) return
    setCreatingDay(true)
    setError('')
    try {
      const nextNumber = days.length > 0 ? Math.max(...days.map((d) => d.day_number || 0)) + 1 : 1
      const newDay = await trainingDaysAPI.create(profile.id, {
        title: `Día ${nextNumber}`,
        focus: '',
        day_number: nextNumber,
        routine_id: routineId,
        blocks: [
          {
            name: 'Ejercicios',
            config: { micro_pause: 60, macro_pause: 120 },
            exercises: [],
          },
        ],
      })
      setDays((prev) => [...prev, newDay])
      // Navigate to DayEditor for the new day
      onEditDay(newDay)
    } catch (e) {
      setError('No se pudo crear el día: ' + e.message)
    } finally {
      setCreatingDay(false)
    }
  }

  const handleDeleteDay = async (dayId) => {
    if (!profile?.id) return
    setDeletingDay(true)
    try {
      // Soft-delete: set is_active to 0
      await trainingDaysAPI.update(profile.id, dayId, { is_active: false })
      setDays((prev) => prev.filter((d) => d.id !== dayId))
      setDeleteDayId(null)
    } catch {
      setError('No se pudo eliminar el día')
    } finally {
      setDeletingDay(false)
    }
  }

  const getExerciseCount = (day) => {
    if (!day.blocks) return 0
    if (Array.isArray(day.blocks[0]?.exercises)) {
      return day.blocks.reduce((sum, b) => sum + (b.exercises?.length || 0), 0)
    }
    // Flat format
    return day.blocks.length
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
              Volver a rutinas
            </button>
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}
          {loading && <div style={styles.infoBox}>Cargando rutina...</div>}

          {!loading && routine && (
            <>
              {/* Editable Routine Name */}
              <div style={styles.nameSection}>
                {editingName ? (
                  <div style={styles.nameEditRow}>
                    <input
                      autoFocus
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName()
                        if (e.key === 'Escape') { setEditingName(false); setName(routine.name) }
                      }}
                      style={styles.nameInput}
                    />
                    <button type="button" onClick={handleSaveName} disabled={savingName} style={styles.nameSaveBtn}>
                      {savingName ? '...' : <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check</span>}
                    </button>
                    <button type="button" onClick={() => { setEditingName(false); setName(routine.name) }} style={styles.nameCancelBtn}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                    </button>
                  </div>
                ) : (
                  <div style={styles.nameDisplayRow}>
                    <h1 style={styles.title}>{routine.name}</h1>
                    <button type="button" onClick={() => setEditingName(true)} style={styles.editNameButton}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                    </button>
                  </div>
                )}
                <p style={styles.subtitle}>{days.length} día{days.length !== 1 ? 's' : ''}</p>
              </div>

              {/* Days List */}
              <div style={styles.section}>
                <div style={styles.sectionHeader}>
                  <span style={styles.sectionTitle}>Días de entrenamiento</span>
                  <button
                    type="button"
                    onClick={handleAddDay}
                    disabled={creatingDay}
                    style={{ ...styles.addDayButton, opacity: creatingDay ? 0.6 : 1 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                    {creatingDay ? 'Creando...' : 'Agregar día'}
                  </button>
                </div>

                {days.length === 0 && (
                  <div style={styles.emptyDays}>
                    <span className="material-symbols-outlined" style={{ fontSize: '40px', color: colors.onSurfaceVariant }}>calendar_month</span>
                    <p style={styles.emptyText}>Esta rutina no tiene días todavía. Agregá el primero.</p>
                  </div>
                )}

                {days.length > 0 && (
                  <div style={styles.daysGrid}>
                    {days.map((day) => {
                      const exCount = getExerciseCount(day)
                      return (
                        <div key={day.id} style={styles.dayCard}>
                          <button
                            type="button"
                            onClick={() => onEditDay(day)}
                            style={styles.dayCardBody}
                          >
                            <div style={styles.dayCardHeader}>
                              <span style={styles.dayNumber}>
                                DÍA {day.day_number || day.id?.toString().padStart(2, '0')}
                              </span>
                            </div>
                            <h3 style={styles.dayCardTitle}>
                              {day.title || `Día ${day.day_number || day.id}`}
                            </h3>
                            {day.focus && <p style={styles.dayCardFocus}>{day.focus}</p>}
                            <div style={styles.dayCardFooter}>
                              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: colors.tertiary }}>fitness_center</span>
                              <span>{exCount} ejercicio{exCount !== 1 ? 's' : ''}</span>
                            </div>
                          </button>

                          <div style={styles.dayCardActions}>
                            {deleteDayId === day.id ? (
                              <div style={styles.deleteConfirmInline}>
                                <span style={styles.deleteConfirmText}>¿Eliminar?</span>
                                <button
                                  type="button"
                                  onClick={() => setDeleteDayId(null)}
                                  style={styles.cancelSmallBtn}
                                >
                                  No
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDay(day.id)}
                                  disabled={deletingDay}
                                  style={styles.confirmDeleteBtn}
                                >
                                  {deletingDay ? '...' : 'Sí'}
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setDeleteDayId(day.id)}
                                style={styles.dayDeleteBtn}
                                title="Eliminar día"
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: colors.error }}>delete</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
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
        <span style={styles.mobileTitle}>{routine?.name || 'Editar rutina'}</span>
        <div style={{ width: '40px' }} />
      </header>

      <main style={styles.mobileMain}>
        {error && <div style={styles.errorBox}>{error}</div>}
        {loading && <div style={styles.infoBox}>Cargando...</div>}

        {!loading && routine && (
          <>
            {/* Edit name inline */}
            {editingName ? (
              <div style={styles.mobileNameEdit}>
                <input
                  autoFocus
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName()
                    if (e.key === 'Escape') { setEditingName(false); setName(routine.name) }
                  }}
                  style={styles.mobileNameInput}
                />
                <div style={styles.mobileNameEditActions}>
                  <button type="button" onClick={() => { setEditingName(false); setName(routine.name) }} style={styles.cancelButton}>Cancelar</button>
                  <button type="button" onClick={handleSaveName} disabled={savingName} style={styles.saveButton}>
                    {savingName ? '...' : 'Guardar'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={styles.mobileNameRow}>
                <h1 style={styles.mobileRoutineName}>{routine.name}</h1>
                <button type="button" onClick={() => setEditingName(true)} style={styles.mobileEditNameBtn}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                </button>
              </div>
            )}

            {/* Add day button */}
            <button
              type="button"
              onClick={handleAddDay}
              disabled={creatingDay}
              style={{ ...styles.mobileAddDayBtn, opacity: creatingDay ? 0.6 : 1 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
              {creatingDay ? 'Creando...' : 'Agregar día'}
            </button>

            {/* Days list */}
            {days.length === 0 && (
              <div style={styles.mobileEmptyDays}>
                <p style={styles.emptyText}>Sin días todavía.</p>
              </div>
            )}

            {days.length > 0 && (
              <div style={styles.mobileDaysList}>
                {days.map((day) => {
                  const exCount = getExerciseCount(day)
                  return (
                    <div key={day.id} style={styles.mobileDayCard}>
                      <button
                        type="button"
                        onClick={() => onEditDay(day)}
                        style={styles.mobileDayCardBody}
                      >
                        <div style={styles.mobileDayInfo}>
                          <span style={styles.mobileDayNum}>
                            {day.day_number || day.id?.toString().padStart(2, '0')}
                          </span>
                          <div style={styles.mobileDayText}>
                            <span style={styles.mobileDayTitle}>{day.title || `Día ${day.day_number || day.id}`}</span>
                            {day.focus && <span style={styles.mobileDayFocus}>{day.focus}</span>}
                          </div>
                        </div>
                        <div style={styles.mobileDayMeta}>
                          <span style={styles.mobileExCount}>{exCount} ej.</span>
                          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: colors.onSurfaceVariant }}>chevron_right</span>
                        </div>
                      </button>

                      {deleteDayId === day.id ? (
                        <div style={styles.mobileDeleteConfirm}>
                          <span style={styles.deleteConfirmText}>¿Eliminar este día?</span>
                          <div style={styles.mobileDeleteActions}>
                            <button type="button" onClick={() => setDeleteDayId(null)} style={styles.cancelSmallBtn}>No</button>
                            <button type="button" onClick={() => handleDeleteDay(day.id)} disabled={deletingDay} style={styles.confirmDeleteBtn}>
                              {deletingDay ? '...' : 'Sí, eliminar'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={styles.mobileDayDeleteRow}>
                          <button
                            type="button"
                            onClick={() => setDeleteDayId(day.id)}
                            style={styles.mobileDayDeleteBtn}
                            title="Eliminar día"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: colors.error }}>delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </main>

      <BottomNav activeItem="routines" onNavigate={onNavigate} />
    </div>
  )

  return (
    <div className="routine-editor-container">
      {isDesktop ? DesktopView() : MobileView()}
    </div>
  )
}

const styles = {
  // Shared
  title: { fontSize: '3rem', fontFamily: typography.fontFamily.heading, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1, margin: 0 },
  subtitle: { color: colors.onSurfaceVariant, fontSize: '0.9rem', marginTop: '0.25rem' },
  desktopBackRow: { marginBottom: '0.75rem' },
  desktopBackButton: { border: 'none', borderRadius: borderRadius.full, backgroundColor: colors.surfaceContainerLow, color: colors.onSurfaceVariant, padding: '0.42rem 0.72rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' },
  errorBox: { backgroundColor: colors.errorContainer, color: colors.error, padding: '0.75rem 1rem', borderRadius: borderRadius.md, marginBottom: '1rem', fontSize: '0.875rem' },
  infoBox: { backgroundColor: colors.surfaceContainerHigh, color: colors.onSurfaceVariant, padding: '0.6rem 0.8rem', borderRadius: borderRadius.md, marginBottom: '1rem', fontSize: '0.8rem', border: `1px solid ${colors.surfaceContainerHighest}` },

  // Desktop
  desktopMain: { marginLeft: '280px', flex: 1, minHeight: '100vh', display: 'flex', justifyContent: 'center', padding: '2rem' },
  desktopContent: { maxWidth: '900px', width: '100%' },

  // Name section
  nameSection: { marginBottom: '2rem' },
  nameDisplayRow: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  editNameButton: { width: '36px', height: '36px', borderRadius: '50%', backgroundColor: colors.surfaceContainerHigh, border: 'none', color: colors.onSurfaceVariant, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  nameEditRow: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  nameInput: { flex: 1, backgroundColor: colors.surfaceContainerHigh, border: `1px solid ${colors.primary}`, borderRadius: borderRadius.md, padding: '0.6rem 0.75rem', color: colors.onSurface, fontFamily: typography.fontFamily.body, fontSize: '1.5rem', fontWeight: 700, outline: 'none', maxWidth: '400px' },
  nameSaveBtn: { width: '36px', height: '36px', borderRadius: borderRadius.md, backgroundColor: colors.primary, color: colors.onPrimaryFixed, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  nameCancelBtn: { width: '36px', height: '36px', borderRadius: borderRadius.md, backgroundColor: colors.surfaceContainerHigh, color: colors.onSurfaceVariant, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },

  // Section
  section: { marginTop: '1.5rem' },
  sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: `1px solid ${colors.surfaceContainerHighest}` },
  sectionTitle: { fontSize: '0.82rem', fontWeight: 700, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.08em' },
  addDayButton: { display: 'inline-flex', alignItems: 'center', gap: '0.3rem', border: 'none', borderRadius: borderRadius.md, backgroundColor: colors.primary, color: colors.onPrimaryFixed, padding: '0.45rem 0.8rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' },

  // Days grid
  daysGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' },
  dayCard: { backgroundColor: colors.surfaceContainerLow, borderRadius: borderRadius.lg, border: `1px solid ${colors.surfaceContainerHighest}`, overflow: 'hidden' },
  dayCardBody: { display: 'block', width: '100%', padding: '1.25rem', textAlign: 'left', border: 'none', background: 'none', color: 'inherit', cursor: 'pointer' },
  dayCardHeader: { marginBottom: '0.5rem' },
  dayNumber: { fontSize: '0.7rem', fontWeight: 700, color: colors.primary, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: typography.fontFamily.heading },
  dayCardTitle: { fontSize: '1.1rem', fontFamily: typography.fontFamily.heading, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em', margin: 0, marginBottom: '0.25rem' },
  dayCardFocus: { fontSize: '0.8rem', color: colors.onSurfaceVariant, margin: 0, marginBottom: '0.5rem' },
  dayCardFooter: { display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: colors.onSurfaceVariant, fontWeight: 600 },
  dayCardActions: { display: 'flex', justifyContent: 'flex-end', padding: '0 1rem 0.75rem' },
  dayDeleteBtn: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },

  // Delete confirm
  deleteConfirmInline: { display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.5rem', backgroundColor: colors.surfaceContainerHigh, borderRadius: borderRadius.md },
  deleteConfirmText: { fontSize: '0.7rem', fontWeight: 600, color: colors.error },
  cancelSmallBtn: { border: 'none', borderRadius: borderRadius.md, backgroundColor: colors.surfaceContainerHighest, color: colors.onSurfaceVariant, padding: '0.25rem 0.5rem', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer' },
  confirmDeleteBtn: { border: 'none', borderRadius: borderRadius.md, backgroundColor: colors.error, color: colors.onPrimaryFixed, padding: '0.25rem 0.5rem', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer' },

  // Empty days
  emptyDays: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', textAlign: 'center', gap: '0.75rem', backgroundColor: colors.surfaceContainerLow, borderRadius: borderRadius.lg, border: `1px dashed ${colors.surfaceContainerHighest}` },
  emptyText: { color: colors.onSurfaceVariant, fontSize: '0.9rem', margin: 0 },

  // Cancel / Save buttons
  cancelButton: { border: 'none', borderRadius: borderRadius.md, backgroundColor: colors.surfaceContainerHigh, color: colors.onSurfaceVariant, padding: '0.5rem 0.85rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' },
  saveButton: { border: 'none', borderRadius: borderRadius.md, backgroundColor: colors.primary, color: colors.onPrimaryFixed, padding: '0.5rem 0.85rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' },

  // Mobile
  mobileHeader: { position: 'fixed', top: 0, left: 0, right: 0, height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem', backgroundColor: colors.background, borderBottom: `1px solid ${colors.surfaceContainerHighest}`, zIndex: 50 },
  mobileBackButton: { width: '40px', height: '40px', borderRadius: '50%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.onSurface },
  mobileTitle: { fontFamily: typography.fontFamily.heading, fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: colors.onSurface, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px', textAlign: 'center' },
  mobileMain: { padding: '80px 1rem 100px' },
  mobileNameRow: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' },
  mobileRoutineName: { fontSize: '1.5rem', fontFamily: typography.fontFamily.heading, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', flex: 1 },
  mobileEditNameBtn: { width: '36px', height: '36px', borderRadius: '50%', backgroundColor: colors.surfaceContainerHigh, border: 'none', color: colors.onSurfaceVariant, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  mobileNameEdit: { marginBottom: '1rem' },
  mobileNameInput: { width: '100%', backgroundColor: colors.surfaceContainerHigh, border: `1px solid ${colors.primary}`, borderRadius: borderRadius.md, padding: '0.6rem 0.75rem', color: colors.onSurface, fontFamily: typography.fontFamily.body, fontSize: '1.1rem', fontWeight: 700, outline: 'none', boxSizing: 'border-box', marginBottom: '0.5rem' },
  mobileNameEditActions: { display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' },
  mobileAddDayBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', width: '100%', border: 'none', borderRadius: borderRadius.md, backgroundColor: colors.primary, color: colors.onPrimaryFixed, padding: '0.7rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', marginBottom: '1rem' },
  mobileEmptyDays: { padding: '2rem', textAlign: 'center' },
  mobileDaysList: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  mobileDayCard: { backgroundColor: colors.surfaceContainerLow, borderRadius: borderRadius.lg, border: `1px solid ${colors.surfaceContainerHighest}`, overflow: 'hidden' },
  mobileDayCardBody: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '1rem', textAlign: 'left', border: 'none', background: 'none', color: 'inherit', cursor: 'pointer', gap: '0.5rem' },
  mobileDayInfo: { display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 },
  mobileDayNum: { fontSize: '1.25rem', fontFamily: typography.fontFamily.heading, fontWeight: 900, color: colors.primary, minWidth: '24px' },
  mobileDayText: { flex: 1 },
  mobileDayTitle: { display: 'block', fontSize: '0.9rem', fontWeight: 700, color: colors.onSurface },
  mobileDayFocus: { display: 'block', fontSize: '0.72rem', color: colors.onSurfaceVariant, marginTop: '0.1rem' },
  mobileDayMeta: { display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 },
  mobileExCount: { fontSize: '0.72rem', color: colors.onSurfaceVariant, fontWeight: 600 },
  mobileDayDeleteRow: { display: 'flex', justifyContent: 'flex-end', padding: '0 0.5rem 0.5rem' },
  mobileDayDeleteBtn: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  mobileDeleteConfirm: { padding: '0.75rem', backgroundColor: colors.surfaceContainerHigh, borderTop: `1px solid ${colors.surfaceContainerHighest}` },
  mobileDeleteActions: { display: 'flex', gap: '0.4rem', marginTop: '0.4rem', justifyContent: 'flex-end' },
}

export default RoutineEditor
