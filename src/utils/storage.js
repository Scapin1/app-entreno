const STORAGE_KEYS = {
  HISTORY: 'entreno_history',
  BODY_WEIGHT: 'entreno_body_weight',
  CURRENT_SESSION: 'entreno_current_session',
}

const DEFAULT_HISTORY = []
const DEFAULT_BODY_WEIGHT = []

// ==================== HISTORIAL DE ENTRENAMIENTOS ====================

export const getHistory = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.HISTORY)
    return data ? JSON.parse(data) : DEFAULT_HISTORY
  } catch (e) {
    console.error('Error reading history:', e)
    return DEFAULT_HISTORY
  }
}

export const deleteSession = (timestamp) => {
  try {
    const history = getHistory()
    const filtered = history.filter(s => s.timestamp !== timestamp)
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(filtered))
  } catch (e) {
    console.error('Error deleting session:', e)
  }
}

// ==================== EXPORT/IMPORT ====================
export const exportAllData = () => {
  try {
    const history = getHistory()
    const bodyWeight = getBodyWeight()
    const data = {
      history,
      bodyWeight,
      exportedAt: new Date().toISOString(),
    }
    return JSON.stringify(data, null, 2)
  } catch (e) {
    console.error('Error exporting data:', e)
    return null
  }
}

export const importAllData = (jsonString) => {
  try {
    const data = JSON.parse(jsonString)
    if (data.history) {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(data.history))
    }
    if (data.bodyWeight) {
      localStorage.setItem(STORAGE_KEYS.BODY_WEIGHT, JSON.stringify(data.bodyWeight))
    }
    return true
  } catch (e) {
    console.error('Error importing data:', e)
    return false
  }
}

export const saveWorkoutSession = (session) => {
  try {
    const history = getHistory()
    const sessionWithDate = {
      ...session,
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
    }
    history.unshift(sessionWithDate) // Agregar al inicio (más reciente primero)
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history))
    return sessionWithDate
  } catch (e) {
    console.error('Error saving session:', e)
  }
}

export const saveExerciseResult = (dayId, exerciseName, setNumber, actualData, feeling, duration = null) => {
  try {
    const history = getHistory()
    const today = new Date().toISOString().split('T')[0]
    
    // Buscar si ya existe sesión de hoy
    let todaySession = history.find(s => s.date === today && s.dayId === dayId)
    
    if (!todaySession) {
      // Crear nueva sesión
      todaySession = {
        dayId,
        date: today,
        timestamp: Date.now(),
        exercises: [],
        totalDuration: 0,
      }
      history.unshift(todaySession)
    }
    
    // Agregar o actualizar resultado del ejercicio
    const existingIdx = todaySession.exercises.findIndex(
      e => e.name === exerciseName && e.set === setNumber
    )
    
    const exerciseResult = {
      name: exerciseName,
      set: setNumber,
      actual: actualData,
      feeling,
      duration, // duración en segundos
      timestamp: Date.now(),
    }
    
    if (existingIdx >= 0) {
      todaySession.exercises[existingIdx] = exerciseResult
    } else {
      todaySession.exercises.push(exerciseResult)
    }
    
    // Calcular duración total de la sesión
    const totalDuration = todaySession.exercises.reduce((acc, ex) => acc + (ex.duration || 0), 0)
    todaySession.totalDuration = totalDuration
    
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history))
    return exerciseResult
  } catch (e) {
    console.error('Error saving exercise result:', e)
  }
}

// ==================== PESO CORPORAL ====================

export const getBodyWeight = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.BODY_WEIGHT)
    return data ? JSON.parse(data) : DEFAULT_BODY_WEIGHT
  } catch (e) {
    console.error('Error reading body weight:', e)
    return DEFAULT_BODY_WEIGHT
  }
}

export const saveBodyWeight = (weight, date = null) => {
  try {
    const weights = getBodyWeight()
    const entry = {
      weight: parseFloat(weight),
      date: date || new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
    }
    weights.unshift(entry)
    // Mantener solo últimos 365 días
    const trimmed = weights.slice(0, 365)
    localStorage.setItem(STORAGE_KEYS.BODY_WEIGHT, JSON.stringify(trimmed))
    return entry
  } catch (e) {
    console.error('Error saving body weight:', e)
  }
}

// ==================== ESTADO ACTUAL (RECOVERY) ====================

export const getCurrentSession = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION)
    return data ? JSON.parse(data) : null
  } catch (e) {
    console.error('Error reading current session:', e)
    return null
  }
}

export const saveCurrentSession = (sessionState) => {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(sessionState))
  } catch (e) {
    console.error('Error saving current session:', e)
  }
}

export const clearCurrentSession = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION)
  } catch (e) {
    console.error('Error clearing current session:', e)
  }
}

// ==================== HELPERS PARA ANALÍTICAS ====================

export const getExerciseHistory = (exerciseName) => {
  const history = getHistory()
  return history
    .filter(s => s.exercises?.some(e => e.name === exerciseName))
    .map(s => {
      const ex = s.exercises.find(e => e.name === exerciseName)
      return {
        date: s.date,
        dayId: s.dayId,
        ...ex,
      }
    })
    .sort((a, b) => a.timestamp - b.timestamp)
}

export const getPersonalRecord = (exerciseName) => {
  const history = getHistory()
  const allExercises = history.flatMap(s => s.exercises || [])
  const matching = allExercises.filter(e => e.name === exerciseName && e.actual?.weight)
  
  if (matching.length === 0) return null
  
  return matching.reduce((max, e) => 
    (e.actual?.weight || 0) > (max.actual?.weight || 0) ? e : max
  )
}

export const getLatestWeight = () => {
  const weights = getBodyWeight()
  return weights.length > 0 ? weights[0] : null
}

export { STORAGE_KEYS }