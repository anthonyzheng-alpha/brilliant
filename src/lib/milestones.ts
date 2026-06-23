import type { GamificationState } from '../types/content'

export function awardLessonMilestone(
  state: GamificationState,
  lessonId: string,
): GamificationState {
  if (state.lessonMilestones[lessonId]) return state
  const badgeId = `lesson-${lessonId}`
  return {
    ...state,
    lessonMilestones: {
      ...state.lessonMilestones,
      [lessonId]: { earnedAt: new Date().toISOString() },
    },
    badges: state.badges.includes(badgeId)
      ? state.badges
      : [...state.badges, badgeId],
  }
}

export function hasLessonMilestone(state: GamificationState, lessonId: string): boolean {
  return Boolean(state.lessonMilestones[lessonId])
}

export function awardUnitBadge(
  state: GamificationState,
  unitId: string,
  allLessonIds: string[],
): GamificationState {
  const allMastered = allLessonIds.every((id) => state.lessonMilestones[id])
  if (!allMastered) return state
  const badgeId = `unit-${unitId}`
  if (state.badges.includes(badgeId)) return state
  return { ...state, badges: [...state.badges, badgeId] }
}

export function awardCourseBadge(
  state: GamificationState,
  courseId: string,
  allLessonIds: string[],
): GamificationState {
  const allMastered = allLessonIds.every((id) => state.lessonMilestones[id])
  if (!allMastered) return state
  const badgeId = `course-${courseId}`
  if (state.badges.includes(badgeId)) return state
  return { ...state, badges: [...state.badges, badgeId] }
}
