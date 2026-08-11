import { supabase } from '@/lib/supabaseClient'

export async function loadSong(roomId: string, songId: string): Promise<void> {
  const { error } = await supabase
    .from('playback_state')
    .update({ current_song_id: songId, current_clip: 'riddle', position_seconds: 0, is_playing: true })
    .eq('room_id', roomId)
  if (error) throw error
}

export async function setPlaying(roomId: string, isPlaying: boolean, positionSeconds: number): Promise<void> {
  const { error } = await supabase
    .from('playback_state')
    .update({ is_playing: isPlaying, position_seconds: positionSeconds })
    .eq('room_id', roomId)
  if (error) throw error
}

export async function showSolution(roomId: string, songId: string): Promise<void> {
  const { error: playbackError } = await supabase
    .from('playback_state')
    .update({ current_song_id: songId, current_clip: 'solution', position_seconds: 0, is_playing: true })
    .eq('room_id', roomId)
  if (playbackError) throw playbackError

  const { error: songError } = await supabase.from('songs').update({ revealed: true }).eq('id', songId)
  if (songError) throw songError
}
