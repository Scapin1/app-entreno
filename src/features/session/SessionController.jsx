import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { colors, borderRadius, typography } from '../../styles/tokens'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { saveWorkoutSession, saveExerciseResult, saveCurrentSession, clearCurrentSession, getCurrentSession, savePendingFeeling, clearPendingFeeling } from '../../utils/storage'
import { sessionsAPI } from '../../utils/api'
import {
  TimerDisplay,
  ElapsedLabel,
  ProgressBar,
  ProgressPhases,
  ProgressCompact,
  ExerciseCard,
  UpNextSection,
  UpNextCardCompact,
  CompleteSetButton,
  RestOverlay,
} from '../../components/session'

const SessionController = ({ day, onBack }) => {
  const { profile } = useAuth()
  const { isDesktop } = useBreakpoint()
  const isMobile = !isDesktop
  const [sessionComplete, setSessionComplete] = useState(false)
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [currentSetIndex, setCurrentSetIndex] = useState(0)
  const [isResting, setIsResting] = useState(false)
  const [restTime, setRestTime] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [pendingAdvance, setPendingAdvance] = useState(null)
  const [backendSessionId, setBackendSessionId] = useState(null)
  const [exerciseElapsedTime, setExerciseElapsedTime] = useState(0)
  const [intervalRemaining, setIntervalRemaining] = useState(0)
  const [isIntervalRunning, setIsIntervalRunning] = useState(false)
  const [subTimerRemaining, setSubTimerRemaining] = useState(0)
  const [isSubTimerRunning, setIsSubTimerRunning] = useState(false)
  const [subResistanceCompleted, setSubResistanceCompleted] = useState(false)
  const [pendingLog, setPendingLog] = useState(null)
  const [restInitialTime, setRestInitialTime] = useState(0)
  const audioContextRef = useRef(null)
  const lastWarningSecondRef = useRef(null)

  const ensureAudioContext = async () => {
    if (typeof window === 'undefined') return null
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return null

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioCtx()
    }

    if (audioContextRef.current.state === 'suspended') {
      try {
        await audioContextRef.current.resume()
      } catch (error) {
        return null
      }
    }

    return audioContextRef.current
  }

  const playTone = async ({ frequency = 880, duration = 0.08, type = 'sine', volume = 0.05 }) => {
    const context = await ensureAudioContext()
    if (!context) return

    const oscillator = context.createOscillator()
    const gain = context.createGain()

    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, context.currentTime)

    gain.gain.setValueAtTime(0.0001, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(volume, context.currentTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration)

    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(context.currentTime)
    oscillator.stop(context.currentTime + duration)
  }

  const playWarningSound = () => {
    playTone({ frequency: 1220, duration: 0.06, type: 'square', volume: 0.05 })
  }

  const playRoundEndSound = () => {
    playTone({ frequency: 640, duration: 0.08, type: 'triangle', volume: 0.06 })
    setTimeout(() => playTone({ frequency: 520, duration: 0.08, type: 'triangle', volume: 0.06 }), 90)
    setTimeout(() => playTone({ frequency: 840, duration: 0.22, type: 'sine', volume: 0.08 }), 180)
  }

  const playRestEndSound = () => {
    playTone({ frequency: 720, duration: 0.08, type: 'triangle', volume: 0.06 })
    setTimeout(() => playTone({ frequency: 960, duration: 0.12, type: 'sine', volume: 0.08 }), 110)
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    const unlockAudio = async () => {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx()
      }

      if (audioContextRef.current.state === 'suspended') {
        try {
          await audioContextRef.current.resume()
        } catch (error) {
          // ignore: browser can still block without direct gesture
        }
      }
    }

    window.addEventListener('pointerdown', unlockAudio, { once: true })
    window.addEventListener('keydown', unlockAudio, { once: true })

    return () => {
      window.removeEventListener('pointerdown', unlockAudio)
      window.removeEventListener('keydown', unlockAudio)
    }
  }, [])

  const DISPLAY_TYPE_MAP = {
    strength: 'sets',
    hypertrophy: 'sets',
    warmup: 'sets',
    timer: 'timer',
    cardio: 'timer',
    stretching: 'manual',
  }

  const getDisplayType = (type) => DISPLAY_TYPE_MAP[type] || type

  const getDurationSecondsFromText = (text) => {
    if (typeof text !== 'string') return 0
    const match = text.match(/(\d+)\s*(s|sec|secs|seg|segs|segundo|segundos|min|mins|minuto|minutos)\b/i)
    if (!match) {
      const minuteQuoteMatch = text.match(/(\d+)\s*'/)
      if (minuteQuoteMatch) return Number(minuteQuoteMatch[1]) * 60

      const secondQuoteMatch = text.match(/(\d+)\s*("|''|”|″)/)
      if (secondQuoteMatch) return Number(secondQuoteMatch[1])

      return 0
    }

    const amount = Number(match[1])
    const unit = match[2].toLowerCase()

    if (Number.isNaN(amount) || amount <= 0) return 0
    if (['min', 'mins', 'minuto', 'minutos'].includes(unit)) return amount * 60
    return amount
  }

  const getSecondaryTimerSeconds = (exercise) => {
    if (!exercise || exercise.type !== 'sets' || typeof exercise.value !== 'string') return 0

    const segments = exercise.value.split('+').map((part) => part.trim()).filter(Boolean)
    const timeSegment = segments.find((segment) => getDurationSecondsFromText(segment) > 0)
    return timeSegment ? getDurationSecondsFromText(timeSegment) : 0
  }

  const getSecondaryTimerText = (exercise) => {
    if (!exercise || exercise.type !== 'sets' || typeof exercise.value !== 'string') return ''

    const segments = exercise.value.split('+').map((part) => part.trim()).filter(Boolean)
    const timeSegment = segments.find((segment) => getDurationSecondsFromText(segment) > 0)
    return timeSegment || ''
  }

  const getHybridRepsObjectiveText = (exercise) => {
    if (!exercise || exercise.type !== 'sets') return ''
    if (typeof exercise.value !== 'string') return exercise.reps != null ? `${exercise.reps} reps` : ''

    const segments = exercise.value.split('+').map((part) => part.trim()).filter(Boolean)
    const repsSegments = segments.filter((segment) => getDurationSecondsFromText(segment) <= 0)
    return repsSegments.join(' + ')
  }

  const getDefaultRepsForExercise = (exercise) => {
    if (!exercise) return null
    const repsNum = exercise.reps != null ? Number(exercise.reps) : null
    if (repsNum != null && !Number.isNaN(repsNum)) return repsNum
    if (getDisplayType(exercise.type) === 'sets' && typeof exercise.value === 'string') {
      const repsText = getHybridRepsObjectiveText(exercise)
      const numbers = repsText.match(/\d+/g)
      if (!numbers?.length) return null
      return numbers.reduce((sum, value) => sum + Number(value), 0)
    }
    if (getDisplayType(exercise.type) === 'reps' && typeof exercise.value === 'number') return exercise.value
    if (getDisplayType(exercise.type) === 'timer' && typeof exercise.value === 'number') return exercise.value
    return null
  }

  const currentBlock = day?.blocks[currentBlockIndex]
  const currentExercise = currentBlock?.exercises?.[currentExerciseIndex]
  const isCircuitBlock = currentBlock?.type === 'circuit'
  const parsedCircuitRounds = Number(currentBlock?.config?.total_sets || 1)
  const circuitTotalRounds = Number.isFinite(parsedCircuitRounds) && parsedCircuitRounds > 0 ? parsedCircuitRounds : 1
  const subTimerPrepSeconds = 5
  const manualSubTimerSeconds = getSecondaryTimerSeconds(currentExercise)
  const hybridRepsObjectiveText = getHybridRepsObjectiveText(currentExercise)
  const hasManualSubTimer = currentExercise?.type === 'sets' && manualSubTimerSeconds > 0 && hybridRepsObjectiveText.length > 0
  const hybridRepsObjective = hasManualSubTimer ? hybridRepsObjectiveText : ''
  const secondaryTimerText = hasManualSubTimer ? getSecondaryTimerText(currentExercise) : ''
  const currentExerciseSetCount = isCircuitBlock ? circuitTotalRounds : (currentExercise?.sets || 1)
  const showWeightInput = currentExercise?.type === 'sets' && !hasManualSubTimer
  const currentSessionKey = `${day?.id || 'day'}-${profile?.id || 'profile'}`
  const isWorkoutFinished = sessionComplete || currentBlockIndex >= (day?.blocks?.length || 0)

  const getBlockUnitCount = (block) => {
    if (!block) return 0
    if (block.type === 'circuit') {
      const rounds = Number(block?.config?.total_sets || 1)
      return (block.exercises?.length || 0) * rounds
    }
    return block.exercises?.reduce((sum, exercise) => sum + (exercise?.sets || 1), 0) || 0
  }

  const totalSets = day?.blocks?.reduce(
    (total, block) => total + getBlockUnitCount(block),
    0
  ) || 0

  const completedInCurrentBlock = isCircuitBlock
    ? (currentSetIndex * (currentBlock?.exercises?.length || 0)) + currentExerciseIndex
    : (
      currentBlock?.exercises?.slice(0, currentExerciseIndex).reduce(
        (sum, exercise) => sum + (exercise?.sets || 1),
        0
      ) || 0
    ) + currentSetIndex

  const completedSets = (
    day?.blocks?.slice(0, currentBlockIndex).reduce(
      (total, block) => total + getBlockUnitCount(block),
      0
    ) || 0
  ) + completedInCurrentBlock

  const progress = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0

  const blockTotals = day?.blocks?.map((block) => getBlockUnitCount(block)) || []
  const phaseProgresses = (day?.blocks || []).map((block, idx) => {
    const blockTotal = blockTotals[idx] || 0
    const completedInBlock = idx < currentBlockIndex
      ? blockTotal
      : idx > currentBlockIndex
        ? 0
        : (block.type === 'circuit'
          ? ((currentSetIndex * (block.exercises?.length || 0)) + currentExerciseIndex)
          : ((block.exercises?.slice(0, currentExerciseIndex).reduce((sum, exercise) => sum + (exercise?.sets || 1), 0) || 0) + currentSetIndex))

    return {
      name: block.name,
      progress: blockTotal > 0 ? (completedInBlock / blockTotal) * 100 : 0,
    }
  })

  // Elapsed timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Exercise elapsed timer (current exercise only)
  useEffect(() => {
    const timer = setInterval(() => {
      setExerciseElapsedTime(prev => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [currentBlockIndex, currentExerciseIndex])

  // Interval countdown for timer-based exercises
  useEffect(() => {
    if (!isIntervalRunning || intervalRemaining <= 0) return

    const timer = setInterval(() => {
      setIntervalRemaining((prev) => {
        const next = prev - 1

        if (next <= 0) {
          lastWarningSecondRef.current = null
          setIsIntervalRunning(false)
          if (currentBlock?.type === 'circuit' && currentExercise?.type === 'timer') {
            playRoundEndSound()
          }
          handleCompleteExercise(true)
          return 0
        }

        if (currentBlock?.type === 'circuit' && currentExercise?.type === 'timer' && next <= 10 && lastWarningSecondRef.current !== next) {
          lastWarningSecondRef.current = next
          playWarningSound()
        }

        return next
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isIntervalRunning, intervalRemaining, currentBlock?.type, currentExercise?.type])

  // Auto-start interval timers for circuit flow (continuous mode)
  useEffect(() => {
    if (isWorkoutFinished) return
    if (isResting || restTime > 0 || pendingAdvance) return
    if (isIntervalRunning || intervalRemaining > 0) return
    if (currentBlock?.type !== 'circuit' || currentExercise?.type !== 'timer') return

    const workSeconds = Number(currentExercise?.value || currentBlock?.config?.work || 0)
    if (workSeconds <= 0) return

    lastWarningSecondRef.current = null
    setIntervalRemaining(workSeconds)
    setIsIntervalRunning(true)
  }, [
    isWorkoutFinished,
    isResting,
    restTime,
    pendingAdvance,
    isIntervalRunning,
    intervalRemaining,
    currentBlockIndex,
    currentExerciseIndex,
    currentBlock?.type,
    currentBlock?.config?.work,
    currentExercise?.type,
    currentExercise?.value,
  ])

  // Secondary manual countdown for hybrid set exercises (e.g., Pallof)
  useEffect(() => {
    if (!isSubTimerRunning || subTimerRemaining <= 0) return

    const timer = setInterval(() => {
      setSubTimerRemaining((prev) => {
        if (prev <= 1) {
          setIsSubTimerRunning(false)
          setSubResistanceCompleted(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isSubTimerRunning, subTimerRemaining])

  useEffect(() => {
    if (!day || !profile) return

    const currentSession = getCurrentSession()
    if (currentSession?.sessionKey === currentSessionKey) {
      setElapsedTime(currentSession.elapsedTime || 0)
      setCurrentBlockIndex(currentSession.currentBlockIndex || 0)
      setCurrentExerciseIndex(currentSession.currentExerciseIndex || 0)
      setCurrentSetIndex(currentSession.currentSetIndex || 0)
      setWeight(currentSession.weight || '')
      setReps(currentSession.reps || '')
      if (currentSession.pendingLog) {
        setPendingLog(currentSession.pendingLog)
      }
      if (currentSession.backendSessionId) {
        setBackendSessionId(currentSession.backendSessionId)
      }
    }
  }, [currentSessionKey, day, profile])

  useEffect(() => {
    if (!day || !profile || sessionComplete) return

    saveCurrentSession({
      sessionKey: currentSessionKey,
      dayId: day.id,
      profileId: profile.id,
      currentBlockIndex,
      currentExerciseIndex,
      currentSetIndex,
      elapsedTime,
      weight,
      reps,
      backendSessionId,
      pendingLog,
      updatedAt: Date.now(),
    })
  }, [currentSessionKey, day, profile, currentBlockIndex, currentExerciseIndex, currentSetIndex, elapsedTime, weight, reps, backendSessionId, pendingLog, sessionComplete])

  useEffect(() => {
    let cancelled = false

    const startBackendSession = async () => {
      if (!profile?.id || !day?.id || sessionComplete) return
      if (backendSessionId) return

      try {
        const today = new Date().toISOString().split('T')[0]
        const created = await sessionsAPI.create(profile.id, day.id, today)
        const sessionId = created?.id || created?.session_id || created?.session?.id
        if (!cancelled && sessionId) {
          setBackendSessionId(sessionId)
        }
      } catch (error) {
        console.warn('[Session]', error.message)
        // fallback local only
      }
    }

    startBackendSession()

    return () => {
      cancelled = true
    }
  }, [profile?.id, day?.id, sessionComplete, backendSessionId])

  // Rest timer
  useEffect(() => {
    if (isResting && restTime > 0) {
      const timer = setInterval(() => {
        setRestTime(prev => {
          if (prev <= 1) {
            setIsResting(false)
            playRestEndSound()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [isResting, restTime])

  useEffect(() => {
    if (isResting || restTime > 0 || !pendingAdvance) return

    if (pendingLog) {
      persistSetLog(pendingLog, {
        actualWeight: pendingLog.defaultWeight,
        actualReps: pendingLog.defaultReps,
        feeling: pendingLog.defaultFeeling || 'ok',
        resistanceCompleted: pendingLog.defaultResistanceCompleted,
      })
      clearPendingFeeling()
      setPendingLog(null)
    }

    if (pendingAdvance.type === 'set') {
      setCurrentSetIndex(prev => prev + 1)
    }

    if (pendingAdvance.type === 'exercise') {
      if (isCircuitBlock) {
        const isLastExerciseInRound = currentExerciseIndex >= (currentBlock?.exercises?.length || 0) - 1
        const isLastRound = currentSetIndex >= currentExerciseSetCount - 1

        if (!isLastExerciseInRound) {
          setCurrentExerciseIndex(prev => prev + 1)
          setExerciseElapsedTime(0)
          setIntervalRemaining(0)
          setIsIntervalRunning(false)
          setSubTimerRemaining(0)
          setIsSubTimerRunning(false)
          setSubResistanceCompleted(false)
        } else if (!isLastRound) {
          setCurrentSetIndex(prev => prev + 1)
          setCurrentExerciseIndex(0)
          setExerciseElapsedTime(0)
          setIntervalRemaining(0)
          setIsIntervalRunning(false)
          setSubTimerRemaining(0)
          setIsSubTimerRunning(false)
          setSubResistanceCompleted(false)
        } else if (currentBlockIndex < (day?.blocks?.length || 0) - 1) {
          setCurrentBlockIndex(prev => prev + 1)
          setCurrentExerciseIndex(0)
          setCurrentSetIndex(0)
          setExerciseElapsedTime(0)
          setIntervalRemaining(0)
          setIsIntervalRunning(false)
          setSubTimerRemaining(0)
          setIsSubTimerRunning(false)
          setSubResistanceCompleted(false)
        } else {
          finishWorkout()
        }
      } else if (currentExerciseIndex < (currentBlock?.exercises?.length || 0) - 1) {
        setCurrentExerciseIndex(prev => prev + 1)
        setCurrentSetIndex(0)
        setExerciseElapsedTime(0)
        setIntervalRemaining(0)
        setIsIntervalRunning(false)
        setSubTimerRemaining(0)
        setIsSubTimerRunning(false)
        setSubResistanceCompleted(false)
      } else if (currentBlockIndex < (day?.blocks?.length || 0) - 1) {
        setCurrentBlockIndex(prev => prev + 1)
        setCurrentExerciseIndex(0)
        setCurrentSetIndex(0)
        setExerciseElapsedTime(0)
        setIntervalRemaining(0)
        setIsIntervalRunning(false)
        setSubTimerRemaining(0)
        setIsSubTimerRunning(false)
        setSubResistanceCompleted(false)
      } else {
        finishWorkout()
      }
    }

    setPendingAdvance(null)
  }, [
    isResting,
    restTime,
    pendingAdvance,
    pendingLog,
    isCircuitBlock,
    currentExerciseSetCount,
    currentExerciseIndex,
    currentSetIndex,
    currentBlockIndex,
    currentBlock,
    day?.blocks?.length,
  ])

  const persistSetLog = (logConfig, log) => {
    if (!logConfig) return

    const actualWeight = logConfig.showWeight ? (log?.actualWeight ?? logConfig.defaultWeight) : null
    const actualReps = log?.actualReps ?? logConfig.defaultReps
    const feeling = log?.feeling || 'ok'
    const resistanceCompleted = logConfig.showResistance
      ? (log?.resistanceCompleted ?? logConfig.defaultResistanceCompleted ?? false)
      : null

    const note = logConfig.showResistance
      ? (resistanceCompleted ? 'resistencia_ok' : 'resistencia_no')
      : null

    saveExerciseResult(
      logConfig.base.dayId,
      logConfig.base.exerciseName,
      logConfig.base.setNumber,
      {
        weight: actualWeight,
        reps: actualReps,
        resistanceCompleted,
        note,
      },
      feeling,
      logConfig.base.duration,
      logConfig.base.profileId,
    )

    if (profile?.id && backendSessionId) {
      sessionsAPI.addExerciseResult(profile.id, backendSessionId, {
        exercise_name: logConfig.payload.exercise_name,
        set_number: logConfig.payload.set_number,
        actual_weight: actualWeight != null ? String(actualWeight) : null,
        actual_reps: actualReps != null ? Number(actualReps) : null,
        feeling,
        duration: logConfig.base.duration,
        note,
      }).catch(err => {
        console.warn('[Session]', err.message)
      })
    }
  }

  const handleCompleteExercise = (fromTimerAuto = false) => {
    if (!currentExercise) return

    const isLastSet = currentSetIndex >= currentExerciseSetCount - 1
    const isLastExerciseInCircuitRound = isCircuitBlock && currentExerciseIndex >= (currentBlock?.exercises?.length || 0) - 1

    let restDuration = 0
    if (isCircuitBlock) {
      restDuration = isLastExerciseInCircuitRound
        ? Number(currentBlock?.config?.macro_pause || 120)
        : Number(currentBlock?.config?.micro_pause || 30)
    } else {
      const exerciseRestBetween = currentExercise?.rest_between_sets
      const exerciseRestAfter = currentExercise?.rest_after_exercise
      restDuration = isLastSet
        ? (exerciseRestAfter ?? Number(currentBlock?.config?.macro_pause || 120))
        : (exerciseRestBetween ?? Number(currentBlock?.config?.micro_pause || 60))
    }

    if (isCircuitBlock) {
      setPendingAdvance({ type: 'exercise' })
    } else {
      setPendingAdvance({ type: isLastSet ? 'exercise' : 'set' })
    }
    if (restDuration > 0) {
      setIsResting(true)
      setRestTime(restDuration)
      setRestInitialTime(restDuration)
    }

    if (!fromTimerAuto && (currentExercise?.type === 'timer' || currentExercise?.custom_timer > 0)) {
      setIsIntervalRunning(false)
      setIntervalRemaining(0)
    }

    if (hasManualSubTimer) {
      setIsSubTimerRunning(false)
      setSubTimerRemaining(0)
    }

    const defaultReps = getDefaultRepsForExercise(currentExercise)

    const payload = {
      exercise_name: currentExercise.name,
      set_number: currentSetIndex + 1,
      weight: showWeightInput ? Number(currentExercise?.weight ?? 0) : null,
      reps: defaultReps,
      block_name: currentBlock?.name,
      elapsed_seconds: exerciseElapsedTime,
      note: hasManualSubTimer
        ? (subResistanceCompleted ? 'resistencia_ok' : 'resistencia_no')
        : null,
    }

    const pending = {
      payload,
      base: {
        dayId: day.id,
        exerciseName: currentExercise.name,
        setNumber: currentSetIndex + 1,
        duration: exerciseElapsedTime,
        profileId: profile?.id,
        backendSessionId,
      },
      showWeight: showWeightInput,
      defaultWeight: showWeightInput ? currentExercise?.weight ?? null : null,
      defaultReps,
      defaultFeeling: 'ok',
      showResistance: hasManualSubTimer,
      defaultResistanceCompleted: hasManualSubTimer ? subResistanceCompleted : false,
    }

    if (restDuration > 0) {
      setPendingLog(pending)
      savePendingFeeling({
        feeling: pending.defaultFeeling,
        actualWeight: pending.defaultWeight,
        actualReps: pending.defaultReps,
        resistanceCompleted: pending.defaultResistanceCompleted,
        dayId: pending.base.dayId,
        exerciseName: pending.base.exerciseName,
        setNumber: pending.base.setNumber,
        duration: pending.base.duration,
        profileId: pending.base.profileId,
        backendSessionId: pending.base.backendSessionId,
        showResistance: pending.showResistance,
        showWeight: pending.showWeight,
        payload_exercise_name: pending.payload.exercise_name,
        payload_set_number: pending.payload.set_number,
      })
    } else {
      persistSetLog(pending, {
        actualWeight: pending.defaultWeight,
        actualReps: pending.defaultReps,
        feeling: 'ok',
        resistanceCompleted: pending.defaultResistanceCompleted,
      })
      clearPendingFeeling()
      setPendingLog(null)
    }

    if (hasManualSubTimer) {
      setSubResistanceCompleted(false)
    }

    setExerciseElapsedTime(0)
  }

  const handleSubmitSetLog = (log) => {
    if (!pendingLog) return

    persistSetLog(pendingLog, log)

    clearPendingFeeling()
    setPendingLog(null)
  }

  const handleStartInterval = () => {
    const hasTimer = currentExercise?.type === 'timer' || currentExercise?.custom_timer > 0
    if (!hasTimer) return
    const workSeconds = Number(currentExercise?.value || currentExercise?.custom_timer || currentBlock?.config?.work || 0)
    if (workSeconds <= 0) return
    lastWarningSecondRef.current = null
    setIntervalRemaining(workSeconds)
    setIsIntervalRunning(true)
  }

  const handleStartSecondaryTimer = () => {
    if (!hasManualSubTimer) return
    setSubResistanceCompleted(false)
    setSubTimerRemaining(manualSubTimerSeconds + subTimerPrepSeconds)
    setIsSubTimerRunning(true)
  }

  const handleEndWorkoutEarly = () => {
    clearCurrentSession()
    saveWorkoutSession({
      dayId: day?.id,
      profileId: profile?.id,
      status: 'completed_early',
      totalDuration: elapsedTime,
    })

    if (profile?.id && backendSessionId) {
      sessionsAPI.complete(profile.id, backendSessionId, { total_duration: elapsedTime, is_completed: false }).catch(err => {
        console.warn('[Session]', err.message)
      })
    }
    setSessionComplete(true)
    setCurrentBlockIndex(day?.blocks?.length || 0)
    setCurrentExerciseIndex(0)
    setCurrentSetIndex(0)
    setIsResting(false)
    setRestTime(0)
    setSubTimerRemaining(0)
    setIsSubTimerRunning(false)
    setSubResistanceCompleted(false)
    onBack?.()
  }

  const handleExitSession = () => {
    clearCurrentSession()
    saveWorkoutSession({
      dayId: day?.id,
      profileId: profile?.id,
      status: 'exited',
      totalDuration: elapsedTime,
    })

    if (profile?.id && backendSessionId) {
      sessionsAPI.complete(profile.id, backendSessionId, { total_duration: elapsedTime, is_completed: false }).catch(err => {
        console.warn('[Session]', err.message)
      })
    }
    onBack?.()
  }

  const handleSkipRest = () => {
    if (pendingLog) {
      persistSetLog(pendingLog, {
        actualWeight: pendingLog.defaultWeight,
        actualReps: pendingLog.defaultReps,
        feeling: pendingLog.defaultFeeling || 'ok',
        resistanceCompleted: pendingLog.defaultResistanceCompleted,
      })
      clearPendingFeeling()
      setPendingLog(null)
    }

    setIsResting(false)
    setRestTime(0)
  }

  // Retry any pending session completions on mount
  useEffect(() => {
    if (!profile?.id) return
    try {
      const pending = JSON.parse(localStorage.getItem('entreno_pending_completion'))
      if (pending?.profileId && pending?.sessionId && !pending?.completed) {
        sessionsAPI.complete(pending.profileId, pending.sessionId, {
          total_duration: pending.totalDuration,
          is_completed: true,
        }).then(() => {
          localStorage.removeItem('entreno_pending_completion')
        }).catch(() => {
          // Will retry on next mount
        })
      }
    } catch (_) { /* ignore corrupt data */ }
  }, [profile?.id])

  const finishWorkout = () => {
    clearCurrentSession()
    saveWorkoutSession({
      dayId: day?.id,
      profileId: profile?.id,
      status: 'completed',
      totalDuration: elapsedTime,
    })

    if (profile?.id && backendSessionId) {
      sessionsAPI.complete(profile.id, backendSessionId, { total_duration: elapsedTime, is_completed: true }).catch(err => {
        console.warn('[Session] complete failed, will retry:', err.message)
        // Save pending completion for retry on next app load
        try {
          localStorage.setItem('entreno_pending_completion', JSON.stringify({
            profileId: profile.id,
            sessionId: backendSessionId,
            totalDuration: elapsedTime,
            completed: false,
          }))
        } catch (_) { /* ignore storage errors */ }
      })
    }
    setSubTimerRemaining(0)
    setIsSubTimerRunning(false)
    setSubResistanceCompleted(false)
    setSessionComplete(true)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return {
      mins: mins.toString().padStart(2, '0'),
      secs: secs.toString().padStart(2, '0'),
    }
  }

  const getExerciseConfigLabel = () => {
    if (!currentExercise) return ''
    if (getDisplayType(currentExercise.type) === 'timer' || currentExercise.custom_timer > 0) {
      const target = Number(currentExercise.value || currentExercise.custom_timer || currentBlock?.config?.work || 0)
      return `Objetivo: ${formatTime(target).mins}:${formatTime(target).secs}`
    }
    if (getDisplayType(currentExercise.type) === 'reps') {
      return `Objetivo: ${currentExercise.value || '-'} reps`
    }
    if (getDisplayType(currentExercise.type) === 'sets') {
      if (hasManualSubTimer) {
        return `Objetivo: ${hybridRepsObjective} · ${secondaryTimerText}`
      }
      return `Objetivo: ${currentExercise.reps || '-'} reps × ${currentExerciseSetCount} sets${currentExercise?.weight ? ` · ${currentExercise.weight} kg` : ''}`
    }
    return 'Ejercicio guiado'
  }

  const getPrimaryActionLabel = () => {
    const _hasTimer = getDisplayType(currentExercise?.type) === 'timer' || currentExercise?.custom_timer > 0
    if (currentBlock?.type === 'circuit' && getDisplayType(currentExercise?.type) === 'timer') {
      return 'Automático'
    }
    if (_hasTimer) {
      return isIntervalRunning ? 'Complete Interval' : 'Start Interval'
    }
    if (hasManualSubTimer) return 'Completar reps'
    if (getDisplayType(currentExercise?.type) === 'reps') return 'Complete Reps'
    if (getDisplayType(currentExercise?.type) === 'manual') return 'Complete Exercise'
    return 'Complete Set'
  }

  const getCurrentExerciseTargetSeconds = () => {
    if (!currentExercise) return 0
    if (currentExercise.type === 'timer') {
      return Number(currentExercise.value || currentBlock?.config?.work || 0)
    }
    if (currentExercise.custom_timer > 0) {
      return Number(currentExercise.custom_timer)
    }
    return 0
  }

  const handlePrimaryAction = () => {
    const hasTimer = currentExercise?.type === 'timer' || currentExercise?.custom_timer > 0
    if (hasTimer && !isIntervalRunning) {
      handleStartInterval()
      return
    }
    handleCompleteExercise()
  }

  const isSubTimerInPrep = hasManualSubTimer && isSubTimerRunning && subTimerRemaining > manualSubTimerSeconds
  const secondaryCountdown = hasManualSubTimer
    ? (isSubTimerRunning
      ? (isSubTimerInPrep ? (subTimerRemaining - manualSubTimerSeconds) : subTimerRemaining)
      : manualSubTimerSeconds)
    : 0
  const { mins: subMins, secs: subSecs } = formatTime(secondaryCountdown)
  const secondaryStatusLabel = isSubTimerRunning
    ? (isSubTimerInPrep ? 'Preparación' : 'Resistencia en curso')
    : subResistanceCompleted
      ? 'Resistencia completada'
      : 'Resistencia pendiente'
  const secondaryActionLabel = isSubTimerRunning
    ? (isSubTimerInPrep ? 'Preparación...' : 'Resistencia en curso')
    : `Iniciar resistencia (${subTimerPrepSeconds}s prep)`

  const getRestNextLabel = () => {
    if (pendingAdvance?.type === 'set') {
      return `Set ${currentSetIndex + 2}/${currentExerciseSetCount}`
    }

    if (isCircuitBlock) {
      const exercises = currentBlock?.exercises || []
      const isLastExerciseInRound = currentExerciseIndex >= exercises.length - 1
      const isLastRound = currentSetIndex >= currentExerciseSetCount - 1

      if (!isLastExerciseInRound) {
        return exercises[currentExerciseIndex + 1]?.name || 'Siguiente ejercicio'
      }

      if (!isLastRound) {
        const firstExerciseName = exercises[0]?.name || 'Siguiente ronda'
        return `Ronda ${currentSetIndex + 2}/${currentExerciseSetCount} · ${firstExerciseName}`
      }

      return day?.blocks?.[currentBlockIndex + 1]?.exercises?.[0]?.name || 'Fin del bloque'
    }

    return currentBlock?.exercises?.[currentExerciseIndex + 1]?.name || 'Fin del bloque'
  }

  // Get up next exercises - solo 1 ejercicio siguiente
  const getUpNextExercises = () => {
    const nextExercise = currentBlock?.exercises?.[currentExerciseIndex + 1]
    if (!nextExercise) return []
    return [{
      name: nextExercise.name,
      sets: nextExercise.sets || 3,
      reps: getDefaultRepsForExercise(nextExercise) ?? 8,
    }]
  }

  if (isWorkoutFinished) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, color: colors.onSurface, fontFamily: typography.fontFamily.body }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontFamily: typography.fontFamily.heading, fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Workout complete</h1>
          <p style={{ color: colors.onSurfaceVariant, marginBottom: '1.5rem' }}>Guardamos tu sesión.</p>
          <button onClick={onBack} style={{ padding: '0.9rem 1.5rem', borderRadius: borderRadius.full, border: 'none', backgroundColor: colors.primary, color: colors.onPrimaryFixed, fontWeight: 700, cursor: 'pointer' }}>Volver al menú</button>
        </div>
      </div>
    )
  }

  if (!currentExercise) return null

  const { mins, secs } = formatTime(elapsedTime)
  const { mins: exMins, secs: exSecs } = formatTime(exerciseElapsedTime)
  const targetSeconds = getCurrentExerciseTargetSeconds()
  const hasTimer = currentExercise?.type === 'timer' || currentExercise?.custom_timer > 0
  const exerciseCountdown = hasTimer
    ? (isIntervalRunning ? intervalRemaining : targetSeconds)
    : 0
  const { mins: cdMins, secs: cdSecs } = formatTime(exerciseCountdown)
  const upNextExercises = getUpNextExercises()
  const maxRestTime = restInitialTime || currentBlock?.config?.macro_pause || 120

  // =====================
  // REST OVERLAY
  // =====================
  if (isResting) {
    return (
      <RestOverlay
        restTime={restTime}
        maxTime={maxRestTime}
        nextExercise={getRestNextLabel()}
        onSkip={handleSkipRest}
        logConfig={pendingLog}
        onSubmitLog={handleSubmitSetLog}
      />
    )
  }

  // =====================
  // DESKTOP VIEW
  // =====================
  const DesktopView = () => (
    <div style={{ minHeight: '100vh', backgroundColor: colors.background }}>
      {/* Header */}
      <header style={styles.desktopHeader}>
        <div style={styles.desktopLogo}>
          <span style={styles.desktopLogoText}>GYMTRACKER</span>
          <span style={styles.sessionBadge}>SESSION ACTIVE</span>
        </div>
        <div style={styles.desktopActions}>
          <button style={styles.iconButton}>
            <span className="material-symbols-outlined">analytics</span>
          </button>
          <button style={styles.iconButton}>
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>
      </header>

      <main style={styles.desktopMain}>
        {/* Timer Section */}
        <section style={styles.timerSection}>
          {hasTimer && (
            <>
              <ElapsedLabel label="Tiempo ejercicio (cuenta regresiva)" />
              <TimerDisplay mins={cdMins} secs={cdSecs} size="large" />
            </>
          )}
          <div style={{ marginTop: '2rem' }}>
            <ProgressPhases phases={phaseProgresses} currentPhaseIndex={currentBlockIndex} />
          </div>
          <div style={{ marginTop: '1rem', color: colors.onSurfaceVariant, fontSize: '0.875rem' }}>
            {!hasTimer && (
              <><span>{getExerciseConfigLabel()}</span><span style={{ margin: '0 0.6rem', opacity: 0.4 }}>|</span></>
            )}
            <span>Sesión: {mins}:{secs}</span>
          </div>
        </section>

        {/* Exercise Card */}
        <ExerciseCard
          exercise={currentExercise}
          setNumber={currentSetIndex + 1}
          totalSets={currentExerciseSetCount}
          onSwap={() => {}}
          isCircuit={isCircuitBlock}
        >
          {hasManualSubTimer && (
            <div style={styles.secondaryTimerCard}>
              <div style={styles.secondaryTimerHeader}>
                <span style={styles.targetLabel}>Resistencia</span>
                <span style={styles.secondaryTimerStatus}>{secondaryStatusLabel}</span>
              </div>
              <div style={styles.secondaryTimerText}>{`${secondaryTimerText || `${manualSubTimerSeconds}s`} + ${subTimerPrepSeconds}s preparación`}</div>
              {isSubTimerRunning && (
                <div style={styles.secondaryTimerTime}>{subMins}:{subSecs}</div>
              )}
              <button
                type="button"
                onClick={handleStartSecondaryTimer}
                disabled={isSubTimerRunning}
                style={{
                  ...styles.secondaryActionButton,
                  opacity: isSubTimerRunning ? 0.6 : 1,
                  cursor: isSubTimerRunning ? 'not-allowed' : 'pointer',
                }}
              >
                {secondaryActionLabel}
              </button>
            </div>
          )}

          <CompleteSetButton
            onClick={handlePrimaryAction}
            size="large"
            label={getPrimaryActionLabel()}
            disabled={currentBlock?.type === 'circuit' && currentExercise?.type === 'timer'}
          />
        </ExerciseCard>

        {/* Exercise notes */}
        {currentExercise?.notes && (
          <div style={styles.exerciseNotesDesktop}>{currentExercise.notes}</div>
        )}

        {/* Up Next - solo 1 */}
        <UpNextSection exercises={upNextExercises} />

        {/* End Button */}
        <div style={styles.endSection}>
          <button style={styles.endButton} onClick={handleEndWorkoutEarly}>End Workout Early</button>
        </div>
      </main>

      <style>{`
        @media (max-width: 1023px) {
          .desktop-view { display: none !important; }
          .mobile-view { display: block !important; }
        }
      `}</style>
    </div>
  )

  // =====================
  // MOBILE VIEW
  // =====================
  const MobileView = () => (
    <div style={{ minHeight: '100vh', backgroundColor: colors.background, fontFamily: typography.fontFamily.body }}>
      {/* Header */}
      <header style={styles.mobileHeader}>
        <button onClick={handleExitSession} style={styles.backButton}>
          <span className="material-symbols-outlined">close</span>
        </button>
        <ProgressCompact current={completedSets + 1} total={totalSets} />
        <div style={styles.timerSmall}>
          <span>{mins}:{secs}</span>
        </div>
      </header>

      {/* Content */}
      <main style={styles.mobileMain}>
        <div style={styles.mobileExerciseCard}>
          <span style={styles.blockBadge}>{currentBlock?.name}</span>
          <h1 style={styles.mobileExerciseName}>{currentExercise.name}</h1>
          {!isCircuitBlock && currentExerciseSetCount > 1 && (
            <p style={styles.mobileExerciseMeta}>
              Set {currentSetIndex + 1} of {currentExerciseSetCount}
            </p>
          )}
          {isCircuitBlock && currentExerciseSetCount > 1 && (
            <p style={styles.mobileExerciseMeta}>
              Ronda {currentSetIndex + 1} of {currentExerciseSetCount}
            </p>
          )}

          {/* Exercise notes - mobile */}
          {currentExercise?.notes && (
            <p style={styles.exerciseNotesMobile}>{currentExercise.notes}</p>
          )}

          {/* Timer countdown for exercises with timer (mobile) */}
          {hasTimer && (
            <div style={styles.mobileTimerSection}>
              <TimerDisplay mins={cdMins} secs={cdSecs} size="large" />
            </div>
          )}

          {hasManualSubTimer && (
            <div style={styles.secondaryTimerCardMobile}>
              <div style={styles.secondaryTimerHeader}>
                <span style={styles.targetLabel}>Resistencia</span>
                <span style={styles.secondaryTimerStatus}>{secondaryStatusLabel}</span>
              </div>
              <div style={styles.secondaryTimerText}>{`${secondaryTimerText || `${manualSubTimerSeconds}s`} + ${subTimerPrepSeconds}s preparación`}</div>
              {isSubTimerRunning && (
                <div style={styles.secondaryTimerTimeMobile}>{subMins}:{subSecs}</div>
              )}
              <button
                type="button"
                onClick={handleStartSecondaryTimer}
                disabled={isSubTimerRunning}
                style={{
                  ...styles.secondaryActionButton,
                  opacity: isSubTimerRunning ? 0.6 : 1,
                  cursor: isSubTimerRunning ? 'not-allowed' : 'pointer',
                }}
              >
                {secondaryActionLabel}
              </button>
            </div>
          )}

          <div style={{ marginBottom: '0.5rem', color: colors.onSurfaceVariant, fontSize: '0.75rem' }}>
            {!hasTimer && (
              <><span>{getExerciseConfigLabel()}</span><span style={{ margin: '0 0.5rem', opacity: 0.4 }}>|</span></>
            )}
            <span>Sesión: {mins}:{secs}</span>
          </div>

          <CompleteSetButton
            onClick={handlePrimaryAction}
            size="small"
            label={getPrimaryActionLabel()}
            disabled={currentBlock?.type === 'circuit' && currentExercise?.type === 'timer'}
          />
        </div>

        {/* Up Next */}
        <div style={styles.mobileUpNext}>
          <h3 style={styles.mobileUpNextTitle}>Up Next</h3>
          {upNextExercises.map((ex, i) => (
            <UpNextCardCompact key={i} {...ex} />
          ))}
        </div>
      </main>

      {/* Bottom Nav */}
      <div style={styles.mobileBottomNav}>
        <button style={styles.navButton} disabled={currentExerciseIndex === 0 && currentBlockIndex === 0}>
          <span className="material-symbols-outlined">skip_previous</span>
        </button>
        <span style={styles.blockCounter}>{currentSetIndex + 1}/{Math.max(currentExerciseSetCount, 1)}</span>
        <button style={styles.navButton}>
          <span className="material-symbols-outlined">skip_next</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="session-container">
      {isMobile ? <MobileView /> : <DesktopView />}
    </div>
  )
}

const styles = {
  // Desktop Header
  desktopHeader: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '70px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 1.5rem',
    backgroundColor: colors.background,
    borderBottom: `1px solid ${colors.surfaceContainerHighest}`,
    zIndex: 50,
  },
  desktopLogo: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  desktopLogoText: {
    fontSize: '1.5rem',
    fontWeight: 900,
    fontStyle: 'italic',
    color: colors.primary,
    fontFamily: typography.fontFamily.heading,
    textTransform: 'uppercase',
  },
  sessionBadge: {
    fontSize: '0.625rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    padding: '0.25rem 0.5rem',
    backgroundColor: `${colors.primary}20`,
    color: colors.primary,
    borderRadius: borderRadius.sm,
  },
  desktopActions: { display: 'flex', gap: '0.5rem' },
  iconButton: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'none',
    border: 'none',
    color: colors.onSurfaceVariant,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Desktop Main
  desktopMain: {
    padding: '100px 2rem 4rem',
    maxWidth: '800px',
    margin: '0 auto',
  },
  timerSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '2rem 0',
    marginBottom: '2rem',
  },
  endSection: {
    display: 'flex',
    justifyContent: 'center',
    paddingTop: '2rem',
    paddingBottom: '4rem',
  },
  endButton: {
    fontSize: '0.875rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: colors.secondary,
    backgroundColor: colors.surfaceContainerLow,
    border: 'none',
    borderRadius: borderRadius.full,
    padding: '0.75rem 2rem',
    cursor: 'pointer',
  },

  // Mobile
  mobileHeader: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 1rem',
    backgroundColor: colors.background,
    borderBottom: `1px solid ${colors.surfaceContainerHighest}`,
    zIndex: 50,
  },
  backButton: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.onSurface,
  },
  timerSmall: {
    fontSize: '0.875rem',
    fontWeight: 700,
    color: colors.onSurfaceVariant,
    fontFamily: typography.fontFamily.heading,
  },
  mobileMain: {
    padding: '80px 1rem 100px',
  },
  mobileExerciseCard: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.xl,
    padding: '1.5rem',
    borderLeft: `4px solid ${colors.primary}`,
    marginBottom: '1.5rem',
  },
  blockBadge: {
    display: 'inline-block',
    padding: '0.375rem 0.75rem',
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: borderRadius.full,
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: colors.onSurfaceVariant,
    marginBottom: '1rem',
  },
  mobileExerciseName: {
    fontSize: '1.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: colors.onSurface,
    fontFamily: typography.fontFamily.heading,
  },
  mobileExerciseMeta: {
    fontSize: '0.875rem',
    color: colors.onSurfaceVariant,
    marginTop: '0.25rem',
  },
  mobileUpNext: { marginBottom: '2rem' },
  mobileUpNextTitle: {
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: colors.onSurfaceVariant,
    marginBottom: '0.75rem',
  },
  mobileBottomNav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 2rem',
    backgroundColor: colors.surfaceContainerLow,
    borderTop: `1px solid ${colors.surfaceContainerHighest}`,
  },
  navButton: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.onSurfaceVariant,
  },
  blockCounter: {
    fontSize: '0.875rem',
    fontWeight: 700,
    color: colors.onSurfaceVariant,
    fontFamily: typography.fontFamily.heading,
  },
  exerciseNotesDesktop: {
    fontSize: '0.8rem',
    color: colors.onSurfaceVariant,
    fontStyle: 'italic',
    marginTop: '0.5rem',
    marginBottom: '0.5rem',
    padding: '0.5rem 0.75rem',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.md,
    border: `1px solid ${colors.surfaceContainerHighest}`,
    lineHeight: 1.4,
  },
  exerciseNotesMobile: {
    fontSize: '0.78rem',
    color: colors.onSurfaceVariant,
    fontStyle: 'italic',
    marginTop: '0.35rem',
    marginBottom: '0.5rem',
    lineHeight: 1.4,
  },
  targetChip: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.md,
    padding: '0.65rem 0.8rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  targetLabel: {
    fontSize: '0.65rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: colors.onSurfaceVariant,
  },
  targetValue: {
    fontSize: '1rem',
    fontWeight: 800,
    color: colors.onSurface,
    fontFamily: typography.fontFamily.heading,
  },
  mobileTimerSection: {
    padding: '1rem 0',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryTimerCard: {
    width: '100%',
    backgroundColor: colors.surfaceContainerLow,
    border: `1px solid ${colors.surfaceContainerHighest}`,
    borderRadius: borderRadius.lg,
    padding: '0.9rem',
    marginBottom: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  secondaryTimerCardMobile: {
    width: '100%',
    backgroundColor: colors.surfaceContainerLow,
    border: `1px solid ${colors.surfaceContainerHighest}`,
    borderRadius: borderRadius.md,
    padding: '0.8rem',
    marginBottom: '0.9rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.45rem',
  },
  secondaryTimerHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.75rem',
  },
  secondaryTimerStatus: {
    fontSize: '0.7rem',
    fontWeight: 700,
    color: colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  secondaryTimerText: {
    fontSize: '0.85rem',
    color: colors.onSurfaceVariant,
    fontWeight: 600,
  },
  secondaryTimerTime: {
    fontSize: '1.55rem',
    fontWeight: 900,
    color: colors.onSurface,
    fontFamily: typography.fontFamily.heading,
  },
  secondaryTimerTimeMobile: {
    fontSize: '1.25rem',
    fontWeight: 800,
    color: colors.onSurface,
    fontFamily: typography.fontFamily.heading,
  },
  secondaryActionButton: {
    border: 'none',
    borderRadius: borderRadius.full,
    backgroundColor: colors.secondary,
    color: colors.onPrimaryFixed,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    fontSize: '0.75rem',
    padding: '0.7rem 0.9rem',
    transition: 'opacity 0.2s ease',
  },
}

export default SessionController
