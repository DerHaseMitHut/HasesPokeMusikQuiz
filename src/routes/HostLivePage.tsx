import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getRoomByCode, type Room } from '@/features/rooms/rooms'
import { listSongsForRoom, type Song } from '@/features/songs/songs'
import { errorMessage } from '@/lib/errors'
import { closeBuzzer, openBuzzer, resolveBuzzer } from '@/features/buzzer/buzzer'
import { awardPoints, kickPlayer } from '@/features/players/players'
import { loadSong, setPlaying, showSolution } from '@/features/playback/playback'
import { getServerOffsetMs, expectedPositionSeconds } from '@/features/playback/playbackSync'
import { useQuizStore } from '@/store/quizStore'
import CamTile from '@/components/ui/CamTile'
import LayoutSettingsPanel from '@/components/ui/LayoutSettingsPanel'
import Card from '@/components/ui/Card'
import ActiveClipPlayer from '@/features/playback/ActiveClipPlayer'
import LoadingScreen from '@/components/ui/LoadingScreen'
import PagePlaceholder from '@/components/ui/PagePlaceholder'

const PANEL_BTN =
  'glossy font-display font-700 rounded-lg transition-all duration-150 active:translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none px-4 py-2 text-sm'

export default function HostLivePage() {
  const { roomCode } = useParams<{ roomCode: string }>()
  const [room, setRoom] = useState<Room | null | undefined>(undefined)
  const [songs, setSongs] = useState<Song[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const { players, playbackState, buzzerState, roomLayout, connect, disconnect } = useQuizStore()

  useEffect(() => {
    if (!roomCode) return
    getRoomByCode(roomCode)
      .then(setRoom)
      .catch((err) => setLoadError(errorMessage(err, 'Raum konnte nicht geladen werden.')))
  }, [roomCode])

  useEffect(() => {
    if (!room) return
    let cancelled = false
    connect(room.id).catch((err) => {
      if (!cancelled) setLoadError(errorMessage(err, 'Verbindung zum Raum fehlgeschlagen.'))
    })
    listSongsForRoom(room.id)
      .then((s) => {
        if (!cancelled) setSongs(s)
      })
      .catch((err) => {
        if (!cancelled) setLoadError(errorMessage(err, 'Songs konnten nicht geladen werden.'))
      })
    return () => {
      cancelled = true
      disconnect()
    }
  }, [room, connect, disconnect])

  if (loadError) return <PagePlaceholder title="Fehler" note={loadError} />
  if (room === undefined) return <LoadingScreen />
  if (room === null) return <PagePlaceholder title="Raum nicht gefunden" note={`Kein Raum mit Code „${roomCode}“.`} />

  const winner = buzzerState?.winner_player_id ? players.find((p) => p.id === buzzerState.winner_player_id) : null
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
    if (!songId) return
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

  async function handleCorrect() {
    if (!winner || !currentSong) return
    setBusy(true)
    setError(null)
    try {
      await awardPoints(winner.id, currentSong.points)
      await resolveBuzzer(room!.id)
    } catch (err) {
      setError(errorMessage(err, 'Punkte konnten nicht vergeben werden.'))
    } finally {
      setBusy(false)
    }
  }

  async function handleWrong() {
    setBusy(true)
    setError(null)
    try {
      await openBuzzer(room!.id, buzzerState?.current_song_id ?? null)
    } catch (err) {
      setError(errorMessage(err, 'Buzzer konnte nicht neu geöffnet werden.'))
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

  async function handleKick(playerId: string, displayName: string) {
    if (!window.confirm(`${displayName} aus dem Raum entfernen?`)) return
    setBusy(true)
    setError(null)
    try {
      await kickPlayer(playerId)
    } catch (err) {
      setError(errorMessage(err, 'Kandidat konnte nicht entfernt werden.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden p-3 sm:p-4 gap-2 sm:gap-3">
      <div className="flex items-center justify-between shrink-0 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-display font-800 text-sm tracking-tight shrink-0">
            <span className="text-poke-yellow-400">Musik</span>
            <span className="text-poke-red-500">Quiz</span>
          </span>
          <span className="text-white/30 text-xs truncate">{room.name}</span>
        </div>
        {error && <p className="text-poke-red-400 text-xs truncate">{error}</p>}
        <div className="flex items-center gap-3 shrink-0">
          <p className="text-white/40 text-xs">
            Raumcode <span className="font-mono tracking-widest text-poke-yellow-400">{room.code}</span>
          </p>
          <LayoutSettingsPanel roomId={room.id} layout={roomLayout} />
        </div>
      </div>

      <div className="grid gap-2 sm:gap-3 justify-center shrink-0" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${roomLayout.camSize}px, ${roomLayout.camSize}px))` }}>
        <CamTile vdoUrl={room.vdo_url} label="Gastgeber (Du)" isHost />
        {players.map((player) => (
          <CamTile
            key={player.id}
            vdoUrl={player.vdo_url}
            label={player.display_name}
            score={player.score}
            highlighted={player.id === buzzerState?.winner_player_id}
            onKick={() => handleKick(player.id, player.display_name)}
          />
        ))}
      </div>

      <div className="flex-1 min-h-0 flex items-center justify-center">
        <ActiveClipPlayer heightVh={roomLayout.videoMaxHeight} />
      </div>

      <Card className="shrink-0">
        <div className="p-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <select
              value={playbackState?.current_song_id ?? ''}
              onChange={(e) => handleLoadSong(e.target.value)}
              disabled={busy || songs.length === 0}
              className="rounded-lg bg-stage-900/80 border border-stage-600 px-3 py-2 text-sm outline-none focus:border-poke-yellow-400 disabled:opacity-50 max-w-[220px]"
            >
              <option value="" disabled>
                {songs.length === 0 ? 'Keine Songs' : 'Song wählen…'}
              </option>
              {songs.map((song) => (
                <option key={song.id} value={song.id}>
                  {song.title}
                </option>
              ))}
            </select>
            <p className="text-white/60 text-sm hidden sm:flex items-center gap-2 truncate">
              {buzzerState?.is_open && <span className="w-2 h-2 rounded-full bg-poke-red-500 live-dot shrink-0" />}
              {buzzerState?.is_open
                ? 'Buzzer offen'
                : winner
                  ? `${winner.display_name} war zuerst!`
                  : playbackState?.current_clip === 'solution'
                    ? 'Lösung'
                    : 'Buzzer geschlossen'}
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleTogglePlay}
              disabled={busy || !playbackState?.current_song_id}
              className={`${PANEL_BTN} bg-gradient-to-b from-poke-blue-400 to-poke-blue-600 text-white hover:brightness-110`}
            >
              {playbackState?.is_playing ? 'Pause' : 'Play'}
            </button>
            <button
              type="button"
              onClick={handleShowSolution}
              disabled={busy || !playbackState?.current_song_id || playbackState.current_clip === 'solution'}
              className={`${PANEL_BTN} bg-gradient-to-b from-poke-yellow-300 to-poke-yellow-500 text-stage-950 hover:brightness-105`}
            >
              Lösung zeigen
            </button>
            {winner && (
              <>
                <button
                  type="button"
                  onClick={handleCorrect}
                  disabled={busy || !currentSong}
                  className={`${PANEL_BTN} bg-gradient-to-b from-poke-yellow-300 to-note-green text-stage-950 hover:brightness-105`}
                >
                  Richtig{currentSong ? ` (+${currentSong.points})` : ''}
                </button>
                <button
                  type="button"
                  onClick={handleWrong}
                  disabled={busy}
                  className={`${PANEL_BTN} bg-stage-700 text-white/90 hover:bg-stage-600`}
                >
                  Falsch
                </button>
              </>
            )}
            <button
              type="button"
              onClick={handleOpen}
              disabled={busy || buzzerState?.is_open}
              className={`${PANEL_BTN} bg-gradient-to-b from-poke-red-400 to-poke-red-600 text-white hover:brightness-110`}
            >
              Buzzer öffnen
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={busy || !buzzerState?.is_open}
              className={`${PANEL_BTN} bg-stage-700 text-white/90 hover:bg-stage-600`}
            >
              Schließen
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}
