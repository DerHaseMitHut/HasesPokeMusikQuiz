import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getRoomByCode, type Room } from '../lib/rooms'
import { listSongsForRoom, type Song } from '../lib/songs'
import { errorMessage } from '../lib/errors'
import SongUploadForm from '../components/SongUploadForm'
import SongList from '../components/SongList'
import LoadingScreen from '../components/LoadingScreen'
import PagePlaceholder from '../components/PagePlaceholder'

export default function HostRoomSetupPage() {
  const { roomCode } = useParams<{ roomCode: string }>()
  const [room, setRoom] = useState<Room | null | undefined>(undefined)
  const [songs, setSongs] = useState<Song[]>([])
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!roomCode) return
    try {
      const r = await getRoomByCode(roomCode)
      setRoom(r)
      if (r) setSongs(await listSongsForRoom(r.id))
    } catch (err) {
      setError(errorMessage(err, 'Raum konnte nicht geladen werden.'))
    }
  }, [roomCode])

  useEffect(() => {
    reload()
  }, [reload])

  if (error) return <PagePlaceholder title="Fehler" note={error} />
  if (room === undefined) return <LoadingScreen />
  if (room === null) return <PagePlaceholder title="Raum nicht gefunden" note={`Kein Raum mit Code „${roomCode}“.`} />

  const joinUrl = `${window.location.origin}/join?code=${room.code}`

  return (
    <div className="min-h-screen px-6 py-12 max-w-3xl mx-auto flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-700">{room.name}</h1>
          <p className="text-white/60 mt-1">
            Raumcode: <span className="font-mono tracking-widest text-poke-yellow-400">{room.code}</span>
          </p>
          <p className="text-white/40 text-sm mt-1 break-all">Beitritts-Link: {joinUrl}</p>
        </div>
        <Link
          to={`/host/${room.code}/live`}
          className="shrink-0 font-display font-700 rounded-xl bg-poke-blue-600 hover:bg-poke-blue-500 transition-colors px-5 py-3"
        >
          Live →
        </Link>
      </div>

      <SongUploadForm roomId={room.id} nextOrderIndex={songs.length} onCreated={reload} />

      <div>
        <h2 className="font-display text-xl font-700 mb-4">Songs ({songs.length})</h2>
        <SongList songs={songs} onChanged={reload} />
      </div>
    </div>
  )
}
