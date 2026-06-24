import './ProgressBoxes.css'

type Box = { id: string; label: string; done: boolean }

// Maps a position fraction p in [0,1] to a warm color, interpolating hue from
// yellow (48deg) through orange to red (0deg). Fixed saturation/lightness keeps
// it readable in both light and dark themes.
function warmColor(p: number): string {
  const hue = Math.round(48 - 48 * p)
  return `hsl(${hue}, 90%, 52%)`
}

export function ProgressBoxes({ boxes, className }: { boxes: Box[]; className?: string }) {
  const total = boxes.length
  return (
    <span className={`progress-boxes${className ? ` ${className}` : ''}`}>
      {boxes.map((b, index) => {
        const p = total > 1 ? index / (total - 1) : 0.5
        const color = warmColor(p)
        return (
          <span
            key={b.id}
            className={`progress-box ${b.done ? 'progress-box--done' : ''}`}
            style={b.done ? { background: color, borderColor: color } : undefined}
            title={b.label}
            aria-label={b.done ? `${b.label} (completed)` : b.label}
          />
        )
      })}
    </span>
  )
}
