import type { SliderInteraction } from '../../types/content'
import './ProblemTypes.css'

type Props = {
  data: SliderInteraction
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}

export function SliderProblem({ data, value, onChange, disabled }: Props) {
  return (
    <div className="slider-problem">
      {data.label && <label className="slider-label">{data.label}</label>}
      <input
        type="range"
        min={data.min}
        max={data.max}
        step={data.step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        aria-valuenow={value}
      />
      <span className="slider-value">{value}</span>
    </div>
  )
}
