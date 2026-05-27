import React, { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import planData from '../../data/plan.json'
import { colors, typography, spacing, borderRadius, shadows } from '../../styles/tokens'
import { Sidebar, BottomNav } from '../../components/navigation'
import { trainingDaysAPI } from '../../utils/api'
import RoutineSelector from '../routines/RoutineSelector'

const MainMenu = ({ onSelectDay, onNavigate }) => {
  const { profile } = useAuth()
  const [days, setDays] = useState(planData.days)
  const [loadingDays, setLoadingDays] = useState(true)
  const [daysError, setDaysError] = useState('')
  const [selectedRoutineId, setSelectedRoutineId] = useState(null)

  const loadDays = useCallback(async () => {
    if (!profile?.id) {
      setDays(planData.days)
      setLoadingDays(false)
      return
    }

    setLoadingDays(true)
    setDaysError('')

    try {
      // Pass routine_id filter when a routine is selected
      const response = await trainingDaysAPI.list(profile.id, selectedRoutineId)
      const remoteDays = Array.isArray(response) ? response : (response?.days || [])
      if (remoteDays.length > 0) {
        setDays(remoteDays)
      } else {
        setDays(planData.days)
      }
    } catch (error) {
      setDays(planData.days)
      setDaysError('No se pudieron cargar los días del backend. Mostrando plan local.')
    } finally {
      setLoadingDays(false)
    }
  }, [profile?.id, selectedRoutineId])

  useEffect(() => {
    loadDays()
  }, [loadDays])

  const handleRoutineChange = (routineId) => {
    setSelectedRoutineId(routineId)
  }

  // =====================
  // DESKTOP VERSION (≥1024px)
  // =====================
  const DesktopView = () => (
    <div style={{ minHeight: '100vh' }}>
      <Sidebar profile={profile} activeItem="days" onNavigate={onNavigate} />
      
      <main style={styles.desktopMain}>
        <div style={styles.desktopContent}>
          <h1 style={styles.desktopTitle}>
            Días de <span style={{ color: colors.primary }}>Entreno</span>
          </h1>
          <p style={styles.desktopSubtitle}>Seleccioná un día para ver los ejercicios</p>

          {/* Routine Selector + Edit Link */}
          <div style={styles.desktopRoutineRow}>
            <RoutineSelector
              profileId={profile?.id}
              onRoutineChange={handleRoutineChange}
            />
            <button
              type="button"
              onClick={() => onNavigate?.('routines')}
              style={styles.editRoutinesLink}
              title="Editar rutinas"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>tune</span>
              Editar rutinas
            </button>
          </div>

          {loadingDays && <p style={styles.infoText}>Cargando días desde backend...</p>}
          {!loadingDays && daysError && <p style={styles.warningText}>{daysError}</p>}

          {/* Grid 3 columnas */}
          <div style={styles.desktopGrid}>
            {days.map((day, index) => {
              // Solo contar ejercicios de "Fase Principal" o similar (no calentamiento)
              const mainBlock = day.blocks?.find(b => b.name.toLowerCase().includes('principal') || b.name.toLowerCase().includes('fase'))
              const totalExercises = mainBlock?.exercises?.length || 0
              return (
                <button key={day.id} onClick={() => onSelectDay?.(day)} style={{...styles.desktopCard, ...(index === 0 ? styles.todayCard : {})}}>
                  <div style={styles.cardHeader}>
                    <span style={styles.dayNumber}>DAY {day.id.toString().padStart(2, '0')}</span>
                    {index === 0 && <span style={styles.todayBadge}>HOY</span>}
                  </div>
                  <h3 style={styles.cardTitle}>{day.title}</h3>
                  <p style={styles.cardFocus}>{day.focus}</p>
                  <div style={styles.exerciseCount}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>fitness_center</span>
                    <span>{totalExercises} ejercicios</span>
                  </div>
                  <div style={styles.implementsRow}>
                    {(Array.isArray(day.implements) ? day.implements : []).slice(0, 3).map((item, i) => (
                      <span key={i} style={styles.implementChip}>{item}</span>
                    ))}
                  </div>
                  <div style={styles.arrow}><span className="material-symbols-outlined" style={{ fontSize: '24px' }}>arrow_forward</span></div>
                </button>
              )
            })}
          </div>

          {/* Stats Cards - Desktop: QUITOS porque ya están en sidebar */}
        </div>
      </main>
    </div>
  )

  // =====================
  // MOBILE VERSION (<1024px)
  // =====================
  const MobileView = () => (
    <div style={{ minHeight: '100vh', backgroundColor: colors.background, fontFamily: typography.fontFamily.body }}>
      {/* Header - solo logo y perfil */}
      <header style={styles.mobileHeader}>
        <button onClick={() => onNavigate?.('settings')} style={styles.mobileHeaderIconBtn}>
          <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>settings</span>
        </button>
        <span style={styles.logoTextMobile}>GYMTRACKER</span>
        <div style={styles.profileIcon}>
          <img src={profile?.image || 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=40&h=40&fit=crop&crop=face'} alt="Profile" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
        </div>
      </header>

      {/* Content */}
      <main style={styles.mobileMain}>
        {/* Routine Selector + Edit Link (Mobile) */}
        <div style={styles.mobileRoutineSection}>
          <RoutineSelector
            profileId={profile?.id}
            onRoutineChange={handleRoutineChange}
          />
          <button
            type="button"
            onClick={() => onNavigate?.('routines')}
            style={styles.mobileEditRoutinesBtn}
            title="Editar rutinas"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>tune</span>
            Editar
          </button>
        </div>

        {loadingDays && <p style={styles.infoText}>Cargando días...</p>}
        {!loadingDays && daysError && <p style={styles.warningText}>{daysError}</p>}
        <div style={styles.mobileList}>
          {days.map((day, index) => {
            // Solo contar ejercicios de "Fase Principal" o similar (no calentamiento)
            const mainBlock = day.blocks?.find(b => b.name.toLowerCase().includes('principal') || b.name.toLowerCase().includes('fase'))
            const totalExercises = mainBlock?.exercises?.length || 0
            return (
              <button key={day.id} onClick={() => onSelectDay?.(day)} style={{...styles.mobileCard, ...(index === 0 ? styles.mobileTodayCard : {})}}>
                {index === 0 && <div style={styles.todayAccent} />}
                <div style={styles.mobileCardContent}>
                  <div style={styles.mobileCardLeft}>
                    <span style={styles.mobileDayNumber}>0{day.id}</span>
                    {index === 0 && <span style={styles.mobileTodayBadge}>HOY</span>}
                  </div>
                  <div style={styles.mobileCardInfo}>
                    <h3 style={styles.mobileCardTitle}>{day.title}</h3>
                    <p style={styles.mobileCardFocus}>{day.focus}</p>
                  </div>
                  <div style={styles.mobileCardRight}>
                    <span style={styles.mobileExerciseCount}>{totalExercises}</span>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: colors.onSurfaceVariant }}>chevron_right</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </main>

      <BottomNav activeItem="days" onNavigate={onNavigate} />
    </div>
  )

  return (
    <div className="main-menu-container">
      <div className="desktop-view">{DesktopView()}</div>
      <div className="mobile-view">{MobileView()}</div>
      
      <style>{`
        @media (min-width: 1024px) {
          .desktop-view { display: flex !important; }
          .mobile-view { display: none !important; }
        }
        @media (max-width: 1023px) {
          .desktop-view { display: none !important; }
          .mobile-view { display: block !important; }
        }
      `}</style>
    </div>
  )
}

const styles = {
  // Desktop (1920x1080 optimized)
  desktopMain: { marginLeft: '280px', flex: 1, minHeight: '100vh', display: 'flex', justifyContent: 'center', padding: '3rem 4rem' },
  desktopContent: { maxWidth: '1400px', width: '100%' },
  desktopTitle: { fontSize: '3.5rem', fontFamily: typography.fontFamily.heading, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '0.5rem' },
  desktopSubtitle: { color: colors.onSurfaceVariant, fontSize: '1.125rem', marginBottom: '1.5rem' },
  desktopRoutineRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  editRoutinesLink: { display: 'inline-flex', alignItems: 'center', gap: '0.35rem', border: 'none', borderRadius: borderRadius.full, backgroundColor: colors.surfaceContainerHigh, color: colors.onSurfaceVariant, padding: '0.45rem 0.8rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' },
  desktopGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' },
  desktopCard: { backgroundColor: colors.surfaceContainerLow, borderRadius: borderRadius.xl, padding: '2rem', textAlign: 'left', border: 'none', cursor: 'pointer', position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.75rem', transition: 'all 0.2s', minHeight: '180px' },
  todayCard: { border: `2px solid ${colors.tertiary}` },
  cardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  dayNumber: { fontSize: '0.875rem', fontFamily: typography.fontFamily.heading, fontWeight: 700, color: colors.primary, textTransform: 'uppercase', letterSpacing: '0.1em' },
  todayBadge: { fontSize: '0.75rem', fontFamily: typography.fontFamily.heading, fontWeight: 700, color: colors.onTertiary, backgroundColor: colors.tertiary, padding: '0.25rem 0.75rem', borderRadius: borderRadius.full, textTransform: 'uppercase' },
  cardTitle: { fontSize: '1.5rem', fontFamily: typography.fontFamily.heading, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.025em' },
  cardFocus: { fontSize: '1rem', color: colors.onSurfaceVariant },
  exerciseCount: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: colors.tertiary, fontWeight: 600, marginTop: 'auto' },
  implementsRow: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' },
  implementChip: { fontSize: '0.75rem', fontFamily: typography.fontFamily.body, textTransform: 'uppercase', padding: '0.375rem 0.75rem', backgroundColor: colors.surfaceContainerHigh, color: colors.onSurfaceVariant, borderRadius: borderRadius.full },
  arrow: { position: 'absolute', bottom: '2rem', right: '2rem', color: colors.surfaceContainerHighest },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginTop: '3rem' },
  statCard: { backgroundColor: colors.surfaceContainerLow, borderRadius: borderRadius.lg, padding: '1.5rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', textAlign: 'left' },
  statTitle: { fontFamily: typography.fontFamily.heading, fontWeight: 700, fontSize: '1.125rem', display: 'block' },
  statSubtitle: { fontSize: '0.875rem', color: colors.onSurfaceVariant },

  // Mobile
  mobileHeader: { position: 'fixed', top: 0, left: 0, right: 0, height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem', backgroundColor: colors.background, borderBottom: `1px solid ${colors.surfaceContainerHighest}`, zIndex: 50 },
  mobileHeaderIconBtn: { width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: 'none', color: colors.onSurfaceVariant, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  logoTextMobile: { fontFamily: typography.fontFamily.heading, fontWeight: 900, fontStyle: 'italic', fontSize: '18px', color: colors.primary, textTransform: 'uppercase', letterSpacing: '-0.02em' },
  profileIcon: { width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: `2px solid ${colors.surfaceContainerHighest}` },
  mobileMain: { padding: '80px 1rem 100px' },
  mobileRoutineSection: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' },
  mobileEditRoutinesBtn: { display: 'inline-flex', alignItems: 'center', gap: '0.25rem', border: 'none', borderRadius: borderRadius.full, backgroundColor: colors.surfaceContainerHigh, color: colors.onSurfaceVariant, padding: '0.35rem 0.65rem', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 },
  mobileList: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  mobileCard: { backgroundColor: colors.surfaceContainerLow, borderRadius: borderRadius.lg, padding: '1rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden' },
  mobileTodayCard: { borderLeft: `4px solid ${colors.tertiary}` },
  todayAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: colors.tertiary },
  mobileCardContent: { display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' },
  mobileCardLeft: { display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '50px' },
  mobileDayNumber: { fontSize: '1.5rem', fontFamily: typography.fontFamily.heading, fontWeight: 900, color: colors.primary },
  mobileTodayBadge: { fontSize: '0.5rem', fontFamily: typography.fontFamily.heading, fontWeight: 700, color: colors.onTertiary, backgroundColor: colors.tertiary, padding: '0.125rem 0.375rem', borderRadius: borderRadius.full, textTransform: 'uppercase', marginTop: '0.25rem' },
  mobileCardInfo: { flex: 1 },
  mobileCardTitle: { fontSize: '1rem', fontFamily: typography.fontFamily.heading, fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' },
  mobileCardFocus: { fontSize: '0.75rem', color: colors.onSurfaceVariant },
  mobileCardRight: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  mobileExerciseCount: { fontSize: '0.875rem', fontFamily: typography.fontFamily.heading, fontWeight: 700, color: colors.tertiary },
  infoText: { color: colors.onSurfaceVariant, fontSize: '0.875rem', marginBottom: '0.75rem' },
  warningText: { color: colors.secondary, fontSize: '0.8rem', marginBottom: '0.75rem' },
}

export default MainMenu
