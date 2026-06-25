import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PageShell } from '../components/layout/PageShell'
import { OverallReviewPlayer } from '../components/review/OverallReviewPlayer'
import { getCoveredLessonIds, getLessonLocation } from '../content'
import { useProgressStore } from '../stores/progressStore'
import { useStruggleStore } from '../stores/struggleStore'

export function OverallReviewPage() {
  const progress = useProgressStore((s) => s.progress)
  const struggles = useStruggleStore((s) => s.struggles)
  const getAttemptedLessonIds = useStruggleStore((s) => s.getAttemptedLessonIds)

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
      <Link to="/" className="back-link">
        ← Home
      </Link>
      <h1 className="lesson-page__title">Overall Review</h1>

      {coveredLessonIds.length === 0 ? (
        <div className="feedback feedback--complete">
          <p className="feedback__title">Nothing to review yet</p>
          <p className="feedback__body">
            Work through some lessons first. Once you have practiced a few topics, the
            Overall Review will generate fresh problems focused on what you missed.
          </p>
          <div className="feedback__actions">
            <Link to="/" className="btn btn--primary" style={{ textDecoration: 'none' }}>
              Browse courses
            </Link>
          </div>
        </div>
      ) : (
        <OverallReviewPlayer coveredLessonIds={coveredLessonIds} />
      )}
    </PageShell>
  )
}
