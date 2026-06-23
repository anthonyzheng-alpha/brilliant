import type { GamificationState, ProgressState, CourseProgress } from '../types/content'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { getFirestoreDb } from './firebase'
import { loadProgress, loadGamification, saveProgress, saveGamification } from './storage'

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
  return {
    completedLessons: [...completed],
    lastLessonId: useLocal
      ? local?.lastLessonId
      : remote?.lastLessonId ?? local?.lastLessonId,
    lastProblemIndex: useLocal ? localIdx : Math.max(localIdx, remoteIdx),
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
  return {
    version: 1,
    currentStreak: Math.max(local.currentStreak, remote.currentStreak),
    longestStreak: Math.max(local.longestStreak, remote.longestStreak),
    lastActiveDate: local.lastActiveDate ?? remote.lastActiveDate,
    lessonMilestones,
    badges,
  }
}

export async function fetchUserData(uid: string): Promise<{
  progress: ProgressState | null
  gamification: GamificationState | null
}> {
  const db = getFirestoreDb()
  if (!db) return { progress: null, gamification: null }

  const [progressSnap, gamificationSnap] = await Promise.all([
    getDoc(doc(db, 'users', uid, 'data', 'progress')),
    getDoc(doc(db, 'users', uid, 'data', 'gamification')),
  ])

  return {
    progress: progressSnap.exists() ? (progressSnap.data() as ProgressState) : null,
    gamification: gamificationSnap.exists()
      ? (gamificationSnap.data() as GamificationState)
      : null,
  }
}

export async function saveUserProgress(uid: string, progress: ProgressState): Promise<void> {
  const db = getFirestoreDb()
  if (!db) return
  await setDoc(doc(db, 'users', uid, 'data', 'progress'), progress)
  saveProgress(progress)
}

export async function saveUserGamification(
  uid: string,
  gamification: GamificationState,
): Promise<void> {
  const db = getFirestoreDb()
  if (!db) return
  await setDoc(doc(db, 'users', uid, 'data', 'gamification'), gamification)
  saveGamification(gamification)
}

export async function syncOnLogin(uid: string): Promise<void> {
  const localProgress = loadProgress()
  const localGamification = loadGamification()
  const remote = await fetchUserData(uid)

  const mergedProgress = mergeProgress(
    localProgress,
    remote.progress ?? { version: 1, courses: {} },
  )
  const mergedGamification = mergeGamification(
    localGamification,
    remote.gamification ?? {
      version: 1,
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      lessonMilestones: {},
      badges: [],
    },
  )

  await Promise.all([
    saveUserProgress(uid, mergedProgress),
    saveUserGamification(uid, mergedGamification),
  ])
}
