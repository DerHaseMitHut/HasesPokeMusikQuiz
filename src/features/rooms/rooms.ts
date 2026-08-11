import { supabase } from '@/lib/supabaseClient'

export interface Room {
  id: string
  code: string
  name: string
  host_user_id: string
  created_at: string
}

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // ohne 0/O/1/I/L, leicht vorzulesen
const CODE_LENGTH = 6

function randomCode(): string {
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  }
  return code
}

export async function listRooms(): Promise<Room[]> {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getRoomByCode(code: string): Promise<Room | null> {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', code.toUpperCase())
    .maybeSingle()
  if (error) throw error
  return data
}

export async function createRoom(name: string, hostUserId: string): Promise<Room> {
  // Kollisionen sind bei ~1 Mrd. Kombinationen und wenigen Räumen/Jahr praktisch
  // ausgeschlossen; ein einziger Retry-Versuch reicht als Sicherheitsnetz.
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = randomCode()
    const { data, error } = await supabase
      .from('rooms')
      .insert({ code, name, host_user_id: hostUserId })
      .select()
      .single()

    if (!error) return data
    if (error.code !== '23505') throw error // nur bei Code-Kollision erneut versuchen
  }
  throw new Error('Raum-Code konnte nicht vergeben werden, bitte erneut versuchen.')
}
