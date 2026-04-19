/**
 * SUPABASE CLIENT - Modo obrigatório (sem fallback offline)
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)

/**
 * Cliente Supabase inicializado quando configurado
 */
export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null

/**
 * Verifica se Supabase está disponível
 */
export function isSupabaseAvailable() {
  return hasSupabaseConfig
}

export function getSupabaseConfigError() {
  if (hasSupabaseConfig) return null
  return 'Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (ou VITE_SUPABASE_PUBLISHABLE_KEY) no .env.local.'
}

export function assertSupabaseConfigured() {
  const error = getSupabaseConfigError()
  if (error) {
    throw new Error(error)
  }
}

/**
 * Verifica se há conexão com Supabase
 */
export async function isSupabaseConnected() {
  if (!hasSupabaseConfig || !supabase) return false

  try {
    const { error } = await supabase.from('audit_log').select('id', { count: 'exact', head: true })
    return !error
  } catch {
    return false
  }
}

export default supabase
