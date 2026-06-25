import { getAI, getGenerativeModel, GoogleAIBackend, Schema } from 'firebase/ai'
import type { GenerativeModel } from 'firebase/ai'
import type { Problem, ProblemType } from '../types/content'
import { getFirebaseApp } from './firebase'
import { problemSchema } from './schemas'
import { getLessonById, problemBank } from '../content'
import { evalNumber, numbersClose, parseNumericFromLabel } from './mathCheck'

// A review problem also remembers which lesson it is reinforcing so the UI can
// point the learner back to it ("Review: <lesson>") instead of showing hints.
// `reviewRoundId` records the specific difficulty band so re-attempts update the
// right round-skill in the struggle store.
export type GeneratedProblem = Problem & { reviewRef: string; reviewRoundId: string }

// We only generate the interaction types the renderer + validator handle most
// reliably from free-form model output.
export type GeneratableType = Extract<ProblemType, 'multiple-choice' | 'numeric'>

export const GENERATABLE_TYPES: GeneratableType[] = ['multiple-choice', 'numeric']

export type GenerateRequest = {
  lessonId: string
  topic: string
  problemType: GeneratableType
  recentMistakes?: string[]
  // Round-level difficulty targeting so generated problems match the exact band
  // the learner struggled with (e.g. negatives / larger numbers), not just the
  // lesson's easiest variant.
  roundId?: string
  difficultyLabel?: string
  difficultyNote?: string
  examples?: string[]
  // Normalized prompts of recently shown problems; the generator avoids
  // repeating or lightly rewording them so the learner never sees the same
  // problem back-to-back.
  avoidPrompts?: string[]
  // When false, skip AI generation entirely and serve authored problems. Lets
  // the user turn off AI presence (less diverse, recycles questions more).
  useAi?: boolean
}

// Collapse whitespace + lowercase so trivially-different prompts compare equal.
export function normalizePrompt(prompt: string): string {
  return prompt.replace(/\s+/g, ' ').trim().toLowerCase()
}

// Whether the AI backend can be used at all (requires a configured Firebase app).
export function isAiAvailable(): boolean {
  return Boolean(getFirebaseApp())
}

// Flat response shape we ask Gemini for, then transform into our Problem model.
const responseSchema = Schema.object({
  properties: {
    type: Schema.enumString({ enum: ['multiple-choice', 'numeric'] }),
    prompt: Schema.string({
      description: 'The question text. May contain LaTeX wrapped in single dollar signs.',
    }),
    options: Schema.array({
      description: 'Four answer choices. Required for multiple-choice, omit for numeric.',
      items: Schema.object({
        properties: {
          id: Schema.string({ description: 'Short id like a, b, c, d' }),
          label: Schema.string({ description: 'Choice text, may contain LaTeX' }),
          whyWrong: Schema.string({
            description: 'For incorrect choices, why it is wrong. Empty for the correct choice.',
          }),
        },
        optionalProperties: ['whyWrong'],
      }),
    }),
    correctOptionId: Schema.string({
      description: 'The id of the correct option. Required for multiple-choice.',
    }),
    numericAnswer: Schema.number({
      description: 'The exact numeric answer. Required for numeric problems.',
    }),
    placeholder: Schema.string({ description: 'Input placeholder for numeric problems.' }),
    explanation: Schema.string({ description: 'Worked explanation of the correct answer.' }),
    misconception: Schema.string({
      description: 'A short note about the most common mistake on this problem.',
    }),
    answerValue: Schema.number({
      description:
        'The exact numeric value of the correct answer. Omit ONLY when the answer is not a number (e.g. a multiple-choice label like "Bag B").',
    }),
    verifyExpression: Schema.string({
      description:
        'A math.js arithmetic expression using ONLY numbers and + - * / ^ ( ) sqrt abs (no variables, no "="), that evaluates to answerValue. Derive it from the problem\'s given numbers, e.g. for "x + 5 = 2" use "2 - 5". Omit only when answerValue is omitted.',
    }),
  },
  optionalProperties: [
    'options',
    'correctOptionId',
    'numericAnswer',
    'placeholder',
    'misconception',
    'answerValue',
    'verifyExpression',
  ],
})

