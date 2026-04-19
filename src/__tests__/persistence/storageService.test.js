/**
 * ===================================================================
 * TESTES DE PERSISTÊNCIA - storageService.js
 * ===================================================================
 * Testa CRUD completo, metadados, auditoria e operações em lote
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ====================== MOCKS ======================

// Mock do supabaseClient
const mockSupabaseChain = {
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  neq: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  single: vi.fn(),
  maybeSingle: vi.fn(),
}

const mockSupabase = {
  from: vi.fn(() => ({ ...mockSupabaseChain })),
}

vi.mock('../../services/supabaseClient', () => ({
  default: mockSupabase,
  supabase: mockSupabase,
  assertSupabaseConfigured: vi.fn(),
  isSupabaseAvailable: vi.fn(() => true),
  isSupabaseConnected: vi.fn(async () => true),
  getSupabaseConfigError: vi.fn(() => null),
}))

vi.mock('../../services/auditService', () => ({
  recordAudit: vi.fn(async () => ({ id: 'audit_1' })),
}))

// Importações após mocks
const {
  addDocument,
  getDocument,
  listDocuments,
  updateDocument,
  deleteDocument,
  replaceCollection,
  exportCollection,
  exportAll,
  importData,
  STORES,
} = await import('../../services/storageService')

const { recordAudit } = await import('../../services/auditService')

// ====================== TESTES ======================

describe('storageService - CRUD Completo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ---- STORES constant ----
  describe('STORES', () => {
    it('deve conter todas as coleções esperadas', () => {
      expect(STORES).toEqual({
        shoppingList: 'shopping_list',
        products: 'products',
        pricing: 'pricing',
        budgets: 'budgets',
        financialData: 'financial_data',
      })
    })

    it('deve ter exatamente 5 coleções', () => {
      expect(Object.keys(STORES)).toHaveLength(5)
    })
  })

  // ---- addDocument ----
  describe('addDocument()', () => {
    it('deve inserir documento com metadados gerados automaticamente', async () => {
      const mockData = { name: 'Item Teste', qty: 10 }
      const mockInserted = { ...mockData, id: '123_abc', createdAt: '2026-04-19T00:00:00Z' }

      const chain = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockInserted, error: null }),
        insert: vi.fn().mockReturnThis(),
      }
      chain.insert.mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: mockInserted, error: null }) }) })
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockInserted, error: null }),
          }),
        }),
      })

      const result = await addDocument('shopping_list', mockData, 'admin')

      expect(mockSupabase.from).toHaveBeenCalledWith('shopping_list')
      expect(result).toEqual(mockInserted)
    })

    it('deve registrar auditoria CREATE após inserção', async () => {
      const mockInserted = { id: '456_def', name: 'Produto X' }

      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockInserted, error: null }),
          }),
        }),
      })

      await addDocument('products', { name: 'Produto X' }, 'admin')

      expect(recordAudit).toHaveBeenCalledWith(
        'CREATE',
        'products',
        expect.any(String),
        null,
        mockInserted,
        'admin'
      )
    })

    it('deve lançar erro quando Supabase retorna erro na inserção', async () => {
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: new Error('Duplicate key') }),
          }),
        }),
      })

      await expect(addDocument('products', { name: 'Dup' })).rejects.toThrow('Duplicate key')
    })

    it('deve usar userId "system" como padrão quando não fornecido', async () => {
      const mockInserted = { id: '789', name: 'Item' }

      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockInserted, error: null }),
          }),
        }),
      })

      await addDocument('shopping_list', { name: 'Item' })

      expect(recordAudit).toHaveBeenCalledWith(
        'CREATE',
        'shopping_list',
        expect.any(String),
        null,
        mockInserted,
        'system'
      )
    })
  })

  // ---- getDocument ----
  describe('getDocument()', () => {
    it('deve retornar documento encontrado pelo ID', async () => {
      const mockDoc = { id: 'abc123', name: 'Hélice 3 pás', qty: 50 }

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: mockDoc, error: null }),
          }),
        }),
      })

      const result = await getDocument('shopping_list', 'abc123')
      expect(result).toEqual(mockDoc)
      expect(mockSupabase.from).toHaveBeenCalledWith('shopping_list')
    })

    it('deve retornar null quando documento não existe', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      })

      const result = await getDocument('products', 'inexistente')
      expect(result).toBeNull()
    })

    it('deve lançar erro quando Supabase falha na consulta', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: new Error('Network error') }),
          }),
        }),
      })

      await expect(getDocument('products', 'abc')).rejects.toThrow('Network error')
    })
  })

  // ---- listDocuments ----
  describe('listDocuments()', () => {
    it('deve listar documentos ordenados por createdAt descendente', async () => {
      const mockDocs = [
        { id: '3', name: 'Item C', createdAt: '2026-04-19' },
        { id: '2', name: 'Item B', createdAt: '2026-04-18' },
        { id: '1', name: 'Item A', createdAt: '2026-04-17' },
      ]

      const chainMock = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockDocs, error: null }),
      }
      mockSupabase.from.mockReturnValueOnce(chainMock)

      const result = await listDocuments('shopping_list')

      expect(result).toHaveLength(3)
      expect(result[0].name).toBe('Item C')
    })

    it('deve aplicar filtro createdAfter corretamente', async () => {
      const chainMock = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({ data: [], error: null }),
      }
      mockSupabase.from.mockReturnValueOnce(chainMock)

      await listDocuments('products', { createdAfter: '2026-01-01' })

      expect(chainMock.gte).toHaveBeenCalledWith('createdAt', '2026-01-01')
    })

    it('deve aplicar filtro createdBefore corretamente', async () => {
      const chainMock = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({ data: [], error: null }),
      }
      mockSupabase.from.mockReturnValueOnce(chainMock)

      await listDocuments('products', { createdBefore: '2026-12-31' })

      expect(chainMock.lte).toHaveBeenCalledWith('createdAt', '2026-12-31')
    })

    it('deve aplicar filtro status corretamente', async () => {
      const chainMock = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }
      mockSupabase.from.mockReturnValueOnce(chainMock)

      await listDocuments('budgets', { status: 'approved' })

      expect(chainMock.eq).toHaveBeenCalledWith('status', 'approved')
    })

    it('deve retornar array vazio quando não há resultados', async () => {
      const chainMock = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
      mockSupabase.from.mockReturnValueOnce(chainMock)

      const result = await listDocuments('products')
      expect(result).toEqual([])
    })

    it('deve combinar múltiplos filtros simultaneamente', async () => {
      const chainMock = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }
      mockSupabase.from.mockReturnValueOnce(chainMock)

      await listDocuments('budgets', {
        createdAfter: '2026-01-01',
        createdBefore: '2026-12-31',
        status: 'pending',
      })

      expect(chainMock.gte).toHaveBeenCalledWith('createdAt', '2026-01-01')
      expect(chainMock.lte).toHaveBeenCalledWith('createdAt', '2026-12-31')
      expect(chainMock.eq).toHaveBeenCalledWith('status', 'pending')
    })
  })

  // ---- updateDocument ----
  describe('updateDocument()', () => {
    it('deve atualizar documento existente e registrar auditoria', async () => {
      const oldDoc = { id: 'item1', name: 'Antigo', qty: 5 }
      const updatedDoc = { id: 'item1', name: 'Novo', qty: 10, updatedAt: '2026-04-19T12:00:00Z' }

      // Mock getDocument (chamado internamente)
      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: oldDoc, error: null }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: updatedDoc, error: null }),
              }),
            }),
          }),
        })

      const result = await updateDocument('shopping_list', 'item1', { name: 'Novo', qty: 10 }, 'admin')

      expect(result).toEqual(updatedDoc)
      expect(recordAudit).toHaveBeenCalledWith(
        'UPDATE', 'shopping_list', 'item1', oldDoc, updatedDoc, 'admin'
      )
    })

    it('deve lançar erro quando documento não é encontrado para atualização', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      })

      await expect(
        updateDocument('products', 'nao_existe', { name: 'X' })
      ).rejects.toThrow('não encontrado')
    })

    it('deve incluir updatedAt e lastModifiedBy nos dados atualizados', async () => {
      const oldDoc = { id: 'p1', name: 'Old' }

      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: oldDoc, error: null }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: vi.fn((data) => {
            expect(data).toHaveProperty('updatedAt')
            expect(data).toHaveProperty('lastModifiedBy', 'admin')
            return {
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: { ...oldDoc, ...data }, error: null }),
                }),
              }),
            }
          }),
        })

      await updateDocument('products', 'p1', { name: 'New' }, 'admin')
    })
  })

  // ---- deleteDocument ----
  describe('deleteDocument()', () => {
    it('deve deletar documento existente e registrar auditoria DELETE', async () => {
      const existingDoc = { id: 'del1', name: 'Apagar' }

      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: existingDoc, error: null }),
            }),
          }),
        })
        .mockReturnValueOnce({
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        })

      const result = await deleteDocument('shopping_list', 'del1', 'admin')

      expect(result).toBe(true)
      expect(recordAudit).toHaveBeenCalledWith(
        'DELETE', 'shopping_list', 'del1', existingDoc, null, 'admin'
      )
    })

    it('deve lançar erro quando documento não existe para exclusão', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      })

      await expect(
        deleteDocument('products', 'fantasma')
      ).rejects.toThrow('não encontrado')
    })

    it('deve lançar erro quando Supabase falha ao deletar', async () => {
      const existingDoc = { id: 'err1', name: 'Falha' }

      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: existingDoc, error: null }),
            }),
          }),
        })
        .mockReturnValueOnce({
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: new Error('Foreign key constraint') }),
          }),
        })

      await expect(deleteDocument('products', 'err1')).rejects.toThrow('Foreign key constraint')
    })
  })

  // ---- replaceCollection ----
  describe('replaceCollection()', () => {
    it('deve limpar coleção e inserir novos documentos', async () => {
      const newDocs = [
        { name: 'Item 1', qty: 10 },
        { name: 'Item 2', qty: 20 },
      ]

      mockSupabase.from
        .mockReturnValueOnce({
          delete: vi.fn().mockReturnValue({
            neq: vi.fn().mockResolvedValue({ error: null }),
          }),
        })
        .mockReturnValueOnce({
          insert: vi.fn().mockResolvedValue({ error: null }),
        })

      const result = await replaceCollection('shopping_list', newDocs, 'admin')

      expect(result).toHaveLength(2)
      expect(result[0]).toHaveProperty('id')
      expect(result[0]).toHaveProperty('createdAt')
      expect(result[0]).toHaveProperty('updatedAt')
    })

    it('deve registrar auditoria REPLACE_COLLECTION', async () => {
      mockSupabase.from
        .mockReturnValueOnce({
          delete: vi.fn().mockReturnValue({
            neq: vi.fn().mockResolvedValue({ error: null }),
          }),
        })
        .mockReturnValueOnce({
          insert: vi.fn().mockResolvedValue({ error: null }),
        })

      await replaceCollection('products', [{ name: 'A' }], 'admin')

      expect(recordAudit).toHaveBeenCalledWith(
        'REPLACE_COLLECTION', 'products', null, null, { count: 1 }, 'admin'
      )
    })

    it('deve funcionar com array vazio (apenas limpa)', async () => {
      mockSupabase.from.mockReturnValueOnce({
        delete: vi.fn().mockReturnValue({
          neq: vi.fn().mockResolvedValue({ error: null }),
        }),
      })

      const result = await replaceCollection('pricing', [], 'admin')

      expect(result).toHaveLength(0)
    })
  })

  // ---- exportCollection / exportAll ----
  describe('exportCollection() / exportAll()', () => {
    it('deve exportar coleção como JSON string', async () => {
      const docs = [{ id: '1', name: 'A' }, { id: '2', name: 'B' }]
      const chainMock = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: docs, error: null }),
      }
      mockSupabase.from.mockReturnValueOnce(chainMock)

      const result = await exportCollection('shopping_list')
      const parsed = JSON.parse(result)

      expect(parsed).toHaveLength(2)
      expect(parsed[0].name).toBe('A')
    })

    it('deve exportar todas as coleções no formato correto', async () => {
      // 5 coleções = 5 chamadas from()
      for (let i = 0; i < 5; i++) {
        mockSupabase.from.mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [{ id: `item_${i}` }], error: null }),
        })
      }

      const result = await exportAll()
      const parsed = JSON.parse(result)

      expect(parsed).toHaveProperty('shoppingList')
      expect(parsed).toHaveProperty('products')
      expect(parsed).toHaveProperty('pricing')
      expect(parsed).toHaveProperty('budgets')
      expect(parsed).toHaveProperty('financialData')
    })
  })

  // ---- importData ----
  describe('importData()', () => {
    it('deve importar dados de JSON string', async () => {
      const importPayload = JSON.stringify({
        shoppingList: [{ name: 'Import 1' }],
        products: [{ name: 'Prod 1' }],
      })

      // replaceCollection é chamado 2x (shoppingList + products), cada um faz delete + insert
      for (let i = 0; i < 4; i++) {
        mockSupabase.from.mockReturnValueOnce(
          i % 2 === 0
            ? { delete: vi.fn().mockReturnValue({ neq: vi.fn().mockResolvedValue({ error: null }) }) }
            : { insert: vi.fn().mockResolvedValue({ error: null }) }
        )
      }

      const result = await importData(importPayload, 'admin')
      expect(result).toBe(true)
    })

    it('deve importar dados de objeto JavaScript', async () => {
      const importPayload = {
        pricing: [{ costPrice: 100, salePrice: 200 }],
      }

      // replaceCollection: 1x delete + 1x insert
      mockSupabase.from
        .mockReturnValueOnce({
          delete: vi.fn().mockReturnValue({
            neq: vi.fn().mockResolvedValue({ error: null }),
          }),
        })
        .mockReturnValueOnce({
          insert: vi.fn().mockResolvedValue({ error: null }),
        })

      const result = await importData(importPayload, 'admin')
      expect(result).toBe(true)
    })

    it('deve registrar auditoria IMPORT_DATA com chaves importadas', async () => {
      const importPayload = { budgets: [{ total: 5000 }] }

      mockSupabase.from
        .mockReturnValueOnce({
          delete: vi.fn().mockReturnValue({
            neq: vi.fn().mockResolvedValue({ error: null }),
          }),
        })
        .mockReturnValueOnce({
          insert: vi.fn().mockResolvedValue({ error: null }),
        })

      await importData(importPayload, 'admin')

      expect(recordAudit).toHaveBeenCalledWith(
        'IMPORT_DATA', 'system', null, null, { imported: ['budgets'] }, 'admin'
      )
    })

    it('deve ignorar coleções não reconhecidas no payload', async () => {
      const importPayload = { unknownCollection: [{ data: 'test' }] }

      const result = await importData(importPayload, 'admin')
      expect(result).toBe(true)
      // Nenhum replaceCollection chamado, apenas recordAudit de IMPORT_DATA
    })
  })
})
