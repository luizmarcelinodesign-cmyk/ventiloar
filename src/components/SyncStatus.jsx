import { useState, useEffect } from 'react'
import { isSupabaseAvailable, isSupabaseConnected, getSupabaseConfigError } from '../services/supabaseClient'
import { listDocuments, STORES } from '../services/storageService'

export default function SyncStatus() {
  const [supabaseConnected, setSupabaseConnected] = useState(false)
  const [checking, setChecking] = useState(false)
  const [counts, setCounts] = useState({})

  const supabaseAvailable = isSupabaseAvailable()
  const configError = getSupabaseConfigError()

  const refreshStatus = async () => {
    setChecking(true)
    try {
      const connected = await isSupabaseConnected()
      setSupabaseConnected(connected)

      if (!connected) {
        setCounts({})
        return
      }

      const tableNames = Object.values(STORES)
      const results = await Promise.all(
        tableNames.map(async (table) => {
          const docs = await listDocuments(table)
          return [table, docs.length]
        })
      )

      setCounts(Object.fromEntries(results))
    } catch (err) {
      console.error('Erro ao verificar status do Supabase:', err)
      setSupabaseConnected(false)
      setCounts({})
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    if (supabaseAvailable) {
      refreshStatus()
    }
  }, [supabaseAvailable])

  if (!supabaseAvailable) {
    return (
      <div className="bg-red-50 text-red-700 p-4 flex items-center justify-between gap-3 text-sm border border-red-200 rounded-sm">
        <div className="flex items-center gap-2">
        <span className="material-symbols-outlined">error</span>
        {configError}
        </div>
      </div>
    )
  }

  return (
    <div className={`p-4 border rounded-sm ${supabaseConnected ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${supabaseConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span className="text-sm font-medium text-slate-800">{supabaseConnected ? 'Supabase conectado' : 'Verifique conexão com Supabase'}</span>
          </div>
        </div>

        <button
          onClick={refreshStatus}
          disabled={checking}
          className="px-3 py-1 bg-blue-500 text-white text-xs font-headline rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">{checking ? 'hourglass_empty' : 'refresh'}</span>
          {checking ? 'Atualizando...' : 'Atualizar status'}
        </button>
      </div>

      {Object.keys(counts).length > 0 && (
        <div className="mt-3 text-xs text-slate-700 grid grid-cols-2 md:grid-cols-5 gap-2">
          {Object.entries(counts).map(([table, count]) => (
            <div key={table} className="bg-white/70 px-2 py-1 border border-slate-200 rounded-sm">
              <span className="font-semibold">{table}</span>: {count}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
