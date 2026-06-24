import { courseSchema, lessonSchema, problemSchema, unitSchema } from '../lib/schemas'
import type { Course, Lesson, LessonVariant, Problem, Round, Unit } from '../types/content'

import solvingEquations from './courses/solving-equations.json'
import visualAlgebra from './courses/visual-algebra.json'
import realWorldAlgebra from './courses/real-world-algebra.json'
import factoring from './courses/factoring.json'

import seU1 from './units/se-u1.json'
import vaU1 from './units/va-u1.json'
import rwU1 from './units/rw-u1.json'
import faU1 from './units/fa-u1.json'

import seU1L1 from './lessons/se-u1-l1.json'
import seU1L2 from './lessons/se-u1-l2.json'
import vaU1L1 from './lessons/va-u1-l1.json'
import rwU1L1 from './lessons/rw-u1-l1.json'
import faU1L1 from './lessons/fa-u1-l1.json'

import seU1L1Problems from './problems/solving-equations/se-u1-l1.json'
import seU1L2Problems from './problems/solving-equations/se-u1-l2.json'
import vaU1L1Problems from './problems/visual-algebra/va-u1-l1.json'
import rwU1L1Problems from './problems/real-world-algebra/rw-u1-l1.json'
import faU1L1Problems from './problems/factoring/fa-u1-l1.json'

const courseData = [solvingEquations, realWorldAlgebra, visualAlgebra, factoring]
const unitData = [seU1, vaU1, rwU1, faU1]
const lessonData = [seU1L1, seU1L2, vaU1L1, rwU1L1, faU1L1]
const problemData = [
  ...seU1L1Problems,
  ...seU1L2Problems,
  ...vaU1L1Problems,
  ...rwU1L1Problems,
  ...faU1L1Problems,
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

// Randomly pick the round's sampleSize problems from its pool (random order).
// Rounds without a sampleSize keep all problems in their authored order.
export function chooseLessonVariant(lesson: Lesson): LessonVariant {
  const variant: LessonVariant = {}
  for (const round of lesson.rounds) {
    const size = roundSize(round)
    variant[round.id] =
      size >= round.problemIds.length
        ? [...round.problemIds]
        : shuffle(round.problemIds).slice(0, size)
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
