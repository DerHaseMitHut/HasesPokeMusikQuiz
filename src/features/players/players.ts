import { supabase } from '@/lib/supabaseClient'
import type { PlayerRow } from '@/store/quizStore'

const AVATAR_BUCKET = 'player-avatars'

export async function listPlayersForRoom(roomId: string): Promise<PlayerRow[]> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('room_id', roomId)
    .order('joined_at', { ascending: true })
  if (error) throw error
  return data
}

export async function uploadPlayerAvatar(playerId: string, file: File): Promise<void> {
  const path = `${playerId}/${crypto.randomUUID()}.png`
  const { error: uploadError } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
    cacheControl: '3600',
    contentType: 'image/png',
  })
  if (uploadError) throw uploadError
  const { error } = await supabase.from('players').update({ avatar_storage_path: path }).eq('id', playerId)
  if (error) throw error
}

export function getPlayerAvatarUrl(path: string | null | undefined): string | null {
  if (!path) return null
  return supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl
}

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

export async function kickPlayer(playerId: string): Promise<void> {
  const { error } = await supabase.from('players').delete().eq('id', playerId)
  if (error) throw error
}
