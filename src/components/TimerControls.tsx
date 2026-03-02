import type { TimerStatus } from '../types'

interface TimerControlsProps {
  status: TimerStatus
  onPause: () => void
  onReset: () => void
  onEdit: () => void
}

export default function TimerControls({ status, onPause, onReset, onEdit }: TimerControlsProps) {
  const btnClass = 'text-white/60 hover:text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/10 active:bg-white/20 transition-all'

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 opacity-60 hover:opacity-100 transition-opacity">
      <button
        onClick={onPause}
        aria-label={status === 'running' ? 'Pause timer' : 'Resume timer'}
        aria-pressed={status === 'paused'}
        className={btnClass}
      >
        {status === 'running' ? 'Pause' : 'Resume'}
      </button>
      <button
        onClick={onReset}
        aria-label="Reset timer"
        className={btnClass}
      >
        Reset
      </button>
      <button
        onClick={onEdit}
        aria-label="Edit departure time"
        className={btnClass}
      >
        Edit Time
      </button>
    </div>
  )
}
