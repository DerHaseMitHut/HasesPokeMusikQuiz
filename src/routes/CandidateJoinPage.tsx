import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getRoomByCode } from '@/features/rooms/rooms'
import { joinRoom } from '@/features/players/players'
import { errorMessage } from '@/lib/errors'
import { useAuthStore } from '@/features/auth/authStore'

export default function CandidateJoinPage() {
  const [searchParams] = useSearchParams()
  const [code, setCode] = useState(searchParams.get('code')?.toUpperCase() ?? '')
  const [name, setName] = useState('')
  const [vdoUrl, setVdoUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const userId = useAuthStore((s) => s.userId)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (code.trim().length === 0) {
      setError('Bitte gib den Raumcode ein.')
      return
    }
    if (name.trim().length === 0) {
      setError('Bitte gib deinen Namen ein.')
      return
    }
    if (!userId) {
      setError('Anmeldung läuft noch, bitte kurz warten und erneut versuchen.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const room = await getRoomByCode(code.trim())
      if (!room) {
        setError('Kein Raum mit diesem Code gefunden.')
        return
      }
      await joinRoom(room.id, userId, name.trim(), vdoUrl.trim())
      navigate(`/play/${room.code}`)
    } catch (err) {
      setError(errorMessage(err, 'Beitritt fehlgeschlagen.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-stage-800 border border-stage-600 rounded-2xl p-8 flex flex-col gap-4"
      >
        <h1 className="font-display text-2xl font-700 text-center mb-2">Beitreten</h1>

        <label className="flex flex-col gap-1 text-sm text-white/70">
          Raumcode
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="z.B. AB3CDE"
            className="rounded-xl bg-stage-900 border border-stage-600 px-4 py-3 outline-none focus:border-poke-yellow-400 font-mono tracking-widest uppercase"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-white/70">
          Dein Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Wie sollen wir dich nennen?"
            className="rounded-xl bg-stage-900 border border-stage-600 px-4 py-3 outline-none focus:border-poke-yellow-400"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-white/70">
          Kamera-Link (VDO.Ninja, optional)
          <input
            value={vdoUrl}
            onChange={(e) => setVdoUrl(e.target.value)}
            placeholder="https://vdo.ninja/?push=…"
            className="rounded-xl bg-stage-900 border border-stage-600 px-4 py-3 outline-none focus:border-poke-yellow-400"
          />
          <span className="text-white/40 text-xs">Kannst du auch später noch eintragen.</span>
        </label>

        {error && <p className="text-poke-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="font-display font-700 rounded-xl bg-poke-blue-600 hover:bg-poke-blue-500 disabled:opacity-50 transition-colors py-3"
        >
          {submitting ? 'Trete bei…' : 'Beitreten'}
        </button>
      </form>
    </div>
  )
}
