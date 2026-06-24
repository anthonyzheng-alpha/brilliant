import type { ProgressState, GamificationState } from '../types/content'

const PROGRESS_KEY = 'algebra-clone-progress'
const GAMIFICATION_KEY = 'algebra-clone-gamification'
const SEEN_MINI_LESSONS_KEY = 'algebra-clone-seen-minilessons'

const defaultProgress = (): ProgressState => ({
  version: 1,
  courses: {},
})

const defaultGamification = (): GamificationState => ({
  version: 1,
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: null,
  activeDates: [],
  lessonMilestones: {},
  badges: [],
})

function readJson<T>(key: string, fallback: () => T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback()
    return JSON.parse(raw) as T
  } catch {
    return fallback()
  }
}

function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

export function loadProgress(): ProgressState {
  return readJson(PROGRESS_KEY, defaultProgress)
}

export function saveProgress(state: ProgressState): void {
  writeJson(PROGRESS_KEY, state)
}

export function loadGamification(): GamificationState {
  const g = readJson(GAMIFICATION_KEY, defaultGamification)
  return { ...defaultGamification(), ...g, activeDates: g.activeDates ?? [] }
}

export function saveGamification(state: GamificationState): void {
  writeJson(GAMIFICATION_KEY, state)
}

export function loadSeenMiniLessons(): string[] {
  return readJson<string[]>(SEEN_MINI_LESSONS_KEY, () => [])
}

export function isMiniLessonSeen(roundId: string): boolean {
  return loadSeenMiniLessons().includes(roundId)
}

export function markMiniLessonSeen(roundId: string): void {
  const seen = loadSeenMiniLessons()
  if (!seen.includes(roundId)) {
    writeJson(SEEN_MINI_LESSONS_KEY, [...seen, roundId])
  }
}

export function clearAllLocalData(): void {
  localStorage.removeItem(PROGRESS_KEY)
  localStorage.removeItem(GAMIFICATION_KEY)
  localStorage.removeItem(SEEN_MINI_LESSONS_KEY)
}

export { PROGRESS_KEY, GAMIFICATION_KEY }
