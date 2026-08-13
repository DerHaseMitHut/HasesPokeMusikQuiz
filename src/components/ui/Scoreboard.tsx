import type { PlayerRow } from '@/store/quizStore'

const RANK_COLORS: Record<number, string> = {
  0: 'bg-gradient-to-b from-poke-yellow-300 to-poke-yellow-500 text-stage-950',
  1: 'bg-gradient-to-b from-white/70 to-white/40 text-stage-950',
  2: 'bg-gradient-to-b from-poke-red-400/80 to-poke-red-600/80 text-white',
}

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
            className={`flex items-center gap-3 rounded-xl px-4 py-3.5 border transition-colors ${
              isWinner
                ? 'bg-poke-yellow-400/10 border-poke-yellow-400 shadow-[var(--shadow-glow-yellow)]'
                : isMe
                  ? 'bg-poke-blue-600/15 border-poke-blue-500'
                  : 'bg-stage-800 border-stage-600'
            }`}
          >
            <span
              className={`flex items-center justify-center w-8 h-8 rounded-full font-display font-800 text-sm shrink-0 ${
                RANK_COLORS[index] ?? 'bg-stage-700 text-white/50'
              }`}
            >
              {index + 1}
            </span>
            <span className="flex-1 font-700 text-base truncate">{player.display_name}</span>
            <span className="font-display font-700 text-lg text-poke-yellow-400">{player.score}</span>
          </li>
        )
      })}
      {sorted.length === 0 && <p className="text-white/50">Noch keine Kandidaten beigetreten.</p>}
    </ol>
  )
}
