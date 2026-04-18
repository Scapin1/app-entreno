import React from 'react'
import { colors, borderRadius, typography } from '../../styles/tokens'

// Input numérico para peso o reps - versión desktop más compacta
export const NumberInput = ({ value, onChange, label, placeholder }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
    {label && (
      <label style={{
        fontSize: '0.625rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color: colors.onSurfaceVariant,
        textAlign: 'left',
      }}>
        {label}
      </label>
    )}
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <input
        type="number"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        style={{
          backgroundColor: colors.surfaceContainerHigh,
          border: `1px solid ${colors.surfaceContainerHighest}`,
          borderRadius: borderRadius.md,
          padding: '0.75rem 1rem',
          paddingRight: label?.includes('Weight') ? '2.5rem' : '1rem',
          fontSize: '1.25rem',
          fontWeight: 700,
          color: colors.onSurface,
          textAlign: 'left',
          fontFamily: typography.fontFamily.heading,
          width: '100%',
          outline: 'none',
          appearance: 'none',
        }}
      />
      {label?.includes('Weight') && (
        <span style={{
          position: 'absolute',
          right: '0.75rem',
          fontSize: '0.75rem',
          color: colors.onSurfaceVariant,
          fontWeight: 600,
          pointerEvents: 'none',
        }}>kg</span>
      )}
    </div>
    <style>{`
      input[type="number"]::-webkit-outer-spin-button,
      input[type="number"]::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      input[type="number"] {
        -moz-appearance: textfield;
      }
    `}</style>
  </div>
)

// Input para mobile (más compacto)
export const NumberInputCompact = ({ value, onChange, label, placeholder }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
    {label && (
      <label style={{
        fontSize: '0.625rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color: colors.onSurfaceVariant,
        textAlign: 'center',
      }}>
        {label}
      </label>
    )}
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <input
        type="number"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        style={{
          backgroundColor: colors.surface,
          border: `1px solid ${colors.outlineVariant}33`,
          borderRadius: borderRadius.lg,
          padding: '0.75rem',
          paddingRight: label?.toLowerCase() === 'kg' ? '2rem' : '0.75rem',
          fontSize: '1.5rem',
          fontWeight: 700,
          color: colors.onSurface,
          textAlign: 'center',
          fontFamily: typography.fontFamily.heading,
          width: '100%',
          outline: 'none',
          appearance: 'none',
        }}
      />
      {label?.toLowerCase() === 'kg' && (
        <span style={{
          position: 'absolute',
          right: '0.75rem',
          fontSize: '0.75rem',
          color: colors.onSurfaceVariant,
          fontWeight: 600,
          pointerEvents: 'none',
        }}>kg</span>
      )}
    </div>
  </div>
)

export default NumberInput