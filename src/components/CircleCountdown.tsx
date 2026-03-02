import type { TimerStatus } from '../types'

interface CircleCountdownProps {
  percentRemaining: number
  formattedTime: string
  departureLabel: string
  status: TimerStatus
}

// ── Color interpolation (same stops as before) ────────────────────────────────

function interpolate(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function getColor(pct: number): string {
  type Stop = [number, number, number] // h s l
  const green:  Stop = [142, 76, 42]
  const yellow: Stop = [45,  93, 52]
  const orange: Stop = [25,  95, 55]
  const red:    Stop = [0,   84, 58]

  let h: number, s: number, l: number

  if (pct >= 60) {
    const t = (pct - 60) / 40
    ;[h, s, l] = [0, 1, 2].map(i => interpolate(yellow[i]!, green[i]!, t)) as [number, number, number]
  } else if (pct >= 30) {
    const t = (pct - 30) / 30
    ;[h, s, l] = [0, 1, 2].map(i => interpolate(orange[i]!, yellow[i]!, t)) as [number, number, number]
  } else {
    const t = pct / 30
    ;[h, s, l] = [0, 1, 2].map(i => interpolate(red[i]!, orange[i]!, t)) as [number, number, number]
  }

  return `hsl(${h.toFixed(1)}, ${s.toFixed(1)}%, ${l.toFixed(1)}%)`
}

// ── Geometry ──────────────────────────────────────────────────────────────────

const SIZE        = 400
const CX          = SIZE / 2
const CY          = SIZE / 2
const RADIUS      = 162
const STROKE_W    = 52
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

// ── ARIA label ────────────────────────────────────────────────────────────────

function buildAriaLabel(formattedTime: string, status: TimerStatus): string {
  if (status === 'finished') return 'Time to go'
  if (status === 'paused')   return `Paused at ${formattedTime}`
  const parts = formattedTime.split(':')
  if (parts.length === 3) return `${parts[0]} hours, ${parts[1]} minutes, ${parts[2]} seconds remaining`
  return `${parts[0]} minutes and ${parts[1]} seconds remaining`
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CircleCountdown({
  percentRemaining,
  formattedTime,
  departureLabel,
  status,
}: CircleCountdownProps) {
  const pct    = Math.min(100, Math.max(0, percentRemaining))
  const offset = CIRCUMFERENCE * (1 - pct / 100)
  const color  = getColor(pct)
  const paused = status === 'paused'

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: '68vmin', height: '68vmin' }}
    >
      {/* SVG ring */}
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx={CX} cy={CY} r={RADIUS}
          fill="none"
          stroke="#1e293b"
          strokeWidth={STROKE_W}
        />
        {/* Progress ring — starts at 12 o'clock, draws clockwise */}
        <circle
          cx={CX} cy={CY} r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={STROKE_W}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${CX} ${CY})`}
          opacity={paused ? 0.5 : 1}
          style={{
            transition: 'stroke-dashoffset 0.5s linear, stroke 1.2s ease, opacity 0.3s ease',
          }}
        />
      </svg>

      {/* Center content */}
      <div
        role="timer"
        aria-live="polite"
        aria-label={buildAriaLabel(formattedTime, status)}
        className="absolute inset-0 flex flex-col items-center justify-center gap-3"
      >
        <span
          className="font-bold text-white tabular-nums tracking-tight leading-none drop-shadow-lg"
          style={{ fontSize: 'clamp(3rem, 13vmin, 7rem)' }}
        >
          {formattedTime}
        </span>
        <span
          className="text-white/50 font-medium text-center leading-tight"
          style={{ fontSize: 'clamp(0.75rem, 2vmin, 1.1rem)' }}
        >
          {paused ? 'paused' : departureLabel}
        </span>
      </div>
    </div>
  )
}
