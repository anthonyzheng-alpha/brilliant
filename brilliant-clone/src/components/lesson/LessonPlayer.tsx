import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Lesson, Problem, AnswerValue } from '../../types/content'
import { RichText } from '../common/RichText'
import { ProblemRenderer, initialAnswer } from '../problems/ProblemRenderer'
import { ProblemVisual } from '../widgets/ProblemVisual'
import { FeedbackPanel } from './FeedbackPanel'
import { isAnswerValid, hasValidInput } from '../../lib/validation'
import { useProgressStore } from '../../stores/progressStore'
import { useGamificationStore } from '../../stores/gamificationStore'
import { useAuthStore } from '../../stores/authStore'
import { FEATURES } from '../../lib/features'
import { saveUserProgress, saveUserGamification } from '../../lib/syncProgress'
import { getAllLessonsForCourse } from '../../content'
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
  const [attempts, setAttempts] = useState(0)
  const [feedback, setFeedback] = useState<
    | { kind: 'idle' }
    | { kind: 'hint'; hint: string }
    | { kind: 'incorrect'; hint: string; shake?: boolean }
    | { kind: 'correct'; explanation: string }
    | { kind: 'complete'; lessonTitle: string }
    | { kind: 'milestone'; lessonTitle: string }
  >({ kind: 'idle' })
  const [inputLocked, setInputLocked] = useState(false)
  const [showMilestoneModal, setShowMilestoneModal] = useState(false)

  const problem = problems[problemIndex]
  const total = problems.length

  const persistProgress = useCallback(
    async (idx: number) => {
      setResume(courseId, lesson.id, idx)
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
      const hintIndex = Math.min(attempts, 2)
      setAttempts((a) => a + 1)
      setFeedback({
        kind: 'incorrect',
        hint: problem.hints[hintIndex],
        shake: true,
      })
      setTimeout(() => setFeedback((f) => (f.kind === 'incorrect' ? { ...f, shake: false } : f)), 400)
    }
  }

  const handleContinue = async () => {
    const nextIndex = problemIndex + 1
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

    setProblemIndex(nextIndex)
    setAnswer(initialAnswer(problems[nextIndex]))
    setAttempts(0)
    setFeedback({ kind: 'idle' })
    setInputLocked(false)
    await persistProgress(nextIndex)
  }

  const handleHint = () => {
    if (!problem) return
    const hintIndex = Math.min(attempts, 2)
    setAttempts((a) => a + 1)
    setFeedback({ kind: 'hint', hint: problem.hints[hintIndex] })
  }

  const finishLesson = () => {
    navigate(`/courses/${courseSlug}`)
  }

  if (!problem) {
    return <p>Lesson not found.</p>
  }

  return (
    <div className="lesson-player">
      <div className="lesson-player__progress">
        <div
          className="lesson-player__progress-fill"
          style={{ width: `${((problemIndex + 1) / total) * 100}%` }}
        />
        <span className="lesson-player__progress-text">
          Problem {problemIndex + 1} of {total}
        </span>
      </div>

      <div className="lesson-player__prompt">
        <RichText text={problem.prompt} />
      </div>

      <ProblemVisual problem={problem} answer={answer} />

      <ProblemRenderer
        key={problem.id}
        problem={problem}
        answer={answer}
        onAnswerChange={setAnswer}
        disabled={inputLocked}
      />

      {feedback.kind !== 'correct' &&
        feedback.kind !== 'complete' &&
        feedback.kind !== 'milestone' && (
          <div className="lesson-player__actions">
            <button type="button" className="btn btn--ghost" onClick={handleHint}>
              Hint
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

      <FeedbackPanel
        state={
          feedback.kind === 'milestone' || feedback.kind === 'complete'
            ? { kind: 'idle' }
            : feedback
        }
        onContinue={handleContinue}
      />

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
