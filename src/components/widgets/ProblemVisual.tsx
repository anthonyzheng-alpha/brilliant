import type { Problem, AnswerValue } from '../../types/content'
import { parseNumericInput } from '../../lib/validation'
import { BalanceScale } from './BalanceScale'
import { CoordinateGraph, type GraphPoint } from './CoordinateGraph'
import { SequenceGrid } from './SequenceGrid'
import { FactoringExpression } from './FactoringExpression'

type Props = {
  problem: Problem
  answer?: AnswerValue | null
}

function parseGraphPoints(raw: unknown): GraphPoint[] | undefined {
  if (!Array.isArray(raw)) return undefined
  const points = raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const { x, y } = item as { x?: unknown; y?: unknown }
      if (typeof x !== 'number' || typeof y !== 'number') return null
      return { x, y }
    })
    .filter((point): point is GraphPoint => point !== null)
  return points.length > 0 ? points : undefined
}

export function ProblemVisual({ problem, answer }: Props) {
  if (!problem.visual || problem.visual.kind === 'none') return null

  const props = problem.visual.props as Record<string, number | number[] | string[] | unknown>

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
    case 'coordinate-graph': {
      let previewSlope: number | undefined
      let previewIntercept: number | undefined
      if (answer?.type === 'line-equation') {
        const m = parseNumericInput(answer.slope)
        const b = parseNumericInput(answer.intercept)
        if (m !== null) previewSlope = m
        if (b !== null) previewIntercept = b
        else if (m !== null) previewIntercept = 0
      }

      return (
        <CoordinateGraph
          slope={props.slope !== undefined ? Number(props.slope) : undefined}
          intercept={props.intercept !== undefined ? Number(props.intercept) : undefined}
          points={parseGraphPoints(props.points)}
          previewSlope={previewSlope}
          previewIntercept={previewIntercept}
          xMin={props.xMin !== undefined ? Number(props.xMin) : undefined}
          xMax={props.xMax !== undefined ? Number(props.xMax) : undefined}
          yMin={props.yMin !== undefined ? Number(props.yMin) : undefined}
          yMax={props.yMax !== undefined ? Number(props.yMax) : undefined}
        />
      )
    }
    case 'rate-comparison':
      return (
        <div className="scenario-card" aria-hidden>
          Compare the unit rates to find the better deal.
        </div>
      )
    case 'scenario-illustration':
      return <div className="scenario-card">Real-world scenario</div>
    case 'factoring-expression': {
      const expression = String(props.expression ?? '')
      return <FactoringExpression expression={expression} />
    }
    default:
      return null
  }
}
