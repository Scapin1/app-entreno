import React, { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import MainMenu from './features/menu/MainMenu'
import TrainingPreview from './features/preview/TrainingPreview'
import SessionController from './features/session/SessionController'

function App() {
  const [screen, setScreen] = useState('menu')
  const [selectedDay, setSelectedDay] = useState(null)

  const handleDaySelect = (day) => {
    setSelectedDay(day)
    setScreen('preview')
  }

  const handleStartTraining = () => {
    setScreen('session')
  }

  const handleGoBack = () => {
    if (screen === 'preview') setScreen('menu')
    if (screen === 'session') setScreen('preview')
  }

  return (
    <div className="max-w-md mx-auto min-h-screen p-4 flex flex-col items-center justify-start">
      <header className="w-full mb-8 flex items-center justify-center relative">
        {screen !== 'menu' && (
          <button 
            onClick={handleGoBack} 
            className="btn btn-ghost btn-circle absolute left-0"
            aria-label="Volver"
          >
            <ChevronLeft size={32} />
          </button>
        )}
        <h1 className="text-4xl font-black text-primary uppercase tracking-tighter italic">Entreno App</h1>
      </header>

      <main className="w-full flex-grow">
        {screen === 'menu' && (
          <MainMenu onSelectDay={handleDaySelect} />
        )}
        
        {screen === 'preview' && (
          <TrainingPreview 
            day={selectedDay} 
            onStart={handleStartTraining} 
            onBack={handleGoBack} 
          />
        )}

        {screen === 'session' && (
          <SessionController 
            day={selectedDay} 
            onBack={handleGoBack} 
          />
        )}
      </main>
    </div>
  )
}

export default App
