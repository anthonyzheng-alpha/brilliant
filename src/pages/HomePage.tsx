import { PageShell } from '../components/layout/PageShell'
import { CourseCard } from '../components/course/CourseCard'
import { courses } from '../content'
import { useProgressStore } from '../stores/progressStore'
import { getAllLessonsForCourse } from '../content'
import './HomePage.css'

export function HomePage() {
  const getPercent = useProgressStore((s) => s.getCoursePercent)

  return (
    <PageShell>
      <section className="hero">
        <h1>Learn algebra by doing</h1>
        <p className="hero__sub">
          Interactive puzzles that build intuition before notation.
        </p>
      </section>
      <section className="course-grid">
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            progressPercent={getPercent(course.id, getAllLessonsForCourse(course.id).length)}
          />
        ))}
      </section>
    </PageShell>
  )
}
