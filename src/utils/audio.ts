let ctx: AudioContext | null = null

function getContext(): AudioContext | null {
  if (ctx) return ctx
  const Ctor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  ctx = new Ctor()
  return ctx
}

function playTone(frequencies: number[], durationSec: number): void {
  const context = getContext()
  if (!context) return

  const startTime = context.currentTime
  const stepDuration = durationSec / frequencies.length

  frequencies.forEach((freq, i) => {
    const osc = context.createOscillator()
    const gain = context.createGain()

    osc.connect(gain)
    gain.connect(context.destination)

    osc.type = 'sine'
    osc.frequency.value = freq

    const noteStart = startTime + i * stepDuration
    const noteEnd = noteStart + stepDuration

    gain.gain.setValueAtTime(0.3, noteStart)
    gain.gain.exponentialRampToValueAtTime(0.001, noteEnd)

    osc.start(noteStart)
    osc.stop(noteEnd)
  })
}

export function playAlertTone(type: 'warning' | 'final'): void {
  try {
    if (type === 'warning') {
      // Gentle two-note ascending chime (~0.3s)
      playTone([523, 659], 0.3)
    } else {
      // Slightly more urgent three-note sequence (~0.5s)
      playTone([523, 659, 784], 0.5)
    }
  } catch {
    // Blocked by browser autoplay policy or unsupported — fail silently
  }
}

export function isAudioSupported(): boolean {
  return !!(window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
}
