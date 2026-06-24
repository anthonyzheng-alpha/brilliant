import { create } from 'zustand'
import type { CourseProgress, Lesson, ProgressState } from '../types/content'
import { loadProgress, saveProgress } from '../lib/storage'

type ProgressStore = {
  progress: ProgressState
  hydrate: () => void
  setFromRemote: (state: ProgressState) => void
  getCourseProgress: (courseId: string) => CourseProgress
  getCoursePercent: (courseId: string, totalLessons: number) => number
  getCourseProblemPercent: (courseId: string, lessons: Lesson[]) => number
  getLessonProgressCount: (courseId: string, lessonId: string) => number
  isLessonComplete: (courseId: string, lessonId: string) => boolean
  isCourseComplete: (courseId: string, lessonIds: string[]) => boolean
  isLessonUnlocked: (
    courseId: string,
    lessonId: string,
    orderedLessonIds: string[],
  ) => boolean
  setResumePoint: (courseId: string, lessonId: string, problemIndex: number) => void
  markLessonComplete: (courseId: string, lessonId: string) => void
  getResumeProblemIndex: (courseId: string, lessonId: string) => number
}

const emptyCourse = (): CourseProgress => ({
  completedLessons: [],
})

const EMPTY_COURSE_PROGRESS: CourseProgress = { completedLessons: [] }

export const useProgressStore = create<ProgressStore>((set, get) => ({
  progress: loadProgress(),

  hydrate: () => set({ progress: loadProgress() }),

  setFromRemote: (state) => {
    saveProgress(state)
    set({ progress: state })
  },

  getCourseProgress: (courseId) => {
    return get().progress.courses[courseId] ?? EMPTY_COURSE_PROGRESS
  },

  getCoursePercent: (courseId, totalLessons) => {
    if (totalLessons === 0) return 0
    const completed = get().getCourseProgress(courseId).completedLessons.length
    return Math.round((completed / totalLessons) * 100)
  },

  getCourseProblemPercent: (courseId, lessons) => {
    let total = 0
    let completed = 0
    for (const lesson of lessons) {
      const lessonTotal = lesson.rounds.reduce((n, r) => n + r.problemIds.length, 0)
      const done = get().isLessonComplete(courseId, lesson.id)
      const count = done ? lessonTotal : get().getLessonProgressCount(courseId, lesson.id)
      total += lessonTotal
      completed += Math.min(count, lessonTotal)
    }
    return total ? Math.round((completed / total) * 100) : 0
  },

  getLessonProgressCount: (courseId, lessonId) => {
    return get().getCourseProgress(courseId).lessonProgress?.[lessonId] ?? 0
  },

  isLessonComplete: (courseId, lessonId) => {
    return get().getCourseProgress(courseId).completedLessons.includes(lessonId)
  },

  isCourseComplete: (courseId, lessonIds) => {
    const completed = get().getCourseProgress(courseId).completedLessons
    return lessonIds.every((id) => completed.includes(id))
  },

  isLessonUnlocked: (courseId, lessonId, orderedLessonIds) => {
    const idx = orderedLessonIds.indexOf(lessonId)
    if (idx <= 0) return true
    const prev = orderedLessonIds[idx - 1]
    return get().isLessonComplete(courseId, prev)
  },

  setResumePoint: (courseId, lessonId, problemIndex) => {
    const progress = { ...get().progress }
    const course = { ...(progress.courses[courseId] ?? emptyCourse()) }
    course.lastLessonId = lessonId
    course.lastProblemIndex = problemIndex
    const lessonProgress = { ...(course.lessonProgress ?? {}) }
    lessonProgress[lessonId] = Math.max(lessonProgress[lessonId] ?? 0, problemIndex)
    course.lessonProgress = lessonProgress
    progress.courses[courseId] = course
    saveProgress(progress)
    set({ progress })
  },

  markLessonComplete: (courseId, lessonId) => {
    const progress = { ...get().progress }
    const course = { ...(progress.courses[courseId] ?? emptyCourse()) }
    if (!course.completedLessons.includes(lessonId)) {
      course.completedLessons = [...course.completedLessons, lessonId]
    }
    course.lastLessonId = lessonId
    course.lastProblemIndex = 0
    progress.courses[courseId] = course
    saveProgress(progress)
    set({ progress })
  },

  getResumeProblemIndex: (courseId, lessonId) => {
    const course = get().getCourseProgress(courseId)
    if (course.lastLessonId === lessonId && course.lastProblemIndex != null) {
      return course.lastProblemIndex
    }
    return 0
  },
}))
