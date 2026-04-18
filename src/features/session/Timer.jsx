import React, { useState, useEffect, useRef, useCallback } from 'react'

const PREP_TIME = 5

// ==================== AUDIO UTILS ====================
const createOscillator = (freq, type = 'sine', duration = 0.1, volume = 0.3) => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = freq
    oscillator.type = type
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + duration)
  } catch (e) {
    console.error('Audio error:', e)
  }
}

const playTick = () => createOscillator(440, 'square', 0.05, 0.15)

const playEndSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    
    // Primer beep
    const osc1 = audioContext.createOscillator()
    const gain1 = audioContext.createGain()
    osc1.connect(gain1)
    gain1.connect(audioContext.destination)
    osc1.frequency.value = 880
    gain1.gain.setValueAtTime(0.5, audioContext.currentTime)
    gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
    osc1.start(audioContext.currentTime)
    osc1.stop(audioContext.currentTime + 0.5)
    
    // Segundo beep
    setTimeout(() => {
      const osc2 = audioContext.createOscillator()
      const gain2 = audioContext.createGain()
      osc2.connect(gain2)
      gain2.connect(audioContext.destination)
      osc2.frequency.value = 1200
      gain2.gain.setValueAtTime(0.5, audioContext.currentTime)
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8)
      osc2.start(audioContext.currentTime)
      osc2.stop(audioContext.currentTime + 0.8)
    }, 250)
    
    if (navigator.vibrate) {
      navigator.vibrate(300)
      setTimeout(() => navigator.vibrate(300), 400)
    }
  } catch (e) {
    console.error('Audio error:', e)
  }
}

// ==================== TIMER ====================
const Timer = ({ 
  seconds, 
  isRunning: initialIsRunning = false, 
  onComplete, 
  autoStart = false, 
  withPrep = false,
  resetKey = 0,
}) => {
  // Usar key de reset como dependency key también
  const [key, setKey] = useState(resetKey)
  
  // Estados base
  const [timeLeft, setTimeLeft] = useState(seconds)
  const [prepTimeLeft, setPrepTimeLeft] = useState(PREP_TIME)
  const [soundPlayed, setSoundPlayed] = useState(false)
  
  // Determinar fase actual
  const [isInPrep, setIsInPrep] = useState(withPrep && (autoStart || initialIsRunning))
  const [isRunningState, setIsRunningState] = useState(initialIsRunning || autoStart)
  
  // Refs
  const startTimeRef = useRef(null)
  const animationFrameRef = useRef(null)
  const onCompleteRef = useRef(onComplete)
  const lastSecondRef = useRef(null)
  
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  // Reset completo cuando cambia resetKey
  useEffect(() => {
    setKey(resetKey)
    setTimeLeft(seconds)
    setPrepTimeLeft(PREP_TIME)
    setSoundPlayed(false)
    setIsInPrep(withPrep && (autoStart || initialIsRunning))
    setIsRunningState(initialIsRunning || autoStart)
    startTimeRef.current = null
  }, [resetKey, seconds, autoStart, initialIsRunning, withPrep])

  // Loop del timer
  const updateTimer = useCallback(() => {
    if (!isRunningState) return
    
    const now = Date.now()
    
    if (isInPrep) {
      // Fase de preparación
      if (startTimeRef.current === null) {
        startTimeRef.current = now
      }
      
      const elapsed = now - startTimeRef.current
      const remaining = Math.max(0, PREP_TIME - Math.floor(elapsed / 1000))
      
      if (remaining !== prepTimeLeft) {
        setPrepTimeLeft(remaining)
        if (lastSecondRef.current !== remaining) {
          playTick()
          lastSecondRef.current = remaining
        }
      }
      
      if (remaining <= 0) {
        // Fin de prep - ahora timer principal
        setIsInPrep(false)
        startTimeRef.current = now // Reiniciar para timer principal
      }
    } else {
      // Timer principal
      if (startTimeRef.current === null) {
        startTimeRef.current = now
      }
      
      const elapsed = now - startTimeRef.current
      const remaining = Math.max(0, seconds - Math.floor(elapsed / 1000))
      
      if (remaining !== timeLeft) {
        setTimeLeft(remaining)
        if (lastSecondRef.current !== remaining) {
          playTick()
          lastSecondRef.current = remaining
        }
      }
      
      if (remaining <= 0) {
        if (!soundPlayed) {
          playEndSound()
          setSoundPlayed(true)
        }
        if (onCompleteRef.current) {
          onCompleteRef.current()
        }
        return
      }
    }
    
    animationFrameRef.current = requestAnimationFrame(updateTimer)
  }, [isRunningState, isInPrep, timeLeft, prepTimeLeft, seconds, soundPlayed])

  // Iniciar loop cuando está corriendo
  useEffect(() => {
    if (isRunningState && (isInPrep || timeLeft > 0)) {
      animationFrameRef.current = requestAnimationFrame(updateTimer)
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isRunningState, isInPrep, timeLeft, seconds, updateTimer])

  // Display
  const currentDisplay = isInPrep ? prepTimeLeft : timeLeft
  const totalDuration = isInPrep ? PREP_TIME : seconds
  const percentage = (currentDisplay / totalDuration) * 100
  const minutes = Math.floor(currentDisplay / 60)
  const remainingSeconds = currentDisplay % 60

  return (
    <div className="relative flex items-center justify-center">
      <svg className="w-56 h-56 transform -rotate-90">
        <circle cx="112" cy="112" r="100" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-base-100" />
        <circle 
          cx="112" cy="112" r="100" stroke="currentColor" strokeWidth="12" fill="transparent"
          strokeDasharray={628.3}
          strokeDashoffset={628.3 - (628.3 * percentage) / 100}
          strokeLinecap="round"
          className={`${isInPrep ? 'text-warning' : 'text-primary'} transition-all duration-1000 ease-linear`}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        {isInPrep && <span className="text-xl font-black uppercase italic tracking-tighter text-warning mb-1">Preparate</span>}
        <div className="text-7xl font-black italic tracking-tighter tabular-nums">
          {minutes > 0 ? `${minutes}:${remainingSeconds.toString().padStart(2, '0')}` : currentDisplay}
        </div>
      </div>
    </div>
  )
}

export default Timer