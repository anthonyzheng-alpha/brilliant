export function todayLocal(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function yesterdayLocal(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function computeStreakUpdate(
  currentStreak: number,
  longestStreak: number,
  lastActiveDate: string | null,
): { currentStreak: number; longestStreak: number; lastActiveDate: string } {
  const today = todayLocal()
  if (lastActiveDate === today) {
    return { currentStreak, longestStreak, lastActiveDate: today }
  }
  const yesterday = yesterdayLocal()
  let next = 1
  if (lastActiveDate === yesterday) {
    next = currentStreak + 1
  }
  const longest = Math.max(longestStreak, next)
  return { currentStreak: next, longestStreak: longest, lastActiveDate: today }
}

export type MonthCell = { date: string | null; inMonth: boolean }

function formatLocal(y: number, m0: number, d: number): string {
  const m = String(m0 + 1).padStart(2, '0')
  const day = String(d).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Returns a 6x7 grid (weeks x weekdays, Sunday-first) of cells for the given month.
export function monthMatrix(year: number, month0: number): MonthCell[][] {
  const first = new Date(year, month0, 1)
  const startWeekday = first.getDay() // 0=Sun
  const daysInMonth = new Date(year, month0 + 1, 0).getDate()
  const cells: MonthCell[] = []
  for (let i = 0; i < startWeekday; i++) cells.push({ date: null, inMonth: false })
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: formatLocal(year, month0, d), inMonth: true })
  }
  while (cells.length % 7 !== 0) cells.push({ date: null, inMonth: false })
  while (cells.length < 42) cells.push({ date: null, inMonth: false })
  const weeks: MonthCell[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

export function addDaysToLocal(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + delta)
  return formatLocal(dt.getFullYear(), dt.getMonth(), dt.getDate())
}