type RawGenerated = {
  type: 'multiple-choice' | 'numeric'
  prompt: string
  options?: { id: string; label: string; whyWrong?: string }[]
  correctOptionId?: string
  numericAnswer?: number
  placeholder?: string
  explanation: string
  misconception?: string
  answerValue?: number
  verifyExpression?: string
}

let cachedModel: GenerativeModel | null = null

function getModel(): GenerativeModel | null {
  if (cachedModel) return cachedModel
  const app = getFirebaseApp()
  if (!app) return null
  const ai = getAI(app, { backend: new GoogleAIBackend() })
  cachedModel = getGenerativeModel(ai, {
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema,
    },
  })
  return cachedModel
}

function buildPrompt(req: GenerateRequest): string {
  const mistakes = req.recentMistakes?.length
    ? `\nThe learner recently missed problems described as: ${req.recentMistakes.join('; ')}. Target that weakness.`
    : ''

  const difficultyLine = req.difficultyLabel
    ? `Difficulty band to match: "${req.difficultyLabel}"${req.difficultyNote ? ` — ${req.difficultyNote}` : ''}.`
    : `Keep the difficulty appropriate for this topic.`

  const examplesBlock = req.examples?.length
    ? `\nMatch the difficulty and number ranges of these example problems from the same band (do NOT copy them verbatim — create a fresh variation):\n${req.examples
        .map((ex, i) => `${i + 1}. ${ex}`)
        .join('\n')}`
    : ''

  const avoidBlock = req.avoidPrompts?.length
    ? `\nDo NOT repeat or lightly reword any of these recently shown problems — produce a clearly different one (change the numbers and wording):\n${req.avoidPrompts
        .map((p, i) => `${i + 1}. ${p}`)
        .join('\n')}`
    : ''

  return [
    `You are an algebra tutor generating ONE fresh practice problem.`,
    `Topic / lesson: "${req.topic}".`,
    `Required interaction type: ${req.problemType}.`,
    req.problemType === 'multiple-choice'
      ? `Provide exactly 4 options with short ids (a, b, c, d), set correctOptionId, and give a brief whyWrong for each incorrect option.`
      : `Provide a single exact numericAnswer (a number) and a short placeholder.`,
    `${difficultyLine} Use $...$ for any math.`,
    `Always include a clear explanation and a one-sentence misconception.`,
    `For any problem whose answer is a number, you MUST also return answerValue (the exact answer) and verifyExpression — a math.js arithmetic expression built from the problem's given numbers that evaluates to answerValue (e.g. for "x + 5 = 2" use "2 - 5"). verifyExpression must contain no variables and no "=", and must not be a bare copy of the answer. For multiple-choice, answerValue must equal the numeric value shown in the correct option's label.`,
    examplesBlock,
    avoidBlock,
    mistakes,
  ]
    .filter(Boolean)
    .join('\n')
}

// Independently re-check the model's arithmetic with math.js. Returns false when
// the stated answer does not follow from verifyExpression (or, for numeric
// problems, when the verification fields are missing). Non-numeric multiple
// choice answers can't be math-checked, so they pass through.
function verifyRaw(raw: RawGenerated): boolean {
  if (raw.type === 'numeric') {
    if (typeof raw.numericAnswer !== 'number' || typeof raw.answerValue !== 'number') return false
    if (!raw.verifyExpression) return false
    const computed = evalNumber(raw.verifyExpression)
    if (computed === null) return false
    return numbersClose(computed, raw.answerValue) && numbersClose(raw.answerValue, raw.numericAnswer)
  }

  // Multiple choice: only verify when the correct answer is numeric.
  const correct = raw.options?.find((o) => o.id === raw.correctOptionId)
  const labelValue = correct ? parseNumericFromLabel(correct.label) : null
  if (typeof raw.answerValue !== 'number' || labelValue === null) {
    // Non-numeric answer (e.g. "Bag B") — nothing to math-check.
    return true
  }
  const computed = raw.verifyExpression ? evalNumber(raw.verifyExpression) : null
  if (computed === null) return false
  return numbersClose(computed, raw.answerValue) && numbersClose(labelValue, raw.answerValue)
}

