import { deleteSong, swapSongOrder, type Song } from './songs'

export default function SongList({
  songs,
  onChanged,
}: {
  songs: Song[]
  onChanged: () => void
}) {
  async function move(song: Song, direction: -1 | 1) {
    const index = songs.findIndex((s) => s.id === song.id)
    const target = songs[index + direction]
    if (!target) return
    await swapSongOrder(song.id, target.id)
    onChanged()
  }

  async function remove(song: Song) {
    if (!confirm(`„${song.title}“ wirklich löschen?`)) return
    await deleteSong(song.id)
    onChanged()
  }

  if (songs.length === 0) {
    return <p className="text-white/50">Noch keine Songs in diesem Raum.</p>
  }

  return (
    <ul className="flex flex-col gap-3">
      {songs.map((song, index) => (
        <li
          key={song.id}
          className="flex items-center gap-4 rounded-xl bg-stage-800 border border-stage-600 px-5 py-4"
        >
          <div className="flex flex-col gap-1">
            <button
              type="button"
              disabled={index === 0}
              onClick={() => move(song, -1)}
              className="text-white/50 hover:text-poke-yellow-400 disabled:opacity-20 leading-none"
              aria-label="Nach oben"
            >
              ▲
            </button>
            <button
              type="button"
              disabled={index === songs.length - 1}
              onClick={() => move(song, 1)}
              className="text-white/50 hover:text-poke-yellow-400 disabled:opacity-20 leading-none"
              aria-label="Nach unten"
            >
              ▼
            </button>
          </div>

          <div className="flex-1">
            <p className="font-700">{song.title}</p>
          </div>

          <button
            type="button"
            onClick={() => remove(song)}
            className="text-poke-red-400 hover:text-poke-red-300 text-sm"
          >
            Löschen
          </button>
        </li>
      ))}
    </ul>
  )
}
