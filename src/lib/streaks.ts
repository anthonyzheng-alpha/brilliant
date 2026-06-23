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
