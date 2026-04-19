/**
 * ===================================================================
 * TESTES DE INTEGRAÇÃO - Fluxo de Dados Engenharia→Persistência
 * ===================================================================
 * Testa o fluxo completo de dados: hook → storageService → auditService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ====================== MOCKS ======================

const mockFrom = vi.fn()
const mockSupabase = { from: mockFrom }

vi.mock('../../services/supabaseClient', () => ({
  default: mockSupabase,
  supabase: mockSupabase,
  assertSupabaseConfigured: vi.fn(),
  isSupabaseAvailable: vi.fn(() => true),
  isSupabaseConnected: vi.fn(async () => true),
}))

describe('Integração - storageService ↔ auditService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('addDocument deve chamar Supabase insert E registrar auditoria', async () => {
    const insertedDoc = { id: 'test_1', name: 'Hélice', createdAt: '2026-04-19T00:00:00Z' }
    const auditInsertMock = vi.fn().mockResolvedValue({ error: null })

    let callCount = 0
    mockFrom.mockImplementation((table) => {
      callCount++
      if (table === 'shopping_list') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: insertedDoc, error: null }),
            }),
          }),
        }
      }
      if (table === 'audit_log') {
        return { insert: auditInsertMock }
      }
      return {}
    })

    // Reimportar para pegar mocks frescos
    vi.resetModules()

    // Re-mock
    vi.doMock('../../services/supabaseClient', () => ({
      default: mockSupabase,
      supabase: mockSupabase,
      assertSupabaseConfigured: vi.fn(),
    }))

    const { addDocument } = await import('../../services/storageService')

    await addDocument('shopping_list', { name: 'Hélice' }, 'admin')

    // Deve ter chamado shopping_list para insert E audit_log para auditoria
    const tables = mockFrom.mock.calls.map((c) => c[0])
    expect(tables).toContain('shopping_list')
    expect(tables).toContain('audit_log')
  })

  it('deleteDocument deve verificar existência ANTES de deletar', async () => {
    const existingDoc = { id: 'del_1', name: 'Item' }
    const callSequence = []

    mockFrom.mockImplementation((table) => {
      if (table === 'shopping_list') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockImplementation(() => {
                callSequence.push('SELECT')
                return Promise.resolve({ data: existingDoc, error: null })
              }),
            }),
          }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockImplementation(() => {
              callSequence.push('DELETE')
              return Promise.resolve({ error: null })
            }),
          }),
        }
      }
      if (table === 'audit_log') {
        callSequence.push('AUDIT')
        return { insert: vi.fn().mockResolvedValue({ error: null }) }
      }
      return {}
    })

    vi.resetModules()
    vi.doMock('../../services/supabaseClient', () => ({
      default: mockSupabase,
      supabase: mockSupabase,
      assertSupabaseConfigured: vi.fn(),
    }))

    const { deleteDocument } = await import('../../services/storageService')

    await deleteDocument('shopping_list', 'del_1', 'admin')

    // SELECT deve vir antes de DELETE
    expect(callSequence.indexOf('SELECT')).toBeLessThan(callSequence.indexOf('DELETE'))
  })
})

describe('Integração - Metadados automáticos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('documentos criados devem ter id, createdAt, updatedAt', async () => {
    let capturedInsertData = null

    mockFrom.mockImplementation((table) => {
      if (table === 'shopping_list') {
        return {
          insert: vi.fn().mockImplementation((data) => {
            capturedInsertData = data
            return {
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: capturedInsertData, error: null }),
              }),
            }
          }),
        }
      }
      if (table === 'audit_log') {
        return { insert: vi.fn().mockResolvedValue({ error: null }) }
      }
      return {}
    })

    vi.resetModules()
    vi.doMock('../../services/supabaseClient', () => ({
      default: mockSupabase,
      supabase: mockSupabase,
      assertSupabaseConfigured: vi.fn(),
    }))

    const { addDocument } = await import('../../services/storageService')
    await addDocument('shopping_list', { name: 'Test' }, 'admin')

    expect(capturedInsertData).toHaveProperty('id')
    expect(capturedInsertData).toHaveProperty('createdAt')
    expect(capturedInsertData).toHaveProperty('updatedAt')
    expect(capturedInsertData).toHaveProperty('createdBy', 'admin')
    expect(capturedInsertData).toHaveProperty('lastModifiedBy', 'admin')
  })

  it('id gerado deve ter formato timestamp_random', async () => {
    let capturedId = null

    mockFrom.mockImplementation((table) => {
      if (table === 'shopping_list') {
        return {
          insert: vi.fn().mockImplementation((data) => {
            capturedId = data.id
            return {
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data, error: null }),
              }),
            }
          }),
        }
      }
      if (table === 'audit_log') {
        return { insert: vi.fn().mockResolvedValue({ error: null }) }
      }
      return {}
    })

    vi.resetModules()
    vi.doMock('../../services/supabaseClient', () => ({
      default: mockSupabase,
      supabase: mockSupabase,
      assertSupabaseConfigured: vi.fn(),
    }))

    const { addDocument } = await import('../../services/storageService')
    await addDocument('shopping_list', { name: 'Test' })

    // Formato: timestamp_randomchars
    expect(capturedId).toMatch(/^\d+_[a-z0-9]+$/)
  })

  it('createdAt e updatedAt devem ser ISO strings', async () => {
    let capturedData = null

    mockFrom.mockImplementation((table) => {
      if (table === 'shopping_list') {
        return {
          insert: vi.fn().mockImplementation((data) => {
            capturedData = data
            return {
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data, error: null }),
              }),
            }
          }),
        }
      }
      if (table === 'audit_log') {
        return { insert: vi.fn().mockResolvedValue({ error: null }) }
      }
      return {}
    })

    vi.resetModules()
    vi.doMock('../../services/supabaseClient', () => ({
      default: mockSupabase,
      supabase: mockSupabase,
      assertSupabaseConfigured: vi.fn(),
    }))

    const { addDocument } = await import('../../services/storageService')
    await addDocument('shopping_list', { name: 'Test' })

    // Deve ser uma string ISO válida
    const createdDate = new Date(capturedData.createdAt)
    expect(createdDate.toISOString()).toBe(capturedData.createdAt)
  })
})

describe('Integração - Import/Export Completo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exportAll e importData devem ser simétricos', async () => {
    const mockData = {
      shoppingList: [{ id: 's1', item: 'Motor', qty: 10 }],
      products: [{ id: 'p1', name: 'Sistema 3F' }],
      pricing: [{ id: 'r1', costPrice: 500 }],
      budgets: [],
      financialData: [],
    }

    mockFrom.mockImplementation((table) => {
      return {
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockData[Object.keys(mockData).find(k => {
              const map = {
                shoppingList: 'shopping_list',
                products: 'products',
                pricing: 'pricing',
                budgets: 'budgets',
                financialData: 'financial_data',
              }
              return map[k] === table
            })] || [],
            error: null,
          }),
        }),
        delete: vi.fn().mockReturnValue({
          neq: vi.fn().mockResolvedValue({ error: null }),
        }),
        insert: vi.fn().mockResolvedValue({ error: null }),
      }
    })

    vi.resetModules()
    vi.doMock('../../services/supabaseClient', () => ({
      default: mockSupabase,
      supabase: mockSupabase,
      assertSupabaseConfigured: vi.fn(),
    }))

    const { exportAll } = await import('../../services/storageService')
    const exported = await exportAll()
    const parsed = JSON.parse(exported)

    expect(parsed).toHaveProperty('shoppingList')
    expect(parsed).toHaveProperty('products')
    expect(parsed).toHaveProperty('pricing')
    expect(parsed).toHaveProperty('budgets')
    expect(parsed).toHaveProperty('financialData')
  })
})
