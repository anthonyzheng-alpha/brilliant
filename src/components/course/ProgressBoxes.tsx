import './ProgressBoxes.css'

type Box = { id: string; label: string; done: boolean }

export function ProgressBoxes({ boxes, className }: { boxes: Box[]; className?: string }) {
  return (
    <span className={`progress-boxes${className ? ` ${className}` : ''}`}>
      {boxes.map((b) => (
        <span
          key={b.id}
          className={`progress-box ${b.done ? 'progress-box--done' : ''}`}
          title={b.label}
          aria-label={b.done ? `${b.label} (completed)` : b.label}
        />
      ))}
    </span>
  )
}
