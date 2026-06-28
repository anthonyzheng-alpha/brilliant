import type { AnswerValue, Problem } from '../types/content'
import { parseNumericInput } from './validation'

// Parse a "y = mx + b" label (e.g. "$y = -2x + 1$", "$y = x$") into slope/intercept.
export function parseLineEquationLabel(
  label: string,
): { slope: number; intercept: number } | null {
  const s = label.replace(/\$/g, '').replace(/\s+/g, '')
  const match = s.match(/^y=(.+)$/i)
  if (!match) return null
  const rhs = match[1]
  const xMatch = rhs.match(/([+-]?\d*)x/)
  if (!xMatch) return null
  const slopeStr = xMatch[1]
  let slope: number
  if (slopeStr === '' || slopeStr === '+') slope = 1
  else if (slopeStr === '-') slope = -1
  else slope = Number(slopeStr)
  if (Number.isNaN(slope)) return null
  const rest = rhs.replace(xMatch[0], '')
  let intercept = 0
  if (rest) {
    const bMatch = rest.match(/^[+-]\d+(?:\.\d+)?$/)
    if (!bMatch) return null
    intercept = Number(rest)
  }
  return { slope, intercept }
}

// Determine the line a wrong answer represents, so it can be drawn in red on a graph.
export function resolveWrongLine(
  problem: Problem,
  answer: AnswerValue,
): { slope: number; intercept: number } | null {
  if (problem.visual?.kind !== 'coordinate-graph') return null

  if (problem.interaction.type === 'line-equation' && answer.type === 'line-equation') {
    const m = parseNumericInput(answer.slope)
    const b = parseNumericInput(answer.intercept)
    return m !== null && b !== null ? { slope: m, intercept: b } : null
  }

  if (problem.interaction.type === 'multiple-choice' && answer.type === 'multiple-choice') {
    const selected = problem.interaction.data.options.find(
      (opt) => opt.id === answer.selectedId,
    )
    return selected ? parseLineEquationLabel(selected.label) : null
  }

  return null
}

export function resolveWrongReason(problem: Problem, answer: AnswerValue): string {
  if (
    problem.interaction.type === 'multiple-choice' &&
    answer.type === 'multiple-choice'
  ) {
    const selected = problem.interaction.data.options.find(
      (opt) => opt.id === answer.selectedId,
    )
    if (selected?.whyWrong) return selected.whyWrong
  }
  if (problem.misconception) return problem.misconception
  return problem.hints[0]
}

export function resolveIncorrectFeedbackTitle(problem: Problem, answer: AnswerValue): string {
  if (
    problem.interaction.type === 'multiple-choice' &&
    answer.type === 'multiple-choice'
  ) {
    const selected = problem.interaction.data.options.find(
      (opt) => opt.id === answer.selectedId,
    )
    if (selected?.whyWrong) return 'Not quite'
  }
  return 'Possibly helpful information'
}
