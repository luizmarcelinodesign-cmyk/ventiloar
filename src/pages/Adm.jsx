import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const ADM_CODE = '123456'
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
          <div className="space-y-8">
            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dashboard Card */}
              <Link
                to="/dashboard"
                className="group bg-surface-container-low p-8 border-l-4 border-primary-container hover:bg-surface-container-high transition-colors"
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
              </Link>

              {/* Engenharia Card */}
              <Link
                to="/engenharia"
                className="group bg-surface-container-low p-8 border-l-4 border-tertiary-container hover:bg-surface-container-high transition-colors"
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
              </Link>
            </div>

            {/* Logout */}
            <div className="flex justify-end">
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
