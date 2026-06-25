import { useCallback, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { PageShell } from '../components/layout/PageShell'
import { ReviewPlayer } from '../components/review/ReviewPlayer'
import { getCourseBySlug, getAllLessonsForCourse, getReviewProblems } from '../content'
import { useProgressStore } from '../stores/progressStore'
import { useDebugStore } from '../stores/debugStore'
import { FEATURES } from '../lib/features'

const REVIEW_SIZE = 5

export function ReviewPage() {
  const { slug } = useParams<{ slug: string }>()
  const course = slug ? getCourseBySlug(slug) : undefined

  const isCourseComplete = useProgressStore((s) => s.isCourseComplete)
  const unlockAll = useDebugStore((s) => s.unlockAll)

  const [problems, setProblems] = useState(() =>
    course ? getReviewProblems(course.id, REVIEW_SIZE) : [],
  )
  const [setKey, setSetKey] = useState(0)

  const newSet = useCallback(() => {
    if (!course) return
    setProblems((prev) =>
      getReviewProblems(
        course.id,
        REVIEW_SIZE,
        prev.map((p) => p.id),
      ),
    )
    setSetKey((k) => k + 1)
  }, [course])

  if (!course || !slug) {
    return (
      <PageShell>
        <p>Course not found.</p>
        <Link to="/">Back home</Link>
      </PageShell>
    )
  }

  const locked =
    course.lockedUntilPhase === 'M2' && !FEATURES.allCourses && !unlockAll
  if (locked) {
    return <Navigate to="/" replace />
  }

  const orderedIds = getAllLessonsForCourse(course.id).map((l) => l.id)
  const complete = isCourseComplete(course.id, orderedIds)
  if (!complete && !unlockAll) {
    return <Navigate to={`/courses/${slug}`} replace />
  }

  return (
    <PageShell>
      <Link to={`/courses/${slug}`} className="back-link">
        ← {course.title}
      </Link>
      <h1 className="lesson-page__title">Review · {course.title}</h1>
      <ReviewPlayer
        key={setKey}
        courseSlug={slug}
        problems={problems}
        onNewSet={newSet}
      />
    </PageShell>
  )
}
