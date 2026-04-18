import React, { useState, useEffect, useRef, useCallback } from 'react'

const PREP_TIME = 5

// ==================== SONIDOS ====================
const playWarningSound = () => {
  // Sound when 10 seconds left - 3 beeps rapidos
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const now = audioContext.currentTime
    
    // 3 beeps rapidos
    for (let i = 0; i < 3; i++) {
      const osc = audioContext.createOscillator()
      const gain = audioContext.createGain()
      osc.connect(gain)
      gain.connect(audioContext.destination)
      osc.frequency.value = 660
      osc.type = 'square'
      gain.gain.setValueAtTime(0.2, now + i * 0.15)
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.1)
      osc.start(now + i * 0.15)
      osc.stop(now + i * 0.15 + 0.1)
    }
  } catch (e) {
    console.error('Audio error:', e)
  }
}

const playEndSound = () => {
  // Sound when timer finishes - 2 long beeps
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const now = audioContext.currentTime
    
    // Primer beep largo
    const osc1 = audioContext.createOscillator()
    const gain1 = audioContext.createGain()
    osc1.connect(gain1)
    gain1.connect(audioContext.destination)
    osc1.frequency.value = 880
    osc1.type = 'sine'
    gain1.gain.setValueAtTime(0.5, now)
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.5)
    osc1.start(now)
    osc1.stop(now + 0.5)
    
    // Segundo beep mas largo
    const osc2 = audioContext.createOscillator()
    const gain2 = audioContext.createGain()
    osc2.connect(gain2)
    gain2.connect(audioContext.destination)
    osc2.frequency.value = 1100
    osc2.type = 'sine'
    gain2.gain.setValueAtTime(0.5, now + 0.3)
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.3 + 0.8)
    osc2.start(now + 0.3)
    osc2.stop(now + 0.3 + 0.8)
    
    // Vibracion
    if (navigator.vibrate) {
      navigator.vibrate(200)
      setTimeout(() => navigator.vibrate(200), 300)
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
  const [key, setKey] = useState(resetKey)
  const [timeLeft, setTimeLeft] = useState(seconds)
  const [prepTimeLeft, setPrepTimeLeft] = useState(PREP_TIME)
  const [soundPlayed10, setSoundPlayed10] = useState(false)
  const [soundPlayedEnd, setSoundPlayedEnd] = useState(false)
  const [isInPrep, setIsInPrep] = useState(withPrep && (autoStart || initialIsRunning))
  const [isRunningState, setIsRunningState] = useState(initialIsRunning || autoStart)
  
  const startTimeRef = useRef(null)
  const animationFrameRef = useRef(null)
  const onCompleteRef = useRef(onComplete)
  const lastSecondRef = useRef(null)
  
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  // Reset completo
  useEffect(() => {
    setKey(resetKey)
    setTimeLeft(seconds)
    setPrepTimeLeft(PREP_TIME)
    setSoundPlayed10(false)
    setSoundPlayedEnd(false)
    setIsInPrep(withPrep && (autoStart || initialIsRunning))
    setIsRunningState(initialIsRunning || autoStart)
    startTimeRef.current = null
  }, [resetKey, seconds, autoStart, initialIsRunning, withPrep])

  // Loop del timer
  const updateTimer = useCallback(() => {
    if (!isRunningState) return
    
    const now = Date.now()
    
    if (isInPrep) {
      if (startTimeRef.current === null) startTimeRef.current = now
      
      const elapsed = now - startTimeRef.current
      const remaining = Math.max(0, PREP_TIME - Math.floor(elapsed / 1000))
      
      if (remaining !== prepTimeLeft) {
        setPrepTimeLeft(remaining)
        lastSecondRef.current = remaining
      }
      
      if (remaining <= 0) {
        setIsInPrep(false)
        startTimeRef.current = now
      }
    } else {
      if (startTimeRef.current === null) startTimeRef.current = now
      
      const elapsed = now - startTimeRef.current
      const remaining = Math.max(0, seconds - Math.floor(elapsed / 1000))
      
      if (remaining !== timeLeft) {
        setTimeLeft(remaining)
        
        // Sonido cuando faltan 10 segundos
        if (remaining <= 10 && !soundPlayed10) {
          playWarningSound()
          setSoundPlayed10(true)
        }
        
        lastSecondRef.current = remaining
      }
      
      if (remaining <= 0) {
        if (!soundPlayedEnd) {
          playEndSound()
          setSoundPlayedEnd(true)
        }
        if (onCompleteRef.current) {
          onCompleteRef.current()
        }
        return
      }
    }
    
    animationFrameRef.current = requestAnimationFrame(updateTimer)
  }, [isRunningState, isInPrep, timeLeft, prepTimeLeft, seconds, soundPlayed10, soundPlayedEnd])

  // Iniciar loop
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