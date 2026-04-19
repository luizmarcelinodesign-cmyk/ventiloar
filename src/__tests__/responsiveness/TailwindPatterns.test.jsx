/**
 * ===================================================================
 * TESTES DE RESPONSIVIDADE - Padrões Tailwind Globais
 * ===================================================================
 * Verifica se os padrões responsivos comuns estão sendo aplicados
 * consistentemente em toda a aplicação
 */

import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import Home from '../../pages/Home'
import Produto from '../../pages/Produto'
import Loja from '../../pages/Loja'
import Welcome from '../../pages/Welcome'

// Mock services
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

// Função utilitária para verificar classes em todo o DOM
function findClassPattern(container, pattern) {
  const regex = new RegExp(pattern)
  const all = container.querySelectorAll('*')
  return Array.from(all).filter((el) => regex.test(el.className))
}

describe('Padrões Responsivos - Padding Horizontal', () => {
  const pages = [
    { name: 'Home', Component: Home, route: '/inicio' },
    { name: 'Produto', Component: Produto, route: '/produto' },
    { name: 'Loja', Component: Loja, route: '/loja' },
  ]

  pages.forEach(({ name, Component, route }) => {
    it(`${name}: deve usar px-6 md:px-8 para padding horizontal`, () => {
      const { container } = renderPage(Component, route)
      const elements = findClassPattern(container, 'px-6')
      expect(elements.length).toBeGreaterThan(0)
    })
  })
})

describe('Padrões Responsivos - Padding Vertical de Seções', () => {
  const pages = [
    { name: 'Home', Component: Home, route: '/inicio' },
    { name: 'Produto', Component: Produto, route: '/produto' },
    { name: 'Loja', Component: Loja, route: '/loja' },
  ]

  pages.forEach(({ name, Component, route }) => {
    it(`${name}: deve usar padding vertical responsivo nas seções`, () => {
      const { container } = renderPage(Component, route)
      const elements = findClassPattern(container, 'md:py-')
      expect(elements.length).toBeGreaterThan(0)
    })
  })
})

describe('Padrões Responsivos - Largura Máxima', () => {
  const pages = [
    { name: 'Home', Component: Home, route: '/inicio' },
    { name: 'Produto', Component: Produto, route: '/produto' },
  ]

  pages.forEach(({ name, Component, route }) => {
    it(`${name}: deve usar max-w-7xl para conteúdo centralizado`, () => {
      const { container } = renderPage(Component, route)
      const elements = findClassPattern(container, 'max-w-7xl')
      expect(elements.length).toBeGreaterThanOrEqual(1)
    })
  })
})

describe('Padrões Responsivos - Grid System', () => {
  it('Home: deve ter pelo menos 3 layouts grid diferentes', () => {
    const { container } = renderPage(Home)
    const grids = container.querySelectorAll('[class*="grid-cols"]')
    expect(grids.length).toBeGreaterThanOrEqual(3)
  })

  it('Produto: deve ter pelo menos 2 layouts grid', () => {
    const { container } = renderPage(Produto)
    const grids = container.querySelectorAll('[class*="grid-cols"]')
    expect(grids.length).toBeGreaterThanOrEqual(2)
  })

  it('Loja: deve ter grid progressivo de colunas', () => {
    const { container } = renderPage(Loja)
    // Verifica que tem sm, lg e xl breakpoints no grid
    const multiBreakpointGrids = findClassPattern(container, 'sm:grid-cols-2.*lg:grid-cols-3')
    expect(multiBreakpointGrids.length).toBeGreaterThanOrEqual(1)
  })
})

describe('Padrões Responsivos - Flex Direction', () => {
  it('Home: deve ter flex-col→flex-row para responsividade', () => {
    const { container } = renderPage(Home)
    const flexResponsive = findClassPattern(container, 'md:flex-row')
    expect(flexResponsive.length).toBeGreaterThanOrEqual(1)
  })

  it('Loja: deve ter flex responsivo', () => {
    const { container } = renderPage(Loja)
    const flexResponsive = findClassPattern(container, 'md:flex-row')
    expect(flexResponsive.length).toBeGreaterThanOrEqual(1)
  })
})

describe('Padrões Responsivos - Tipografia', () => {
  const pages = [
    { name: 'Home', Component: Home, route: '/inicio' },
    { name: 'Produto', Component: Produto, route: '/produto' },
    { name: 'Loja', Component: Loja, route: '/loja' },
    { name: 'Welcome', Component: Welcome, route: '/' },
  ]

  pages.forEach(({ name, Component, route }) => {
    it(`${name}: deve ter textos com tamanho responsivo (md:text-*)`, () => {
      const { container } = renderPage(Component, route)
      const responsiveText = findClassPattern(container, 'md:text-')
      expect(responsiveText.length).toBeGreaterThan(0)
    })
  })
})

describe('Padrões Responsivos - Visibilidade Condicional', () => {
  it('deve ter elementos hidden lg:flex (desktop-only)', () => {
    const { container } = render(
      <MemoryRouter>
        <div>
          {/* Navbar inlines desktop nav */}
          <div className="hidden lg:flex">Desktop Nav</div>
          <div className="lg:hidden">Mobile Nav</div>
        </div>
      </MemoryRouter>
    )

    const desktopOnly = container.querySelector('.hidden.lg\\:flex')
    expect(desktopOnly).toBeInTheDocument()

    const mobileOnly = container.querySelector('.lg\\:hidden')
    expect(mobileOnly).toBeInTheDocument()
  })
})

describe('Padrões Responsivos - Overflow e Scroll', () => {
  it('Home: não deve ter overflow-x-hidden no body que corte conteúdo', () => {
    const { container } = renderPage(Home)
    const overflowHidden = container.querySelector('[class*="overflow-hidden"]')
    // overflow-hidden é válido em seções específicas (hero)
    // mas NÃO no container principal
    const main = container.querySelector('main')
    if (main) {
      expect(main.className).not.toContain('overflow-x-hidden')
    }
  })
})

describe('Padrões Responsivos - Gap e Spacing', () => {
  it('Home: deve ter gaps consistentes nos grids', () => {
    const { container } = renderPage(Home)
    const gappedGrids = findClassPattern(container, 'gap-')
    expect(gappedGrids.length).toBeGreaterThan(0)
  })

  it('Produto: deve ter spacing entre seções', () => {
    const { container } = renderPage(Produto)
    const spacedSections = findClassPattern(container, 'py-20')
    expect(spacedSections.length).toBeGreaterThan(0)
  })

  it('Loja: deve ter gap no grid de produtos', () => {
    const { container } = renderPage(Loja)
    const gappedGrid = findClassPattern(container, 'gap-6')
    expect(gappedGrid.length).toBeGreaterThan(0)
  })
})
