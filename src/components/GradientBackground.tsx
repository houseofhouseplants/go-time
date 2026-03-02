interface GradientBackgroundProps {
  percentRemaining: number
  children: React.ReactNode
}

function interpolate(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

// Returns an HSL color string blended across four stops based on percentRemaining (0–100)
function getBackgroundColor(pct: number): string {
  // Stops: 100% green → 60% yellow → 30% orange → 0% red
  type Stop = [h: number, s: number, l: number]
  const green:  Stop = [142, 76, 36]
  const yellow: Stop = [45,  93, 47]
  const orange: Stop = [25,  95, 53]
  const red:    Stop = [0,   84, 60]

  let h: number, s: number, l: number

  if (pct >= 60) {
    const t = (pct - 60) / 40           // 1 at 100%, 0 at 60%
    h = interpolate(yellow[0], green[0], t)
    s = interpolate(yellow[1], green[1], t)
    l = interpolate(yellow[2], green[2], t)
  } else if (pct >= 30) {
    const t = (pct - 30) / 30           // 1 at 60%, 0 at 30%
    h = interpolate(orange[0], yellow[0], t)
    s = interpolate(orange[1], yellow[1], t)
    l = interpolate(orange[2], yellow[2], t)
  } else {
    const t = pct / 30                  // 1 at 30%, 0 at 0%
    h = interpolate(red[0], orange[0], t)
    s = interpolate(red[1], orange[1], t)
    l = interpolate(red[2], orange[2], t)
  }

  return `hsl(${h.toFixed(1)}, ${s.toFixed(1)}%, ${l.toFixed(1)}%)`
}

export default function GradientBackground({ percentRemaining, children }: GradientBackgroundProps) {
  return (
    <div
      className="w-screen h-screen flex items-center justify-center"
      style={{
        backgroundColor: getBackgroundColor(percentRemaining),
        transition: 'background-color 1s ease',
      }}
    >
      {children}
    </div>
  )
}
