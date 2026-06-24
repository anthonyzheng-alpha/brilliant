import { useCallback, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Lesson, Problem, AnswerValue } from '../../types/content'
import { RichText } from '../common/RichText'
import { ProblemRenderer, initialAnswer } from '../problems/ProblemRenderer'
import { ProblemVisual } from '../widgets/ProblemVisual'
import { FeedbackPanel } from './FeedbackPanel'
import { MiniLessonView } from './MiniLessonView'
import { isAnswerValid, hasValidInput } from '../../lib/validation'
import { resolveWrongLine, resolveWrongReason } from '../../lib/problemFeedback'
import { isMiniLessonSeen, markMiniLessonSeen } from '../../lib/storage'
import { useProgressStore } from '../../stores/progressStore'
import { useGamificationStore } from '../../stores/gamificationStore'
import { useAuthStore } from '../../stores/authStore'
import { FEATURES } from '../../lib/features'
import { saveUserProgress, saveUserGamification } from '../../lib/syncProgress'
import { getAllLessonsForCourse, roundSize } from '../../content'
import './LessonPlayer.css'

type Props = {
  courseId: string
  courseSlug: string
  lesson: Lesson
  problems: Problem[]
  unitId?: string
  unitLessonIds?: string[]
  initialProblemIndex?: number
}

function getRoundIndexForProblem(lesson: Lesson, problemIndex: number): number {
  let start = 0
  for (let i = 0; i < lesson.rounds.length; i++) {
    const size = roundSize(lesson.rounds[i])
    if (problemIndex >= start && problemIndex < start + size) return i
    start += size
  }
  return Math.max(0, lesson.rounds.length - 1)
}

function getRoundStartIndex(lesson: Lesson, roundIdx: number): number {
  let start = 0
  for (let i = 0; i < roundIdx; i++) start += roundSize(lesson.rounds[i])
  return start
}

function roundHasUnseenMiniLesson(lesson: Lesson, roundIdx: number): boolean {
  const round = lesson.rounds[roundIdx]
  return Boolean(round?.miniLesson) && !isMiniLessonSeen(round.id)
}

