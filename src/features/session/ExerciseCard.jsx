import React, { useState, useEffect } from 'react'
import { Play, Square, FastForward, Check } from 'lucide-react'
import Timer from './Timer'
import ExerciseFeedback from './ExerciseFeedback'
import { saveExerciseResult } from '../../utils/storage'

const ExerciseCard = ({ 
  exercise, 
  currentSet = 1, 
  onNext, 
  onTimerComplete, 
  isCircuitBlock = false,
  dayId = null,
  lastResult = null,
}) => {
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [timerKey, setTimerKey] = useState(0)
  const [showFeedback, setShowFeedback] = useState(false)

  // Resetear el timer cuando cambia el ejercicio
  useEffect(() => {
    setIsTimerRunning(false)
    setTimerKey(prev => prev + 1)
  }, [exercise])

  const handleTimerComplete = () => {
    setIsTimerRunning(false)
    // Si es un circuito, avanzamos automáticamente
    if (isCircuitBlock && onTimerComplete) {
      onTimerComplete()
    }
  }

  const handleManualTimerComplete = () => {
    setIsTimerRunning(false)
    // Para el timer manual de 20s, no avanzamos solo reseteamos estado
  }

  return (
    <div className="w-full bg-base-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl border-4 border-primary/20 min-h-[400px]">
      <h2 className="text-3xl font-black uppercase tracking-tight mb-2 italic leading-none">
        {exercise.name}
      </h2>

      {/* Indicador de lado si aplica */}
      {exercise.alternating && (
        <span className="text-xl font-black uppercase italic text-primary mb-4">
          Lado {currentSet % 2 !== 0 ? 'Izquierdo' : 'Derecho'}
        </span>
      )}

      {/* Indicador de vueltas (Circuitos) */}
      {isCircuitBlock && (
        <div className="flex items-center gap-4 mb-4">
          <span className="badge badge-secondary font-black italic uppercase px-4 py-3">
            Vuelta {currentSet}
          </span>
        </div>
      )}

      {/* Indicador de series si aplica (Bloques normales) */}
      {!isCircuitBlock && exercise.sets > 1 && (
        <div className="flex items-center gap-4 mb-4">
          <span className="badge badge-primary font-black italic uppercase px-4 py-3">
            Set {currentSet} de {exercise.sets}
          </span>
        </div>
      )}

      {/* Visualización según el tipo de ejercicio */}
      <div className="flex-grow flex flex-col items-center justify-center w-full">
        {exercise.type === 'reps' && (
          <div className="flex flex-col items-center">
            <span className="text-8xl font-black italic tracking-tighter text-primary">{exercise.value}</span>
            <span className="text-2xl font-black uppercase opacity-50 -mt-2">Repeticiones</span>
          </div>
        )}

        {exercise.type === 'sets' && (
          <div className="flex flex-col items-center gap-4">
            {exercise.reps && (
              <div className="flex items-baseline gap-2">
                <span className="text-8xl font-black italic tracking-tighter text-primary">{exercise.reps}</span>
                <span className="text-2xl font-black uppercase opacity-50 italic">reps</span>
              </div>
            )}
            {exercise.value && exercise.type !== 'reps' && (
              <p className="text-lg font-bold opacity-80 max-w-xs">{exercise.value}</p>
            )}
            {/* Timer de 20s rápido solo para Press Paloff */}
            {exercise.name.toLowerCase().includes('paloff') && (
              <div className="mt-4">
                <button 
                  onClick={() => {
                    setTimerKey(prev => prev + 1)
                    setIsTimerRunning(true)
                  }}
                  className={`btn btn-sm btn-outline gap-2 font-black italic uppercase ${isTimerRunning ? 'hidden' : ''}`}
                >
                  <Play size={16} /> Timer 20s
                </button>
                {isTimerRunning && (
                  <div className="flex flex-col items-center gap-4">
                    <Timer 
                      key={timerKey}
                      seconds={20} 
                      isRunning={isTimerRunning} 
                      onComplete={handleManualTimerComplete}
                      autoStart={true}
                      withPrep={true}
                    />
                    <button 
                      onClick={() => setIsTimerRunning(false)}
                      className="btn btn-circle btn-sm btn-ghost"
                    >
                      <Square size={16} fill="currentColor" />
                    </button>
                  </div>
                )}
              </div>
            )}
            {exercise.note && (
              <span className="badge badge-outline border-primary/40 text-xs font-bold uppercase mt-2">{exercise.note}</span>
            )}
          </div>
        )}

        {exercise.type === 'timer' && (
          <div className="flex flex-col items-center gap-6 w-full">
            <Timer 
              key={timerKey}
              seconds={exercise.value} 
              isRunning={isTimerRunning} 
              onComplete={handleTimerComplete}
              autoStart={isCircuitBlock}
            />
            {!isCircuitBlock && (
              <button 
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`btn btn-circle btn-lg ${isTimerRunning ? 'btn-outline' : 'btn-primary'} shadow-xl`}
              >
                {isTimerRunning ? <Square size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
              </button>
            )}
            {isCircuitBlock && !isTimerRunning && (
              <span className="text-sm font-bold uppercase italic opacity-50">¡Tiempo agotado!</span>
            )}
          </div>
        )}

        {exercise.type === 'manual' && (
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
              <Check size={48} strokeWidth={4} />
            </div>
            <p className="text-lg font-bold opacity-60 uppercase italic">Hazlo a tu ritmo</p>
          </div>
        )}
      </div>

      {/* Botón de Siguiente */}
      <div className="mt-12 w-full">
        <button 
          onClick={() => setShowFeedback(true)}
          className="btn btn-primary btn-lg w-full rounded-2xl gap-3 text-xl font-black italic uppercase tracking-tighter"
        >
          {isCircuitBlock ? 'Siguiente Ejercicio' : (exercise.sets > 1 && currentSet < exercise.sets ? 'Siguiente Serie' : 'Siguiente')}
          <FastForward size={24} fill="currentColor" />
        </button>
      </div>

      {/* Modal de Feedback */}
      {showFeedback && (
        <ExerciseFeedback
          exercise={exercise}
          currentSet={currentSet}
          defaultReps={lastResult?.actual?.reps || exercise.reps || exercise.value}
          defaultWeight={lastResult?.actual?.weight}
          onContinue={(feedbackData) => {
            // Guardar en storage
            if (dayId && feedbackData?.actual) {
              saveExerciseResult(dayId, exercise.name, currentSet, feedbackData.actual, feedbackData.feeling)
            }
            setShowFeedback(false)
            onNext()
          }}
          onSkip={() => {
            setShowFeedback(false)
            onNext()
          }}
        />
      )}
    </div>
  )
}

export default ExerciseCard
