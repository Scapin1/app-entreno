import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { colors, typography, spacing, borderRadius, shadows } from '../../styles/tokens'
import { Sidebar, BottomNav } from '../../components/navigation'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { getUISettings, saveUISettings } from '../../utils/storage'
import { profilesAPI } from '../../utils/api'
import { PROFILE_AVATAR_PRESETS } from '../../constants/profileAvatars'

const Settings = ({ onBack, onNavigate }) => {
  const { profile, logout, updateProfile } = useAuth()
  const { isDesktop } = useBreakpoint()
  const [uiSettings, setUISettings] = useState(() => getUISettings())
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileName, setProfileName] = useState(profile?.name || '')
  const [profileEmail, setProfileEmail] = useState(profile?.email || '')
  const [profileImage, setProfileImage] = useState(profile?.image || PROFILE_AVATAR_PRESETS[0])
  const [avatarOptions, setAvatarOptions] = useState(PROFILE_AVATAR_PRESETS)
  const [profileError, setProfileError] = useState('')
  const [settingsSavedMsg, setSettingsSavedMsg] = useState('')

  useEffect(() => {
    const next = getUISettings()
    setUISettings(next)
  }, [])

  useEffect(() => {
    setProfileName(profile?.name || '')
    setProfileEmail(profile?.email || '')
    setProfileImage(profile?.image || PROFILE_AVATAR_PRESETS[0])
  }, [profile?.name, profile?.email, profile?.image])

  useEffect(() => {
    const loadAvatars = async () => {
      try {
        const options = await profilesAPI.avatars()
        if (Array.isArray(options) && options.length > 0) {
          setAvatarOptions(options)
          if (!options.includes(profileImage)) {
            setProfileImage(options[0])
          }
        }
      } catch {
        setAvatarOptions(PROFILE_AVATAR_PRESETS)
      }
    }

    loadAvatars()
  }, [])

  const notifications = uiSettings.notifications
  const soundEffects = uiSettings.soundEffects
  const vibration = uiSettings.vibration

  const toggleSetting = (key, currentValue) => {
    const nextValue = !currentValue
    const next = saveUISettings({ [key]: nextValue })
    setUISettings(next)
    setSettingsSavedMsg('Ajuste guardado')
  }

  const updateSetting = (key, value) => {
    const next = saveUISettings({ [key]: value })
    setUISettings(next)
    setSettingsSavedMsg('Ajuste guardado')
  }

  useEffect(() => {
    if (!settingsSavedMsg) return
    const timer = setTimeout(() => setSettingsSavedMsg(''), 1200)
    return () => clearTimeout(timer)
  }, [settingsSavedMsg])

  const handleLogout = () => {
    logout()
    onNavigate?.('login')
  }

  const handleSaveProfile = async () => {
    setProfileError('')

    const name = profileName.trim()
    const email = profileEmail.trim()

    if (name.length < 2) {
      setProfileError('El nombre debe tener al menos 2 caracteres')
      return
    }

    if (email.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        setProfileError('Ingresá un email válido')
        return
      }
    }

    try {
      await updateProfile({
        name: name || profile?.name,
        email: email || profile?.email,
        image: profileImage,
      })
      setIsEditingProfile(false)
    } catch (e) {
      setProfileError('No se pudo guardar el perfil en el backend')
    }
  }

  const handleCancelProfileEdit = () => {
    setProfileName(profile?.name || '')
    setProfileEmail(profile?.email || '')
    setProfileImage(profile?.image || avatarOptions[0] || PROFILE_AVATAR_PRESETS[0])
    setProfileError('')
    setIsEditingProfile(false)
  }

  const restLabel = useMemo(() => `${uiSettings.defaultRestSeconds || 90}s`, [uiSettings.defaultRestSeconds])

  // =====================
  // DESKTOP VERSION
  // =====================
  const DesktopView = () => (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar profile={profile} activeItem="settings" onNavigate={onNavigate} />
      
      <main style={styles.desktopMain}>
        <div style={styles.desktopContent}>
          <h1 style={styles.title}>Settings</h1>
          <p style={styles.subtitle}>Configuración de la app</p>

          {/* Profile Card */}
          <div style={styles.profileCard}>
            <div style={styles.profileAvatar}>
              <img src={profile?.image || 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=120&h=120&fit=crop&crop=face'} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            </div>
            <div style={styles.profileInfo}>
              {isEditingProfile ? (
                <>
                  <input value={profileName} onChange={(e) => setProfileName(e.target.value)} style={styles.profileInput} placeholder="Nombre" />
                  <input value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} style={styles.profileInput} placeholder="Email" />
                  <div style={styles.avatarChooser}>
                    {avatarOptions.map((avatar) => (
                      <button key={avatar} type="button" onClick={() => setProfileImage(avatar)} style={profileImage === avatar ? styles.avatarOptionActive : styles.avatarOption}>
                        <img src={avatar} alt="Avatar" style={styles.avatarOptionImg} />
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <span style={styles.profileName}>{profile?.name || 'Atleta'}</span>
                  <span style={styles.profileEmail}>{profile?.email || 'atleta@email.com'}</span>
                </>
              )}
            </div>
            {isEditingProfile ? (
              <div style={styles.editActions}>
                <button onClick={handleCancelProfileEdit} style={styles.editButtonSecondary}>
                  <span className="material-symbols-outlined">close</span>
                </button>
                <button onClick={handleSaveProfile} style={styles.editButton}>
                  <span className="material-symbols-outlined">check</span>
                </button>
              </div>
            ) : (
              <button onClick={() => setIsEditingProfile(true)} style={styles.editButton}>
                <span className="material-symbols-outlined">edit</span>
              </button>
            )}
          </div>

          {profileError && <div style={styles.errorBox}>{profileError}</div>}
          {settingsSavedMsg && <div style={styles.infoBox}>{settingsSavedMsg}</div>}

          {/* Settings Options */}
          <div style={styles.settingsSection}>
            <h3 style={styles.sectionTitle}>Preferencias</h3>
            
            <div style={styles.settingItem}>
              <div style={styles.settingInfo}>
                <span style={styles.settingLabel}>Notificaciones</span>
                <span style={styles.settingDesc}>Recibir recordatorios de entrenamiento</span>
              </div>
              <button onClick={() => toggleSetting('notifications', notifications)} style={notifications ? styles.toggleActive : styles.toggle}>
                <div style={notifications ? styles.toggleKnobActive : styles.toggleKnob} />
              </button>
            </div>

            <div style={styles.settingItem}>
              <div style={styles.settingInfo}>
                <span style={styles.settingLabel}>Efectos de sonido</span>
                <span style={styles.settingDesc}>Sonidos durante el entrenamiento</span>
              </div>
              <button onClick={() => toggleSetting('soundEffects', soundEffects)} style={soundEffects ? styles.toggleActive : styles.toggle}>
                <div style={soundEffects ? styles.toggleKnobActive : styles.toggleKnob} />
              </button>
            </div>

            <div style={styles.settingItem}>
              <div style={styles.settingInfo}>
                <span style={styles.settingLabel}>Vibración</span>
                <span style={styles.settingDesc}>Vibración en timers y transiciones</span>
              </div>
              <button onClick={() => toggleSetting('vibration', vibration)} style={vibration ? styles.toggleActive : styles.toggle}>
                <div style={vibration ? styles.toggleKnobActive : styles.toggleKnob} />
              </button>
            </div>

            <div style={styles.settingItem}>
              <div style={styles.settingInfo}>
                <span style={styles.settingLabel}>Unidad de peso</span>
                <span style={styles.settingDesc}>Cómo querés ver los pesos en la app</span>
              </div>
              <div style={styles.inlineControls}>
                <button
                  type="button"
                  onClick={() => updateSetting('unitSystem', 'kg')}
                  style={uiSettings.unitSystem === 'kg' ? styles.pillActive : styles.pill}
                >
                  kg
                </button>
                <button
                  type="button"
                  onClick={() => updateSetting('unitSystem', 'lb')}
                  style={uiSettings.unitSystem === 'lb' ? styles.pillActive : styles.pill}
                >
                  lb
                </button>
              </div>
            </div>

            <div style={styles.settingItem}>
              <div style={styles.settingInfo}>
                <span style={styles.settingLabel}>Descanso por defecto</span>
                <span style={styles.settingDesc}>Tiempo sugerido entre sets</span>
              </div>
              <div style={styles.inlineControls}>
                {[60, 90, 120].map((secs) => (
                  <button
                    key={secs}
                    type="button"
                    onClick={() => updateSetting('defaultRestSeconds', secs)}
                    style={uiSettings.defaultRestSeconds === secs ? styles.pillActive : styles.pill}
                  >
                    {secs}s
                  </button>
                ))}
                <span style={styles.smallMuted}>{restLabel}</span>
              </div>
            </div>

            <div style={styles.settingItem}>
              <div style={styles.settingInfo}>
                <span style={styles.settingLabel}>Series por defecto en Analytics</span>
                <span style={styles.settingDesc}>Qué líneas mostrar al abrir progreso</span>
              </div>
              <div style={styles.analyticsSeriesGrid}>
                <button type="button" onClick={() => updateSetting('showWeightSeries', !uiSettings.showWeightSeries)} style={uiSettings.showWeightSeries ? styles.pillActive : styles.pill}>Peso</button>
                <button type="button" onClick={() => updateSetting('showRepsSeries', !uiSettings.showRepsSeries)} style={uiSettings.showRepsSeries ? styles.pillActive : styles.pill}>Reps</button>
                <button type="button" onClick={() => updateSetting('showFeelingSeries', !uiSettings.showFeelingSeries)} style={uiSettings.showFeelingSeries ? styles.pillActive : styles.pill}>Feeling</button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div style={styles.settingsSection}>
            <h3 style={styles.sectionTitle}>Cuenta</h3>
            <button onClick={handleLogout} style={styles.logoutButton}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
              Cerrar Sesión
            </button>
          </div>

          {/* App Info */}
          <div style={styles.appInfo}>
            <span style={styles.appVersion}>GymTracker v1.0.0</span>
          </div>
        </div>
      </main>
    </div>
  )

  // =====================
  // MOBILE VERSION
  // =====================
  const MobileView = () => (
    <div style={{ minHeight: '100vh', backgroundColor: colors.background, fontFamily: typography.fontFamily.body }}>
      <header style={styles.mobileHeader}>
        <button onClick={onBack} style={styles.backButton}>
          <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>arrow_back</span>
        </button>
        <span style={styles.mobileTitle}>Settings</span>
        <div style={{ width: '40px' }} />
      </header>

      <main style={styles.mobileMain}>
        {/* Profile */}
        <div style={styles.mobileProfile}>
          <div style={styles.mobileAvatar}>
            <img src={profile?.image || 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=80&h=80&fit=crop&crop=face'} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
          </div>
          <div>
            {isEditingProfile ? (
              <>
                <input value={profileName} onChange={(e) => setProfileName(e.target.value)} style={styles.profileInput} placeholder="Nombre" />
                <input value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} style={styles.profileInput} placeholder="Email" />
                <div style={styles.avatarChooser}>
                  {avatarOptions.map((avatar) => (
                    <button key={avatar} type="button" onClick={() => setProfileImage(avatar)} style={profileImage === avatar ? styles.avatarOptionActive : styles.avatarOption}>
                      <img src={avatar} alt="Avatar" style={styles.avatarOptionImg} />
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <span style={styles.mobileProfileName}>{profile?.name || 'Atleta'}</span>
                <span style={styles.mobileProfileEmail}>{profile?.email || 'atleta@email.com'}</span>
              </>
            )}
          </div>
          <button onClick={isEditingProfile ? handleSaveProfile : () => setIsEditingProfile(true)} style={styles.editButton}>
            <span className="material-symbols-outlined">{isEditingProfile ? 'check' : 'edit'}</span>
          </button>
          {isEditingProfile && (
            <button onClick={handleCancelProfileEdit} style={styles.editButtonSecondary}>
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>

        {profileError && <div style={styles.errorBox}>{profileError}</div>}
        {settingsSavedMsg && <div style={styles.infoBox}>{settingsSavedMsg}</div>}

        {/* Settings */}
        <div style={styles.mobileSettings}>
          <h3 style={styles.sectionTitle}>Preferencias</h3>
          
          <div style={styles.mobileSettingItem}>
            <span style={styles.settingLabel}>Notificaciones</span>
            <button onClick={() => toggleSetting('notifications', notifications)} style={notifications ? styles.toggleActive : styles.toggle}>
              <div style={notifications ? styles.toggleKnobActive : styles.toggleKnob} />
            </button>
          </div>

          <div style={styles.mobileSettingItem}>
            <span style={styles.settingLabel}>Efectos de sonido</span>
            <button onClick={() => toggleSetting('soundEffects', soundEffects)} style={soundEffects ? styles.toggleActive : styles.toggle}>
              <div style={soundEffects ? styles.toggleKnobActive : styles.toggleKnob} />
            </button>
          </div>

          <div style={styles.mobileSettingItem}>
            <span style={styles.settingLabel}>Vibración</span>
            <button onClick={() => toggleSetting('vibration', vibration)} style={vibration ? styles.toggleActive : styles.toggle}>
              <div style={vibration ? styles.toggleKnobActive : styles.toggleKnob} />
            </button>
          </div>

          <div style={styles.mobileSettingItemCol}>
            <span style={styles.settingLabel}>Unidad de peso</span>
            <div style={styles.inlineControls}>
              <button type="button" onClick={() => updateSetting('unitSystem', 'kg')} style={uiSettings.unitSystem === 'kg' ? styles.pillActive : styles.pill}>kg</button>
              <button type="button" onClick={() => updateSetting('unitSystem', 'lb')} style={uiSettings.unitSystem === 'lb' ? styles.pillActive : styles.pill}>lb</button>
            </div>
          </div>

          <div style={styles.mobileSettingItemCol}>
            <span style={styles.settingLabel}>Descanso por defecto</span>
            <div style={styles.inlineControls}>
              {[60, 90, 120].map((secs) => (
                <button key={secs} type="button" onClick={() => updateSetting('defaultRestSeconds', secs)} style={uiSettings.defaultRestSeconds === secs ? styles.pillActive : styles.pill}>{secs}s</button>
              ))}
              <span style={styles.smallMuted}>{restLabel}</span>
            </div>
          </div>

          <div style={styles.mobileSettingItemCol}>
            <span style={styles.settingLabel}>Series en Analytics</span>
            <div style={styles.analyticsSeriesGrid}>
              <button type="button" onClick={() => updateSetting('showWeightSeries', !uiSettings.showWeightSeries)} style={uiSettings.showWeightSeries ? styles.pillActive : styles.pill}>Peso</button>
              <button type="button" onClick={() => updateSetting('showRepsSeries', !uiSettings.showRepsSeries)} style={uiSettings.showRepsSeries ? styles.pillActive : styles.pill}>Reps</button>
              <button type="button" onClick={() => updateSetting('showFeelingSeries', !uiSettings.showFeelingSeries)} style={uiSettings.showFeelingSeries ? styles.pillActive : styles.pill}>Feeling</button>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button onClick={handleLogout} style={styles.mobileLogout}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
          Cerrar Sesión
        </button>
      </main>

      <BottomNav activeItem="settings" onNavigate={onNavigate} />
    </div>
  )

  return (
    <div className="settings-container">
      {isDesktop ? DesktopView() : MobileView()}
    </div>
  )
}

const styles = {
  // Shared
  title: { fontSize: '3rem', fontFamily: typography.fontFamily.heading, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '0.5rem' },
  subtitle: { color: colors.onSurfaceVariant, fontSize: '1rem', marginBottom: '2rem' },
  sectionTitle: { fontSize: '0.875rem', fontFamily: typography.fontFamily.heading, fontWeight: 700, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' },
  profileCard: { display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: colors.surfaceContainerLow, borderRadius: borderRadius.lg, padding: '1.5rem', marginBottom: '2rem' },
  profileAvatar: { width: '64px', height: '64px', borderRadius: '50%', overflow: 'hidden' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: '1.25rem', fontFamily: typography.fontFamily.heading, fontWeight: 700, display: 'block' },
  profileEmail: { fontSize: '0.875rem', color: colors.onSurfaceVariant, display: 'block' },
  profileInput: { width: '100%', backgroundColor: colors.surfaceContainerLow, border: `1px solid ${colors.surfaceContainerHighest}`, borderRadius: borderRadius.md, padding: '0.75rem 1rem', color: colors.onSurface, fontFamily: typography.fontFamily.body, fontSize: '0.95rem', outline: 'none', marginBottom: '0.5rem' },
  errorBox: { backgroundColor: colors.errorContainer, color: colors.onErrorContainer, padding: '0.75rem 1rem', borderRadius: borderRadius.md, marginBottom: '1rem', fontSize: '0.875rem' },
  infoBox: { backgroundColor: colors.surfaceContainerHigh, color: colors.onSurfaceVariant, padding: '0.6rem 0.8rem', borderRadius: borderRadius.md, marginBottom: '1rem', fontSize: '0.8rem', border: `1px solid ${colors.surfaceContainerHighest}` },
  editButton: { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: colors.surfaceContainerHigh, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  editActions: { display: 'flex', alignItems: 'center', gap: '0.45rem' },
  editButtonSecondary: { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: colors.surfaceContainer, border: `1px solid ${colors.surfaceContainerHighest}`, color: colors.onSurfaceVariant, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  settingsSection: { marginBottom: '2rem' },
  settingItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: colors.surfaceContainerLow, borderRadius: borderRadius.md, marginBottom: '0.75rem' },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: '1rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' },
  settingDesc: { fontSize: '0.75rem', color: colors.onSurfaceVariant, display: 'block' },
  inlineControls: { display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' },
  analyticsSeriesGrid: { display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', justifyContent: 'flex-end' },
  pill: { border: 'none', borderRadius: borderRadius.full, backgroundColor: colors.surfaceContainerHigh, color: colors.onSurfaceVariant, padding: '0.34rem 0.64rem', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' },
  pillActive: { border: 'none', borderRadius: borderRadius.full, backgroundColor: colors.primary, color: colors.onPrimaryFixed, padding: '0.34rem 0.64rem', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' },
  smallMuted: { fontSize: '0.68rem', color: colors.onSurfaceVariant, fontWeight: 600 },
  avatarChooser: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', marginTop: '0.3rem' },
  avatarOption: { width: '42px', height: '42px', borderRadius: '50%', overflow: 'hidden', border: `2px solid ${colors.surfaceContainerHighest}`, background: 'none', padding: 0, cursor: 'pointer' },
  avatarOptionActive: { width: '42px', height: '42px', borderRadius: '50%', overflow: 'hidden', border: `3px solid ${colors.primary}`, background: 'none', padding: 0, cursor: 'pointer' },
  avatarOptionImg: { width: '100%', height: '100%', objectFit: 'cover' },
  toggle: { width: '48px', height: '28px', borderRadius: '14px', backgroundColor: colors.surfaceContainerHigh, border: 'none', cursor: 'pointer', position: 'relative', padding: '2px' },
  toggleActive: { width: '48px', height: '28px', borderRadius: '14px', backgroundColor: colors.primary, border: 'none', cursor: 'pointer', position: 'relative', padding: '2px' },
  toggleKnob: { width: '24px', height: '24px', borderRadius: '50%', backgroundColor: colors.onSurfaceVariant, transition: 'transform 0.2s', transform: 'translateX(0)' },
  toggleKnobActive: { width: '24px', height: '24px', borderRadius: '50%', backgroundColor: colors.onPrimaryFixed, transition: 'transform 0.2s', transform: 'translateX(20px)' },
  logoutButton: { display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '1rem', backgroundColor: colors.errorContainer, border: 'none', borderRadius: borderRadius.md, color: colors.onErrorContainer, fontSize: '1rem', fontWeight: 600, cursor: 'pointer' },
  appInfo: { textAlign: 'center', paddingTop: '2rem' },
  appVersion: { fontSize: '0.75rem', color: colors.onSurfaceVariant },

  // Desktop
  desktopMain: { marginLeft: '280px', flex: 1, minHeight: '100vh', display: 'flex', justifyContent: 'center', padding: '2rem' },
  desktopContent: { maxWidth: '600px', width: '100%' },

  // Mobile
  mobileHeader: { position: 'fixed', top: 0, left: 0, right: 0, height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem', backgroundColor: colors.background, borderBottom: `1px solid ${colors.surfaceContainerHighest}`, zIndex: 50 },
  backButton: { width: '40px', height: '40px', borderRadius: '50%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.onSurface },
  mobileTitle: { fontFamily: typography.fontFamily.heading, fontWeight: 700, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: colors.onSurface },
  mobileMain: { padding: '80px 1rem 100px' },
  mobileProfile: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', backgroundColor: colors.surfaceContainerLow, borderRadius: borderRadius.lg, marginBottom: '1.5rem', flexWrap: 'wrap' },
  mobileAvatar: { width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden' },
  mobileProfileName: { fontSize: '1.125rem', fontWeight: 700, display: 'block' },
  mobileProfileEmail: { fontSize: '0.75rem', color: colors.onSurfaceVariant, display: 'block' },
  mobileSettings: { marginBottom: '1.5rem' },
  mobileSettingItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: colors.surfaceContainerLow, borderRadius: borderRadius.md, marginBottom: '0.5rem' },
  mobileSettingItemCol: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.55rem', padding: '1rem', backgroundColor: colors.surfaceContainerLow, borderRadius: borderRadius.md, marginBottom: '0.5rem' },
  mobileLogout: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', width: '100%', padding: '1rem', backgroundColor: colors.errorContainer, border: 'none', borderRadius: borderRadius.md, color: colors.onErrorContainer, fontSize: '1rem', fontWeight: 600, cursor: 'pointer' },
}

export default Settings
