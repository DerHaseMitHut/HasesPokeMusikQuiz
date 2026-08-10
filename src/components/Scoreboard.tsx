import type { PlayerRow } from '../store/quizStore'

export default function Scoreboard({
  players,
  highlightPlayerId,
  winnerPlayerId,
}: {
  players: PlayerRow[]
  highlightPlayerId?: string | null
  winnerPlayerId?: string | null
}) {
  const sorted = [...players].sort((a, b) => b.score - a.score)

  return (
    <ol className="flex flex-col gap-2">
      {sorted.map((player, index) => {
        const isMe = player.id === highlightPlayerId
        const isWinner = player.id === winnerPlayerId
        return (
          <li
            key={player.id}
            className={`flex items-center gap-3 rounded-xl px-4 py-2.5 border transition-colors ${
              isWinner
                ? 'bg-poke-yellow-400/10 border-poke-yellow-400 shadow-[var(--shadow-glow-yellow)]'
                : isMe
                  ? 'bg-poke-blue-600/15 border-poke-blue-500'
                  : 'bg-stage-800 border-stage-600'
            }`}
          >
            <span className="font-display font-700 text-white/40 w-5 text-right">{index + 1}</span>
            <span className="flex-1 font-700 truncate">{player.display_name}</span>
            <span className="font-display font-700 text-poke-yellow-400">{player.score}</span>
          </li>
        )
      })}
      {sorted.length === 0 && <p className="text-white/50">Noch keine Kandidaten beigetreten.</p>}
    </ol>
  )
}
