import { supabase } from '@/lib/supabaseClient'
import type { PlayerRow } from '@/store/quizStore'

export async function joinRoom(roomId: string, userId: string, displayName: string): Promise<PlayerRow> {
  const { data, error } = await supabase
    .from('players')
    .upsert({ room_id: roomId, user_id: userId, display_name: displayName }, { onConflict: 'room_id,user_id' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function awardPoints(playerId: string, points: number): Promise<void> {
  const { error } = await supabase.rpc('award_points', { player_id: playerId, points })
  if (error) throw error
}
