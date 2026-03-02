import { useState, useRef, useCallback, useEffect } from 'react'
import type { TimerStatus } from '../types'

function parseTime(hhmm: string): { hours: number; minutes: number } {
  const [h, m] = hhmm.split(':').map(Number)
  return { hours: h ?? 0, minutes: m ?? 0 }
}

function buildTarget(hhmm: string): Date {
  const { hours, minutes } = parseTime(hhmm)
  const now = new Date()
  const target = new Date(now)
  target.setHours(hours, minutes, 0, 0)
  // Roll over to tomorrow if the time has already passed
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1)
  }
  return target
}

function formatSeconds(total: number): string {
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  if (h > 0) return `${h}:${mm}:${ss}`
  return `${mm}:${ss}`
}

export interface UseTimerReturn {
  status: TimerStatus
  secondsRemaining: number
  formattedTimeRemaining: string
  percentRemaining: number
  start: () => void
  pause: () => void
  reset: () => void
  targetTime: Date | null
}

export function useTimer(departureTime: string): UseTimerReturn {
  const [status, setStatus] = useState<TimerStatus>('idle')
  const [secondsRemaining, setSecondsRemaining] = useState(0)
  const [targetTime, setTargetTime] = useState<Date | null>(null)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const totalSecondsRef = useRef(0)

  const clearTick = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const tick = useCallback((target: Date) => {
    const remaining = Math.max(0, Math.floor((target.getTime() - Date.now()) / 1000))
    setSecondsRemaining(remaining)
    if (remaining === 0) {
      clearTick()
      setStatus('finished')
    }
  }, [clearTick])

  const start = useCallback(() => {
    const target = buildTarget(departureTime)
    const remaining = Math.max(0, Math.floor((target.getTime() - Date.now()) / 1000))
    totalSecondsRef.current = remaining
    setTargetTime(target)
    setSecondsRemaining(remaining)
    setStatus('running')

    clearTick()
    intervalRef.current = setInterval(() => tick(target), 500)
  }, [departureTime, clearTick, tick])

  const pause = useCallback(() => {
    setStatus(prev => {
      if (prev === 'running') {
        clearTick()
        return 'paused'
      }
      if (prev === 'paused' && targetTime) {
        intervalRef.current = setInterval(() => tick(targetTime), 500)
        return 'running'
      }
      return prev
    })
  }, [clearTick, tick, targetTime])

  const reset = useCallback(() => {
    clearTick()
    setStatus('idle')
    setSecondsRemaining(0)
    setTargetTime(null)
    totalSecondsRef.current = 0
  }, [clearTick])

  // Cleanup on unmount
  useEffect(() => clearTick, [clearTick])

  const percentRemaining =
    totalSecondsRef.current > 0
      ? Math.min(100, Math.max(0, (secondsRemaining / totalSecondsRef.current) * 100))
      : 100

  return {
    status,
    secondsRemaining,
    formattedTimeRemaining: formatSeconds(secondsRemaining),
    percentRemaining,
    start,
    pause,
    reset,
    targetTime,
  }
}
