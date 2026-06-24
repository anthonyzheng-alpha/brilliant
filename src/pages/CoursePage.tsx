import { Link, Navigate, useParams } from 'react-router-dom'
import { PageShell } from '../components/layout/PageShell'
import { LessonRow } from '../components/course/LessonRow'
import {
  getCourseBySlug,
  getUnitsForCourse,
  getLessonsForUnit,
  getAllLessonsForCourse,
} from '../content'
import { useProgressStore } from '../stores/progressStore'
import { isCourseUnlocked } from '../lib/courseUnlock'
import { FEATURES } from '../lib/features'
import { useDebugStore } from '../stores/debugStore'
import './CoursePage.css'

export function CoursePage() {
  const { slug } = useParams<{ slug: string }>()
  const course = slug ? getCourseBySlug(slug) : undefined

  const getCourseProblemPercent = useProgressStore((s) => s.getCourseProblemPercent)
  const isComplete = useProgressStore((s) => s.isLessonComplete)
  const isUnlocked = useProgressStore((s) => s.isLessonUnlocked)
  const isCourseComplete = useProgressStore((s) => s.isCourseComplete)
  const courseProgressEntry = useProgressStore((s) =>
    course ? s.progress.courses[course.id] : undefined,
  )
  const unlockAll = useDebugStore((s) => s.unlockAll)

  if (!course) {
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

  if (
    FEATURES.sequentialUnlock &&
    !unlockAll &&
    !isCourseUnlocked(course.id, isCourseComplete)
  ) {
    return <Navigate to="/" replace />
  }

  const allLessons = getAllLessonsForCourse(course.id)
  const orderedIds = allLessons.map((l) => l.id)
  const units = getUnitsForCourse(course.id)
  const percent = getCourseProblemPercent(course.id, allLessons)

  const resumeLessonId = courseProgressEntry?.lastLessonId
  const resumeIncomplete =
    resumeLessonId && !isComplete(course.id, resumeLessonId)

  return (
    <PageShell>
      <Link to="/" className="back-link">
        ← All courses
      </Link>
      <header className="course-header">
        <h1>{course.title}</h1>
        <p className="course-header__sub">{course.subtitle}</p>
        <p className="course-header__progress">{percent}% complete</p>
      </header>

      {resumeIncomplete && slug && (
        <Link
          to={`/courses/${slug}/lessons/${resumeLessonId}`}
          className="resume-banner"
        >
          Resume lesson
        </Link>
      )}

      {units.map((unit) => (
        <section key={unit.id} className="unit-section">
          <h2>{unit.title}</h2>
          <p className="unit-section__desc">{unit.description}</p>
          {getLessonsForUnit(unit.id).map((lesson) => (
            <LessonRow
              key={lesson.id}
              courseId={course.id}
              courseSlug={course.slug}
              lesson={lesson}
              locked={
                FEATURES.sequentialUnlock && !unlockAll
                  ? !isUnlocked(course.id, lesson.id, orderedIds)
                  : false
              }
              completed={isComplete(course.id, lesson.id)}
            />
          ))}
        </section>
      ))}
    </PageShell>
  )
}
