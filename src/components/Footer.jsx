import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-surface-container-lowest w-full border-t border-outline-variant/15">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 px-8 md:px-12 py-16 w-full max-w-7xl mx-auto">
        {/* Brand */}
        <div className="space-y-6">
          <Link to="/" className="text-xl font-bold text-on-surface uppercase font-headline block">
            VENTILOAR
          </Link>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Engenharia de ventilação inteligente e sustentável. Um motor, múltiplas hélices, 80% menos energia.
          </p>
        </div>

        {/* Navigation */}
        <div className="space-y-6">
          <h5 className="font-bold uppercase text-xs font-headline text-primary-container tracking-widest">
            Navegação
          </h5>
          <ul className="space-y-3">
            <li><Link to="/" className="text-on-surface/60 hover:text-primary text-sm transition-all">Início</Link></li>
            <li><Link to="/produto" className="text-on-surface/60 hover:text-primary text-sm transition-all">Produto</Link></li>
            <li><Link to="/loja" className="text-on-surface/60 hover:text-primary text-sm transition-all">Loja</Link></li>
            <li><Link to="/orcamento" className="text-on-surface/60 hover:text-primary text-sm transition-all">Orçamento</Link></li>
          </ul>
        </div>

        {/* Institutional */}
        <div className="space-y-6">
          <h5 className="font-bold uppercase text-xs font-headline text-primary-container tracking-widest">
            Institucional
          </h5>
          <ul className="space-y-3">
            <li><Link to="/quem-somos" className="text-on-surface/60 hover:text-primary text-sm transition-all">Quem Somos</Link></li>
            <li><Link to="/sustentabilidade" className="text-on-surface/60 hover:text-primary text-sm transition-all">Sustentabilidade</Link></li>
            <li><Link to="/parceiros" className="text-on-surface/60 hover:text-primary text-sm transition-all">Parceiros</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div className="space-y-6">
          <h5 className="font-bold uppercase text-xs font-headline text-primary-container tracking-widest">
            Contato
          </h5>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-xs text-primary-container mt-0.5">location_on</span>
              <p className="text-sm text-on-surface-variant">Madalena, Ceará</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-xs text-primary-container mt-0.5">mail</span>
              <p className="text-sm text-on-surface-variant">ventiloar@gmail.com</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 md:px-12 py-8 border-t border-outline-variant/10 text-center">
        <p className="text-[10px] font-label text-on-surface-variant/60 uppercase tracking-[0.2em]">
          © {new Date().getFullYear()} VENTILOAR. TODOS OS DIREITOS RESERVADOS.
        </p>
      </div>
    </footer>
  )
}
