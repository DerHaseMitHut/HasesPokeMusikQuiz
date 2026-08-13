import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { createRoom, deleteRoom, listRooms, type Room } from '@/features/rooms/rooms'
import { useAuthStore } from '@/features/auth/authStore'
import { errorMessage } from '@/lib/errors'
import LoadingScreen from '@/components/ui/LoadingScreen'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default function HostRoomListPage() {
  const userId = useAuthStore((s) => s.userId)
  const [rooms, setRooms] = useState<Room[] | null>(null)
  const [newRoomName, setNewRoomName] = useState('')
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
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

  async function handleDelete(room: Room) {
    if (!window.confirm(`Raum „${room.name}“ (${room.code}) und alle zugehörigen Daten unwiderruflich löschen?`)) return
    setDeletingId(room.id)
    setError(null)
    try {
      await deleteRoom(room.id)
      setRooms((prev) => prev?.filter((r) => r.id !== room.id) ?? null)
    } catch (err) {
      setError(errorMessage(err, 'Raum konnte nicht gelöscht werden.'))
    } finally {
      setDeletingId(null)
    }
  }

  if (rooms === null && !error) return <LoadingScreen />

  return (
    <div className="min-h-screen px-6 py-12 max-w-2xl mx-auto">
      <h1 className="font-display text-3xl font-800 mb-8 drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">Deine Räume</h1>

      <form onSubmit={handleCreate} className="flex gap-3 mb-10">
        <input
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}
          placeholder="Name des neuen Raums, z.B. „Sommer-Quiz 2026“"
          className="flex-1 rounded-xl bg-stage-800/90 border border-stage-600 px-4 py-3 outline-none focus:border-poke-yellow-400 focus:shadow-[0_0_0_3px_rgba(255,203,5,0.15)] transition-shadow"
        />
        <Button type="submit" disabled={creating || newRoomName.trim().length === 0}>
          {creating ? '…' : 'Erstellen'}
        </Button>
      </form>

      {error && <p className="text-poke-red-400 mb-6">{error}</p>}

      <ul className="flex flex-col gap-3">
        {rooms?.map((room) => (
          <Card key={room.id}>
            <li className="flex items-center justify-between px-5 py-4 list-none">
              <div>
                <p className="font-700">{room.name}</p>
                <p className="text-white/50 text-sm font-mono tracking-widest">{room.code}</p>
              </div>
              <div className="flex gap-2">
                <Link
                  to={`/host/${room.code}/setup`}
                  className="rounded-lg bg-stage-700 hover:bg-stage-600 px-4 py-2 text-sm font-700 transition-colors"
                >
                  Setup
                </Link>
                <Link
                  to={`/host/${room.code}/live`}
                  className="rounded-lg bg-gradient-to-b from-poke-blue-400 to-poke-blue-600 hover:brightness-110 px-4 py-2 text-sm font-700 transition-all"
                >
                  Live
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(room)}
                  disabled={deletingId === room.id}
                  className="rounded-lg bg-gradient-to-b from-poke-red-400 to-poke-red-600 hover:brightness-110 disabled:opacity-50 px-4 py-2 text-sm font-700 transition-all"
                >
                  {deletingId === room.id ? '…' : 'Löschen'}
                </button>
              </div>
            </li>
          </Card>
        ))}
        {rooms?.length === 0 && <p className="text-white/50">Noch keine Räume angelegt.</p>}
      </ul>
    </div>
  )
}
