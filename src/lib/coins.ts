export const COINS_PER_CORRECT = 10

// streak = consecutive correct answers including the current one.
// Every 5th correct earns a milestone bonus: 5->15, 10->20, 15->25, ...
export function coinsForCorrect(streak: number): number {
  return streak > 0 && streak % 5 === 0 ? COINS_PER_CORRECT + streak : COINS_PER_CORRECT
}
