import React, { useState, useEffect } from 'react'
import { ChevronLeft, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react'
import Timer from './Timer';
import ExerciseCard from './ExerciseCard';
import BlockSummary from './BlockSummary';
import { saveCurrentSession, clearCurrentSession, getHistory, exportAllData } from '../../utils/storage';

const SessionController = ({ day, onBack, recoveryState = null }) => {
  const dayId = day.id
  
  const [blockIndex, setBlockIndex] = useState(0)
  const [exerciseIndex, setExerciseIndex] = useState(0)
  const [currentSet, setCurrentSet] = useState(1)
  const [isResting, setIsResting] = useState(false)
  const [restSeconds, setRestSeconds] = useState(0)
  const [isBlockFinished, setIsBlockFinished] = useState(false)
  const [isRecoveryMode, setIsRecoveryMode] = useState(false)

  const currentBlock = day.blocks[blockIndex]
  const currentExercise = currentBlock.exercises[exerciseIndex]

  // ==================== ESTADO RECOVERY ====================
  // Guardar estado cuando cambia la navegación
  useEffect(() => {
    const stateToSave = {
      dayId,
      blockIndex,
      exerciseIndex,
      currentSet,
      isResting,
      restSeconds,
      timestamp: Date.now(),
    }
    saveCurrentSession(stateToSave)
  }, [blockIndex, exerciseIndex, currentSet, isResting, restSeconds, dayId])

  // Recover al iniciar si viene estado recovery
  useEffect(() => {
    if (recoveryState && recoveryState.dayId === dayId) {
      setBlockIndex(recoveryState.blockIndex || 0)
      setExerciseIndex(recoveryState.exerciseIndex || 0)
      setCurrentSet(recoveryState.currentSet || 1)
      setIsResting(recoveryState.isResting || false)
      setRestSeconds(recoveryState.restSeconds || 0)
      setIsRecoveryMode(true)
    }
  }, [dayId, recoveryState])

  // Clean up al terminar
  const handleSessionComplete = () => {
    clearCurrentSession()
    // Auto-guardar backup
    const data = exportAllData()
    if (data) {
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `entreno-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
    }
    onBack()
  }

  // ==================== RESULTADOS ANTERIORES ====================
  const getLastResult = (exerciseName) => {
    const history = getHistory()
    const today = new Date().toISOString().split('T')[0]
    const todaySession = history.find(s => s.date === today && s.dayId === dayId)
    if (!todaySession) return null
    const results = todaySession.exercises?.filter(e => e.name === exerciseName) || []
    return results.length > 0 ? results[results.length - 1] : null
  }

  const handleNext = () => {
    const microPause = currentBlock.config?.micro_pause
    const macroPause = currentBlock.config?.macro_pause
    const isLastExercise = exerciseIndex === currentBlock.exercises.length - 1
    const totalSets = currentBlock.config?.total_sets || 1

    // Lógica para bloques tipo CIRCUITO (Day 2)
    if (currentBlock.type === 'circuit') {
      if (!isLastExercise) {
        // No es el último ejercicio del circuito -> Micropausa y siguiente ejercicio
        if (microPause) {
          setRestSeconds(microPause)
          setIsResting(true)
        } else {
          setExerciseIndex(exerciseIndex + 1)
        }
      } else {
        // Es el último ejercicio del circuito
        if (currentSet < totalSets) {
          // Quedan más vueltas (rounds) -> Macropausa y volver al inicio
          if (macroPause) {
            setRestSeconds(macroPause)
            setIsResting(true)
          } else {
            setExerciseIndex(0)
            setCurrentSet(currentSet + 1)
          }
        } else {
          // Se completaron todas las vueltas -> Fin del bloque
          setIsBlockFinished(true)
        }
      }
    } 
    // Lógica para bloques normales (SETS / REPS)
    else {
      // Si es un ejercicio de series y no es la última serie
      if (currentExercise.type === 'sets' && currentSet < (currentExercise.sets || 1)) {
        if (microPause) {
          setRestSeconds(microPause)
          setIsResting(true)
        } else {
          setCurrentSet(currentSet + 1)
        }
      } 
      // Si no quedan más series, pero quedan más ejercicios en el bloque
      else if (exerciseIndex < currentBlock.exercises.length - 1) {
        if (macroPause) {
          setRestSeconds(macroPause)
          setIsResting(true)
        } else {
          setExerciseIndex(exerciseIndex + 1)
          setCurrentSet(1)
        }
      } 
      // Si era el último ejercicio del bloque
      else {
        setIsBlockFinished(true)
      }
    }
  }

  const handleRestComplete = () => {
    setIsResting(false)
    const isLastExercise = exerciseIndex === currentBlock.exercises.length - 1
    const totalSets = currentBlock.config?.total_sets || 1

    if (currentBlock.type === 'circuit') {
      if (!isLastExercise) {
        setExerciseIndex(exerciseIndex + 1)
      } else {
        setExerciseIndex(0)
        setCurrentSet(currentSet + 1)
      }
    } else {
      if (currentExercise.type === 'sets' && currentSet < (currentExercise.sets || 1)) {
        setCurrentSet(currentSet + 1)
      } else {
        setExerciseIndex(exerciseIndex + 1)
        setCurrentSet(1)
      }
    }
  }

  const handlePrev = () => {
    if (isResting) {
      setIsResting(false)
      return
    }

    if (currentSet > 1) {
      setCurrentSet(currentSet - 1)
    } else if (exerciseIndex > 0) {
      const prevExercise = currentBlock.exercises[exerciseIndex - 1]
      setExerciseIndex(exerciseIndex - 1)
      setCurrentSet(prevExercise.sets || 1)
    } else if (blockIndex > 0) {
      const prevBlockIdx = blockIndex - 1
      const prevBlock = day.blocks[prevBlockIdx]
      setBlockIndex(prevBlockIdx)
      setExerciseIndex(prevBlock.exercises.length - 1)
      setCurrentSet(prevBlock.exercises[prevBlock.exercises.length - 1].sets || 1)
    } else {
      onBack()
    }
  }

  const startNextBlock = () => {
    if (blockIndex < day.blocks.length - 1) {
      setBlockIndex(blockIndex + 1)
      setExerciseIndex(0)
      setCurrentSet(1)
      setIsBlockFinished(false)
    } else {
      // Entrenamiento terminado
      handleSessionComplete()
    }
  }

  // Banner de recovery
  useEffect(() => {
    if (isRecoveryMode) {
      const timer = setTimeout(() => setIsRecoveryMode(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isRecoveryMode])

  if (isBlockFinished) {
    return (
      <BlockSummary 
        blockName={currentBlock.name} 
        onContinue={startNextBlock} 
        isLast={blockIndex === day.blocks.length - 1}
        onFinish={handleSessionComplete}
      />
    )
  }

  if (isResting) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full animate-in fade-in zoom-in duration-300">
        <h2 className="text-4xl font-black italic uppercase mb-8 text-primary">Descanso</h2>
        <div className="bg-base-200 p-12 rounded-full shadow-inner mb-8">
          <Timer 
            seconds={restSeconds} 
            autoStart={true} 
            onComplete={handleRestComplete} 
          />
        </div>
        <button 
          onClick={handleRestComplete}
          className="btn btn-ghost btn-lg gap-2 font-black italic uppercase tracking-tighter"
        >
          Saltar descanso
          <ChevronLeft className="rotate-180" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full w-full animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Header de la sesión */}
      <div className="flex justify-between items-center mb-6 px-2">
        <button onClick={handlePrev} className="btn btn-ghost btn-sm gap-1 uppercase font-black italic">
          <ArrowLeft size={16} />
          Volver
        </button>
        <div className="text-right">
          <span className="badge badge-primary font-black italic uppercase tracking-tighter">
            {currentBlock.name}
          </span>
          <div className="text-xs font-bold opacity-50 uppercase mt-1">
            Ejercicio {exerciseIndex + 1} de {currentBlock.exercises.length}
          </div>
        </div>
      </div>

      {/* Recovery banner */}
      {isRecoveryMode && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-primary text-primary-content py-2 px-4 rounded-xl shadow-lg animate-in fade-in slide-in-from-top">
          <p className="text-center font-bold text-sm uppercase">
            Continuando donde lo dejaste...
          </p>
        </div>
      )}

      {/* Tarjeta del ejercicio */}
      <div className="flex-grow flex items-center justify-center">
        <ExerciseCard 
          exercise={currentExercise} 
          currentSet={currentSet}
          onNext={handleNext}
          onTimerComplete={handleNext}
          isCircuitBlock={currentBlock.type === 'circuit'}
          dayId={dayId}
          lastResult={getLastResult(currentExercise.name)}
          showFullFeedback={blockIndex === 1} // Solo fase principal (índice 1)
        />
      </div>

      {/* Barra de progreso inferior */}
      <div className="mt-8 flex gap-1 h-2 w-full bg-base-100 rounded-full overflow-hidden">
        {day.blocks.map((block, bIdx) => {
          const isCompleted = bIdx < blockIndex
          const isCurrent = bIdx === blockIndex
          return (
            <div 
              key={bIdx} 
              className={`h-full transition-all duration-500 ${
                isCompleted ? 'bg-primary' : isCurrent ? 'bg-primary/50' : 'bg-base-200'
              }`}
              style={{ width: `${100 / day.blocks.length}%` }}
            />
          )
        })}
      </div>
    </div>
  )
}

export default SessionController
