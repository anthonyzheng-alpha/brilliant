import { useMemo } from 'react'
import type { Problem, AnswerValue } from '../../types/content'
import { MultipleChoiceProblem } from './MultipleChoiceProblem'
import { DragDropProblem } from './DragDropProblem'
import { NumericProblem } from './NumericProblem'
import { SliderProblem } from './SliderProblem'
import { TapSequenceProblem } from './TapSequenceProblem'
import { LineEquationProblem } from './LineEquationProblem'
import { FactoringProblem } from './FactoringProblem'
import { MultiInputProblem } from './MultiInputProblem'

function initialAnswer(problem: Problem): AnswerValue | null {
  switch (problem.interaction.type) {
    case 'multiple-choice':
      return { type: 'multiple-choice', selectedId: '' }
    case 'drag-drop':
      return { type: 'drag-drop', placement: {} }
    case 'numeric':
      return { type: 'numeric', value: '' }
    case 'slider':
      return {
        type: 'slider',
        value: problem.interaction.data.min,
      }
    case 'tap-sequence':
      return { type: 'tap-sequence', selectedIds: [] }
    case 'line-equation':
      return { type: 'line-equation', slope: '', intercept: '' }
    case 'factoring':
      return { type: 'factoring', placement: {} }
    case 'multi-input':
      return { type: 'multi-input', values: {} }
    default:
      return null
  }
}

type Props = {
  problem: Problem
  answer: AnswerValue | null
  onAnswerChange: (answer: AnswerValue) => void
  onSubmit?: () => void
  disabled?: boolean
}

export function ProblemRenderer({ problem, answer, onAnswerChange, onSubmit, disabled }: Props) {
  const body = useMemo(() => {
    const { interaction } = problem
    switch (interaction.type) {
      case 'multiple-choice':
        return (
          <MultipleChoiceProblem
            data={interaction.data}
            selectedId={answer?.type === 'multiple-choice' ? answer.selectedId : ''}
            onChange={(id) => onAnswerChange({ type: 'multiple-choice', selectedId: id })}
            disabled={disabled}
          />
        )
      case 'drag-drop':
        return (
          <DragDropProblem
            data={interaction.data}
            placement={answer?.type === 'drag-drop' ? answer.placement : {}}
            onChange={(placement) => onAnswerChange({ type: 'drag-drop', placement })}
            disabled={disabled}
          />
        )
      case 'numeric':
        return (
          <NumericProblem
            data={interaction.data}
            value={answer?.type === 'numeric' ? answer.value : ''}
            onChange={(value) => onAnswerChange({ type: 'numeric', value })}
            onSubmit={onSubmit}
            disabled={disabled}
          />
        )
      case 'slider':
        return (
          <SliderProblem
            data={interaction.data}
            value={answer?.type === 'slider' ? answer.value : interaction.data.min}
            onChange={(value) => onAnswerChange({ type: 'slider', value })}
            disabled={disabled}
          />
        )
      case 'tap-sequence':
        return (
          <TapSequenceProblem
            data={interaction.data}
            selectedIds={answer?.type === 'tap-sequence' ? answer.selectedIds : []}
            onChange={(selectedIds) => onAnswerChange({ type: 'tap-sequence', selectedIds })}
            disabled={disabled}
          />
        )
      case 'line-equation':
        return (
          <LineEquationProblem
            data={interaction.data}
            slope={answer?.type === 'line-equation' ? answer.slope : ''}
            intercept={answer?.type === 'line-equation' ? answer.intercept : ''}
            onChange={(slope, intercept) =>
              onAnswerChange({ type: 'line-equation', slope, intercept })
            }
            onSubmit={onSubmit}
            disabled={disabled}
          />
        )
      case 'factoring':
        return (
          <FactoringProblem
            data={interaction.data}
            placement={answer?.type === 'factoring' ? answer.placement : {}}
            onChange={(placement) => onAnswerChange({ type: 'factoring', placement })}
            disabled={disabled}
          />
        )
      case 'multi-input': {
        const values = answer?.type === 'multi-input' ? answer.values : {}
        return (
          <MultiInputProblem
            data={interaction.data}
            values={values}
            onChange={(id, value) =>
              onAnswerChange({ type: 'multi-input', values: { ...values, [id]: value } })
            }
            onSubmit={onSubmit}
            disabled={disabled}
          />
        )
      }
      default:
        return null
    }
  }, [problem, answer, disabled, onAnswerChange, onSubmit])

  return <div className="problem-renderer">{body}</div>
}

export { initialAnswer }
