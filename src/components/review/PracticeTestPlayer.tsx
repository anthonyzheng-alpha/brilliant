import { useCallback, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { AnswerValue } from '../../types/content'
import { RichText } from '../common/RichText'
import { ProblemRenderer, initialAnswer } from '../problems/ProblemRenderer'
import { ProblemVisual } from '../widgets/ProblemVisual'
import { isAnswerValid, hasValidInput } from '../../lib/validation'
import { useAuthStore } from '../../stores/authStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useGamificationStore } from '../../stores/gamificationStore'
import { useStruggleStore } from '../../stores/struggleStore'
import { FEATURES } from '../../lib/features'
import {
  generateReviewProblem,
  normalizePrompt,
  type GeneratedProblem,
} from '../../lib/ai'
import {
  buildTestRequests,
  buildRelearnRef,
  getMiniLessonOptions,
  type MiniLessonOption,
  type TestTarget,
} from '../../lib/reviewTargeting'
import {
  savePracticeTestSession,
  loadPracticeTestSession,
  clearPracticeTestSession,
} from '../../lib/storage'
import { saveUserGamification } from '../../lib/syncProgress'
import '../lesson/LessonPlayer.css'
import './PracticeTest.css'

type Props = {
  coveredLessonIds: string[]
}

const MIN_QUESTIONS = 5
const MAX_QUESTIONS = 20
const DEFAULT_QUESTIONS = 10

type Phase = 'setup' | 'loading' | 'taking' | 'results'

type LessonGroup = {
  lessonTitle: string
  courseTitle: string
  options: MiniLessonOption[]
}

// Turn the learner's answer into a display string (may contain LaTeX, rendered
// via RichText). Returns null when there is nothing meaningful to show.
function formatAnswer(problem: GeneratedProblem, answer: AnswerValue | null): string | null {
  if (!answer) return null
  const { interaction } = problem
  switch (interaction.type) {
    case 'multiple-choice':
      if (answer.type !== 'multiple-choice' || !answer.selectedId) return null
      return interaction.data.options.find((o) => o.id === answer.selectedId)?.label ?? null
    case 'numeric':
      if (answer.type !== 'numeric' || !answer.value.trim()) return null
      return interaction.data.unit ? `${answer.value} ${interaction.data.unit}` : answer.value
    case 'line-equation':
      if (answer.type !== 'line-equation') return null
      return `m = ${answer.slope || '?'}, b = ${answer.intercept || '?'}`
    case 'slider':
      return answer.type === 'slider' ? String(answer.value) : null
    case 'tap-sequence':
      if (answer.type !== 'tap-sequence') return null
      return (
        interaction.data.cells
          .filter((c) => answer.selectedIds.includes(c.id))
          .map((c) => c.label)
          .join(', ') || null
      )
    case 'multi-input':
      if (answer.type !== 'multi-input') return null
      return interaction.data.fields
        .map((f) => `${f.label}: ${answer.values[f.id] ?? '-'}`)
        .join(', ')
    case 'drag-drop':
    case 'factoring': {
      const placement =
        answer.type === 'drag-drop' || answer.type === 'factoring' ? answer.placement : {}
      const labelFor = (id: string) =>
        interaction.data.draggables.find((d) => d.id === id)?.label ?? id
      const vals = Object.values(placement).filter(Boolean).map(labelFor)
      return vals.length ? vals.join(', ') : null
    }
    default:
      return null
  }
}

function clampCount(value: number): number {
  if (Number.isNaN(value)) return DEFAULT_QUESTIONS
  return Math.min(MAX_QUESTIONS, Math.max(MIN_QUESTIONS, Math.round(value)))
}

export function PracticeTestPlayer({ coveredLessonIds }: Props) {
  const navigate = useNavigate()
  const pausedSessionRef = useRef(loadPracticeTestSession())
  const pausedSession = pausedSessionRef.current
  const user = useAuthStore((s) => s.user)
  const aiEnabled = useSettingsStore((s) => s.aiEnabled)
  const recordActivity = useGamificationStore((s) => s.recordActivity)
  const getAttemptedSkills = useStruggleStore((s) => s.getAttemptedSkills)

  // Selectable mini-lessons come from the rounds the learner has actually
  // reached, so a test never pulls from later/harder mini-lessons they skipped.
  const options = getMiniLessonOptions(getAttemptedSkills(coveredLessonIds))

  // Group options by lesson for the setup UI (keeps the helper's course/lesson/
  // round ordering).
  const groups: LessonGroup[] = []
  for (const option of options) {
    const last = groups[groups.length - 1]
    if (last && last.lessonTitle === option.lessonTitle && last.courseTitle === option.courseTitle) {
      last.options.push(option)
    } else {
      groups.push({
        lessonTitle: option.lessonTitle,
        courseTitle: option.courseTitle,
        options: [option],
      })
    }
  }

  const [phase, setPhase] = useState<Phase>(pausedSession ? 'results' : 'setup')
  const [count, setCount] = useState(pausedSession?.count ?? Math.min(DEFAULT_QUESTIONS, MAX_QUESTIONS))
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(pausedSession?.selected ?? options.map((o) => o.key)),
  )
  const [generatedCount, setGeneratedCount] = useState(0)

  const [problems, setProblems] = useState<GeneratedProblem[]>(pausedSession?.problems ?? [])
  const [answers, setAnswers] = useState<(AnswerValue | null)[]>(pausedSession?.answers ?? [])
  const [current, setCurrent] = useState(pausedSession?.current ?? 0)

  const [results, setResults] = useState<boolean[]>(pausedSession?.results ?? [])
  const [expanded, setExpanded] = useState<Set<number>>(
    () => new Set(pausedSession?.expanded ?? []),
  )

  const toggleTopic = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // Map selected mini-lesson keys back to round targets. If there are no
  // mini-lesson options at all (legacy data without round ids), fall back to
  // lesson-level targets so the feature still works.
  const buildTargets = (): TestTarget[] => {
    if (options.length === 0) {
      return coveredLessonIds.map((lessonId) => ({ lessonId, roundId: '' }))
    }
    return options
      .filter((o) => selected.has(o.key))
      .map((o) => ({ lessonId: o.lessonId, roundId: o.roundId }))
  }

  const startTest = async () => {
    clearPracticeTestSession()
    const targets = buildTargets()
    if (targets.length === 0) return
    setPhase('loading')
    setGeneratedCount(0)
    const requests = buildTestRequests(targets, count, aiEnabled)
    const generated: GeneratedProblem[] = []
    const seen = new Set<string>()
    for (const req of requests) {
      let problem = await generateReviewProblem({ ...req, avoidPrompts: [...seen] })
      // Re-generate if we got a prompt already used in this test (bounded retries
      // so a small authored pool / persistent AI repeat can't loop forever).
      for (let attempt = 0; attempt < 5 && seen.has(normalizePrompt(problem.prompt)); attempt++) {
        problem = await generateReviewProblem({ ...req, avoidPrompts: [...seen] })
      }
      generated.push(problem)
      seen.add(normalizePrompt(problem.prompt))
      setGeneratedCount(generated.length)
    }
    setProblems(generated)
    setAnswers(generated.map((p) => initialAnswer(p)))
    setCurrent(0)
    setPhase('taking')
  }

  const setAnswer = (next: AnswerValue) => {
    setAnswers((prev) => {
      const copy = [...prev]
      copy[current] = next
      return copy
    })
  }

  const answeredCount = problems.reduce(
    (acc, p, i) => (hasValidInput(p, answers[i]) ? acc + 1 : acc),
    0,
  )

  const submitTest = () => {
    if (
      answeredCount < problems.length &&
      !window.confirm(
        `You have answered ${answeredCount} of ${problems.length} questions. Unanswered questions will be marked incorrect. Submit anyway?`,
      )
    ) {
      return
    }
    const graded = problems.map((p, i) => {
      const answer = answers[i]
      return answer ? isAnswerValid(p, answer) : false
    })
    setResults(graded)
    if (FEATURES.gamification) {
      // Practice tests count toward the daily streak but never award coins.
      recordActivity()
      if (user) {
        void saveUserGamification(user.uid, useGamificationStore.getState().gamification)
      }
    }
    setPhase('results')
  }

  const toggleExplanation = (index: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const retake = () => {
    clearPracticeTestSession()
    setProblems([])
    setAnswers([])
    setResults([])
    setExpanded(new Set())
    setCurrent(0)
    setPhase('setup')
  }

  const saveSession = useCallback(() => {
    if (phase !== 'results' || problems.length === 0) return
    savePracticeTestSession({
      phase: 'results',
      problems,
      answers,
      results,
      expanded: [...expanded],
      current,
      count,
      selected: [...selected],
    })
  }, [phase, problems, answers, results, expanded, current, count, selected])

  // --- Setup ---------------------------------------------------------------
  if (phase === 'setup') {
    return (
      <div className="lesson-player practice-test">
        <h2 className="practice-test__heading">Build your practice test</h2>
        <p className="practice-test__note">
          Practice tests count toward your daily streak but do not earn coins.
        </p>

        <div className="practice-test__field">
          <label htmlFor="practice-count" className="practice-test__label">
            Number of questions: <strong>{count}</strong>
          </label>
          <input
            id="practice-count"
            type="range"
            min={MIN_QUESTIONS}
            max={MAX_QUESTIONS}
            value={count}
            onChange={(e) => setCount(clampCount(Number(e.target.value)))}
            className="practice-test__range"
          />
          <div className="practice-test__range-bounds">
            <span>{MIN_QUESTIONS}</span>
            <span>{MAX_QUESTIONS}</span>
          </div>
        </div>

        <div className="practice-test__field">
          <span className="practice-test__label">Mini-lessons to focus on</span>
          {options.length === 0 ? (
            <p className="practice-test__note">
              We'll draw from every lesson you've started.
            </p>
          ) : (
            <div className="practice-test__topics">
              {groups.map((group) => (
                <div key={`${group.courseTitle}::${group.lessonTitle}`} className="practice-test__group">
                  <p className="practice-test__group-title">
                    {group.lessonTitle}
                    {group.courseTitle && (
                      <span className="practice-test__topic-course"> · {group.courseTitle}</span>
                    )}
                  </p>
                  {group.options.map((option) => (
                    <label key={option.key} className="practice-test__topic">
                      <input
                        type="checkbox"
                        checked={selected.has(option.key)}
                        onChange={() => toggleTopic(option.key)}
                      />
                      <span className="practice-test__topic-title">{option.roundLabel}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lesson-player__actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={startTest}
            disabled={options.length > 0 && selected.size === 0}
          >
            Start test
          </button>
        </div>
      </div>
    )
  }

  // --- Loading -------------------------------------------------------------
  if (phase === 'loading') {
    return (
      <div className="lesson-player">
        <div className="lesson-player__layout">
          <div className="lesson-player__main">
            <p className="lesson-player__prompt">
              Preparing your test… {generatedCount} of {count} questions ready
            </p>
          </div>
        </div>
      </div>
    )
  }

  // --- Results -------------------------------------------------------------
  if (phase === 'results') {
    const score = results.filter(Boolean).length
    return (
      <div className="lesson-player practice-test">
        <div className="feedback feedback--complete">
          <p className="feedback__title">Test graded</p>
          <p className="feedback__body">
            You scored {score} of {problems.length}.
          </p>
          <p className="practice-test__note">
            This test counted toward your daily streak. Practice tests do not earn coins.
          </p>
        </div>

        <ol className="practice-test__results">
          {problems.map((problem, i) => {
            const correct = results[i]
            const isOpen = expanded.has(i)
            const lessonRef = buildRelearnRef(problem, 'practice-test', saveSession)
            return (
              <li
                key={problem.id}
                className={`practice-test__result practice-test__result--${
                  correct ? 'correct' : 'incorrect'
                }`}
              >
                <div className="practice-test__result-head">
                  <span className="practice-test__result-badge">
                    {correct ? 'Correct' : 'Incorrect'}
                  </span>
                  <span className="practice-test__result-num">Question {i + 1}</span>
                </div>
                <div className="practice-test__result-prompt">
                  <RichText text={problem.prompt} />
                </div>
                {lessonRef && (
                  <p className="feedback__review-ref">
                    {correct ? 'Lesson covered:' : 'Go relearn this:'}{' '}
                    <Link
                      to={lessonRef.to}
                      className="feedback__review-link"
                      onClick={() => lessonRef.onBeforeNavigate?.()}
                    >
                      {lessonRef.lessonTitle}
                    </Link>
                  </p>
                )}
                <button
                  type="button"
                  className="btn btn--ghost practice-test__explain-btn"
                  aria-expanded={isOpen}
                  onClick={() => toggleExplanation(i)}
                >
                  {isOpen ? 'Hide details' : 'Show details'}
                </button>
                {isOpen && (
                  <div className="practice-test__details">
                    <ProblemVisual problem={problem} answer={answers[i]} />
                    <p className="practice-test__your-answer">
                      Your answer:{' '}
                      {formatAnswer(problem, answers[i]) ? (
                        <RichText text={formatAnswer(problem, answers[i])!} />
                      ) : (
                        <span className="practice-test__no-answer">No answer</span>
                      )}
                    </p>
                    <div className="practice-test__explanation">
                      <RichText text={problem.explanation} />
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ol>

        <div className="lesson-player__actions practice-test__results-actions">
          <button type="button" className="btn btn--primary" onClick={retake}>
            New test
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => navigate('/')}>
            Back home
          </button>
        </div>
      </div>
    )
  }

  // --- Taking --------------------------------------------------------------
  const problem = problems[current]
  return (
    <div className="lesson-player practice-test">
      <p className="lesson-player__review-status">
        Practice test · Question {current + 1} of {problems.length} · {answeredCount} answered
      </p>

      <div className="lesson-player__layout">
        <div className="lesson-player__main">
          <div className="lesson-player__prompt">
            <RichText text={problem.prompt} />
          </div>

          <ProblemVisual
            problem={problem}
            answer={answers[current]}
            wrongLine={null}
            showLinePreview={false}
          />

          <ProblemRenderer
            key={problem.id}
            problem={problem}
            answer={answers[current]}
            onAnswerChange={setAnswer}
          />

          <div className="lesson-player__actions practice-test__nav">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setCurrent((c) => Math.max(0, c - 1))}
              disabled={current === 0}
            >
              Previous
            </button>
            {current < problems.length - 1 ? (
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => setCurrent((c) => Math.min(problems.length - 1, c + 1))}
              >
                Next
              </button>
            ) : (
              <button type="button" className="btn btn--primary" onClick={submitTest}>
                Submit test
              </button>
            )}
          </div>

          {current < problems.length - 1 && (
            <div className="practice-test__submit-row">
              <button type="button" className="btn btn--ghost" onClick={submitTest}>
                Submit test early
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
