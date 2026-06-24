import { PageShell } from '../components/layout/PageShell'
import { CourseCard } from '../components/course/CourseCard'
import { courses } from '../content'
import { useProgressStore } from '../stores/progressStore'
import { getAllLessonsForCourse, computeRoundBoxes } from '../content'
import { isCourseUnlocked } from '../lib/courseUnlock'
import { FEATURES } from '../lib/features'
import './HomePage.css'

export function HomePage() {
  const isComplete = useProgressStore((s) => s.isLessonComplete)
  const getLessonProgressCount = useProgressStore((s) => s.getLessonProgressCount)
  const getCourseProblemPercent = useProgressStore((s) => s.getCourseProblemPercent)
  const isCourseComplete = useProgressStore((s) => s.isCourseComplete)

  return (
    <PageShell>
      <section className="hero">
        <h1>Learn algebra by doing</h1>
        <p className="hero__sub">
          Interactive puzzles that build intuition before notation.
        </p>
      </section>
      <section className="course-grid">
        {courses.map((course, index) => {
          const lessons = getAllLessonsForCourse(course.id)
          const boxes = lessons.flatMap((lesson) => {
            const total = lesson.rounds.reduce((n, r) => n + r.problemIds.length, 0)
            const done = isComplete(course.id, lesson.id)
            const count = done ? total : getLessonProgressCount(course.id, lesson.id)
            return computeRoundBoxes(lesson, count, done)
          })
          const sequentiallyLocked =
            FEATURES.sequentialUnlock && !isCourseUnlocked(course.id, isCourseComplete)
          const prevTitle = index > 0 ? courses[index - 1].title : undefined
          return (
            <CourseCard
              key={course.id}
              course={course}
              progressPercent={getCourseProblemPercent(course.id, lessons)}
              boxes={boxes}
              locked={sequentiallyLocked || undefined}
              lockedLabel={sequentiallyLocked ? 'Locked' : undefined}
              lockedHint={
                sequentiallyLocked && prevTitle
                  ? `Complete ${prevTitle} to unlock`
                  : undefined
              }
            />
          )
        })}
      </section>
    </PageShell>
  )
}
