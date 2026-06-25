import { useMemo, useState } from 'react'
import type { AnswerValue, MiniLesson, Problem } from '../../types/content'
import { RichText } from '../common/RichText'
import { ProblemRenderer, initialAnswer } from '../problems/ProblemRenderer'
import { ProblemVisual } from '../widgets/ProblemVisual'
import { hasValidInput, isAnswerValid } from '../../lib/validation'
import { resolveWrongReason } from '../../lib/problemFeedback'
import './MiniLessonView.css'

type Props = {
  roundLabel: string
  roundNumber: number
  totalRounds: number
  miniLesson: MiniLesson
  onStart: () => void
}

export function MiniLessonView({
  roundLabel,
  roundNumber,
  totalRounds,
  miniLesson,
  onStart,
}: Props) {
  // Reuse the full problem pipeline by adapting the example into a Problem.
  const exampleProblem = useMemo<Problem>(
    () => ({
      id: `mini-${roundNumber}-example`,
      type: miniLesson.example.interaction.type,
      prompt: miniLesson.example.prompt,
      visual: miniLesson.example.visual,
      interaction: miniLesson.example.interaction,
      hints: ['', '', ''],
      explanation: miniLesson.example.explanation,
    }),
    [miniLesson, roundNumber],
  )

  const [answer, setAnswer] = useState<AnswerValue | null>(() => initialAnswer(exampleProblem))
  const [result, setResult] = useState<'correct' | 'incorrect' | null>(null)
  const [wrongReason, setWrongReason] = useState('')

  const handleAnswerChange = (next: AnswerValue) => {
    setResult(null)
    setAnswer(next)
  }

  const handleCheck = () => {
    if (!answer || !hasValidInput(exampleProblem, answer)) return
    if (isAnswerValid(exampleProblem, answer)) {
      setResult('correct')
    } else {
      setWrongReason(resolveWrongReason(exampleProblem, answer))
      setResult('incorrect')
    }
  }

  return (
    <div className="mini-lesson">
      <div className="mini-lesson__tag">
        Mini-lesson · Round {roundNumber} of {totalRounds} · {roundLabel}
      </div>

      {miniLesson.title && (
        <h2 className="mini-lesson__title">
          <RichText text={miniLesson.title} />
        </h2>
      )}

      <div className="mini-lesson__teach">
        <RichText text={miniLesson.paragraph} />
      </div>

      <div className="mini-lesson__example">
        <p className="mini-lesson__example-label">Try it</p>
        <div className="mini-lesson__prompt">
          <RichText text={miniLesson.example.prompt} />
        </div>

        <ProblemVisual problem={exampleProblem} answer={answer} />

        <ProblemRenderer
          key={exampleProblem.id}
          problem={exampleProblem}
          answer={answer}
          onAnswerChange={handleAnswerChange}
          onSubmit={handleCheck}
          disabled={result === 'correct'}
        />

        {result === null ? (
          <div className="mini-lesson__actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleCheck}
              disabled={!hasValidInput(exampleProblem, answer)}
            >
              Check
            </button>
          </div>
        ) : (
          <div
            className={`mini-lesson__feedback mini-lesson__feedback--${result}`}
            aria-live="polite"
          >
            <p className="mini-lesson__feedback-title">
              {result === 'correct' ? 'Correct!' : 'Not quite — here is a hint:'}
            </p>
            <RichText
              text={
                result === 'correct'
                  ? miniLesson.example.explanation
                  : wrongReason || 'Reread the important points of the lesson and try again.'
              }
            />
            {result === 'incorrect' && (
              <button
                type="button"
                className="btn btn--ghost btn--sm mini-lesson__retry"
                onClick={() => {
                  setResult(null)
                  setAnswer(initialAnswer(exampleProblem))
                }}
              >
                Try again
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mini-lesson__start">
        {result !== 'correct' && (
          <p className="mini-lesson__start-hint">
            Answer the example correctly to start the round.
          </p>
        )}
        <button
          type="button"
          className="btn btn--primary"
          onClick={onStart}
          disabled={result !== 'correct'}
        >
          Start round
        </button>
      </div>
    </div>
  )
}
