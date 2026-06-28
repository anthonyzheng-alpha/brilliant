import { useMemo } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { PageShell } from '../components/layout/PageShell'
import { LessonPlayer } from '../components/lesson/LessonPlayer'
import {
  getCourseBySlug,
  getLessonById,
  getProblemsForVariant,
  chooseLessonVariant,
  roundSize,
  getAllLessonsForCourse,
  getLessonsForUnit,
  getUnitsForCourse,
} from '../content'
import { useProgressStore } from '../stores/progressStore'
import { useDebugStore } from '../stores/debugStore'
import { loadVariant, saveVariant } from '../lib/storage'
import { FEATURES } from '../lib/features'
import './LessonPage.css'

export function LessonPage() {
  const { slug, lessonId } = useParams<{ slug: string; lessonId: string }>()
  const [searchParams] = useSearchParams()
  const course = slug ? getCourseBySlug(slug) : undefined
  const lesson = lessonId ? getLessonById(lessonId) : undefined

  const isUnlocked = useProgressStore((s) => s.isLessonUnlocked)
  const getResume = useProgressStore((s) => s.getResumeProblemIndex)
  const unlockAll = useDebugStore((s) => s.unlockAll)

  // Pick (or reuse) the set of problems for this lesson run. A new selection is
  // rolled when starting fresh or after completion; mid-lesson resumes reuse the
  // persisted one so the index-based progress stays valid.
  const problems = useMemo(() => {
    if (!course || !lesson) return []
    const total = lesson.rounds.reduce((n, r) => n + roundSize(r), 0)
    const resumeIndex = getResume(course.id, lesson.id)
    let variant = loadVariant(lesson.id)
    if (!variant || resumeIndex === 0 || resumeIndex >= total) {
      variant = chooseLessonVariant(lesson)
      saveVariant(lesson.id, variant)
    }
    return getProblemsForVariant(lesson, variant)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course?.id, lesson?.id])

  if (!course || !lesson || lessonId === undefined) {
    return (
      <PageShell>
        <p>Lesson not found.</p>
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
  if (
    FEATURES.sequentialUnlock &&
    !unlockAll &&
    !isUnlocked(course.id, lesson.id, orderedIds)
  ) {
    return <Navigate to={`/courses/${slug}`} replace />
  }

  const unit = getUnitsForCourse(course.id).find((u) => u.id === lesson.unitId)
  const unitLessonIds = unit ? getLessonsForUnit(unit.id).map((l) => l.id) : undefined

  const resumeIndex = getResume(course.id, lesson.id)

  // Deep-link from the Overall Review "go relearn this" link: open straight onto
  // a specific round's mini-lesson rather than wherever the learner left off.
  const roundParam = searchParams.get('round')
  const reviewRoundId =
    roundParam && lesson.rounds.some((r) => r.id === roundParam) ? roundParam : undefined
  const returnTo = searchParams.get('from') === 'review' && reviewRoundId ? '/review' : undefined

  return (
    <PageShell>
      <Link to={`/courses/${slug}`} className="back-link">
        ← {course.title}
      </Link>
      <h1 className="lesson-page__title">{lesson.title}</h1>
      <LessonPlayer
        courseId={course.id}
        courseSlug={course.slug}
        lesson={lesson}
        problems={problems}
        unitId={unit?.id}
        unitLessonIds={unitLessonIds}
        initialProblemIndex={resumeIndex}
        reviewRoundId={reviewRoundId}
        returnTo={returnTo}
      />
    </PageShell>
  )
}
