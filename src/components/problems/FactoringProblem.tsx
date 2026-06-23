import { useState } from 'react'
import type { FactoringInteraction } from '../../types/content'
import { RichText } from '../common/RichText'
import './ProblemTypes.css'

type Props = {
  data: FactoringInteraction
  placement: Record<string, string>
  onChange: (placement: Record<string, string>) => void
  disabled?: boolean
}

export function FactoringProblem({ data, placement, onChange, disabled }: Props) {
  const [dragging, setDragging] = useState<string | null>(null)

  const usedIds = new Set(Object.values(placement))
  const available = data.draggables.filter((d) => !usedIds.has(d.id))

  const leftZone = data.dropZones[0]
  const rightZone = data.dropZones[1]

  const handleDrop = (zoneId: string, draggableId: string) => {
    onChange({ ...placement, [zoneId]: draggableId })
    setDragging(null)
  }

  const clearZone = (zoneId: string) => {
    const next = { ...placement }
    delete next[zoneId]
    onChange(next)
  }

  const renderZone = (zone: { id: string; label?: string } | undefined) => {
    if (!zone) return null
    const placedId = placement[zone.id]
    const placed = data.draggables.find((d) => d.id === placedId)

    return (
      <div
        className="factoring__slot"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          if (dragging) handleDrop(zone.id, dragging)
        }}
        onClick={() => {
          if (dragging) handleDrop(zone.id, dragging)
        }}
      >
        {placed ? (
          <button
            type="button"
            className="drag-tile drag-tile--placed"
            onClick={(e) => {
              e.stopPropagation()
              clearZone(zone.id)
            }}
            disabled={disabled}
          >
            <RichText text={placed.label} />
          </button>
        ) : (
          <span className="factoring__placeholder">?</span>
        )}
      </div>
    )
  }

  return (
    <div className="factoring" aria-label="Drag factors into both slots">
      <div className="factoring__product">
        {renderZone(leftZone)}
        <span className="factoring__times" aria-hidden>
          ×
        </span>
        {renderZone(rightZone)}
      </div>
      <div className="drag-drop__bank">
        {available.map((d) => (
          <button
            key={d.id}
            type="button"
            className={`drag-tile ${dragging === d.id ? 'drag-tile--active' : ''}`}
            draggable={!disabled}
            onDragStart={() => setDragging(d.id)}
            onDragEnd={() => setDragging(null)}
            onClick={() => setDragging(dragging === d.id ? null : d.id)}
            disabled={disabled}
          >
            <RichText text={d.label} />
          </button>
        ))}
      </div>
      {dragging && (
        <p className="drag-hint">Tap a factor slot to place the selected tile.</p>
      )}
    </div>
  )
}
