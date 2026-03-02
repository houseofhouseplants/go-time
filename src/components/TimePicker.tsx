import { useState, useEffect } from 'react'

interface TimePickerProps {
  value: string           // "HH:MM" 24h
  onChange: (time: string) => void
}

const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

function to24h(hour12: number, minute: number, ampm: 'AM' | 'PM'): string {
  let h = hour12 % 12
  if (ampm === 'PM') h += 12
  return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function from24h(hhmm: string): { hour12: number; minute: number; ampm: 'AM' | 'PM' } {
  const [hStr, mStr] = hhmm.split(':')
  const h24 = parseInt(hStr ?? '8', 10)
  const minute = MINUTES.includes(parseInt(mStr ?? '30', 10))
    ? parseInt(mStr ?? '30', 10)
    : 30
  const ampm: 'AM' | 'PM' = h24 < 12 ? 'AM' : 'PM'
  const hour12 = h24 % 12 === 0 ? 12 : h24 % 12
  return { hour12, minute, ampm }
}

interface ArrowButtonProps {
  onClick: () => void
  direction: 'up' | 'down'
  label: string
}

function ArrowButton({ onClick, direction, label }: ArrowButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="text-white/70 hover:text-white active:text-white/50 text-3xl leading-none px-2 py-1 transition-colors"
    >
      {direction === 'up' ? '▲' : '▼'}
    </button>
  )
}

export default function TimePicker({ value, onChange }: TimePickerProps) {
  const parsed = from24h(value)
  const [hour12, setHour12] = useState(parsed.hour12)
  const [minute, setMinute] = useState(parsed.minute)
  const [ampm, setAmpm] = useState<'AM' | 'PM'>(parsed.ampm)

  // Sync internal state when value prop changes externally
  useEffect(() => {
    const p = from24h(value)
    setHour12(p.hour12)
    setMinute(p.minute)
    setAmpm(p.ampm)
  }, [value])

  const emit = (h: number, m: number, a: 'AM' | 'PM') => {
    onChange(to24h(h, m, a))
  }

  const incHour = () => {
    const next = hour12 === 12 ? 1 : hour12 + 1
    setHour12(next)
    emit(next, minute, ampm)
  }
  const decHour = () => {
    const next = hour12 === 1 ? 12 : hour12 - 1
    setHour12(next)
    emit(next, minute, ampm)
  }

  const incMinute = () => {
    const idx = MINUTES.indexOf(minute)
    const next = MINUTES[(idx + 1) % MINUTES.length] ?? 0
    setMinute(next)
    emit(hour12, next, ampm)
  }
  const decMinute = () => {
    const idx = MINUTES.indexOf(minute)
    const next = MINUTES[(idx - 1 + MINUTES.length) % MINUTES.length] ?? 55
    setMinute(next)
    emit(hour12, next, ampm)
  }

  const toggleAmpm = () => {
    const next: 'AM' | 'PM' = ampm === 'AM' ? 'PM' : 'AM'
    setAmpm(next)
    emit(hour12, minute, next)
  }

  const colClass = 'flex flex-col items-center gap-1'
  const digitClass = 'text-7xl font-bold text-white tabular-nums w-28 text-center leading-none'

  return (
    <div className="flex items-center gap-2">
      {/* Hours */}
      <div className={colClass}>
        <ArrowButton onClick={incHour} direction="up" label="Increase hour" />
        <div className={digitClass}>{hour12}</div>
        <ArrowButton onClick={decHour} direction="down" label="Decrease hour" />
      </div>

      <div className="text-7xl font-bold text-white/60 leading-none mb-2">:</div>

      {/* Minutes */}
      <div className={colClass}>
        <ArrowButton onClick={incMinute} direction="up" label="Increase minute" />
        <div className={digitClass}>{String(minute).padStart(2, '0')}</div>
        <ArrowButton onClick={decMinute} direction="down" label="Decrease minute" />
      </div>

      {/* AM/PM */}
      <button
        onClick={toggleAmpm}
        aria-label={`Toggle AM/PM, currently ${ampm}`}
        className="ml-4 text-3xl font-bold text-white bg-white/20 hover:bg-white/30 active:bg-white/10 rounded-xl px-5 py-3 transition-colors"
      >
        {ampm}
      </button>
    </div>
  )
}