export function LessonPlayer({
  courseId,
  courseSlug,
  lesson,
  problems,
  unitId,
  unitLessonIds,
  initialProblemIndex = 0,
}: Props) {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const setResume = useProgressStore((s) => s.setResumePoint)
  const markComplete = useProgressStore((s) => s.markLessonComplete)
  const recordActivity = useGamificationStore((s) => s.recordActivity)
  const onLessonMastered = useGamificationStore((s) => s.onLessonMastered)
  const gamification = useGamificationStore((s) => s.gamification)

  const [problemIndex, setProblemIndex] = useState(initialProblemIndex)
  const [answer, setAnswer] = useState<AnswerValue | null>(() =>
    problems[initialProblemIndex] ? initialAnswer(problems[initialProblemIndex]) : null,
  )
  const [hintsRevealed, setHintsRevealed] = useState(0)
  const [feedback, setFeedback] = useState<
    | { kind: 'idle' }
    | { kind: 'incorrect'; reason: string; shake?: boolean }
    | { kind: 'correct'; explanation: string }
    | { kind: 'complete'; lessonTitle: string }
    | { kind: 'milestone'; lessonTitle: string }
    | { kind: 'round-complete'; roundLabel: string; nextLabel: string }
  >({ kind: 'idle' })
  const [inputLocked, setInputLocked] = useState(false)
  const [showMilestoneModal, setShowMilestoneModal] = useState(false)
  const [wrongLine, setWrongLine] = useState<{ slope: number; intercept: number } | null>(null)
  // Furthest problem the learner has reached; persisted progress never drops below this.
  const [maxProblemIndex, setMaxProblemIndex] = useState(initialProblemIndex)
  const maxIndexRef = useRef(initialProblemIndex)
  // Round index whose mini-lesson is currently shown (null = show problems normally).
  const [miniLessonRoundIdx, setMiniLessonRoundIdx] = useState<number | null>(() => {
    const ri = getRoundIndexForProblem(lesson, initialProblemIndex)
    return roundHasUnseenMiniLesson(lesson, ri) ? ri : null
  })

  const rounds = useMemo(() => {
    let startIndex = 0
    return lesson.rounds.map((round) => {
      const size = roundSize(round)
      const info = {
        id: round.id,
        label: round.label,
        size,
        startIndex,
        endIndex: startIndex + size - 1,
      }
      startIndex += size
      return info
    })
  }, [lesson.rounds])

  const roundIndexOf = useCallback(
    (idx: number) => {
      const found = rounds.findIndex((r) => idx >= r.startIndex && idx <= r.endIndex)
      return found === -1 ? 0 : found
    },
    [rounds],
  )

  const problem = problems[problemIndex]
  const total = problems.length
  const currentRoundIndex = roundIndexOf(problemIndex)
  const currentRound = rounds[currentRoundIndex]

  const persistProgress = useCallback(
    async (idx: number) => {
      const newMax = Math.max(maxIndexRef.current, idx)
      maxIndexRef.current = newMax
      setMaxProblemIndex(newMax)
      setResume(courseId, lesson.id, newMax)
      if (user) {
        const progress = useProgressStore.getState().progress
        await saveUserProgress(user.uid, progress)
      }
    },
    [courseId, lesson.id, setResume, user],
  )

  const handleCheck = async () => {
    if (!problem || !answer || feedback.kind === 'correct') return
    if (!hasValidInput(problem, answer)) return

    if (isAnswerValid(problem, answer)) {
      setInputLocked(true)
      setFeedback({ kind: 'correct', explanation: problem.explanation })

      if (FEATURES.gamification) {
        recordActivity()
        if (user) {
          const g = useGamificationStore.getState().gamification
          await saveUserGamification(user.uid, g)
        }
      }
    } else {
      setWrongLine(resolveWrongLine(problem, answer))
      setFeedback({
        kind: 'incorrect',
        reason: resolveWrongReason(problem, answer),
        shake: true,
      })
      setTimeout(() => setFeedback((f) => (f.kind === 'incorrect' ? { ...f, shake: false } : f)), 400)
    }
  }

  const handleAnswerChange = useCallback((next: AnswerValue) => {
    setWrongLine(null)
    setAnswer(next)
  }, [])

  const goToProblem = useCallback(
    async (nextIndex: number) => {
      setProblemIndex(nextIndex)
      setAnswer(initialAnswer(problems[nextIndex]))
      setHintsRevealed(0)
      setWrongLine(null)
      setFeedback({ kind: 'idle' })
      setInputLocked(false)
      // Show the round's mini-lesson the first time the learner lands on its first problem.
      const newRoundIdx = getRoundIndexForProblem(lesson, nextIndex)
      if (
        nextIndex === getRoundStartIndex(lesson, newRoundIdx) &&
        roundHasUnseenMiniLesson(lesson, newRoundIdx)
      ) {
        setMiniLessonRoundIdx(newRoundIdx)
      }
      await persistProgress(nextIndex)
    },
    [problems, persistProgress, lesson],
  )

  const handleStartRound = () => {
    if (miniLessonRoundIdx !== null) {
      markMiniLessonSeen(lesson.rounds[miniLessonRoundIdx].id)
    }
    setMiniLessonRoundIdx(null)
  }

  const handleContinue = async () => {
    const nextIndex = problemIndex + 1
    // Reviewing an already-reached problem: just move forward without re-running
    // checkpoints/mastery (those only fire when advancing the frontier).
    if (nextIndex <= maxIndexRef.current) {
      await goToProblem(nextIndex)
      return
    }
    if (nextIndex >= total) {
      markComplete(courseId, lesson.id)
      if (user) {
        await saveUserProgress(user.uid, useProgressStore.getState().progress)
      }

      if (FEATURES.gamification) {
        const courseLessonIds = getAllLessonsForCourse(courseId).map((l) => l.id)
        onLessonMastered(lesson.id, unitId, unitLessonIds, courseId, courseLessonIds)
        if (user) {
          await saveUserGamification(user.uid, useGamificationStore.getState().gamification)
        }
        setShowMilestoneModal(true)
        setFeedback({ kind: 'milestone', lessonTitle: lesson.title })
      } else {
        setFeedback({ kind: 'complete', lessonTitle: lesson.title })
      }
      return
    }

    const round = rounds[currentRoundIndex]
    const nextRound = rounds[currentRoundIndex + 1]
    if (round && nextRound && problemIndex === round.endIndex) {
      await persistProgress(nextIndex)
      setInputLocked(false)
      setFeedback({
        kind: 'round-complete',
        roundLabel: round.label,
        nextLabel: nextRound.label,
      })
      return
    }

    await goToProblem(nextIndex)
  }

  const handleRoundContinue = async () => {
    await goToProblem(problemIndex + 1)
  }

  const handleBack = async () => {
    if (problemIndex > 0) await goToProblem(problemIndex - 1)
  }

  const handleForward = async () => {
    if (problemIndex < maxIndexRef.current) await goToProblem(problemIndex + 1)
  }

  const handleRetryRound = async () => {
    await goToProblem(currentRound ? currentRound.startIndex : 0)
  }

  const handleHint = () => {
    if (!problem) return
    setHintsRevealed((n) => Math.min(n + 1, problem.hints.length))
  }

  const finishLesson = () => {
    navigate(`/courses/${courseSlug}`)
  }

  if (!problem) {
    return <p>Lesson not found.</p>
  }

  if (miniLessonRoundIdx !== null && lesson.rounds[miniLessonRoundIdx]?.miniLesson) {
    return (
      <div className="lesson-player">
        <MiniLessonView
          roundLabel={lesson.rounds[miniLessonRoundIdx].label}
          roundNumber={miniLessonRoundIdx + 1}
          totalRounds={lesson.rounds.length}
          miniLesson={lesson.rounds[miniLessonRoundIdx].miniLesson!}
          onStart={handleStartRound}
        />
      </div>
    )
  }

  return (
    <div className="lesson-player">
      <div className="lesson-player__progress">
        <div
          className="lesson-player__progress-fill"
          style={{ width: `${((problemIndex + 1) / total) * 100}%` }}
        />
        <span className="lesson-player__progress-text">
          {currentRound
            ? `${currentRound.label} · Round ${currentRoundIndex + 1} of ${rounds.length} · Problem ${
                problemIndex - currentRound.startIndex + 1
              } of ${currentRound.size}`
            : `Problem ${problemIndex + 1} of ${total}`}
        </span>
      </div>

      <div className="lesson-player__layout">
        <div className="lesson-player__main">
          <div className="lesson-player__nav">
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={handleBack}
              disabled={problemIndex === 0}
            >
              ← Previous
            </button>
            {problemIndex < maxProblemIndex && (
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={handleForward}
              >
                Next →
              </button>
            )}
          </div>

          <div className="lesson-player__prompt">
            <RichText text={problem.prompt} />
          </div>

          <ProblemVisual problem={problem} answer={answer} wrongLine={wrongLine} />

          <ProblemRenderer
            key={problem.id}
            problem={problem}
            answer={answer}
            onAnswerChange={handleAnswerChange}
            disabled={inputLocked}
          />

          {feedback.kind !== 'correct' &&
            feedback.kind !== 'complete' &&
            feedback.kind !== 'milestone' &&
            feedback.kind !== 'round-complete' && (
              <div className="lesson-player__actions">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={handleHint}
                  disabled={hintsRevealed >= problem.hints.length}
                >
                  {hintsRevealed >= problem.hints.length
                    ? 'No more hints'
                    : hintsRevealed === 0
                      ? 'Hint'
                      : 'Next hint'}
                </button>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={handleCheck}
                  disabled={!hasValidInput(problem, answer)}
                >
                  Check
                </button>
              </div>
            )}

        </div>

        <div className="lesson-player__side">
          <aside
            className={`lesson-player__hints ${
              hintsRevealed > 0 ? '' : 'lesson-player__hints--empty'
            }`}
            aria-live="polite"
          >
            <p className="lesson-player__hints-title">Hints</p>
            {hintsRevealed === 0 ? (
              <p className="lesson-player__hints-empty">
                Stuck? Tap <strong>Hint</strong> for a nudge.
              </p>
            ) : (
              <ol className="lesson-player__hints-list">
                {problem.hints.slice(0, hintsRevealed).map((hint, i) => (
                  <li key={i}>
                    <RichText text={hint} />
                  </li>
                ))}
              </ol>
            )}
          </aside>

          {(feedback.kind === 'incorrect' ||
            feedback.kind === 'correct' ||
            feedback.kind === 'round-complete') && (
            <FeedbackPanel
              state={feedback}
              onContinue={
                feedback.kind === 'round-complete' ? handleRoundContinue : handleContinue
              }
              onRetryRound={feedback.kind === 'round-complete' ? handleRetryRound : undefined}
            />
          )}
        </div>
      </div>

      {showMilestoneModal && FEATURES.gamification && (
        <div className="milestone-modal-overlay" role="dialog" aria-modal="true">
          <div className="milestone-modal">
            <p className="milestone-modal__emoji" aria-hidden>
              ★
            </p>
            <h2>You mastered {lesson.title}!</h2>
            <p>Streak: {gamification.currentStreak} day{gamification.currentStreak !== 1 ? 's' : ''}</p>
            <button type="button" className="btn btn--primary" onClick={finishLesson}>
              Continue
            </button>
          </div>
        </div>
      )}

      {!FEATURES.gamification && feedback.kind === 'complete' && (
        <FeedbackPanel state={feedback} onContinue={finishLesson} />
      )}
    </div>
  )
}
