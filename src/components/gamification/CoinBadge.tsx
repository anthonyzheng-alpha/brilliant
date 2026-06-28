import { useEffect, useRef, useState } from 'react'
import { useGamificationStore } from '../../stores/gamificationStore'
import { COINS_PER_CORRECT } from '../../lib/coins'
import './Gamification.css'

export function CoinBadge() {
  const coins = useGamificationStore((s) => s.gamification.coins)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div
      className="coin-badge__wrap"
      ref={ref}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setOpen(false)
      }}
    >
      <button
        type="button"
        className="coin-badge"
        aria-haspopup="true"
        aria-expanded={open}
        title="How to earn coins"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="coin-badge__icon" aria-hidden>
          🪙
        </span>
        <span className="coin-badge__count">{coins}</span>
      </button>
      {open && (
        <div className="coin-badge__popover" role="note">
          <p className="coin-badge__popover-title">Coins</p>
          <div className="coin-info">
            <p>Earn coins from the Infinite Practice feature:</p>
            <ul>
              <li>{COINS_PER_CORRECT} coins for each correct answer</li>
              <li>
                Keep a streak of correct answers for bonuses — every 5th in a row earns extra
                (5th gives 15, 10th gives 20, and so on)
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
