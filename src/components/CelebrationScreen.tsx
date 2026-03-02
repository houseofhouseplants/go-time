import { useEffect, useState } from 'react'

const DISMISS_SECONDS = 5

interface CelebrationScreenProps {
  onReset: () => void
}

export default function CelebrationScreen({ onReset }: CelebrationScreenProps) {
  const [remaining, setRemaining] = useState(DISMISS_SECONDS)

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          onReset()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [onReset])

  const progressPct = (remaining / DISMISS_SECONDS) * 100

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center gap-6 bg-green-500">
      <div className="text-8xl font-bold text-white drop-shadow-lg text-center">
        You made it! 🎉
      </div>
      <div className="text-2xl text-white/90">
        Great morning, team.
      </div>

      {/* Auto-dismiss progress bar */}
      <div className="w-64 h-2 bg-white/30 rounded-full overflow-hidden mt-4">
        <div
          className="h-full bg-white rounded-full transition-all duration-1000 ease-linear"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <button
        onClick={onReset}
        className="mt-2 text-white/70 hover:text-white text-sm underline underline-offset-2 transition-colors"
      >
        Start over
      </button>
    </div>
  )
}
