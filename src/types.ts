export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished'

export interface PersistedSettings {
  departureTime: string       // "HH:MM" 24h format
  audioEnabled: boolean
  audioAlertMinutes: number[] // minutes remaining at which to play alerts
}

export interface RuntimeState {
  status: TimerStatus
  secondsRemaining: number
  wakeLockActive: boolean
  wakeLockSupported: boolean
}
