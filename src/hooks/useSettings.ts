import { useState, useCallback } from 'react'
import type { PersistedSettings } from '../types'

const STORAGE_KEY = 'gotime:settings'

const DEFAULTS: PersistedSettings = {
  departureTime: '08:30',
  audioEnabled: false,
  audioAlertMinutes: [5, 1],
}

function loadSettings(): PersistedSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw) as Partial<PersistedSettings>
    return {
      departureTime: typeof parsed.departureTime === 'string' ? parsed.departureTime : DEFAULTS.departureTime,
      audioEnabled: typeof parsed.audioEnabled === 'boolean' ? parsed.audioEnabled : DEFAULTS.audioEnabled,
      audioAlertMinutes: Array.isArray(parsed.audioAlertMinutes) ? parsed.audioAlertMinutes : DEFAULTS.audioAlertMinutes,
    }
  } catch {
    return DEFAULTS
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<PersistedSettings>(loadSettings)

  const updateSettings = useCallback((patch: Partial<PersistedSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // storage quota exceeded or unavailable — update state only
      }
      return next
    })
  }, [])

  return { settings, updateSettings }
}
