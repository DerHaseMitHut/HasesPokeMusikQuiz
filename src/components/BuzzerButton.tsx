import { useEffect, useState } from 'react'
import { pressBuzzer } from '../lib/buzzer'
import { errorMessage } from '../lib/errors'
import { useQuizStore } from '../store/quizStore'

export default function BuzzerButton({ roomId, playerId }: { roomId: string; playerId: string }) {
  const buzzerState = useQuizStore((s) => s.buzzerState)
  const players = useQuizStore((s) => s.players)
  const [pressed, setPressed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setPressed(false)
    setError(null)
  }, [buzzerState?.round_id])

  if (!buzzerState) return null

  const isOpen = buzzerState.is_open
  const winnerId = buzzerState.winner_player_id
  const iWon = winnerId === playerId
  const someoneWon = winnerId !== null
  const winnerName = someoneWon ? players.find((p) => p.id === winnerId)?.display_name : null

  async function handlePress() {
    if (!isOpen || pressed) return
    setPressed(true)
    setError(null)
    try {
      await pressBuzzer(roomId, buzzerState!.round_id, playerId)
    } catch (err) {
      setError(errorMessage(err, 'Buzzern fehlgeschlagen.'))
      setPressed(false)
    }
  }

  let label = 'Warte auf Moderator…'
  if (isOpen && !pressed) label = 'BUZZER!'
  else if (pressed && !someoneWon) label = '…'
  else if (iWon) label = 'Du warst zuerst!'
  else if (someoneWon) label = `${winnerName ?? 'Jemand'} war zuerst`

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={handlePress}
        disabled={!isOpen || pressed}
        className={`h-40 w-40 rounded-full font-display font-800 text-lg leading-tight px-4 text-center transition-all active:scale-95 disabled:cursor-not-allowed ${
          iWon
            ? 'bg-poke-yellow-400 text-stage-950 shadow-[var(--shadow-glow-yellow)]'
            : isOpen
              ? 'bg-poke-red-500 hover:bg-poke-red-400 text-white shadow-[var(--shadow-glow-red)]'
              : 'bg-stage-700 text-white/40'
        }`}
      >
        {label}
      </button>
      {error && <p className="text-poke-red-400 text-sm">{error}</p>}
    </div>
  )
}
