import TimePicker from './TimePicker'

interface SetupScreenProps {
  departureTime: string
  onTimeChange: (time: string) => void
  onStart: () => void
}

export default function SetupScreen({ departureTime, onTimeChange, onStart }: SetupScreenProps) {
  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center gap-8 bg-green-800">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-6xl font-bold text-white tracking-tight">GoTime</h1>
        <p className="text-xl text-white/80">What time do you leave?</p>
      </div>

      <TimePicker
        value={departureTime}
        onChange={onTimeChange}
      />

      <div className="flex flex-col items-center gap-2">
        <button
          onClick={onStart}
          className="bg-white text-green-800 font-bold text-2xl px-16 py-5 rounded-2xl shadow-lg hover:bg-green-50 active:bg-green-100 transition-colors"
        >
          Start Morning
        </button>
        <p className="text-sm text-white/50">We'll remember this time tomorrow</p>
      </div>
    </div>
  )
}
