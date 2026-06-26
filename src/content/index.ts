import { courseSchema, lessonSchema, problemSchema, unitSchema } from '../lib/schemas'
import type {
  Course,
  Lesson,
  LessonVariant,
  Problem,
  ProgressState,
  Round,
  Unit,
} from '../types/content'

import solvingEquations from './courses/solving-equations.json'
import visualAlgebra from './courses/visual-algebra.json'
import realWorldAlgebra from './courses/real-world-algebra.json'
import factoring from './courses/factoring.json'
import rootsOfPolynomials from './courses/roots-of-polynomials.json'

import seU1 from './units/se-u1.json'
import vaU1 from './units/va-u1.json'
import rwU1 from './units/rw-u1.json'
import faU1 from './units/fa-u1.json'
import rpU1 from './units/rp-u1.json'

import seU1L1 from './lessons/se-u1-l1.json'
import seU1L2 from './lessons/se-u1-l2.json'
import vaU1L1 from './lessons/va-u1-l1.json'
import rwU1L1 from './lessons/rw-u1-l1.json'
import faU1L1 from './lessons/fa-u1-l1.json'
import rpU1L1 from './lessons/rp-u1-l1.json'

import seU1L1Problems from './problems/solving-equations/se-u1-l1.json'
import seU1L2Problems from './problems/solving-equations/se-u1-l2.json'
import vaU1L1Problems from './problems/visual-algebra/va-u1-l1.json'
import rwU1L1Problems from './problems/real-world-algebra/rw-u1-l1.json'
import faU1L1Problems from './problems/factoring/fa-u1-l1.json'
import rpU1L1Problems from './problems/roots-of-polynomials/rp-u1-l1.json'

const courseData = [solvingEquations, realWorldAlgebra, visualAlgebra, factoring, rootsOfPolynomials]
const unitData = [seU1, vaU1, rwU1, faU1, rpU1]
const lessonData = [seU1L1, seU1L2, vaU1L1, rwU1L1, faU1L1, rpU1L1]
const problemData = [
  ...seU1L1Problems,
  ...seU1L2Problems,
  ...vaU1L1Problems,
  ...rwU1L1Problems,
  ...faU1L1Problems,
  ...rpU1L1Problems,
]

function parseAll<T>(schema: { parse: (v: unknown) => T }, items: unknown[], label: string): T[] {
  return items.map((item, i) => {
    try {
      return schema.parse(item)
    } catch {
      throw new Error(`Invalid ${label} at index ${i}`)
    }
  })
}

export const courses: Course[] = parseAll(courseSchema, courseData, 'course')
export const units: Unit[] = parseAll(unitSchema, unitData, 'unit')
export const lessons: Lesson[] = parseAll(lessonSchema, lessonData, 'lesson') as Lesson[]
export const problems: Problem[] = parseAll(problemSchema, problemData, 'problem') as Problem[]

export const problemBank: Record<string, Problem> = Object.fromEntries(
  problems.map((p) => [p.id, p]),
)

// Validate lesson problem references
for (const lesson of lessons) {
  for (const round of lesson.rounds) {
    for (const pid of round.problemIds) {
      if (!problemBank[pid]) {
        throw new Error(`Lesson ${lesson.id} references missing problem ${pid}`)
      }
    }
  }
}

// Resolves where a lesson lives in the content tree (course + unit + display title).
export type LessonLocation = {
  lessonId: string
  lessonTitle: string
  unitId: string
  unitTitle: string
  courseId: string
  courseSlug: string
  courseTitle: string
}

export type ProblemLocation = LessonLocation & { problemId: string }

const lessonLocationMap: Record<string, LessonLocation> = {}
const problemLocationMap: Record<string, ProblemLocation> = {}

for (const lesson of lessons) {
  const unit = units.find((u) => u.id === lesson.unitId)
  const course = unit ? courses.find((c) => c.id === unit.courseId) : undefined
  const location: LessonLocation = {
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    unitId: lesson.unitId,
    unitTitle: unit?.title ?? '',
    courseId: unit?.courseId ?? '',
    courseSlug: course?.slug ?? '',
    courseTitle: course?.title ?? '',
  }
  lessonLocationMap[lesson.id] = location
  for (const round of lesson.rounds) {
    for (const pid of round.problemIds) {
      problemLocationMap[pid] = { ...location, problemId: pid }
    }
  }
}

export function getLessonLocation(lessonId: string): LessonLocation | undefined {
  return lessonLocationMap[lessonId]
}

export function getProblemLocation(problemId: string): ProblemLocation | undefined {
  return problemLocationMap[problemId]
}

// Lessons the learner has engaged with at all (any recorded progress or completion).
export function getCoveredLessonIds(progress: ProgressState): string[] {
  const covered = new Set<string>()
  for (const course of Object.values(progress.courses)) {
    for (const lessonId of course.completedLessons ?? []) covered.add(lessonId)
    for (const [lessonId, count] of Object.entries(course.lessonProgress ?? {})) {
      if (count > 0) covered.add(lessonId)
    }
  }
  return [...covered].filter((id) => Boolean(lessonLocationMap[id]))
}

export function getCourseBySlug(slug: string): Course | undefined {
  return courses.find((c) => c.slug === slug)
}

