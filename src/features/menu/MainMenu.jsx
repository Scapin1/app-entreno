import React from 'react'
import planData from '../../data/plan.json'

const MainMenu = ({ onSelectDay }) => {
  return (
    <div className="flex flex-col gap-4 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <p className="text-sm font-bold uppercase text-base-content/60 tracking-widest mb-2 text-center">
        Selecciona tu entrenamiento
      </p>
      
      <div className="grid grid-cols-1 gap-4">
        {planData.days.map((day) => (
          <button
            key={day.id}
            onClick={() => onSelectDay(day)}
            className="group relative overflow-hidden rounded-2xl bg-base-200 p-6 text-left transition-all hover:bg-primary hover:text-primary-content active:scale-95 border-2 border-primary/20 hover:border-primary shadow-xl"
          >
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-2xl font-black uppercase tracking-tight leading-none">
                {day.title}
              </h2>
              <span className="badge badge-outline border-current font-bold">#{day.id}</span>
            </div>
            <p className="text-sm opacity-80 font-medium">
              {day.focus}
            </p>
            
            <div className="mt-4 flex flex-wrap gap-2">
              {day.implements.slice(0, 3).map((item, i) => (
                <span key={i} className="text-[10px] uppercase font-bold px-2 py-1 bg-black/20 rounded-md">
                  {item}
                </span>
              ))}
              {day.implements.length > 3 && (
                <span className="text-[10px] uppercase font-bold px-2 py-1 bg-black/20 rounded-md">
                  +{day.implements.length - 3}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default MainMenu
