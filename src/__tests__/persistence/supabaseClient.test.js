/**
 * ===================================================================
 * TESTES DE PERSISTÊNCIA - supabaseClient.js
 * ===================================================================
 * Testa configuração, validação e conexão com Supabase
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('supabaseClient - Configuração', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('deve exportar funções de verificação', async () => {
    const mod = await import('../../services/supabaseClient')

    expect(typeof mod.isSupabaseAvailable).toBe('function')
    expect(typeof mod.getSupabaseConfigError).toBe('function')
    expect(typeof mod.assertSupabaseConfigured).toBe('function')
    expect(typeof mod.isSupabaseConnected).toBe('function')
  })

  it('isSupabaseAvailable deve retornar boolean', async () => {
    const { isSupabaseAvailable } = await import('../../services/supabaseClient')
    const result = isSupabaseAvailable()
    expect(typeof result).toBe('boolean')
  })

  it('getSupabaseConfigError deve retornar null ou string de erro', async () => {
    const { getSupabaseConfigError } = await import('../../services/supabaseClient')
    const result = getSupabaseConfigError()
    expect(result === null || typeof result === 'string').toBe(true)
  })

  it('assertSupabaseConfigured deve lançar erro quando não configurado (sem env vars)', async () => {
    // Quando não há variáveis de ambiente, deve lançar
    const { getSupabaseConfigError } = await import('../../services/supabaseClient')
    const error = getSupabaseConfigError()

    if (error) {
      const { assertSupabaseConfigured } = await import('../../services/supabaseClient')
      expect(() => assertSupabaseConfigured()).toThrow()
    }
  })

  it('isSupabaseConnected deve retornar false quando não configurado', async () => {
    const { isSupabaseConnected, isSupabaseAvailable } = await import('../../services/supabaseClient')

    if (!isSupabaseAvailable()) {
      const connected = await isSupabaseConnected()
      expect(connected).toBe(false)
    }
  })

  it('deve exportar cliente supabase como default', async () => {
    const mod = await import('../../services/supabaseClient')
    // Pode ser null (não configurado) ou objeto do createClient
    expect(mod.default === null || typeof mod.default === 'object').toBe(true)
  })
})
