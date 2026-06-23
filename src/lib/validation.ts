import type { AnswerValue, FactoringInteraction, Problem, ValidationRule } from '../types/content'

function parseNumeric(input: string): number | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const fraction = trimmed.match(/^(-?\d+)\s*\/\s*(-?\d+)$/)
  if (fraction) {
    const num = Number(fraction[1])
    const den = Number(fraction[2])
    if (den === 0) return null
    return num / den
  }
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : null
}

export function parseNumericInput(input: string): number | null {
  return parseNumeric(input)
}

function numericMatches(value: number, rule: Extract<ValidationRule, { type: 'numeric' }>): boolean {
  const tol = rule.tolerance ?? 0.001
  return Math.abs(value - rule.value) <= tol
}

function validateNumericString(input: string, rule: ValidationRule): boolean {
  const n = parseNumeric(input)
  if (n === null) return false
  if (rule.type === 'numeric') return numericMatches(n, rule)
  if (rule.type === 'numeric-set') {
    const tol = rule.tolerance ?? 0.001
    return rule.values.some((v) => Math.abs(n - v) <= tol)
  }
  if (rule.type === 'expression') {
    return rule.acceptable.some((a) => {
      const parsed = parseNumeric(a)
      return parsed !== null && Math.abs(parsed - n) < 0.001
    })
  }
  if (rule.type === 'exact') return input.trim() === rule.value
  return false
}

function factoringPlacementMatches(
  placement: Record<string, string>,
  correct: Record<string, string>,
  acceptCommutative?: boolean,
): boolean {
  const directMatch = Object.keys(correct).every(
    (zoneId) => placement[zoneId] === correct[zoneId],
  )
  if (directMatch) return true
  if (!acceptCommutative) return false

  const zoneIds = Object.keys(correct)
  if (zoneIds.length !== 2) return false
  const [left, right] = zoneIds
  return (
    placement[left] === correct[right] &&
    placement[right] === correct[left]
  )
}

function factoringZonesFilled(
  data: FactoringInteraction,
  placement: Record<string, string>,
): boolean {
  return data.dropZones.every((zone) => Boolean(placement[zone.id]))
}

export function isAnswerValid(problem: Problem, answer: AnswerValue): boolean {
  const { interaction } = problem

  switch (interaction.type) {
    case 'multiple-choice':
      return (
        answer.type === 'multiple-choice' &&
        answer.selectedId === interaction.data.correctOptionId
      )
    case 'drag-drop': {
      if (answer.type !== 'drag-drop') return false
      const correct = interaction.data.correctPlacement
      return Object.keys(correct).every(
        (zoneId) => answer.placement[zoneId] === correct[zoneId],
      )
    }
    case 'numeric':
      return (
        answer.type === 'numeric' &&
        validateNumericString(answer.value, interaction.data.validation)
      )
    case 'slider': {
      if (answer.type !== 'slider') return false
      const tol = interaction.data.tolerance ?? 0
      return Math.abs(answer.value - interaction.data.target) <= tol
    }
    case 'tap-sequence': {
      if (answer.type !== 'tap-sequence') return false
      const expected = [...interaction.data.correctCellIds].sort()
      const got = [...answer.selectedIds].sort()
      return expected.length === got.length && expected.every((id, i) => id === got[i])
    }
    case 'line-equation': {
      if (answer.type !== 'line-equation') return false
      const m = parseNumeric(answer.slope)
      const b = parseNumeric(answer.intercept)
      if (m === null || b === null) return false
      const tol = interaction.data.tolerance ?? 0.001
      return (
        Math.abs(m - interaction.data.targetSlope) <= tol &&
        Math.abs(b - interaction.data.targetIntercept) <= tol
      )
    }
    case 'factoring': {
      if (answer.type !== 'factoring') return false
      return factoringPlacementMatches(
        answer.placement,
        interaction.data.correctPlacement,
        interaction.data.acceptCommutative,
      )
    }
    default:
      return false
  }
}

export function hasValidInput(problem: Problem, answer: AnswerValue | null): boolean {
  if (!answer) return false
  switch (problem.type) {
    case 'multiple-choice':
      return answer.type === 'multiple-choice' && answer.selectedId !== ''
    case 'drag-drop':
      return (
        answer.type === 'drag-drop' &&
        Object.keys(answer.placement).length > 0
      )
    case 'numeric':
      return answer.type === 'numeric' && answer.value.trim() !== ''
    case 'slider':
      return answer.type === 'slider'
    case 'tap-sequence':
      return answer.type === 'tap-sequence' && answer.selectedIds.length > 0
    case 'line-equation':
      return (
        answer.type === 'line-equation' &&
        answer.slope.trim() !== '' &&
        answer.intercept.trim() !== ''
      )
    case 'factoring':
      return (
        answer.type === 'factoring' &&
        problem.interaction.type === 'factoring' &&
        factoringZonesFilled(problem.interaction.data, answer.placement)
      )
    default:
      return false
  }
}
