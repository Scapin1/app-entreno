import React from 'react'
import { colors, typography, spacing, borderRadius, shadows } from '../../styles/tokens'

export const Sidebar = ({ profile, activeItem, onNavigate }) => {
  const navItems = [
    { id: 'days', icon: 'calendar_month', label: 'Días de Entreno' },
    { id: 'analytics', icon: 'dashboard', label: 'Dashboard' },
    { id: 'settings', icon: 'settings', label: 'Settings' },
  ]

  return (
    <aside style={styles.sidebar}>
      {/* Logo */}
      <div style={styles.logoRow}>
        <span className="material-symbols-outlined" style={styles.logoIcon}>fitness_center</span>
        <span style={styles.logoText}>GYMTRACKER</span>
      </div>

      {/* User Profile */}
      <div style={styles.userCard}>
        <div style={styles.avatar}>
          <img 
            src={profile?.image || 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=80&h=80&fit=crop&crop=face'} 
            alt="Profile"
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
          />
        </div>
        <div>
          <span style={styles.userName}>{profile?.name || 'Atleta'}</span>
          <span style={styles.userSubtitle}>Semana 1</span>
        </div>
      </div>

      {/* Navigation */}
      <nav style={styles.nav}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate?.(item.id)}
            style={activeItem === item.id ? styles.navItemActive : styles.navItem}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}

export const BottomNav = ({ activeItem, onNavigate }) => {
  const navItems = [
    { id: 'analytics', icon: 'dashboard', label: 'Dashboard' },
    { id: 'days', icon: 'calendar_month', label: 'Entreno' },
    { id: 'settings', icon: 'settings', label: 'Settings' },
  ]

  return (
    <nav style={styles.bottomNav}>
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onNavigate?.(item.id)}
          style={activeItem === item.id ? styles.bottomNavActive : styles.bottomNavItem}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '24px', marginBottom: '4px' }}>{item.icon}</span>
          <span style={activeItem === item.id ? styles.bottomNavLabelActive : styles.bottomNavLabel}>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}

const styles = {
  sidebar: { position: 'fixed', left: 0, top: 0, bottom: 0, width: '280px', backgroundColor: colors.background, padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', borderRight: `1px solid ${colors.surfaceContainerHighest}`, zIndex: 100 },
  logoRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' },
  logoIcon: { fontSize: '32px', color: colors.primary },
  logoText: { fontSize: '20px', fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.05em', color: colors.primary, fontFamily: typography.fontFamily.heading, textTransform: 'uppercase' },
  userCard: { display: 'flex', alignItems: 'center', gap: '12px', padding: '1rem', backgroundColor: colors.surfaceContainerLow, borderRadius: borderRadius.lg, marginBottom: '2rem' },
  avatar: { width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden' },
  userName: { fontSize: '0.875rem', fontWeight: 700, display: 'block' },
  userSubtitle: { fontSize: '0.75rem', color: colors.onSurfaceVariant },
  nav: { display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 },
  navItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '1rem', borderRadius: borderRadius.md, background: 'none', border: 'none', color: colors.onSurfaceVariant, fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left', fontFamily: typography.fontFamily.body },
  navItemActive: { display: 'flex', alignItems: 'center', gap: '12px', padding: '1rem', borderRadius: borderRadius.md, backgroundColor: colors.primary, border: 'none', color: colors.onPrimaryFixed, fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left', fontFamily: typography.fontFamily.body },
  bottomNav: { position: 'fixed', bottom: 0, left: 0, width: '100%', zIndex: 50, display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '1rem 1rem 1.5rem', backgroundColor: `${colors.surfaceContainerLow}ee`, backdropFilter: 'blur(24px)', borderTop: `8px solid ${colors.surfaceContainerLowest}`, borderRadius: '2rem 2rem 0 0' },
  bottomNavItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 16px', color: colors.onSurfaceVariant, background: 'none', border: 'none', cursor: 'pointer' },
  bottomNavActive: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, color: colors.onPrimaryFixed, borderRadius: '50%', padding: '16px 24px', border: 'none', cursor: 'pointer', boxShadow: shadows.glow },
  bottomNavLabel: { fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' },
  bottomNavLabelActive: { fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' },
}

export default { Sidebar, BottomNav }