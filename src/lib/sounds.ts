// Kleine Soundeffekte, per Web Audio API synthetisiert statt als Audiodateien -- kein Asset-
// Upload nötig, funktioniert überall gleich. AudioContext wird lazy erzeugt und bei Bedarf
// resumed (Browser starten ihn oft "suspended", bis eine Nutzer-Geste stattgefunden hat).
let audioCtx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) audioCtx = new AudioContext()
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {})
  return audioCtx
}

function tone(ctx: AudioContext, freq: number, startTime: number, duration: number, type: OscillatorType, peakGain: number) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, startTime)
  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(startTime)
  osc.stop(startTime + duration + 0.02)
}

export function playBuzzSound(): void {
  const ctx = getCtx()
  if (!ctx) return
  const now = ctx.currentTime
  tone(ctx, 880, now, 0.11, 'square', 0.18)
}

export function playCorrectSound(): void {
  const ctx = getCtx()
  if (!ctx) return
  const now = ctx.currentTime
  tone(ctx, 523.25, now, 0.16, 'sine', 0.2) // C5
  tone(ctx, 659.25, now + 0.11, 0.16, 'sine', 0.2) // E5
  tone(ctx, 783.99, now + 0.22, 0.28, 'sine', 0.22) // G5
}

export function playWrongSound(): void {
  const ctx = getCtx()
  if (!ctx) return
  const now = ctx.currentTime
  tone(ctx, 311.13, now, 0.18, 'sawtooth', 0.16) // Eb4
  tone(ctx, 220, now + 0.14, 0.32, 'sawtooth', 0.16) // A3
}
