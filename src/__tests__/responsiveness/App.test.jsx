/**
 * ===================================================================
 * TESTES DE RESPONSIVIDADE - App (Rotas e Layout)
 * ===================================================================
 * Testa roteamento, layout wrapper e scroll behavior
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../../App'

// Mock das páginas pesadas para testes isolados de roteamento
vi.mock('../../pages/Welcome', () => ({
  default: () => <div data-testid="page-welcome">Welcome</div>,
}))
vi.mock('../../pages/Home', () => ({
  default: () => <div data-testid="page-home">Home</div>,
}))
vi.mock('../../pages/Produto', () => ({
  default: () => <div data-testid="page-produto">Produto</div>,
}))
vi.mock('../../pages/Loja', () => ({
  default: () => <div data-testid="page-loja">Loja</div>,
}))
vi.mock('../../pages/Orcamento', () => ({
  default: () => <div data-testid="page-orcamento">Orcamento</div>,
}))
vi.mock('../../pages/QuemSomos', () => ({
  default: () => <div data-testid="page-quem-somos">Quem Somos</div>,
}))
vi.mock('../../pages/Sustentabilidade', () => ({
  default: () => <div data-testid="page-sustentabilidade">Sustentabilidade</div>,
}))
vi.mock('../../pages/Parceiros', () => ({
  default: () => <div data-testid="page-parceiros">Parceiros</div>,
}))
vi.mock('../../pages/Dashboard', () => ({
  default: () => <div data-testid="page-dashboard">Dashboard</div>,
}))
vi.mock('../../pages/Engenharia', () => ({
  default: () => <div data-testid="page-engenharia">Engenharia</div>,
}))
vi.mock('../../pages/Adm', () => ({
  default: () => <div data-testid="page-adm">Adm</div>,
  AdmGuard: ({ children }) => <div>{children}</div>,
}))

function renderApp(route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>
  )
}

describe('App - Roteamento', () => {
  it('deve renderizar Welcome na rota /', () => {
    renderApp('/')
    expect(screen.getByTestId('page-welcome')).toBeInTheDocument()
  })

  it('deve renderizar Home na rota /inicio', () => {
    renderApp('/inicio')
    expect(screen.getByTestId('page-home')).toBeInTheDocument()
  })

  it('deve renderizar Produto na rota /produto', () => {
    renderApp('/produto')
    expect(screen.getByTestId('page-produto')).toBeInTheDocument()
  })

  it('deve renderizar Loja na rota /loja', () => {
    renderApp('/loja')
    expect(screen.getByTestId('page-loja')).toBeInTheDocument()
  })

  it('deve renderizar Orçamento na rota /orcamento', () => {
    renderApp('/orcamento')
    expect(screen.getByTestId('page-orcamento')).toBeInTheDocument()
  })

  it('deve renderizar Quem Somos na rota /quem-somos', () => {
    renderApp('/quem-somos')
    expect(screen.getByTestId('page-quem-somos')).toBeInTheDocument()
  })

  it('deve renderizar Sustentabilidade na rota /sustentabilidade', () => {
    renderApp('/sustentabilidade')
    expect(screen.getByTestId('page-sustentabilidade')).toBeInTheDocument()
  })

  it('deve renderizar Parceiros na rota /parceiros', () => {
    renderApp('/parceiros')
    expect(screen.getByTestId('page-parceiros')).toBeInTheDocument()
  })

  it('deve renderizar ADM na rota /adm', () => {
    renderApp('/adm')
    expect(screen.getByTestId('page-adm')).toBeInTheDocument()
  })

  it('deve renderizar Dashboard na rota /dashboard', () => {
    renderApp('/dashboard')
    expect(screen.getByTestId('page-dashboard')).toBeInTheDocument()
  })

  it('deve renderizar Engenharia na rota /engenharia', () => {
    renderApp('/engenharia')
    expect(screen.getByTestId('page-engenharia')).toBeInTheDocument()
  })
})

describe('App - Layout', () => {
  it('página Welcome (/) NÃO deve ter Navbar', () => {
    renderApp('/')
    expect(screen.queryByText('VENTILOAR')).not.toBeInTheDocument()
  })

  it('página /inicio DEVE ter Navbar', () => {
    renderApp('/inicio')
    // Navbar renderiza o logo "VENTILOAR"
    const logos = screen.getAllByText('VENTILOAR')
    expect(logos.length).toBeGreaterThanOrEqual(1)
  })

  it('página /produto DEVE ter Navbar e Footer', () => {
    renderApp('/produto')
    const logos = screen.getAllByText('VENTILOAR')
    // Logo na navbar + logo no footer = pelo menos 2
    expect(logos.length).toBeGreaterThanOrEqual(2)
  })

  it('container principal deve ter min-h-screen', () => {
    const { container } = renderApp('/inicio')
    const mainDiv = container.firstChild
    expect(mainDiv.className).toContain('min-h-screen')
  })

  it('container principal deve ter bg-background', () => {
    const { container } = renderApp('/inicio')
    const mainDiv = container.firstChild
    expect(mainDiv.className).toContain('bg-background')
  })

  it('container principal deve ter font-body', () => {
    const { container } = renderApp('/inicio')
    const mainDiv = container.firstChild
    expect(mainDiv.className).toContain('font-body')
  })
})

describe('App - ScrollToTop', () => {
  it('deve chamar window.scrollTo ao mudar de rota', () => {
    renderApp('/inicio')
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
  })
})
