/**
 * ===================================================================
 * TESTES DE PERSISTÊNCIA - auditService.js
 * ===================================================================
 * Testa registro de auditoria, filtros, estatísticas e exportação
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ====================== MOCKS ======================

const mockAuditEntries = [
  {
    id: 'a1', timestamp: '2026-04-19T10:00:00Z', action: 'CREATE',
    collection: 'products', documentId: 'p1', userId: 'admin',
    changes: null, oldData: null, newData: { name: 'Hélice' },
  },
  {
    id: 'a2', timestamp: '2026-04-19T11:00:00Z', action: 'UPDATE',
    collection: 'products', documentId: 'p1', userId: 'admin',
    changes: { name: { from: 'Hélice', to: 'Hélice 3F' } },
    oldData: { name: 'Hélice' }, newData: { name: 'Hélice 3F' },
  },
  {
    id: 'a3', timestamp: '2026-04-19T12:00:00Z', action: 'DELETE',
    collection: 'shopping_list', documentId: 's1', userId: 'system',
    changes: null, oldData: { item: 'Motor' }, newData: null,
  },
  {
    id: 'a4', timestamp: '2026-04-18T09:00:00Z', action: 'CREATE',
    collection: 'budgets', documentId: 'b1', userId: 'visitor',
    changes: null, oldData: null, newData: { total: 5000 },
  },
]

let mockInsertFn = vi.fn().mockResolvedValue({ error: null })
let mockQueryResult = { data: mockAuditEntries, error: null }

const createChainMock = () => ({
  select: vi.fn().mockReturnThis(),
  insert: mockInsertFn,
  delete: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  neq: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  then: vi.fn((resolve) => resolve(mockQueryResult)),
})

// Vamos usar abordagem de mock direto
const mockChain = createChainMock()

const mockSupabase = {
  from: vi.fn(() => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      insert: mockInsertFn,
      delete: vi.fn().mockReturnValue({
        neq: vi.fn().mockResolvedValue({ error: null }),
      }),
      order: vi.fn().mockImplementation(() => {
        // Retorna objeto thenable (Promise-like)
        const thenableChain = {
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockReturnThis(),
          then: (resolve) => resolve(mockQueryResult),
          catch: vi.fn(),
        }
        return thenableChain
      }),
    }
    return chain
  }),
}

vi.mock('../../services/supabaseClient', () => ({
  default: mockSupabase,
  supabase: mockSupabase,
  assertSupabaseConfigured: vi.fn(),
}))

// ====================== TESTES UNITÁRIOS (funções internas) ======================

describe('auditService - Funções Auxiliares', () => {
  describe('computeChanges (testado indiretamente via recordAudit)', () => {
    it('deve detectar mudanças entre oldData e newData', async () => {
      const { recordAudit } = await import('../../services/auditService')
      
      const entry = await recordAudit(
        'UPDATE', 'products', 'p1',
        { name: 'Antigo', price: 100 },
        { name: 'Novo', price: 100 },
        'admin'
      )

      expect(entry.changes).toBeDefined()
      expect(entry.changes.name).toEqual({ from: 'Antigo', to: 'Novo' })
      expect(entry.changes.price).toBeUndefined() // Não mudou
    })

    it('deve retornar null quando não há mudanças', async () => {
      const { recordAudit } = await import('../../services/auditService')
      
      const entry = await recordAudit(
        'UPDATE', 'products', 'p1',
        { name: 'Mesmo', qty: 10 },
        { name: 'Mesmo', qty: 10 },
        'admin'
      )

      expect(entry.changes).toBeNull()
    })

    it('deve lidar com oldData null (CREATE)', async () => {
      const { recordAudit } = await import('../../services/auditService')
      
      const entry = await recordAudit(
        'CREATE', 'products', 'p1',
        null,
        { name: 'Novo Produto' },
        'admin'
      )

      expect(entry.changes).toBeNull()
    })

    it('deve lidar com newData null (DELETE)', async () => {
      const { recordAudit } = await import('../../services/auditService')
      
      const entry = await recordAudit(
        'DELETE', 'products', 'p1',
        { name: 'Excluído' },
        null,
        'admin'
      )

      expect(entry.changes).toBeNull()
    })
  })

  describe('sanitizeForStorage (testado indiretamente)', () => {
    it('deve remover campos sensíveis (password, token, secret)', async () => {
      const { recordAudit } = await import('../../services/auditService')
      
      const entry = await recordAudit(
        'CREATE', 'products', 'p1',
        null,
        { name: 'Item', password: 'secret123', token: 'abc', secret: 'xyz' },
        'admin'
      )

      expect(entry.newData).not.toHaveProperty('password')
      expect(entry.newData).not.toHaveProperty('token')
      expect(entry.newData).not.toHaveProperty('secret')
      expect(entry.newData).toHaveProperty('name', 'Item')
    })

    it('deve truncar description acima de 500 caracteres', async () => {
      const { recordAudit } = await import('../../services/auditService')
      
      const longDescription = 'A'.repeat(600)
      const entry = await recordAudit(
        'CREATE', 'products', 'p1',
        null,
        { description: longDescription },
        'admin'
      )

      expect(entry.newData.description.length).toBeLessThanOrEqual(503) // 500 + "..."
      expect(entry.newData.description.endsWith('...')).toBe(true)
    })

    it('deve manter description curta intacta', async () => {
      const { recordAudit } = await import('../../services/auditService')
      
      const entry = await recordAudit(
        'CREATE', 'products', 'p1',
        null,
        { description: 'Curta descrição' },
        'admin'
      )

      expect(entry.newData.description).toBe('Curta descrição')
    })
  })
})

describe('auditService - recordAudit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInsertFn = vi.fn().mockResolvedValue({ error: null })
  })

  it('deve criar entrada de auditoria com campos obrigatórios', async () => {
    const { recordAudit } = await import('../../services/auditService')
    
    const entry = await recordAudit('CREATE', 'products', 'p1', null, { name: 'X' }, 'admin')

    expect(entry).toHaveProperty('id')
    expect(entry).toHaveProperty('timestamp')
    expect(entry.action).toBe('CREATE')
    expect(entry.collection).toBe('products')
    expect(entry.documentId).toBe('p1')
    expect(entry.userId).toBe('admin')
  })

  it('deve usar userId "system" como padrão', async () => {
    const { recordAudit } = await import('../../services/auditService')
    
    const entry = await recordAudit('CREATE', 'products', 'p1', null, { name: 'X' })

    expect(entry.userId).toBe('system')
  })

  it('deve gerar ID único para cada entrada', async () => {
    const { recordAudit } = await import('../../services/auditService')
    
    const entry1 = await recordAudit('CREATE', 'a', '1', null, {}, 'u')
    const entry2 = await recordAudit('CREATE', 'b', '2', null, {}, 'u')

    expect(entry1.id).not.toBe(entry2.id)
  })

  it('deve inserir entrada no Supabase', async () => {
    const { recordAudit } = await import('../../services/auditService')
    
    await recordAudit('CREATE', 'products', 'p1', null, { name: 'X' }, 'admin')

    expect(mockSupabase.from).toHaveBeenCalledWith('audit_log')
  })

  it('deve logar erro no console sem lançar quando Supabase falha', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockInsertFn.mockResolvedValueOnce({ error: new Error('DB Error') })

    // Reimportar para pegar nova referência do mock
    vi.resetModules()
    
    // Este teste valida que recordAudit não lança exceção mesmo com erro do Supabase
    const { recordAudit } = await import('../../services/auditService')
    
    const entry = await recordAudit('CREATE', 'test', 't1', null, {}, 'u')
    expect(entry).toHaveProperty('id') // Retorna entry mesmo com erro

    consoleSpy.mockRestore()
  })
})

describe('auditService - Consultas e Filtros', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQueryResult = { data: mockAuditEntries, error: null }
  })

  it('deve retornar log de auditoria completo', async () => {
    const { getAuditLog } = await import('../../services/auditService')
    const result = await getAuditLog()

    expect(result).toHaveLength(4)
    expect(mockSupabase.from).toHaveBeenCalledWith('audit_log')
  })

  it('deve retornar array vazio quando não há entradas', async () => {
    mockQueryResult = { data: null, error: null }
    const { getAuditLog } = await import('../../services/auditService')

    const result = await getAuditLog()
    expect(result).toEqual([])
  })

  it('deve obter histórico de documento específico', async () => {
    const { getDocumentHistory } = await import('../../services/auditService')
    await getDocumentHistory('p1')

    expect(mockSupabase.from).toHaveBeenCalledWith('audit_log')
  })

  it('deve obter histórico de coleção com limite', async () => {
    const { getCollectionHistory } = await import('../../services/auditService')
    const result = await getCollectionHistory('products', 2)

    expect(result).toHaveLength(2)
  })

  it('deve obter atividade do usuário com limite', async () => {
    const { getUserActivity } = await import('../../services/auditService')
    const result = await getUserActivity('admin', 3)

    expect(result).toHaveLength(3)
  })
})

describe('auditService - Estatísticas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQueryResult = { data: mockAuditEntries, error: null }
  })

  it('deve gerar resumo de atividade por período', async () => {
    const { getActivitySummary } = await import('../../services/auditService')
    const summary = await getActivitySummary('2026-04-18', '2026-04-19')

    expect(summary.totalActions).toBe(4)
    expect(summary.byAction.CREATE).toBe(2)
    expect(summary.byAction.UPDATE).toBe(1)
    expect(summary.byAction.DELETE).toBe(1)
    expect(summary.byCollection.products).toBe(2)
    expect(summary.byUser.admin).toBe(2)
    expect(summary.timeRange.from).toBe('2026-04-18')
    expect(summary.timeRange.to).toBe('2026-04-19')
  })

  it('deve calcular estatísticas gerais de auditoria', async () => {
    const { getAuditStats } = await import('../../services/auditService')
    const stats = await getAuditStats()

    expect(stats.totalEntries).toBe(4)
    expect(stats.uniqueUsers).toBe(3)
    expect(stats.uniqueCollections).toBe(3)
    expect(stats.actionCounts.CREATE).toBe(2)
    expect(stats.actionCounts.UPDATE).toBe(1)
    expect(stats.actionCounts.DELETE).toBe(1)
  })

  it('deve identificar primeiro e último registro', async () => {
    const { getAuditStats } = await import('../../services/auditService')
    const stats = await getAuditStats()

    expect(stats.firstEntry).toBe('2026-04-18T09:00:00Z')
    expect(stats.lastEntry).toBe('2026-04-19T10:00:00Z')
  })
})

describe('auditService - Exportação e Limpeza', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQueryResult = { data: mockAuditEntries, error: null }
  })

  it('deve exportar log como JSON string válido', async () => {
    const { exportAuditLog } = await import('../../services/auditService')
    const result = await exportAuditLog()

    const parsed = JSON.parse(result)
    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed).toHaveLength(4)
  })

  it('deve limpar log de auditoria e registrar ação', async () => {
    const { clearAuditLog } = await import('../../services/auditService')

    await clearAuditLog('admin')

    // Deve chamar delete no audit_log
    expect(mockSupabase.from).toHaveBeenCalledWith('audit_log')
  })
})
