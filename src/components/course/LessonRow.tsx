import { Link } from 'react-router-dom'
import type { Lesson } from '../../types/content'
import { LessonMilestoneIcon } from '../gamification/LessonMilestoneIcon'
import { useProgressStore } from '../../stores/progressStore'
import { computeRoundBoxes, roundSize } from '../../content'
import { ProgressBoxes } from './ProgressBoxes'
import './LessonRow.css'

type Props = {
  courseId: string
  courseSlug: string
  lesson: Lesson
  locked: boolean
  completed: boolean
}

export function LessonRow({ courseId, courseSlug, lesson, locked, completed }: Props) {
  const getLessonProgressCount = useProgressStore((s) => s.getLessonProgressCount)

  const total = lesson.rounds.reduce((n, r) => n + roundSize(r), 0)
  const count = completed ? total : getLessonProgressCount(courseId, lesson.id)
  const percent = total ? Math.round((count / total) * 100) : 0

  const roundBoxes = computeRoundBoxes(lesson, count, completed)

  const content = (
    <>
      <span className="lesson-row__main">
        <span className="lesson-row__title">
          {lesson.title}
          <LessonMilestoneIcon lessonId={lesson.id} />
        </span>
        <span className="lesson-row__meta">
          {lesson.estimatedMinutes} min · {lesson.rounds.length} rounds · {percent}%
        </span>
        {completed && <span className="lesson-row__check" aria-label="Completed">✓</span>}
        {locked && <span className="lesson-row__lock" aria-label="Locked">🔒</span>}
      </span>
      <span className="lesson-row__progress">
        <ProgressBoxes boxes={roundBoxes} className="lesson-row__rounds" />
        <span
          className={`lesson-row__test-star ${
            completed ? 'lesson-row__test-star--earned' : ''
          }`}
          aria-label={completed ? 'Lesson test passed' : 'Lesson test'}
          title="Lesson test"
        >
          ★
        </span>
      </span>
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
