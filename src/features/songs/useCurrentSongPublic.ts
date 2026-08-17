import { useEffect, useState } from 'react'
import { useQuizStore } from '@/store/quizStore'
import { getSongPublic, type SongPublic } from './songs'

// Lädt die spoilerfreie Sicht auf die aktuell geladene Runde (für Kandidaten/OBS, die keinen
// Zugriff auf die echte songs-Tabelle haben). Holt neu, sobald sich Song, Clip-Typ oder einer
// der beiden Tipp-Freigabe-Flags ändert -- songs_public liefert je nach diesen Flags
// unterschiedliche hint1/hint2-Werte für dieselbe Zeile.
export function useCurrentSongPublic(): SongPublic | null {
  const songId = useQuizStore((s) => s.playbackState?.current_song_id)
  const clip = useQuizStore((s) => s.playbackState?.current_clip)
  const hint1Shown = useQuizStore((s) => s.playbackState?.hint1_shown)
  const hint2Shown = useQuizStore((s) => s.playbackState?.hint2_shown)
  const [song, setSong] = useState<SongPublic | null>(null)

  useEffect(() => {
    if (!songId) {
      setSong(null)
      return
    }
    let cancelled = false
    getSongPublic(songId).then((s) => {
      if (!cancelled) setSong(s)
    })
    return () => {
      cancelled = true
    }
  }, [songId, clip, hint1Shown, hint2Shown])

  return song
}
