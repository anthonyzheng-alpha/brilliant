import { useGamificationStore } from '../../stores/gamificationStore'
import './Gamification.css'

export function StreakBadge() {
  const streak = useGamificationStore((s) => s.gamification.currentStreak)
  const longest = useGamificationStore((s) => s.gamification.longestStreak)

  if (streak === 0 && longest === 0) return null

  return (
    <div className="streak-badge" title={`Longest streak: ${longest} days`}>
      <span className="streak-badge__icon" aria-hidden>
        🔥
      </span>
      <span className="streak-badge__count">{streak}</span>
    </div>
  )
}
