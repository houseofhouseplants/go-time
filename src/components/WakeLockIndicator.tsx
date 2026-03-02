interface WakeLockIndicatorProps {
  active: boolean
  supported: boolean
}

export default function WakeLockIndicator({ active, supported }: WakeLockIndicatorProps) {
  if (!supported) return null

  return (
    <div className="absolute bottom-4 right-4 flex items-center gap-1 text-xs text-white/60">
      <span>{active ? '🔒' : '🔓'}</span>
      <span>{active ? 'Screen on' : 'Screen may sleep'}</span>
    </div>
  )
}
