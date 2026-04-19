/**
 * ===================================================================
 * TESTES - calculator.js
 * ===================================================================
 * Testa tarifas, cálculos de simulação, orçamento e sugestão de hélice
 */

import { describe, it, expect } from 'vitest'
import {
  TARIFAS_POR_ESTADO,
  HELICE_OPTIONS,
  sugerirHelice,
  calcularSimulacao,
  calcularOrcamento,
} from '../../utils/calculator'

// ====================== TARIFAS ======================

describe('calculator - TARIFAS_POR_ESTADO', () => {
  it('deve conter todos os 27 estados brasileiros', () => {
    expect(Object.keys(TARIFAS_POR_ESTADO)).toHaveLength(27)
  })

  it('deve incluir todos os estados da região Norte', () => {
    const norte = ['Acre', 'Amapá', 'Amazonas', 'Pará', 'Rondônia', 'Roraima', 'Tocantins']
    norte.forEach((estado) => {
      expect(TARIFAS_POR_ESTADO).toHaveProperty(estado)
    })
  })

  it('deve incluir todos os estados da região Nordeste', () => {
    const nordeste = ['Alagoas', 'Bahia', 'Ceará', 'Maranhão', 'Paraíba', 'Pernambuco', 'Piauí', 'Rio Grande do Norte', 'Sergipe']
    nordeste.forEach((estado) => {
      expect(TARIFAS_POR_ESTADO).toHaveProperty(estado)
    })
  })

  it('deve incluir todos os estados da região Centro-Oeste', () => {
    const centroOeste = ['Distrito Federal', 'Goiás', 'Mato Grosso', 'Mato Grosso do Sul']
    centroOeste.forEach((estado) => {
      expect(TARIFAS_POR_ESTADO).toHaveProperty(estado)
    })
  })

  it('deve incluir todos os estados da região Sudeste', () => {
    const sudeste = ['Espírito Santo', 'Minas Gerais', 'Rio de Janeiro', 'São Paulo']
    sudeste.forEach((estado) => {
      expect(TARIFAS_POR_ESTADO).toHaveProperty(estado)
    })
  })

  it('deve incluir todos os estados da região Sul', () => {
    const sul = ['Paraná', 'Rio Grande do Sul', 'Santa Catarina']
    sul.forEach((estado) => {
      expect(TARIFAS_POR_ESTADO).toHaveProperty(estado)
    })
  })

  it('todas as tarifas devem ser números positivos', () => {
    Object.values(TARIFAS_POR_ESTADO).forEach((tarifa) => {
      expect(typeof tarifa).toBe('number')
      expect(tarifa).toBeGreaterThan(0)
    })
  })

  it('tarifas devem estar na faixa realista (R$0.50 - R$1.50)', () => {
    Object.values(TARIFAS_POR_ESTADO).forEach((tarifa) => {
      expect(tarifa).toBeGreaterThanOrEqual(0.5)
      expect(tarifa).toBeLessThanOrEqual(1.5)
    })
  })

  it('Ceará deve ter tarifa de R$0.77', () => {
    expect(TARIFAS_POR_ESTADO['Ceará']).toBe(0.77)
  })

  it('São Paulo deve ter tarifa de R$0.90', () => {
    expect(TARIFAS_POR_ESTADO['São Paulo']).toBe(0.90)
  })
})

// ====================== HELICE_OPTIONS ======================

describe('calculator - HELICE_OPTIONS', () => {
  it('deve conter 5 tamanhos de hélice', () => {
    expect(HELICE_OPTIONS).toHaveLength(5)
  })

  it('deve conter os tamanhos corretos em ordem crescente', () => {
    expect(HELICE_OPTIONS).toEqual([50, 60, 70, 100, 120])
  })

  it('todos os valores devem ser números positivos', () => {
    HELICE_OPTIONS.forEach((opt) => {
      expect(typeof opt).toBe('number')
      expect(opt).toBeGreaterThan(0)
    })
  })
})

// ====================== sugerirHelice ======================

