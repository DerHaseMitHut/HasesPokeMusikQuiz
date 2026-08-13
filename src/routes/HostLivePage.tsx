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
import Scoreboard from '@/components/ui/Scoreboard'
import CamTile from '@/components/ui/CamTile'
import MusicStaff from '@/components/ui/MusicStaff'
import Card from '@/components/ui/Card'
import ActiveClipPlayer from '@/features/playback/ActiveClipPlayer'
import LoadingScreen from '@/components/ui/LoadingScreen'
import PagePlaceholder from '@/components/ui/PagePlaceholder'

const PANEL_BTN = 'glossy font-display font-700 rounded-lg transition-all duration-150 active:translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none px-4 py-2 text-sm'

export default function HostLivePage() {
  const { roomCode } = useParams<{ roomCode: string }>()
  const [room, setRoom] = useState<Room | null | undefined>(undefined)
  const [songs, setSongs] = useState<Song[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const { players, playbackState, buzzerState, connect, disconnect } = useQuizStore()

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
      <div className="flex items-center justify-between shrink-0">
        <h1 className="font-display text-lg sm:text-xl font-800 leading-tight">{room.name}</h1>
        {error && <p className="text-poke-red-400 text-xs">{error}</p>}
        <p className="text-white/40 text-xs shrink-0">
          Raumcode: <span className="font-mono tracking-widest text-poke-yellow-400">{room.code}</span>
        </p>
      </div>

      <div className="shrink-0">
        <MusicStaff className="h-5 w-full -mb-1" />
        <div
          className="grid gap-2 sm:gap-3 justify-center"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 190px))' }}
        >
          <CamTile vdoUrl={room.vdo_url} label="Gastgeber (Du)" />
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
      </div>

      <div className="flex-1 flex gap-2 sm:gap-3 min-h-0">
        <div className="flex-[2] min-w-0 flex flex-col gap-2 sm:gap-3 min-h-0">
          <div className="flex-[3] min-h-0 min-w-0">
            <ActiveClipPlayer />
          </div>

          <Card className="flex-1 min-h-0">
            <div className="p-3 sm:p-4 flex flex-col gap-2 h-full min-h-0">
              <div className="flex items-center justify-between shrink-0 gap-2">
                <p className="font-700 text-sm truncate">
                  {currentSong ? currentSong.title : 'Kein Song geladen'}
                  {playbackState?.current_clip === 'solution' && (
                    <span className="text-poke-yellow-400"> — Lösung</span>
                  )}
                </p>
                <div className="flex gap-2 shrink-0">
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
                </div>
              </div>

              <ul className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1.5">
                {songs.map((song) => (
                  <li
                    key={song.id}
                    className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-sm transition-colors ${
                      song.id === playbackState?.current_song_id ? 'bg-poke-blue-600/20' : 'bg-stage-900/70'
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
          </Card>

          <Card className="shrink-0">
            <div className="p-3 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-white/70 text-sm flex items-center gap-2">
                {buzzerState?.is_open && <span className="w-2 h-2 rounded-full bg-poke-red-500 live-dot" />}
                {buzzerState?.is_open
                  ? 'Buzzer offen'
                  : winner
                    ? `${winner.display_name} war zuerst!`
                    : 'Buzzer geschlossen'}
              </p>

              <div className="flex gap-2 flex-wrap">
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

        <div className="w-56 sm:w-64 shrink-0 min-h-0 flex flex-col gap-2 overflow-y-auto">
          <h2 className="font-display text-sm font-700 text-white/70 shrink-0">Kandidaten ({players.length})</h2>
          <Scoreboard players={players} winnerPlayerId={buzzerState?.winner_player_id} />
        </div>
      </div>
    </div>
  )
}
