/**
 * ===================================================================
 * TESTES DE RESPONSIVIDADE - matchMedia e Viewport Simulation
 * ===================================================================
 * Simula diferentes viewports e testa comportamento responsivo
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'

// ====================== HELPERS ======================

/**
 * Simula matchMedia para um viewport específico
 */
function mockViewport(width) {
  window.matchMedia = vi.fn().mockImplementation((query) => {
    // Parse "min-width: XXXpx" patterns
    const minWidthMatch = query.match(/min-width:\s*(\d+)px/)
    const maxWidthMatch = query.match(/max-width:\s*(\d+)px/)

    let matches = false
    if (minWidthMatch) {
      matches = width >= parseInt(minWidthMatch[1])
    }
    if (maxWidthMatch) {
      matches = width <= parseInt(maxWidthMatch[1])
    }

    return {
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }
  })

  // Simula innerWidth
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
}

// Tailwind breakpoints
const BREAKPOINTS = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
}

// ====================== TESTES POR VIEWPORT ======================

describe('Viewport: Mobile (320px)', () => {
  beforeEach(() => {
    mockViewport(BREAKPOINTS.xs)
  })

  it('Navbar deve renderizar botão de menu mobile', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    )

    const menuButton = screen.getByLabelText('Menu')
    expect(menuButton).toBeInTheDocument()
  })

  it('Navbar: menu mobile deve funcionar (abrir/fechar)', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    )

    const menuButton = screen.getByLabelText('Menu')

    // Abre
    fireEvent.click(menuButton)
    expect(screen.getByLabelText('Menu').querySelector('.material-symbols-outlined'))
      .toHaveTextContent('close')

    // Fecha
    fireEvent.click(menuButton)
    expect(screen.getByLabelText('Menu').querySelector('.material-symbols-outlined'))
      .toHaveTextContent('menu')
  })

  it('Footer deve ter grid de 1 coluna em mobile', () => {
    const { container } = render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    )

    const grid = container.querySelector('.grid-cols-1')
    expect(grid).toBeInTheDocument()
  })
})

describe('Viewport: Small (640px)', () => {
  beforeEach(() => {
    mockViewport(BREAKPOINTS.sm)
  })

  it('Navbar deve ainda mostrar menu mobile', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    )

    // Em sm, lg:hidden ainda se aplica (sm < lg)
    const menuButton = screen.getByLabelText('Menu')
    expect(menuButton).toBeInTheDocument()
  })
})

describe('Viewport: Medium (768px)', () => {
  beforeEach(() => {
    mockViewport(BREAKPOINTS.md)
  })

  it('Footer deve ter grid md:grid-cols-4 disponível', () => {
    const { container } = render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    )

    const grid = container.querySelector('[class*="md:grid-cols-4"]')
    expect(grid).toBeInTheDocument()
  })

  it('Navbar deve ter padding md:px-8', () => {
    const { container } = render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    )

    const paddedEl = container.querySelector('[class*="md:px-8"]')
    expect(paddedEl).toBeInTheDocument()
  })
})

describe('Viewport: Large (1024px)', () => {
  beforeEach(() => {
    mockViewport(BREAKPOINTS.lg)
  })

  it('Navbar desktop nav deve ter classes lg:flex', () => {
    const { container } = render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    )

    const desktopNav = container.querySelector('[class*="lg:flex"]')
    expect(desktopNav).toBeInTheDocument()
  })

  it('Navbar botão mobile deve ter classe lg:hidden', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    )

    const menuButton = screen.getByLabelText('Menu')
    expect(menuButton.className).toContain('lg:hidden')
  })
})

describe('Viewport: Extra Large (1280px)', () => {
  beforeEach(() => {
    mockViewport(BREAKPOINTS.xl)
  })

  it('Navbar deve renderizar normalmente', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    )

    expect(screen.getByText('VENTILOAR')).toBeInTheDocument()
  })
})

// ====================== TESTES DE BREAKPOINT TRANSITIONS ======================

describe('Transição de Breakpoints', () => {
  it('deve manter funcionalidade do menu entre redimensionamentos', () => {
    // Inicia em mobile
    mockViewport(320)

    const { unmount } = render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    )

    const menuButton = screen.getByLabelText('Menu')
    fireEvent.click(menuButton)
    expect(menuButton.querySelector('.material-symbols-outlined')).toHaveTextContent('close')

    unmount()

    // Muda para desktop
    mockViewport(1280)

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    )

    // Desktop nav deve estar presente
    expect(screen.getByText('VENTILOAR')).toBeInTheDocument()
  })

  it('conteúdo do footer deve estar presente em todos os viewports', () => {
    const viewports = [320, 640, 768, 1024, 1280, 1536]

    viewports.forEach((width) => {
      mockViewport(width)

      const { unmount } = render(
        <MemoryRouter>
          <Footer />
        </MemoryRouter>
      )

      expect(screen.getByText('VENTILOAR')).toBeInTheDocument()
      expect(screen.getByText('Navegação')).toBeInTheDocument()
      expect(screen.getByText('Contato')).toBeInTheDocument()

      unmount()
    })
  })
})

// ====================== TESTES DE ACESSIBILIDADE RESPONSIVA ======================

describe('Acessibilidade Responsiva', () => {
  it('botão de menu mobile deve ter aria-label', () => {
    mockViewport(320)
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    )

    const button = screen.getByLabelText('Menu')
    expect(button).toBeInTheDocument()
    expect(button.getAttribute('aria-label')).toBe('Menu')
  })

  it('links de navegação devem estar acessíveis em mobile (via menu)', () => {
    mockViewport(320)
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    )

    // Abre menu
    fireEvent.click(screen.getByLabelText('Menu'))

    // Todos os links devem estar renderizados
    const navItems = ['Início', 'Produto', 'Loja', 'Orçamento', 'Quem Somos', 'Sustentabilidade', 'Parceiros', 'ADM']
    navItems.forEach((item) => {
      const links = screen.getAllByText(item)
      expect(links.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('todos os links do footer devem ter texto visível em todos os viewports', () => {
    [320, 768, 1280].forEach((width) => {
      mockViewport(width)

      const { container, unmount } = render(
        <MemoryRouter>
          <Footer />
        </MemoryRouter>
      )

      const links = container.querySelectorAll('a')
      links.forEach((link) => {
        expect(link.textContent.trim().length).toBeGreaterThan(0)
      })

      unmount()
    })
  })
})
