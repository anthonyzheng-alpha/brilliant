import { Link, Navigate, useParams } from 'react-router-dom'
import { PageShell } from '../components/layout/PageShell'
import { LessonPlayer } from '../components/lesson/LessonPlayer'
import {
  getCourseBySlug,
  getLessonById,
  getProblemsForLesson,
  getAllLessonsForCourse,
  getLessonsForUnit,
  getUnitsForCourse,
} from '../content'
import { useProgressStore } from '../stores/progressStore'
import { FEATURES } from '../lib/features'
import './LessonPage.css'

export function LessonPage() {
  const { slug, lessonId } = useParams<{ slug: string; lessonId: string }>()
  const course = slug ? getCourseBySlug(slug) : undefined
  const lesson = lessonId ? getLessonById(lessonId) : undefined

  const isUnlocked = useProgressStore((s) => s.isLessonUnlocked)
  const getResume = useProgressStore((s) => s.getResumeProblemIndex)

  if (!course || !lesson || lessonId === undefined) {
    return (
      <PageShell>
        <p>Lesson not found.</p>
        <Link to="/">Back home</Link>
      </PageShell>
    )
  }

  const locked = course.lockedUntilPhase === 'M2' && !FEATURES.allCourses
  if (locked) {
    return <Navigate to="/" replace />
  }

  const orderedIds = getAllLessonsForCourse(course.id).map((l) => l.id)
  if (
    FEATURES.sequentialUnlock &&
    !isUnlocked(course.id, lesson.id, orderedIds)
  ) {
    return <Navigate to={`/courses/${slug}`} replace />
  }

  const problems = getProblemsForLesson(lesson.id)
  const unit = getUnitsForCourse(course.id).find((u) => u.id === lesson.unitId)
  const unitLessonIds = unit ? getLessonsForUnit(unit.id).map((l) => l.id) : undefined

  const resumeIndex = getResume(course.id, lesson.id)

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
      />
    </PageShell>
  )
}
