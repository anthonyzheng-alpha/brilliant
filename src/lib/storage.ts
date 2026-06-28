import type {
  AnswerValue,
  ProgressState,
  GamificationState,
  LessonVariant,
  StruggleState,
  MonsterProfile,
} from '../types/content'
import type { GeneratedProblem } from './ai'
import { DEFAULT_THEME, isTheme, type Theme } from './theme'
import { DEFAULT_COLOR, DEFAULT_OWNED } from './shop'

const PROGRESS_KEY = 'algebra-clone-progress'
const GAMIFICATION_KEY = 'algebra-clone-gamification'
const STRUGGLES_KEY = 'algebra-clone-struggles'
const SEEN_MINI_LESSONS_KEY = 'algebra-clone-seen-minilessons'
const VARIANTS_KEY = 'algebra-clone-variants'
const DEBUG_KEY = 'algebra-clone-debug'
const SETTINGS_KEY = 'algebra-clone-settings'
const WELCOME_KEY = 'algebra-clone-welcome-seen'
const OVERALL_REVIEW_SESSION_KEY = 'algebra-clone-overall-review-session'
const PRACTICE_TEST_SESSION_KEY = 'algebra-clone-practice-test-session'

type DebugState = {
  unlockAll: boolean
}

const defaultDebug = (): DebugState => ({
  unlockAll: false,
})

type SettingsState = {
  aiEnabled: boolean
  theme: Theme
}

const defaultSettings = (): SettingsState => ({
  aiEnabled: false,
  theme: DEFAULT_THEME,
})

const defaultProgress = (): ProgressState => ({
  version: 1,
  courses: {},
})

export const defaultMonsterProfile = (): MonsterProfile => ({
  bodyColor: DEFAULT_COLOR,
  ownedItems: [...DEFAULT_OWNED],
  equipped: {},
})

const defaultGamification = (): GamificationState => ({
  version: 1,
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: null,
  activeDates: [],
  lessonMilestones: {},
  badges: [],
  coins: 0,
  profile: defaultMonsterProfile(),
})

const defaultStruggles = (): StruggleState => ({
  version: 1,
  skills: {},
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
  const base = defaultMonsterProfile()
  const profile: MonsterProfile = {
    bodyColor: g.profile?.bodyColor ?? base.bodyColor,
    // Always include the free defaults so the monster can always render.
    ownedItems: [...new Set([...base.ownedItems, ...(g.profile?.ownedItems ?? [])])],
    equipped: g.profile?.equipped ?? {},
  }
  return {
    ...defaultGamification(),
    ...g,
    activeDates: g.activeDates ?? [],
    profile,
  }
}

export function saveGamification(state: GamificationState): void {
  writeJson(GAMIFICATION_KEY, state)
}

export function loadStruggles(): StruggleState {
  const s = readJson(STRUGGLES_KEY, defaultStruggles)
  return { ...defaultStruggles(), ...s, skills: s.skills ?? {} }
}

export function saveStruggles(state: StruggleState): void {
  writeJson(STRUGGLES_KEY, state)
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

export function loadSettings(): SettingsState {
  const merged = { ...defaultSettings(), ...readJson(SETTINGS_KEY, defaultSettings) }
  if (!isTheme(merged.theme)) {
    merged.theme = DEFAULT_THEME
  }
  return merged
}

export function saveSettings(state: SettingsState): void {
  writeJson(SETTINGS_KEY, state)
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

export type OverallReviewSession = {
  problem: GeneratedProblem
  answer: AnswerValue
  feedback:
    | { kind: 'idle' }
    | { kind: 'incorrect'; reason: string; title: string; shake?: boolean }
    | { kind: 'correct'; explanation: string }
  inputLocked: boolean
  wrongLine: { slope: number; intercept: number } | null
  attempted: number
  correctCount: number
  coinsEarned: number
  correctStreak: number
  streaks: Record<string, number>
  mastered: string[]
  recentPrompts: string[]
}

function readSessionJson<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function saveOverallReviewSession(session: OverallReviewSession): void {
  sessionStorage.setItem(OVERALL_REVIEW_SESSION_KEY, JSON.stringify(session))
}

export function loadOverallReviewSession(): OverallReviewSession | null {
  return readSessionJson<OverallReviewSession>(OVERALL_REVIEW_SESSION_KEY)
}

export function clearOverallReviewSession(): void {
  sessionStorage.removeItem(OVERALL_REVIEW_SESSION_KEY)
}

export type PracticeTestSession = {
  phase: 'results'
  problems: GeneratedProblem[]
  answers: (AnswerValue | null)[]
  results: boolean[]
  expanded: number[]
  current: number
  count: number
  selected: string[]
}

export function savePracticeTestSession(session: PracticeTestSession): void {
  sessionStorage.setItem(PRACTICE_TEST_SESSION_KEY, JSON.stringify(session))
}

export function loadPracticeTestSession(): PracticeTestSession | null {
  return readSessionJson<PracticeTestSession>(PRACTICE_TEST_SESSION_KEY)
}

export function clearPracticeTestSession(): void {
  sessionStorage.removeItem(PRACTICE_TEST_SESSION_KEY)
}

export function clearAllLocalData(): void {
  localStorage.removeItem(PROGRESS_KEY)
  localStorage.removeItem(GAMIFICATION_KEY)
  localStorage.removeItem(STRUGGLES_KEY)
  localStorage.removeItem(SEEN_MINI_LESSONS_KEY)
  localStorage.removeItem(DEBUG_KEY)
  localStorage.removeItem(VARIANTS_KEY)
  // WELCOME_KEY intentionally preserved: onboarding state, not user progress.
}

export { PROGRESS_KEY, GAMIFICATION_KEY, STRUGGLES_KEY }
export type { DebugState, SettingsState }
