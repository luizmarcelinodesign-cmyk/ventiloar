import { useState, useEffect } from 'react'
import {
  getAuditLog,
  getUserActivity,
  getCollectionHistory,
  getAuditStats,
  getActivitySummary,
  exportAuditLog,
} from '../services/auditService'

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleString('pt-BR')
}

const getActionColor = (action) => {
  switch (action) {
    case 'CREATE':
      return 'bg-green-100 text-green-800'
    case 'UPDATE':
      return 'bg-blue-100 text-blue-800'
    case 'DELETE':
      return 'bg-red-100 text-red-800'
    case 'REPLACE_COLLECTION':
      return 'bg-purple-100 text-purple-800'
    case 'IMPORT_DATA':
      return 'bg-orange-100 text-orange-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getActionIcon = (action) => {
  switch (action) {
    case 'CREATE':
      return 'add_circle'
    case 'UPDATE':
      return 'edit'
    case 'DELETE':
      return 'delete'
    case 'REPLACE_COLLECTION':
      return 'upload'
    case 'IMPORT_DATA':
      return 'cloud_download'
    default:
      return 'info'
  }
}

export default function AuditLog() {
  const [filter, setFilter] = useState('all') // all, user, collection, action
  const [filterValue, setFilterValue] = useState('')
  const [entries, setEntries] = useState([])
  const [stats, setStats] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    loadAuditData()
  }, [filter, filterValue, dateRange])

  async function loadAuditData() {
    const filters = {
      fromDate: `${dateRange.from}T00:00:00`,
      toDate: `${dateRange.to}T23:59:59`,
    }

    let data = []

    try {
      switch (filter) {
        case 'all':
          data = await getAuditLog(filters)
          break
        case 'user':
          if (filterValue) {
            data = await getUserActivity(filterValue, 500)
          }
          break
        case 'collection':
          if (filterValue) {
            data = await getCollectionHistory(filterValue, 500)
          }
          break
        default:
          data = await getAuditLog(filters)
      }

      setEntries(data)
      setStats(await getAuditStats())
    } catch (err) {
      console.error('Erro carregando auditoria:', err)
      setEntries([])
      setStats(null)
    }
  }

  async function handleExport() {
    const json = await exportAuditLog()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-surface-container-low p-4 border-l-4 border-primary-container">
            <div className="text-2xl font-bold text-primary-container">{stats.totalEntries}</div>
            <div className="text-xs text-on-surface-variant uppercase tracking-widest font-headline">Total de Ações</div>
          </div>
          <div className="bg-surface-container-low p-4 border-l-4 border-green-500">
            <div className="text-2xl font-bold text-green-500">{stats.actionCounts.CREATE}</div>
            <div className="text-xs text-on-surface-variant uppercase tracking-widest font-headline">Criações</div>
          </div>
          <div className="bg-surface-container-low p-4 border-l-4 border-blue-500">
            <div className="text-2xl font-bold text-blue-500">{stats.actionCounts.UPDATE}</div>
            <div className="text-xs text-on-surface-variant uppercase tracking-widest font-headline">Atualizações</div>
          </div>
          <div className="bg-surface-container-low p-4 border-l-4 border-red-500">
            <div className="text-2xl font-bold text-red-500">{stats.actionCounts.DELETE}</div>
            <div className="text-xs text-on-surface-variant uppercase tracking-widest font-headline">Exclusões</div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-surface-container-low p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tipo de Filtro */}
          <div>
            <label className="block text-xs font-headline uppercase tracking-widest text-on-surface-variant mb-2">
              Filtrar por
            </label>
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value)
                setFilterValue('')
              }}
              className="w-full bg-surface-container-high text-on-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
            >
              <option value="all">Todas as Ações</option>
              <option value="user">Por Usuário</option>
              <option value="collection">Por Coleção</option>
            </select>
          </div>

          {/* Valor do Filtro */}
          {filter !== 'all' && (
            <div>
              <label className="block text-xs font-headline uppercase tracking-widest text-on-surface-variant mb-2">
                {filter === 'user' ? 'Usuário' : 'Coleção'}
              </label>
              <input
                type="text"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                placeholder={filter === 'user' ? 'Ex: admin' : 'Ex: shopping_list'}
                className="w-full bg-surface-container-high text-on-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
              />
            </div>
          )}

          {/* Data Inicial */}
          <div>
            <label className="block text-xs font-headline uppercase tracking-widest text-on-surface-variant mb-2">
              De
            </label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="w-full bg-surface-container-high text-on-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
            />
          </div>
        </div>

        {/* Data Final e Exportar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-headline uppercase tracking-widest text-on-surface-variant mb-2">
              Até
            </label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="w-full bg-surface-container-high text-on-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleExport}
              className="w-full flex items-center justify-center gap-2 bg-primary-container text-on-primary-container py-2 font-headline font-bold uppercase text-xs tracking-widest hover:bg-primary transition-colors"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Exportar Relatório
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Entradas */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {entries.length === 0 ? (
          <div className="text-center py-8 text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl mb-2 block opacity-50">history</span>
            <p>Nenhuma ação encontrada</p>
          </div>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="bg-surface-container-low border-l-4 border-outline-variant">
              {/* Header */}
              <button
                onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                className="w-full p-4 hover:bg-surface-container-high transition-colors text-left flex items-start justify-between"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`material-symbols-outlined text-sm ${getActionColor(entry.action)} px-2 py-1 rounded`}>
                      {getActionIcon(entry.action)}
                    </span>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${getActionColor(entry.action)}`}>
                      {entry.action}
                    </span>
                    <span className="text-xs text-on-surface-variant font-mono">{entry.collection}</span>
                    {entry.documentId && <span className="text-xs text-primary-container font-mono truncate">#{entry.documentId}</span>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-on-surface-variant">
                    <div>
                      <strong>Usuário:</strong> {entry.userId}
                    </div>
                    <div>
                      <strong>Data:</strong> {formatDate(entry.timestamp)}
                    </div>
                    {entry.changes && (
                      <div>
                        <strong>Campos alterados:</strong> {Object.keys(entry.changes).length}
                      </div>
                    )}
                  </div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant ml-4 flex-shrink-0">
                  {expandedId === entry.id ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {/* Expandido */}
              {expandedId === entry.id && (
                <div className="border-t border-outline-variant p-4 bg-surface-container-high space-y-4 text-sm">
                  {/* Mudanças */}
                  {entry.changes && (
                    <div>
                      <h4 className="font-bold text-on-surface mb-2">📝 Campos Alterados:</h4>
                      <div className="space-y-2 ml-4">
                        {Object.entries(entry.changes).map(([field, change]) => (
                          <div key={field} className="font-mono text-xs bg-surface-container p-2">
                            <div className="text-on-surface-variant mb-1">{field}:</div>
                            <div className="text-error">❌ {JSON.stringify(change.from)}</div>
                            <div className="text-green-600">✅ {JSON.stringify(change.to)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dados Antigos */}
                  {entry.oldData && entry.action !== 'CREATE' && (
                    <div>
                      <h4 className="font-bold text-on-surface mb-2">📋 Dados Anteriores:</h4>
                      <pre className="bg-surface-container p-2 overflow-x-auto text-xs text-on-surface-variant">{JSON.stringify(entry.oldData, null, 2)}</pre>
                    </div>
                  )}

                  {/* Dados Novos */}
                  {entry.newData && entry.action !== 'DELETE' && (
                    <div>
                      <h4 className="font-bold text-on-surface mb-2">✨ Dados Novos:</h4>
                      <pre className="bg-surface-container p-2 overflow-x-auto text-xs text-on-surface-variant">{JSON.stringify(entry.newData, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
