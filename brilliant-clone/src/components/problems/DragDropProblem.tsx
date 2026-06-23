import { useState } from 'react'
import type { DragDropInteraction } from '../../types/content'
import { RichText } from '../common/RichText'
import './ProblemTypes.css'

type Props = {
  data: DragDropInteraction
  placement: Record<string, string>
  onChange: (placement: Record<string, string>) => void
  disabled?: boolean
}

export function DragDropProblem({ data, placement, onChange, disabled }: Props) {
  const [dragging, setDragging] = useState<string | null>(null)

  const usedIds = new Set(Object.values(placement))
  const available = data.draggables.filter((d) => !usedIds.has(d.id))

  const handleDrop = (zoneId: string, draggableId: string) => {
    const next = { ...placement, [zoneId]: draggableId }
    onChange(next)
    setDragging(null)
  }

  const clearZone = (zoneId: string) => {
    const next = { ...placement }
    delete next[zoneId]
    onChange(next)
  }

  return (
    <div className="drag-drop">
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
      <div className="drag-drop__zones">
        {data.dropZones.map((zone) => {
          const placedId = placement[zone.id]
          const placed = data.draggables.find((d) => d.id === placedId)
          return (
            <div
              key={zone.id}
              className="drop-zone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                if (dragging) handleDrop(zone.id, dragging)
              }}
              onClick={() => {
                if (dragging) handleDrop(zone.id, dragging)
              }}
            >
              {zone.label && <span className="drop-zone__label">{zone.label}</span>}
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
                <span className="drop-zone__placeholder">Drop here</span>
              )}
            </div>
          )
        })}
      </div>
      {dragging && (
        <p className="drag-hint">Tap a drop zone to place the selected tile.</p>
      )}
    </div>
  )
}
