/**
 * ===================================================================
 * TESTES DE RESPONSIVIDADE - Todas as Páginas
 * ===================================================================
 * Testa classes Tailwind responsivas, grids, layouts e breakpoints
 * para cada página da aplicação Ventiloar
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// ====================== IMPORTS ======================

import Home from '../../pages/Home'
import Produto from '../../pages/Produto'
import Loja from '../../pages/Loja'
import QuemSomos from '../../pages/QuemSomos'
import Sustentabilidade from '../../pages/Sustentabilidade'
import Parceiros from '../../pages/Parceiros'
import Welcome from '../../pages/Welcome'

// Mock Supabase para Orcamento e páginas admin
vi.mock('../../services/supabaseClient', () => ({
  default: null,
  supabase: null,
  isSupabaseAvailable: vi.fn(() => false),
  assertSupabaseConfigured: vi.fn(),
  isSupabaseConnected: vi.fn(async () => false),
  getSupabaseConfigError: vi.fn(() => 'Not configured'),
}))

vi.mock('../../services/storageService', () => ({
  listDocuments: vi.fn(async () => []),
  addDocument: vi.fn(async () => ({})),
  STORES: {
    shoppingList: 'shopping_list', products: 'products',
    pricing: 'pricing', budgets: 'budgets', financialData: 'financial_data',
  },
}))

vi.mock('../../services/auditService', () => ({
  recordAudit: vi.fn(async () => ({})),
  getAuditLog: vi.fn(async () => []),
  getAuditStats: vi.fn(async () => ({ totalEntries: 0 })),
}))

function renderPage(Component, route = '/inicio') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Component />
    </MemoryRouter>
  )
}

// ====================== HOME ======================

describe('Home - Responsividade', () => {
  it('deve renderizar hero com classes responsivas', () => {
    const { container } = renderPage(Home)

    // Hero sections com padding responsivo
    const responsiveSections = container.querySelectorAll('[class*="md:px-8"]')
    expect(responsiveSections.length).toBeGreaterThan(0)
  })

  it('hero deve ter min-h-[90vh] para ocupar viewport', () => {
    const { container } = renderPage(Home)
    const hero = container.querySelector('[class*="min-h-"]')
    expect(hero).toBeInTheDocument()
  })

  it('grids devem ter transição de colunas responsiva', () => {
    const { container } = renderPage(Home)

    // Grid 1→2 colunas (lg)
    const gridLg2 = container.querySelector('[class*="lg:grid-cols-2"]')
    expect(gridLg2).toBeInTheDocument()
  })

  it('deve ter grid de métricas com 4 colunas em desktop', () => {
    const { container } = renderPage(Home)
    const grid4 = container.querySelector('[class*="md:grid-cols-4"]')
    expect(grid4).toBeInTheDocument()
  })

  it('deve ter seção "Como Funciona" com 3 colunas', () => {
    const { container } = renderPage(Home)
    const grid3 = container.querySelector('[class*="md:grid-cols-3"]')
    expect(grid3).toBeInTheDocument()
  })

  it('deve ter flex-col→flex-row para layout de novidades', () => {
    const { container } = renderPage(Home)
    const flexResponsive = container.querySelector('[class*="md:flex-row"]')
    expect(flexResponsive).toBeInTheDocument()
  })

  it('textos devem ter tamanhos responsivos', () => {
    const { container } = renderPage(Home)
    const responsiveText = container.querySelector('[class*="md:text-"]')
    expect(responsiveText).toBeInTheDocument()
  })

  it('botões devem ter flex-wrap para mobile', () => {
    const { container } = renderPage(Home)
    const flexWrap = container.querySelector('[class*="flex-wrap"]')
    expect(flexWrap).toBeInTheDocument()
  })

  it('deve ter max-w-7xl para centralização de conteúdo', () => {
    const { container } = renderPage(Home)
    const maxWidth = container.querySelector('.max-w-7xl')
    expect(maxWidth).toBeInTheDocument()
  })

  it('deve ter conteúdo principal "80% menos energia"', () => {
    renderPage(Home)
    expect(screen.getAllByText(/80%/).length).toBeGreaterThanOrEqual(1)
  })

  it('deve ter CTA "Solicitar Orçamento"', () => {
    renderPage(Home)
    expect(screen.getAllByText(/Solicitar Orçamento/).length).toBeGreaterThanOrEqual(1)
  })
})

// ====================== PRODUTO ======================

describe('Produto - Responsividade', () => {
  it('hero deve ter altura responsiva md:h-[80vh]', () => {
    const { container } = renderPage(Produto)
    const hero = container.querySelector('[class*="md:h-"]')
    expect(hero).toBeInTheDocument()
  })

  it('deve ter grid 2 colunas para Sistema 3F', () => {
    const { container } = renderPage(Produto)
    const grid2 = container.querySelector('[class*="lg:grid-cols-2"]')
    expect(grid2).toBeInTheDocument()
  })

  it('deve ter grid de vantagens com 3 colunas (desktop)', () => {
    const { container } = renderPage(Produto)

    // Cards de vantagens (sm:grid-cols-2 em mobile, grid no geral)
    const grids = container.querySelectorAll('[class*="grid-cols"]')
    expect(grids.length).toBeGreaterThanOrEqual(2)
  })

  it('seções devem ter padding responsivo py-20 md:py-24', () => {
    const { container } = renderPage(Produto)
    const sections = container.querySelectorAll('[class*="md:py-24"]')
    expect(sections.length).toBeGreaterThan(0)
  })

  it('deve conter texto "Sistema 3F"', () => {
    renderPage(Produto)
    expect(screen.getAllByText(/3F/).length).toBeGreaterThanOrEqual(1)
  })

  it('deve conter seção de "Vantagens Técnicas"', () => {
    renderPage(Produto)
    expect(screen.getByText(/Vantagens Técnicas/)).toBeInTheDocument()
  })

  it('textos de título devem ter tamanho responsivo', () => {
    const { container } = renderPage(Produto)
    const bigText = container.querySelector('[class*="md:text-7xl"]')
    expect(bigText).toBeInTheDocument()
  })
})

// ====================== LOJA ======================

describe('Loja - Responsividade', () => {
  it('deve ter grid progressivo de 1→2→3→4 colunas', () => {
    const { container } = renderPage(Loja)

    // Progressão: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
    const productGrid = container.querySelector('[class*="sm:grid-cols-2"]')
    expect(productGrid).toBeInTheDocument()
  })

  it('xl breakpoint deve ter 4 colunas', () => {
    const { container } = renderPage(Loja)
    const xlGrid = container.querySelector('[class*="xl:grid-cols-4"]')
    expect(xlGrid).toBeInTheDocument()
  })

  it('lg breakpoint deve ter 3 colunas', () => {
    const { container } = renderPage(Loja)
    const lgGrid = container.querySelector('[class*="lg:grid-cols-3"]')
    expect(lgGrid).toBeInTheDocument()
  })

  it('deve ter padding responsivo no header', () => {
    const { container } = renderPage(Loja)
    const responsivePadding = container.querySelector('[class*="md:pt-24"]')
    expect(responsivePadding).toBeInTheDocument()
  })

  it('deve conter texto "LOJA EM CONSTRUÇÃO"', () => {
    renderPage(Loja)
    expect(screen.getByText(/LOJA EM CONSTRUÇÃO/)).toBeInTheDocument()
  })

  it('deve ter layout industrial-pattern no fundo', () => {
    const { container } = renderPage(Loja)
    const main = container.querySelector('.industrial-pattern')
    expect(main).toBeInTheDocument()
  })

  it('deve renderizar cards de produtos', () => {
    renderPage(Loja)
    expect(screen.getByText(/Engrenagem Cônica/)).toBeInTheDocument()
    expect(screen.getByText(/Painel Elétrico/)).toBeInTheDocument()
  })

  it('flex info boxes devem virar horizontal em desktop', () => {
    const { container } = renderPage(Loja)
    const flexRow = container.querySelector('[class*="md:flex-row"]')
    expect(flexRow).toBeInTheDocument()
  })
})

// ====================== WELCOME ======================

describe('Welcome - Responsividade', () => {
  it('deve ocupar tela inteira com min-h-screen', () => {
    const { container } = renderPage(Welcome, '/')
    const main = container.querySelector('.min-h-screen')
    expect(main).toBeInTheDocument()
  })

  it('deve ser centralizado com flex items-center justify-center', () => {
    const { container } = renderPage(Welcome, '/')
    const centered = container.querySelector('.items-center.justify-center')
    expect(centered).toBeInTheDocument()
  })

  it('título deve ter tamanho responsivo (md:text-9xl lg:text-[10rem])', () => {
    const { container } = renderPage(Welcome, '/')
    const bigTitle = container.querySelector('[class*="md:text-9xl"]')
    expect(bigTitle).toBeInTheDocument()
  })

  it('deve conter texto "VENTILOAR"', () => {
    renderPage(Welcome, '/')
    expect(screen.getByText('VENTILOAR')).toBeInTheDocument()
  })

  it('deve conter botão "Entrar no Site"', () => {
    renderPage(Welcome, '/')
    expect(screen.getByText(/Entrar no Site/)).toBeInTheDocument()
  })

  it('deve ter background layers sobrepostas', () => {
    const { container } = renderPage(Welcome, '/')
    const absoluteLayers = container.querySelectorAll('.absolute.inset-0')
    expect(absoluteLayers.length).toBeGreaterThanOrEqual(2)
  })

  it('conteúdo deve ter z-10 para ficar acima dos backgrounds', () => {
    const { container } = renderPage(Welcome, '/')
    const content = container.querySelector('.z-10')
    expect(content).toBeInTheDocument()
  })

  it('deve ter max-w-3xl para largura máxima do conteúdo', () => {
    const { container } = renderPage(Welcome, '/')
    const maxWidth = container.querySelector('.max-w-3xl')
    expect(maxWidth).toBeInTheDocument()
  })

  it('deve ter animação bounce no ícone de seta', () => {
    const { container } = renderPage(Welcome, '/')
    const bouncing = container.querySelector('.animate-bounce')
    expect(bouncing).toBeInTheDocument()
  })
})

// ====================== QUEM SOMOS ======================

describe('QuemSomos - Responsividade', () => {
  it('deve renderizar corretamente', () => {
    renderPage(QuemSomos, '/quem-somos')
    expect(screen.getAllByText(/necessidade real|solu\u00e7\u00e3o inovadora|Nossa Miss\u00e3o/i).length).toBeGreaterThanOrEqual(1)
  })

  it('deve ter grids responsivos', () => {
    const { container } = renderPage(QuemSomos, '/quem-somos')
    const grids = container.querySelectorAll('[class*="grid-cols"]')
    expect(grids.length).toBeGreaterThan(0)
  })

  it('deve ter padding responsivo', () => {
    const { container } = renderPage(QuemSomos, '/quem-somos')
    const responsive = container.querySelectorAll('[class*="md:"]')
    expect(responsive.length).toBeGreaterThan(0)
  })

  it('deve ter max-w para centralização', () => {
    const { container } = renderPage(QuemSomos, '/quem-somos')
    const maxWidth = container.querySelector('[class*="max-w-"]')
    expect(maxWidth).toBeInTheDocument()
  })
})

// ====================== SUSTENTABILIDADE ======================

describe('Sustentabilidade - Responsividade', () => {
  it('deve renderizar corretamente', () => {
    renderPage(Sustentabilidade, '/sustentabilidade')
    expect(screen.getAllByText(/SUSTENTABILIDADE/i).length).toBeGreaterThanOrEqual(1)
  })

  it('deve ter grids responsivos', () => {
    const { container } = renderPage(Sustentabilidade, '/sustentabilidade')
    const grids = container.querySelectorAll('[class*="grid-cols"]')
    expect(grids.length).toBeGreaterThan(0)
  })

  it('deve ter classes de breakpoint md:', () => {
    const { container } = renderPage(Sustentabilidade, '/sustentabilidade')
    const mdClasses = container.querySelectorAll('[class*="md:"]')
    expect(mdClasses.length).toBeGreaterThan(0)
  })
})

// ====================== PARCEIROS ======================

describe('Parceiros - Responsividade', () => {
  it('deve renderizar corretamente', () => {
    renderPage(Parceiros, '/parceiros')
    expect(screen.getAllByText(/PARCEIROS/i).length).toBeGreaterThanOrEqual(1)
  })

  it('deve ter layout grid responsivo', () => {
    const { container } = renderPage(Parceiros, '/parceiros')
    const grids = container.querySelectorAll('[class*="grid-cols"]')
    expect(grids.length).toBeGreaterThan(0)
  })

  it('deve ter padding responsivo', () => {
    const { container } = renderPage(Parceiros, '/parceiros')
    const responsive = container.querySelectorAll('[class*="md:"]')
    expect(responsive.length).toBeGreaterThan(0)
  })
})
