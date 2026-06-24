import type { KeyboardEvent } from 'react'
import type { LineEquationInteraction } from '../../types/content'
import './ProblemTypes.css'

type Props = {
  data: LineEquationInteraction
  slope: string
  intercept: string
  onChange: (slope: string, intercept: string) => void
  onSubmit?: () => void
  disabled?: boolean
}

export function LineEquationProblem({ data, slope, intercept, onChange, onSubmit, disabled }: Props) {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onSubmit?.()
    }
  }

  return (
    <div className="line-equation" aria-label="Enter slope and y-intercept">
      <span className="line-equation__label">y =</span>
      <input
        type="text"
        inputMode="decimal"
        className="line-equation__input"
        placeholder={data.slopePlaceholder ?? 'm'}
        value={slope}
        onChange={(e) => onChange(e.target.value, intercept)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-label="Slope m"
      />
      <span className="line-equation__label">x +</span>
      <input
        type="text"
        inputMode="decimal"
        className="line-equation__input"
        placeholder={data.interceptPlaceholder ?? 'b'}
        value={intercept}
        onChange={(e) => onChange(slope, e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-label="Y-intercept b"
      />
    </div>
  )
}
