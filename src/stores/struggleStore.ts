import { create } from 'zustand'
import type { ProblemType, SkillStat, StruggleState } from '../types/content'
import { loadStruggles, saveStruggles } from '../lib/storage'

export type WeakSkill = {
  key: string
  lessonId: string
  roundId: string
  problemType: ProblemType
  attempts: number
  incorrect: number
  incorrectRate: number
}

function skillKey(lessonId: string, roundId: string, problemType: ProblemType): string {
  return `${lessonId}::${roundId}::${problemType}`
}

// Parse a skill key, tolerating legacy 2-part keys (`lessonId::problemType`)
// written before per-round tracking; those report an empty roundId.
function parseSkillKey(
  key: string,
): { lessonId: string; roundId: string; problemType: ProblemType } | null {
  const parts = key.split('::')
  if (parts.length === 3) {
    return { lessonId: parts[0], roundId: parts[1], problemType: parts[2] as ProblemType }
  }
  if (parts.length === 2) {
    return { lessonId: parts[0], roundId: '', problemType: parts[1] as ProblemType }
  }
  return null
}

// A skill must have been attempted at least this many times before it counts as
// a meaningful "weak spot" worth targeting.
const MIN_ATTEMPTS = 1

type StruggleStore = {
  struggles: StruggleState
  hydrate: () => void
  setFromRemote: (state: StruggleState) => void
  recordAttempt: (
    lessonId: string,
    roundId: string,
    problemType: ProblemType,
    wasCorrect: boolean,
  ) => void
  getWeakSkills: (coveredLessonIds: string[]) => WeakSkill[]
  getAttemptedSkills: (coveredLessonIds: string[]) => WeakSkill[]
  getAttemptedLessonIds: () => string[]
}

export const useStruggleStore = create<StruggleStore>((set, get) => ({
  struggles: loadStruggles(),

  hydrate: () => set({ struggles: loadStruggles() }),

  setFromRemote: (state) => {
    saveStruggles(state)
    set({ struggles: state })
  },

  recordAttempt: (lessonId, roundId, problemType, wasCorrect) => {
    if (!lessonId) return
    const struggles = { ...get().struggles, skills: { ...get().struggles.skills } }
    const key = skillKey(lessonId, roundId, problemType)
    const prev: SkillStat = struggles.skills[key] ?? {
      attempts: 0,
      incorrect: 0,
      lastSeenISO: '',
    }
    struggles.skills[key] = {
      attempts: prev.attempts + 1,
      incorrect: prev.incorrect + (wasCorrect ? 0 : 1),
      lastSeenISO: new Date().toISOString(),
    }
    saveStruggles(struggles)
    set({ struggles })
  },

  getWeakSkills: (coveredLessonIds) => {
    const covered = new Set(coveredLessonIds)
    const skills = get().struggles.skills
    const weak: WeakSkill[] = []
    for (const [key, stat] of Object.entries(skills)) {
      const parsed = parseSkillKey(key)
      if (!parsed) continue
      const { lessonId, roundId, problemType } = parsed
      if (!covered.has(lessonId)) continue
      if (stat.attempts < MIN_ATTEMPTS || stat.incorrect === 0) continue
      weak.push({
        key,
        lessonId,
        roundId,
        problemType,
        attempts: stat.attempts,
        incorrect: stat.incorrect,
        incorrectRate: stat.incorrect / stat.attempts,
      })
    }
    // Most-missed first: rank by incorrect rate, then raw miss count.
    weak.sort((a, b) =>
      b.incorrectRate - a.incorrectRate || b.incorrect - a.incorrect,
    )
    return weak
  },

  // Every round-skill the learner has actually attempted in a covered lesson,
  // mastered or not. Used as the random pool when there are no weak spots, so the
  // review only draws from content the learner has reached (never locked / unseen).
  getAttemptedSkills: (coveredLessonIds) => {
    const covered = new Set(coveredLessonIds)
    const skills = get().struggles.skills
    const attempted: WeakSkill[] = []
    for (const [key, stat] of Object.entries(skills)) {
      const parsed = parseSkillKey(key)
      if (!parsed) continue
      const { lessonId, roundId, problemType } = parsed
      if (!covered.has(lessonId)) continue
      if (stat.attempts < MIN_ATTEMPTS) continue
      attempted.push({
        key,
        lessonId,
        roundId,
        problemType,
        attempts: stat.attempts,
        incorrect: stat.incorrect,
        incorrectRate: stat.incorrect / stat.attempts,
      })
    }
    return attempted
  },

  // Unique lesson ids the learner has ever attempted. The struggle store is the
  // exact record of attempts, so this captures lessons that were reached but
  // never advanced past (e.g. answered wrong on the very first problem), which
  // progress-based "covered" tracking misses.
  getAttemptedLessonIds: () => {
    const ids = new Set<string>()
    for (const key of Object.keys(get().struggles.skills)) {
      const parsed = parseSkillKey(key)
      if (parsed) ids.add(parsed.lessonId)
    }
    return [...ids]
  },
}))
