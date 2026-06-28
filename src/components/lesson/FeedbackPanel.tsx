import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FEATURES } from '../../lib/features'
import { RichText } from '../common/RichText'
import './LessonPlayer.css'

type FeedbackState =
  | { kind: 'idle' }
  | { kind: 'incorrect'; reason: string; title: string; shake?: boolean }
  | { kind: 'correct'; explanation: string }
  | { kind: 'complete'; lessonTitle: string }
  | { kind: 'round-complete'; roundLabel: string; nextLabel: string }

type ReviewRef = { to: string; lessonTitle: string; onBeforeNavigate?: () => void }

type Props = {
  state: FeedbackState
  onContinue: () => void
  onRetryRound?: () => void
  // When set, points the learner to a lesson mini-lesson (Overall Review).
  reviewRef?: ReviewRef
  reviewRefPrefix?: string
}

function LessonLinkRow({
  reviewRef,
  reviewRefPrefix,
}: {
  reviewRef: ReviewRef
  reviewRefPrefix?: string
}) {
  return (
    <p className="feedback__review-ref">
      {reviewRefPrefix ?? 'Go relearn this:'}{' '}
      <Link
        to={reviewRef.to}
        className="feedback__review-link"
        onClick={() => reviewRef.onBeforeNavigate?.()}
      >
        {reviewRef.lessonTitle}
      </Link>
    </p>
  )
}

export function FeedbackPanel({
  state,
  onContinue,
  onRetryRound,
  reviewRef,
  reviewRefPrefix,
}: Props) {
  if (state.kind === 'idle') return null

  if (state.kind === 'round-complete') {
    return (
      <div className="feedback feedback--complete">
        <p className="feedback__title">{state.roundLabel} complete!</p>
        <p className="feedback__body">Next up: {state.nextLabel}.</p>
        <div className="feedback__actions">
          <button type="button" className="btn btn--primary" onClick={onContinue}>
            Next round
          </button>
          {onRetryRound && (
            <button type="button" className="btn btn--ghost" onClick={onRetryRound}>
              Practice this round again
            </button>
          )}
        </div>
      </div>
    )
  }

  if (state.kind === 'incorrect') {
    const panel = (
      <div className={`feedback feedback--incorrect ${state.shake ? 'feedback--shake' : ''}`}>
        <p className="feedback__title">{state.title}</p>
        <p className="feedback__body">
          <RichText text={state.reason} />
        </p>
        {reviewRef && (
          <LessonLinkRow reviewRef={reviewRef} reviewRefPrefix={reviewRefPrefix} />
        )}
      </div>
    )
    return FEATURES.animations ? (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        {panel}
      </motion.div>
    ) : (
      panel
    )
  }

  if (state.kind === 'correct') {
    return (
      <div className="feedback feedback--correct">
        <p className="feedback__title">Correct!</p>
        <p className="feedback__body">
          <RichText text={state.explanation} />
        </p>
        {reviewRef && (
          <LessonLinkRow reviewRef={reviewRef} reviewRefPrefix={reviewRefPrefix} />
        )}
        <button type="button" className="btn btn--primary" onClick={onContinue}>
          Continue
        </button>
      </div>
    )
  }

  return (
    <div className="feedback feedback--complete">
      <p className="feedback__title">Lesson complete!</p>
      <p className="feedback__body">You finished {state.lessonTitle}.</p>
      <button type="button" className="btn btn--primary" onClick={onContinue}>
        Back to course
      </button>
    </div>
  )
}
