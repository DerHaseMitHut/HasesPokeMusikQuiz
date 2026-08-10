import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { verifyHostPassword } from '../lib/auth'
import { useAuthStore } from '../store/authStore'

export default function HostLoginPage() {
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const refreshHostStatus = useAuthStore((s) => s.refreshHostStatus)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const ok = await verifyHostPassword(password)
      if (!ok) {
        setError('Falsches Passwort.')
        return
      }
      await refreshHostStatus()
      navigate('/host')
    } catch {
      setError('Anmeldung fehlgeschlagen. Bitte erneut versuchen.')
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
        <h1 className="font-display text-2xl font-700 text-center mb-2">Gastgeber-Login</h1>

        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Passwort"
          className="rounded-xl bg-stage-900 border border-stage-600 px-4 py-3 outline-none focus:border-poke-yellow-400"
        />

        {error && <p className="text-poke-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting || password.length === 0}
          className="font-display font-700 rounded-xl bg-poke-red-500 hover:bg-poke-red-400 disabled:opacity-50 disabled:hover:bg-poke-red-500 transition-colors py-3"
        >
          {submitting ? 'Prüfe…' : 'Anmelden'}
        </button>
      </form>
    </div>
  )
}
