import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { createRoom, listRooms, type Room } from '@/features/rooms/rooms'
import { useAuthStore } from '@/features/auth/authStore'
import { errorMessage } from '@/lib/errors'
import LoadingScreen from '@/components/ui/LoadingScreen'

export default function HostRoomListPage() {
  const userId = useAuthStore((s) => s.userId)
  const [rooms, setRooms] = useState<Room[] | null>(null)
  const [newRoomName, setNewRoomName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listRooms()
      .then(setRooms)
      .catch((err) => setError(errorMessage(err, 'Räume konnten nicht geladen werden.')))
  }, [])

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    if (!userId || newRoomName.trim().length === 0) return
    setCreating(true)
    setError(null)
    try {
      const room = await createRoom(newRoomName.trim(), userId)
      setRooms((prev) => [room, ...(prev ?? [])])
      setNewRoomName('')
    } catch (err) {
      setError(errorMessage(err, 'Raum konnte nicht erstellt werden.'))
    } finally {
      setCreating(false)
    }
  }

  if (rooms === null && !error) return <LoadingScreen />

  return (
    <div className="min-h-screen px-6 py-12 max-w-2xl mx-auto">
      <h1 className="font-display text-3xl font-700 mb-8">Deine Räume</h1>

      <form onSubmit={handleCreate} className="flex gap-3 mb-10">
        <input
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}
          placeholder="Name des neuen Raums, z.B. „Sommer-Quiz 2026“"
          className="flex-1 rounded-xl bg-stage-800 border border-stage-600 px-4 py-3 outline-none focus:border-poke-yellow-400"
        />
        <button
          type="submit"
          disabled={creating || newRoomName.trim().length === 0}
          className="font-display font-700 rounded-xl bg-poke-red-500 hover:bg-poke-red-400 disabled:opacity-50 transition-colors px-6"
        >
          {creating ? '…' : 'Erstellen'}
        </button>
      </form>

      {error && <p className="text-poke-red-400 mb-6">{error}</p>}

      <ul className="flex flex-col gap-3">
        {rooms?.map((room) => (
          <li
            key={room.id}
            className="flex items-center justify-between rounded-xl bg-stage-800 border border-stage-600 px-5 py-4"
          >
            <div>
              <p className="font-700">{room.name}</p>
              <p className="text-white/50 text-sm font-mono tracking-widest">{room.code}</p>
            </div>
            <div className="flex gap-2">
              <Link
                to={`/host/${room.code}/setup`}
                className="rounded-lg bg-stage-700 hover:bg-stage-600 px-4 py-2 text-sm transition-colors"
              >
                Setup
              </Link>
              <Link
                to={`/host/${room.code}/live`}
                className="rounded-lg bg-poke-blue-600 hover:bg-poke-blue-500 px-4 py-2 text-sm transition-colors"
              >
                Live
              </Link>
            </div>
          </li>
        ))}
        {rooms?.length === 0 && <p className="text-white/50">Noch keine Räume angelegt.</p>}
      </ul>
    </div>
  )
}
