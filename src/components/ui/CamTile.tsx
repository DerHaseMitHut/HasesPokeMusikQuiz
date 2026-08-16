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
}: {
  vdoUrl: string | null | undefined
  label: string
  score?: number
  highlighted?: boolean
  isHost?: boolean
  onKick?: () => void
}) {
  const url = normalizeVdoUrl(vdoUrl)

  return (
    <div className="flex flex-col gap-1.5 sm:gap-2">
      <div
        className={`relative aspect-video w-full rounded-xl overflow-hidden bg-stage-900 border transition-shadow duration-300 ${
          highlighted ? 'border-poke-yellow-400 shadow-[var(--shadow-glow-yellow)]' : 'border-white/10'
        }`}
      >
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

      <div className="glossy rounded-lg bg-stage-800/95 border border-white/10 px-3 py-2 flex items-center gap-2.5 shrink-0">
        <span
          className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarGradient(label, Boolean(isHost))} flex items-center justify-center text-sm font-display font-800 text-white shrink-0`}
        >
          {label.slice(0, 1).toUpperCase()}
        </span>
        <span className="flex-1 truncate text-center font-700 text-base">{label}</span>
        {score !== undefined ? (
          <span className="font-display font-700 text-lg text-poke-yellow-400 shrink-0 w-9 text-center">{score}</span>
        ) : (
          <span className="w-9 shrink-0" aria-hidden="true" />
        )}
      </div>
    </div>
  )
}
