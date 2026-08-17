import { useEffect, useState } from 'react'
import { pressBuzzer } from './buzzer'
import { errorMessage } from '@/lib/errors'
import { useQuizStore } from '@/store/quizStore'
import PokeballIcon from '@/components/ui/PokeballIcon'

export default function BuzzerButton({
  roomId,
  playerId,
  hotkey,
  hotkeyRecording,
}: {
  roomId: string
  playerId: string
  hotkey?: string | null
  hotkeyRecording?: boolean
}) {
  const buzzerState = useQuizStore((s) => s.buzzerState)
  const players = useQuizStore((s) => s.players)
  const currentClip = useQuizStore((s) => s.playbackState?.current_clip)
  const [pressed, setPressed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setPressed(false)
    setError(null)
  }, [buzzerState?.round_id])

  // Während der Lösungs-Clip läuft, ist Buzzern gesperrt -- serverseitig ohnehin per Trigger
  // (guard_buzz_event) durchgesetzt, hier nur zusätzlich fürs UI, damit gar nicht erst geklickt
  // werden kann.
  const isOpen = (buzzerState?.is_open ?? false) && currentClip !== 'solution'

  async function handlePress() {
    if (!buzzerState || !isOpen || pressed) return
    setPressed(true)
    setError(null)
    try {
      await pressBuzzer(roomId, buzzerState.round_id, playerId)
    } catch (err) {
      setError(errorMessage(err, 'Buzzern fehlgeschlagen.'))
      setPressed(false)
    }
  }

  // Hotkey auslösen -- Dependencies enthalten isOpen/pressed/round_id, damit der Listener
  // immer die aktuelle handlePress-Closure nutzt statt eine veraltete einzufangen.
  useEffect(() => {
    if (!hotkey || hotkeyRecording) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.code !== hotkey || e.repeat) return
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return
      e.preventDefault()
      handlePress()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [hotkey, hotkeyRecording, isOpen, pressed, buzzerState?.round_id])

  if (!buzzerState) return null

  const winnerId = buzzerState.winner_player_id
  const iWon = winnerId === playerId
  const someoneWon = winnerId !== null
  const winnerName = someoneWon ? players.find((p) => p.id === winnerId)?.display_name : null

  let label = 'Warte auf Moderator…'
  if (isOpen && !pressed) label = 'BUZZER!'
  else if (pressed && !someoneWon) label = '…'
  else if (iWon) label = 'Du warst zuerst!'
  else if (someoneWon) label = `${winnerName ?? 'Jemand'} war zuerst`

  return (
    <div className="flex flex-col items-center justify-center gap-3 shrink-0">
      <div className="relative flex items-center justify-center">
        <PokeballIcon className="pointer-events-none absolute -z-10 w-72 h-72 opacity-[0.09] -rotate-12" />
        <div
          className={`relative rounded-full p-3 transition-shadow duration-300 ${
            isOpen && !pressed ? 'shadow-[0_0_50px_10px_rgba(227,53,13,0.35)] animate-pulse' : ''
          }`}
        >
          <div className="rounded-full bg-gradient-to-b from-stage-600 to-stage-950 p-2.5">
            <button
              type="button"
              onClick={handlePress}
              disabled={!isOpen || pressed}
              className={`glossy relative h-36 w-36 rounded-full font-display font-800 text-lg leading-tight px-4 text-center transition-all duration-150 active:translate-y-1 disabled:cursor-not-allowed ${
                iWon
                  ? 'bg-gradient-to-b from-poke-yellow-300 to-poke-yellow-500 text-stage-950 shadow-[0_6px_0_0_#a37f00,var(--shadow-glow-yellow)]'
                  : isOpen
                    ? 'bg-gradient-to-b from-poke-red-400 to-poke-red-600 text-white shadow-[0_6px_0_0_var(--color-poke-red-700),var(--shadow-glow-red)] hover:brightness-110'
                    : 'bg-gradient-to-b from-stage-700 to-stage-800 text-white/40 shadow-[0_6px_0_0_var(--color-stage-950)]'
              } ${!isOpen || pressed ? 'active:translate-y-0' : ''}`}
            >
              {label}
            </button>
          </div>
        </div>
      </div>
      {error && <p className="text-poke-red-400 text-sm">{error}</p>}
    </div>
  )
}
