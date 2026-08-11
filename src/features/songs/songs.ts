import { supabase } from '@/lib/supabaseClient'

export interface Song {
  id: string
  room_id: string
  order_index: number
  title: string
  correct_answer: string
  points: number
  riddle_storage_path: string
  solution_storage_path: string
  revealed: boolean
  created_at: string
}

export type NewSong = Pick<
  Song,
  'room_id' | 'order_index' | 'title' | 'correct_answer' | 'points' | 'riddle_storage_path' | 'solution_storage_path'
>

// Spiegelt die songs_public-View: Titel/Lösung/Lösungs-Clip sind null, solange revealed=false.
export interface SongPublic {
  id: string
  room_id: string
  order_index: number
  points: number
  riddle_storage_path: string
  revealed: boolean
  title: string | null
  correct_answer: string | null
  solution_storage_path: string | null
}

const BUCKET = 'song-videos'

export async function listSongsForRoom(roomId: string): Promise<Song[]> {
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .eq('room_id', roomId)
    .order('order_index', { ascending: true })
  if (error) throw error
  return data
}

export async function uploadClip(
  roomId: string,
  clipType: 'riddle' | 'solution',
  file: File,
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'mp4'
  const path = `${roomId}/${clipType}-${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error
  return path
}

export function getClipPublicUrl(storagePath: string): string {
  return supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl
}

export async function getSongPublic(songId: string): Promise<SongPublic | null> {
  const { data, error } = await supabase.from('songs_public').select('*').eq('id', songId).maybeSingle()
  if (error) throw error
  return data
}

export async function createSong(song: NewSong): Promise<Song> {
  const { data, error } = await supabase.from('songs').insert(song).select().single()
  if (error) throw error
  return data
}

export async function deleteSong(songId: string): Promise<void> {
  const { error } = await supabase.from('songs').delete().eq('id', songId)
  if (error) throw error
}

export async function swapSongOrder(songIdA: string, songIdB: string): Promise<void> {
  const { error } = await supabase.rpc('swap_song_order', { song_a: songIdA, song_b: songIdB })
  if (error) throw error
}
