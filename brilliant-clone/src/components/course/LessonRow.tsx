import { Link } from 'react-router-dom'
import type { Lesson } from '../../types/content'
import { LessonMilestoneIcon } from '../gamification/LessonMilestoneIcon'
import './LessonRow.css'

type Props = {
  courseSlug: string
  lesson: Lesson
  locked: boolean
  completed: boolean
}

export function LessonRow({ courseSlug, lesson, locked, completed }: Props) {
  const content = (
    <>
      <span className="lesson-row__title">
        {lesson.title}
        <LessonMilestoneIcon lessonId={lesson.id} />
      </span>
      <span className="lesson-row__meta">{lesson.estimatedMinutes} min</span>
      {completed && <span className="lesson-row__check" aria-label="Completed">✓</span>}
      {locked && <span className="lesson-row__lock" aria-label="Locked">🔒</span>}
    </>
  )

  if (locked) {
    return <div className="lesson-row lesson-row--locked">{content}</div>
  }

  return (
    <Link
      to={`/courses/${courseSlug}/lessons/${lesson.id}`}
      className={`lesson-row ${completed ? 'lesson-row--done' : ''}`}
    >
      {content}
    </Link>
  )
}
