import type { ProgressState, GamificationState } from '../types/content'

const PROGRESS_KEY = 'algebra-clone-progress'
const GAMIFICATION_KEY = 'algebra-clone-gamification'

const defaultProgress = (): ProgressState => ({
  version: 1,
  courses: {},
})

const defaultGamification = (): GamificationState => ({
  version: 1,
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: null,
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
  return readJson(GAMIFICATION_KEY, defaultGamification)
}

export function saveGamification(state: GamificationState): void {
  writeJson(GAMIFICATION_KEY, state)
}

export function clearAllLocalData(): void {
  localStorage.removeItem(PROGRESS_KEY)
  localStorage.removeItem(GAMIFICATION_KEY)
}

export { PROGRESS_KEY, GAMIFICATION_KEY }
