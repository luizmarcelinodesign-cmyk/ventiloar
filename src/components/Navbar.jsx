import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { label: 'Início', path: '/' },
  { label: 'Produto', path: '/produto' },
  { label: 'Loja', path: '/loja' },
  { label: 'Orçamento', path: '/orcamento' },
  { label: 'Quem Somos', path: '/quem-somos' },
  { label: 'Sustentabilidade', path: '/sustentabilidade' },
  { label: 'Parceiros', path: '/parceiros' },
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Engenharia', path: '/engenharia' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  return (
    <nav className="bg-background/60 backdrop-blur-xl sticky top-0 z-50 w-full shadow-[0_40px_60px_-15px_rgba(223,226,235,0.06)]">
      <div className="flex justify-between items-center w-full px-6 md:px-8 py-4 max-w-7xl mx-auto">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold uppercase text-on-surface tracking-tighter font-headline">
          VENTILOAR
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-8">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`font-label uppercase tracking-wider text-sm transition-colors ${
                  active
                    ? 'text-primary-container border-b-2 border-primary-container pb-1 font-bold'
                    : 'text-on-surface hover:text-primary'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </div>

        {/* CTA + Mobile toggle */}
        <div className="flex items-center gap-4">
          <Link
            to="/orcamento"
            className="hidden sm:block bg-tertiary-container text-on-tertiary px-6 py-2 rounded-sm font-label font-bold uppercase tracking-widest text-xs hover:bg-tertiary transition-all active:scale-95 duration-150"
          >
            Solicitar Orçamento
          </Link>

          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden text-on-surface p-1"
            aria-label="Menu"
          >
            <span className="material-symbols-outlined text-2xl">
              {open ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="lg:hidden bg-surface-container-low border-t border-outline-variant/10 px-6 pb-6">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={`block py-3 font-label uppercase tracking-wider text-sm border-b border-outline-variant/10 ${
                  active ? 'text-primary-container font-bold' : 'text-on-surface'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
          <Link
            to="/orcamento"
            onClick={() => setOpen(false)}
            className="mt-4 block text-center bg-tertiary-container text-on-tertiary px-6 py-3 rounded-sm font-label font-bold uppercase tracking-widest text-xs"
          >
            Solicitar Orçamento
          </Link>
        </div>
      )}
    </nav>
  )
}
