import { useId } from 'react'
import './CoordinateGraph.css'

const SIZE = 320
const PADDING = 40

export type GraphPoint = { x: number; y: number }

export type CoordinateGraphProps = {
  slope?: number
  intercept?: number
  points?: GraphPoint[]
  previewSlope?: number
  previewIntercept?: number
  xMin?: number
  xMax?: number
  yMin?: number
  yMax?: number
}

type Point = { x: number; y: number }

function clipLineToViewport(
  slope: number,
  intercept: number,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
): [Point, Point] | null {
  const yAt = (x: number) => slope * x + intercept
  const xAt = (y: number) => (y - intercept) / slope

  const candidates: Point[] = []

  for (const x of [xMin, xMax]) {
    const y = yAt(x)
    if (y >= yMin && y <= yMax) candidates.push({ x, y })
  }

  if (slope !== 0) {
    for (const y of [yMin, yMax]) {
      const x = xAt(y)
      if (x >= xMin && x <= xMax) candidates.push({ x, y })
    }
  }

  const unique = candidates.filter(
    (point, index) =>
      candidates.findIndex(
        (other) => Math.abs(other.x - point.x) < 1e-9 && Math.abs(other.y - point.y) < 1e-9,
      ) === index,
  )

  if (unique.length < 2) return null

  let best: [Point, Point] = [unique[0], unique[1]]
  let bestDist = 0
  for (let i = 0; i < unique.length; i++) {
    for (let j = i + 1; j < unique.length; j++) {
      const dx = unique[i].x - unique[j].x
      const dy = unique[i].y - unique[j].y
      const dist = dx * dx + dy * dy
      if (dist > bestDist) {
        bestDist = dist
        best = [unique[i], unique[j]]
      }
    }
  }

  return best
}

function toSvgX(x: number, xMin: number, xMax: number) {
  const plotWidth = SIZE - 2 * PADDING
  return PADDING + ((x - xMin) / (xMax - xMin)) * plotWidth
}

function toSvgY(y: number, yMin: number, yMax: number) {
  const plotHeight = SIZE - 2 * PADDING
  return SIZE - PADDING - ((y - yMin) / (yMax - yMin)) * plotHeight
}

function integerRange(min: number, max: number) {
  const values: number[] = []
  for (let i = Math.ceil(min); i <= Math.floor(max); i++) values.push(i)
  return values
}

function formatEquation(slope: number, intercept: number) {
  if (intercept === 0) return `y = ${slope}x`
  if (intercept > 0) return `y = ${slope}x + ${intercept}`
  return `y = ${slope}x − ${Math.abs(intercept)}`
}

export function CoordinateGraph({
  slope,
  intercept,
  points,
  previewSlope,
  previewIntercept,
  xMin = -5,
  xMax = 5,
  yMin = -5,
  yMax = 5,
}: CoordinateGraphProps) {
  const clipId = useId()
  const line =
    slope !== undefined && intercept !== undefined
      ? clipLineToViewport(slope, intercept, xMin, xMax, yMin, yMax)
      : null
  const previewLine =
    previewSlope !== undefined && previewIntercept !== undefined
      ? clipLineToViewport(previewSlope, previewIntercept, xMin, xMax, yMin, yMax)
      : null
  const xTicks = integerRange(xMin, xMax)
  const yTicks = integerRange(yMin, yMax)
  const showXAxis = yMin <= 0 && yMax >= 0
  const showYAxis = xMin <= 0 && xMax >= 0

  const ariaLabel =
    slope !== undefined && intercept !== undefined
      ? `Coordinate graph of ${formatEquation(slope, intercept)}`
      : points?.length
        ? 'Coordinate graph with points on a line'
        : 'Coordinate graph'

  return (
    <div className="coordinate-graph" aria-label={ariaLabel}>
      <svg
        className="coordinate-graph__svg"
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-hidden
      >
        <defs>
          <clipPath id={clipId}>
            <rect
              x={PADDING}
              y={PADDING}
              width={SIZE - 2 * PADDING}
              height={SIZE - 2 * PADDING}
            />
          </clipPath>
        </defs>

        {yTicks.map((y) => (
          <line
            key={`h-${y}`}
            className="coordinate-graph__grid"
            x1={PADDING}
            y1={toSvgY(y, yMin, yMax)}
            x2={SIZE - PADDING}
            y2={toSvgY(y, yMin, yMax)}
          />
        ))}

        {xTicks.map((x) => (
          <line
            key={`v-${x}`}
            className="coordinate-graph__grid"
            x1={toSvgX(x, xMin, xMax)}
            y1={PADDING}
            x2={toSvgX(x, xMin, xMax)}
            y2={SIZE - PADDING}
          />
        ))}

        {showXAxis && (
          <line
            className="coordinate-graph__axis"
            x1={PADDING}
            y1={toSvgY(0, yMin, yMax)}
            x2={SIZE - PADDING}
            y2={toSvgY(0, yMin, yMax)}
          />
        )}

        {showYAxis && (
          <line
            className="coordinate-graph__axis"
            x1={toSvgX(0, xMin, xMax)}
            y1={PADDING}
            x2={toSvgX(0, xMin, xMax)}
            y2={SIZE - PADDING}
          />
        )}

        <g clipPath={`url(#${clipId})`}>
          {line && (
            <line
              className="coordinate-graph__line"
              x1={toSvgX(line[0].x, xMin, xMax)}
              y1={toSvgY(line[0].y, yMin, yMax)}
              x2={toSvgX(line[1].x, xMin, xMax)}
              y2={toSvgY(line[1].y, yMin, yMax)}
            />
          )}
          {previewLine && (
            <line
              className="coordinate-graph__preview-line"
              x1={toSvgX(previewLine[0].x, xMin, xMax)}
              y1={toSvgY(previewLine[0].y, yMin, yMax)}
              x2={toSvgX(previewLine[1].x, xMin, xMax)}
              y2={toSvgY(previewLine[1].y, yMin, yMax)}
            />
          )}
        </g>

        {points?.map((point, index) => (
          <circle
            key={`pt-${index}-${point.x}-${point.y}`}
            className="coordinate-graph__point"
            cx={toSvgX(point.x, xMin, xMax)}
            cy={toSvgY(point.y, yMin, yMax)}
            r={5}
          />
        ))}

        {xTicks.map((x) =>
          x === 0 && showYAxis ? null : (
            <text
              key={`xl-${x}`}
              className="coordinate-graph__tick"
              x={toSvgX(x, xMin, xMax)}
              y={toSvgY(yMin, yMin, yMax) + 16}
              textAnchor="middle"
            >
              {x}
            </text>
          ),
        )}

        {yTicks.map((y) =>
          y === 0 && showXAxis ? null : (
            <text
              key={`yl-${y}`}
              className="coordinate-graph__tick"
              x={toSvgX(xMin, xMin, xMax) - 10}
              y={toSvgY(y, yMin, yMax) + 4}
              textAnchor="end"
            >
              {y}
            </text>
          ),
        )}
      </svg>
    </div>
  )
}
