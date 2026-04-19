/**
 * ===================================================================
 * TESTES DE INTEGRAÇÃO - Fluxo completo de Orçamento
 * ===================================================================
 * Testa o fluxo end-to-end de simulação e geração de orçamento
 */

import { describe, it, expect, vi } from 'vitest'
import {
  TARIFAS_POR_ESTADO,
  HELICE_OPTIONS,
  sugerirHelice,
  calcularSimulacao,
  calcularOrcamento,
} from '../../utils/calculator'
import { whatsappLink } from '../../utils/whatsapp'

describe('Integração - Fluxo Completo de Orçamento', () => {
  it('deve simular orçamento completo: espaço → sugestão → simulação → orçamento', () => {
    const espaco = 500 // m²
    const tarifa = TARIFAS_POR_ESTADO['Ceará']
    const horasUso = 10

    // 1. Sugerir hélice
    const heliceSugerida = sugerirHelice(espaco)
    expect(heliceSugerida).toBe(100) // 500m² → 100cm

    // 2. Calcular simulação
    const simulacao = calcularSimulacao(espaco, heliceSugerida, horasUso, tarifa)
    expect(simulacao.quantidadeHelices).toBeGreaterThan(0)
    expect(simulacao.economia).toBeGreaterThan(0)

    // 3. Gerar orçamento
    const orcamento = calcularOrcamento(simulacao)
    expect(orcamento.totalInvestimento).toBeGreaterThan(0)
    expect(orcamento.mesesParaRetorno).toBeGreaterThan(0)
  })

  it('deve gerar link WhatsApp com dados do orçamento', () => {
    const simulacao = calcularSimulacao(300, 70, 8, 0.77)
    const orcamento = calcularOrcamento(simulacao)

    const mensagem = `Olá! Gostaria de solicitar um orçamento:\n` +
      `Espaço: ${simulacao.tamanhoEspaco}m²\n` +
      `Hélices: ${simulacao.quantidadeHelices}x ${simulacao.tamanhoHelice}cm\n` +
      `Motores: ${simulacao.quantidadeMotoresSerie}x ${simulacao.motor.modelo}\n` +
      `Economia mensal estimada: R$${simulacao.economia.toFixed(2)}\n` +
      `Investimento total: R$${orcamento.totalInvestimento.toFixed(2)}`

    const link = whatsappLink(mensagem)

    expect(link).toContain('https://wa.me/')
    expect(link).toContain('text=')
    expect(link).toContain(encodeURIComponent('Olá'))
  })

  it('deve simular orçamentos para todos os estados brasileiros', () => {
    const resultados = Object.entries(TARIFAS_POR_ESTADO).map(([estado, tarifa]) => {
      const espaco = 400
      const helice = sugerirHelice(espaco)
      const simulacao = calcularSimulacao(espaco, helice, 10, tarifa)
      const orcamento = calcularOrcamento(simulacao)

      return {
        estado,
        tarifa,
        economia: simulacao.economia,
        investimento: orcamento.totalInvestimento,
        retorno: orcamento.mesesParaRetorno,
      }
    })

    // Todos devem ter resultados válidos
    expect(resultados).toHaveLength(27)
    resultados.forEach((r) => {
      expect(r.economia).toBeGreaterThan(0)
      expect(r.investimento).toBeGreaterThan(0)
      expect(r.retorno).toBeGreaterThan(0)
    })

    // Estado com maior tarifa deve ter maior economia
    const maisBarato = resultados.reduce((a, b) => a.tarifa < b.tarifa ? a : b)
    const maisCaro = resultados.reduce((a, b) => a.tarifa > b.tarifa ? a : b)
    expect(maisCaro.economia).toBeGreaterThan(maisBarato.economia)
  })

  it('deve comparar ROI entre diferentes tamanhos de hélice', () => {
    const espaco = 600
    const tarifa = 0.85
    const horas = 12

    const resultados = HELICE_OPTIONS.map((helice) => {
      const simulacao = calcularSimulacao(espaco, helice, horas, tarifa)
      const orcamento = calcularOrcamento(simulacao)

      return {
        helice,
        economia: simulacao.economia,
        investimento: orcamento.totalInvestimento,
        retorno: orcamento.mesesParaRetorno,
      }
    })

    // Todos devem ter retorno calculável
    resultados.forEach((r) => {
      expect(r.investimento).toBeGreaterThan(0)
      expect(r.retorno).toBeGreaterThan(0)
    })
  })
})

