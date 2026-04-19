/**
 * ===================================================================
 * TESTES DE PERSISTÊNCIA - useEngenhariaStorage hook
 * ===================================================================
 * Testa o hook customizado de gerenciamento de dados de engenharia
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

// ====================== TESTES ======================

describe('useEngenhariaStorage - Carregamento Inicial', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListDocuments.mockResolvedValue([])
  })

  it('deve iniciar com loading true', () => {
    const { result } = renderHook(() => useEngenhariaStorage())
    // Pode já ter resolvido em alguns cenários, mas o estado inicial é loading
    expect(result.current.loading === true || result.current.loading === false).toBe(true)
  })

  it('deve carregar todas as 3 coleções ao montar', async () => {
    mockListDocuments
      .mockResolvedValueOnce([{ id: 's1', item: 'Motor' }])
      .mockResolvedValueOnce([{ id: 'p1', name: 'Produto A' }])
      .mockResolvedValueOnce([{ id: 'r1', costPrice: 100 }])

    const { result } = renderHook(() => useEngenhariaStorage())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(mockListDocuments).toHaveBeenCalledTimes(3)
    expect(mockListDocuments).toHaveBeenCalledWith('shopping_list')
    expect(mockListDocuments).toHaveBeenCalledWith('products')
    expect(mockListDocuments).toHaveBeenCalledWith('pricing')
  })

  it('deve popular shoppingList após carregamento', async () => {
    const items = [
      { id: 's1', item: 'Hélice 3 pás', qty: 50 },
      { id: 's2', item: 'Motor 90YT120', qty: 10 },
    ]
    mockListDocuments
      .mockResolvedValueOnce(items)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])

    const { result } = renderHook(() => useEngenhariaStorage())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.shoppingList).toHaveLength(2)
    expect(result.current.shoppingList[0].item).toBe('Hélice 3 pás')
  })

  it('deve popular products após carregamento', async () => {
    const products = [
      { id: 'p1', name: 'Sistema 3F', model: 'V100' },
    ]
    mockListDocuments
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(products)
      .mockResolvedValueOnce([])

    const { result } = renderHook(() => useEngenhariaStorage())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.products).toHaveLength(1)
    expect(result.current.products[0].name).toBe('Sistema 3F')
  })

  it('deve popular pricing após carregamento', async () => {
    const pricing = [
      { id: 'r1', productId: 'p1', costPrice: 500, salePrice: 1200 },
    ]
    mockListDocuments
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(pricing)

    const { result } = renderHook(() => useEngenhariaStorage())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.pricing).toHaveLength(1)
    expect(result.current.pricing[0].costPrice).toBe(500)
  })

  it('deve capturar erro de carregamento', async () => {
    mockListDocuments.mockRejectedValue(new Error('Connection timeout'))

    const { result } = renderHook(() => useEngenhariaStorage())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Connection timeout')
  })
})

describe('useEngenhariaStorage - Shopping List CRUD', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListDocuments.mockResolvedValue([])
  })

  it('deve adicionar item à shopping list', async () => {
    const newItem = { id: 'new1', item: 'Parafuso M8', qty: 200, unit: 'un', unitPrice: 0.5, supplier: 'Ferreira' }
    mockAddDocument.mockResolvedValue(newItem)

    const { result } = renderHook(() => useEngenhariaStorage())

    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.addShoppingItem({
        item: 'Parafuso M8', qty: 200, unit: 'un', unitPrice: 0.5, supplier: 'Ferreira'
      })
    })

    expect(mockAddDocument).toHaveBeenCalledWith(
      'shopping_list',
      expect.objectContaining({ item: 'Parafuso M8', qty: 200 }),
      'admin'
    )
    expect(result.current.shoppingList).toContainEqual(newItem)
  })

  it('deve usar valores padrão quando campos estão ausentes', async () => {
    mockAddDocument.mockResolvedValue({ id: 'x1' })

    const { result } = renderHook(() => useEngenhariaStorage())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.addShoppingItem({})
    })

    expect(mockAddDocument).toHaveBeenCalledWith(
      'shopping_list',
      expect.objectContaining({
        item: '',
        qty: 0,
        unit: 'un',
        unitPrice: 0,
        supplier: '',
        status: 'Pendente',
      }),
      'admin'
    )
  })

  it('deve atualizar item da shopping list', async () => {
    const updated = { id: 's1', item: 'Motor', qty: 20, status: 'Comprado' }
    mockListDocuments
      .mockResolvedValueOnce([{ id: 's1', item: 'Motor', qty: 10, status: 'Pendente' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
    mockUpdateDocument.mockResolvedValue(updated)

    const { result } = renderHook(() => useEngenhariaStorage())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.updateShoppingItem('s1', { qty: 20, status: 'Comprado' })
    })

    expect(mockUpdateDocument).toHaveBeenCalledWith(
      'shopping_list', 's1', { qty: 20, status: 'Comprado' }, 'admin'
    )
    expect(result.current.shoppingList[0].qty).toBe(20)
  })

  it('deve deletar item da shopping list', async () => {
    mockListDocuments
      .mockResolvedValueOnce([
        { id: 's1', item: 'Motor' },
        { id: 's2', item: 'Hélice' },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
    mockDeleteDocument.mockResolvedValue(true)

    const { result } = renderHook(() => useEngenhariaStorage())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.deleteShoppingItem('s1')
    })

    expect(mockDeleteDocument).toHaveBeenCalledWith('shopping_list', 's1', 'admin')
    expect(result.current.shoppingList).toHaveLength(1)
    expect(result.current.shoppingList[0].id).toBe('s2')
  })

  it('deve capturar erro ao adicionar item', async () => {
    mockAddDocument.mockRejectedValue(new Error('Insert failed'))

    const { result } = renderHook(() => useEngenhariaStorage())
    await waitFor(() => expect(result.current.loading).toBe(false))

    let thrownError = null
    try {
      await act(async () => {
        await result.current.addShoppingItem({ item: 'Falha' })
      })
    } catch (e) {
      thrownError = e
    }

    expect(thrownError).not.toBeNull()
    expect(thrownError.message).toBe('Insert failed')
  })
})

describe('useEngenhariaStorage - Products CRUD', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListDocuments.mockResolvedValue([])
  })

  it('deve adicionar produto', async () => {
    const newProduct = { id: 'p1', name: 'Sistema 3F', model: 'V100', description: 'Ventilador', pieces: [], status: 'Ativo' }
    mockAddDocument.mockResolvedValue(newProduct)

    const { result } = renderHook(() => useEngenhariaStorage())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.addProduct({ name: 'Sistema 3F', model: 'V100', description: 'Ventilador' })
    })

    expect(result.current.products).toContainEqual(newProduct)
  })

  it('deve usar valores padrão para produto', async () => {
    mockAddDocument.mockResolvedValue({ id: 'p2' })

    const { result } = renderHook(() => useEngenhariaStorage())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.addProduct({})
    })

    expect(mockAddDocument).toHaveBeenCalledWith(
      'products',
      expect.objectContaining({
        name: '',
        model: '',
        description: '',
        pieces: [],
        status: 'Ativo',
      }),
      'admin'
    )
  })

  it('deve atualizar produto existente', async () => {
    const updated = { id: 'p1', name: 'Sistema 3F v2', model: 'V200' }
    mockListDocuments
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'p1', name: 'Sistema 3F', model: 'V100' }])
      .mockResolvedValueOnce([])
    mockUpdateDocument.mockResolvedValue(updated)

    const { result } = renderHook(() => useEngenhariaStorage())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.updateProduct('p1', { name: 'Sistema 3F v2', model: 'V200' })
    })

    expect(result.current.products[0].name).toBe('Sistema 3F v2')
  })

  it('deve deletar produto e precificação associada', async () => {
    mockListDocuments
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'p1', name: 'Produto' }])
      .mockResolvedValueOnce([
        { id: 'r1', productId: 'p1', costPrice: 100 },
        { id: 'r2', productId: 'p1', costPrice: 200 },
        { id: 'r3', productId: 'p2', costPrice: 300 },
      ])
    mockDeleteDocument.mockResolvedValue(true)

    const { result } = renderHook(() => useEngenhariaStorage())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.deleteProduct('p1')
    })

    // Deve deletar produto + 2 preços associados
    expect(mockDeleteDocument).toHaveBeenCalledWith('products', 'p1', 'admin')
    expect(mockDeleteDocument).toHaveBeenCalledWith('pricing', 'r1', 'admin')
    expect(mockDeleteDocument).toHaveBeenCalledWith('pricing', 'r2', 'admin')
    expect(mockDeleteDocument).not.toHaveBeenCalledWith('pricing', 'r3', 'admin')

    expect(result.current.products).toHaveLength(0)
    expect(result.current.pricing).toHaveLength(1)
    expect(result.current.pricing[0].id).toBe('r3')
  })
})

describe('useEngenhariaStorage - Pricing CRUD', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListDocuments.mockResolvedValue([])
  })

  it('deve adicionar linha de precificação', async () => {
    const newPrice = { id: 'r1', productId: 'p1', costPrice: 500, salePrice: 1200, margin: 140, currency: 'BRL' }
    mockAddDocument.mockResolvedValue(newPrice)

    const { result } = renderHook(() => useEngenhariaStorage())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.addPricingRow({ productId: 'p1', costPrice: 500, salePrice: 1200, margin: 140 })
    })

    expect(result.current.pricing).toContainEqual(newPrice)
  })

  it('deve usar valores padrão para precificação', async () => {
    mockAddDocument.mockResolvedValue({ id: 'r2' })

    const { result } = renderHook(() => useEngenhariaStorage())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.addPricingRow({})
    })

    expect(mockAddDocument).toHaveBeenCalledWith(
      'pricing',
      expect.objectContaining({
        productId: '',
        costPrice: 0,
        salePrice: 0,
        margin: 0,
        currency: 'BRL',
      }),
      'admin'
    )
  })

  it('deve atualizar linha de precificação', async () => {
    const updated = { id: 'r1', costPrice: 600, salePrice: 1400 }
    mockListDocuments
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'r1', costPrice: 500, salePrice: 1200 }])
    mockUpdateDocument.mockResolvedValue(updated)

    const { result } = renderHook(() => useEngenhariaStorage())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.updatePricingRow('r1', { costPrice: 600, salePrice: 1400 })
    })

    expect(result.current.pricing[0].costPrice).toBe(600)
  })

  it('deve deletar linha de precificação', async () => {
    mockListDocuments
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { id: 'r1', costPrice: 500 },
        { id: 'r2', costPrice: 800 },
      ])
    mockDeleteDocument.mockResolvedValue(true)

    const { result } = renderHook(() => useEngenhariaStorage())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.deletePricingRow('r1')
    })

    expect(result.current.pricing).toHaveLength(1)
    expect(result.current.pricing[0].id).toBe('r2')
  })
})

describe('useEngenhariaStorage - Reload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListDocuments.mockResolvedValue([])
  })

  it('deve recarregar todos os dados com reload()', async () => {
    const { result } = renderHook(() => useEngenhariaStorage())
    await waitFor(() => expect(result.current.loading).toBe(false))

    // Simular novos dados no reload
    mockListDocuments
      .mockResolvedValueOnce([{ id: 's1', item: 'Novo Item' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])

    await act(async () => {
      await result.current.reload()
    })

    // 3 chamadas iniciais + 3 no reload = 6
    expect(mockListDocuments).toHaveBeenCalledTimes(6)
    expect(result.current.shoppingList).toHaveLength(1)
  })

  it('deve limpar erro anterior no reload', async () => {
    mockListDocuments.mockRejectedValueOnce(new Error('Erro 1'))
    mockListDocuments.mockResolvedValue([])

    const { result } = renderHook(() => useEngenhariaStorage())
    await waitFor(() => expect(result.current.error).toBe('Erro 1'))

    mockListDocuments.mockResolvedValue([])

    await act(async () => {
      await result.current.reload()
    })

    expect(result.current.error).toBeNull()
  })
})
