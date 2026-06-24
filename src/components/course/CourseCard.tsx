import { Link } from 'react-router-dom'
import type { Course } from '../../types/content'
import { FEATURES } from '../../lib/features'
import { ProgressBoxes } from './ProgressBoxes'
import './CourseCard.css'

type Props = {
  course: Course
  progressPercent: number
  boxes?: { id: string; label: string; done: boolean }[]
  locked?: boolean
}

export function CourseCard({ course, progressPercent, boxes, locked }: Props) {
  const isLocked = locked ?? (course.lockedUntilPhase === 'M2' && !FEATURES.allCourses)

  const inner = (
    <>
      <div className="course-card__header">
        <h2 className="course-card__title">{course.title}</h2>
        {isLocked ? (
          <span className="course-card__badge">Coming soon</span>
        ) : (
          <span className="course-card__progress">{progressPercent}%</span>
        )}
      </div>
      <p className="course-card__subtitle">{course.subtitle}</p>
      <p className="course-card__desc">{course.description}</p>
      {!isLocked && boxes && boxes.length > 0 && (
        <ProgressBoxes boxes={boxes} className="course-card__boxes" />
      )}
    </>
  )

  if (isLocked) {
    return <article className="course-card course-card--locked">{inner}</article>
  }

  return (
    <Link to={`/courses/${course.slug}`} className="course-card">
      {inner}
    </Link>
  )
}
