import React, { useState } from 'react'
import { ChevronRight, X } from 'lucide-react'

// Opciones de feeling predefinidas
const FEELING_OPTIONS = [
  { id: 'easy', emoji: '😊', label: 'Fácil', color: 'btn-success', desc: 'Podía hacer más' },
  { id: 'good', emoji: '👍', label: 'Bien', color: 'btn-info', desc: 'Challenge OK' },
  { id: 'hard', emoji: '😤', label: 'Duro', color: 'btn-warning', desc: 'Costó pero OK' },
  { id: 'failed', emoji: '❌', label: 'Fallé', color: 'btn-error', desc: 'No pude' },
]

const ExerciseFeedback = ({ 
  exercise, 
  currentSet, 
  onContinue, 
  onSkip,
  defaultReps = null,
  defaultWeight = null,
}) => {
  const [reps, setReps] = useState(defaultReps || exercise.reps || exercise.value || 0)
  const [weight, setWeight] = useState(defaultWeight || '')
  const [feeling, setFeeling] = useState(null)
  const [showFeeling, setShowFeeling] = useState(false)

  const hasWeight = exercise.type === 'sets' && !exercise.name.toLowerCase().includes('paloff')
  const hasReps = exercise.type === 'sets' || exercise.type === 'reps'

  const handleSubmit = () => {
    const actualData = {
      reps: hasReps ? reps : null,
      weight: hasWeight && weight ? parseFloat(weight) : null,
    }
    
    onContinue({
      actual: Object.values(actualData).some(v => v !== null && v !== '') ? actualData : null,
      feeling,
    })
  }

  const handleContinueClick = () => {
    if (!showFeeling) {
      setShowFeeling(true)
    } else {
      handleSubmit()
    }
  }

  // Si es manual o timer, no mostrar nada
  if (exercise.type === 'manual' || exercise.type === 'timer') {
    onSkip()
    return null
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center animate-in fade-in duration-200">
      <div className="bg-base-100 w-full max-w-md rounded-t-3xl p-6 animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black uppercase tracking-tight">
            {exercise.name}
          </h3>
          <button onClick={onSkip} className="btn btn-ghost btn-sm btn-circle">
            <X size={20} />
          </button>
        </div>

        {/* Set actual */}
        <div className="text-center mb-6">
          <span className="badge badge-lg badge-primary font-black uppercase">
            Serie {currentSet} {exercise.sets > 1 ? `de ${exercise.sets}` : ''}
          </span>
        </div>

        {/* Inputs de reps y peso */}
        <div className="space-y-4 mb-6">
          {hasReps && (
            <div className="form-control">
              <label className="label">
                <span className="label-text font-bold uppercase text-xs">Repeticiones</span>
              </label>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setReps(Math.max(0, reps - 1))}
                  className="btn btn-circle btn-lg btn-outline"
                >
                  -
                </button>
                <input
                  type="number"
                  value={reps}
                  onChange={(e) => setReps(parseInt(e.target.value) || 0)}
                  className="input input-bordered input-lg text-center font-black text-2xl flex-1"
                />
                <button 
                  onClick={() => setReps(reps + 1)}
                  className="btn btn-circle btn-lg btn-outline"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {hasWeight && (
            <div className="form-control">
              <label className="label">
                <span className="label-text font-bold uppercase text-xs">Peso (kg)</span>
              </label>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setWeight(Math.max(0, (parseFloat(weight) || 0) - 2.5))}
                  className="btn btn-circle btn-lg btn-outline"
                >
                  -
                </button>
                <input
                  type="number"
                  step="0.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="--"
                  className="input input-bordered input-lg text-center font-black text-2xl flex-1"
                />
                <button 
                  onClick={() => setWeight((parseFloat(weight) || 0) + 2.5)}
                  className="btn btn-circle btn-lg btn-outline"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Feeling buttons */}
        {showFeeling && (
          <div className="animate-in fade-in slide-in-from-bottom duration-200 mb-6">
            <p className="text-center text-sm font-bold uppercase opacity-60 mb-3">
              ¿Cómo te sentiste?
            </p>
            <div className="grid grid-cols-2 gap-2">
              {FEELING_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setFeeling(option.id)}
                  className={`btn ${feeling === option.id ? option.color : 'btn-ghost'} h-16 flex-col py-1`}
                >
                  <span className="text-2xl">{option.emoji}</span>
                  <span className="text-xs font-bold uppercase">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Botón continuar */}
        <button
          onClick={handleContinueClick}
          className="btn btn-primary btn-block btn-lg rounded-2xl gap-3 text-lg font-black uppercase"
        >
          {showFeeling ? 'Confirmar' : 'Siguiente'}
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  )
}

export default ExerciseFeedback