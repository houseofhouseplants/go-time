import { useEffect, useRef } from 'react'
import { useSettings } from './hooks/useSettings'
import { useTimer } from './hooks/useTimer'
import { useWakeLock } from './hooks/useWakeLock'
import { playAlertTone } from './utils/audio'
import CircleCountdown from './components/CircleCountdown'
import WakeLockIndicator from './components/WakeLockIndicator'
import TimerControls from './components/TimerControls'
import SetupScreen from './components/SetupScreen'
import CelebrationScreen from './components/CelebrationScreen'

function formatDepartureLabel(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(':')
  const h24 = parseInt(hStr ?? '8', 10)
  const min = parseInt(mStr ?? '0', 10)
  const ampm = h24 < 12 ? 'AM' : 'PM'
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `Out the door by ${h12}:${String(min).padStart(2, '0')} ${ampm}`
}

export default function App() {
  const { settings, updateSettings } = useSettings()
  const timer = useTimer(settings.departureTime)
  const { wakeLockActive, wakeLockSupported, requestWakeLock, releaseWakeLock } = useWakeLock()

  // Track which audio alerts have already fired this session
  const firedAlertsRef = useRef<Set<number>>(new Set())

  // Screen routing: show setup when idle, otherwise show timer or celebration
  const showSetup = timer.status === 'idle'
  const showCelebration = timer.status === 'finished'

  // Audio alerts
  useEffect(() => {
    if (!settings.audioEnabled) return
    for (const minutes of settings.audioAlertMinutes) {
      const threshold = minutes * 60
      if (timer.secondsRemaining === threshold && !firedAlertsRef.current.has(threshold)) {
        firedAlertsRef.current.add(threshold)
        playAlertTone(minutes <= 1 ? 'final' : 'warning')
      }
    }
  }, [timer.secondsRemaining, settings.audioEnabled, settings.audioAlertMinutes])

  const handleStart = () => {
    firedAlertsRef.current.clear()
    timer.start()
    void requestWakeLock()
  }

  const handleEdit = () => {
    timer.reset()
  }

  const handleReset = () => {
    firedAlertsRef.current.clear()
    timer.reset()
    void releaseWakeLock()
  }

  if (showSetup) {
    return (
      <SetupScreen
        departureTime={settings.departureTime}
        onTimeChange={time => updateSettings({ departureTime: time })}
        onStart={handleStart}
      />
    )
  }

  if (showCelebration) {
    return <CelebrationScreen onReset={handleReset} />
  }

  // Timer view (running or paused)
  return (
    <div className="w-screen h-screen bg-slate-950 flex items-center justify-center">
      <CircleCountdown
        percentRemaining={timer.percentRemaining}
        secondsRemaining={timer.secondsRemaining}
        formattedTime={timer.formattedTimeRemaining}
        departureLabel={formatDepartureLabel(settings.departureTime)}
        status={timer.status}
      />
      <TimerControls
        status={timer.status}
        onPause={timer.pause}
        onReset={handleEdit}
        onEdit={handleEdit}
      />
      <WakeLockIndicator active={wakeLockActive} supported={wakeLockSupported} />
    </div>
  )
}
