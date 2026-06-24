import { useEffect, useRef, useState } from 'react'
import { useGamificationStore } from '../../stores/gamificationStore'
import { StreakCalendar } from './StreakCalendar'
import './Gamification.css'

export function StreakBadge() {
  const streak = useGamificationStore((s) => s.gamification.currentStreak)
  const longest = useGamificationStore((s) => s.gamification.longestStreak)
  const activeDates = useGamificationStore((s) => s.gamification.activeDates)

  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  if (streak === 0 && longest === 0) return null

  return (
    <div
      className="streak-badge__wrap"
      ref={ref}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setOpen(false)
      }}
    >
      <button
        type="button"
        className="streak-badge"
        aria-haspopup="true"
        aria-expanded={open}
        title={`Longest streak: ${longest} days`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="streak-badge__icon" aria-hidden>
          🔥
        </span>
        <span className="streak-badge__count">{streak}</span>
      </button>
      {open && (
        <div className="streak-badge__popover">
          <StreakCalendar activeDates={activeDates} />
        </div>
      )}
    </div>
  )
}
