import type { MultipleChoiceInteraction } from '../../types/content'
import { RichText } from '../common/RichText'
import './ProblemTypes.css'

type Props = {
  data: MultipleChoiceInteraction
  selectedId: string
  onChange: (id: string) => void
  disabled?: boolean
}

export function MultipleChoiceProblem({ data, selectedId, onChange, disabled }: Props) {
  return (
    <div className="problem-options" role="radiogroup">
      {data.options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          role="radio"
          aria-checked={selectedId === opt.id}
          className={`problem-option ${selectedId === opt.id ? 'problem-option--selected' : ''}`}
          onClick={() => onChange(opt.id)}
          disabled={disabled}
        >
          <RichText text={opt.label} />
        </button>
      ))}
    </div>
  )
}
