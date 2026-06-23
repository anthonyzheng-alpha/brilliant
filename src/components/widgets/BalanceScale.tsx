import { motion } from 'framer-motion'
import { FEATURES } from '../../lib/features'
import './BalanceScale.css'

type BalanceScaleProps = {
  leftWeight: number
  rightWeight: number
  addedRight?: number
}

export function BalanceScale({ leftWeight, rightWeight, addedRight = 0 }: BalanceScaleProps) {
  const totalRight = rightWeight + addedRight
  const diff = leftWeight - totalRight
  const tilt = Math.max(-18, Math.min(18, diff * 3))

  const beam = FEATURES.animations ? (
    <motion.div
      className="balance-scale__beam"
      animate={{ rotate: tilt }}
      transition={{ type: 'spring', stiffness: 120, damping: 14 }}
    >
      <Pan side="left" weight={leftWeight} />
      <Pan side="right" weight={totalRight} />
    </motion.div>
  ) : (
    <div className="balance-scale__beam" style={{ transform: `rotate(${tilt}deg)` }}>
      <Pan side="left" weight={leftWeight} />
      <Pan side="right" weight={totalRight} />
    </div>
  )

  return (
    <div className="balance-scale" aria-label={`Balance scale: left ${leftWeight}, right ${totalRight}`}>
      <div className="balance-scale__stand" />
      {beam}
      <div className="balance-scale__fulcrum" />
    </div>
  )
}

function Pan({ side, weight }: { side: 'left' | 'right'; weight: number }) {
  return (
    <div className={`balance-scale__pan balance-scale__pan--${side}`}>
      <div className="balance-scale__rope" />
      <div className="balance-scale__plate">
        <span className="balance-scale__weight">{weight}</span>
      </div>
    </div>
  )
}
