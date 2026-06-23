import type { Problem, AnswerValue } from '../../types/content'
import { BalanceScale } from './BalanceScale'
import { SequenceGrid } from './SequenceGrid'

type Props = {
  problem: Problem
  answer?: AnswerValue | null
}

export function ProblemVisual({ problem, answer }: Props) {
  if (!problem.visual || problem.visual.kind === 'none') return null

  const props = problem.visual.props as Record<string, number | number[] | string[]>

  switch (problem.visual.kind) {
    case 'balance-scale': {
      const leftWeight = Number(props.leftWeight ?? 0)
      const rightWeight = Number(props.rightWeight ?? 0)
      let addedRight = 0
      if (answer?.type === 'slider') {
        addedRight = answer.value - rightWeight
      }
      if (answer?.type === 'drag-drop' && answer.placement['right-pan']) {
        const dragId = answer.placement['right-pan']
        const drag = problem.interaction.type === 'drag-drop'
          ? problem.interaction.data.draggables.find((d) => d.id === dragId)
          : null
        if (drag) addedRight = Number(drag.label) || 0
      }
      return <BalanceScale leftWeight={leftWeight} rightWeight={rightWeight} addedRight={addedRight} />
    }
    case 'sequence-grid': {
      const terms = (props.terms as number[]) ?? []
      return <SequenceGrid terms={terms} />
    }
    case 'rate-comparison':
      return (
        <div className="scenario-card" aria-hidden>
          Compare the unit rates to find the better deal.
        </div>
      )
    case 'scenario-illustration':
      return <div className="scenario-card">Real-world scenario</div>
    default:
      return null
  }
}
