import { useEffect, useRef } from 'react'
import { useQuizStore } from '@/store/quizStore'
import { playBuzzSound, playCorrectSound, playWrongSound } from '@/lib/sounds'

// Spielt Soundeffekte für alle verbundenen Clients (Host/Kandidat/OBS) anhand geteilter
// buzzer_state-Änderungen ab -- nicht nur lokal für den, der gerade klickt. Wird einmal pro
// Route (HostLivePage/CandidatePlayPage/ObsView) aufgerufen.
export function useGameSounds() {
  const buzzerState = useQuizStore((s) => s.buzzerState)
  const initialized = useRef(false)
  const lastWonAt = useRef<string | null>(null)
  const lastResolutionId = useRef<string | null>(null)

  useEffect(() => {
    if (!buzzerState) return

    // Beim ersten Sync nach dem Verbinden (z.B. frischer Seitenaufruf mitten in einer laufenden
    // Runde) nur den aktuellen Stand merken, nicht rückwirkend Sounds für längst vergangene
    // Ereignisse abspielen.
    if (!initialized.current) {
      lastWonAt.current = buzzerState.won_at
      lastResolutionId.current = buzzerState.last_resolution_id
      initialized.current = true
      return
    }

    if (buzzerState.winner_player_id && buzzerState.won_at !== lastWonAt.current) {
      lastWonAt.current = buzzerState.won_at
      playBuzzSound()
    }

    if (buzzerState.last_resolution_id && buzzerState.last_resolution_id !== lastResolutionId.current) {
      lastResolutionId.current = buzzerState.last_resolution_id
      if (buzzerState.last_resolution === 'correct') playCorrectSound()
      else if (buzzerState.last_resolution === 'wrong') playWrongSound()
    }
  }, [buzzerState])
}
