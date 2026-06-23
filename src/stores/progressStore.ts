import { create } from 'zustand'
import type { CourseProgress, ProgressState } from '../types/content'
import { loadProgress, saveProgress } from '../lib/storage'

type ProgressStore = {
  progress: ProgressState
  hydrate: () => void
  setFromRemote: (state: ProgressState) => void
  getCourseProgress: (courseId: string) => CourseProgress
  getCoursePercent: (courseId: string, totalLessons: number) => number
  isLessonComplete: (courseId: string, lessonId: string) => boolean
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

  isLessonComplete: (courseId, lessonId) => {
    return get().getCourseProgress(courseId).completedLessons.includes(lessonId)
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
