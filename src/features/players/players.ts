import { supabase } from '@/lib/supabaseClient'
import type { PlayerRow } from '@/store/quizStore'

export async function joinRoom(
  roomId: string,
  userId: string,
  displayName: string,
  vdoUrl?: string,
): Promise<PlayerRow> {
  const { data, error } = await supabase
    .from('players')
    .upsert(
      { room_id: roomId, user_id: userId, display_name: displayName, vdo_url: vdoUrl || null },
      { onConflict: 'room_id,user_id' },
    )
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updatePlayerVdoUrl(playerId: string, vdoUrl: string): Promise<void> {
  const { error } = await supabase.from('players').update({ vdo_url: vdoUrl || null }).eq('id', playerId)
  if (error) throw error
}

export async function awardPoints(playerId: string, points: number): Promise<void> {
  const { error } = await supabase.rpc('award_points', { player_id: playerId, points })
  if (error) throw error
}
