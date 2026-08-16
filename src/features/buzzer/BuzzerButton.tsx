import { useEffect, useState } from 'react'
import { pressBuzzer } from './buzzer'
import { errorMessage } from '@/lib/errors'
import { useQuizStore } from '@/store/quizStore'

const HOTKEY_STORAGE_KEY = 'musikquiz:buzzer-hotkey'

// KeyboardEvent.code -> Anzeigename. Nur für gängige Tasten, sonst wird der Rohcode gezeigt.
function formatKeyCode(code: string): string {
  if (code.startsWith('Key')) return code.slice(3)
  if (code.startsWith('Digit')) return code.slice(5)
  if (code.startsWith('Numpad')) return `Num ${code.slice(6)}`
  if (code.startsWith('Arrow')) return `Pfeil ${code.slice(5)}`
  if (code === 'Space') return 'Leertaste'
  return code
}

export default function BuzzerButton({ roomId, playerId }: { roomId: string; playerId: string }) {
  const buzzerState = useQuizStore((s) => s.buzzerState)
  const players = useQuizStore((s) => s.players)
  const [pressed, setPressed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hotkey, setHotkey] = useState<string | null>(() => localStorage.getItem(HOTKEY_STORAGE_KEY))
  const [recording, setRecording] = useState(false)

  useEffect(() => {
    setPressed(false)
    setError(null)
  }, [buzzerState?.round_id])

  const isOpen = buzzerState?.is_open ?? false

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
    if (!hotkey || recording) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.code !== hotkey || e.repeat) return
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return
      e.preventDefault()
      handlePress()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [hotkey, recording, isOpen, pressed, buzzerState?.round_id])

  // Hotkey aufnehmen: nächster Tastendruck wird gespeichert, Escape bricht ab.
  useEffect(() => {
    if (!recording) return
    function onKeyDown(e: KeyboardEvent) {
      e.preventDefault()
      if (e.code === 'Escape') {
        setRecording(false)
        return
      }
      localStorage.setItem(HOTKEY_STORAGE_KEY, e.code)
      setHotkey(e.code)
      setRecording(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [recording])

  function clearHotkey() {
    localStorage.removeItem(HOTKEY_STORAGE_KEY)
    setHotkey(null)
  }

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
      {error && <p className="text-poke-red-400 text-sm">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setRecording(true)}
          className="text-xs text-white/40 hover:text-white/80 underline"
        >
          {recording ? 'Taste drücken… (Esc = abbrechen)' : hotkey ? `Hotkey: ${formatKeyCode(hotkey)} (ändern)` : 'Hotkey festlegen'}
        </button>
        {hotkey && !recording && (
          <button type="button" onClick={clearHotkey} className="text-xs text-white/30 hover:text-white/60 underline">
            entfernen
          </button>
        )}
      </div>
    </div>
  )
}
