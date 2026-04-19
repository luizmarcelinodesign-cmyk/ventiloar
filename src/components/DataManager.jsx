import { useState, useEffect, useCallback } from 'react'
import {
  listDocuments,
  addDocument,
  updateDocument,
  deleteDocument,
  exportCollection,
  exportAll,
  importData,
  STORES,
} from '../services/storageService'

const fmtBRL = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = (dateStr) => new Date(dateStr).toLocaleString('pt-BR')

const COLLECTIONS_CONFIG = {
  shopping_list: {
    label: 'Lista de Compras',
    icon: 'shopping_cart',
    color: 'primary',
    fields: [
      { name: 'item', label: 'Item', type: 'text', required: true },
      { name: 'qty', label: 'Quantidade', type: 'number' },
      { name: 'unit', label: 'Unidade', type: 'text' },
      { name: 'unitPrice', label: 'Preço Unitário (R$)', type: 'number' },
      { name: 'supplier', label: 'Fornecedor', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Pendente', 'Encomendado', 'Recebido'] },
    ],
  },
  products: {
    label: 'Produtos/Peças',
    icon: 'precision_manufacturing',
    color: 'tertiary',
    fields: [
      { name: 'name', label: 'Nome', type: 'text', required: true },
      { name: 'model', label: 'Modelo', type: 'text' },
      { name: 'description', label: 'Descrição', type: 'textarea' },
      { name: 'status', label: 'Status', type: 'select', options: ['Ativo', 'Inativo', 'Descontinuado'] },
    ],
  },
  pricing: {
    label: 'Precificação',
    icon: 'sell',
    color: 'secondary',
    fields: [
      { name: 'productId', label: 'Produto', type: 'text', required: true },
      { name: 'costPrice', label: 'Preço de Custo (R$)', type: 'number' },
      { name: 'salePrice', label: 'Preço de Venda (R$)', type: 'number' },
      { name: 'margin', label: 'Margem (%)', type: 'number' },
      { name: 'currency', label: 'Moeda', type: 'select', options: ['BRL', 'USD'] },
    ],
  },
  budgets: {
    label: 'Orçamentos',
    icon: 'description',
    color: 'success',
    fields: [
      { name: 'clientName', label: 'Cliente', type: 'text', required: true },
      { name: 'clientEmail', label: 'Email', type: 'email' },
      { name: 'clientPhone', label: 'Telefone', type: 'text' },
      { name: 'totalValue', label: 'Valor Total (R$)', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', options: ['Novo', 'Enviado', 'Aprovado', 'Rejeitado'] },
    ],
  },
  financial_data: {
    label: 'Dados Financeiros',
    icon: 'account_balance',
    color: 'warning',
    fields: [
      { name: 'description', label: 'Descrição', type: 'text', required: true },
      { name: 'type', label: 'Tipo', type: 'select', options: ['Entrada', 'Saída', 'Rendimento'] },
      { name: 'amount', label: 'Valor (R$)', type: 'number' },
      { name: 'date', label: 'Data', type: 'date' },
      { name: 'category', label: 'Categoria', type: 'text' },
    ],
  },
}

export default function DataManager() {
  const [selectedCollection, setSelectedCollection] = useState('shopping_list')
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [newForm, setNewForm] = useState({})
  const [showNewForm, setShowNewForm] = useState(false)
  const [message, setMessage] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const currentConfig = COLLECTIONS_CONFIG[selectedCollection]

  // Carrega documentos quando muda a coleção
  useEffect(() => {
    loadDocuments()
  }, [selectedCollection])

  const loadDocuments = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listDocuments(selectedCollection)
      setDocuments(data)
      setEditingId(null)
      setShowNewForm(false)
    } catch (err) {
      showMessage('Erro ao carregar documentos: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [selectedCollection])

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleAddDocument = async (e) => {
    e.preventDefault()
    try {
      await addDocument(selectedCollection, newForm, 'admin')
      showMessage('✅ Documento criado com sucesso!')
      setNewForm({})
      setShowNewForm(false)
      await loadDocuments()
    } catch (err) {
      showMessage('Erro: ' + err.message, 'error')
    }
  }

  const handleUpdateDocument = async (e) => {
    e.preventDefault()
    if (!editingId) return
    try {
      await updateDocument(selectedCollection, editingId, editForm, 'admin')
      showMessage('✅ Documento atualizado com sucesso!')
      setEditingId(null)
      setEditForm({})
      await loadDocuments()
    } catch (err) {
      showMessage('Erro: ' + err.message, 'error')
    }
  }

  const handleDeleteDocument = async (id) => {
    if (!window.confirm('Tem certeza que deseja deletar este documento?')) return
    try {
      await deleteDocument(selectedCollection, id, 'admin')
      showMessage('✅ Documento deletado com sucesso!')
      await loadDocuments()
    } catch (err) {
      showMessage('Erro: ' + err.message, 'error')
    }
  }

  const handleExportCollection = async () => {
    try {
      const json = await exportCollection(selectedCollection)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${selectedCollection}-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      showMessage('✅ Coleção exportada!')
    } catch (err) {
      showMessage('Erro ao exportar: ' + err.message, 'error')
    }
  }

  const handleExportAll = async () => {
    try {
      const json = await exportAll()
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ventiloar-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      showMessage('✅ Backup completo exportado!')
    } catch (err) {
      showMessage('Erro ao exportar: ' + err.message, 'error')
    }
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      if (!window.confirm('Importar dados? Isso pode sobrescrever dados existentes.')) return

      await importData(text, 'admin')
      showMessage('✅ Dados importados com sucesso!')
      await loadDocuments()
    } catch (err) {
      showMessage('Erro ao importar: ' + err.message, 'error')
    }
  }

  const startEdit = (doc) => {
    setEditingId(doc.id)
    setEditForm({ ...doc })
  }

  const filteredDocuments = documents.filter((doc) => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return JSON.stringify(doc).toLowerCase().includes(searchLower)
  })

  const renderFieldInput = (field, value, onChange, prefix = '') => {
    const fieldName = prefix + field.name
    const fieldValue = value[field.name] || ''

    switch (field.type) {
      case 'email':
        return (
          <input
            type="email"
            value={fieldValue}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.label}
            className="w-full bg-surface-container-high text-on-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
          />
        )
      case 'number':
        return (
          <input
            type="number"
            step="0.01"
            value={fieldValue}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.label}
            className="w-full bg-surface-container-high text-on-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
          />
        )
      case 'date':
        return (
          <input
            type="date"
            value={fieldValue}
            onChange={(e) => onChange(field.name, e.target.value)}
            className="w-full bg-surface-container-high text-on-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
          />
        )
      case 'textarea':
        return (
          <textarea
            value={fieldValue}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.label}
            rows={3}
            className="w-full bg-surface-container-high text-on-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
          />
        )
      case 'select':
        return (
          <select
            value={fieldValue}
            onChange={(e) => onChange(field.name, e.target.value)}
            className="w-full bg-surface-container-high text-on-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
          >
            <option value="">-- Selecione --</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        )
      default:
        return (
          <input
            type="text"
            value={fieldValue}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.label}
            className="w-full bg-surface-container-high text-on-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
          />
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-on-surface-variant">
        <span className="material-symbols-outlined text-base">data_object</span>
        <span>Gerenciador de Dados</span>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 flex items-center gap-3 ${message.type === 'error' ? 'bg-error/10 text-error' : 'bg-green-100 text-green-800'}`}>
          <span className="material-symbols-outlined">{message.type === 'error' ? 'error' : 'check_circle'}</span>
          {message.text}
        </div>
      )}

      {/* Tabs de Coleções */}
      <div className="flex flex-wrap gap-2 border-b border-outline-variant">
        {Object.entries(COLLECTIONS_CONFIG).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setSelectedCollection(key)}
            className={`px-4 py-3 flex items-center gap-2 border-b-2 transition-colors font-headline text-sm uppercase tracking-widest ${
              selectedCollection === key
                ? 'border-primary-container text-primary-container'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-base">{config.icon}</span>
            {config.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-surface-container-low p-4 space-y-3 md:space-y-0 md:flex md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2 max-w-md">
          <span className="material-symbols-outlined text-on-surface-variant">search</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar..."
            className="flex-1 bg-surface-container-highest text-on-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
          />
        </div>

        <div className="flex gap-2 flex-wrap md:flex-nowrap">
          <button
            onClick={handleExportCollection}
            className="flex items-center gap-2 px-3 py-2 bg-surface-container-high text-on-surface text-xs font-headline uppercase tracking-widest hover:bg-outline-variant transition-colors"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Exportar
          </button>

          <button
            onClick={handleExportAll}
            className="flex items-center gap-2 px-3 py-2 bg-surface-container-high text-on-surface text-xs font-headline uppercase tracking-widest hover:bg-outline-variant transition-colors"
          >
            <span className="material-symbols-outlined text-sm">backup</span>
            Backup
          </button>

          <label className="flex items-center gap-2 px-3 py-2 bg-surface-container-high text-on-surface text-xs font-headline uppercase tracking-widest hover:bg-outline-variant transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-sm">upload</span>
            Importar
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>

          <button
            onClick={() => setShowNewForm(!showNewForm)}
            className="flex items-center gap-2 px-3 py-2 bg-primary-container text-on-primary-container text-xs font-headline uppercase tracking-widest hover:bg-primary transition-colors"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Novo
          </button>
        </div>
      </div>

      {/* Novo Documento Form */}
      {showNewForm && (
        <div className="bg-surface-container-low p-6 space-y-4 border-l-4 border-primary-container">
          <h3 className="font-headline font-bold text-lg">Criar novo {currentConfig.label.toLowerCase()}</h3>
          <form onSubmit={handleAddDocument} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentConfig.fields.map((field) => (
              <div key={field.name}>
                <label className="block text-xs font-headline uppercase tracking-widest text-on-surface-variant mb-1">
                  {field.label} {field.required && '*'}
                </label>
                {renderFieldInput(field, newForm, (name, val) => setNewForm({ ...newForm, [name]: val }))}
              </div>
            ))}
            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-primary-container text-on-primary-container py-2 font-headline font-bold uppercase text-xs tracking-widest hover:bg-primary transition-colors"
              >
                Criar
              </button>
              <button
                type="button"
                onClick={() => setShowNewForm(false)}
                className="flex-1 bg-surface-container-high text-on-surface py-2 font-headline font-bold uppercase text-xs tracking-widest hover:bg-outline-variant transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Documentos em Edição */}
      {editingId && (
        <div className="bg-surface-container-low p-6 space-y-4 border-l-4 border-blue-500">
          <h3 className="font-headline font-bold text-lg">Editar documento</h3>
          <form onSubmit={handleUpdateDocument} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentConfig.fields.map((field) => (
              <div key={field.name}>
                <label className="block text-xs font-headline uppercase tracking-widest text-on-surface-variant mb-1">
                  {field.label}
                </label>
                {renderFieldInput(field, editForm, (name, val) => setEditForm({ ...editForm, [name]: val }))}
              </div>
            ))}
            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-blue-500 text-white py-2 font-headline font-bold uppercase text-xs tracking-widest hover:bg-blue-600 transition-colors"
              >
                Atualizar
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingId(null)
                  setEditForm({})
                }}
                className="flex-1 bg-surface-container-high text-on-surface py-2 font-headline font-bold uppercase text-xs tracking-widest hover:bg-outline-variant transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Documentos */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-8 text-on-surface-variant">Carregando...</div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-8 text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl mb-2 block opacity-50">inbox</span>
            <p>Nenhum documento encontrado</p>
          </div>
        ) : (
          filteredDocuments.map((doc) => (
            <div key={doc.id} className="bg-surface-container-low p-4 hover:bg-surface-container-high transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-xs text-primary-container">{doc.id}</span>
                    <span className="text-xs text-on-surface-variant">
                      {doc.createdBy} - {fmtDate(doc.createdAt)}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm">
                    {currentConfig.fields
  .filter((f) => f.type !== 'textarea')
                      .map((field) => {
                        const value = doc[field.name]
                        if (!value) return null
                        return (
                          <div key={field.name} className="text-on-surface-variant">
                            <strong>{field.label}:</strong>{' '}
                            {field.label.includes('R$')
                              ? fmtBRL(value)
                              : typeof value === 'boolean'
                                ? value ? 'Sim' : 'Não'
                                : String(value)}
                          </div>
                        )
                      })}
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap md:flex-nowrap">
                  <button
                    onClick={() => startEdit(doc)}
                    className="px-3 py-2 bg-blue-500 text-white text-xs font-headline uppercase tracking-widest flex items-center gap-1 hover:bg-blue-600 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="px-3 py-2 bg-red-500 text-white text-xs font-headline uppercase tracking-widest flex items-center gap-1 hover:bg-red-600 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                    Deletar
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
