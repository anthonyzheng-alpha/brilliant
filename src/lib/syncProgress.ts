import type { GamificationState, ProgressState, CourseProgress } from '../types/content'
import { get, ref, set } from 'firebase/database'
import { getRealtimeDb } from './firebase'
import { saveProgress, saveGamification } from './storage'

// RTDB rejects `undefined` values; strip them (and any undefined nested fields).
function stripUndefined<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function mergeCourseProgress(
  local: CourseProgress | undefined,
  remote: CourseProgress | undefined,
): CourseProgress {
  const completed = new Set([
    ...(local?.completedLessons ?? []),
    ...(remote?.completedLessons ?? []),
  ])
  const localIdx = local?.lastProblemIndex ?? 0
  const remoteIdx = remote?.lastProblemIndex ?? 0
  const useLocal =
    local &&
    remote &&
    local.lastLessonId === remote.lastLessonId &&
    localIdx > remoteIdx
  const lessonProgress: Record<string, number> = { ...(remote?.lessonProgress ?? {}) }
  for (const [id, n] of Object.entries(local?.lessonProgress ?? {})) {
    lessonProgress[id] = Math.max(lessonProgress[id] ?? 0, n)
  }
  return {
    completedLessons: [...completed],
    lastLessonId: useLocal
      ? local?.lastLessonId
      : remote?.lastLessonId ?? local?.lastLessonId,
    lastProblemIndex: useLocal ? localIdx : Math.max(localIdx, remoteIdx),
    lessonProgress,
  }
}

export function mergeProgress(
  local: ProgressState,
  remote: ProgressState,
): ProgressState {
  const courseIds = new Set([
    ...Object.keys(local.courses),
    ...Object.keys(remote.courses),
  ])
  const courses: ProgressState['courses'] = {}
  for (const id of courseIds) {
    courses[id] = mergeCourseProgress(local.courses[id], remote.courses[id])
  }
  return { version: 1, courses }
}

export function mergeGamification(
  local: GamificationState,
  remote: GamificationState,
): GamificationState {
  const lessonMilestones = { ...remote.lessonMilestones, ...local.lessonMilestones }
  const badges = [...new Set([...remote.badges, ...local.badges])]
  const activeDates = [
    ...new Set([...(local.activeDates ?? []), ...(remote.activeDates ?? [])]),
  ].sort()
  return {
    version: 1,
    currentStreak: Math.max(local.currentStreak, remote.currentStreak),
    longestStreak: Math.max(local.longestStreak, remote.longestStreak),
    lastActiveDate: local.lastActiveDate ?? remote.lastActiveDate,
    activeDates,
    lessonMilestones,
    badges,
  }
}

export async function fetchUserData(uid: string): Promise<{
  progress: ProgressState | null
  gamification: GamificationState | null
}> {
  const db = getRealtimeDb()
  if (!db) return { progress: null, gamification: null }

  const [progressSnap, gamificationSnap] = await Promise.all([
    get(ref(db, `users/${uid}/progress`)),
    get(ref(db, `users/${uid}/gamification`)),
  ])

  return {
    progress: progressSnap.exists() ? (progressSnap.val() as ProgressState) : null,
    gamification: gamificationSnap.exists()
      ? (gamificationSnap.val() as GamificationState)
      : null,
  }
}

export async function saveUserProgress(uid: string, progress: ProgressState): Promise<void> {
  const db = getRealtimeDb()
  if (!db) return
  await set(ref(db, `users/${uid}/progress`), stripUndefined(progress))
  saveProgress(progress)
}

export async function saveUserGamification(
  uid: string,
  gamification: GamificationState,
): Promise<void> {
  const db = getRealtimeDb()
  if (!db) return
  await set(ref(db, `users/${uid}/gamification`), stripUndefined(gamification))
  saveGamification(gamification)
}

export async function syncOnLogin(uid: string): Promise<void> {
  const remote = await fetchUserData(uid)

  const progress = remote.progress ?? { version: 1, courses: {} }
  const gamification = remote.gamification ?? {
    version: 1,
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: null,
    activeDates: [],
    lessonMilestones: {},
    badges: [],
  }

  saveProgress(progress)
  saveGamification(gamification)
}
