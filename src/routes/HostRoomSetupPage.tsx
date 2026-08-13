import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getRoomByCode, updateRoomVdoUrl, type Room } from '@/features/rooms/rooms'
import { listSongsForRoom, type Song } from '@/features/songs/songs'
import { errorMessage } from '@/lib/errors'
import SongUploadForm from '@/features/songs/SongUploadForm'
import SongList from '@/features/songs/SongList'
import LoadingScreen from '@/components/ui/LoadingScreen'
import PagePlaceholder from '@/components/ui/PagePlaceholder'

export default function HostRoomSetupPage() {
  const { roomCode } = useParams<{ roomCode: string }>()
  const [room, setRoom] = useState<Room | null | undefined>(undefined)
  const [songs, setSongs] = useState<Song[]>([])
  const [error, setError] = useState<string | null>(null)
  const vdoUrlInputRef = useRef<HTMLInputElement>(null)
  const [savingVdoUrl, setSavingVdoUrl] = useState(false)

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
  const obsUrl = `${window.location.origin}/obs/${room.code}`

  async function handleSaveVdoUrl(event: FormEvent) {
    event.preventDefault()
    if (!room) return
    setSavingVdoUrl(true)
    setError(null)
    try {
      await updateRoomVdoUrl(room.id, vdoUrlInputRef.current?.value.trim() ?? '')
      await reload()
    } catch (err) {
      setError(errorMessage(err, 'Kamera-Link konnte nicht gespeichert werden.'))
    } finally {
      setSavingVdoUrl(false)
    }
  }

  return (
    <div className="min-h-screen px-6 py-12 max-w-3xl mx-auto flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-700">{room.name}</h1>
          <p className="text-white/60 mt-1">
            Raumcode: <span className="font-mono tracking-widest text-poke-yellow-400">{room.code}</span>
          </p>
          <p className="text-white/40 text-sm mt-1 break-all">Beitritts-Link: {joinUrl}</p>
          <p className="text-white/40 text-sm mt-1 break-all">OBS-Link: {obsUrl}</p>
        </div>
        <Link
          to={`/host/${room.code}/live`}
          className="shrink-0 font-display font-700 rounded-xl bg-poke-blue-600 hover:bg-poke-blue-500 transition-colors px-5 py-3"
        >
          Live →
        </Link>
      </div>

      <form onSubmit={handleSaveVdoUrl} className="rounded-2xl bg-stage-800 border border-stage-600 p-6 flex flex-col gap-3">
        <h2 className="font-display text-lg font-700">Deine Kamera</h2>
        <div className="flex gap-2">
          <input
            ref={vdoUrlInputRef}
            key={room.vdo_url}
            defaultValue={room.vdo_url ?? ''}
            placeholder="Dein VDO.Ninja-Link"
            className="flex-1 rounded-xl bg-stage-900 border border-stage-600 px-4 py-2 text-sm outline-none focus:border-poke-yellow-400"
          />
          <button
            type="submit"
            disabled={savingVdoUrl}
            className="rounded-xl bg-stage-700 hover:bg-stage-600 disabled:opacity-50 px-4 py-2 text-sm transition-colors shrink-0"
          >
            {savingVdoUrl ? '…' : 'Speichern'}
          </button>
        </div>
      </form>

      <SongUploadForm roomId={room.id} nextOrderIndex={songs.length} onCreated={reload} />

      <div>
        <h2 className="font-display text-xl font-700 mb-4">Songs ({songs.length})</h2>
        <SongList songs={songs} onChanged={reload} />
      </div>
    </div>
  )
}
