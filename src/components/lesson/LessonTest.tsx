import { useCallback, useEffect, useRef, useState } from 'react'
import type { AnswerValue, Lesson } from '../../types/content'
import { RichText } from '../common/RichText'
import { ProblemRenderer, initialAnswer } from '../problems/ProblemRenderer'
import { ProblemVisual } from '../widgets/ProblemVisual'
import { FeedbackPanel } from './FeedbackPanel'
import { isAnswerValid, hasValidInput } from '../../lib/validation'
import { resolveWrongLine, resolveWrongReason, resolveIncorrectFeedbackTitle } from '../../lib/problemFeedback'
import { useSettingsStore } from '../../stores/settingsStore'
import { useStruggleStore } from '../../stores/struggleStore'
import { useAuthStore } from '../../stores/authStore'
import {
  generateReviewProblem,
  normalizePrompt,
  type GeneratedProblem,
} from '../../lib/ai'
import { buildTestRequests, type TestTarget } from '../../lib/reviewTargeting'
import { saveUserStruggles } from '../../lib/syncProgress'
import './LessonPlayer.css'

type Props = {
  lesson: Lesson
  onPass: () => void
  onExit: () => void
}

const TEST_QUESTIONS = 5

type Phase = 'loading' | 'taking'

export function LessonTest({ lesson, onPass, onExit }: Props) {
  const aiEnabled = useSettingsStore((s) => s.aiEnabled)
  const recordAttempt = useStruggleStore((s) => s.recordAttempt)
  const user = useAuthStore((s) => s.user)

  const [phase, setPhase] = useState<Phase>('loading')
  const [testFailed, setTestFailed] = useState(false)
  const [generatedCount, setGeneratedCount] = useState(0)
  const [problems, setProblems] = useState<GeneratedProblem[]>([])
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState<AnswerValue | null>(null)
  const [inputLocked, setInputLocked] = useState(false)
  const [wrongLine, setWrongLine] = useState<{ slope: number; intercept: number } | null>(null)
  const [feedback, setFeedback] = useState<
    | { kind: 'idle' }
    | { kind: 'incorrect'; reason: string; title: string; shake?: boolean }
    | { kind: 'correct'; explanation: string }
  >({ kind: 'idle' })

  // Token identifying the latest generate() run. StrictMode double-invokes the
  // mount effect (and "Retry test" can overlap), so stale runs must not commit
  // their results — otherwise a discarded set briefly renders before the real
  // first problem.
  const runIdRef = useRef(0)

  const generate = useCallback(async () => {
    const runId = ++runIdRef.current
    setPhase('loading')
    setGeneratedCount(0)
    const targets: TestTarget[] = lesson.rounds.map((r) => ({
      lessonId: lesson.id,
      roundId: r.id,
    }))
    const requests = buildTestRequests(targets, TEST_QUESTIONS, aiEnabled)
    const generated: GeneratedProblem[] = []
    const seen = new Set<string>()
    for (const req of requests) {
      let problem = await generateReviewProblem({ ...req, avoidPrompts: [...seen] })
      for (let attempt = 0; attempt < 5 && seen.has(normalizePrompt(problem.prompt)); attempt++) {
        problem = await generateReviewProblem({ ...req, avoidPrompts: [...seen] })
      }
      if (runIdRef.current !== runId) return
      generated.push(problem)
      seen.add(normalizePrompt(problem.prompt))
      setGeneratedCount(generated.length)
    }
    if (runIdRef.current !== runId) return
    setProblems(generated)
    setIndex(0)
    setAnswer(generated[0] ? initialAnswer(generated[0]) : null)
    setInputLocked(false)
    setWrongLine(null)
    setFeedback({ kind: 'idle' })
    setTestFailed(false)
    setPhase('taking')
  }, [lesson, aiEnabled])

  useEffect(() => {
    void generate()
  }, [generate])

  const problem = problems[index]

  const handleAnswerChange = useCallback((next: AnswerValue) => {
    setWrongLine(null)
    setAnswer(next)
  }, [])

  const handleCheck = () => {
    if (!problem || !answer || feedback.kind === 'correct') return
    if (!hasValidInput(problem, answer)) return

    const correct = isAnswerValid(problem, answer)
    recordAttempt(lesson.id, problem.reviewRoundId, problem.type, correct)
    if (user) {
      void saveUserStruggles(user.uid, useStruggleStore.getState().struggles)
    }

    if (correct) {
      setInputLocked(true)
      setFeedback({ kind: 'correct', explanation: problem.explanation })
    } else {
      setInputLocked(true)
      setWrongLine(resolveWrongLine(problem, answer))
      setFeedback({
        kind: 'incorrect',
        reason: resolveWrongReason(problem, answer),
        title: resolveIncorrectFeedbackTitle(problem, answer),
        shake: true,
      })
      setTimeout(() => {
        setFeedback((f) => (f.kind === 'incorrect' ? { ...f, shake: false } : f))
        setTestFailed(true)
      }, 600)
    }
  }

  const handleContinue = () => {
    const nextIndex = index + 1
    if (nextIndex >= problems.length) {
      onPass()
      return
    }
    setIndex(nextIndex)
    setAnswer(initialAnswer(problems[nextIndex]))
    setInputLocked(false)
    setWrongLine(null)
    setFeedback({ kind: 'idle' })
  }

  if (phase === 'loading') {
    return (
      <div className="lesson-player__layout">
        <div className="lesson-player__main">
          <p className="lesson-player__prompt">
            Preparing your lesson test… {generatedCount} of {TEST_QUESTIONS} questions ready
          </p>
        </div>
      </div>
    )
  }

  if (!problem) {
    return <p>No test questions available.</p>
  }

  return (
    <>
      <div className="lesson-player__progress">
        <div
          className="lesson-player__progress-fill"
          style={{ width: `${((index + 1) / problems.length) * 100}%` }}
        />
        <span className="lesson-player__progress-text">
          Lesson test · Question {index + 1} of {problems.length}
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

          {feedback.kind !== 'correct' && !testFailed && (
            <div className="lesson-player__actions">
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

          {testFailed && (
            <div className="feedback feedback--incorrect">
              <p className="feedback__title">Not quite</p>
              <p className="feedback__body">
                You need all {TEST_QUESTIONS} questions correct to finish this lesson. Try again with a
                fresh set.
              </p>
              <div className="feedback__actions">
                <button type="button" className="btn btn--primary" onClick={() => void generate()}>
                  Retry test
                </button>
                <button type="button" className="btn btn--ghost" onClick={onExit}>
                  Back to course
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="lesson-player__side">
          {(feedback.kind === 'incorrect' || feedback.kind === 'correct') && (
            <FeedbackPanel state={feedback} onContinue={handleContinue} />
          )}
        </div>
      </div>
    </>
  )
}
