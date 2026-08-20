import { useEffect, useRef, useState } from 'react'
import { normalizeVdoUrl } from '@/lib/vdoNinja'

const AVATAR_GRADIENTS = [
  'from-poke-blue-400 to-poke-blue-600',
  'from-note-green to-teal-600',
  'from-purple-400 to-purple-600',
  'from-pink-400 to-pink-600',
  'from-poke-yellow-300 to-poke-yellow-500',
  'from-orange-400 to-orange-600',
]

function avatarGradient(seed: string, isHost: boolean): string {
  if (isHost) return 'from-poke-red-400 to-poke-red-600'
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length]
}

export default function CamTile({
  vdoUrl,
  label,
  score,
  highlighted,
  isHost,
  onKick,
  avatarUrl,
  onAvatarUpload,
  onAdjustScore,
}: {
  vdoUrl: string | null | undefined
  label: string
  score?: number
  highlighted?: boolean
  isHost?: boolean
  onKick?: () => void
  avatarUrl?: string | null
  onAvatarUpload?: (file: File) => void
  onAdjustScore?: (delta: number) => void
}) {
  const url = normalizeVdoUrl(vdoUrl)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [scorePopoverOpen, setScorePopoverOpen] = useState(false)
  const [customDelta, setCustomDelta] = useState('')

  // Fliegendes +N/-N-Popup, sobald sich score ändert -- egal ob durch richtig/falsch, manuelle
  // Anpassung oder von einem beliebigen anderen Client aus, da hier nur der Prop-Wert
  // beobachtet wird, nicht die Ursache. prevScoreRef startet direkt bei score, damit beim
  // ersten Rendern (Mount) kein Popup ausgelöst wird.
  const prevScoreRef = useRef(score)
  const [scorePop, setScorePop] = useState<{ delta: number; id: number } | null>(null)

  useEffect(() => {
    if (score === undefined) return
    const prev = prevScoreRef.current
    prevScoreRef.current = score
    if (prev === undefined || score === prev) return
    const delta = score - prev
    const id = Date.now()
    setScorePop({ delta, id })
    const timeout = setTimeout(() => {
      setScorePop((current) => (current?.id === id ? null : current))
    }, 1100)
    return () => clearTimeout(timeout)
  }, [score])

  return (
    <div className="flex flex-col gap-1.5 sm:gap-2">
      <div
        className={`relative aspect-video w-full rounded-xl p-[1.5px] transition-shadow duration-300 ${
          highlighted ? 'bg-gradient-to-br from-poke-yellow-300 to-poke-yellow-500 shadow-[var(--shadow-glow-yellow)]' : 'holo-border'
        }`}
      >
        <div className="relative w-full h-full rounded-[10px] overflow-hidden bg-stage-900">
          {url ? (
            <iframe src={url} className="w-full h-full" allow="camera;microphone;autoplay;fullscreen;display-capture" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/20 text-sm">Keine Kamera</div>
          )}

          {url && (
            <span className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-display font-700 tracking-wide text-poke-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-poke-red-500 live-dot" />
              LIVE
            </span>
          )}

          {onKick && (
            <button
              type="button"
              onClick={onKick}
              title="Kandidat entfernen"
              className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded-full bg-black/60 hover:bg-poke-red-500 text-white/70 hover:text-white text-sm leading-none transition-colors"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="glossy rounded-lg bg-stage-800/95 border border-white/10 px-3 py-2 flex items-center gap-2.5 shrink-0">
        <span className="relative w-9 h-9 shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <span
              className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarGradient(label, Boolean(isHost))} flex items-center justify-center text-sm font-display font-800 text-white`}
            >
              {label.slice(0, 1).toUpperCase()}
            </span>
          )}
          {onAvatarUpload && (
            <>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                title="Icon ändern"
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-stage-700 border border-stage-900 flex items-center justify-center text-[9px] leading-none text-white/80 hover:bg-poke-yellow-500 hover:text-stage-950 transition-colors"
              >
                ✎
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/png"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) onAvatarUpload(file)
                  e.target.value = ''
                }}
              />
            </>
          )}
        </span>
        <span className="flex-1 truncate text-center font-700 text-base">{label}</span>
        {score !== undefined ? (
          <span className="relative shrink-0 w-9">
            {scorePop && (
              <span
                key={scorePop.id}
                className={`score-pop pointer-events-none absolute -top-1 left-1/2 font-display font-800 text-sm whitespace-nowrap ${
                  scorePop.delta > 0 ? 'text-note-green' : 'text-poke-red-400'
                }`}
              >
                {scorePop.delta > 0 ? `+${scorePop.delta}` : scorePop.delta}
              </span>
            )}
            {onAdjustScore ? (
              <button
                type="button"
                onClick={() => setScorePopoverOpen((v) => !v)}
                title="Punkte anpassen"
                className="font-display font-700 text-lg text-poke-yellow-400 hover:text-poke-yellow-300 w-9 text-center"
              >
                {score}
              </button>
            ) : (
              <span className="block font-display font-700 text-lg text-poke-yellow-400 w-9 text-center">{score}</span>
            )}
            {onAdjustScore && scorePopoverOpen && (
              <div className="absolute z-30 top-full right-0 mt-2 w-40 holo-border rounded-xl p-px shadow-[0_0_30px_-8px_rgba(0,0,0,0.8)]">
                <div className="rounded-[11px] bg-stage-800/95 backdrop-blur-sm p-2.5 flex flex-col gap-2">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onAdjustScore(-1)
                        setScorePopoverOpen(false)
                      }}
                      className="w-8 h-8 rounded-lg bg-stage-700 hover:bg-stage-600 text-white font-700"
                    >
                      −1
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onAdjustScore(1)
                        setScorePopoverOpen(false)
                      }}
                      className="w-8 h-8 rounded-lg bg-stage-700 hover:bg-stage-600 text-white font-700"
                    >
                      +1
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={customDelta}
                      onChange={(e) => setCustomDelta(e.target.value)}
                      placeholder="±N"
                      className="w-full min-w-0 rounded-lg bg-stage-900 border border-stage-600 px-2 py-1 text-sm outline-none focus:border-poke-yellow-400"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const delta = Number(customDelta)
                        if (Number.isFinite(delta) && delta !== 0) onAdjustScore(delta)
                        setCustomDelta('')
                        setScorePopoverOpen(false)
                      }}
                      className="shrink-0 rounded-lg bg-poke-yellow-500 hover:bg-poke-yellow-400 text-stage-950 text-sm font-700 px-2.5 py-1"
                    >
                      OK
                    </button>
                  </div>
                </div>
              </div>
            )}
          </span>
        ) : (
          <span className="w-9 shrink-0" aria-hidden="true" />
        )}
      </div>
    </div>
  )
}
