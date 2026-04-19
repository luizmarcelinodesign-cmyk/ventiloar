/**
 * ===================================================================
 * TESTES DE RESPONSIVIDADE - Footer
 * ===================================================================
 * Testa layout grid, breakpoints e conteúdo
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Footer from '../../components/Footer'

function renderFooter() {
  return render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>
  )
}

describe('Footer - Estrutura', () => {
  it('deve renderizar logo VENTILOAR', () => {
    renderFooter()
    expect(screen.getByText('VENTILOAR')).toBeInTheDocument()
  })

  it('deve renderizar seção Navegação', () => {
    renderFooter()
    expect(screen.getByText('Navegação')).toBeInTheDocument()
  })

  it('deve renderizar seção Institucional', () => {
    renderFooter()
    expect(screen.getByText('Institucional')).toBeInTheDocument()
  })

  it('deve renderizar seção Contato', () => {
    renderFooter()
    expect(screen.getByText('Contato')).toBeInTheDocument()
  })

  it('deve conter links de navegação', () => {
    renderFooter()
    expect(screen.getByText('Início')).toBeInTheDocument()
    expect(screen.getByText('Produto')).toBeInTheDocument()
    expect(screen.getByText('Loja')).toBeInTheDocument()
    expect(screen.getByText('Orçamento')).toBeInTheDocument()
  })

  it('deve conter links institucionais', () => {
    renderFooter()
    expect(screen.getByText('Quem Somos')).toBeInTheDocument()
    expect(screen.getByText('Sustentabilidade')).toBeInTheDocument()
    expect(screen.getByText('Parceiros')).toBeInTheDocument()
  })

  it('deve conter informação de contato', () => {
    renderFooter()
    expect(screen.getByText('Madalena, Ceará')).toBeInTheDocument()
    expect(screen.getByText('ventiloar@gmail.com')).toBeInTheDocument()
  })

  it('deve conter copyright com ano atual', () => {
    renderFooter()
    const year = new Date().getFullYear()
    expect(screen.getByText(new RegExp(`${year}`))).toBeInTheDocument()
  })

  it('deve conter texto "TODOS OS DIREITOS RESERVADOS"', () => {
    renderFooter()
    expect(screen.getByText(/TODOS OS DIREITOS RESERVADOS/)).toBeInTheDocument()
  })
})

describe('Footer - Layout Responsivo', () => {
  it('grid deve ter classes grid-cols-1 md:grid-cols-4', () => {
    const { container } = renderFooter()
    const grid = container.querySelector('.grid-cols-1.md\\:grid-cols-4')
    expect(grid).toBeInTheDocument()
  })

  it('deve ter padding responsivo px-8 md:px-12', () => {
    const { container } = renderFooter()
    const sections = container.querySelectorAll('.px-8.md\\:px-12')
    expect(sections.length).toBeGreaterThanOrEqual(1)
  })

  it('grid deve ter gap-12 entre colunas', () => {
    const { container } = renderFooter()
    const grid = container.querySelector('.gap-12')
    expect(grid).toBeInTheDocument()
  })

  it('deve ter max-w-7xl para limitar largura', () => {
    const { container } = renderFooter()
    const maxWidth = container.querySelector('.max-w-7xl')
    expect(maxWidth).toBeInTheDocument()
  })

  it('footer deve ter w-full para largura total', () => {
    const { container } = renderFooter()
    const footer = container.querySelector('footer')
    expect(footer.className).toContain('w-full')
  })

  it('copyright deve ter text-center', () => {
    const { container } = renderFooter()
    const copyright = container.querySelector('.text-center')
    expect(copyright).toBeInTheDocument()
  })

  it('grid items devem ter space-y-6 para espaçamento vertical', () => {
    const { container } = renderFooter()
    const spacedItems = container.querySelectorAll('.space-y-6')
    expect(spacedItems.length).toBeGreaterThanOrEqual(4) // 4 colunas
  })
})

describe('Footer - Links', () => {
  it('todos os links devem ter texto visível', () => {
    const { container } = renderFooter()
    const links = container.querySelectorAll('a')

    links.forEach((link) => {
      expect(link.textContent.trim().length).toBeGreaterThan(0)
    })
  })

  it('links de navegação devem ter classes de hover', () => {
    const { container } = renderFooter()
    const navLinks = container.querySelectorAll('ul a')

    navLinks.forEach((link) => {
      expect(link.className).toContain('hover:text-primary')
    })
  })

  it('links devem ter transition para suavidade', () => {
    const { container } = renderFooter()
    const navLinks = container.querySelectorAll('ul a')

    navLinks.forEach((link) => {
      expect(link.className).toContain('transition')
    })
  })
})
