import { useState } from 'react'
import { monthMatrix, todayLocal } from '../../lib/streaks'
import './StreakCalendar.css'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export function StreakCalendar({ activeDates }: { activeDates: string[] }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month0, setMonth0] = useState(now.getMonth())

  const weeks = monthMatrix(year, month0)
  const active = new Set(activeDates)
  const today = todayLocal()

  const label = new Date(year, month0, 1).toLocaleString(undefined, {
    month: 'long',
    year: 'numeric',
  })

  const goPrev = () => {
    if (month0 === 0) {
      setYear((y) => y - 1)
      setMonth0(11)
    } else {
      setMonth0((m) => m - 1)
    }
  }

  const goNext = () => {
    if (month0 === 11) {
      setYear((y) => y + 1)
      setMonth0(0)
    } else {
      setMonth0((m) => m + 1)
    }
  }

  return (
    <div className="streak-cal">
      <div className="streak-cal__header">
        <button
          type="button"
          className="streak-cal__nav"
          onClick={goPrev}
          aria-label="Previous month"
        >
          ◀
        </button>
        <span className="streak-cal__label">{label}</span>
        <button
          type="button"
          className="streak-cal__nav"
          onClick={goNext}
          aria-label="Next month"
        >
          ▶
        </button>
      </div>
      <div className="streak-cal__grid">
        {WEEKDAYS.map((wd, i) => (
          <div key={`wd-${i}`} className="streak-cal__weekday">
            {wd}
          </div>
        ))}
        {weeks.map((week, wi) =>
          week.map((cell, ci) => {
            if (cell.date === null) {
              return (
                <div
                  key={`${wi}-${ci}`}
                  className="streak-cal__day streak-cal__day--empty"
                />
              )
            }
            const isActive = active.has(cell.date)
            const prev = week[ci - 1]
            const next = week[ci + 1]
            const linkLeft =
              isActive && prev?.date != null && active.has(prev.date)
            const linkRight =
              isActive && next?.date != null && active.has(next.date)
            const classes = ['streak-cal__day']
            if (isActive) classes.push('streak-cal__day--active')
            if (linkLeft) classes.push('streak-cal__day--link-left')
            if (linkRight) classes.push('streak-cal__day--link-right')
            if (cell.date === today) classes.push('streak-cal__day--today')
            return (
              <div key={`${wi}-${ci}`} className={classes.join(' ')}>
                <span>{Number(cell.date.split('-')[2])}</span>
              </div>
            )
          }),
        )}
      </div>
    </div>
  )
}
