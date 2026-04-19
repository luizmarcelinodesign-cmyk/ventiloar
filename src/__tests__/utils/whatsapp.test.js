/**
 * ===================================================================
 * TESTES - whatsapp.js
 * ===================================================================
 * Testa geração de links WhatsApp e encoding de mensagens
 */

import { describe, it, expect } from 'vitest'
import {
  WHATSAPP_NUMBER,
  WHATSAPP_BASE_URL,
  whatsappLink,
  whatsappShareLink,
} from '../../utils/whatsapp'

describe('whatsapp - Constantes', () => {
  it('deve ter número de WhatsApp no formato correto (5588...)', () => {
    expect(WHATSAPP_NUMBER).toMatch(/^55\d{10,11}$/)
  })

  it('WHATSAPP_NUMBER deve ser 5588981581328', () => {
    expect(WHATSAPP_NUMBER).toBe('5588981581328')
  })

  it('WHATSAPP_BASE_URL deve conter o número', () => {
    expect(WHATSAPP_BASE_URL).toBe('https://wa.me/5588981581328')
  })

  it('WHATSAPP_BASE_URL deve começar com https://wa.me/', () => {
    expect(WHATSAPP_BASE_URL).toMatch(/^https:\/\/wa\.me\//)
  })
})

describe('whatsapp - whatsappLink()', () => {
  it('deve retornar URL base quando mensagem é vazia', () => {
    expect(whatsappLink('')).toBe(WHATSAPP_BASE_URL)
  })

  it('deve retornar URL base quando mensagem não é fornecida', () => {
    expect(whatsappLink()).toBe(WHATSAPP_BASE_URL)
  })

  it('deve adicionar texto codificado na URL', () => {
    const result = whatsappLink('Olá, quero um orçamento')
    expect(result).toContain('?text=')
    expect(result).toContain(encodeURIComponent('Olá, quero um orçamento'))
  })

  it('deve codificar caracteres especiais corretamente', () => {
    const msg = 'Preço: R$1.200,00 - 50% desconto!'
    const result = whatsappLink(msg)
    expect(result).toContain(encodeURIComponent(msg))
  })

  it('deve codificar acentos e cedilha', () => {
    const msg = 'Ventilação sustentável - Ações ESG'
    const result = whatsappLink(msg)
    expect(result).toContain(encodeURIComponent(msg))
  })

  it('deve começar com a URL base quando há mensagem', () => {
    const result = whatsappLink('Teste')
    expect(result.startsWith(WHATSAPP_BASE_URL)).toBe(true)
  })

  it('deve gerar URL válida (sem espaços não codificados)', () => {
    const result = whatsappLink('Mensagem com espaços')
    expect(result).not.toMatch(/[^%]\s/)
  })

  it('deve lidar com mensagens longas', () => {
    const longMsg = 'A'.repeat(1000)
    const result = whatsappLink(longMsg)
    expect(result).toContain('?text=')
    expect(result.length).toBeGreaterThan(WHATSAPP_BASE_URL.length)
  })

  it('deve lidar com emojis', () => {
    const msg = '🌬️ Ventilação econômica! 💰'
    const result = whatsappLink(msg)
    expect(result).toContain('?text=')
  })
})

describe('whatsapp - whatsappShareLink()', () => {
  it('deve gerar link de compartilhamento sem número de destino', () => {
    const result = whatsappShareLink('Compartilhando')
    expect(result.startsWith('https://wa.me/?text=')).toBe(true)
  })

  it('deve codificar mensagem no link de compartilhamento', () => {
    const msg = 'Confira o Sistema 3F da Ventiloar!'
    const result = whatsappShareLink(msg)
    expect(result).toContain(encodeURIComponent(msg))
  })

  it('deve retornar link vazio com mensagem vazia', () => {
    const result = whatsappShareLink('')
    expect(result).toBe('https://wa.me/?text=')
  })

  it('deve retornar link vazio sem argumento', () => {
    const result = whatsappShareLink()
    expect(result).toBe('https://wa.me/?text=')
  })
})
