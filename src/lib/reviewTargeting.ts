import type { ProblemType } from '../types/content'
import {
  courses,
  getAllLessonsForCourse,
  getLessonById,
  getLessonLocation,
  problemBank,
} from '../content'
import {
  GENERATABLE_TYPES,
  type GenerateRequest,
} from './ai'

export function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

export function shuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function roundLabelFor(lessonId: string, roundId: string): string | undefined {
  if (!roundId) return undefined
  return getLessonById(lessonId)?.rounds.find((r) => r.id === roundId)?.label
}

// A single mini-lesson (round) the learner can target in a practice test.
export type TestTarget = { lessonId: string; roundId: string }

export type MiniLessonOption = TestTarget & {
  key: string
  lessonTitle: string
  courseTitle: string
  roundLabel: string
}

export function targetKey(lessonId: string, roundId: string): string {
  return `${lessonId}::${roundId}`
}

// Rank each lesson by its position in the home page progression (courses in
// array order, then lessons via getAllLessonsForCourse: units by `order`, then
// lessons). Built lazily once and reused so the practice test list matches the
// learning path order. Unknown lessons sort to the end.
let lessonRankMap: Map<string, number> | null = null

function lessonRank(lessonId: string): number {
  if (!lessonRankMap) {
    lessonRankMap = new Map()
    let rank = 0
    for (const course of courses) {
      for (const lesson of getAllLessonsForCourse(course.id)) {
        if (!lessonRankMap.has(lesson.id)) {
          lessonRankMap.set(lesson.id, rank++)
        }
      }
    }
  }
  return lessonRankMap.get(lessonId) ?? Number.MAX_SAFE_INTEGER
}

// Build the selectable mini-lesson list from the rounds the learner has actually
// attempted. Each attempted round becomes one option labeled by its mini-lesson
// title, deduped and ordered by course -> lesson -> round position so the
// difficulty progression stays intact. Legacy attempts without a round id are
// skipped (there is no specific mini-lesson to scope them to).
export function getMiniLessonOptions(
  attempted: { lessonId: string; roundId: string }[],
): MiniLessonOption[] {
  const byKey = new Map<string, MiniLessonOption>()
  // Track each round's index within its lesson for difficulty ordering.
  const roundOrder = new Map<string, number>()

  for (const { lessonId, roundId } of attempted) {
    if (!roundId) continue
    const key = targetKey(lessonId, roundId)
    if (byKey.has(key)) continue
    const lesson = getLessonById(lessonId)
    if (!lesson) continue
    const roundIndex = lesson.rounds.findIndex((r) => r.id === roundId)
    if (roundIndex < 0) continue
    const round = lesson.rounds[roundIndex]
    const loc = getLessonLocation(lessonId)
    byKey.set(key, {
      lessonId,
      roundId,
      key,
      lessonTitle: loc?.lessonTitle ?? lessonId,
      courseTitle: loc?.courseTitle ?? '',
      roundLabel: round.miniLesson?.title ?? round.label,
    })
    roundOrder.set(key, roundIndex)
  }

  return [...byKey.values()].sort((a, b) => {
    const rankDiff = lessonRank(a.lessonId) - lessonRank(b.lessonId)
    if (rankDiff !== 0) return rankDiff
    return (roundOrder.get(a.key) ?? 0) - (roundOrder.get(b.key) ?? 0)
  })
}

// Pull the difficulty label, mini-lesson description, and a couple of authored
// example prompts for a specific round so the generator can match that band.
export function roundContext(
  lessonId: string,
  roundId: string,
  problemType: ProblemType,
): { difficultyLabel?: string; difficultyNote?: string; examples: string[] } {
  const lesson = getLessonById(lessonId)
  const round = roundId ? lesson?.rounds.find((r) => r.id === roundId) : undefined
  if (!round) return { examples: [] }
  const note = round.miniLesson
    ? `${round.miniLesson.title ? `${round.miniLesson.title}: ` : ''}${round.miniLesson.paragraph}`
    : undefined
  const pool = round.problemIds.map((pid) => problemBank[pid]).filter(Boolean)
  const preferred = pool.filter((p) => p.type === problemType)
  const examples = (preferred.length > 0 ? preferred : pool).slice(0, 2).map((p) => p.prompt)
  return { difficultyLabel: round.label, difficultyNote: note, examples }
}

// Build a set of generation requests for a practice test, distributing the
// requested count round-robin across the chosen mini-lessons. Each question
// targets the exact round the learner selected (so the difficulty band matches
// what they actually reached) and a random generatable interaction type.
export function buildTestRequests(
  targets: TestTarget[],
  count: number,
  useAi: boolean,
): GenerateRequest[] {
  if (targets.length === 0) return []
  const order = shuffle(targets)
  const requests: GenerateRequest[] = []
  for (let i = 0; i < count; i++) {
    const { lessonId, roundId } = order[i % order.length]
    const problemType = pickRandom(GENERATABLE_TYPES)
    const loc = getLessonLocation(lessonId)
    const { difficultyLabel, difficultyNote, examples } = roundContext(
      lessonId,
      roundId,
      problemType,
    )
    const lessonTitle = loc?.lessonTitle ?? lessonId
    const miniLessonTitle = getLessonById(lessonId)?.rounds.find((r) => r.id === roundId)
      ?.miniLesson?.title
    const topic = miniLessonTitle ? `${lessonTitle} — ${miniLessonTitle}` : lessonTitle
    requests.push({
      lessonId,
      roundId,
      problemType,
      topic,
      difficultyLabel,
      difficultyNote,
      examples,
      useAi,
    })
  }
  return requests
}