describe('calculator - sugerirHelice()', () => {
  it('deve sugerir 50cm para espaço até 60m²', () => {
    expect(sugerirHelice(30)).toBe(50)
    expect(sugerirHelice(60)).toBe(50)
  })

  it('deve sugerir 60cm para espaço de 61-200m²', () => {
    expect(sugerirHelice(61)).toBe(60)
    expect(sugerirHelice(100)).toBe(60)
    expect(sugerirHelice(200)).toBe(60)
  })

  it('deve sugerir 70cm para espaço de 201-300m²', () => {
    expect(sugerirHelice(201)).toBe(70)
    expect(sugerirHelice(250)).toBe(70)
    expect(sugerirHelice(300)).toBe(70)
  })

  it('deve sugerir 100cm para espaço de 301-1000m²', () => {
    expect(sugerirHelice(301)).toBe(100)
    expect(sugerirHelice(500)).toBe(100)
    expect(sugerirHelice(1000)).toBe(100)
  })

  it('deve sugerir 120cm para espaço acima de 1000m²', () => {
    expect(sugerirHelice(1001)).toBe(120)
    expect(sugerirHelice(5000)).toBe(120)
    expect(sugerirHelice(10000)).toBe(120)
  })

  it('deve lidar com espaços muito pequenos', () => {
    expect(sugerirHelice(1)).toBe(50)
    expect(sugerirHelice(10)).toBe(50)
  })

  it('deve retornar valor contido em HELICE_OPTIONS', () => {
    const espacos = [20, 80, 250, 600, 2000]
    espacos.forEach((e) => {
      expect(HELICE_OPTIONS).toContain(sugerirHelice(e))
    })
  })
})

// ====================== calcularSimulacao ======================

