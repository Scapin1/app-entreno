import React, { useState, useEffect } from 'react'
import { ChevronLeft, Dumbbell, BarChart2 } from 'lucide-react'
import MainMenu from './features/menu/MainMenu'
import TrainingPreview from './features/preview/TrainingPreview'
import SessionController from './features/session/SessionController'
import Analytics from './features/analytics/Analytics'
import { getCurrentSession, clearCurrentSession } from './utils/storage'
import planData from './data/plan.json'

function App() {
  const [screen, setScreen] = useState('menu')
  const [selectedDay, setSelectedDay] = useState(null)
  const [showRecoveryPrompt, setShowRecoveryPrompt] = useState(false)
  const [savedSession, setSavedSession] = useState(null)

  // Check for recovery session on mount
  useEffect(() => {
    const saved = getCurrentSession()
    if (saved && saved.dayId) {
      setSavedSession(saved)
      setShowRecoveryPrompt(true)
    }
  }, [])

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
    if (screen === 'analytics') setScreen('menu')
  }

  const handleOpenAnalytics = () => {
    setScreen('analytics')
  }

  const handleRecoveryResume = () => {
    // Find the day that was being trained
    const day = planData.days.find(d => d.id === savedSession.dayId)
    if (day) {
      setSelectedDay(day)
      setScreen('session')
    }
    setShowRecoveryPrompt(false)
  }

  const handleRecoveryDismiss = () => {
    clearCurrentSession()
    setShowRecoveryPrompt(false)
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
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-content p-2 rounded-xl rotate-12 shadow-lg">
            <Dumbbell size={28} strokeWidth={3} />
          </div>
          <h1 className="text-4xl font-black text-primary uppercase tracking-tighter italic">Entreno App</h1>
        </div>
      </header>

      <main className="w-full flex-grow">
        {screen === 'menu' && (
          <MainMenu onSelectDay={handleDaySelect} onOpenAnalytics={handleOpenAnalytics} />
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

        {screen === 'analytics' && (
          <Analytics onBack={handleGoBack} />
        )}
      </main>

      {/* Recovery prompt modal */}
      {showRecoveryPrompt && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-base-100 p-6 rounded-2xl m-4">
            <h3 className="font-black text-xl mb-2">¿Continuar entrenamiento?</h3>
            <p className="text-sm opacity-70 mb-4">
              Tenías un entrenamiento en progreso. ¿Querés continuar donde lo dejaste?
            </p>
            <div className="flex gap-2">
              <button 
                onClick={handleRecoveryDismiss}
                className="btn btn-ghost flex-1"
              >
                Cancelar
              </button>
              <button 
                onClick={handleRecoveryResume}
                className="btn btn-primary flex-1"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
