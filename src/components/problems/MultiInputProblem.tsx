import type { KeyboardEvent } from 'react'
import type { MultiInputInteraction } from '../../types/content'
import { RichText } from '../common/RichText'
import './ProblemTypes.css'

type Props = {
  data: MultiInputInteraction
  values: Record<string, string>
  onChange: (id: string, value: string) => void
  onSubmit?: () => void
  disabled?: boolean
}

export function MultiInputProblem({ data, values, onChange, onSubmit, disabled }: Props) {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onSubmit?.()
    }
  }

  return (
    <div className="multi-input">
      {data.fields.map((field) => (
        <div key={field.id} className="multi-input__row">
          {field.emoji && (
            <span className="multi-input__emoji" aria-hidden>
              {field.emoji}
            </span>
          )}
          <span className="multi-input__label">
            <RichText text={field.label} />
          </span>
          {field.unit && <span className="multi-input__unit">{field.unit}</span>}
          <input
            type="text"
            inputMode="decimal"
            className="multi-input__input"
            placeholder={field.placeholder ?? 'Your answer'}
            value={values[field.id] ?? ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            aria-label={`Answer for ${field.label}`}
          />
        </div>
      ))}
    </div>
  )
}
