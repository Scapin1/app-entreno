import React from 'react'
import { colors, borderRadius, typography, shadows } from '../../styles/tokens'

// Primary Button con gradiente néon
export const PrimaryButton = ({ children, onClick, disabled, style, ...props }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      ...styles.base,
      ...(disabled ? styles.disabled : styles.gradient),
      ...style,
    }}
    {...props}
  >
    {children}
  </button>
)

// Icon Button circular
export const IconButton = ({ icon, onClick, size = 40, style, ...props }) => (
  <button
    onClick={onClick}
    style={{
      ...styles.iconBase,
      width: size,
      height: size,
      ...style,
    }}
    {...props}
  >
    <span className="material-symbols-outlined" style={{ fontSize: size * 0.5 }}>
      {icon}
    </span>
  </button>
)

// Card container con tonal depth
export const Card = ({ children, variant = 'default', style, ...props }) => (
  <div
    style={{
      ...styles.card,
      ...(variant === 'elevated' ? styles.cardElevated : {}),
      ...(variant === 'outlined' ? styles.cardOutlined : {}),
      ...style,
    }}
    {...props}
  >
    {children}
  </div>
)

// Chip / Tag
export const Chip = ({ label, variant = 'default', style, ...props }) => (
  <span
    style={{
      ...styles.chip,
      ...(variant === 'primary' ? styles.chipPrimary : {}),
      ...(variant === 'secondary' ? styles.chipSecondary : {}),
      ...style,
    }}
    {...props}
  >
    {label}
  </span>
)

// Badge
export const Badge = ({ label, variant = 'primary', style, ...props }) => (
  <span
    style={{
      ...styles.badge,
      ...(variant === 'secondary' ? styles.badgeSecondary : {}),
      ...style,
    }}
    {...props}
  >
    {label}
  </span>
)

// Avatar
export const Avatar = ({ src, alt, size = 40, style, ...props }) => (
  <div
    style={{
      ...styles.avatar,
      width: size,
      height: size,
      ...style,
    }}
    {...props}
  >
    {src ? (
      <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
    ) : (
      <span className="material-symbols-outlined" style={{ fontSize: size * 0.5 }}>person</span>
    )}
  </div>
)

// Styles
const styles = {
  base: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '1.25rem 1.5rem',
    borderRadius: borderRadius.md,
    border: 'none',
    cursor: 'pointer',
    fontFamily: typography.fontFamily.heading,
    fontWeight: typography.fontWeight.black,
    fontSize: typography.fontSize.small,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    position: 'relative',
    overflow: 'hidden',
  },
  gradient: {
    background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryContainer})`,
    color: colors.onPrimaryFixed,
    boxShadow: shadows.glow,
  },
  disabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  iconBase: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    backgroundColor: colors.surfaceContainerLow,
    border: 'none',
    cursor: 'pointer',
    color: colors.onSurfaceVariant,
  },
  card: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.xl,
    padding: '1.5rem',
  },
  cardElevated: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  cardOutlined: {
    border: `1px solid ${colors.outlineVariant}`,
  },
  chip: {
    display: 'inline-flex',
    padding: '0.375rem 0.75rem',
    borderRadius: borderRadius.full,
    fontSize: typography.fontSize.tiny,
    fontFamily: typography.fontFamily.body,
    fontWeight: typography.fontWeight.medium,
    textTransform: 'uppercase',
    backgroundColor: colors.surfaceContainerHigh,
    color: colors.onSurfaceVariant,
  },
  chipPrimary: {
    backgroundColor: colors.primary,
    color: colors.onPrimaryFixed,
  },
  chipSecondary: {
    backgroundColor: colors.secondary,
    color: colors.onSecondary,
  },
  badge: {
    display: 'inline-flex',
    padding: '0.25rem 0.5rem',
    borderRadius: borderRadius.full,
    fontSize: typography.fontSize.tiny,
    fontFamily: typography.fontFamily.heading,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
    backgroundColor: colors.tertiary,
    color: colors.onTertiary,
  },
  badgeSecondary: {
    backgroundColor: colors.secondary,
    color: colors.onSecondary,
  },
  avatar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    overflow: 'hidden',
    border: `2px solid ${colors.surfaceContainerHighest}`,
    backgroundColor: colors.surfaceContainerLow,
  },
}

export default {
  PrimaryButton,
  IconButton,
  Card,
  Chip,
  Badge,
  Avatar,
}