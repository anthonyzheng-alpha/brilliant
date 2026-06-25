import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { AnswerValue, ProblemType } from '../../types/content'
import { RichText } from '../common/RichText'
import { ProblemRenderer, initialAnswer } from '../problems/ProblemRenderer'
import { ProblemVisual } from '../widgets/ProblemVisual'
import { FeedbackPanel } from '../lesson/FeedbackPanel'
import { isAnswerValid, hasValidInput } from '../../lib/validation'
import { resolveWrongLine, resolveWrongReason } from '../../lib/problemFeedback'
import { useAuthStore } from '../../stores/authStore'
import { useStruggleStore } from '../../stores/struggleStore'
import { useSettingsStore } from '../../stores/settingsStore'
import {
  generateReviewProblem,
  normalizePrompt,
  GENERATABLE_TYPES,
  type GeneratableType,
  type GenerateRequest,
  type GeneratedProblem,
} from '../../lib/ai'
import { getLessonById, getLessonLocation, problemBank } from '../../content'
import { saveUserStruggles } from '../../lib/syncProgress'
import '../lesson/LessonPlayer.css'

type Props = {
  coveredLessonIds: string[]
}

const MASTERY_STREAK = 3

function skillKey(lessonId: string, roundId: string, type: ProblemType): string {
  return `${lessonId}::${roundId}::${type}`
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

// Pull the difficulty label, mini-lesson description, and a couple of authored
// example prompts for a specific round so the generator can match that band.
function roundContext(
  lessonId: string,
  roundId: string,
  problemType: ProblemType,
): { difficultyLabel?: string; difficultyNote?: string; examples: string[] } {
  const lesson = getLessonById(lessonId)
  const round = roundId ? lesson?.rounds.find((r) => r.id === roundId) : undefined
  if (!round) return { examples: [] }
  const note = round.miniLesson
    ? `${round.miniLesson.title ? `${round.miniLesson.title}: ` : ''}${round.miniLesson.paragraph}`
    : undefined
  const pool = round.problemIds.map((pid) => problemBank[pid]).filter(Boolean)
  const preferred = pool.filter((p) => p.type === problemType)
  const examples = (preferred.length > 0 ? preferred : pool).slice(0, 2).map((p) => p.prompt)
  return { difficultyLabel: round.label, difficultyNote: note, examples }
}

function roundLabelFor(lessonId: string, roundId: string): string | undefined {
  if (!roundId) return undefined
  return getLessonById(lessonId)?.rounds.find((r) => r.id === roundId)?.label
}

export function OverallReviewPlayer({ coveredLessonIds }: Props) {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const recordAttempt = useStruggleStore((s) => s.recordAttempt)
  const getWeakSkills = useStruggleStore((s) => s.getWeakSkills)
  const getAttemptedSkills = useStruggleStore((s) => s.getAttemptedSkills)
  const aiEnabled = useSettingsStore((s) => s.aiEnabled)

  const [problem, setProblem] = useState<GeneratedProblem | null>(null)
  const [answer, setAnswer] = useState<AnswerValue | null>(null)
  const [inputLocked, setInputLocked] = useState(false)
  const [wrongLine, setWrongLine] = useState<{ slope: number; intercept: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [attempted, setAttempted] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [ended, setEnded] = useState(false)
  const [feedback, setFeedback] = useState<
    | { kind: 'idle' }
    | { kind: 'incorrect'; reason: string; shake?: boolean }
    | { kind: 'correct'; explanation: string }
  >({ kind: 'idle' })

  // In-session adaptivity: per-skill correct streak + topics mastered this session.
  const streaksRef = useRef<Record<string, number>>({})
  const masteredRef = useRef<Set<string>>(new Set())
  // Prefetched next problem so latency is hidden while the learner answers.
  const nextRef = useRef<Promise<GeneratedProblem> | null>(null)
  // Normalized prompts of the last few shown problems, to avoid repeats.
  const recentPromptsRef = useRef<string[]>([])

  // Choose the next generation target from current weak spots (live-updating),
  // skipping topics mastered this session; falls back to random covered topics.
  const pickTarget = useCallback((): GenerateRequest => {
    const weakAll = getWeakSkills(coveredLessonIds).filter(
      (w) => !masteredRef.current.has(w.key),
    )
    const weakGeneratable = weakAll.filter((w) =>
      (GENERATABLE_TYPES as ProblemType[]).includes(w.problemType),
    )

    let lessonId: string
    let roundId = ''
    let problemType: GeneratableType

    if (weakGeneratable.length > 0) {
      // Weight toward the most-missed skills.
      const picked = pick(weakGeneratable.slice(0, 3))
      lessonId = picked.lessonId
      roundId = picked.roundId
      problemType = picked.problemType as GeneratableType
    } else if (weakAll.length > 0) {
      // Weak topic exists but not in a type we generate; reuse the topic + round.
      lessonId = weakAll[0].lessonId
      roundId = weakAll[0].roundId
      problemType = pick(GENERATABLE_TYPES)
    } else {
      // Everything mastered: draw randomly, but only from rounds the learner has
      // actually reached and attempted (never locked or unseen content).
      const attemptedGeneratable = getAttemptedSkills(coveredLessonIds).filter((w) =>
        (GENERATABLE_TYPES as ProblemType[]).includes(w.problemType),
      )
      if (attemptedGeneratable.length > 0) {
        const picked = pick(attemptedGeneratable)
        lessonId = picked.lessonId
        roundId = picked.roundId
        problemType = picked.problemType as GeneratableType
      } else {
        lessonId = pick(coveredLessonIds)
        problemType = pick(GENERATABLE_TYPES)
      }
    }

    const loc = getLessonLocation(lessonId)
    const recentMistakes = weakGeneratable
      .slice(0, 2)
      .map((w) => {
        const title = getLessonLocation(w.lessonId)?.lessonTitle
        if (!title) return undefined
        const label = roundLabelFor(w.lessonId, w.roundId)
        return label ? `${title} (${label})` : title
      })
      .filter((t): t is string => Boolean(t))

    const { difficultyLabel, difficultyNote, examples } = roundContext(
      lessonId,
      roundId,
      problemType,
    )

    return {
      lessonId,
      roundId,
      problemType,
      topic: loc?.lessonTitle ?? lessonId,
      recentMistakes,
      difficultyLabel,
      difficultyNote,
      examples,
      useAi: aiEnabled,
    }
  }, [coveredLessonIds, getWeakSkills, getAttemptedSkills, aiEnabled])

  // Generate a problem that is not a repeat of the last few shown. Retries with a
  // fresh target a couple of times, then accepts the last candidate regardless.
  const generateDistinct = useCallback(async (): Promise<GeneratedProblem> => {
    const avoid = recentPromptsRef.current
    let candidate = await generateReviewProblem({ ...pickTarget(), avoidPrompts: avoid })
    for (let i = 0; i < 2 && avoid.includes(normalizePrompt(candidate.prompt)); i++) {
      candidate = await generateReviewProblem({ ...pickTarget(), avoidPrompts: avoid })
    }
    return candidate
  }, [pickTarget])

  const prefetchNext = useCallback(() => {
    nextRef.current = generateDistinct()
  }, [generateDistinct])

  const showProblem = useCallback((next: GeneratedProblem) => {
    // Remember the prompt so upcoming generations avoid repeating it.
    recentPromptsRef.current = [
      ...recentPromptsRef.current,
      normalizePrompt(next.prompt),
    ].slice(-3)
    setProblem(next)
    setAnswer(initialAnswer(next))
    setInputLocked(false)
    setWrongLine(null)
    setFeedback({ kind: 'idle' })
  }, [])

  // First problem on mount. `loading` already starts true, so we only flip it
  // off once the async generation resolves (avoids a synchronous setState here).
  useEffect(() => {
    let active = true
    generateDistinct().then((first) => {
      if (!active) return
      showProblem(first)
      setLoading(false)
      prefetchNext()
    })
    return () => {
      active = false
    }
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAnswerChange = useCallback((next: AnswerValue) => {
    setWrongLine(null)
    setAnswer(next)
  }, [])

  const handleCheck = () => {
    if (!problem || !answer || feedback.kind === 'correct') return
    if (!hasValidInput(problem, answer)) return

    const correct = isAnswerValid(problem, answer)
    const key = skillKey(problem.reviewRef, problem.reviewRoundId, problem.type)

    recordAttempt(problem.reviewRef, problem.reviewRoundId, problem.type, correct)
    if (user) {
      void saveUserStruggles(user.uid, useStruggleStore.getState().struggles)
    }
    setAttempted((n) => n + 1)

    if (correct) {
      const streak = (streaksRef.current[key] ?? 0) + 1
      streaksRef.current[key] = streak
      if (streak >= MASTERY_STREAK) masteredRef.current.add(key)
      setCorrectCount((n) => n + 1)
      setInputLocked(true)
      setFeedback({ kind: 'correct', explanation: problem.explanation })
    } else {
      // Struggling again: reset streak and re-open the topic for targeting.
      streaksRef.current[key] = 0
      masteredRef.current.delete(key)
      setWrongLine(resolveWrongLine(problem, answer))
      setFeedback({
        kind: 'incorrect',
        reason: resolveWrongReason(problem, answer),
        shake: true,
      })
      setTimeout(
        () => setFeedback((f) => (f.kind === 'incorrect' ? { ...f, shake: false } : f)),
        400,
      )
    }
  }

  const handleContinue = async () => {
    setLoading(true)
    const promise = nextRef.current ?? generateDistinct()
    nextRef.current = null
    const next = await promise
    showProblem(next)
    setLoading(false)
    // Queue the following problem using the now-updated weak profile.
    prefetchNext()
  }

  const endReview = () => {
    setEnded(true)
  }

  if (ended) {
    return (
      <div className="lesson-player">
        <div className="feedback feedback--complete">
          <p className="feedback__title">Review session complete</p>
          <p className="feedback__body">
            You answered {correctCount} of {attempted} correctly.
          </p>
          <div className="feedback__actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => navigate('/')}
            >
              Back home
            </button>
          </div>
        </div>
      </div>
    )
  }

  const reviewLoc = problem ? getLessonLocation(problem.reviewRef) : undefined
  const reviewRoundLabel = problem
    ? roundLabelFor(problem.reviewRef, problem.reviewRoundId)
    : undefined
  const reviewRef =
    reviewLoc && reviewLoc.courseSlug
      ? {
          to: `/courses/${reviewLoc.courseSlug}/lessons/${reviewLoc.lessonId}`,
          lessonTitle: reviewRoundLabel
            ? `${reviewLoc.lessonTitle} — ${reviewRoundLabel}`
            : reviewLoc.lessonTitle,
        }
      : undefined

  return (
    <div className="lesson-player">
      <p className="lesson-player__review-status">
        Overall Review · {attempted} answered · {correctCount} correct
      </p>

      {loading || !problem ? (
        <div className="lesson-player__layout">
          <div className="lesson-player__main">
            <p className="lesson-player__prompt">Generating your next problem…</p>
          </div>
        </div>
      ) : (
        <div className="lesson-player__layout">
          <div className="lesson-player__main">
            <div className="lesson-player__prompt">
              <RichText text={problem.prompt} />
            </div>

            <ProblemVisual problem={problem} answer={answer} wrongLine={wrongLine} />

            <ProblemRenderer
              key={problem.id}
              problem={problem}
              answer={answer}
              onAnswerChange={handleAnswerChange}
              onSubmit={handleCheck}
              disabled={inputLocked}
            />

            {feedback.kind !== 'correct' && (
              <div className="lesson-player__actions">
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={handleCheck}
                  disabled={!hasValidInput(problem, answer)}
                >
                  Check
                </button>
                <button type="button" className="btn btn--ghost" onClick={endReview}>
                  End review
                </button>
              </div>
            )}
          </div>

          <div className="lesson-player__side">
            {(feedback.kind === 'incorrect' || feedback.kind === 'correct') && (
              <FeedbackPanel
                state={feedback}
                onContinue={handleContinue}
                reviewRef={feedback.kind === 'incorrect' ? reviewRef : undefined}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
