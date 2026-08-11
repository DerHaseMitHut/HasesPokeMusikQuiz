import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getRoomByCode, type Room } from '@/features/rooms/rooms'
import { listSongsForRoom, type Song } from '@/features/songs/songs'
import { errorMessage } from '@/lib/errors'
import { closeBuzzer, openBuzzer } from '@/features/buzzer/buzzer'
import { loadSong, setPlaying, showSolution } from '@/features/playback/playback'
import { getServerOffsetMs, expectedPositionSeconds } from '@/features/playback/playbackSync'
import { useQuizStore } from '@/store/quizStore'
import Scoreboard from '@/components/ui/Scoreboard'
import ActiveClipPlayer from '@/features/playback/ActiveClipPlayer'
import LoadingScreen from '@/components/ui/LoadingScreen'
import PagePlaceholder from '@/components/ui/PagePlaceholder'

export default function HostLivePage() {
  const { roomCode } = useParams<{ roomCode: string }>()
  const [room, setRoom] = useState<Room | null | undefined>(undefined)
  const [songs, setSongs] = useState<Song[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const { players, playbackState, buzzerState, connect, disconnect } = useQuizStore()

  useEffect(() => {
    if (!roomCode) return
    getRoomByCode(roomCode)
      .then(setRoom)
      .catch((err) => setError(errorMessage(err, 'Raum konnte nicht geladen werden.')))
  }, [roomCode])

  useEffect(() => {
    if (!room) return
    let cancelled = false
    connect(room.id).catch((err) => {
      if (!cancelled) setError(errorMessage(err, 'Verbindung zum Raum fehlgeschlagen.'))
    })
    listSongsForRoom(room.id)
      .then((s) => {
        if (!cancelled) setSongs(s)
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, 'Songs konnten nicht geladen werden.'))
      })
    return () => {
      cancelled = true
      disconnect()
    }
  }, [room, connect, disconnect])

  if (error) return <PagePlaceholder title="Fehler" note={error} />
  if (room === undefined) return <LoadingScreen />
  if (room === null) return <PagePlaceholder title="Raum nicht gefunden" note={`Kein Raum mit Code „${roomCode}“.`} />

  const winner = buzzerState?.winner_player_id
    ? players.find((p) => p.id === buzzerState.winner_player_id)
    : null
  const currentSong = songs.find((s) => s.id === playbackState?.current_song_id) ?? null

  async function handleOpen() {
    setBusy(true)
    setError(null)
    try {
      await openBuzzer(room!.id, buzzerState?.current_song_id ?? null)
    } catch (err) {
      setError(errorMessage(err, 'Buzzer öffnen fehlgeschlagen.'))
    } finally {
      setBusy(false)
    }
  }

  async function handleClose() {
    setBusy(true)
    setError(null)
    try {
      await closeBuzzer(room!.id)
    } catch (err) {
      setError(errorMessage(err, 'Buzzer schließen fehlgeschlagen.'))
    } finally {
      setBusy(false)
    }
  }

  async function handleLoadSong(songId: string) {
    setBusy(true)
    setError(null)
    try {
      await loadSong(room!.id, songId)
    } catch (err) {
      setError(errorMessage(err, 'Song konnte nicht geladen werden.'))
    } finally {
      setBusy(false)
    }
  }

  async function handleTogglePlay() {
    if (!playbackState) return
    setBusy(true)
    setError(null)
    try {
      if (playbackState.is_playing) {
        const offset = await getServerOffsetMs()
        const position = expectedPositionSeconds(playbackState, offset)
        await setPlaying(room!.id, false, position)
      } else {
        await setPlaying(room!.id, true, playbackState.position_seconds)
      }
    } catch (err) {
      setError(errorMessage(err, 'Wiedergabe konnte nicht geändert werden.'))
    } finally {
      setBusy(false)
    }
  }

  async function handleShowSolution() {
    if (!playbackState?.current_song_id) return
    setBusy(true)
    setError(null)
    try {
      await showSolution(room!.id, playbackState.current_song_id)
    } catch (err) {
      setError(errorMessage(err, 'Lösung konnte nicht gezeigt werden.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-2xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-700">{room.name}</h1>
        <p className="text-white/50 text-sm mt-1">
          Raumcode: <span className="font-mono tracking-widest text-poke-yellow-400">{room.code}</span>
        </p>
      </div>

      <ActiveClipPlayer />

      <div className="rounded-2xl bg-stage-800 border border-stage-600 p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="font-700">
            {currentSong ? currentSong.title : 'Kein Song geladen'}
            {playbackState?.current_clip === 'solution' && (
              <span className="text-poke-yellow-400"> — Lösung</span>
            )}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleTogglePlay}
              disabled={busy || !playbackState?.current_song_id}
              className="font-display font-700 rounded-lg bg-poke-blue-600 hover:bg-poke-blue-500 disabled:opacity-50 transition-colors px-4 py-2"
            >
              {playbackState?.is_playing ? 'Pause' : 'Play'}
            </button>
            <button
              type="button"
              onClick={handleShowSolution}
              disabled={busy || !playbackState?.current_song_id || playbackState.current_clip === 'solution'}
              className="font-display font-700 rounded-lg bg-poke-yellow-400 text-stage-950 hover:bg-poke-yellow-300 disabled:opacity-50 transition-colors px-4 py-2"
            >
              Lösung zeigen
            </button>
          </div>
        </div>

        <ul className="flex flex-col gap-2 max-h-64 overflow-y-auto">
          {songs.map((song) => (
            <li
              key={song.id}
              className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                song.id === playbackState?.current_song_id ? 'bg-poke-blue-600/20' : 'bg-stage-900'
              }`}
            >
              <span className="truncate">{song.title}</span>
              <button
                type="button"
                onClick={() => handleLoadSong(song.id)}
                disabled={busy}
                className="text-sm font-700 text-poke-blue-400 hover:text-poke-blue-300 disabled:opacity-50 shrink-0 ml-3"
              >
                Laden
              </button>
            </li>
          ))}
          {songs.length === 0 && <p className="text-white/50 text-sm">Keine Songs in diesem Raum.</p>}
        </ul>
      </div>

      <div className="rounded-2xl bg-stage-800 border border-stage-600 p-6 flex flex-col items-center gap-4">
        <p className="text-white/70">
          {buzzerState?.is_open
            ? 'Buzzer ist offen — Kandidaten können buzzern.'
            : winner
              ? `${winner.display_name} war zuerst!`
              : 'Buzzer ist geschlossen.'}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleOpen}
            disabled={busy || buzzerState?.is_open}
            className="font-display font-700 rounded-xl bg-poke-red-500 hover:bg-poke-red-400 disabled:opacity-50 transition-colors px-6 py-3"
          >
            Buzzer öffnen
          </button>
          <button
            type="button"
            onClick={handleClose}
            disabled={busy || !buzzerState?.is_open}
            className="font-display font-700 rounded-xl bg-stage-700 hover:bg-stage-600 disabled:opacity-50 transition-colors px-6 py-3"
          >
            Schließen
          </button>
        </div>
      </div>

      <div>
        <h2 className="font-display text-lg font-700 mb-3">Kandidaten ({players.length})</h2>
        <Scoreboard players={players} winnerPlayerId={buzzerState?.winner_player_id} />
      </div>
    </div>
  )
}
