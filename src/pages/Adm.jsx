import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DataManager from '../components/DataManager'
import AuditLog from '../components/AuditLog'
import SyncStatus from '../components/SyncStatus'
import LeadsManager from '../components/LeadsManager'
import PlantaTecnica from '../components/PlantaTecnica'
import RelatorioSistema from '../components/RelatorioSistema'
import PedidosFornecedoras from '../components/PedidosFornecedoras'
import Dashboard from './Dashboard'
import Engenharia from './Engenharia'

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
  const [activeTab, setActiveTab] = useState('overview') // overview, dashboard, engenharia, leads, data, audit, planta, relatorio, pedidos

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

              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-3 flex items-center gap-2 border-b-2 transition-colors font-headline text-sm uppercase tracking-widest ${
                  activeTab === 'dashboard'
                    ? 'border-primary-container text-primary-container'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-base">dashboard</span>
                Dashboard
              </button>

              <button
                onClick={() => setActiveTab('engenharia')}
                className={`px-4 py-3 flex items-center gap-2 border-b-2 transition-colors font-headline text-sm uppercase tracking-widest ${
                  activeTab === 'engenharia'
                    ? 'border-primary-container text-primary-container'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-base">precision_manufacturing</span>
                Engenharia
              </button>

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

              <button
                onClick={() => setActiveTab('planta')}
                className={`px-4 py-3 flex items-center gap-2 border-b-2 transition-colors font-headline text-sm uppercase tracking-widest ${
                  activeTab === 'planta'
                    ? 'border-primary-container text-primary-container'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-base">architecture</span>
                Planta Técnica
              </button>

              <button
                onClick={() => setActiveTab('relatorio')}
                className={`px-4 py-3 flex items-center gap-2 border-b-2 transition-colors font-headline text-sm uppercase tracking-widest ${
                  activeTab === 'relatorio'
                    ? 'border-[#185FA5] text-[#185FA5]'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-base">summarize</span>
                Relatório
              </button>

              <button
                onClick={() => setActiveTab('pedidos')}
                className={`px-4 py-3 flex items-center gap-2 border-b-2 transition-colors font-headline text-sm uppercase tracking-widest ${
                  activeTab === 'pedidos'
                    ? 'border-[#ffb964] text-[#ffb964]'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-base">local_shipping</span>
                Pedidos
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

                  {/* Planta Técnica Card */}
                  <div
                    onClick={() => setActiveTab('planta')}
                    className="group cursor-pointer bg-surface-container-low p-8 border-l-4 border-[#534AB7] hover:bg-surface-container-high transition-colors"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <span className="material-symbols-outlined text-[#AFA9EC] text-3xl">architecture</span>
                      <h3 className="font-headline font-bold uppercase text-lg tracking-widest text-on-surface group-hover:text-[#AFA9EC] transition-colors">
                        Planta Técnica
                      </h3>
                    </div>
                    <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                      Distribua hélices, entradas, saídas e colunas no ambiente e gere planta técnica de ventilação.
                    </p>
                    <div className="flex items-center gap-2 text-[#AFA9EC] text-xs font-headline font-bold uppercase tracking-widest">
                      Acessar
                      <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </div>
                  </div>

                  {/* Relatório do Sistema Card */}
                  <div
                    onClick={() => setActiveTab('relatorio')}
                    className="group cursor-pointer bg-surface-container-low p-8 border-l-4 border-[#185FA5] hover:bg-surface-container-high transition-colors"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <span className="material-symbols-outlined text-[#4FC3F7] text-3xl">summarize</span>
                      <h3 className="font-headline font-bold uppercase text-lg tracking-widest text-on-surface group-hover:text-[#4FC3F7] transition-colors">
                        Relatório do Sistema
                      </h3>
                    </div>
                    <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                      Relatório consolidado de todos os módulos — financeiro, engenharia, leads e plantas. Exportável em PDF.
                    </p>
                    <div className="flex items-center gap-2 text-[#4FC3F7] text-xs font-headline font-bold uppercase tracking-widest">
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

                  {/* Pedidos Card */}
                  <div
                    onClick={() => setActiveTab('pedidos')}
                    className="group cursor-pointer bg-surface-container-low p-8 border-l-4 border-tertiary hover:bg-surface-container-high transition-colors"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <span className="material-symbols-outlined text-tertiary text-3xl">local_shipping</span>
                      <h3 className="font-headline font-bold uppercase text-lg tracking-widest text-on-surface group-hover:text-tertiary transition-colors">
                        Pedidos Fornecedoras
                      </h3>
                    </div>
                    <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                      Gerencie fornecedoras homologadas, filtre produtos/cabos por fornecedora e gere pedidos de compras profissionais em PDF.
                    </p>
                    <div className="flex items-center gap-2 text-tertiary text-xs font-headline font-bold uppercase tracking-widest">
                      Acessar
                      <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'engenharia' && <Engenharia />}
            {activeTab === 'leads' && <LeadsManager />}
            {activeTab === 'data' && <DataManager />}
            {activeTab === 'audit' && <AuditLog />}
            {activeTab === 'planta' && <PlantaTecnica />}
            {activeTab === 'relatorio' && <RelatorioSistema />}
            {activeTab === 'pedidos' && <PedidosFornecedoras />}

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
