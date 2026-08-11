import { supabase } from '@/lib/supabaseClient'
import type { PlaybackStateRow } from '@/store/quizStore'

let cachedOffsetMs = 0
let offsetFetchedAt = 0
const OFFSET_TTL_MS = 60_000

/**
 * Ausgleich zwischen lokaler Client-Uhr und Server-Uhr, per Round-Trip-Messung gegen
 * server_now(). Wird gecacht und nur alle 60s neu gemessen (nicht bei jedem Sync-Tick).
 */
export async function getServerOffsetMs(forceRefresh = false): Promise<number> {
  if (!forceRefresh && offsetFetchedAt > 0 && Date.now() - offsetFetchedAt < OFFSET_TTL_MS) {
    return cachedOffsetMs
  }
  const before = Date.now()
  const { data, error } = await supabase.rpc('server_now')
  const after = Date.now()
  if (error) throw error

  const serverMs = new Date(data as string).getTime()
  const roundTripMs = after - before
  const localMidpointMs = before + roundTripMs / 2
  cachedOffsetMs = serverMs - localMidpointMs
  offsetFetchedAt = Date.now()
  return cachedOffsetMs
}

export function expectedPositionSeconds(state: PlaybackStateRow, offsetMs: number): number {
  if (!state.is_playing) return state.position_seconds
  const updatedAtMs = new Date(state.updated_at).getTime()
  const nowServerMs = Date.now() + offsetMs
  const elapsedSeconds = Math.max(0, (nowServerMs - updatedAtMs) / 1000)
  return state.position_seconds + elapsedSeconds
}
