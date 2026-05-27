import React, { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { colors, typography, borderRadius } from '../../styles/tokens'
import { Sidebar, BottomNav } from '../../components/navigation'
import { routinesAPI } from '../../utils/api'
import { useBreakpoint } from '../../hooks/useBreakpoint'

const RoutineManager = ({ onBack, onNavigate }) => {
  const { profile } = useAuth()
  const { isDesktop } = useBreakpoint()
  const [routines, setRoutines] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newRoutineName, setNewRoutineName] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)

  const loadRoutines = async () => {
    if (!profile?.id) return
    setLoading(true)
    setError('')
    try {
      const data = await routinesAPI.list(profile.id)
      setRoutines(Array.isArray(data) ? data : [])
    } catch (e) {
      setError('No se pudieron cargar las rutinas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRoutines()
  }, [profile?.id])

  const handleCreate = async () => {
    if (!profile?.id || !newRoutineName.trim()) return
    try {
      const created = await routinesAPI.create(profile.id, { name: newRoutineName.trim() })
      setRoutines((prev) => [...prev, created])
      setNewRoutineName('')
      setShowCreateForm(false)
    } catch (e) {
      setError('No se pudo crear la rutina')
    }
  }

  const handleSelect = async (routineId) => {
    if (!profile?.id) return
    try {
      await routinesAPI.select(profile.id, routineId)
      setRoutines((prev) =>
        prev.map((r) => ({
          ...r,
          is_selected: r.id === routineId ? 1 : 0,
        }))
      )
    } catch (e) {
      setError('No se pudo seleccionar la rutina')
    }
  }

  const handleDelete = async (routineId) => {
    if (!profile?.id) return
    try {
      await routinesAPI.remove(profile.id, routineId)
      setRoutines((prev) => prev.filter((r) => r.id !== routineId))
      setDeleteConfirmId(null)
    } catch (e) {
      setError('No se pudo eliminar la rutina')
    }
  }

  const getDayCount = (routine) => {
    if (routine.training_days && Array.isArray(routine.training_days)) {
      return routine.training_days.length
    }
    return 0
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
              Volver al menú
            </button>
          </div>

          <h1 style={styles.title}>Rutinas</h1>
          <p style={styles.subtitle}>Administrá tus rutinas de entrenamiento</p>

          {error && <div style={styles.errorBox}>{error}</div>}

          {/* Header + Create */}
          <div style={styles.headerRow}>
            <span style={styles.countLabel}>{routines.length} rutina{routines.length !== 1 ? 's' : ''}</span>
            <button type="button" onClick={() => setShowCreateForm(true)} style={styles.createButton}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
              Nueva rutina
            </button>
          </div>

          {/* Create Form */}
          {showCreateForm && (
            <div style={styles.createForm}>
              <input
                autoFocus
                type="text"
                value={newRoutineName}
                onChange={(e) => setNewRoutineName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setShowCreateForm(false) }}
                placeholder="Nombre de la rutina"
                style={styles.createInput}
              />
              <div style={styles.createActions}>
                <button type="button" onClick={() => { setShowCreateForm(false); setNewRoutineName('') }} style={styles.cancelButton}>
                  Cancelar
                </button>
                <button type="button" onClick={handleCreate} disabled={!newRoutineName.trim()} style={{ ...styles.saveButton, opacity: !newRoutineName.trim() ? 0.6 : 1 }}>
                  Crear
                </button>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && <div style={styles.infoBox}>Cargando rutinas...</div>}

          {/* Routine List */}
          {!loading && routines.length === 0 && (
            <div style={styles.emptyState}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: colors.onSurfaceVariant }}>fitness_center</span>
              <p style={styles.emptyText}>Todavía no tenés rutinas. Creá una para empezar.</p>
            </div>
          )}

          {!loading && routines.length > 0 && (
            <div style={styles.routineGrid}>
              {routines.map((routine) => (
                <div key={routine.id} style={{ ...styles.routineCard, ...(routine.is_selected === 1 ? styles.routineCardActive : {}) }}>
                  <div style={styles.routineCardHeader}>
                    <div style={styles.routineNameRow}>
                      <h3 style={styles.routineName}>{routine.name}</h3>
                      {routine.is_selected === 1 && (
                        <span style={styles.activeBadge}>Activa</span>
                      )}
                    </div>
                    <span style={styles.dayCount}>
                      {getDayCount(routine)} día{getDayCount(routine) !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div style={styles.routineCardActions}>
                    {routine.is_selected !== 1 && (
                      <button type="button" onClick={() => handleSelect(routine.id)} style={styles.selectButton} title="Seleccionar como activa">
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>radio_button_unchecked</span>
                        Seleccionar
                      </button>
                    )}
                    {routine.is_selected === 1 && (
                      <span style={styles.selectedHint}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: colors.primary }}>check_circle</span>
                        Rutina activa
                      </span>
                    )}
                    <button type="button" onClick={() => setDeleteConfirmId(routine.id)} style={styles.deleteButton} title="Eliminar rutina">
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                    </button>
                  </div>

                  {/* Delete Confirmation */}
                  {deleteConfirmId === routine.id && (
                    <div style={styles.deleteConfirm}>
                      <p style={styles.deleteConfirmText}>¿Eliminar "{routine.name}"?</p>
                      <div style={styles.deleteConfirmActions}>
                        <button type="button" onClick={() => setDeleteConfirmId(null)} style={styles.cancelSmallButton}>
                          Cancelar
                        </button>
                        <button type="button" onClick={() => handleDelete(routine.id)} style={styles.confirmDeleteButton}>
                          Eliminar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
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
        <span style={styles.mobileTitle}>Rutinas</span>
        <div style={{ width: '40px' }} />
      </header>

      <main style={styles.mobileMain}>
        {error && <div style={styles.errorBox}>{error}</div>}

        {/* Create Button */}
        <button type="button" onClick={() => setShowCreateForm(true)} style={styles.mobileCreateButton}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
          Nueva rutina
        </button>

        {/* Create Form */}
        {showCreateForm && (
          <div style={styles.mobileCreateForm}>
            <input
              autoFocus
              type="text"
              value={newRoutineName}
              onChange={(e) => setNewRoutineName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setShowCreateForm(false) }}
              placeholder="Nombre de la rutina"
              style={styles.createInput}
            />
            <div style={styles.createActions}>
              <button type="button" onClick={() => { setShowCreateForm(false); setNewRoutineName('') }} style={styles.cancelButton}>
                Cancelar
              </button>
              <button type="button" onClick={handleCreate} disabled={!newRoutineName.trim()} style={{ ...styles.saveButton, opacity: !newRoutineName.trim() ? 0.6 : 1 }}>
                Crear
              </button>
            </div>
          </div>
        )}

        {loading && <div style={styles.infoBox}>Cargando rutinas...</div>}

        {!loading && routines.length === 0 && (
          <div style={styles.mobileEmptyState}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: colors.onSurfaceVariant }}>fitness_center</span>
            <p style={styles.emptyText}>Todavía no tenés rutinas. Creá una para empezar.</p>
          </div>
        )}

        {!loading && routines.length > 0 && (
          <div style={styles.mobileRoutineList}>
            {routines.map((routine) => (
              <div key={routine.id} style={{ ...styles.mobileRoutineCard, ...(routine.is_selected === 1 ? styles.mobileRoutineCardActive : {}) }}>
                <div style={styles.mobileRoutineInfo}>
                  <div style={styles.mobileRoutineNameRow}>
                    <span style={styles.mobileRoutineName}>{routine.name}</span>
                    {routine.is_selected === 1 && <span style={styles.mobileActiveBadge}>Activa</span>}
                  </div>
                  <span style={styles.mobileDayCount}>{getDayCount(routine)} día{getDayCount(routine) !== 1 ? 's' : ''}</span>
                </div>

                <div style={styles.mobileRoutineActions}>
                  {routine.is_selected !== 1 && (
                    <button type="button" onClick={() => handleSelect(routine.id)} style={styles.mobileSelectBtn} title="Seleccionar como activa">
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>radio_button_unchecked</span>
                    </button>
                  )}
                  {routine.is_selected === 1 && (
                    <span style={{ color: colors.primary }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>check_circle</span>
                    </span>
                  )}
                  <button type="button" onClick={() => setDeleteConfirmId(routine.id)} style={styles.mobileDeleteBtn} title="Eliminar rutina">
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: colors.error }}>delete</span>
                  </button>
                </div>

                {/* Delete Confirmation */}
                {deleteConfirmId === routine.id && (
                  <div style={styles.mobileDeleteConfirm}>
                    <p style={styles.deleteConfirmText}>¿Eliminar "{routine.name}"?</p>
                    <div style={styles.deleteConfirmActions}>
                      <button type="button" onClick={() => setDeleteConfirmId(null)} style={styles.cancelSmallButton}>Cancelar</button>
                      <button type="button" onClick={() => handleDelete(routine.id)} style={styles.confirmDeleteButton}>Eliminar</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav activeItem="routines" onNavigate={onNavigate} />
    </div>
  )

  return (
    <div className="routines-container">
      {isDesktop ? DesktopView() : MobileView()}
    </div>
  )
}

const styles = {
  // Shared
  title: { fontSize: '3rem', fontFamily: typography.fontFamily.heading, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '0.5rem' },
  subtitle: { color: colors.onSurfaceVariant, fontSize: '1rem', marginBottom: '2rem' },
  desktopBackRow: { marginBottom: '0.75rem', display: 'flex', alignItems: 'center' },
  desktopBackButton: { border: 'none', borderRadius: borderRadius.full, backgroundColor: colors.surfaceContainerLow, color: colors.onSurfaceVariant, padding: '0.42rem 0.72rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' },
  errorBox: { backgroundColor: colors.errorContainer, color: colors.error, padding: '0.75rem 1rem', borderRadius: borderRadius.md, marginBottom: '1rem', fontSize: '0.875rem' },
  infoBox: { backgroundColor: colors.surfaceContainerHigh, color: colors.onSurfaceVariant, padding: '0.6rem 0.8rem', borderRadius: borderRadius.md, marginBottom: '1rem', fontSize: '0.8rem', border: `1px solid ${colors.surfaceContainerHighest}` },

  // Header Row
  headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' },
  countLabel: { fontSize: '0.875rem', color: colors.onSurfaceVariant, fontWeight: 600 },
  createButton: { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', border: 'none', borderRadius: borderRadius.md, backgroundColor: colors.primary, color: colors.onPrimaryFixed, padding: '0.6rem 1rem', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' },

  // Create Form
  createForm: { backgroundColor: colors.surfaceContainerLow, borderRadius: borderRadius.lg, padding: '1rem', marginBottom: '1.5rem', border: `1px solid ${colors.surfaceContainerHighest}` },
  createInput: { width: '100%', backgroundColor: colors.surfaceContainerHigh, border: `1px solid ${colors.surfaceContainerHighest}`, borderRadius: borderRadius.md, padding: '0.75rem 1rem', color: colors.onSurface, fontFamily: typography.fontFamily.body, fontSize: '0.95rem', outline: 'none', marginBottom: '0.75rem', boxSizing: 'border-box' },
  createActions: { display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' },
  cancelButton: { border: 'none', borderRadius: borderRadius.md, backgroundColor: colors.surfaceContainerHigh, color: colors.onSurfaceVariant, padding: '0.5rem 0.85rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' },
  saveButton: { border: 'none', borderRadius: borderRadius.md, backgroundColor: colors.primary, color: colors.onPrimaryFixed, padding: '0.5rem 0.85rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' },

  // Empty State
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center' },
  emptyText: { color: colors.onSurfaceVariant, fontSize: '1rem', marginTop: '1rem' },

  // Routine Grid (Desktop)
  routineGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' },
  routineCard: { backgroundColor: colors.surfaceContainerLow, borderRadius: borderRadius.lg, padding: '1.25rem', border: `1px solid ${colors.surfaceContainerHighest}`, display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  routineCardActive: { borderColor: colors.primary },
  routineCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' },
  routineNameRow: { display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' },
  routineName: { fontSize: '1.125rem', fontFamily: typography.fontFamily.heading, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' },
  activeBadge: { fontSize: '0.65rem', fontWeight: 700, color: colors.onPrimaryFixed, backgroundColor: colors.primary, padding: '0.2rem 0.5rem', borderRadius: borderRadius.full, textTransform: 'uppercase', letterSpacing: '0.05em' },
  dayCount: { fontSize: '0.78rem', color: colors.onSurfaceVariant, fontWeight: 600, whiteSpace: 'nowrap' },
  routineCardActions: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 'auto', justifyContent: 'space-between' },
  selectButton: { display: 'inline-flex', alignItems: 'center', gap: '0.3rem', border: 'none', borderRadius: borderRadius.full, backgroundColor: colors.surfaceContainerHigh, color: colors.onSurfaceVariant, padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' },
  selectedHint: { display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: 700, color: colors.primary },
  deleteButton: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'transparent', border: 'none', color: colors.onSurfaceVariant, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' },

  // Delete Confirmation
  deleteConfirm: { backgroundColor: colors.surfaceContainerHigh, borderRadius: borderRadius.md, padding: '0.75rem', marginTop: '0.5rem', border: `1px solid ${colors.error}` },
  deleteConfirmText: { fontSize: '0.8rem', color: colors.error, fontWeight: 600, marginBottom: '0.5rem' },
  deleteConfirmActions: { display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' },
  cancelSmallButton: { border: 'none', borderRadius: borderRadius.md, backgroundColor: colors.surfaceContainerHighest, color: colors.onSurfaceVariant, padding: '0.35rem 0.6rem', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' },
  confirmDeleteButton: { border: 'none', borderRadius: borderRadius.md, backgroundColor: colors.error, color: colors.onPrimaryFixed, padding: '0.35rem 0.6rem', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' },

  // Desktop
  desktopMain: { marginLeft: '280px', flex: 1, minHeight: '100vh', display: 'flex', justifyContent: 'center', padding: '2rem' },
  desktopContent: { maxWidth: '900px', width: '100%' },

  // Mobile
  mobileHeader: { position: 'fixed', top: 0, left: 0, right: 0, height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem', backgroundColor: colors.background, borderBottom: `1px solid ${colors.surfaceContainerHighest}`, zIndex: 50 },
  mobileBackButton: { width: '40px', height: '40px', borderRadius: '50%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.onSurface },
  mobileTitle: { fontFamily: typography.fontFamily.heading, fontWeight: 700, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: colors.onSurface },
  mobileMain: { padding: '80px 1rem 100px' },
  mobileCreateButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', width: '100%', border: 'none', borderRadius: borderRadius.md, backgroundColor: colors.primary, color: colors.onPrimaryFixed, padding: '0.75rem 1rem', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', marginBottom: '1rem' },
  mobileCreateForm: { marginBottom: '1rem' },
  mobileEmptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 1rem', textAlign: 'center' },
  mobileRoutineList: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  mobileRoutineCard: { backgroundColor: colors.surfaceContainerLow, borderRadius: borderRadius.lg, padding: '1rem', border: `1px solid ${colors.surfaceContainerHighest}`, display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  mobileRoutineCardActive: { borderColor: colors.primary },
  mobileRoutineInfo: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  mobileRoutineNameRow: { display: 'flex', alignItems: 'center', gap: '0.4rem' },
  mobileRoutineName: { fontSize: '1rem', fontFamily: typography.fontFamily.heading, fontWeight: 700, textTransform: 'uppercase' },
  mobileActiveBadge: { fontSize: '0.55rem', fontWeight: 700, color: colors.onPrimaryFixed, backgroundColor: colors.primary, padding: '0.15rem 0.4rem', borderRadius: borderRadius.full, textTransform: 'uppercase' },
  mobileDayCount: { fontSize: '0.75rem', color: colors.onSurfaceVariant, fontWeight: 600 },
  mobileRoutineActions: { display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' },
  mobileSelectBtn: { width: '36px', height: '36px', borderRadius: '50%', backgroundColor: colors.surfaceContainerHigh, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.onSurfaceVariant },
  mobileDeleteBtn: { width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  mobileDeleteConfirm: { backgroundColor: colors.surfaceContainerHigh, borderRadius: borderRadius.md, padding: '0.75rem', marginTop: '0.25rem', border: `1px solid ${colors.error}` },
}

export default RoutineManager
