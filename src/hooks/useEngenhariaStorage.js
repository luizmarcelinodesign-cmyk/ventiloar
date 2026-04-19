/**
 * EXEMPLO DE INTEGRAÇÃO - Engenharia.jsx refatorado
 * 
 * Este arquivo mostra como migrar de localStorage manual 
 * para storageService com auditoria automática
 * 
 * COMO USAR:
 * 1. Copie as funções useEngenhariaStorage() 
 * 2. Adicione em seu componente
 * 3. Substitua setShoppingList() por useEngenhariaStorage().addShoppingItem()
 */

import { useState, useEffect } from 'react'
import { 
  listDocuments, 
  addDocument, 
  updateDocument, 
  deleteDocument 
} from '../services/storageService'

// ==========================================
// HOOK CUSTOMIZADO - Facilita uso
// ==========================================
export function useEngenhariaStorage() {
  const [shoppingList, setShoppingList] = useState([])
  const [products, setProducts] = useState([])
  const [pricing, setPricing] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Carrega dados ao montar
  useEffect(() => {
    loadAllData()
  }, [])

  // ==========================================
  // LOAD
  // ==========================================
  async function loadAllData() {
    try {
      setLoading(true)
      setError(null)

      const [items, prods, prices] = await Promise.all([
        listDocuments('shopping_list'),
        listDocuments('products'),
        listDocuments('pricing'),
      ])

      setShoppingList(items)
      setProducts(prods)
      setPricing(prices)
    } catch (err) {
      console.error('Erro carregando engenharia:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ==========================================
  // SHOPPING LIST
  // ==========================================
  async function addShoppingItem(itemData) {
    try {
      const newItem = {
        item: itemData.item || '',
        qty: itemData.qty || 0,
        unit: itemData.unit || 'un',
        unitPrice: itemData.unitPrice || 0,
        supplier: itemData.supplier || '',
        status: itemData.status || 'Pendente',
      }

      const created = await addDocument('shopping_list', newItem, 'admin')
      
      // Atualiza estado local
      setShoppingList((prev) => [...prev, created])
      
      return created
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  async function updateShoppingItem(itemId, updates) {
    try {
      const updated = await updateDocument('shopping_list', itemId, updates, 'admin')
      
      // Atualiza estado local
      setShoppingList((prev) =>
        prev.map((item) => (item.id === itemId ? updated : item))
      )
      
      return updated
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  async function deleteShoppingItem(itemId) {
    try {
      await deleteDocument('shopping_list', itemId, 'admin')
      
      // Atualiza estado local
      setShoppingList((prev) => prev.filter((item) => item.id !== itemId))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  // ==========================================
  // PRODUCTS
  // ==========================================
  async function addProduct(productData) {
    try {
      const newProduct = {
        name: productData.name || '',
        model: productData.model || '',
        description: productData.description || '',
        pieces: productData.pieces || [],
        status: productData.status || 'Ativo',
      }

      const created = await addDocument('products', newProduct, 'admin')
      setProducts((prev) => [...prev, created])
      
      return created
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  async function updateProduct(productId, updates) {
    try {
      const updated = await updateDocument('products', productId, updates, 'admin')
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? updated : p))
      )
      
      return updated
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  async function deleteProduct(productId) {
    try {
      await deleteDocument('products', productId, 'admin')
      
      // Também remove precificação associada
      const pricesToDelete = pricing.filter((p) => p.productId === productId)
      for (const price of pricesToDelete) {
        await deleteDocument('pricing', price.id, 'admin')
      }
      
      setProducts((prev) => prev.filter((p) => p.id !== productId))
      setPricing((prev) => prev.filter((p) => p.productId !== productId))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  // ==========================================
  // PRICING
  // ==========================================
  async function addPricingRow(pricingData) {
    try {
      const newPrice = {
        productId: pricingData.productId || '',
        costPrice: pricingData.costPrice || 0,
        salePrice: pricingData.salePrice || 0,
        margin: pricingData.margin || 0,
        currency: pricingData.currency || 'BRL',
      }

      const created = await addDocument('pricing', newPrice, 'admin')
      setPricing((prev) => [...prev, created])
      
      return created
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  async function updatePricingRow(rowId, updates) {
    try {
      const updated = await updateDocument('pricing', rowId, updates, 'admin')
      setPricing((prev) =>
        prev.map((r) => (r.id === rowId ? updated : r))
      )
      
      return updated
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  async function deletePricingRow(rowId) {
    try {
      await deleteDocument('pricing', rowId, 'admin')
      setPricing((prev) => prev.filter((r) => r.id !== rowId))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  return {
    // Estado
    shoppingList,
    products,
    pricing,
    loading,
    error,

    // Funções Shopping List
    addShoppingItem,
    updateShoppingItem,
    deleteShoppingItem,

    // Funções Products
    addProduct,
    updateProduct,
    deleteProduct,

    // Funções Pricing
    addPricingRow,
    updatePricingRow,
    deletePricingRow,

    // Reload
    reload: loadAllData,
  }
}

// ==========================================
// EXEMPLO DE USO EM COMPONENTE
// ==========================================
/*
export default function MeuComponente() {
  const engenharia = useEngenhariaStorage()

  if (engenharia.loading) return <div>Carregando...</div>
  if (engenharia.error) return <div>Erro: {engenharia.error}</div>

  const handleAddItem = async (e) => {
    e.preventDefault()
    
    try {
      await engenharia.addShoppingItem({
        item: 'Hélice 3 pás',
        qty: 50,
        unit: 'un',
        unitPrice: 45.50,
        supplier: 'Fornecedor XYZ',
      })
      // ✅ Automático: registrado em auditoria!
    } catch (err) {
      console.error('Erro:', err)
    }
  }

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Tem certeza?')) return
    
    try {
      await engenharia.deleteShoppingItem(itemId)
      // ✅ Automático: exclusão auditada!
    } catch (err) {
      console.error('Erro:', err)
    }
  }

  return (
    <div>
      <h2>Lista de Compras</h2>
      <button onClick={handleAddItem}>Adicionar Item</button>
      
      {engenharia.shoppingList.map((item) => (
        <div key={item.id}>
          <span>{item.item}</span>
          <button onClick={() => handleDeleteItem(item.id)}>
            Deletar
          </button>
        </div>
      ))}
    </div>
  )
}
*/

// ==========================================
// FUNÇÕES AUXILIARES PRONTAS
// ==========================================

/**
 * Calcula quanto de um item foi usado em todos os produtos
 */
export function calculateItemUsage(itemId, products) {
  let totalUsed = 0
  
  products.forEach((product) => {
    if (product.pieces) {
      const used = product.pieces
        .filter((piece) => piece.shoppingItemId === itemId)
        .reduce((sum, piece) => sum + (Number(piece.qty) || 0), 0)
      
      totalUsed += used
    }
  })
  
  return totalUsed
}

/**
 * Calcula estoque disponível de um item
 */
export function calculateAvailableStock(item, usage) {
  const quantity = Number(item.qty) || 0
  return Math.max(0, quantity - usage)
}

/**
 * Calcula custo total de um produto
 */
export function calculateProductCost(product, shoppingList) {
  if (!product.pieces || !product.pieces.length) return 0
  
  return product.pieces.reduce((sum, piece) => {
    const shopItem = shoppingList.find((i) => i.id === piece.shoppingItemId)
    if (!shopItem) return sum
    
    const pieceCost = (Number(piece.qty) || 0) * (Number(shopItem.unitPrice) || 0)
    return sum + pieceCost
  }, 0)
}

/**
 * Calcula preço sugerido baseado em margens
 */
export function calculateSuggestedPrice(productCost, productMargin, taxMargin, profitMargin) {
  const costWithProd = productCost * (1 + (Number(productMargin) || 0) / 100)
  const costWithTax = costWithProd * (1 + (Number(taxMargin) || 0) / 100)
  const finalPrice = costWithTax * (1 + (Number(profitMargin) || 0) / 100)
  
  return finalPrice
}

// ==========================================
// FUNÇÃO DE MIGRAÇÃO LEGADA
// ==========================================

/**
 * Se você ainda tem dados em localStorage, pode migrar assim:
 */
export async function migrateFromLocalStorage() {
  try {
    const legacy = localStorage.getItem('ventiloar-engenharia')
    if (!legacy) {
      console.log('Nenhum dado legado encontrado')
      return false
    }

    const { shoppingList, products, pricing } = JSON.parse(legacy)

    // Adiciona cada item
    for (const item of shoppingList || []) {
      await addDocument('shopping_list', item, 'migration')
    }
    for (const prod of products || []) {
      await addDocument('products', prod, 'migration')
    }
    for (const price of pricing || []) {
      await addDocument('pricing', price, 'migration')
    }

    // Remove localStorage antigo
    localStorage.removeItem('ventiloar-engenharia')
    
    console.log('✅ Migração concluída!')
    return true
  } catch (err) {
    console.error('Erro na migração:', err)
    return false
  }
}

export default useEngenhariaStorage