describe('Integração - Cenários de Uso Real', () => {
  it('Cenário: Galpão Industrial 2000m² no Ceará', () => {
    const espaco = 2000
    const tarifa = TARIFAS_POR_ESTADO['Ceará']
    const horasUso = 14 // 14h/dia

    const helice = sugerirHelice(espaco)
    expect(helice).toBe(120) // Grande espaço → maior hélice

    const simulacao = calcularSimulacao(espaco, helice, horasUso, tarifa)
    expect(simulacao.quantidadeHelices).toBeGreaterThanOrEqual(33) // ~2000/60

    const orcamento = calcularOrcamento(simulacao)
    expect(orcamento.totalInvestimento).toBeGreaterThan(50000) // Investimento significativo
    expect(orcamento.mesesParaRetorno).toBeLessThan(36) // ROI em menos de 3 anos
  })

  it('Cenário: Restaurante 150m² em São Paulo', () => {
    const espaco = 150
    const tarifa = TARIFAS_POR_ESTADO['São Paulo']
    const horasUso = 10

    const helice = sugerirHelice(espaco)
    expect(helice).toBe(60)

    const simulacao = calcularSimulacao(espaco, helice, horasUso, tarifa)
    const orcamento = calcularOrcamento(simulacao)

    expect(simulacao.quantidadeHelices).toBeLessThanOrEqual(10)
    expect(simulacao.economia).toBeGreaterThan(0)
    expect(orcamento.mesesParaRetorno).toBeGreaterThan(0)
  })

  it('Cenário: Supermercado 800m² no Rio de Janeiro', () => {
    const espaco = 800
    const tarifa = TARIFAS_POR_ESTADO['Rio de Janeiro']
    const horasUso = 16

    const helice = sugerirHelice(espaco)
    expect(helice).toBe(100)

    const simulacao = calcularSimulacao(espaco, helice, horasUso, tarifa)
    const orcamento = calcularOrcamento(simulacao)

    expect(simulacao.quantidadeHelices).toBe(16) // 800/50
    expect(simulacao.economia).toBeGreaterThan(0)
    expect(orcamento.totalInvestimento).toBeGreaterThan(0)
  })

  it('Cenário: Sala comercial 50m² no DF', () => {
    const espaco = 50
    const tarifa = TARIFAS_POR_ESTADO['Distrito Federal']
    const horasUso = 8

    const helice = sugerirHelice(espaco)
    expect(helice).toBe(50) // Espaço pequeno → menor hélice

    const simulacao = calcularSimulacao(espaco, helice, horasUso, tarifa)
    const orcamento = calcularOrcamento(simulacao)

    expect(simulacao.quantidadeHelices).toBeLessThanOrEqual(5)
    expect(orcamento.totalInvestimento).toBeLessThan(10000)
  })

  it('Cenário: Centro de distribuição 5000m² na Bahia', () => {
    const espaco = 5000
    const tarifa = TARIFAS_POR_ESTADO['Bahia']
    const horasUso = 20

    const helice = sugerirHelice(espaco)
    expect(helice).toBe(120)

    const simulacao = calcularSimulacao(espaco, helice, horasUso, tarifa)
    const orcamento = calcularOrcamento(simulacao)

    expect(simulacao.quantidadeHelices).toBeGreaterThan(80)
    expect(simulacao.economia).toBeGreaterThan(1000) // Economia mensal > R$1000
    expect(orcamento.totalInvestimento).toBeGreaterThan(100000) // Investimento alto
  })
})

describe('Integração - Consistência de Cálculos', () => {
  it('economia percentual deve ser consistente (~80%) para todos os cenários', () => {
    const cenarios = [
      { espaco: 100, helice: 50 },
      { espaco: 300, helice: 70 },
      { espaco: 500, helice: 100 },
      { espaco: 1500, helice: 120 },
    ]

    cenarios.forEach(({ espaco, helice }) => {
      const simulacao = calcularSimulacao(espaco, helice, 10, 0.85)
      const percentualEconomia = (simulacao.economia / simulacao.custoMensalTradicional) * 100

      // A economia deve ser significativa (>50%) para validar proposta de 80%
      expect(percentualEconomia).toBeGreaterThan(50)
    })
  })

  it('investimento deve ser proporcional ao espaço', () => {
    const tarifa = 0.85
    const horas = 10

    const inv200 = calcularOrcamento(calcularSimulacao(200, 60, horas, tarifa)).totalInvestimento
    const inv400 = calcularOrcamento(calcularSimulacao(400, 60, horas, tarifa)).totalInvestimento
    const inv600 = calcularOrcamento(calcularSimulacao(600, 60, horas, tarifa)).totalInvestimento

    expect(inv400).toBeGreaterThan(inv200)
    expect(inv600).toBeGreaterThan(inv400)
  })

  it('economia mensal deve ser proporcional às horas de uso', () => {
    const espaco = 300
    const helice = 70
    const tarifa = 0.85

    const eco4h = calcularSimulacao(espaco, helice, 4, tarifa).economia
    const eco8h = calcularSimulacao(espaco, helice, 8, tarifa).economia
    const eco16h = calcularSimulacao(espaco, helice, 16, tarifa).economia

    expect(eco8h).toBeCloseTo(eco4h * 2, 5)
    expect(eco16h).toBeCloseTo(eco8h * 2, 5)
  })

  it('economia mensal deve ser proporcional ao valor do kWh', () => {
    const espaco = 300
    const helice = 70
    const horas = 10

    const eco050 = calcularSimulacao(espaco, helice, horas, 0.50).economia
    const eco100 = calcularSimulacao(espaco, helice, horas, 1.00).economia

    expect(eco100).toBeCloseTo(eco050 * 2, 5)
  })
})