describe('calculator - calcularSimulacao()', () => {
  describe('Cálculos básicos', () => {
    it('deve retornar objeto com todas as propriedades esperadas', () => {
      const result = calcularSimulacao(200, 60, 8, 0.77)

      expect(result).toHaveProperty('tamanhoEspaco', 200)
      expect(result).toHaveProperty('tamanhoHelice', 60)
      expect(result).toHaveProperty('quantidadeHelices')
      expect(result).toHaveProperty('quantidadeMotoresSerie')
      expect(result).toHaveProperty('quantidadeMotoresTradicionais')
      expect(result).toHaveProperty('motor')
      expect(result).toHaveProperty('consumoMensalSerie')
      expect(result).toHaveProperty('consumoMensalTradicional')
      expect(result).toHaveProperty('custoMensalSerie')
      expect(result).toHaveProperty('custoMensalTradicional')
      expect(result).toHaveProperty('economia')
      expect(result).toHaveProperty('horasUso', 8)
      expect(result).toHaveProperty('valorKw', 0.77)
    })

    it('deve calcular quantidade de hélices corretamente', () => {
      // 200m² / 20m² por hélice (60cm) = 10 hélices
      const result = calcularSimulacao(200, 60, 8, 0.77)
      expect(result.quantidadeHelices).toBe(10)
    })

    it('deve calcular quantidade de motores em série corretamente (hélice ≤70cm: 10 por motor)', () => {
      // 10 hélices / 10 por motor = 1 motor
      const result = calcularSimulacao(200, 60, 8, 0.77)
      expect(result.quantidadeMotoresSerie).toBe(1)
    })

    it('deve calcular quantidade de motores em série para hélice 100cm (5 por motor)', () => {
      // 500m² / 50m² = 10 hélices / 5 por motor = 2 motores
      const result = calcularSimulacao(500, 100, 8, 0.77)
      expect(result.quantidadeMotoresSerie).toBe(2)
    })

    it('deve calcular quantidade de motores em série para hélice 120cm (5 por motor)', () => {
      // 600m² / 60m² = 10 hélices / 5 por motor = 2 motores
      const result = calcularSimulacao(600, 120, 8, 0.77)
      expect(result.quantidadeMotoresSerie).toBe(2)
    })

    it('quantidade de motores tradicionais deve ser igual à quantidade de hélices', () => {
      const result = calcularSimulacao(300, 70, 10, 0.85)
      expect(result.quantidadeMotoresTradicionais).toBe(result.quantidadeHelices)
    })
  })

  describe('Motor selecionado', () => {
    it('deve selecionar motor 90YT120 para hélices ≤70cm', () => {
      expect(calcularSimulacao(100, 50, 8, 0.77).motor.modelo).toBe('90YT120')
      expect(calcularSimulacao(200, 60, 8, 0.77).motor.modelo).toBe('90YT120')
      expect(calcularSimulacao(300, 70, 8, 0.77).motor.modelo).toBe('90YT120')
    })

    it('deve selecionar motor 100YT250 para hélices 100cm e 120cm', () => {
      expect(calcularSimulacao(500, 100, 8, 0.77).motor.modelo).toBe('100YT250')
      expect(calcularSimulacao(600, 120, 8, 0.77).motor.modelo).toBe('100YT250')
    })

    it('motor deve ter potência em watts', () => {
      const result = calcularSimulacao(200, 60, 8, 0.77)
      expect(result.motor.potencia).toBeGreaterThan(0)
      expect(typeof result.motor.potencia).toBe('number')
    })
  })

  describe('Consumo e custo mensal', () => {
    it('consumo em série deve ser menor que tradicional', () => {
      const result = calcularSimulacao(500, 100, 12, 0.90)
      expect(result.consumoMensalSerie).toBeLessThan(result.consumoMensalTradicional)
    })

    it('custo em série deve ser menor que tradicional', () => {
      const result = calcularSimulacao(300, 70, 8, 0.77)
      expect(result.custoMensalSerie).toBeLessThan(result.custoMensalTradicional)
    })

    it('economia deve ser a diferença entre custo tradicional e série', () => {
      const result = calcularSimulacao(200, 60, 8, 0.77)
      expect(result.economia).toBeCloseTo(
        result.custoMensalTradicional - result.custoMensalSerie, 5
      )
    })

    it('economia nunca deve ser negativa', () => {
      HELICE_OPTIONS.forEach((helice) => {
        const result = calcularSimulacao(100, helice, 8, 0.77)
        expect(result.economia).toBeGreaterThanOrEqual(0)
      })
    })

    it('consumo deve aumentar com horas de uso', () => {
      const result4h = calcularSimulacao(200, 60, 4, 0.77)
      const result12h = calcularSimulacao(200, 60, 12, 0.77)

      expect(result12h.consumoMensalSerie).toBeGreaterThan(result4h.consumoMensalSerie)
      expect(result12h.custoMensalSerie).toBeGreaterThan(result4h.custoMensalSerie)
    })

    it('custo deve aumentar com valor do kWh', () => {
      const resultBarato = calcularSimulacao(200, 60, 8, 0.50)
      const resultCaro = calcularSimulacao(200, 60, 8, 1.20)

      expect(resultCaro.custoMensalSerie).toBeGreaterThan(resultBarato.custoMensalSerie)
      expect(resultCaro.economia).toBeGreaterThan(resultBarato.economia)
    })
  })

  describe('Cenários por tamanho de hélice', () => {
    HELICE_OPTIONS.forEach((helice) => {
      it(`deve calcular corretamente para hélice ${helice}cm`, () => {
        const result = calcularSimulacao(500, helice, 10, 0.85)

        expect(result.quantidadeHelices).toBeGreaterThan(0)
        expect(result.quantidadeMotoresSerie).toBeGreaterThan(0)
        expect(result.consumoMensalSerie).toBeGreaterThan(0)
        expect(result.custoMensalSerie).toBeGreaterThan(0)
      })
    })
  })

  describe('Cenários com estados brasileiros', () => {
    it('deve calcular para todos os estados com hélice sugerida', () => {
      Object.entries(TARIFAS_POR_ESTADO).forEach(([estado, tarifa]) => {
        const espaco = 300
        const helice = sugerirHelice(espaco)
        const result = calcularSimulacao(espaco, helice, 8, tarifa)

        expect(result.economia).toBeGreaterThanOrEqual(0)
        expect(result.custoMensalSerie).toBeGreaterThanOrEqual(0)
        expect(result.custoMensalTradicional).toBeGreaterThanOrEqual(0)
      })
    })
  })

  describe('Casos limite', () => {
    it('deve funcionar com espaço muito pequeno (1m²)', () => {
      const result = calcularSimulacao(1, 50, 8, 0.77)
      expect(result.quantidadeHelices).toBe(1)
    })

    it('deve funcionar com espaço muito grande (10000m²)', () => {
      const result = calcularSimulacao(10000, 120, 24, 0.95)
      expect(result.quantidadeHelices).toBeGreaterThan(0)
      expect(result.economia).toBeGreaterThan(0)
    })

    it('deve funcionar com 0 horas de uso', () => {
      const result = calcularSimulacao(200, 60, 0, 0.77)
      expect(result.consumoMensalSerie).toBe(0)
      expect(result.custoMensalSerie).toBe(0)
      expect(result.economia).toBe(0)
    })

    it('deve funcionar com valorKw = 0', () => {
      const result = calcularSimulacao(200, 60, 8, 0)
      expect(result.custoMensalSerie).toBe(0)
      expect(result.custoMensalTradicional).toBe(0)
      expect(result.economia).toBe(0)
    })
  })
})

