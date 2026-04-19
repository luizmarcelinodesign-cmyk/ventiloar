import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DataManager from '../components/DataManager'
import AuditLog from '../components/AuditLog'
import SyncStatus from '../components/SyncStatus'
import LeadsManager from '../components/LeadsManager'

const ADM_CODE = import.meta.env.VITE_ADM_CODE || ''
const AUTH_KEY = 'ventiloar-adm-auth'

export function isAdmAuthenticated() {
  return sessionStorage.getItem(AUTH_KEY) === 'true'
}

export function AdmGuard({ children }) {
  const navigate = useNavigate()
  useEffect(() => {
    if (!isAdmAuthenticated()) {
      navigate('/adm', { replace: true })
    }
  }, [navigate])
  return isAdmAuthenticated() ? children : null
}

export default function Adm() {
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)
  const [authenticated, setAuthenticated] = useState(isAdmAuthenticated())
  const [activeTab, setActiveTab] = useState('overview') // overview, dashboard, engenharia, leads, data, audit

  const handleSubmit = (e) => {
    e.preventDefault()
    if (code === ADM_CODE) {
      sessionStorage.setItem(AUTH_KEY, 'true')
      setAuthenticated(true)
      setError(false)
    } else {
      setError(true)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem(AUTH_KEY)
    setAuthenticated(false)
    setCode('')
    setActiveTab('overview')
  }

  return (
    <main className="relative min-h-screen">
      <div className="absolute inset-0 technical-grid opacity-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-8 py-16 md:py-20 relative z-10">
        {/* Header */}
        <header className="mb-12 md:mb-16">
          <div className="flex items-baseline gap-4 mb-2">
            <span className="text-primary-container font-headline font-bold text-sm tracking-[0.2em] uppercase">
              Área Restrita
            </span>
            <div className="h-[1px] flex-grow bg-outline-variant opacity-20" />
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-headline font-bold uppercase tracking-tighter leading-none mb-4">
            Painel<br />Administrativo
          </h1>
          <div className="w-24 h-1 bg-primary-container mt-4 mb-6" />
        </header>

        {!authenticated ? (
          /* ======== LOGIN FORM ======== */
          <div className="max-w-md mx-auto">
            <div className="bg-surface-container-low p-8 md:p-10">
              <div className="flex items-center gap-3 mb-8">
                <span className="material-symbols-outlined text-primary-container text-2xl">lock</span>
                <h2 className="font-headline font-bold uppercase text-sm tracking-[0.2em] text-on-surface">
                  Acesso Restrito
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-headline uppercase tracking-widest text-on-surface-variant mb-2">
                    Código de Acesso
                  </label>
                  <input
                    type="password"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value)
                      setError(false)
                    }}
                    placeholder="Digite o código"
                    className="w-full bg-surface-container-high text-on-surface px-4 py-3 text-sm font-mono placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary-container"
                    autoFocus
                  />
                  {error && (
                    <p className="mt-2 text-sm text-error flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">error</span>
                      Código incorreto
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary-container text-on-primary-container py-3 font-headline font-bold uppercase text-xs tracking-widest hover:bg-primary transition-colors"
                >
                  Entrar
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* ======== AUTHENTICATED PANEL ======== */
          <div className="space-y-6">
            {/* Sync Status Component */}
            <SyncStatus />

            {/* Tabs Navigation */}
            <div className="flex flex-wrap gap-2 md:gap-0 md:overflow-x-auto md:border-b md:border-outline-variant">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-3 flex items-center gap-2 border-b-2 transition-colors font-headline text-sm uppercase tracking-widest ${
                  activeTab === 'overview'
                    ? 'border-primary-container text-primary-container'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-base">home</span>
                Painel
              </button>

              <Link
                to="/dashboard"
                onClick={(e) => {
                  if (e.ctrlKey || e.metaKey) return // Permite abrir em nova aba
                  e.preventDefault()
                  setActiveTab('dashboard')
                }}
                className={`px-4 py-3 flex items-center gap-2 border-b-2 transition-colors font-headline text-sm uppercase tracking-widest ${
                  activeTab === 'dashboard'
                    ? 'border-primary-container text-primary-container'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-base">dashboard</span>
                Dashboard
              </Link>

              <Link
                to="/engenharia"
                onClick={(e) => {
                  if (e.ctrlKey || e.metaKey) return
                  e.preventDefault()
                  setActiveTab('engenharia')
                }}
                className={`px-4 py-3 flex items-center gap-2 border-b-2 transition-colors font-headline text-sm uppercase tracking-widest ${
                  activeTab === 'engenharia'
                    ? 'border-primary-container text-primary-container'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-base">precision_manufacturing</span>
                Engenharia
              </Link>

              <button
                onClick={() => setActiveTab('leads')}
                className={`px-4 py-3 flex items-center gap-2 border-b-2 transition-colors font-headline text-sm uppercase tracking-widest ${
                  activeTab === 'leads'
                    ? 'border-primary-container text-primary-container'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-base">group</span>
                Leads
              </button>

              <button
                onClick={() => setActiveTab('data')}
                className={`px-4 py-3 flex items-center gap-2 border-b-2 transition-colors font-headline text-sm uppercase tracking-widest ${
                  activeTab === 'data'
                    ? 'border-primary-container text-primary-container'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-base">data_object</span>
                Dados
              </button>

              <button
                onClick={() => setActiveTab('audit')}
                className={`px-4 py-3 flex items-center gap-2 border-b-2 transition-colors font-headline text-sm uppercase tracking-widest ${
                  activeTab === 'audit'
                    ? 'border-primary-container text-primary-container'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-base">history</span>
                Auditoria
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Dashboard Card */}
                  <div
                    onClick={() => setActiveTab('dashboard')}
                    className="group cursor-pointer bg-surface-container-low p-8 border-l-4 border-primary-container hover:bg-surface-container-high transition-colors"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <span className="material-symbols-outlined text-primary-container text-3xl">dashboard</span>
                      <h3 className="font-headline font-bold uppercase text-lg tracking-widest text-on-surface group-hover:text-primary-container transition-colors">
                        Dashboard
                      </h3>
                    </div>
                    <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                      Prestação de contas financeira — entradas, saídas, rendimentos e conciliação do projeto FUNCAP.
                    </p>
                    <div className="flex items-center gap-2 text-primary-container text-xs font-headline font-bold uppercase tracking-widest">
                      Acessar
                      <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </div>
                  </div>

                  {/* Engenharia Card */}
                  <div
                    onClick={() => setActiveTab('engenharia')}
                    className="group cursor-pointer bg-surface-container-low p-8 border-l-4 border-tertiary-container hover:bg-surface-container-high transition-colors"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <span className="material-symbols-outlined text-tertiary-container text-3xl">precision_manufacturing</span>
                      <h3 className="font-headline font-bold uppercase text-lg tracking-widest text-on-surface group-hover:text-tertiary-container transition-colors">
                        Engenharia
                      </h3>
                    </div>
                    <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                      Lista de compras, engenharia de produto e precificação — gestão completa da produção.
                    </p>
                    <div className="flex items-center gap-2 text-tertiary-container text-xs font-headline font-bold uppercase tracking-widest">
                      Acessar
                      <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </div>
                  </div>

                  {/* Data Manager Card */}
                  <div
                    onClick={() => setActiveTab('data')}
                    className="group cursor-pointer bg-surface-container-low p-8 border-l-4 border-secondary-container hover:bg-surface-container-high transition-colors"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <span className="material-symbols-outlined text-secondary-container text-3xl">data_object</span>
                      <h3 className="font-headline font-bold uppercase text-lg tracking-widest text-on-surface group-hover:text-secondary-container transition-colors">
                        Gerenciar Dados
                      </h3>
                    </div>
                    <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                      Crie, edite e delete documentos. Exporte/importe dados, sincronize databases.
                    </p>
                    <div className="flex items-center gap-2 text-secondary-container text-xs font-headline font-bold uppercase tracking-widest">
                      Acessar
                      <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </div>
                  </div>

                  {/* Leads Card */}
                  <div
                    onClick={() => setActiveTab('leads')}
                    className="group cursor-pointer bg-surface-container-low p-8 border-l-4 border-primary hover:bg-surface-container-high transition-colors"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <span className="material-symbols-outlined text-primary text-3xl">group</span>
                      <h3 className="font-headline font-bold uppercase text-lg tracking-widest text-on-surface group-hover:text-primary transition-colors">
                        Leads
                      </h3>
                    </div>
                    <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                      Visualize e acompanhe os contatos recebidos pelo formulário de orçamento, com atualização de status.
                    </p>
                    <div className="flex items-center gap-2 text-primary text-xs font-headline font-bold uppercase tracking-widest">
                      Acessar
                      <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </div>
                  </div>

                  {/* Audit Log Card */}
                  <div
                    onClick={() => setActiveTab('audit')}
                    className="group cursor-pointer bg-surface-container-low p-8 border-l-4 border-error hover:bg-surface-container-high transition-colors"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <span className="material-symbols-outlined text-error text-3xl">history</span>
                      <h3 className="font-headline font-bold uppercase text-lg tracking-widest text-on-surface group-hover:text-error transition-colors">
                        Histórico
                      </h3>
                    </div>
                    <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                      Visualize todas as ações realizadas: criar, editar, deletar. Com filtros por usuário, data.
                    </p>
                    <div className="flex items-center gap-2 text-error text-xs font-headline font-bold uppercase tracking-widest">
                      Acessar
                      <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'leads' && <LeadsManager />}
            {activeTab === 'data' && <DataManager />}
            {activeTab === 'audit' && <AuditLog />}

            {/* Logout Button - Always visible */}
            <div className="flex justify-end pt-6 border-t border-outline-variant">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-5 py-3 bg-surface-container-high text-on-surface-variant font-headline font-bold uppercase text-xs tracking-widest hover:bg-error hover:text-on-error transition-colors"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
                Sair do ADM
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
