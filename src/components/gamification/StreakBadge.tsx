import { useEffect, useRef, useState } from 'react'
import { useGamificationStore } from '../../stores/gamificationStore'
import { StreakCalendar } from './StreakCalendar'
import './Gamification.css'

export function StreakBadge() {
  const streak = useGamificationStore((s) => s.gamification.currentStreak)
  const longest = useGamificationStore((s) => s.gamification.longestStreak)
  const activeDates = useGamificationStore((s) => s.gamification.activeDates)

  const [open, setOpen] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      setShowInfo(false)
      return
    }
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

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
          <div className="streak-badge__popover-head">
            <span className="streak-badge__popover-title">Streak</span>
            <button
              type="button"
              className="streak-info-btn"
              aria-label="What counts toward a streak"
              aria-expanded={showInfo}
              onClick={() => setShowInfo((v) => !v)}
            >
              i
            </button>
          </div>
          {showInfo && (
            <div className="streak-info" role="note">
              <p>Keep your streak by doing at least one of these each day:</p>
              <ul>
                <li>Complete a round in a lesson</li>
                <li>Finish a lesson</li>
                <li>Complete a lesson review of 5 questions</li>
                <li>Complete an overall review problem</li>
              </ul>
              <p className="streak-info__note">Miss a day and the streak resets.</p>
            </div>
          )}
          <StreakCalendar activeDates={activeDates} />
        </div>
      )}
    </div>
  )
}
