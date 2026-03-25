import React from 'react'
import { Play, Dumbbell } from 'lucide-react'

const TrainingPreview = ({ day, onStart, onBack }) => {
  if (!day) return null

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
      <div className="flex flex-col items-center justify-center mb-2">
        <h2 className="text-3xl font-black uppercase italic tracking-tight">{day.title}</h2>
        <p className="text-sm font-bold text-primary tracking-widest uppercase opacity-70">{day.focus}</p>
      </div>

      <div className="bg-base-200 rounded-2xl p-6 shadow-lg border-2 border-primary/10">
        <div className="flex items-center gap-3 mb-4 text-primary">
          <Dumbbell size={24} />
          <h3 className="font-black uppercase text-lg tracking-wider">Implementos necesarios</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {day.implements.map((item, i) => (
            <span key={i} className="badge badge-lg bg-black/30 border-none font-bold text-xs uppercase px-4 py-3">
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {day.blocks.map((block, bIdx) => (
          <div key={bIdx} className="space-y-3">
            <h4 className="text-xl font-black uppercase text-base-content/50 border-b-2 border-base-content/10 pb-1">
              {block.name}
            </h4>
            <ul className="space-y-2">
              {block.exercises.map((ex, eIdx) => (
                <li key={eIdx} className="flex justify-between items-center bg-base-100 p-4 rounded-xl shadow-sm border border-white/5">
                  <span className="font-bold text-sm leading-tight max-w-[70%]">{ex.name}</span>
                  <span className="text-primary font-black text-xs uppercase opacity-80 whitespace-nowrap">
                    {ex.type === 'reps' && (typeof ex.value === 'number' ? `${ex.value} reps` : ex.value)}
                    {ex.type === 'timer' && (typeof ex.value === 'number' ? `${ex.value} segs` : ex.value)}
                    {ex.type === 'sets' && `${ex.sets} sets`}
                    {ex.type === 'manual' && 'Manual'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Botón flotante para Iniciar */}
      <div className="fixed bottom-6 left-0 w-full px-4 flex justify-center">
        <button 
          onClick={onStart}
          className="btn btn-primary btn-lg w-full max-w-md rounded-full shadow-2xl gap-3 text-lg font-black italic uppercase tracking-tighter"
        >
          <Play size={24} fill="currentColor" />
          Iniciar Entrenamiento
        </button>
      </div>
    </div>
  )
}

export default TrainingPreview
