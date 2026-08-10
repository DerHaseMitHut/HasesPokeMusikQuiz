import { supabase } from './supabaseClient'
import type { PlayerRow } from '../store/quizStore'

export async function joinRoom(roomId: string, userId: string, displayName: string): Promise<PlayerRow> {
  const { data, error } = await supabase
    .from('players')
    .upsert({ room_id: roomId, user_id: userId, display_name: displayName }, { onConflict: 'room_id,user_id' })
    .select()
    .single()
  if (error) throw error
  return data
}
