import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { colors, typography, spacing, borderRadius, shadows } from '../../styles/tokens'
import { PrimaryButton, Card } from '../../components/ui'
import { authAPI } from '../../utils/api'

const LoginScreen = () => {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('login')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await authAPI.login(email, password)
      const token = response?.access_token || response?.token
      const user = response?.user || { id: response?.user_id || 1, email, name: email.split('@')[0] }
      if (!token) throw new Error('No se recibió token del backend')
      login(user, token)
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setLoading(true)
    try {
      const response = await authAPI.register(email, password)
      const token = response?.access_token || response?.token
      const user = response?.user || { id: response?.user_id || 1, email, name: email.split('@')[0] }
      if (!token) throw new Error('No se recibió token del backend')
      login(user, token)
    } catch (err) {
      setError(err.message || 'Error al registrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      {/* Background Effects */}
      <div style={styles.bgEffects}>
        <div style={styles.orb} />
      </div>

      {/* Desktop Branding - Left Side */}
      <div className="branding-section" style={styles.branding}>
        {/* Logo */}
        <div style={styles.logoRow}>
          <span className="material-symbols-outlined" style={styles.logoIcon}>fitness_center</span>
          <span style={styles.logoText}>GYMTRACKER</span>
        </div>

        {/* Hero */}
        <div style={styles.hero}>
          <h1 style={styles.heroTitle}>
            Fuerte. <br />
            <span style={styles.heroSubtitle}>Siempre.</span>
          </h1>
          <p style={styles.heroDesc}>
            Tu entrenamiento, tu evolución. Registrá tus sesiones, seguí tu progreso y alcanzá tus metas.
          </p>
        </div>

        {/* Ambient Glow */}
        <div style={styles.ambientGlow} />
      </div>

      {/* Right Side - Form */}
      <div className="form-section" style={styles.formSection}>
        {/* Glass Card */}
        <div style={styles.glassCard}>
          {/* Neon Top Accent */}
          <div style={styles.neonAccent} />

          {/* Tab Navigation */}
          <div style={styles.tabs}>
            <button onClick={() => setMode('login')} style={mode === 'login' ? styles.tabActive : styles.tab}>
              Sign In
            </button>
            <button onClick={() => setMode('register')} style={mode === 'register' ? styles.tabActive : styles.tab}>
              Register
            </button>
          </div>

          {/* Title */}
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>{mode === 'login' ? 'Welcome Back.' : 'Create Account.'}</h2>
            <p style={styles.formSubtitle}>
              {mode === 'login' ? 'Enter your credentials to access your terminal.' : 'Start your journey to peak performance.'}
            </p>
          </div>

          {/* Error */}
          {error && <div style={styles.error}>{error}</div>}

          {/* Form */}
          <form onSubmit={mode === 'login' ? handleSubmit : handleRegister}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <div style={styles.inputWrapper}>
                <span className="material-symbols-outlined" style={styles.inputIcon}>mail</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="athlete@domain.com" required style={styles.input} />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <div style={styles.labelRow}>
                <label style={styles.label}>Password</label>
                <button type="button" style={styles.forgotButton}>Forgot?</button>
              </div>
              <div style={styles.inputWrapper}>
                <span className="material-symbols-outlined" style={styles.inputIcon}>lock</span>
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required style={styles.input} />
                <button type="button" onClick={() => setShowPassword(prev => !prev)} style={styles.eyeButton}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{showPassword ? 'visibility' : 'visibility_off'}</span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <PrimaryButton type="submit" disabled={loading} style={styles.submitBtn}>
              {loading ? 'Loading...' : mode === 'login' ? 'Get Started' : 'Create Account'}
              <span className="material-symbols-outlined">arrow_forward</span>
            </PrimaryButton>
          </form>
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .branding-section { display: flex !important; }
          .form-section { width: 58.333333% !important; }
        }
        @media (max-width: 1023px) {
          .branding-section { display: none !important; }
          .form-section { width: 100% !important; justify-content: center !important; padding: 1.5rem !important; }
        }
      `}</style>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: colors.background,
    color: colors.onSurface,
    fontFamily: typography.fontFamily.body,
    display: 'flex',
    position: 'relative',
    overflow: 'hidden',
  },
  bgEffects: {
    position: 'absolute',
    inset: 0,
    zIndex: 0,
    pointerEvents: 'none',
  },
  orb: {
    position: 'absolute',
    top: '-10%',
    right: '-10%',
    width: '50%',
    aspectRatio: '1',
    borderRadius: '50%',
    backgroundColor: `${colors.primary}10`,
    blur: '120px',
  },
  branding: {
    display: 'none',
    width: '41.666%',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '3rem 5rem',
    borderRight: `1px solid ${colors.outlineVariant}10`,
    backgroundColor: `${colors.background}50`,
    backdropFilter: 'blur(10px)',
    position: 'relative',
  },
  logoRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  logoIcon: { fontSize: '36px', color: colors.primary },
  logoText: { fontSize: '24px', fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.05em', color: colors.primary, fontFamily: typography.fontFamily.heading, textTransform: 'uppercase' },
  hero: {},
  heroTitle: { fontSize: '5.5rem', lineHeight: 0.85, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.05em', fontFamily: typography.fontFamily.heading, color: colors.onSurface },
  heroSubtitle: { color: colors.surfaceContainerHighest },
  heroDesc: { marginTop: '2rem', color: colors.onSurfaceVariant, fontSize: '1.125rem', maxWidth: '300px', lineHeight: 1.6 },
  ambientGlow: { position: 'absolute', bottom: 0, left: 0, width: '384px', height: '384px', borderRadius: '50%', backgroundColor: `${colors.primary}05`, blur: '120px', pointerEvents: 'none' },
  formSection: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', position: 'relative' },
  glassCard: { width: '100%', maxWidth: '28rem', backgroundColor: `${colors.surfaceContainerLow}cc`, backdropFilter: 'blur(20px)', borderRadius: '2rem', padding: '2rem', boxShadow: `0 0 80px rgba(246,255,192,0.04)`, position: 'relative', overflow: 'hidden' },
  neonAccent: { position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryContainer})`, opacity: 0.5 },
  tabs: { display: 'flex', gap: '2rem', marginBottom: '2.5rem', borderBottom: `1px solid ${colors.surfaceContainerHighest}` },
  tab: { paddingBottom: '12px', fontFamily: typography.fontFamily.heading, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.875rem', transition: 'color 0.2s', background: 'none', border: 'none', cursor: 'pointer', color: colors.onSurfaceVariant },
  tabActive: { paddingBottom: '12px', fontFamily: typography.fontFamily.heading, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.875rem', transition: 'color 0.2s', background: 'none', border: 'none', cursor: 'pointer', color: colors.primary, borderBottom: `2px solid ${colors.primary}` },
  formHeader: { marginBottom: '2rem' },
  formTitle: { fontSize: '1.875rem', fontFamily: typography.fontFamily.heading, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.5rem' },
  formSubtitle: { fontSize: '0.875rem', color: colors.onSurfaceVariant },
  error: { backgroundColor: colors.errorContainer, color: colors.onErrorContainer, padding: '0.75rem 1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', fontSize: '0.875rem', fontWeight: 500 },
  inputGroup: { marginBottom: '1.5rem' },
  label: { display: 'block', fontSize: '0.75rem', fontFamily: typography.fontFamily.heading, fontWeight: 700, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', paddingLeft: '4px' },
  labelRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', paddingLeft: '4px' },
  forgotButton: { fontSize: '0.75rem', fontFamily: typography.fontFamily.body, fontWeight: 500, color: colors.primary, background: 'none', border: 'none', cursor: 'pointer' },
  inputWrapper: { position: 'relative' },
  inputIcon: { position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: `${colors.onSurfaceVariant}50`, fontSize: '20px' },
  input: { width: '100%', backgroundColor: colors.surfaceContainerLowest, border: `1px solid ${colors.outlineVariant}20`, borderRadius: '0.75rem', padding: '1rem 1rem 1rem 3rem', color: colors.onSurface, fontFamily: typography.fontFamily.body, fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' },
  eyeButton: { position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: colors.onSurfaceVariant },
  submitBtn: { width: '100%', marginTop: '0.5rem' },
}

export default LoginScreen
