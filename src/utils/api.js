// API Client - Communicate with FastAPI backend
// Falls back to localStorage if API is unavailable

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
  throw new Error('VITE_API_URL is required in production build')
}

// Helper for API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  
  // Get token from localStorage
  const token = localStorage.getItem('auth_token')
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new Error(error.detail || `HTTP ${response.status}`)
    }
    
    // Handle empty responses
    if (response.status === 204) return null
    
    return await response.json()
  } catch (error) {
    console.error(`API Error: ${endpoint}`, error)
    throw error
  }
}

// ==================== AUTH ====================

export const authAPI = {
  register: (email, password) => 
    apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  
  login: (email, password) => 
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  
  logout: () => {
    localStorage.removeItem('auth_token')
  },

  updateMe: (data) =>
    apiCall('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
}

// ==================== PROFILES ====================

export const profilesAPI = {
  list: () => apiCall('/profiles/'),

  avatars: () => apiCall('/profiles/avatars'),
  
  get: (id) => apiCall(`/profiles/${id}`),
  
  create: (name, days = [0,1,2,3,4,5,6], image = null) => 
    apiCall('/profiles/', {
      method: 'POST',
      body: JSON.stringify({ name, days, image }),
    }),
  
  update: (id, data) => 
    apiCall(`/profiles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id) => 
    apiCall(`/profiles/${id}`, { method: 'DELETE' }),
}

// ==================== TRAINING DAYS ====================

export const trainingDaysAPI = {
  list: (profileId) => apiCall(`/profiles/${profileId}/days/`),
  
  get: (profileId, dayId) => apiCall(`/profiles/${profileId}/days/${dayId}`),
  
  create: (profileId, data) => 
    apiCall(`/profiles/${profileId}/days/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (profileId, dayId, data) => 
    apiCall(`/profiles/${profileId}/days/${dayId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  seed: (profileId) => 
    apiCall(`/profiles/${profileId}/days/seed`, { method: 'POST' }),
}

// ==================== SESSIONS ====================

export const sessionsAPI = {
  create: (profileId, dayId, date) => 
    apiCall(`/profiles/${profileId}/sessions`, {
      method: 'POST',
      body: JSON.stringify({ day_id: dayId, date }),
    }),
  
  get: (profileId, sessionId) => 
    apiCall(`/profiles/${profileId}/sessions/${sessionId}`),

  list: (profileId, limit = 30, offset = 0) =>
    apiCall(`/profiles/${profileId}/sessions?limit=${limit}&offset=${offset}`),
  
  complete: (profileId, sessionId, duration) => 
    apiCall(`/profiles/${profileId}/sessions/${sessionId}/complete`, {
      method: 'PUT',
      body: JSON.stringify({ total_duration: duration }),
    }),
  
  addExerciseResult: (profileId, sessionId, data) => 
    apiCall(`/profiles/${profileId}/sessions/${sessionId}/exercises`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

// ==================== WEIGHT ====================

export const weightAPI = {
  list: (profileId) => apiCall(`/weight/${profileId}/weight`),
  
  add: (profileId, weight, date) => 
    apiCall(`/weight/${profileId}/weight`, {
      method: 'POST',
      body: JSON.stringify({ weight, date }),
    }),
  
  delete: (profileId, weightId) => 
    apiCall(`/weight/${profileId}/weight/${weightId}`, { method: 'DELETE' }),
}

// ==================== RECOVERY ====================

export const recoveryAPI = {
  get: (profileId) => apiCall(`/${profileId}/recovery`),
  
  update: (profileId, data) => 
    apiCall(`/${profileId}/recovery`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  reset: (profileId) => 
    apiCall(`/${profileId}/recovery`, { method: 'DELETE' }),
}

// ==================== ANALYTICS ====================

export const analyticsAPI = {
  getSummary: (profileId) => apiCall(`/profiles/${profileId}/analytics/summary`),

  getStats: (profileId, startDate, endDate) => {
    const params = new URLSearchParams()
    if (startDate) params.set('start_date', startDate)
    if (endDate) params.set('end_date', endDate)
    const query = params.toString()
    return apiCall(`/profiles/${profileId}/analytics/stats${query ? `?${query}` : ''}`)
  },
  
  getWeightHistory: (profileId, limit = 30) => 
    apiCall(`/profiles/${profileId}/analytics/weight?limit=${limit}`),
  
  getCalendar: (profileId, month, year) => 
    apiCall(`/profiles/${profileId}/analytics/calendar?month=${month}&year=${year}`),
  
  getWeekly: (profileId, weeks = 4) => 
    apiCall(`/profiles/${profileId}/analytics/weekly?weeks=${weeks}`),
  
  getFrequency: (profileId, limit = 10) => 
    apiCall(`/profiles/${profileId}/analytics/frequency?limit=${limit}`),

  getAdherence: (profileId, startDate, endDate) => {
    const params = new URLSearchParams()
    if (startDate) params.set('start_date', startDate)
    if (endDate) params.set('end_date', endDate)
    const query = params.toString()
    return apiCall(`/profiles/${profileId}/analytics/adherence${query ? `?${query}` : ''}`)
  },

  seedDemo: (profileId, months = 12) =>
    apiCall(`/profiles/${profileId}/analytics/seed-demo?months=${months}`, {
      method: 'POST',
    }),

  getExerciseProgress: (profileId, exerciseName, startDate, endDate, limit = 180) => {
    const params = new URLSearchParams()
    params.set('exercise_name', exerciseName)
    if (startDate) params.set('start_date', startDate)
    if (endDate) params.set('end_date', endDate)
    if (limit) params.set('limit', String(limit))
    return apiCall(`/profiles/${profileId}/analytics/exercise-progress?${params.toString()}`)
  },
}

// ==================== HELPERS ====================

export const isAuthenticated = () => !!localStorage.getItem('auth_token')

export const getStoredToken = () => localStorage.getItem('auth_token')

export const setStoredToken = (token) => {
  localStorage.setItem('auth_token', token)
}

export const getCurrentProfileId = () => {
  const profileId = localStorage.getItem('current_profile_id')
  return profileId ? parseInt(profileId, 10) : null
}

export const setCurrentProfileId = (id) => {
  localStorage.setItem('current_profile_id', id.toString())
}

export const clearStoredAuth = () => {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('current_profile_id')
}