// Convert the flat model output into our validated Problem shape.
function toProblem(
  raw: RawGenerated,
  lessonId: string,
  roundId: string,
): GeneratedProblem | null {
  const id = `ai-${lessonId}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`
  const hint = raw.misconception || raw.explanation || 'Think about the inverse operation.'

  let candidate: Problem
  if (raw.type === 'multiple-choice') {
    if (!raw.options || raw.options.length < 2 || !raw.correctOptionId) return null
    candidate = {
      id,
      type: 'multiple-choice',
      prompt: raw.prompt,
      interaction: {
        type: 'multiple-choice',
        data: {
          options: raw.options.map((o) => ({
            id: o.id,
            label: o.label,
            ...(o.whyWrong ? { whyWrong: o.whyWrong } : {}),
          })),
          correctOptionId: raw.correctOptionId,
        },
      },
      hints: [hint],
      explanation: raw.explanation,
      ...(raw.misconception ? { misconception: raw.misconception } : {}),
    }
    // Reject if the correct option id is not among the options.
    if (!raw.options.some((o) => o.id === raw.correctOptionId)) return null
  } else {
    if (typeof raw.numericAnswer !== 'number' || !Number.isFinite(raw.numericAnswer)) return null
    candidate = {
      id,
      type: 'numeric',
      prompt: raw.prompt,
      interaction: {
        type: 'numeric',
        data: {
          ...(raw.placeholder ? { placeholder: raw.placeholder } : {}),
          validation: { type: 'numeric', value: raw.numericAnswer, tolerance: 0.001 },
        },
      },
      hints: [hint],
      explanation: raw.explanation,
      ...(raw.misconception ? { misconception: raw.misconception } : {}),
    }
  }

  // Math.js safeguard: reject problems whose answer doesn't check out.
  if (!verifyRaw(raw)) return null

  const parsed = problemSchema.safeParse(candidate)
  if (!parsed.success) return null
  return { ...(parsed.data as Problem), reviewRef: lessonId, reviewRoundId: roundId }
}

// Pick a real authored problem from the lesson as an offline / failure fallback.
// When a roundId is given, draw from that round first so the difficulty band is
// preserved even without the AI backend.
export function fallbackProblem(
  lessonId: string,
  problemType?: ProblemType,
  roundId?: string,
  avoidPrompts?: string[],
): GeneratedProblem | null {
  const lesson = getLessonById(lessonId)
  if (!lesson) return null
  const round = roundId ? lesson.rounds.find((r) => r.id === roundId) : undefined
  const roundIds = round?.problemIds ?? []
  const allIds = lesson.rounds.flatMap((r) => r.problemIds)
  const roundPool = roundIds.map((pid) => problemBank[pid]).filter(Boolean)
  const fullPool = allIds.map((pid) => problemBank[pid]).filter(Boolean)
  const pool = roundPool.length > 0 ? roundPool : fullPool
  if (pool.length === 0) return null
  const preferred = problemType ? pool.filter((p) => p.type === problemType) : []
  let choices = preferred.length > 0 ? preferred : pool
  // Drop recently shown problems so we don't repeat back-to-back, but only while
  // some choices remain (a tiny round pool may otherwise leave nothing).
  if (avoidPrompts?.length) {
    const avoid = new Set(avoidPrompts)
    const fresh = choices.filter((p) => !avoid.has(normalizePrompt(p.prompt)))
    if (fresh.length > 0) choices = fresh
  }
  const picked = choices[Math.floor(Math.random() * choices.length)]
  return { ...picked, reviewRef: lessonId, reviewRoundId: round?.id ?? '' }
}

// Generate one AI problem for the request, retrying once, then falling back to
// a real authored problem if the model is unavailable or output is unusable.
export async function generateReviewProblem(
  req: GenerateRequest,
): Promise<GeneratedProblem> {
  const model = req.useAi === false ? null : getModel()
  if (model) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await model.generateContent(buildPrompt(req))
        const text = result.response.text()
        const raw = JSON.parse(text) as RawGenerated
        const problem = toProblem(raw, req.lessonId, req.roundId ?? '')
        if (problem) return problem
      } catch (e) {
        console.error('AI problem generation failed', e)
      }
    }
  }
  const fallback = fallbackProblem(req.lessonId, req.problemType, req.roundId, req.avoidPrompts)
  if (fallback) return fallback
  // Last resort: any authored problem in the bank.
  const any = Object.values(problemBank)[0]
  return { ...any, reviewRef: req.lessonId, reviewRoundId: req.roundId ?? '' }
}
