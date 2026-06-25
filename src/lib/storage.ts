import type { ProgressState, GamificationState, LessonVariant } from '../types/content'

const PROGRESS_KEY = 'algebra-clone-progress'
const GAMIFICATION_KEY = 'algebra-clone-gamification'
const SEEN_MINI_LESSONS_KEY = 'algebra-clone-seen-minilessons'
const VARIANTS_KEY = 'algebra-clone-variants'
const DEBUG_KEY = 'algebra-clone-debug'
const WELCOME_KEY = 'algebra-clone-welcome-seen'

type DebugState = {
  unlockAll: boolean
}

const defaultDebug = (): DebugState => ({
  unlockAll: false,
})

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

export function hasSeenWelcome(): boolean {
  return readJson<boolean>(WELCOME_KEY, () => false)
}

export function markWelcomeSeen(): void {
  writeJson(WELCOME_KEY, true)
}

export function loadDebug(): DebugState {
  return { ...defaultDebug(), ...readJson(DEBUG_KEY, defaultDebug) }
}

export function saveDebug(state: DebugState): void {
  writeJson(DEBUG_KEY, state)
}

export function loadVariant(lessonId: string): LessonVariant | null {
  const all = readJson<Record<string, LessonVariant>>(VARIANTS_KEY, () => ({}))
  return all[lessonId] ?? null
}

export function saveVariant(lessonId: string, variant: LessonVariant): void {
  const all = readJson<Record<string, LessonVariant>>(VARIANTS_KEY, () => ({}))
  all[lessonId] = variant
  writeJson(VARIANTS_KEY, all)
}

export function clearAllLocalData(): void {
  localStorage.removeItem(PROGRESS_KEY)
  localStorage.removeItem(GAMIFICATION_KEY)
  localStorage.removeItem(SEEN_MINI_LESSONS_KEY)
  localStorage.removeItem(DEBUG_KEY)
  localStorage.removeItem(VARIANTS_KEY)
  // WELCOME_KEY intentionally preserved: onboarding state, not user progress.
}

export { PROGRESS_KEY, GAMIFICATION_KEY }
export type { DebugState }
