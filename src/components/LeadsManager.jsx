import { useCallback, useEffect, useMemo, useState } from 'react'
import { listDocuments, updateDocument } from '../services/storageService'

const STATUS_OPTIONS = ['Novo', 'Simulado', 'Solicitado', 'Em Atendimento', 'Fechado', 'Perdido']

const fmtDateTime = (v) => {
  if (!v) return '-'
  return new Date(v).toLocaleString('pt-BR')
}

const fmtBRL = (v) => {
  if (v === null || v === undefined || v === '') return '-'
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function LeadsManager() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [message, setMessage] = useState(null)

  const loadLeads = useCallback(async () => {
    setLoading(true)
    try {
      const docs = await listDocuments('budgets')
      setLeads(docs)
    } catch (err) {
      setMessage({ type: 'error', text: `Erro ao carregar leads: ${err.message}` })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadLeads()
  }, [loadLeads])

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const byStatus = statusFilter === 'Todos' || (lead.status || 'Novo') === statusFilter
      const q = search.toLowerCase()
      const bySearch =
        !q ||
        String(lead.clientName || '').toLowerCase().includes(q) ||
        String(lead.clientEmail || '').toLowerCase().includes(q) ||
        String(lead.clientPhone || '').toLowerCase().includes(q) ||
        String(lead.simulacao?.tipoEspaco || '').toLowerCase().includes(q)

      return byStatus && bySearch
    })
  }, [leads, search, statusFilter])

  async function handleStatusChange(lead, newStatus) {
    try {
      await updateDocument('budgets', lead.id, { status: newStatus }, 'admin')
      setLeads((prev) => prev.map((item) => (item.id === lead.id ? { ...item, status: newStatus } : item)))
      setMessage({ type: 'success', text: 'Status do lead atualizado com sucesso.' })
    } catch (err) {
      setMessage({ type: 'error', text: `Erro ao atualizar status: ${err.message}` })
    }
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-3 text-sm border ${message.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-surface-container-low p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, email, telefone ou tipo de espaço"
          className="md:col-span-2 bg-surface-container-high text-on-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-surface-container-high text-on-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
        >
          <option value="Todos">Todos os status</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-sm text-on-surface-variant">Carregando leads...</div>
      ) : filteredLeads.length === 0 ? (
        <div className="bg-surface-container-low p-8 text-center text-on-surface-variant">Nenhum lead encontrado.</div>
      ) : (
        <div className="space-y-3">
          {filteredLeads.map((lead) => (
            <article key={lead.id} className="bg-surface-container-low p-4 border border-outline-variant/20">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="space-y-2">
                  <h3 className="text-base font-headline font-bold uppercase tracking-wider text-on-surface">
                    {lead.clientName || 'Sem nome'}
                  </h3>

                  <div className="text-sm text-on-surface-variant space-y-1">
                    <div>Email: {lead.clientEmail || '-'}</div>
                    <div>Telefone: {lead.clientPhone || '-'}</div>
                    <div>Tipo de Espaço: {lead.simulacao?.tipoEspaco || '-'}</div>
                    <div>Endereço: {lead.simulacao?.endereco || '-'}</div>
                    <div>Recebido em: {fmtDateTime(lead.createdAt)}</div>
                    <div>Valor estimado: {fmtBRL(lead.totalValue)}</div>
                  </div>
                </div>

                <div className="min-w-[220px]">
                  <label className="block text-[10px] font-headline uppercase tracking-widest text-on-surface-variant mb-1">
                    Status do Lead
                  </label>
                  <select
                    value={lead.status || 'Novo'}
                    onChange={(e) => handleStatusChange(lead, e.target.value)}
                    className="w-full bg-surface-container-high text-on-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
