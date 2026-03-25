import React from 'react'
import { Trophy, ArrowRight, CheckCircle } from 'lucide-react'

const BlockSummary = ({ blockName, onContinue, isLast }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center h-[70vh] w-full animate-in zoom-in duration-500 p-6">
      <div className="w-32 h-32 bg-primary/20 rounded-full flex items-center justify-center text-primary mb-8 shadow-[0_0_50px_rgba(204,255,0,0.2)]">
        {isLast ? <Trophy size={64} strokeWidth={3} /> : <CheckCircle size={64} strokeWidth={3} />}
      </div>
      
      <h2 className="text-4xl font-black uppercase italic tracking-tighter leading-none mb-2">
        {isLast ? '¡Entrenamiento!' : blockName}
      </h2>
      <p className="text-2xl font-black uppercase opacity-50 italic mb-12">
        {isLast ? 'Completado con éxito' : 'Terminado'}
      </p>

      <button 
        onClick={onContinue}
        className="btn btn-primary btn-lg w-full rounded-2xl gap-3 text-xl font-black italic uppercase tracking-tighter shadow-2xl"
      >
        {isLast ? 'Volver al Menú' : 'Continuar'}
        <ArrowRight size={24} strokeWidth={3} />
      </button>
    </div>
  )
}

export default BlockSummary
