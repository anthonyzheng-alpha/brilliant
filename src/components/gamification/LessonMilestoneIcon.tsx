import { useGamificationStore } from '../../stores/gamificationStore'
import './Gamification.css'

export function LessonMilestoneIcon({ lessonId }: { lessonId: string }) {
  const has = useGamificationStore((s) => s.hasMilestone(lessonId))
  if (!has) return null
  return (
    <span className="milestone-icon" title="Lesson mastered" aria-label="Lesson mastered">
      ★
    </span>
  )
}
