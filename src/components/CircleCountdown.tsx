import type { TimerStatus } from '../types'

interface CircleCountdownProps {
  percentRemaining: number
  secondsRemaining: number
  formattedTime: string
  departureLabel: string
  status: TimerStatus
}

// ── Color stops (green → yellow → orange → red) ───────────────────────────────

function interpolate(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

const RED: [number, number, number] = [0, 84, 58]

function getColor(pct: number, forceRed: boolean): { main: string; dim: string } {
  type Stop = [number, number, number] // h s l
  const green:  Stop = [142, 76, 42]
  const yellow: Stop = [45,  93, 52]
  const orange: Stop = [25,  95, 55]

  let h: number, s: number, l: number

  if (forceRed) {
    ;[h, s, l] = RED
  } else if (pct >= 60) {
    const t = (pct - 60) / 40
    ;[h, s, l] = [0, 1, 2].map(i => interpolate(yellow[i]!, green[i]!, t)) as [number, number, number]
  } else if (pct >= 30) {
    const t = (pct - 30) / 30
    ;[h, s, l] = [0, 1, 2].map(i => interpolate(orange[i]!, yellow[i]!, t)) as [number, number, number]
  } else {
    const t = pct / 30
    ;[h, s, l] = [0, 1, 2].map(i => interpolate(RED[i]!, orange[i]!, t)) as [number, number, number]
  }

  return {
    main: `hsl(${h.toFixed(1)}, ${s.toFixed(1)}%, ${l.toFixed(1)}%)`,
    dim:  `hsl(${h.toFixed(1)}, ${(s * 0.25).toFixed(1)}%, ${(l * 0.25).toFixed(1)}%)`,
  }
}

// ── Geometry ──────────────────────────────────────────────────────────────────

const SIZE   = 500
const CX     = SIZE / 2
const CY     = SIZE / 2
const RADIUS = 230

/** SVG path for a pie sector from 12 o'clock clockwise by `pct` percent. */
function sectorPath(pct: number): string {
  if (pct <= 0) return ''
  // Full circle: two 180° arcs (can't use a single 360° arc in SVG)
  if (pct >= 100) {
    return [
      `M ${CX} ${CY - RADIUS}`,
      `A ${RADIUS} ${RADIUS} 0 1 1 ${CX - 0.0001} ${CY - RADIUS}`,
      'Z',
    ].join(' ')
  }
  const angle   = (pct / 100) * 2 * Math.PI
  const endX    = CX + RADIUS * Math.sin(angle)
  const endY    = CY - RADIUS * Math.cos(angle)
  const large   = pct > 50 ? 1 : 0
  return `M ${CX} ${CY} L ${CX} ${CY - RADIUS} A ${RADIUS} ${RADIUS} 0 ${large} 1 ${endX} ${endY} Z`
}

// ── ARIA label ────────────────────────────────────────────────────────────────

function buildAriaLabel(formattedTime: string, status: TimerStatus): string {
  if (status === 'finished') return 'Time to go'
  if (status === 'paused')   return `Paused at ${formattedTime}`
  const parts = formattedTime.split(':')
  if (parts.length === 3) return `${parts[0]} hours, ${parts[1]} minutes, ${parts[2]} seconds remaining`
  return `${parts[0]} minutes and ${parts[1]} seconds remaining`
}

// ── Component ─────────────────────────────────────────────────────────────────

const FIVE_MINUTES = 5 * 60

export default function CircleCountdown({
  percentRemaining,
  secondsRemaining,
  formattedTime,
  departureLabel,
  status,
}: CircleCountdownProps) {
  const pct        = Math.min(100, Math.max(0, percentRemaining))
  const underFive  = secondsRemaining <= FIVE_MINUTES
  const color      = getColor(pct, underFive)
  const paused     = status === 'paused'

  // > 5 min: show whole minutes only  ≤ 5 min: show MM:SS
  const displayTime = underFive
    ? formattedTime
    : `${Math.floor(secondsRemaining / 60)}`
  const timeUnit = underFive ? null : 'min'

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: '82vmin', height: '82vmin' }}
    >
      {/* SVG disc */}
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      >
        {/* Background disc — dimmed version of current color */}
        <circle
          cx={CX} cy={CY} r={RADIUS}
          fill={color.dim}
          style={{ transition: 'fill 1.2s ease' }}
        />

        {/* Remaining-time sector */}
        <path
          d={sectorPath(pct)}
          fill={color.main}
          opacity={paused ? 0.5 : 1}
          style={{ transition: 'fill 1.2s ease, opacity 0.3s ease' }}
        />
      </svg>

      {/* Center text */}
      <div
        role="timer"
        aria-live="polite"
        aria-label={buildAriaLabel(formattedTime, status)}
        className="absolute inset-0 flex flex-col items-center justify-center gap-2"
      >
        <div className="flex items-baseline gap-2">
          <span
            className="font-bold text-white tabular-nums tracking-tight leading-none drop-shadow-lg"
            style={{
              fontSize: 'clamp(3rem, 14vmin, 7.5rem)',
              textShadow: '0 2px 16px rgba(0,0,0,0.45)',
            }}
          >
            {displayTime}
          </span>
          {timeUnit && (
            <span
              className="font-bold text-white/80"
              style={{
                fontSize: 'clamp(1.2rem, 5vmin, 3rem)',
                textShadow: '0 2px 16px rgba(0,0,0,0.45)',
              }}
            >
              {timeUnit}
            </span>
          )}
        </div>
        <span
          className="text-white/75 font-semibold text-center leading-tight"
          style={{
            fontSize: 'clamp(0.8rem, 2.2vmin, 1.15rem)',
            textShadow: '0 1px 8px rgba(0,0,0,0.4)',
          }}
        >
          {paused ? 'paused' : departureLabel}
        </span>
      </div>
    </div>
  )
}
