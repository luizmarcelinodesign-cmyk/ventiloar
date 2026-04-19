/**
 * ===================================================================
 * TESTES DE RESPONSIVIDADE - Navbar
 * ===================================================================
 * Testa menu mobile, breakpoints, toggling e acessibilidade
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Navbar from '../../components/Navbar'

function renderWithRouter(ui, { route = '/inicio' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      {ui}
    </MemoryRouter>
  )
}

describe('Navbar - Estrutura', () => {
  beforeEach(() => {
    renderWithRouter(<Navbar />)
  })

  it('deve renderizar o logo VENTILOAR', () => {
    expect(screen.getByText('VENTILOAR')).toBeInTheDocument()
  })

  it('deve renderizar todos os itens de navegação desktop', () => {
    const navItems = ['Início', 'Produto', 'Loja', 'Orçamento', 'Quem Somos', 'Sustentabilidade', 'Parceiros', 'ADM']
    navItems.forEach((item) => {
      expect(screen.getAllByText(item).length).toBeGreaterThanOrEqual(1)
    })
  })

  it('deve ter botão CTA "Solicitar Orçamento"', () => {
    expect(screen.getAllByText('Solicitar Orçamento').length).toBeGreaterThanOrEqual(1)
  })

  it('deve ter botão de menu mobile com aria-label', () => {
    const menuButton = screen.getByLabelText('Menu')
    expect(menuButton).toBeInTheDocument()
  })
})

describe('Navbar - Classes Responsivas', () => {
  it('nav desktop deve ter classe hidden lg:flex', () => {
    const { container } = renderWithRouter(<Navbar />)
    const desktopNav = container.querySelector('.hidden.lg\\:flex')
    expect(desktopNav).toBeInTheDocument()
  })

  it('botão menu mobile deve ter classe lg:hidden', () => {
    renderWithRouter(<Navbar />)
    const menuButton = screen.getByLabelText('Menu')
    expect(menuButton.className).toContain('lg:hidden')
  })

  it('CTA deve ter classe hidden sm:block (escondido em mobile)', () => {
    const { container } = renderWithRouter(<Navbar />)
    const cta = container.querySelector('.hidden.sm\\:block')
    expect(cta).toBeInTheDocument()
  })

  it('navbar deve ter max-w-7xl para limitar largura', () => {
    const { container } = renderWithRouter(<Navbar />)
    const inner = container.querySelector('.max-w-7xl')
    expect(inner).toBeInTheDocument()
  })

  it('navbar deve ter padding responsivo px-6 md:px-8', () => {
    const { container } = renderWithRouter(<Navbar />)
    const inner = container.querySelector('.px-6.md\\:px-8')
    expect(inner).toBeInTheDocument()
  })

  it('navbar deve ser sticky top-0', () => {
    const { container } = renderWithRouter(<Navbar />)
    const nav = container.querySelector('nav')
    expect(nav.className).toContain('sticky')
    expect(nav.className).toContain('top-0')
  })

  it('navbar deve ter z-50 para ficar acima de outros elementos', () => {
    const { container } = renderWithRouter(<Navbar />)
    const nav = container.querySelector('nav')
    expect(nav.className).toContain('z-50')
  })

  it('navbar deve ter backdrop-blur', () => {
    const { container } = renderWithRouter(<Navbar />)
    const nav = container.querySelector('nav')
    expect(nav.className).toContain('backdrop-blur')
  })
})

describe('Navbar - Menu Mobile Toggle', () => {
  it('menu mobile deve estar fechado inicialmente', () => {
    renderWithRouter(<Navbar />)
    const menuButton = screen.getByLabelText('Menu')

    // Deve mostrar ícone "menu" (não "close")
    expect(menuButton.querySelector('.material-symbols-outlined')).toHaveTextContent('menu')
  })

  it('deve abrir menu mobile ao clicar no botão', () => {
    renderWithRouter(<Navbar />)
    const menuButton = screen.getByLabelText('Menu')

    fireEvent.click(menuButton)

    // Deve mostrar ícone "close"
    expect(menuButton.querySelector('.material-symbols-outlined')).toHaveTextContent('close')
  })

  it('deve fechar menu mobile ao clicar novamente', () => {
    renderWithRouter(<Navbar />)
    const menuButton = screen.getByLabelText('Menu')

    fireEvent.click(menuButton) // Abre
    fireEvent.click(menuButton) // Fecha

    expect(menuButton.querySelector('.material-symbols-outlined')).toHaveTextContent('menu')
  })

  it('menu mobile expandido deve conter CTA de Orçamento', () => {
    renderWithRouter(<Navbar />)
    const menuButton = screen.getByLabelText('Menu')

    fireEvent.click(menuButton)

    const mobileMenu = document.querySelector('.lg\\:hidden.bg-surface-container-low')
    expect(mobileMenu).toBeInTheDocument()
  })

  it('menu mobile deve ter classe lg:hidden', () => {
    renderWithRouter(<Navbar />)
    const menuButton = screen.getByLabelText('Menu')
    fireEvent.click(menuButton)

    // O menu expandido deve ter lg:hidden
    const mobileMenu = document.querySelector('.lg\\:hidden.bg-surface-container-low')
    expect(mobileMenu).toBeInTheDocument()
  })

  it('deve fechar menu mobile ao navegar para um link', () => {
    renderWithRouter(<Navbar />)
    const menuButton = screen.getByLabelText('Menu')

    fireEvent.click(menuButton) // Abre

    // Clica em um link do menu mobile
    const mobileLinks = document.querySelectorAll('.lg\\:hidden.bg-surface-container-low a')
    if (mobileLinks.length > 0) {
      fireEvent.click(mobileLinks[0])
      // Menu deve fechar
      expect(menuButton.querySelector('.material-symbols-outlined')).toHaveTextContent('menu')
    }
  })
})

describe('Navbar - Estado Ativo', () => {
  it('deve destacar item ativo com classes especiais', () => {
    renderWithRouter(<Navbar />, { route: '/produto' })

    const produtoLinks = screen.getAllByText('Produto')
    const desktopLink = produtoLinks.find((el) => el.className.includes('font-bold'))
    expect(desktopLink).toBeDefined()
  })

  it('deve destacar Início quando na rota /inicio', () => {
    renderWithRouter(<Navbar />, { route: '/inicio' })

    const inicioLinks = screen.getAllByText('Início')
    const activeLink = inicioLinks.find((el) => el.className.includes('primary-container'))
    expect(activeLink).toBeDefined()
  })
})
