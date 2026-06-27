import { useMemo } from 'react'
import type { TapSequenceInteraction } from '../../types/content'
import { RichText } from '../common/RichText'
import { shuffle } from '../../lib/shuffle'
import './ProblemTypes.css'

type Props = {
  data: TapSequenceInteraction
  selectedIds: string[]
  onChange: (ids: string[]) => void
  disabled?: boolean
}

export function TapSequenceProblem({ data, selectedIds, onChange, disabled }: Props) {
  const cells = useMemo(() => shuffle(data.cells), [data])

  const toggle = (id: string) => {
    if (data.multiSelect) {
      if (selectedIds.includes(id)) {
        onChange(selectedIds.filter((x) => x !== id))
      } else {
        onChange([...selectedIds, id])
      }
    } else {
      onChange([id])
    }
  }

  return (
    <div className="tap-grid" role="group">
      {cells.map((cell) => (
        <button
          key={cell.id}
          type="button"
          className={`tap-cell ${selectedIds.includes(cell.id) ? 'tap-cell--selected' : ''}`}
          onClick={() => toggle(cell.id)}
          disabled={disabled}
          aria-pressed={selectedIds.includes(cell.id)}
        >
          <RichText text={cell.label} />
        </button>
      ))}
    </div>
  )
}