export function getUnitsForCourse(courseId: string): Unit[] {
  return units.filter((u) => u.courseId === courseId).sort((a, b) => a.order - b.order)
}

export function getLessonsForUnit(unitId: string): Lesson[] {
  return lessons.filter((l) => l.unitId === unitId)
}

export function getLessonById(lessonId: string): Lesson | undefined {
  return lessons.find((l) => l.id === lessonId)
}

// Number of problems shown for a round: the sample size when the round defines a
// larger candidate pool, otherwise the full list.
export function roundSize(round: Round): number {
  return round.sampleSize ?? round.problemIds.length
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// Stable identity of "the same question" for de-duping. Two problems with
// different ids but identical content (e.g. the factoring bank reuses the same
// expression across rounds) collapse to one signature. The prompt covers cases
// where the question text carries the math (solving-equations), while the visual
// covers cases where the prompt is generic but the figure differs (factoring
// expressions, coordinate graphs).
function problemSignature(p: Problem): string {
  const prompt = p.prompt.trim().replace(/\s+/g, ' ').toLowerCase()
  const visual = p.visual ? JSON.stringify(p.visual) : ''
  return `${prompt}|${visual}`
}

// Randomly pick the round's sampleSize problems from its pool (random order).
// Rounds are processed in order while sharing a `seen` set of content
// signatures, so a single lesson run never shows the same question twice — even
// when different problem ids across rounds carry identical content. If a round
// can't fill its sample size with fresh content, it backfills from its remaining
// ids so every round still shows its full count.
export function chooseLessonVariant(lesson: Lesson): LessonVariant {
  const variant: LessonVariant = {}
  const seen = new Set<string>()
  for (const round of lesson.rounds) {
    const size = roundSize(round)
    const candidates = shuffle(round.problemIds).filter((id) => problemBank[id])
    const chosen: string[] = []
    for (const id of candidates) {
      if (chosen.length >= size) break
      const sig = problemSignature(problemBank[id])
      if (seen.has(sig)) continue
      seen.add(sig)
      chosen.push(id)
    }
    if (chosen.length < size) {
      for (const id of candidates) {
        if (chosen.length >= size) break
        if (chosen.includes(id)) continue
        chosen.push(id)
      }
    }
    variant[round.id] = chosen
  }
  return variant
}

export function getProblemsForVariant(lesson: Lesson, variant: LessonVariant): Problem[] {
  return lesson.rounds.flatMap((round) => {
    const ids = variant[round.id] ?? round.problemIds.slice(0, roundSize(round))
    return ids.map((id) => problemBank[id]).filter(Boolean)
  })
}

export function getProblemsForLesson(lessonId: string): Problem[] {
  const lesson = getLessonById(lessonId)
  if (!lesson) return []
  return lesson.rounds.flatMap((round) =>
    round.problemIds.slice(0, roundSize(round)).map((id) => problemBank[id]),
  )
}

export type LessonRoundInfo = {
  id: string
  label: string
  size: number
  startIndex: number
}

export function getRoundsForLesson(lessonId: string): LessonRoundInfo[] {
  const lesson = getLessonById(lessonId)
  if (!lesson) return []
  let startIndex = 0
  return lesson.rounds.map((round) => {
    const size = roundSize(round)
    const info: LessonRoundInfo = {
      id: round.id,
      label: round.label,
      size,
      startIndex,
    }
    startIndex += size
    return info
  })
}

export function getAllLessonsForCourse(courseId: string): Lesson[] {
  const courseUnits = getUnitsForCourse(courseId)
  return courseUnits.flatMap((u) => getLessonsForUnit(u.id))
}

// Random practice set drawn from the entire course pool (every round's full
// candidate list, not just its sample size), deduped and shuffled. Ids in
// `excludeIds` (e.g. the previous set) are skipped so consecutive sets don't
// repeat — unless excluding them would leave too few problems.
export function getReviewProblems(
  courseId: string,
  count = 5,
  excludeIds: string[] = [],
): Problem[] {
  const ids = new Set<string>()
  for (const lesson of getAllLessonsForCourse(courseId)) {
    for (const round of lesson.rounds) {
      for (const pid of round.problemIds) ids.add(pid)
    }
  }
  const exclude = new Set(excludeIds)
  // Shuffle first, then keep one id per content signature so a set never
  // contains two problems that read identically (different ids, same content).
  const seenSig = new Set<string>()
  const unique: string[] = []
  for (const id of shuffle([...ids].filter((id) => problemBank[id]))) {
    const sig = problemSignature(problemBank[id])
    if (seenSig.has(sig)) continue
    seenSig.add(sig)
    unique.push(id)
  }
  const fresh = unique.filter((id) => !exclude.has(id))
  const pool = fresh.length >= count ? fresh : unique
  return pool.map((id) => problemBank[id]).slice(0, count)
}

export type RoundBox = { id: string; label: string; done: boolean }

export function computeRoundBoxes(
  lesson: Lesson,
  count: number,
  completed: boolean,
): RoundBox[] {
  let runningEnd = 0
  return lesson.rounds.map((round) => {
    runningEnd += roundSize(round)
    return {
      id: round.id,
      label: round.label,
      done: completed || count >= runningEnd,
    }
  })
}
