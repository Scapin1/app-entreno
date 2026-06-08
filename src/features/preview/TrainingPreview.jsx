import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { colors, typography, borderRadius, shadows } from '../../styles/tokens'
import { Sidebar } from '../../components/navigation'
import { PrimaryButton } from '../../components/ui'
import { analyticsAPI, routinesAPI } from '../../utils/api'

const TrainingPreview = ({ day, routineId, onStart, onBack, onNavigate }) => {
  const { profile } = useAuth()
  const [dayInsights, setDayInsights] = useState(null)
  const [routineName, setRoutineName] = useState('')

  useEffect(() => {
    if (!routineId || !profile?.id) {
      setRoutineName('')
      return
    }
    let cancelled = false
    const load = async () => {
      try {
        const routine = await routinesAPI.get(profile.id, routineId)
        if (!cancelled) setRoutineName(routine.name || '')
      } catch {
        if (!cancelled) setRoutineName('')
      }
    }
    load()
    return () => { cancelled = true }
  }, [routineId, profile?.id])

  useEffect(() => {
    let cancelled = false

    const loadDayInsights = async () => {
      if (!profile?.id || !day?.id) return
      try {
        const data = await analyticsAPI.getDayInsights(profile.id, day.id)
        if (!cancelled) setDayInsights(data)
      } catch {
        if (!cancelled) setDayInsights(null)
      }
    }

    loadDayInsights()

    return () => {
      cancelled = true
    }
  }, [profile?.id, day?.id])

  // Fallback: estimado base (aprox 5 min por ejercicio)
  const baseEstimatedTime = useMemo(() => {
    if (!day?.blocks?.length) return 0
    const mainBlock = day.blocks.find(
      (b) =>
        String(b?.name || '').toLowerCase().includes('principal') ||
        String(b?.name || '').toLowerCase().includes('fase')
    )
    const exerciseCount = mainBlock?.exercises?.length || 0
    return exerciseCount * 5
  }, [day])

  const exerciseCount = useMemo(() => {
    if (!day?.blocks?.length) return 0

    // Nested format: blocks[].exercises[]
    if (Array.isArray(day.blocks[0]?.exercises)) {
      return day.blocks.reduce((sum, block) => sum + (block?.exercises?.length || 0), 0)
    }

    // Flat format: blocks[] are exercises
    return Array.isArray(day.blocks) ? day.blocks.length : 0
  }, [day])

  const estimatedTime = useMemo(() => {
    const dynamic = Number(dayInsights?.estimated_duration_minutes || 0)
    if (dynamic > 0) return dynamic
    return baseEstimatedTime
  }, [dayInsights?.estimated_duration_minutes, baseEstimatedTime])

  const difficultyInfo = useMemo(() => {
    const level = Number(dayInsights?.difficulty_level || 2)
    const label = dayInsights?.difficulty_label || 'Media'
    return { level: Math.max(1, Math.min(4, level)), label }
  }, [dayInsights])

  if (!day) return null

  // Extraer el nombre del día (quitar "Día X: ")
  const dayName = day.title.replace(/Día \d+: /, '')

  const formatDuration = (totalSecs = 0) => {
    const mins = Math.floor(totalSecs / 60)
    const secs = totalSecs % 60
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`
  }

  const DISPLAY_TYPE_MAP = {
    strength: 'sets',
    hypertrophy: 'sets',
    warmup: 'sets',
    timer: 'timer',
    cardio: 'timer',
    stretching: 'manual',
  }

  const getDisplayType = (type) => DISPLAY_TYPE_MAP[type] || type

  const parseReps = (reps) => {
    if (reps == null) return null
    const num = Number(reps)
    return !Number.isNaN(num) ? num : null
  }

  const getExerciseDisplay = (block, ex) => {
    let weight = '-'
    let repsVal = '-'
    let setsVal = '-'

    if (typeof ex.sets === 'number') {
      setsVal = String(ex.sets)
    } else if (block.type === 'circuit' && typeof block.config?.total_sets === 'number') {
      setsVal = String(block.config.total_sets)
    } else if (getDisplayType(ex.type) !== 'manual') {
      setsVal = '1'
    }

    if (getDisplayType(ex.type) === 'sets') {
      const repsNum = parseReps(ex.reps)
      if (repsNum != null && repsNum > 0) {
        repsVal = `${repsNum} reps`
        weight = ex.weight != null ? `${ex.weight} kg` : '-'
      } else if (typeof ex.value === 'string') {
        repsVal = ex.value
      }
    } else if (getDisplayType(ex.type) === 'reps') {
      repsVal = `${ex.value || 0} reps`
    } else if (getDisplayType(ex.type) === 'timer') {
      repsVal = formatDuration(ex.value || 0)
    } else if (getDisplayType(ex.type) === 'manual') {
      repsVal = 'manual'
    }

    // Append custom_timer to reps/tiempo column for non-circuit exercises
    if (ex.custom_timer > 0 && block.type !== 'circuit') {
      repsVal += ` · ${ex.custom_timer}s`
    }

    return { setsVal, repsVal, weight }
  }

  // =====================
  // DESKTOP VERSION (≥1024px)
  // =====================
  const DesktopView = () => (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: colors.background }}>
      <Sidebar profile={profile} activeItem="days" onNavigate={onNavigate} />
      
      <main style={styles.desktopMain}>
        <div style={styles.desktopContent}>
          {/* Header */}
          <div style={styles.headerSection}>
            <div style={styles.dayBadge}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>calendar_today</span>
              <span>Day {day.id} · Phase 1</span>
              {routineName && <span style={styles.routineBadge}>{routineName}</span>}
            </div>
            <h1 style={styles.dayTitle}>
              {dayName.split(' ').map((word, i) => 
                i === 1 ? <span key={i} style={{ color: colors.primary }}>{word}</span> : <span key={i}>{word} </span>
              )}
            </h1>
            <p style={styles.dayFocus}>{day.focus}</p>
          </div>

          {/* Bento Grid - Stats */}
          <div style={styles.bentoGrid}>
            <div style={styles.bentoCard}>
              <span style={styles.bentoLabel}>Est. Time</span>
              <div style={styles.bentoValue}>
                {estimatedTime}<span style={styles.bentoUnit}>m</span>
              </div>
            </div>
            <div style={styles.bentoCard}>
              <span style={styles.bentoLabel}>Exercises</span>
              <div style={styles.bentoValue}>
                {exerciseCount}<span style={styles.bentoUnit}></span>
              </div>
            </div>
            <div style={styles.bentoCard}>
              <span style={styles.bentoLabel}>Intensity</span>
              <div style={styles.intensityRow}>
                {[1, 2, 3, 4].map((idx) => (
                  <div
                    key={idx}
                    style={{
                      ...styles.intensityBar,
                      backgroundColor: idx <= difficultyInfo.level ? colors.error : colors.surfaceContainerHighest,
                    }}
                  />
                ))}
              </div>
              <span style={styles.intensityLabel}>{difficultyInfo.label}</span>
            </div>
          </div>

          {/* Start Button */}
          <button style={styles.startButtonDesktop} onClick={onStart}>
            <span>START WORKOUT</span>
            <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>arrow_forward</span>
          </button>

          {/* Exercises List */}
          <div style={styles.exercisesList}>
            {day.blocks.map((block, bIdx) => {
              const isCircuit = block.type === 'circuit'

              if (isCircuit) {
                return (
                  <div key={bIdx} style={styles.exerciseCard}>
                    <div style={styles.exerciseHeader}>
                      <div style={styles.exerciseTags}>
                        <span style={styles.tag}>{block.name}</span>
                        <span style={styles.circuitTag}>CIRCUITO</span>
                      </div>
                    </div>

                    <div style={styles.circuitMetaGrid}>
                      <div style={styles.circuitMetaItem}>
                        <span style={styles.circuitMetaLabel}>Rondas</span>
                        <span style={styles.circuitMetaValue}>{block.config?.total_sets || '-'}</span>
                      </div>
                      <div style={styles.circuitMetaItem}>
                        <span style={styles.circuitMetaLabel}>Trabajo</span>
                        <span style={styles.circuitMetaValue}>{formatDuration(block.config?.work || 0)}</span>
                      </div>
                      <div style={styles.circuitMetaItem}>
                        <span style={styles.circuitMetaLabel}>Micro pausa</span>
                        <span style={styles.circuitMetaValue}>{formatDuration(block.config?.micro_pause || 0)}</span>
                      </div>
                      <div style={styles.circuitMetaItem}>
                        <span style={styles.circuitMetaLabel}>Macro pausa</span>
                        <span style={styles.circuitMetaValue}>{formatDuration(block.config?.macro_pause || 0)}</span>
                      </div>
                    </div>

                    <div style={styles.circuitStationsList}>
                      {block.exercises?.map((ex, eIdx) => (
                        <div key={eIdx} style={styles.circuitStationRow}>
                          <div style={styles.circuitStationName}>
                            <span style={styles.circuitStationIndex}>{(eIdx + 1).toString().padStart(2, '0')}</span>
                            {ex.name}
                          </div>
                          <span style={styles.circuitStationTime}>{formatDuration(ex.value ?? block.config?.work ?? 0)}</span>
                        </div>
                      ))}
                    </div>

                    <p style={styles.circuitHint}>Completá todas las estaciones para cerrar 1 ronda.</p>
                  </div>
                )
              }

              return (
                <div key={bIdx} style={styles.exerciseCard}>
                  <div style={styles.exerciseHeader}>
                    <div style={styles.exerciseTags}>
                      <span style={styles.tag}>{block.name}</span>
                    </div>
                    <button style={styles.moreButton}>
                      <span className="material-symbols-outlined">more_horiz</span>
                    </button>
                  </div>

                  {/* Sets Header */}
                  <div style={styles.setsHeader}>
                    <span style={styles.setsHeaderCell}>Ejercicio</span>
                    <span style={styles.setsHeaderCell}>Sets</span>
                    <span style={styles.setsHeaderCell}>Reps / Tiempo</span>
                    <span style={styles.setsHeaderCell}>Peso</span>
                  </div>

                  {/* Sets Rows */}
                  <div style={styles.setsRows}>
                    {block.exercises?.map((ex, eIdx) => {
                      const display = getExerciseDisplay(block, ex)

                      return (
                        <div key={eIdx} style={styles.setRow}>
                          <div style={styles.setName}>
                            {ex.name}
                            {ex.notes ? (
                              <div style={styles.exerciseNote}>{ex.notes}</div>
                            ) : null}
                          </div>
                          <div style={styles.setSets}>{display.setsVal}</div>
                          <div style={styles.setReps}>{display.repsVal}</div>
                          <div style={styles.setValue}>
                            <span>{display.weight}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )

  // =====================
  // MOBILE VERSION (<1024px)
  // =====================
  const MobileView = () => (
    <div style={{ minHeight: '100vh', backgroundColor: colors.background, fontFamily: typography.fontFamily.body, paddingBottom: '100px' }}>
      {/* Header */}
      <header style={styles.mobileHeader}>
        <button onClick={onBack} style={styles.backButtonMobile}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <span style={styles.mobileTitle}>Preview</span>
        <div style={styles.profileIconSmall}>
          <img src={profile?.image || 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=40&h=40&fit=crop&crop=face'} alt="Profile" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
        </div>
      </header>

      {/* Content */}
      <div style={styles.mobileContent}>
        {/* Header Section */}
        <div style={styles.headerSection}>
          <div style={styles.dayBadge}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>calendar_today</span>
            <span>Day {day.id}</span>
            {routineName && <span style={styles.routineBadgeMobile}>{routineName}</span>}
          </div>
          <h1 style={styles.mobileDayTitle}>
            {dayName.split(' ').map((word, i) => 
              i === 1 ? <span key={i} style={{ color: colors.primary }}>{word}</span> : <span key={i}>{word} </span>
            )}
          </h1>
          <p style={styles.dayFocus}>{day.focus}</p>
        </div>

        {/* Bento Grid - Mobile */}
        <div style={styles.bentoGridMobile}>
            <div style={styles.bentoCardMobile}>
              <span style={styles.bentoLabelMobile}>Est. Time</span>
              <div style={styles.bentoValueMobile}>{estimatedTime}m</div>
            </div>
            <div style={styles.bentoCardMobile}>
              <span style={styles.bentoLabelMobile}>Intensity</span>
              <div style={styles.bentoValueMobile}>{difficultyInfo.label}</div>
            </div>
          </div>

        {/* Exercises List - Mobile */}
        <div style={styles.exercisesListMobile}>
          {day.blocks.map((block, bIdx) => {
            const isCircuit = block.type === 'circuit'

            if (isCircuit) {
              return (
                <div key={bIdx} style={styles.exerciseCardMobile}>
                  <div style={styles.exerciseHeader}>
                    <div style={styles.exerciseTags}>
                      <span style={styles.tagMobile}>{block.name}</span>
                      <span style={styles.circuitTag}>CIRCUITO</span>
                    </div>
                  </div>

                  <div style={styles.circuitMetaMobile}>
                    <span style={styles.circuitChip}>{block.config?.total_sets || '-'} rondas</span>
                    <span style={styles.circuitChip}>Trabajo {formatDuration(block.config?.work || 0)}</span>
                    <span style={styles.circuitChip}>Micro {formatDuration(block.config?.micro_pause || 0)}</span>
                    <span style={styles.circuitChip}>Macro {formatDuration(block.config?.macro_pause || 0)}</span>
                  </div>

                  <div style={styles.setsRowsMobile}>
                    {block.exercises?.map((ex, eIdx) => (
                      <div key={eIdx} style={styles.circuitStationRowMobile}>
                        <div style={styles.exerciseNameMobile}>
                          <span style={{ color: colors.primary, marginRight: '8px' }}>{(eIdx + 1).toString().padStart(2, '0')}</span>
                          {ex.name}
                        </div>
                        <div style={styles.circuitStationTimeMobile}>{formatDuration(ex.value ?? block.config?.work ?? 0)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            }

            return (
              <div key={bIdx} style={styles.exerciseCardMobile}>
                <div style={styles.exerciseHeader}>
                  <div style={styles.exerciseTags}>
                    <span style={styles.tagMobile}>{block.name}</span>
                  </div>
                </div>

                {/* Sets Header - Mobile */}
                <div style={styles.setsHeaderMobile}>
                  <span>Ejercicio</span>
                  <span>Sets · Reps/Tiempo · Peso</span>
                </div>

                {/* Sets Rows - Mobile */}
                <div style={styles.setsRowsMobile}>
                  {block.exercises?.map((ex, eIdx) => {
                    const display = getExerciseDisplay(block, ex)
                    const detail = [
                      display.setsVal !== '-' ? `${display.setsVal} sets` : null,
                      display.repsVal,
                      display.weight,
                    ].filter(Boolean).join(' · ')

                    return (
                      <div key={eIdx} style={styles.setRowMobile}>
                        <div style={styles.exerciseNameMobile}>
                          <span style={{ color: colors.primary, marginRight: '8px' }}>{(eIdx + 1).toString().padStart(2, '0')}</span>
                          <div>
                            <div>{ex.name}</div>
                            {ex.notes ? (
                              <div style={styles.exerciseNoteMobile}>{ex.notes}</div>
                            ) : null}
                          </div>
                        </div>
                        <div style={styles.exerciseDetailMobile}>{detail}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={styles.mobileBottomBar}>
        <button style={styles.startButtonMobileFull} onClick={onStart}>
          <span className="material-symbols-outlined">play_arrow</span>
          Start Workout
        </button>
      </div>
    </div>
  )

  return (
    <div className="preview-container">
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
  // Desktop Sidebar (minimal)
  desktopSidebar: { position: 'fixed', left: 0, top: 0, bottom: 0, width: '280px', backgroundColor: colors.background, padding: '1.5rem', display: 'flex', flexDirection: 'column', borderRight: `1px solid ${colors.surfaceContainerHighest}`, zIndex: 100 },
  logoRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' },
  logoIcon: { fontSize: '28px', color: colors.primary },
  logoText: { fontSize: '18px', fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.05em', color: colors.primary, fontFamily: typography.fontFamily.heading, textTransform: 'uppercase' },
  userCard: { display: 'flex', alignItems: 'center', gap: '12px', padding: '1rem', backgroundColor: colors.surfaceContainerLow, borderRadius: borderRadius.lg, marginBottom: '2rem' },
  avatar: { width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden' },
  userName: { fontSize: '0.875rem', fontWeight: 700, display: 'block' },
  userSubtitle: { fontSize: '0.75rem', color: colors.onSurfaceVariant },
  nav: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  navItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '0.75rem 1rem', borderRadius: borderRadius.md, background: 'none', border: 'none', color: colors.onSurfaceVariant, fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left' },

  // Desktop Main - igual que MainMenu
  desktopMain: { marginLeft: '280px', flex: 1, minHeight: '100vh', display: 'flex', justifyContent: 'center', padding: '3rem 4rem' },
  desktopContent: { width: '100%', minHeight: '800px', minWidth: '800px' },

  // Header Section
  headerSection: { marginBottom: '3rem' },
  dayBadge: { display: 'flex', alignItems: 'center', gap: '12px', color: colors.primary, fontSize: '1.125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1.5rem', fontFamily: typography.fontFamily.heading, flexWrap: 'wrap' },
  routineBadge: { fontSize: '0.7rem', fontWeight: 700, color: colors.onTertiary, backgroundColor: colors.tertiary, padding: '0.2rem 0.55rem', borderRadius: borderRadius.full, letterSpacing: '0.05em', textTransform: 'uppercase' },
  routineBadgeMobile: { fontSize: '0.6rem', fontWeight: 700, color: colors.onTertiary, backgroundColor: colors.tertiary, padding: '0.15rem 0.45rem', borderRadius: borderRadius.full, letterSpacing: '0.05em', textTransform: 'uppercase' },
  dayTitle: { fontSize: 'clamp(4rem, 6vw, 7rem)', fontFamily: typography.fontFamily.heading, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 0.85, marginBottom: '1rem', color: colors.onSurface },
  dayFocus: { fontSize: '1.25rem', color: colors.onSurfaceVariant, fontFamily: typography.fontFamily.body },

  // Bento Grid
  bentoGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', marginBottom: '3rem' },
  bentoCard: { backgroundColor: colors.surfaceContainerLow, borderRadius: borderRadius.xl, padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  bentoLabel: { fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: colors.onSurfaceVariant, fontFamily: typography.fontFamily.body },
  bentoValue: { fontSize: '3rem', fontWeight: 900, fontFamily: typography.fontFamily.heading, color: colors.onSurface },
  bentoUnit: { fontSize: '1rem', color: colors.onSurfaceVariant, marginLeft: '4px' },
  intensityRow: { display: 'flex', gap: '4px', marginTop: '0.5rem' },
  intensityBar: { flex: 1, height: '6px', borderRadius: '3px' },
  intensityLabel: { fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: colors.secondary, marginTop: '0.5rem' },

  // Start Button - Desktop
  startButtonDesktop: { width: '100%', background: `linear-gradient(135deg, ${colors.primary}, #daf900)`, color: colors.onPrimaryFixed, border: 'none', borderRadius: borderRadius.xl, padding: '2.5rem', fontSize: '2.5rem', fontWeight: 900, fontFamily: typography.fontFamily.heading, textTransform: 'uppercase', letterSpacing: '0.15em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', marginBottom: '3rem', boxShadow: '0 0 40px rgba(246, 255, 192, 0.15)', transition: 'transform 0.2s' },

  // Exercises List
  exercisesList: { display: 'flex', flexDirection: 'column', gap: '2rem' },
  exerciseCard: { backgroundColor: colors.surfaceContainerLow, borderRadius: borderRadius.xl, padding: '3rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  exerciseHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `1px solid ${colors.surfaceContainerHighest}`, paddingBottom: '1rem' },
  exerciseTags: { display: 'flex', gap: '0.5rem' },
  tag: { fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.375rem 0.75rem', backgroundColor: colors.surfaceContainerHigh, color: colors.onSurfaceVariant, borderRadius: borderRadius.full },
  circuitTag: { fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.25rem 0.65rem', backgroundColor: `${colors.secondary}22`, color: colors.secondary, borderRadius: borderRadius.full },
  moreButton: { background: 'none', border: 'none', color: colors.onSurfaceVariant, cursor: 'pointer', padding: '0.25rem' },

  circuitMetaGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' },
  circuitMetaItem: { backgroundColor: colors.surfaceContainerHigh, borderRadius: borderRadius.md, padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'center' },
  circuitMetaLabel: { fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: colors.onSurfaceVariant },
  circuitMetaValue: { fontSize: '1rem', fontWeight: 800, color: colors.onSurface, fontFamily: typography.fontFamily.heading },
  circuitStationsList: { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  circuitStationRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '0.9rem 1rem', backgroundColor: colors.surfaceContainerHigh, borderRadius: borderRadius.md },
  circuitStationName: { display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.95rem', fontWeight: 600, color: colors.onSurface },
  circuitStationIndex: { color: colors.primary, fontWeight: 800, fontFamily: typography.fontFamily.heading },
  circuitStationTime: { fontSize: '0.95rem', fontWeight: 800, color: colors.secondary, fontFamily: typography.fontFamily.heading },
  circuitHint: { marginTop: '0.25rem', fontSize: '0.78rem', color: colors.onSurfaceVariant },

  // Sets - nombre, sets, reps/tiempo, peso
  setsHeader: { display: 'grid', gridTemplateColumns: '1.6fr 0.6fr 1fr 0.8fr', gap: '1rem', padding: '0 0.5rem' },
  setsHeaderCell: { fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: colors.onSurfaceVariant, textAlign: 'center', fontFamily: typography.fontFamily.body, minWidth: '80px' },
  setsRows: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  setRow: { display: 'grid', gridTemplateColumns: '1.6fr 0.6fr 1fr 0.8fr', gap: '1rem', alignItems: 'center', backgroundColor: colors.surfaceContainerHigh, borderRadius: borderRadius.lg, padding: '1.25rem 1rem', minHeight: '72px' },
  setName: { textAlign: 'left', fontSize: '1.05rem', fontWeight: 700, fontFamily: typography.fontFamily.heading, color: colors.onSurface, paddingLeft: '0.5rem' },
  setSets: { textAlign: 'center', fontSize: '1rem', fontWeight: 700, fontFamily: typography.fontFamily.heading, color: colors.onSurface },
  setValue: { fontSize: '1rem', fontWeight: 700, fontFamily: typography.fontFamily.heading, color: colors.primary, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' },
  setReps: { textAlign: 'center', fontSize: '1.5rem', fontWeight: 700, fontFamily: typography.fontFamily.heading, color: colors.onSurface, minWidth: '80px', display: 'flex', justifyContent: 'center' },
  setUnit: { fontSize: '0.875rem', color: colors.onSurfaceVariant, fontWeight: 400 },
  exerciseNote: {
    fontSize: '0.75rem',
    color: colors.onSurfaceVariant,
    marginTop: '2px',
    fontStyle: 'italic',
    fontWeight: 400,
  },
  exerciseNoteMobile: {
    fontSize: '0.72rem',
    color: colors.onSurfaceVariant,
    marginTop: '2px',
    fontStyle: 'italic',
  },
  ghostSpacer: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', border: `1px dashed ${colors.surfaceContainerHighest}`, borderRadius: borderRadius.lg, color: colors.onSurfaceVariant },

  // Mobile
  mobileHeader: { position: 'fixed', top: 0, left: 0, right: 0, height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.25rem', backgroundColor: colors.background, borderBottom: `1px solid ${colors.surfaceContainerHighest}`, zIndex: 50 },
  backButtonMobile: { width: '44px', height: '44px', borderRadius: '50%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.onSurface },
  mobileTitle: { fontFamily: typography.fontFamily.heading, fontWeight: 700, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: colors.onSurfaceVariant },
  profileIconSmall: { width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', border: `2px solid ${colors.surfaceContainerHighest}` },

  mobileContent: { padding: '80px 1.25rem 120px' },
  mobileDayTitle: { fontSize: '3rem', fontFamily: typography.fontFamily.heading, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 0.95, marginBottom: '0.75rem', color: colors.onSurface },
  
  bentoGridMobile: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '2rem' },
  bentoCardMobile: { backgroundColor: colors.surfaceContainerLow, borderRadius: borderRadius.xl, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  bentoLabelMobile: { fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: colors.onSurfaceVariant, fontFamily: typography.fontFamily.body },
  bentoValueMobile: { fontSize: '2rem', fontWeight: 900, fontFamily: typography.fontFamily.heading, color: colors.onSurface },

  startButtonMobile: { width: '100%', background: `linear-gradient(135deg, ${colors.primary}, #daf900)`, color: colors.onPrimaryFixed, border: 'none', borderRadius: borderRadius.xl, padding: '1.5rem', fontSize: '1.5rem', fontWeight: 900, fontFamily: typography.fontFamily.heading, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '2rem', boxShadow: '0 0 40px rgba(246, 255, 192, 0.15)' },

  exercisesListMobile: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  exerciseCardMobile: { backgroundColor: colors.surfaceContainerLow, borderRadius: borderRadius.xl, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  tagMobile: { fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.375rem 0.75rem', backgroundColor: colors.surfaceContainerHigh, color: colors.onSurfaceVariant, borderRadius: borderRadius.full },

  circuitMetaMobile: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' },
  circuitChip: { fontSize: '0.7rem', fontWeight: 700, color: colors.onSurfaceVariant, backgroundColor: colors.surfaceContainerHigh, padding: '0.3rem 0.6rem', borderRadius: borderRadius.full },

  setsHeaderMobile: { display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', padding: '0 0.5rem', borderBottom: `1px solid ${colors.surfaceContainerHighest}`, paddingBottom: '0.75rem' },
  setsRowsMobile: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  setRowMobile: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0.75rem', backgroundColor: colors.surfaceContainerHigh, borderRadius: borderRadius.lg },
  circuitStationRowMobile: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 0.75rem', backgroundColor: colors.surfaceContainerHigh, borderRadius: borderRadius.lg },
  exerciseNameMobile: { fontSize: '1rem', fontWeight: 600, color: colors.onSurface, display: 'flex', alignItems: 'center' },
  exerciseDetailMobile: { fontSize: '1rem', fontWeight: 700, color: colors.primary, fontFamily: typography.fontFamily.heading },
  circuitStationTimeMobile: { fontSize: '0.95rem', fontWeight: 800, color: colors.secondary, fontFamily: typography.fontFamily.heading },

  mobileBottomBar: { position: 'fixed', bottom: 0, left: 0, right: 0, padding: '1.25rem 1.5rem', paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))', backgroundColor: colors.background, borderTop: `1px solid ${colors.surfaceContainerHighest}` },
  startButtonMobileFull: { width: '100%', background: `linear-gradient(135deg, ${colors.primary}, #daf900)`, color: colors.onPrimaryFixed, border: 'none', borderRadius: borderRadius.lg, padding: '1.25rem', fontSize: '1.125rem', fontWeight: 700, fontFamily: typography.fontFamily.heading, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' },
}

export default TrainingPreview
