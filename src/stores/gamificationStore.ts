import { create } from 'zustand'
import type { GamificationState } from '../types/content'
import { loadGamification, saveGamification } from '../lib/storage'
import { computeStreakUpdate, todayLocal } from '../lib/streaks'
import {
  awardCourseBadge,
  awardLessonMilestone,
  awardUnitBadge,
} from '../lib/milestones'

type GamificationStore = {
  gamification: GamificationState
  hydrate: () => void
  setFromRemote: (state: GamificationState) => void
  recordActivity: () => void
  awardCoins: (amount: number) => void
  onLessonMastered: (
    lessonId: string,
    unitId?: string,
    unitLessonIds?: string[],
    courseId?: string,
    courseLessonIds?: string[],
  ) => void
  hasMilestone: (lessonId: string) => boolean
}

export const useGamificationStore = create<GamificationStore>((set, get) => ({
  gamification: loadGamification(),

  hydrate: () => set({ gamification: loadGamification() }),

  setFromRemote: (state) => {
    saveGamification(state)
    set({ gamification: state })
  },

  recordActivity: () => {
    const g = get().gamification
    const today = todayLocal()
    const activeDates = g.activeDates.includes(today)
      ? g.activeDates
      : [...g.activeDates, today]
    const updated = {
      ...g,
      ...computeStreakUpdate(g.currentStreak, g.longestStreak, g.lastActiveDate),
      activeDates,
    }
    saveGamification(updated)
    set({ gamification: updated })
  },

  awardCoins: (amount) => {
    const g = get().gamification
    const updated = { ...g, coins: (g.coins ?? 0) + amount }
    saveGamification(updated)
    set({ gamification: updated })
  },

  onLessonMastered: (lessonId, unitId, unitLessonIds, courseId, courseLessonIds) => {
    let g = get().gamification
    g = awardLessonMilestone(g, lessonId)
    if (unitId && unitLessonIds) {
      g = awardUnitBadge(g, unitId, unitLessonIds)
    }
    if (courseId && courseLessonIds) {
      g = awardCourseBadge(g, courseId, courseLessonIds)
    }
    saveGamification(g)
    set({ gamification: g })
  },

  hasMilestone: (lessonId) => Boolean(get().gamification.lessonMilestones[lessonId]),
}))
