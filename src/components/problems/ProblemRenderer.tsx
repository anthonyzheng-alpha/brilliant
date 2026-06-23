import { useMemo } from 'react'
import type { Problem, AnswerValue } from '../../types/content'
import { MultipleChoiceProblem } from './MultipleChoiceProblem'
import { DragDropProblem } from './DragDropProblem'
import { NumericProblem } from './NumericProblem'
import { SliderProblem } from './SliderProblem'
import { TapSequenceProblem } from './TapSequenceProblem'
import { LineEquationProblem } from './LineEquationProblem'

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
    default:
      return null
  }
}

type Props = {
  problem: Problem
  answer: AnswerValue | null
  onAnswerChange: (answer: AnswerValue) => void
  disabled?: boolean
}

export function ProblemRenderer({ problem, answer, onAnswerChange, disabled }: Props) {
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
            disabled={disabled}
          />
        )
      default:
        return null
    }
  }, [problem, answer, disabled, onAnswerChange])

  return <div className="problem-renderer">{body}</div>
}

export { initialAnswer }
