import { supabase } from '@/lib/supabaseClient'

export async function ensureAnonymousSession(): Promise<string> {
  const { data: existing } = await supabase.auth.getSession()
  if (existing.session?.user) {
    return existing.session.user.id
  }

  const { data, error } = await supabase.auth.signInAnonymously()
  if (error || !data.user) {
    throw error ?? new Error('Anonyme Anmeldung fehlgeschlagen.')
  }
  return data.user.id
}

export async function verifyHostPassword(password: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('verify_host_password', { pw: password })
  if (error) throw error
  return data === true
}

export async function isCurrentUserHost(): Promise<boolean> {
  const { data: session } = await supabase.auth.getSession()
  if (!session.session?.user) return false

  const { data, error } = await supabase
    .from('hosts')
    .select('user_id')
    .eq('user_id', session.session.user.id)
    .maybeSingle()

  if (error) throw error
  return data !== null
}
