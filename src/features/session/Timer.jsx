import React, { useState, useEffect, useRef, useCallback } from 'react'

const PREP_TIME = 5

// ==================== SONIDO + VIBRACIÓN ====================
const playSound = () => {
  try {
    // Usar Web Audio API para un beep simple
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    // Frecuencia aguda (beep)
    oscillator.frequency.value = 880 // 880Hz - tono agudo
    oscillator.type = 'sine'
    
    // Volumen
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
    
    //Reproducir
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
    
    //Después de 200ms, otro beep más agudo
    setTimeout(() => {
      const osc2 = audioContext.createOscillator()
      const gain2 = audioContext.createGain()
      osc2.connect(gain2)
      gain2.connect(audioContext.destination)
      osc2.frequency.value = 1100 // Más agudo
      osc2.type = 'sine'
      gain2.gain.setValueAtTime(0.5, audioContext.currentTime)
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
      osc2.start(audioContext.currentTime)
      osc2.stop(audioContext.currentTime + 0.3)
    }, 200)
  } catch (e) {
    console.error('Audio error:', e)
  }
  
  // Vibración - patrón: vibrate(ms)
  if (navigator.vibrate) {
    navigator.vibrate(200)
    setTimeout(() => navigator.vibrate(200), 300)
  }
}

// ==================== TIMER BASADO EN TIMESTAMPS ====================
const Timer = ({ 
  seconds, 
  isRunning: initialIsRunning = false, 
  onComplete, 
  autoStart = false, 
  withPrep = false,
  resetKey = 0,
}) => {
  const [isRunning, setIsRunning] = useState(initialIsRunning || autoStart)
  const [isPreparing, setIsPreparing] = useState(withPrep && (autoStart || initialIsRunning))
  const [timeLeft, setTimeLeft] = useState(seconds)
  const [prepTimeLeft, setPrepTimeLeft] = useState(PREP_TIME)
  const [soundPlayed, setSoundPlayed] = useState(false)
  const [tick, setTick] = useState(0) // Forzar re-render
  
  // Refs para timestamps
  const startTimeRef = useRef(null)
  const targetTimeRef = useRef(null)
  const prepStartTimeRef = useRef(null)
  const prepTargetTimeRef = useRef(null)
  const animationFrameRef = useRef(null)
  const onCompleteRef = useRef(onComplete)
  
  // Actualizar ref de onComplete cuando cambia
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  // Resetear cuando cambian los props o resetKey
  useEffect(() => {
    setTimeLeft(seconds)
    setPrepTimeLeft(PREP_TIME)
    setIsPreparing(withPrep && (autoStart || initialIsRunning))
    setIsRunning(initialIsRunning || autoStart)
    setSoundPlayed(false)
    setTick(t => t + 1)
    
    // Resetear timestamps
    startTimeRef.current = null
    targetTimeRef.current = null
    prepStartTimeRef.current = null
    prepTargetTimeRef.current = null
  }, [seconds, autoStart, initialIsRunning, withPrep, resetKey])

  // Loop principal usando requestAnimationFrame + timestamps
  const updateTimer = useCallback(() => {
    const now = Date.now()
    
    if (isPreparing && prepStartTimeRef.current !== null) {
      // Fase de preparación
      const elapsed = now - prepStartTimeRef.current
      const remaining = Math.max(0, PREP_TIME - Math.floor(elapsed / 1000))
      
      if (remaining !== prepTimeLeft) {
        setPrepTimeLeft(remaining)
      }
      
      if (remaining <= 0) {
        // Fin de preparación
        setIsPreparing(false)
        prepStartTimeRef.current = null
        // Iniciar timer principal
        if (isRunning) {
          startTimeRef.current = Date.now()
          targetTimeRef.current = Date.now() + (seconds * 1000)
        }
      }
    } else if (isRunning && startTimeRef.current !== null) {
      // Timer principal
      const elapsed = now - startTimeRef.current
      const remaining = Math.max(0, seconds - Math.floor(elapsed / 1000))
      
      if (remaining !== timeLeft) {
        setTimeLeft(remaining)
      }
      
      if (remaining <= 0) {
        // Fin del timer - reproducir sonido
        if (!soundPlayed) {
          playSound()
          setSoundPlayed(true)
        }
        
        // Ejecutar callback
        if (onCompleteRef.current) {
          onCompleteRef.current()
        }
        return // Stop the loop
      }
    }
    
    // Continuar el loop
    if (isRunning && (isPreparing || timeLeft > 0)) {
      animationFrameRef.current = requestAnimationFrame(updateTimer)
    }
  }, [isRunning, isPreparing, timeLeft, prepTimeLeft, seconds, soundPlayed])

  // Iniciar el timer
  useEffect(() => {
    if (isRunning) {
      if (isPreparing) {
        // Iniciar fase de preparación
        prepStartTimeRef.current = Date.now()
        prepTargetTimeRef.current = Date.now() + (PREP_TIME * 1000)
      } else {
        //Iniciar timer principal
        if (startTimeRef.current === null) {
          startTimeRef.current = Date.now()
          targetTimeRef.current = Date.now() + (seconds * 1000)
        }
      }
      
      animationFrameRef.current = requestAnimationFrame(updateTimer)
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isRunning, isPreparing, seconds, updateTimer])

  // Computar valores para display
  const currentDisplay = isPreparing ? prepTimeLeft : timeLeft
  const totalDuration = isPreparing ? PREP_TIME : seconds
  const percentage = (currentDisplay / totalDuration) * 100
  const minutes = Math.floor(currentDisplay / 60)
  const remainingSeconds = currentDisplay % 60

  return (
    <div className="relative flex items-center justify-center">
      {/* SVG Circle Progress */}
      <svg className="w-56 h-56 transform -rotate-90">
        <circle
          cx="112"
          cy="112"
          r="100"
          stroke="currentColor"
          strokeWidth="12"
          fill="transparent"
          className="text-base-100"
        />
        <circle
          cx="112"
          cy="112"
          r="100"
          stroke="currentColor"
          strokeWidth="12"
          fill="transparent"
          strokeDasharray={628.3}
          strokeDashoffset={628.3 - (628.3 * percentage) / 100}
          strokeLinecap="round"
          className={`${isPreparing ? 'text-warning' : 'text-primary'} transition-all duration-1000 ease-linear`}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        {isPreparing && (
          <span className="text-xl font-black uppercase italic tracking-tighter text-warning mb-1">Preparate</span>
        )}
        <div className="text-7xl font-black italic tracking-tighter tabular-nums">
          {minutes > 0 ? `${minutes}:${remainingSeconds.toString().padStart(2, '0')}` : currentDisplay}
        </div>
      </div>
    </div>
  )
}

export default Timer