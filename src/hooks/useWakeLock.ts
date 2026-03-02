import { useState, useRef, useEffect, useCallback } from 'react'

export interface UseWakeLockReturn {
  wakeLockActive: boolean
  wakeLockSupported: boolean
  requestWakeLock: () => Promise<void>
  releaseWakeLock: () => Promise<void>
}

export function useWakeLock(): UseWakeLockReturn {
  const wakeLockSupported = 'wakeLock' in navigator

  const [wakeLockActive, setWakeLockActive] = useState(false)
  const sentinelRef = useRef<WakeLockSentinel | null>(null)
  // Track whether we *want* the lock so we can re-acquire after visibility change
  const desiredRef = useRef(false)

  const requestWakeLock = useCallback(async () => {
    if (!wakeLockSupported) return
    desiredRef.current = true
    try {
      sentinelRef.current = await navigator.wakeLock.request('screen')
      setWakeLockActive(true)
      sentinelRef.current.addEventListener('release', () => {
        sentinelRef.current = null
        setWakeLockActive(false)
      })
    } catch {
      setWakeLockActive(false)
    }
  }, [wakeLockSupported])

  const releaseWakeLock = useCallback(async () => {
    desiredRef.current = false
    try {
      await sentinelRef.current?.release()
    } catch {
      // ignore
    }
    sentinelRef.current = null
    setWakeLockActive(false)
  }, [])

  // Re-acquire when tab regains visibility
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && desiredRef.current) {
        void requestWakeLock()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [requestWakeLock])

  // Release on unmount
  useEffect(() => {
    return () => {
      void sentinelRef.current?.release()
    }
  }, [])

  return { wakeLockActive, wakeLockSupported, requestWakeLock, releaseWakeLock }
}
