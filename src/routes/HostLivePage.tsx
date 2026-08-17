import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getRoomByCode, type Room } from '@/features/rooms/rooms'
import { listSongsForRoom, type Song } from '@/features/songs/songs'
import SongSelectPanel from '@/features/songs/SongSelectPanel'
import { errorMessage } from '@/lib/errors'
import { closeBuzzer, openBuzzer, resolveBuzzer } from '@/features/buzzer/buzzer'
import { awardPoints, kickPlayer, uploadPlayerAvatar, getPlayerAvatarUrl } from '@/features/players/players'
import { loadSong, setPlaying, showHint, showSolution } from '@/features/playback/playback'
import { getServerOffsetMs, expectedPositionSeconds } from '@/features/playback/playbackSync'
import { useQuizStore } from '@/store/quizStore'
import CamTile from '@/components/ui/CamTile'
import HintPanel from '@/components/ui/HintPanel'
import LayoutSettingsPanel from '@/components/ui/LayoutSettingsPanel'
import PokeballWatermark from '@/components/ui/PokeballWatermark'
import StaffLines from '@/components/ui/StaffLines'
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
  const [obsLinkCopied, setObsLinkCopied] = useState(false)

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
  const hint1Text = playbackState?.hint1_shown ? currentSong?.hint1 : null
  const hint2Text = playbackState?.hint2_shown ? currentSong?.hint2 : null

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

  async function handleShowHint(hintNumber: 1 | 2) {
    setBusy(true)
    setError(null)
    try {
      await showHint(room!.id, hintNumber)
    } catch (err) {
      setError(errorMessage(err, `Tipp ${hintNumber} konnte nicht angezeigt werden.`))
    } finally {
      setBusy(false)
    }
  }

  async function handleCopyObsLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/obs/${room!.code}?token=${room!.obs_token}`)
      setObsLinkCopied(true)
      setTimeout(() => setObsLinkCopied(false), 1500)
    } catch {
      setError('Link konnte nicht kopiert werden.')
    }
  }

  async function handleAvatarUpload(playerId: string, file: File) {
    setBusy(true)
    setError(null)
    try {
      await uploadPlayerAvatar(playerId, file)
    } catch (err) {
      setError(errorMessage(err, 'Icon konnte nicht hochgeladen werden.'))
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
      <PokeballWatermark />
      <div className="flex items-center justify-between shrink-0 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-display font-800 text-xl tracking-tight shrink-0">
            <span className="text-poke-yellow-400">PokéMusik</span>
            <span className="text-poke-red-500">Quiz</span>
          </span>
        </div>
        {error && <p className="text-poke-red-400 text-xs truncate">{error}</p>}
        <div className="flex items-center gap-3 shrink-0">
          <Link to={`/host/${room.code}/setup`} className="text-white/40 hover:text-white/80 text-xs underline">
            Setup
          </Link>
          <button type="button" onClick={handleCopyObsLink} className="text-white/40 hover:text-white/80 text-xs underline">
            {obsLinkCopied ? 'OBS-Link kopiert!' : 'OBS-Link kopieren'}
          </button>
          <p className="text-white/40 text-xs">
            Raumcode <span className="font-mono tracking-widest text-poke-yellow-400">{room.code}</span>
          </p>
          <LayoutSettingsPanel roomId={room.id} layout={roomLayout} />
        </div>
      </div>

      <div className="relative isolate shrink-0">
        <StaffLines />
        <div className="grid gap-2 sm:gap-3 justify-center" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${roomLayout.camSize}px, ${roomLayout.camSize}px))` }}>
          <CamTile vdoUrl={room.vdo_url} label="Gastgeber (Du)" isHost />
          {players.map((player) => (
            <CamTile
              key={player.id}
              vdoUrl={player.vdo_url}
              label={player.display_name}
              score={player.score}
              highlighted={player.id === buzzerState?.winner_player_id}
              onKick={() => handleKick(player.id, player.display_name)}
              avatarUrl={getPlayerAvatarUrl(player.avatar_storage_path)}
              onAvatarUpload={(file) => handleAvatarUpload(player.id, file)}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 flex items-stretch justify-center gap-4 sm:gap-8">
        <HintPanel hint1={hint1Text} hint2={hint2Text} />
        <ActiveClipPlayer heightVh={roomLayout.videoMaxHeight} />
        {/* Spacer in HintPanel-Breite, damit das Video unabhängig von sichtbaren Tipps mittig bleibt. */}
        <div className="w-[11.75rem] shrink-0" aria-hidden="true" />
      </div>

      <Card className="shrink-0">
        <div className="p-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <SongSelectPanel
              songs={songs}
              currentSongId={playbackState?.current_song_id}
              onSelect={handleLoadSong}
              disabled={busy}
            />
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
              onClick={() => handleShowHint(1)}
              disabled={busy || !currentSong?.hint1 || playbackState?.hint1_shown}
              className={`${PANEL_BTN} bg-gradient-to-b from-poke-blue-400 to-poke-blue-600 text-white hover:brightness-110`}
            >
              {playbackState?.hint1_shown ? 'Tipp 1 gezeigt' : 'Tipp 1 anzeigen'}
            </button>
            <button
              type="button"
              onClick={() => handleShowHint(2)}
              disabled={busy || !currentSong?.hint2 || playbackState?.hint2_shown}
              className={`${PANEL_BTN} bg-gradient-to-b from-poke-blue-400 to-poke-blue-600 text-white hover:brightness-110`}
            >
              {playbackState?.hint2_shown ? 'Tipp 2 gezeigt' : 'Tipp 2 anzeigen'}
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
