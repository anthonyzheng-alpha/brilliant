import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageShell } from '../components/layout/PageShell'
import { OverallReviewPlayer } from '../components/review/OverallReviewPlayer'
import { PracticeTestPlayer } from '../components/review/PracticeTestPlayer'
import { getCoveredLessonIds, getLessonLocation } from '../content'
import { useProgressStore } from '../stores/progressStore'
import { useStruggleStore } from '../stores/struggleStore'
import '../components/review/PracticeTest.css'

type ReviewMode = 'choose' | 'infinite' | 'test'

export function OverallReviewPage() {
  const progress = useProgressStore((s) => s.progress)
  const struggles = useStruggleStore((s) => s.struggles)
  const getAttemptedLessonIds = useStruggleStore((s) => s.getAttemptedLessonIds)

  const [mode, setMode] = useState<ReviewMode>('choose')

  // Lessons reachable by the review: anything progress counts as covered, plus
  // anything the learner has attempted (struggle store) but may not have advanced
  // past — filtered to lessons that still exist in content.
  const coveredLessonIds = useMemo(() => {
    const fromStruggles = getAttemptedLessonIds().filter((id) => getLessonLocation(id))
    return [...new Set([...getCoveredLessonIds(progress), ...fromStruggles])]
    // `struggles` is included so the set recomputes as new attempts are recorded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, struggles, getAttemptedLessonIds])

  return (
    <PageShell>
      {mode === 'choose' ? (
        <Link to="/" className="back-link">
          ← Home
        </Link>
      ) : (
        <button type="button" className="back-link" onClick={() => setMode('choose')}>
          ← Review options
        </button>
      )}
      <h1 className="lesson-page__title">Overall Review</h1>

      {coveredLessonIds.length === 0 ? (
        <div className="feedback feedback--complete">
          <p className="feedback__title">Nothing to review yet</p>
          <p className="feedback__body">
            Work through some lessons first. Once you have practiced a few topics, there
            will be fresh problems focused on what you missed.
          </p>
          <div className="feedback__actions">
            <Link to="/" className="btn btn--primary" style={{ textDecoration: 'none' }}>
              Browse courses
            </Link>
          </div>
        </div>
      ) : mode === 'infinite' ? (
        <OverallReviewPlayer coveredLessonIds={coveredLessonIds} />
      ) : mode === 'test' ? (
        <PracticeTestPlayer coveredLessonIds={coveredLessonIds} />
      ) : (
        <div className="review-modes">
          <button
            type="button"
            className="review-mode-card"
            onClick={() => setMode('infinite')}
          >
            <span className="review-mode-card__title">Infinite practice</span>
            <span className="review-mode-card__desc">
              Endless problems that adapt to the topics you miss most. Earn coins and extend your streak for
              every correct answer. AI-generated problems unless AI-powered practice is off.
            </span>
          </button>
          <button
            type="button"
            className="review-mode-card"
            onClick={() => setMode('test')}
          >
            <span className="review-mode-card__title">Practice test</span>
            <span className="review-mode-card__desc">
              Choose how many questions and which topics to focus on, then submit for a
              graded score with explanations. Counts toward your streak — no coins.
              AI-generated problems unless AI-powered practice is off.
            </span>
          </button>
        </div>
      )}
    </PageShell>
  )
}
