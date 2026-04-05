import { useState, useEffect, useCallback, useMemo } from 'react'

// ==========================================
// HELPERS
// ==========================================
const fmtBRL = (v) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

const STORAGE_KEY = 'ventiloar-engenharia'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch { /* silently fail */ }
}

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function Engenharia() {
  const saved = useMemo(() => loadFromStorage(), [])

  const [shoppingList, setShoppingList] = useState(
    saved?.shoppingList || []
  )
  const [products, setProducts] = useState(
    saved?.products || []
  )
  const [pricing, setPricing] = useState(
    saved?.pricing || []
  )
  const [notification, setNotification] = useState(null)

  // Persist on every change
  useEffect(() => {
    saveToStorage({ shoppingList, products, pricing })
  }, [shoppingList, products, pricing])

  // Notification auto-dismiss
  useEffect(() => {
    if (!notification) return
    const t = setTimeout(() => setNotification(null), 3000)
    return () => clearTimeout(t)
  }, [notification])

  // ==========================================
  // STOCK USAGE: compute how much of each shopping item is used across all products
  // ==========================================
  const usageMap = useMemo(() => {
    const map = {}
    products.forEach((prod) => {
      prod.pieces.forEach((piece) => {
        if (piece.shoppingItemId) {
          map[piece.shoppingItemId] = (map[piece.shoppingItemId] || 0) + (Number(piece.qty) || 0)
        }
      })
    })
    return map
  }, [products])

  const getAvailable = useCallback(
    (itemId) => {
      const item = shoppingList.find((i) => i.id === itemId)
      if (!item) return 0
      const used = usageMap[itemId] || 0
      return Math.max(0, (Number(item.qty) || 0) - used)
    },
    [shoppingList, usageMap]
  )

  // ==========================================
  // SHOPPING LIST TOTAL
  // ==========================================
  const shoppingTotal = useMemo(
    () => shoppingList.reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.unitPrice) || 0), 0),
    [shoppingList]
  )

  // ==========================================
  // PRODUCT COST helper
  // ==========================================
  const getProductCost = useCallback(
    (product) =>
      product.pieces.reduce((sum, piece) => {
        const shopItem = shoppingList.find((i) => i.id === piece.shoppingItemId)
        const unitPrice = shopItem ? Number(shopItem.unitPrice) || 0 : 0
        return sum + (Number(piece.qty) || 0) * unitPrice
      }, 0),
    [shoppingList]
  )

  // ==========================================
  // SHOPPING LIST HANDLERS
  // ==========================================
  const addShoppingItem = () => {
    setShoppingList((prev) => [
      ...prev,
      { id: uid(), name: '', qty: '', unit: 'un', unitPrice: '' },
    ])
  }

  const updateShoppingItem = (id, field, value) => {
    setShoppingList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    )
  }

  const deleteShoppingItem = (id) => {
    setShoppingList((prev) => prev.filter((item) => item.id !== id))
  }

  // ==========================================
  // PRODUCTS HANDLERS
  // ==========================================
  const addProduct = () => {
    setProducts((prev) => [...prev, { id: uid(), name: '', pieces: [] }])
  }

  const updateProductName = (prodId, name) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === prodId ? { ...p, name } : p))
    )
  }

  const deleteProduct = (prodId) => {
    setProducts((prev) => prev.filter((p) => p.id !== prodId))
    setPricing((prev) => prev.filter((r) => r.productId !== prodId))
  }

  const addPiece = (prodId) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === prodId
          ? { ...p, pieces: [...p.pieces, { id: uid(), shoppingItemId: '', qty: '' }] }
          : p
      )
    )
  }

  const updatePiece = (prodId, pieceId, field, value) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === prodId
          ? {
              ...p,
              pieces: p.pieces.map((pc) =>
                pc.id === pieceId ? { ...pc, [field]: value } : pc
              ),
            }
          : p
      )
    )
  }

  const deletePiece = (prodId, pieceId) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === prodId
          ? { ...p, pieces: p.pieces.filter((pc) => pc.id !== pieceId) }
          : p
      )
    )
  }

  // ==========================================
  // PRICING HANDLERS
  // ==========================================
  const addPricingRow = () => {
    setPricing((prev) => [
      ...prev,
      { id: uid(), productId: '', custoProd: '', impostos: '', lucro: '' },
    ])
  }

  const updatePricingField = (rowId, field, value) => {
    setPricing((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, [field]: value } : r))
    )
  }

  const deletePricingRow = (rowId) => {
    setPricing((prev) => prev.filter((r) => r.id !== rowId))
  }

  const calcSuggestedPrice = (row) => {
    const product = products.find((p) => p.id === row.productId)
    if (!product) return 0
    const cost = getProductCost(product)
    const prod = cost * ((Number(row.custoProd) || 0) / 100)
    const subtotal = cost + prod
    const tax = subtotal * ((Number(row.impostos) || 0) / 100)
    const subtotalTax = subtotal + tax
    const profit = subtotalTax * ((Number(row.lucro) || 0) / 100)
    return subtotalTax + profit
  }

  // ==========================================
  // EXPORT
  // ==========================================
  const exportCSV = () => {
    let csv = 'LISTA DE COMPRAS\nProduto;Quantidade;Unidade;Valor Unitário;Valor Total;Estoque Disponível\n'
    shoppingList.forEach((item) => {
      const total = ((Number(item.qty) || 0) * (Number(item.unitPrice) || 0)).toFixed(2)
      const avail = getAvailable(item.id)
      csv += `${item.name};${item.qty};${item.unit};${item.unitPrice};${total};${avail}\n`
    })
    csv += `;;; TOTAL;${shoppingTotal.toFixed(2)};\n\n`

    csv += 'ENGENHARIA DE PRODUTO\nProduto;Peça;Quantidade;Custo\n'
    products.forEach((prod) => {
      prod.pieces.forEach((piece) => {
        const shopItem = shoppingList.find((i) => i.id === piece.shoppingItemId)
        const cost = (Number(piece.qty) || 0) * (Number(shopItem?.unitPrice) || 0)
        csv += `${prod.name};${shopItem?.name || ''};${piece.qty};${cost.toFixed(2)}\n`
      })
      csv += `${prod.name};CUSTO TOTAL;;${getProductCost(prod).toFixed(2)}\n`
    })

    csv += '\nPRECIFICAÇÃO\nProduto;Custo Total;Custo Produção %;Impostos %;Lucro %;Preço Sugerido\n'
    pricing.forEach((row) => {
      const product = products.find((p) => p.id === row.productId)
      const cost = product ? getProductCost(product) : 0
      csv += `${product?.name || ''};${cost.toFixed(2)};${row.custoProd};${row.impostos};${row.lucro};${calcSuggestedPrice(row).toFixed(2)}\n`
    })

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `engenharia_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setNotification({ msg: 'CSV exportado com sucesso!', type: 'success' })
  }

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <main className="relative min-h-screen">
      <div className="absolute inset-0 technical-grid opacity-10 pointer-events-none" />

      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-6 right-6 z-50 px-6 py-3 text-sm font-headline font-bold uppercase tracking-widest ${
            notification.type === 'success'
              ? 'bg-primary-container text-on-primary-container'
              : 'bg-error text-on-error'
          }`}
        >
          {notification.msg}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 md:px-8 py-16 md:py-20 relative z-10">
        {/* Header */}
        <header className="mb-12 md:mb-16">
          <div className="flex items-baseline gap-4 mb-2">
            <span className="text-primary-container font-headline font-bold text-sm tracking-[0.2em] uppercase">
              Gestão Interna
            </span>
            <div className="h-[1px] flex-grow bg-outline-variant opacity-20" />
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-headline font-bold uppercase tracking-tighter leading-none mb-4">
            Engenharia &<br />Precificação
          </h1>
          <div className="w-24 h-1 bg-primary-container mt-4 mb-6" />

          {/* Toolbar */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-5 py-3 bg-primary-container text-on-primary-container font-headline font-bold uppercase text-xs tracking-widest hover:bg-primary transition-colors"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Exportar CSV
            </button>
          </div>
        </header>

        {/* ======================================================
            LISTA DE COMPRAS
        ====================================================== */}
        <section className="mb-12">
          <div className="bg-surface-container-low">
            <div className="flex items-center justify-between p-6 md:p-8 border-b border-outline-variant/20">
              <h2 className="font-headline font-bold uppercase text-xs tracking-[0.3em] text-primary-container flex items-center gap-3">
                <span className="material-symbols-outlined text-lg">shopping_cart</span>
                Lista de Compras
              </h2>
            </div>

            <div className="p-6 md:p-8">
              {/* Table header */}
              <div className="hidden md:grid grid-cols-[2fr_1fr_0.8fr_1fr_1fr_0.8fr_auto] gap-3 mb-3">
                {['Produto', 'Quantidade', 'Unidade', 'Valor Unit.', 'Valor Total', 'Disponível', ''].map(
                  (h) => (
                    <div key={h} className="text-[10px] font-headline uppercase tracking-widest text-on-surface-variant px-1">
                      {h}
                    </div>
                  )
                )}
              </div>

              {/* Rows */}
              <div className="space-y-2">
                {shoppingList.map((item) => {
                  const total = (Number(item.qty) || 0) * (Number(item.unitPrice) || 0)
                  const available = getAvailable(item.id)
                  return (
                    <div
                      key={item.id}
                      className="grid grid-cols-1 md:grid-cols-[2fr_1fr_0.8fr_1fr_1fr_0.8fr_auto] gap-3 bg-surface-container-lowest p-3 items-center"
                    >
                      <input
                        type="text"
                        placeholder="Nome do produto"
                        value={item.name}
                        onChange={(e) => updateShoppingItem(item.id, 'name', e.target.value)}
                        className="bg-surface-container-high text-on-surface px-3 py-2 text-sm font-body placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-primary-container"
                      />
                      <input
                        type="number"
                        placeholder="0"
                        min="0"
                        step="0.01"
                        value={item.qty}
                        onChange={(e) => updateShoppingItem(item.id, 'qty', e.target.value)}
                        className="bg-surface-container-high text-on-surface px-3 py-2 text-sm font-mono placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-primary-container"
                      />
                      <input
                        type="text"
                        placeholder="un"
                        value={item.unit}
                        onChange={(e) => updateShoppingItem(item.id, 'unit', e.target.value)}
                        className="bg-surface-container-high text-on-surface px-3 py-2 text-sm font-body placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-primary-container"
                      />
                      <input
                        type="number"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateShoppingItem(item.id, 'unitPrice', e.target.value)}
                        className="bg-surface-container-high text-on-surface px-3 py-2 text-sm font-mono placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-primary-container"
                      />
                      <div className="bg-surface-container-high px-3 py-2 text-sm font-mono text-primary">
                        {fmtBRL(total)}
                      </div>
                      <div
                        className={`px-3 py-2 text-sm font-mono ${
                          available <= 0
                            ? 'text-error bg-error/10'
                            : 'text-on-surface bg-surface-container-high'
                        }`}
                      >
                        {available}
                      </div>
                      <button
                        onClick={() => deleteShoppingItem(item.id)}
                        className="p-2 text-error hover:bg-error/10 transition-colors justify-self-center"
                        title="Remover item"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  )
                })}

                {/* Total row */}
                {shoppingList.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_0.8fr_1fr_1fr_0.8fr_auto] gap-3 bg-primary-container/10 p-3 items-center border-t-2 border-primary-container">
                    <div className="md:col-span-3 text-[10px] font-headline uppercase tracking-widest text-on-surface font-bold">
                      Valor Total da Lista
                    </div>
                    <div className="hidden md:block" />
                    <div className="text-lg font-mono font-bold text-primary">{fmtBRL(shoppingTotal)}</div>
                    <div className="hidden md:block" />
                    <div />
                  </div>
                )}

                {/* Add button - always at the bottom */}
                <button
                  onClick={addShoppingItem}
                  className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-outline-variant/30 text-primary-container font-headline font-bold uppercase text-xs tracking-widest hover:bg-surface-container-high/50 transition-colors mt-2"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Adicionar Item
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================
            ENGENHARIA DE PRODUTO
        ====================================================== */}
        <section className="mb-12">
          <div className="bg-surface-container-low">
            <div className="flex items-center justify-between p-6 md:p-8 border-b border-outline-variant/20">
              <h2 className="font-headline font-bold uppercase text-xs tracking-[0.3em] text-tertiary-container flex items-center gap-3">
                <span className="material-symbols-outlined text-lg">precision_manufacturing</span>
                Engenharia de Produto
              </h2>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              {products.map((prod) => {
                const prodCost = getProductCost(prod)
                return (
                  <div key={prod.id} className="bg-surface-container-lowest p-4 md:p-6 border-l-4 border-tertiary-container">
                    {/* Product header */}
                    <div className="flex items-center gap-3 mb-4">
                      <input
                        type="text"
                        placeholder="Nome do produto"
                        value={prod.name}
                        onChange={(e) => updateProductName(prod.id, e.target.value)}
                        className="flex-grow bg-surface-container-high text-on-surface px-4 py-2 text-sm font-headline font-bold placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-tertiary-container"
                      />
                      <button
                        onClick={() => deleteProduct(prod.id)}
                        className="p-2 text-error hover:bg-error/10 transition-colors"
                        title="Excluir produto"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>

                    {/* Pieces table header */}
                    {prod.pieces.length > 0 && (
                      <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_auto] gap-3 mb-2 px-1">
                        {['Peça (da lista de compras)', 'Quantidade', 'Custo', ''].map((h) => (
                          <div key={h} className="text-[10px] font-headline uppercase tracking-widest text-on-surface-variant">
                            {h}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Pieces */}
                    <div className="space-y-2">
                      {prod.pieces.map((piece) => {
                        const shopItem = shoppingList.find((i) => i.id === piece.shoppingItemId)
                        const pieceCost = (Number(piece.qty) || 0) * (Number(shopItem?.unitPrice) || 0)
                        return (
                          <div
                            key={piece.id}
                            className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] gap-3 bg-surface-container-low p-3 items-center"
                          >
                            <select
                              value={piece.shoppingItemId}
                              onChange={(e) => updatePiece(prod.id, piece.id, 'shoppingItemId', e.target.value)}
                              className="bg-surface-container-high text-on-surface px-3 py-2 text-sm font-body appearance-none focus:outline-none focus:ring-1 focus:ring-tertiary-container custom-select"
                            >
                              <option value="">Selecione uma peça</option>
                              {shoppingList
                                .filter((i) => i.name.trim())
                                .map((i) => (
                                  <option key={i.id} value={i.id}>
                                    {i.name} (disp: {getAvailable(i.id)})
                                  </option>
                                ))}
                            </select>
                            <input
                              type="number"
                              placeholder="0"
                              min="0"
                              step="0.01"
                              value={piece.qty}
                              onChange={(e) => updatePiece(prod.id, piece.id, 'qty', e.target.value)}
                              className="bg-surface-container-high text-on-surface px-3 py-2 text-sm font-mono placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-tertiary-container"
                            />
                            <div className="px-3 py-2 text-sm font-mono text-tertiary-container bg-surface-container-high">
                              {fmtBRL(pieceCost)}
                            </div>
                            <button
                              onClick={() => deletePiece(prod.id, piece.id)}
                              className="p-2 text-error hover:bg-error/10 transition-colors justify-self-center"
                              title="Remover peça"
                            >
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          </div>
                        )
                      })}

                      {/* Add piece button - always at the bottom */}
                      <button
                        onClick={() => addPiece(prod.id)}
                        className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-outline-variant/20 text-tertiary-container font-headline font-bold uppercase text-[10px] tracking-widest hover:bg-surface-container-high/50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">add</span>
                        Adicionar Peça
                      </button>
                    </div>

                    {/* Product total */}
                    <div className="flex items-center justify-end gap-4 mt-4 pt-3 border-t border-outline-variant/20">
                      <span className="text-[10px] font-headline uppercase tracking-widest text-on-surface-variant">
                        Custo Total
                      </span>
                      <span className="text-lg font-mono font-bold text-tertiary-container">
                        {fmtBRL(prodCost)}
                      </span>
                    </div>
                  </div>
                )
              })}

              {/* Add product button - always at the bottom */}
              <button
                onClick={addProduct}
                className="w-full flex items-center justify-center gap-2 py-4 border border-dashed border-outline-variant/30 text-tertiary-container font-headline font-bold uppercase text-xs tracking-widest hover:bg-surface-container-high/50 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Adicionar Produto
              </button>
            </div>
          </div>
        </section>

        {/* ======================================================
            PRECIFICAÇÃO
        ====================================================== */}
        <section className="mb-12">
          <div className="bg-surface-container-low">
            <div className="flex items-center justify-between p-6 md:p-8 border-b border-outline-variant/20">
              <h2 className="font-headline font-bold uppercase text-xs tracking-[0.3em] text-primary flex items-center gap-3">
                <span className="material-symbols-outlined text-lg">sell</span>
                Precificação
              </h2>
            </div>

            <div className="p-6 md:p-8">
              {/* Table header */}
              <div className="hidden lg:grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr_1.2fr_auto] gap-3 mb-3">
                {['Produto', 'Custo Total', 'Custo Prod. (%)', 'Impostos (%)', 'Lucro (%)', 'Preço Sugerido', ''].map(
                  (h) => (
                    <div key={h} className="text-[10px] font-headline uppercase tracking-widest text-on-surface-variant px-1">
                      {h}
                    </div>
                  )
                )}
              </div>

              <div className="space-y-2">
                {pricing.map((row) => {
                  const product = products.find((p) => p.id === row.productId)
                  const cost = product ? getProductCost(product) : 0
                  const suggestedPrice = calcSuggestedPrice(row)

                  return (
                    <div
                      key={row.id}
                      className="grid grid-cols-1 lg:grid-cols-[2fr_1.2fr_1fr_1fr_1fr_1.2fr_auto] gap-3 bg-surface-container-lowest p-3 items-center"
                    >
                      {/* Produto */}
                      <select
                        value={row.productId}
                        onChange={(e) => updatePricingField(row.id, 'productId', e.target.value)}
                        className="bg-surface-container-high text-on-surface px-3 py-2 text-sm font-body appearance-none focus:outline-none focus:ring-1 focus:ring-primary custom-select"
                      >
                        <option value="">Selecione um produto</option>
                        {products
                          .filter((p) => p.name.trim())
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                      </select>

                      {/* Custo Total (auto, was "Preço sugerido") */}
                      <div className="bg-surface-container-high px-3 py-2 text-sm font-mono text-error">
                        <span className="lg:hidden text-[10px] font-headline uppercase tracking-widest text-on-surface-variant block mb-1">
                          Custo Total
                        </span>
                        {fmtBRL(cost)}
                      </div>

                      {/* Custo Produção % */}
                      <div>
                        <span className="lg:hidden text-[10px] font-headline uppercase tracking-widest text-on-surface-variant block mb-1">
                          Custo Prod. (%)
                        </span>
                        <input
                          type="number"
                          placeholder="0"
                          min="0"
                          step="0.01"
                          value={row.custoProd}
                          onChange={(e) => updatePricingField(row.id, 'custoProd', e.target.value)}
                          className="w-full bg-surface-container-high text-on-surface px-3 py-2 text-sm font-mono placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      {/* Impostos % */}
                      <div>
                        <span className="lg:hidden text-[10px] font-headline uppercase tracking-widest text-on-surface-variant block mb-1">
                          Impostos (%)
                        </span>
                        <input
                          type="number"
                          placeholder="0"
                          min="0"
                          step="0.01"
                          value={row.impostos}
                          onChange={(e) => updatePricingField(row.id, 'impostos', e.target.value)}
                          className="w-full bg-surface-container-high text-on-surface px-3 py-2 text-sm font-mono placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      {/* Lucro % */}
                      <div>
                        <span className="lg:hidden text-[10px] font-headline uppercase tracking-widest text-on-surface-variant block mb-1">
                          Lucro (%)
                        </span>
                        <input
                          type="number"
                          placeholder="0"
                          min="0"
                          step="0.01"
                          value={row.lucro}
                          onChange={(e) => updatePricingField(row.id, 'lucro', e.target.value)}
                          className="w-full bg-surface-container-high text-on-surface px-3 py-2 text-sm font-mono placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      {/* Preço Sugerido (next to delete button) */}
                      <div className="bg-primary-container/10 px-3 py-2 text-sm font-mono font-bold text-primary border-l-2 border-primary-container">
                        <span className="lg:hidden text-[10px] font-headline uppercase tracking-widest text-on-surface-variant block mb-1">
                          Preço Sugerido
                        </span>
                        {fmtBRL(suggestedPrice)}
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => deletePricingRow(row.id)}
                        className="p-2 text-error hover:bg-error/10 transition-colors justify-self-center"
                        title="Remover linha"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  )
                })}

                {/* Add pricing row - always at the bottom */}
                <button
                  onClick={addPricingRow}
                  className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-outline-variant/30 text-primary font-headline font-bold uppercase text-xs tracking-widest hover:bg-surface-container-high/50 transition-colors mt-2"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Adicionar Linha
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
