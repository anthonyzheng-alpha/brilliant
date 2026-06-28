import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { AnswerValue, Problem } from '../../types/content'
import { RichText } from '../common/RichText'
import { ProblemRenderer, initialAnswer } from '../problems/ProblemRenderer'
import { ProblemVisual } from '../widgets/ProblemVisual'
import { FeedbackPanel } from '../lesson/FeedbackPanel'
import { isAnswerValid, hasValidInput } from '../../lib/validation'
import { resolveWrongLine, resolveWrongReason, resolveIncorrectFeedbackTitle } from '../../lib/problemFeedback'
import { useAuthStore } from '../../stores/authStore'
import { useGamificationStore } from '../../stores/gamificationStore'
import { FEATURES } from '../../lib/features'
import { saveUserGamification } from '../../lib/syncProgress'
import '../lesson/LessonPlayer.css'

type Props = {
  courseSlug: string
  problems: Problem[]
  onNewSet: () => void
}

export function ReviewPlayer({ courseSlug, problems, onNewSet }: Props) {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const recordActivity = useGamificationStore((s) => s.recordActivity)

  const [problemIndex, setProblemIndex] = useState(0)
  const [answer, setAnswer] = useState<AnswerValue | null>(() =>
    problems[0] ? initialAnswer(problems[0]) : null,
  )
  const [hintsRevealed, setHintsRevealed] = useState(0)
  const [inputLocked, setInputLocked] = useState(false)
  const [wrongLine, setWrongLine] = useState<{ slope: number; intercept: number } | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [finished, setFinished] = useState(false)
  const [feedback, setFeedback] = useState<
    | { kind: 'idle' }
    | { kind: 'incorrect'; reason: string; title: string; shake?: boolean }
    | { kind: 'correct'; explanation: string }
  >({ kind: 'idle' })

  const problem = problems[problemIndex]
  const total = problems.length

  const handleAnswerChange = useCallback((next: AnswerValue) => {
    setWrongLine(null)
    setAnswer(next)
  }, [])

  const handleCheck = async () => {
    if (!problem || !answer || feedback.kind === 'correct') return
    if (!hasValidInput(problem, answer)) return

    if (isAnswerValid(problem, answer)) {
      setInputLocked(true)
      setCorrectCount((n) => n + 1)
      setFeedback({ kind: 'correct', explanation: problem.explanation })
    } else {
      setWrongLine(resolveWrongLine(problem, answer))
      setFeedback({
        kind: 'incorrect',
        reason: resolveWrongReason(problem, answer),
        title: resolveIncorrectFeedbackTitle(problem, answer),
        shake: true,
      })
      setTimeout(
        () => setFeedback((f) => (f.kind === 'incorrect' ? { ...f, shake: false } : f)),
        400,
      )
    }
  }

  const handleContinue = async () => {
    const nextIndex = problemIndex + 1
    if (nextIndex >= total) {
      if (FEATURES.gamification) {
        recordActivity()
        if (user) {
          await saveUserGamification(user.uid, useGamificationStore.getState().gamification)
        }
      }
      setFinished(true)
      return
    }
    setProblemIndex(nextIndex)
    setAnswer(initialAnswer(problems[nextIndex]))
    setHintsRevealed(0)
    setWrongLine(null)
    setInputLocked(false)
    setFeedback({ kind: 'idle' })
  }

  const handleHint = () => {
    if (!problem) return
    setHintsRevealed((n) => Math.min(n + 1, problem.hints.length))
  }

  if (finished) {
    return (
      <div className="lesson-player">
        <div className="feedback feedback--complete">
          <p className="feedback__title">Review complete!</p>
          <p className="feedback__body">
            You got {correctCount} of {total} correct.
          </p>
          <div className="feedback__actions">
            <button type="button" className="btn btn--primary" onClick={onNewSet}>
              New 5 questions
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => navigate(`/courses/${courseSlug}`)}
            >
              Back to topic
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!problem) {
    return <p>No review questions available.</p>
  }

  return (
    <div className="lesson-player">
      <div className="lesson-player__progress">
        <div
          className="lesson-player__progress-fill"
          style={{ width: `${((problemIndex + 1) / total) * 100}%` }}
        />
        <span className="lesson-player__progress-text">
          Review · Question {problemIndex + 1} of {total}
        </span>
      </div>

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

          {(feedback.kind === 'incorrect' || feedback.kind === 'correct') && (
            <FeedbackPanel state={feedback} onContinue={handleContinue} />
          )}
        </div>
      </div>
    </div>
  )
}
