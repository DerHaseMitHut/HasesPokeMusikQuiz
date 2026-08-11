import { supabase } from '@/lib/supabaseClient'

export async function openBuzzer(roomId: string, currentSongId: string | null): Promise<void> {
  const { error } = await supabase
    .from('buzzer_state')
    .update({
      round_id: crypto.randomUUID(),
      current_song_id: currentSongId,
      is_open: true,
      winner_player_id: null,
      opened_at: new Date().toISOString(),
      won_at: null,
    })
    .eq('room_id', roomId)
  if (error) throw error
}

export async function closeBuzzer(roomId: string): Promise<void> {
  const { error } = await supabase.from('buzzer_state').update({ is_open: false }).eq('room_id', roomId)
  if (error) throw error
}

export async function pressBuzzer(roomId: string, roundId: string, playerId: string): Promise<void> {
  const { error } = await supabase.from('buzz_events').insert({ room_id: roomId, round_id: roundId, player_id: playerId })
  if (error) throw error
}
