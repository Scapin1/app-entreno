import React from 'react'
import { colors, typography, borderRadius } from '../../styles/tokens'
import PhaseCard from './PhaseCard'

const PhaseManager = ({ blocks, onChange }) => {
  const handlePhaseChange = (index, updatedPhase) => {
    const updated = [...blocks]
    updated[index] = updatedPhase
    onChange(updated)
  }

  const handleAddPhase = () => {
    onChange([
      ...blocks,
      {
        name: `Fase ${blocks.length + 1}`,
        exercises: [],
      },
    ])
  }

  return (
    <div>
      <div style={styles.list}>
        {blocks.map((phase, idx) => (
          <PhaseCard
            key={idx}
            phase={phase}
            onChange={(updated) => handlePhaseChange(idx, updated)}
            onDelete={() => onChange(blocks.filter((_, i) => i !== idx))}
            isOnly={blocks.length <= 1}
          />
        ))}
      </div>
      <button type="button" onClick={handleAddPhase} style={styles.addButton}>
        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
        Agregar fase
      </button>
    </div>
  )
}

const styles = {
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginBottom: '0.75rem',
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.3rem',
    width: '100%',
    border: `1px dashed ${colors.outlineVariant}`,
    borderRadius: borderRadius.md,
    backgroundColor: 'transparent',
    color: colors.onSurfaceVariant,
    padding: '0.6rem',
    fontSize: '0.78rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
}

export default PhaseManager
