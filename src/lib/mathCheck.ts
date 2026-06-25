import { evaluate } from 'mathjs'

// Safeguards for AI-generated problems: math.js independently evaluates a
// model-supplied arithmetic expression so we can reject problems whose stated
// answer does not actually follow from the math.

// math.js `evaluate` already disables `import`/`createUnit`; we also pass no
// scope, so only constant arithmetic can run.
export function evalNumber(expr: string): number | null {
  if (!expr || !expr.trim()) return null
  try {
    const value = evaluate(expr)
    return typeof value === 'number' && Number.isFinite(value) ? value : null
  } catch {
    return null
  }
}

// Combined relative + absolute tolerance so both small and large answers compare
// sensibly (e.g. 0.1 + 0.2 vs 0.3, or 12345 vs 12345.0001).
export function numbersClose(a: number, b: number): boolean {
  return Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(a), Math.abs(b))
}

// Pull the numeric value out of a (possibly LaTeX) multiple-choice label such as
// "$x = -3$", "x=-3", "-3", "1/2". Returns null for non-numeric answers like
// "Bag B" or "Same price".
export function parseNumericFromLabel(label: string): number | null {
  if (!label) return null
  let s = label
    .replace(/\$/g, '')
    .replace(/\\\(|\\\)|\\\[|\\\]/g, '')
    .replace(/\\,|\\;|\\!|\\ /g, ' ')
  // Convert a simple \frac{a}{b} into (a)/(b) so math.js can evaluate it.
  s = s.replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '($1)/($2)')
  s = s.replace(/\\[a-zA-Z]+/g, '') // drop any remaining LaTeX commands
  // If it's an equation like "x = -3", keep only the right-hand side.
  if (s.includes('=')) {
    s = s.slice(s.lastIndexOf('=') + 1)
  }
  s = s.trim()
  if (!s) return null
  return evalNumber(s)
}
