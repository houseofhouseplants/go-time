import type { TimerStatus } from '../types'

interface CountdownDisplayProps {
  formattedTime: string
  departureLabel: string
  status: TimerStatus
}

function buildAriaLabel(formattedTime: string, status: TimerStatus): string {
  if (status === 'finished') return 'Time to go'
  if (status === 'paused') return `Paused at ${formattedTime}`
  const parts = formattedTime.split(':')
  if (parts.length === 3) {
    return `${parts[0]} hours, ${parts[1]} minutes, and ${parts[2]} seconds remaining`
  }
  return `${parts[0]} minutes and ${parts[1]} seconds remaining`
}

export default function CountdownDisplay({ formattedTime, departureLabel, status }: CountdownDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-4 select-none">
      <div
        role="timer"
        aria-live="polite"
        aria-label={buildAriaLabel(formattedTime, status)}
        className="text-8xl md:text-9xl font-bold tracking-wide text-white drop-shadow-lg tabular-nums"
      >
        {status === 'finished' ? 'Time to go! 🎉' : formattedTime}
      </div>
      {status !== 'finished' && (
        <div className="text-xl text-white/80 font-medium">
          {departureLabel}
        </div>
      )}
    </div>
  )
}