// ====================== calcularOrcamento ======================

describe('calculator - calcularOrcamento()', () => {
  it('deve retornar objeto com todas as propriedades esperadas', () => {
    const simulacao = calcularSimulacao(200, 60, 8, 0.77)
    const orcamento = calcularOrcamento(simulacao)

    expect(orcamento).toHaveProperty('totalHelices')
    expect(orcamento).toHaveProperty('totalMotores')
    expect(orcamento).toHaveProperty('totalInvestimento')
    expect(orcamento).toHaveProperty('mesesParaRetorno')
  })

  it('totalInvestimento deve ser soma de hélices + motores', () => {
    const simulacao = calcularSimulacao(200, 60, 8, 0.77)
    const orcamento = calcularOrcamento(simulacao)

    expect(orcamento.totalInvestimento).toBe(orcamento.totalHelices + orcamento.totalMotores)
  })

  it('deve calcular preço de hélices corretamente (60cm = R$600)', () => {
    // 200m² / 20m² por hélice = 10 hélices * R$600 = R$6000
    const simulacao = calcularSimulacao(200, 60, 8, 0.77)
    const orcamento = calcularOrcamento(simulacao)

    expect(orcamento.totalHelices).toBe(10 * 600)
  })

  it('deve calcular preço de motores corretamente', () => {
    // 10 hélices / 10 por motor = 1 motor 90YT120 (120W = R$1400)
    const simulacao = calcularSimulacao(200, 60, 8, 0.77)
    const orcamento = calcularOrcamento(simulacao)

    expect(orcamento.totalMotores).toBe(1 * 1400)
  })

  it('mesesParaRetorno deve ser positivo quando há economia', () => {
    const simulacao = calcularSimulacao(500, 100, 12, 0.90)
    const orcamento = calcularOrcamento(simulacao)

    expect(orcamento.mesesParaRetorno).toBeGreaterThan(0)
  })

  it('mesesParaRetorno deve ser null quando economia é 0', () => {
    const simulacao = calcularSimulacao(200, 60, 0, 0.77) // 0 horas = 0 economia
    const orcamento = calcularOrcamento(simulacao)

    expect(orcamento.mesesParaRetorno).toBeNull()
  })

  it('deve calcular para cada tamanho de hélice com preços corretos', () => {
    const precosEsperados = { 50: 500, 60: 600, 70: 700, 100: 1200, 120: 1500 }

    Object.entries(precosEsperados).forEach(([tamanho, preco]) => {
      const t = Number(tamanho)
      const simulacao = calcularSimulacao(1000, t, 8, 0.77)
      const orcamento = calcularOrcamento(simulacao)

      expect(orcamento.totalHelices).toBe(simulacao.quantidadeHelices * preco)
    })
  })

  it('investimento deve crescer com o tamanho do espaço', () => {
    const orc100 = calcularOrcamento(calcularSimulacao(100, 60, 8, 0.77))
    const orc500 = calcularOrcamento(calcularSimulacao(500, 60, 8, 0.77))
    const orc2000 = calcularOrcamento(calcularSimulacao(2000, 60, 8, 0.77))

    expect(orc500.totalInvestimento).toBeGreaterThan(orc100.totalInvestimento)
    expect(orc2000.totalInvestimento).toBeGreaterThan(orc500.totalInvestimento)
  })
})
