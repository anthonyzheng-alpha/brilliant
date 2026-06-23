import { motion } from 'framer-motion'
import { FEATURES } from '../../lib/features'
import { RichText } from '../common/RichText'
import './LessonPlayer.css'

type FeedbackState =
  | { kind: 'idle' }
  | { kind: 'hint'; hint: string }
  | { kind: 'incorrect'; hint: string; shake?: boolean }
  | { kind: 'correct'; explanation: string }
  | { kind: 'complete'; lessonTitle: string }

type Props = {
  state: FeedbackState
  onContinue: () => void
}

export function FeedbackPanel({ state, onContinue }: Props) {
  if (state.kind === 'idle') return null

  if (state.kind === 'hint') {
    return (
      <div className="feedback feedback--incorrect">
        <p className="feedback__title">Hint</p>
        <p className="feedback__body">
          <RichText text={state.hint} />
        </p>
      </div>
    )
  }

  if (state.kind === 'incorrect') {
    const panel = (
      <div className={`feedback feedback--incorrect ${state.shake ? 'feedback--shake' : ''}`}>
        <p className="feedback__title">Not quite</p>
        <p className="feedback__body">
          <RichText text={state.hint} />
        </p>
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
