import React, { useState, useEffect } from 'react'

const Timer = ({ seconds, isRunning: initialIsRunning = false, onComplete, autoStart = false, withPrep = false }) => {
  const PREP_TIME = 5
  const [timeLeft, setTimeLeft] = useState(seconds)
  const [prepTimeLeft, setPrepTimeLeft] = useState(PREP_TIME)
  const [isPreparing, setIsPreparing] = useState(withPrep && (autoStart || initialIsRunning))
  const [isRunning, setIsRunning] = useState(initialIsRunning || autoStart)

  useEffect(() => {
    setTimeLeft(seconds)
    setPrepTimeLeft(PREP_TIME)
    setIsPreparing(withPrep && (autoStart || initialIsRunning))
  }, [seconds, autoStart, initialIsRunning, withPrep])

  useEffect(() => {
    let interval = null
    if (isRunning) {
      if (isPreparing) {
        if (prepTimeLeft > 0) {
          interval = setInterval(() => {
            setPrepTimeLeft((prev) => prev - 1)
          }, 1000)
        } else {
          setIsPreparing(false)
        }
      } else if (timeLeft > 0) {
        interval = setInterval(() => {
          setTimeLeft((prev) => prev - 1)
        }, 1000)
      } else if (timeLeft === 0) {
        onComplete()
      }
    }
    return () => clearInterval(interval)
  }, [isRunning, isPreparing, prepTimeLeft, timeLeft, onComplete])

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
