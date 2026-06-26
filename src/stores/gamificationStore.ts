import { create } from 'zustand'
import type { GamificationState, MonsterSlot } from '../types/content'
import { loadGamification, saveGamification } from '../lib/storage'
import { computeStreakUpdate, todayLocal } from '../lib/streaks'
import {
  awardCourseBadge,
  awardLessonMilestone,
  awardUnitBadge,
} from '../lib/milestones'
import { ITEMS_BY_ID } from '../lib/shop'

type GamificationStore = {
  gamification: GamificationState
  hydrate: () => void
  setFromRemote: (state: GamificationState) => void
  recordActivity: () => void
  awardCoins: (amount: number) => void
  buyItem: (itemId: string) => boolean
  equipItem: (itemId: string) => void
  unequip: (slot: MonsterSlot) => void
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

  buyItem: (itemId) => {
    const g = get().gamification
    const item = ITEMS_BY_ID[itemId]
    if (!item) return false
    if (g.profile.ownedItems.includes(itemId)) return false
    if ((g.coins ?? 0) < item.price) return false
    const updated: GamificationState = {
      ...g,
      coins: (g.coins ?? 0) - item.price,
      profile: {
        ...g.profile,
        ownedItems: [...g.profile.ownedItems, itemId],
      },
    }
    saveGamification(updated)
    set({ gamification: updated })
    return true
  },

  equipItem: (itemId) => {
    const g = get().gamification
    const item = ITEMS_BY_ID[itemId]
    if (!item) return
    if (!g.profile.ownedItems.includes(itemId)) return
    let profile = g.profile
    if (item.category === 'color') {
      profile = { ...profile, bodyColor: itemId }
    } else {
      profile = {
        ...profile,
        equipped: { ...profile.equipped, [item.category]: itemId },
      }
    }
    const updated: GamificationState = { ...g, profile }
    saveGamification(updated)
    set({ gamification: updated })
  },

  unequip: (slot) => {
    const g = get().gamification
    const equipped = { ...g.profile.equipped }
    delete equipped[slot]
    const updated: GamificationState = {
      ...g,
      profile: { ...g.profile, equipped },
    }
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
