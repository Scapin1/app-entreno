import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { colors } from './styles/tokens'
import LoginScreen from './features/auth/LoginScreen'
import ProfileSelector from './features/profile/ProfileSelector'
import MainMenu from './features/menu/MainMenu'
import TrainingPreview from './features/preview/TrainingPreview'
import SessionController from './features/session/SessionController'
import { sessionsAPI } from './utils/api'
import { getCurrentSession } from './utils/storage'
import Analytics from './features/analytics/Analytics'
import Settings from './features/settings/Settings'
import RoutineManager from './features/routines/RoutineManager'

function AppContent() {
  const { isAuthenticated, profile, logout, loading } = useAuth()
  const [screen, setScreen] = useState('login')
  const [selectedDay, setSelectedDay] = useState(null)

  useEffect(() => {
    if (!isAuthenticated) {
      setScreen('login')
    } else if (!profile) {
      setScreen('profile-select')
    } else {
      setScreen('menu')
    }
  }, [isAuthenticated, profile])

  const handleSelectDay = (day) => {
    setSelectedDay(day)
    setScreen('preview')
  }

  const handleStartWorkout = () => {
    setScreen('session')
  }

  const handleBack = () => {
    if (screen === 'preview' || screen === 'session') {
      if (screen === 'session') {
        const currentSession = getCurrentSession()

        // Si no hay sesión activa (ya fue completada/terminada en SessionController), navegamos sin preguntar
        if (!currentSession?.backendSessionId) {
          setScreen('menu')
          setSelectedDay(null)
          return
        }

        const confirmed = window.confirm('¿Seguro querés salir? Se puede perder el progreso de la sesión actual.')
        if (!confirmed) return

        sessionsAPI.complete(currentSession.profileId, currentSession.backendSessionId, {
          total_duration: currentSession.elapsedTime,
          is_completed: false,
        }).catch(err => console.warn('[API]', err.message))
      }
      setScreen('menu')
      setSelectedDay(null)
    } else if (screen === 'analytics' || screen === 'settings' || screen === 'routines') {
      setScreen('menu')
    }
  }

  const handleLogout = () => {
    logout()
  }

  const navigate = (targetScreen) => {
    // Map navigation IDs to screen names
    const screenMap = {
      'days': 'menu',
      'analytics': 'analytics',
      'settings': 'settings',
      'routines': 'routines',
    }
    const screen = screenMap[targetScreen] || targetScreen
    if (screen === 'menu') {
      setSelectedDay(null)
    }
    setScreen(screen)
  }

  // Loading spinner
  if (loading && isAuthenticated && !profile) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: colors.background, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '48px', color: colors.primary, animation: 'spin 1s linear infinite' }}>
          sync
        </span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // Auth Screen
  if (!isAuthenticated) {
    return <LoginScreen />
  }

  // Profile Select
  if (!profile) {
    return <ProfileSelector />
  }

  // Main Screens
  return (
    <>
      {screen === 'menu' && (
        <MainMenu 
          onSelectDay={handleSelectDay}
          onNavigate={navigate}
        />
      )}

      {screen === 'preview' && selectedDay && (
        <TrainingPreview 
          day={selectedDay}
          routineId={selectedDay?.routine_id}
          onStart={handleStartWorkout}
          onBack={handleBack}
          onNavigate={navigate}
        />
      )}

      {screen === 'session' && selectedDay && (
        <SessionController 
          day={selectedDay}
          onBack={handleBack}
        />
      )}

      {screen === 'analytics' && (
        <Analytics 
          onBack={handleBack}
          onNavigate={navigate}
        />
      )}

      {screen === 'settings' && (
        <Settings 
          onBack={handleBack}
          onNavigate={navigate}
        />
      )}

      {screen === 'routines' && (
        <RoutineManager 
          onBack={handleBack}
          onNavigate={navigate}
        />
      )}
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
