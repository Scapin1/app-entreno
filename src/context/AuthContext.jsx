import React, { createContext, useContext, useState, useEffect } from 'react'
import { profilesAPI, authAPI, getCurrentProfileId, setCurrentProfileId, getStoredToken, setStoredToken, clearStoredAuth } from '../utils/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const bootstrap = async () => {
      const token = getStoredToken()
      const savedProfile = localStorage.getItem('current_profile')
      const profileId = getCurrentProfileId()

      if (!token) {
        if (!cancelled) setLoading(false)
        return
      }

      if (!cancelled) setIsAuthenticated(true)

      if (profileId) {
        try {
          const remoteProfile = await profilesAPI.get(profileId)
          if (!cancelled) {
            setProfile(remoteProfile)
            localStorage.setItem('current_profile', JSON.stringify(remoteProfile))
          }
        } catch (e) {
          console.warn('Could not restore profile from backend:', e)
          if (savedProfile) {
            try {
              const parsed = JSON.parse(savedProfile)
              if (!cancelled) setProfile(parsed)
            } catch (parseError) {
              console.error('Error parsing profile:', parseError)
            }
          }
        }
      } else if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile)
          if (!cancelled) setProfile(parsed)
        } catch (e) {
          console.error('Error parsing profile:', e)
        }
      }

      if (!cancelled) setLoading(false)
    }

    bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  const login = (userData, token) => {
    setStoredToken(token)
    setUser(userData)
    setIsAuthenticated(true)
  }

  const logout = () => {
    clearStoredAuth()
    localStorage.removeItem('current_profile')
    setUser(null)
    setProfile(null)
    setIsAuthenticated(false)
  }

  const selectProfile = (profileData) => {
    localStorage.setItem('current_profile', JSON.stringify(profileData))
    if (profileData?.id != null) {
      setCurrentProfileId(profileData.id)
    }
    setProfile(profileData)
  }

  const updateProfile = async (updates) => {
    const currentProfile = profile
    const profileId = currentProfile?.id

    const nextProfile = { ...(currentProfile || {}), ...updates }
    const profileUpdates = {}

    if (Object.prototype.hasOwnProperty.call(updates, 'name')) profileUpdates.name = updates.name
    if (Object.prototype.hasOwnProperty.call(updates, 'days')) profileUpdates.days = updates.days
    if (Object.prototype.hasOwnProperty.call(updates, 'image')) profileUpdates.image = updates.image

    const hasEmailUpdate = Object.prototype.hasOwnProperty.call(updates, 'email')

    if (profileId) {
      try {
        let resolved = nextProfile

        if (Object.keys(profileUpdates).length > 0) {
          const updated = await profilesAPI.update(profileId, profileUpdates)
          resolved = updated?.profile || updated || resolved
        }

        if (hasEmailUpdate) {
          const updatedUser = await authAPI.updateMe({ email: updates.email })
          resolved = { ...resolved, email: updatedUser?.email || updates.email }
        }

        setProfile(resolved)
        localStorage.setItem('current_profile', JSON.stringify(resolved))
        setCurrentProfileId(profileId)
        return resolved
      } catch (e) {
        console.error('Error updating profile in backend:', e)
        throw e
      }
    }

    localStorage.setItem('current_profile', JSON.stringify(nextProfile))
    if (nextProfile?.id != null) {
      setCurrentProfileId(nextProfile.id)
    }
    setProfile(nextProfile)
    return nextProfile
  }

  const value = {
    user,
    profile,
    isAuthenticated,
    loading,
    login,
    logout,
    selectProfile,
    updateProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
