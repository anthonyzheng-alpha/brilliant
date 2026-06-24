import type { NumericInteraction } from '../../types/content'
import './ProblemTypes.css'

type Props = {
  data: NumericInteraction
  value: string
  onChange: (value: string) => void
  onSubmit?: () => void
  disabled?: boolean
}

export function NumericProblem({ data, value, onChange, onSubmit, disabled }: Props) {
  return (
    <div className="numeric-input-wrap">
      {data.unit && <span className="numeric-unit">{data.unit}</span>}
      <input
        type="text"
        inputMode="decimal"
        className="numeric-input"
        placeholder={data.placeholder ?? 'Your answer'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            onSubmit?.()
          }
        }}
        disabled={disabled}
        aria-label="Numeric answer"
      />
    </div>
  )
}
