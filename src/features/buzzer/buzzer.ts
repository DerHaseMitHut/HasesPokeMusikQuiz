import { supabase } from '@/lib/supabaseClient'

export async function openBuzzer(roomId: string, currentSongId: string | null, resolution?: 'wrong'): Promise<void> {
  const { error } = await supabase
    .from('buzzer_state')
    .update({
      round_id: crypto.randomUUID(),
      current_song_id: currentSongId,
      is_open: true,
      winner_player_id: null,
      opened_at: new Date().toISOString(),
      won_at: null,
      // Nur gesetzt, wenn dieses Öffnen tatsächlich eine falsche Antwort auflöst (nicht bei
      // einem ganz normalen frischen "Buzzer öffnen") -- last_resolution_id ist das Signal, an
      // dem alle Clients erkennen, dass gerade ein neues Ereignis (für den Sound) passiert ist.
      ...(resolution ? { last_resolution: resolution, last_resolution_id: crypto.randomUUID() } : {}),
    })
    .eq('room_id', roomId)
  if (error) throw error
}

export async function closeBuzzer(roomId: string): Promise<void> {
  const { error } = await supabase.from('buzzer_state').update({ is_open: false }).eq('room_id', roomId)
  if (error) throw error
}

export async function resolveBuzzer(roomId: string, resolution?: 'correct' | 'void'): Promise<void> {
  const { error } = await supabase
    .from('buzzer_state')
    .update({
      winner_player_id: null,
      ...(resolution ? { last_resolution: resolution, last_resolution_id: crypto.randomUUID() } : {}),
    })
    .eq('room_id', roomId)
  if (error) throw error
}

export async function pressBuzzer(roomId: string, roundId: string, playerId: string): Promise<void> {
  const { error } = await supabase.from('buzz_events').insert({ room_id: roomId, round_id: roundId, player_id: playerId })
  if (error) throw error
}
