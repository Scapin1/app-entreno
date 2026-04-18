import React, { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { colors, typography, spacing, borderRadius } from '../../styles/tokens'
import { PrimaryButton } from '../../components/ui'
import { profilesAPI } from '../../utils/api'
import { PROFILE_AVATAR_PRESETS } from '../../constants/profileAvatars'

const ProfileSelector = () => {
  const { selectProfile } = useAuth()
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(PROFILE_AVATAR_PRESETS[0])
  const [profiles, setProfiles] = useState([])
  const [avatarOptions, setAvatarOptions] = useState(PROFILE_AVATAR_PRESETS)

  const handleSelect = (profile) => {
    selectProfile(profile)
  }

  const handleCreateNew = (e) => {
    e.preventDefault()
    if (!newName.trim()) return

    const createRemoteProfile = async () => {
      try {
        const created = await profilesAPI.create(newName.trim(), [0,1,2,3,4,5,6], selectedAvatar)
        const newProfile = created?.profile || created || {
          id: Date.now(),
          name: newName.trim(),
          image: selectedAvatar
        }
        selectProfile(newProfile)
      } catch (err) {
        const newProfile = {
          id: Date.now(),
          name: newName.trim(),
          image: selectedAvatar
        }
        selectProfile(newProfile)
      }
    }

    createRemoteProfile()
  }

  const handleLoadRemoteProfiles = async () => {
    try {
      const remoteProfiles = await profilesAPI.list()
      const fallbackList = avatarOptions.length > 0 ? avatarOptions : PROFILE_AVATAR_PRESETS
      if (Array.isArray(remoteProfiles)) {
        setProfiles(remoteProfiles.map((p, idx) => ({
          ...p,
          image: p.image || fallbackList[idx % fallbackList.length],
        })))
      }
    } catch (e) {
      console.warn('Using local fallback profiles:', e)
    }
  }

  const handleLoadAvatarOptions = async () => {
    try {
      const options = await profilesAPI.avatars()
      if (Array.isArray(options) && options.length > 0) {
        setAvatarOptions(options)
        setSelectedAvatar(options[0])
      }
    } catch (e) {
      // fallback local presets
      setAvatarOptions(PROFILE_AVATAR_PRESETS)
      setSelectedAvatar(PROFILE_AVATAR_PRESETS[0])
    }
  }

  useEffect(() => {
    handleLoadAvatarOptions()
  }, [])

  useEffect(() => {
    handleLoadRemoteProfiles()
  }, [avatarOptions.length])

  // Vista crear perfil
  if (showCreate) {
    return (
      <div style={styles.container}>
        <div style={styles.logoRow}>
          <span className="material-symbols-outlined" style={styles.logoIcon}>fitness_center</span>
          <span style={styles.logoText}>GYMTRACKER</span>
        </div>

        <div style={styles.createForm}>
          <h2 style={styles.createTitle}>Nuevo Perfil</h2>
          <p style={styles.createSubtitle}>¿Cómo te llamás?</p>

          <form onSubmit={handleCreateNew}>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Tu nombre"
              autoFocus
              style={styles.input}
            />

            <div style={styles.avatarChooser}>
              {avatarOptions.map((avatar) => (
                <button
                  key={avatar}
                  type="button"
                  onClick={() => setSelectedAvatar(avatar)}
                  style={selectedAvatar === avatar ? styles.avatarOptionActive : styles.avatarOption}
                >
                  <img src={avatar} alt="Avatar" style={styles.avatarImg} />
                </button>
              ))}
            </div>

            <PrimaryButton type="submit" disabled={!newName.trim()} style={styles.createButton}>
              Crear Perfil
            </PrimaryButton>
          </form>

          <button onClick={() => setShowCreate(false)} style={styles.backButton}>← Volver</button>
        </div>
      </div>
    )
  }

  // Vista normal - selector de perfiles
  return (
    <div style={styles.container}>
      {/* Logo */}
      <div style={styles.logoRow}>
        <span className="material-symbols-outlined" style={styles.logoIcon}>fitness_center</span>
        <span style={styles.logoText}>GYMTRACKER</span>
      </div>

      {/* Título */}
      <div style={styles.header}>
        <h2 style={styles.title}>¿Quién soy?</h2>
        <p style={styles.subtitle}>Elegí tu perfil para continuar</p>
      </div>

      {/* Grid de perfiles */}
      <div style={styles.grid}>
        {profiles.map((profile, index) => (
          <button key={profile.id} onClick={() => handleSelect(profile)} style={styles.profileButton}>
            <div style={{...styles.avatar, border: `3px solid ${colors.surfaceContainerHighest}`}}>
              <img src={profile.image || avatarOptions[index % avatarOptions.length]} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <span style={styles.profileName}>{profile.name}</span>
          </button>
        ))}

        {/* Botón crear nuevo */}
        <button onClick={() => setShowCreate(true)} style={styles.profileButton}>
          <div style={styles.addAvatar}>
            <span className="material-symbols-outlined" style={{ fontSize: '40px', color: colors.onSurfaceVariant }}>add</span>
          </div>
          <span style={styles.addText}>Nuevo</span>
        </button>
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', backgroundColor: colors.background, color: colors.onSurface, fontFamily: typography.fontFamily.body, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' },
  logoRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '3rem' },
  logoIcon: { fontSize: '32px', color: colors.primary },
  logoText: { fontSize: '24px', fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.05em', color: colors.primary, fontFamily: typography.fontFamily.heading, textTransform: 'uppercase' },
  header: { textAlign: 'center', marginBottom: '3rem' },
  title: { fontSize: '2rem', fontFamily: typography.fontFamily.heading, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.5rem' },
  subtitle: { color: colors.onSurfaceVariant },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', width: '100%', maxWidth: '320px', marginBottom: '2rem' },
  profileButton: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' },
  avatar: { width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', backgroundColor: colors.surfaceContainerLow },
  profileName: { fontFamily: typography.fontFamily.heading, fontSize: '1rem', fontWeight: 700 },
  addAvatar: { width: '100px', height: '100px', borderRadius: '50%', border: '3px dashed', borderColor: colors.onSurfaceVariant, backgroundColor: colors.surfaceContainerLow, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  addText: { fontFamily: typography.fontFamily.heading, fontSize: '1rem', fontWeight: 700, color: colors.onSurfaceVariant },
  createForm: { width: '100%', maxWidth: '320px' },
  createTitle: { fontSize: '1.75rem', fontFamily: typography.fontFamily.heading, fontWeight: 700, textAlign: 'center', marginBottom: '0.5rem' },
  createSubtitle: { color: colors.onSurfaceVariant, textAlign: 'center', marginBottom: '2rem' },
  input: { width: '100%', backgroundColor: colors.surfaceContainerLow, border: 'none', borderRadius: borderRadius.md, padding: '1rem', color: colors.onSurface, fontFamily: typography.fontFamily.body, fontSize: '1.125rem', outline: 'none', marginBottom: '1.5rem', textAlign: 'center' },
  avatarChooser: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem', marginBottom: '1rem' },
  avatarOption: { width: '100%', aspectRatio: '1/1', borderRadius: '50%', overflow: 'hidden', border: `2px solid ${colors.surfaceContainerHighest}`, background: 'none', padding: 0, cursor: 'pointer' },
  avatarOptionActive: { width: '100%', aspectRatio: '1/1', borderRadius: '50%', overflow: 'hidden', border: `3px solid ${colors.primary}`, background: 'none', padding: 0, cursor: 'pointer' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  createButton: { width: '100%' },
  backButton: { width: '100%', marginTop: '1rem', background: 'none', border: 'none', color: colors.onSurfaceVariant, fontFamily: typography.fontFamily.body, fontSize: '0.875rem', cursor: 'pointer', padding: '0.5rem' },
}

export default ProfileSelector
