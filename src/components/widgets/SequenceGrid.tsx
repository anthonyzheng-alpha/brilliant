import { motion } from 'framer-motion'
import { FEATURES } from '../../lib/features'
import './SequenceGrid.css'

type SequenceGridProps = {
  terms: number[]
}

export function SequenceGrid({ terms }: SequenceGridProps) {
  return (
    <div className="sequence-grid" aria-label="Number sequence">
      {terms.map((term, i) =>
        FEATURES.animations ? (
          <motion.div
            key={i}
            className="sequence-grid__cell"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.08 }}
          >
            {term}
          </motion.div>
        ) : (
          <div key={i} className="sequence-grid__cell">
            {term}
          </div>
        ),
      )}
      <div className="sequence-grid__cell sequence-grid__cell--unknown">?</div>
    </div>
  )
}
