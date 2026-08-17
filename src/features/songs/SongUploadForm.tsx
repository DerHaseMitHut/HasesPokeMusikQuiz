import { useState, type FormEvent } from 'react'
import { createSong, uploadClip } from './songs'
import { errorMessage } from '@/lib/errors'

export default function SongUploadForm({
  roomId,
  nextOrderIndex,
  onCreated,
}: {
  roomId: string
  nextOrderIndex: number
  onCreated: () => void
}) {
  const [title, setTitle] = useState('')
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [points, setPoints] = useState(100)
  const [hint1, setHint1] = useState('')
  const [hint2, setHint2] = useState('')
  const [riddleFile, setRiddleFile] = useState<File | null>(null)
  const [solutionFile, setSolutionFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const canSubmit =
    title.trim().length > 0 &&
    correctAnswer.trim().length > 0 &&
    riddleFile !== null &&
    solutionFile !== null &&
    !submitting

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!riddleFile || !solutionFile) return

    setSubmitting(true)
    setError(null)
    try {
      setProgress('Lade Rätsel-Clip hoch…')
      const riddlePath = await uploadClip(roomId, 'riddle', riddleFile)

      setProgress('Lade Lösungs-Clip hoch…')
      const solutionPath = await uploadClip(roomId, 'solution', solutionFile)

      setProgress('Speichere Song…')
      await createSong({
        room_id: roomId,
        order_index: nextOrderIndex,
        title: title.trim(),
        correct_answer: correctAnswer.trim(),
        points,
        riddle_storage_path: riddlePath,
        solution_storage_path: solutionPath,
        hint1: hint1.trim() || null,
        hint2: hint2.trim() || null,
      })

      setTitle('')
      setCorrectAnswer('')
      setPoints(100)
      setHint1('')
      setHint2('')
      setRiddleFile(null)
      setSolutionFile(null)
      onCreated()
    } catch (err) {
      setError(errorMessage(err, 'Song konnte nicht angelegt werden.'))
    } finally {
      setSubmitting(false)
      setProgress(null)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-stage-800 border border-stage-600 p-6 flex flex-col gap-4"
    >
      <h2 className="font-display text-xl font-700">Neuen Song hinzufügen</h2>

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm text-white/70">
          Titel
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg bg-stage-900 border border-stage-600 px-3 py-2 outline-none focus:border-poke-yellow-400"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-white/70">
          Lösung / Interpret &amp; Titel
          <input
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
            className="rounded-lg bg-stage-900 border border-stage-600 px-3 py-2 outline-none focus:border-poke-yellow-400"
          />
        </label>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <label className="flex flex-col gap-1 text-sm text-white/70 w-32">
          Punkte
          <input
            type="number"
            min={0}
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
            className="rounded-lg bg-stage-900 border border-stage-600 px-3 py-2 outline-none focus:border-poke-yellow-400"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-white/70">
          Tipp 1 (optional)
          <input
            value={hint1}
            onChange={(e) => setHint1(e.target.value)}
            className="rounded-lg bg-stage-900 border border-stage-600 px-3 py-2 outline-none focus:border-poke-yellow-400"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-white/70">
          Tipp 2 (optional)
          <input
            value={hint2}
            onChange={(e) => setHint2(e.target.value)}
            className="rounded-lg bg-stage-900 border border-stage-600 px-3 py-2 outline-none focus:border-poke-yellow-400"
          />
        </label>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm text-white/70">
          Rätsel-Clip (MP4)
          <input
            type="file"
            accept="video/mp4"
            onChange={(e) => setRiddleFile(e.target.files?.[0] ?? null)}
            className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-poke-blue-600 file:px-3 file:py-2 file:text-white"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-white/70">
          Lösungs-Clip (MP4)
          <input
            type="file"
            accept="video/mp4"
            onChange={(e) => setSolutionFile(e.target.files?.[0] ?? null)}
            className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-poke-blue-600 file:px-3 file:py-2 file:text-white"
          />
        </label>
      </div>

      {error && <p className="text-poke-red-400 text-sm">{error}</p>}
      {progress && <p className="text-poke-yellow-400 text-sm">{progress}</p>}

      <button
        type="submit"
        disabled={!canSubmit}
        className="self-start font-display font-700 rounded-xl bg-poke-red-500 hover:bg-poke-red-400 disabled:opacity-50 transition-colors px-6 py-3"
      >
        {submitting ? 'Wird hochgeladen…' : 'Song hinzufügen'}
      </button>
    </form>
  )
}
