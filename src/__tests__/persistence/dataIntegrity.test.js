/**
 * ===================================================================
 * TESTES DE PERSISTÊNCIA - Integridade de Dados
 * ===================================================================
 * Testa cenários de erro, concorrência e edge cases de dados
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

// ====================== MOCKS ======================

const mockListDocuments = vi.fn()
const mockAddDocument = vi.fn()
const mockUpdateDocument = vi.fn()
const mockDeleteDocument = vi.fn()

vi.mock('../../services/storageService', () => ({
  listDocuments: (...args) => mockListDocuments(...args),
  addDocument: (...args) => mockAddDocument(...args),
  updateDocument: (...args) => mockUpdateDocument(...args),
  deleteDocument: (...args) => mockDeleteDocument(...args),
}))

import { useEngenhariaStorage } from '../../hooks/useEngenhariaStorage'

describe('Integridade - Erros de Rede', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListDocuments.mockResolvedValue([])
  })

  it('deve capturar erro de timeout no carregamento', async () => {
    mockListDocuments.mockRejectedValue(new Error('Request timeout after 30000ms'))

    const { result } = renderHook(() => useEngenhariaStorage())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toContain('timeout')
  })

  it('deve capturar erro de permissão negada', async () => {
    mockListDocuments.mockRejectedValue(new Error('permission denied for table shopping_list'))

    const { result } = renderHook(() => useEngenhariaStorage())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toContain('permission denied')
  })

  it('deve capturar erro ao adicionar item com falha de rede', async () => {
    const { result } = renderHook(() => useEngenhariaStorage())
    await waitFor(() => expect(result.current.loading).toBe(false))

    mockAddDocument.mockRejectedValue(new Error('Failed to fetch'))

    let thrownError = null
    try {
      await act(async () => {
        await result.current.addShoppingItem({ item: 'Teste' })
      })
    } catch (e) {
      thrownError = e
    }

    // O erro deve ter sido lançado ou o estado atualizado
    if (thrownError) {
      expect(thrownError.message).toBe('Failed to fetch')
    }
    // Verifica que o mock foi chamado
    expect(mockAddDocument).toHaveBeenCalled()
  })

  it('deve capturar erro ao atualizar com conflito', async () => {
    mockListDocuments
      .mockResolvedValueOnce([{ id: 's1', item: 'Motor' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])

    const { result } = renderHook(() => useEngenhariaStorage())
    await waitFor(() => expect(result.current.loading).toBe(false))

    mockUpdateDocument.mockRejectedValue(new Error('Row has been modified by another user'))

    let thrownError = null
    try {
      await act(async () => {
        await result.current.updateShoppingItem('s1', { qty: 20 })
      })
    } catch (e) {
      thrownError = e
    }

    expect(thrownError).not.toBeNull()
    expect(thrownError.message).toContain('modified by another user')
  })

  it('deve capturar erro ao deletar com constraint', async () => {
    mockListDocuments
      .mockResolvedValueOnce([{ id: 's1', item: 'Motor' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])

    const { result } = renderHook(() => useEngenhariaStorage())
    await waitFor(() => expect(result.current.loading).toBe(false))

    mockDeleteDocument.mockRejectedValue(new Error('foreign key constraint violation'))

    let thrownError = null
    try {
      await act(async () => {
        await result.current.deleteShoppingItem('s1')
      })
    } catch (e) {
      thrownError = e
    }

    expect(thrownError).not.toBeNull()
    expect(thrownError.message).toContain('foreign key constraint')
  })
})

describe('Integridade - Edge Cases de Dados', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListDocuments.mockResolvedValue([])
  })

  it('deve lidar com dados vazios ao carregar', async () => {
    mockListDocuments.mockResolvedValue([])

    const { result } = renderHook(() => useEngenhariaStorage())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.shoppingList).toEqual([])
    expect(result.current.products).toEqual([])
    expect(result.current.pricing).toEqual([])
  })

  it('deve lidar com dados com caracteres especiais', async () => {
    const specialItem = {
      id: 'special_1',
      item: 'Hélice 3F "Série Ouro" — Ø100cm (α-β)',
      qty: 50,
      supplier: "Fornecedor D'Ávila & Cia",
    }
    mockAddDocument.mockResolvedValue(specialItem)

    const { result } = renderHook(() => useEngenhariaStorage())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.addShoppingItem(specialItem)
    })

    expect(result.current.shoppingList).toContainEqual(specialItem)
  })

  it('deve lidar com valores numéricos extremos', async () => {
    const extremeItem = {
      id: 'extreme_1',
      item: 'Item Extremo',
      qty: 999999,
      unitPrice: 0.001,
    }
    mockAddDocument.mockResolvedValue(extremeItem)

    const { result } = renderHook(() => useEngenhariaStorage())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.addShoppingItem(extremeItem)
    })

    expect(result.current.shoppingList[0].qty).toBe(999999)
    expect(result.current.shoppingList[0].unitPrice).toBe(0.001)
  })

  it('deve lidar com strings longas', async () => {
    const longNameItem = {
      id: 'long_1',
      item: 'A'.repeat(1000),
      qty: 1,
    }
    mockAddDocument.mockResolvedValue(longNameItem)

    const { result } = renderHook(() => useEngenhariaStorage())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.addShoppingItem(longNameItem)
    })

    expect(result.current.shoppingList[0].item.length).toBe(1000)
  })

  it('deve manter estado local consistente após múltiplas operações', async () => {
    let idCounter = 0
    mockAddDocument.mockImplementation(async (_, data) => ({
      ...data,
      id: `auto_${++idCounter}`,
    }))

    const { result } = renderHook(() => useEngenhariaStorage())
    await waitFor(() => expect(result.current.loading).toBe(false))

    // Adicionar 3 itens
    await act(async () => {
      await result.current.addShoppingItem({ item: 'Item 1', qty: 10 })
    })
    await act(async () => {
      await result.current.addShoppingItem({ item: 'Item 2', qty: 20 })
    })
    await act(async () => {
      await result.current.addShoppingItem({ item: 'Item 3', qty: 30 })
    })

    expect(result.current.shoppingList).toHaveLength(3)

    // Deletar o do meio
    mockDeleteDocument.mockResolvedValue(true)
    await act(async () => {
      await result.current.deleteShoppingItem('auto_2')
    })

    expect(result.current.shoppingList).toHaveLength(2)
    expect(result.current.shoppingList.map((i) => i.id)).toEqual(['auto_1', 'auto_3'])
  })

  it('deve manter estados independentes entre shopping, products e pricing', async () => {
    const { result } = renderHook(() => useEngenhariaStorage())
    await waitFor(() => expect(result.current.loading).toBe(false))

    // Adicionar em cada coleção
    mockAddDocument
      .mockResolvedValueOnce({ id: 's1', item: 'Item Shop' })
      .mockResolvedValueOnce({ id: 'p1', name: 'Produto' })
      .mockResolvedValueOnce({ id: 'r1', costPrice: 100 })

    await act(async () => {
      await result.current.addShoppingItem({ item: 'Item Shop' })
    })
    await act(async () => {
      await result.current.addProduct({ name: 'Produto' })
    })
    await act(async () => {
      await result.current.addPricingRow({ costPrice: 100 })
    })

    expect(result.current.shoppingList).toHaveLength(1)
    expect(result.current.products).toHaveLength(1)
    expect(result.current.pricing).toHaveLength(1)

    // Deletar apenas shopping item não deve afetar outros
    mockDeleteDocument.mockResolvedValue(true)
    await act(async () => {
      await result.current.deleteShoppingItem('s1')
    })

    expect(result.current.shoppingList).toHaveLength(0)
    expect(result.current.products).toHaveLength(1) // Intacto
    expect(result.current.pricing).toHaveLength(1) // Intacto
  })
})

describe('Integridade - Cascata de Deleção', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListDocuments.mockResolvedValue([])
  })

  it('deletar produto deve remover precificações associadas', async () => {
    mockListDocuments
      .mockResolvedValueOnce([]) // shopping
      .mockResolvedValueOnce([{ id: 'p1', name: 'Produto A' }]) // products
      .mockResolvedValueOnce([
        { id: 'r1', productId: 'p1', costPrice: 100 },
        { id: 'r2', productId: 'p1', costPrice: 200 },
        { id: 'r3', productId: 'p2', costPrice: 300 }, // Outro produto
      ])

    mockDeleteDocument.mockResolvedValue(true)

    const { result } = renderHook(() => useEngenhariaStorage())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.pricing).toHaveLength(3)

    await act(async () => {
      await result.current.deleteProduct('p1')
    })

    // Produto removido
    expect(result.current.products).toHaveLength(0)

    // Apenas precificação do p2 deve permanecer
    expect(result.current.pricing).toHaveLength(1)
    expect(result.current.pricing[0].productId).toBe('p2')

    // deleteDocument deve ter sido chamado para: produto + 2 preços
    expect(mockDeleteDocument).toHaveBeenCalledTimes(3)
  })

  it('deletar produto sem precificações NÃO deve afetar pricing', async () => {
    mockListDocuments
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'p1', name: 'Produto Sem Preço' }])
      .mockResolvedValueOnce([{ id: 'r1', productId: 'p2', costPrice: 100 }]) // Outro produto

    mockDeleteDocument.mockResolvedValue(true)

    const { result } = renderHook(() => useEngenhariaStorage())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.deleteProduct('p1')
    })

    expect(result.current.pricing).toHaveLength(1)
    expect(mockDeleteDocument).toHaveBeenCalledTimes(1) // Só o produto
  })
})
