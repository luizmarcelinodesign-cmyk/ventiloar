import { useState } from 'react'
import { TARIFAS_POR_ESTADO, HELICE_OPTIONS, sugerirHelice, calcularSimulacao, calcularOrcamento } from '../utils/calculator'
import { whatsappLink, whatsappShareLink } from '../utils/whatsapp'
import { addDocument } from '../services/storageService'

const fmtBRL = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtKWh = (v) => `${Number(v).toFixed(2)} kWh`
const fmtNum = (v) => Number(v).toLocaleString('pt-BR')

const ESTADOS = Object.keys(TARIFAS_POR_ESTADO)

export default function Orcamento() {
  const [form, setForm] = useState({
    tamanhoEspaco: '150',
    tamanhoHelice: '60',
    horasUso: '8',
    estado: 'Ceará',
    valorKw: '0.77',
    nome: '',
    email: '',
    telefone: '',
    tipoEspaco: '',
    endereco: '',
  })

  const [simulacao, setSimulacao] = useState(null)
  const [orcamento, setOrcamento] = useState(null)
  const [leadStatus, setLeadStatus] = useState(null)
  const [savingLead, setSavingLead] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  function handleChange(e) {
    const { name, value } = e.target
    setFieldErrors((prev) => {
      if (!prev[name]) return prev
      const next = { ...prev }
      delete next[name]
      return next
    })

    setForm((prev) => {
      const next = { ...prev, [name]: value }
      if (name === 'tamanhoEspaco') {
        const espaco = parseFloat(value)
        if (espaco > 0) next.tamanhoHelice = String(sugerirHelice(espaco))
      }
      if (name === 'estado') {
        const tarifa = TARIFAS_POR_ESTADO[value]
        if (tarifa) next.valorKw = String(tarifa)
      }
      return next
    })
  }

  function validateLeadFields() {
    const errors = {}

    if (!form.nome.trim()) errors.nome = 'Informe seu nome.'
    if (!form.email.trim()) {
      errors.email = 'Informe seu email.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = 'Informe um email válido.'
    }
    if (!form.tipoEspaco.trim()) errors.tipoEspaco = 'Informe o tipo de espaço.'
    if (!form.endereco.trim()) errors.endereco = 'Informe o endereço do local.'

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleCalcular(e) {
    e.preventDefault()
    const tamanhoEspaco = parseFloat(form.tamanhoEspaco)
    const tamanhoHelice = parseInt(form.tamanhoHelice)
    const horasUso = parseFloat(form.horasUso)
    const valorKw = parseFloat(form.valorKw)
    if (!tamanhoEspaco || !horasUso || !valorKw) return
    setSimulacao(calcularSimulacao(tamanhoEspaco, tamanhoHelice, horasUso, valorKw))
    setOrcamento(null)
    setLeadStatus(null)
  }

  async function salvarLeadNoBanco(status = 'Novo') {
    if (!simulacao) return null

    const payload = {
      clientName: form.nome.trim(),
      clientEmail: form.email.trim(),
      clientPhone: form.telefone.trim() || null,
      totalValue: orcamento?.totalInvestimento || null,
      status,
      simulacao: {
        nome: form.nome,
        email: form.email,
        telefone: form.telefone,
        tipoEspaco: form.tipoEspaco,
        endereco: form.endereco,
        estado: form.estado,
        valorKw: Number(form.valorKw),
        ...simulacao,
        orcamento,
      },
    }

    setSavingLead(true)
    try {
      const created = await addDocument('budgets', payload, 'site_orcamento')
      return created
    } catch (err) {
      console.error('Erro ao salvar lead:', err)
      return null
    } finally {
      setSavingLead(false)
    }
  }

  async function handleEnviarWhatsApp() {
    if (!simulacao) return
    if (!validateLeadFields()) {
      return
    }
    setLeadStatus(null)
    await salvarLeadNoBanco('Solicitado')
    const msg = [
      'Ola, tenho interesse no sistema Ventiloar e gostaria de um orcamento.',
      `Nome: ${form.nome}`,
      `Email: ${form.email}`,
      form.telefone.trim() ? `Telefone: ${form.telefone}` : null,
      `Endereco: ${form.endereco}`,
      `Tipo de Espaco: ${form.tipoEspaco}`,
      '',
      'Resultados da Simulacao:',
      `Tamanho do Espaco: ${simulacao.tamanhoEspaco} m²`,
      `Helice Escolhida: ${simulacao.tamanhoHelice} cm`,
      `Quantidade de Helices: ${fmtNum(simulacao.quantidadeHelices)}`,
      `Motores em Serie: ${fmtNum(simulacao.quantidadeMotoresSerie)}`,
      `Motor (Serie): ${simulacao.motor.modelo} (${simulacao.motor.potencia} W)`,
      '',
      'COMPARAÇÃO DE CONSUMO',
      `Motores Tradicionais: ${fmtNum(simulacao.quantidadeMotoresTradicionais)}`,
      `Serie (Mensal): ${fmtKWh(simulacao.consumoMensalSerie)}`,
      `Custo Serie: ${fmtBRL(simulacao.custoMensalSerie)}`,
      `Tradicional (Mensal): ${fmtKWh(simulacao.consumoMensalTradicional)}`,
      `Custo Tradicional: ${fmtBRL(simulacao.custoMensalTradicional)}`,
      `Economia Estimada: ${fmtBRL(simulacao.economia)}`,
    ].filter(Boolean).join('\n')
    window.open(whatsappLink(msg), '_blank')
    setLeadStatus({ type: 'success', text: 'Solicitação enviada com sucesso. Nossa equipe entrará em contato.' })
  }

  async function handleSimularOrcamento() {
    if (!simulacao) return
    if (!validateLeadFields()) {
      return
    }
    setLeadStatus(null)
    const novoOrcamento = calcularOrcamento(simulacao)
    setOrcamento(novoOrcamento)
    await salvarLeadNoBanco('Simulado')
    setLeadStatus({ type: 'success', text: 'Orçamento simulado com sucesso.' })
  }

  function handleCompartilharOrcamento() {
    if (!simulacao || !orcamento) return
    const retornoTxt = orcamento.mesesParaRetorno ? `${orcamento.mesesParaRetorno} meses` : 'não aplicável'
    const msg = [
      '*ORÇAMENTO SIMULADO - SISTEMA VENTILOAR*',
      '',
      `Cliente: ${form.nome}`,
      `Email: ${form.email}`,
      form.telefone.trim() ? `Telefone: ${form.telefone}` : null,
      `Local: ${form.tipoEspaco} - ${form.endereco}`,
      '',
      '*Detalhes do Sistema:*',
      `- Tamanho do Espaço: ${simulacao.tamanhoEspaco} m²`,
      `- Hélice: ${simulacao.tamanhoHelice} cm`,
      `- Quantidade de Hélices: ${fmtNum(simulacao.quantidadeHelices)}`,
      `- Motores em Série: ${fmtNum(simulacao.quantidadeMotoresSerie)}`,
      `- Potência do Motor: ${simulacao.motor.potencia} W`,
      '',
      '*Investimento:*',
      `- Hélices e kits: ${fmtBRL(orcamento.totalHelices)}`,
      `- Motores: ${fmtBRL(orcamento.totalMotores)}`,
      `- *TOTAL: ${fmtBRL(orcamento.totalInvestimento)}*`,
      '',
      '*Economia Estimada:*',
      `- Mensal: ${fmtBRL(simulacao.economia)}`,
      `- Recuperação do investimento: ${retornoTxt}`,
      '',
      '_*Projetação Empreendimentos Ltda*_',
      '_CNPJ: 47.950.352/0001-71_',
      '_Contato: (88) 99476-0657_',
    ].filter(Boolean).join('\n')
    window.open(whatsappShareLink(msg), '_blank')
  }

  return (
    <main className="relative min-h-screen">
      <div className="absolute inset-0 technical-grid opacity-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-8 py-16 md:py-20 relative z-10">
        {/* Header */}
        <header className="mb-12 md:mb-16">
          <div className="flex items-baseline gap-4 mb-2">
            <span className="text-primary-container font-headline font-bold text-sm tracking-[0.2em] uppercase">
              Simulação &amp; Orçamento
            </span>
            <div className="h-[1px] flex-grow bg-outline-variant opacity-20" />
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-headline font-bold uppercase tracking-tighter leading-none mb-4">
            Fazer Orçamento
          </h1>
          <p className="text-on-surface-variant max-w-xl mt-4">
            Calcule a economia e gere seu orçamento em poucos passos
          </p>
          <div className="w-24 h-1 bg-primary-container mt-4" />
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form Column */}
          <div className="lg:col-span-7 space-y-8">
            {/* Step 1: Dados para Simulação */}
            <section className="bg-surface-container-low p-6 md:p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="material-symbols-outlined text-8xl md:text-9xl">engineering</span>
              </div>
              <div className="flex items-center gap-2 mb-8">
                <span className="text-primary border border-primary/30 px-2 py-1 text-[10px] font-headline font-bold">01</span>
                <h2 className="font-headline font-bold uppercase text-xl tracking-tight">Dados para Simulação</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-headline font-bold text-on-surface-variant uppercase tracking-widest ml-1">
                    Tamanho do Espaço (m²) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="tamanhoEspaco"
                    value={form.tamanhoEspaco}
                    onChange={handleChange}
                    placeholder="Ex: 150"
                    min="1"
                    required
                    className="w-full bg-surface-container border-none focus:ring-0 border-b-2 border-transparent focus:border-primary-container text-on-surface placeholder:text-outline/50 transition-all py-3 px-4"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-headline font-bold text-on-surface-variant uppercase tracking-widest ml-1 flex items-center gap-2">
                    Tamanho da Hélice
                    <span className="text-[8px] bg-primary-container/20 text-primary-container px-2 py-0.5 rounded-full normal-case tracking-normal">
                      Sugerido
                    </span>
                  </label>
                  <select
                    name="tamanhoHelice"
                    value={form.tamanhoHelice}
                    onChange={handleChange}
                    className="w-full bg-surface-container border-none focus:ring-0 border-b-2 border-transparent focus:border-primary-container text-on-surface transition-all py-3 px-4 appearance-none"
                  >
                    {HELICE_OPTIONS.map((v) => (
                      <option key={v} value={v}>{v} cm</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-headline font-bold text-on-surface-variant uppercase tracking-widest ml-1">
                    Horas de Uso por Dia <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="horasUso"
                    value={form.horasUso}
                    onChange={handleChange}
                    placeholder="Ex: 8"
                    min="1"
                    max="24"
                    required
                    className="w-full bg-surface-container border-none focus:ring-0 border-b-2 border-transparent focus:border-primary-container text-on-surface placeholder:text-outline/50 transition-all py-3 px-4"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-headline font-bold text-on-surface-variant uppercase tracking-widest ml-1">
                    Estado
                  </label>
                  <select
                    name="estado"
                    value={form.estado}
                    onChange={handleChange}
                    className="w-full bg-surface-container border-none focus:ring-0 border-b-2 border-transparent focus:border-primary-container text-on-surface transition-all py-3 px-4 appearance-none"
                  >
                    {ESTADOS.map((uf) => (
                      <option key={uf} value={uf}>{uf}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-headline font-bold text-on-surface-variant uppercase tracking-widest ml-1">
                    Valor do kWh (R$) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="valorKw"
                    value={form.valorKw}
                    onChange={handleChange}
                    step="0.01"
                    min="0.01"
                    required
                    className="w-full bg-surface-container-high border-none focus:ring-0 border-b-2 border-transparent focus:border-primary-container text-primary font-mono transition-all py-3 px-4"
                  />
                  <p className="text-[9px] text-on-surface-variant/60 ml-1 mt-1">
                    Valor estimado por estado. Ajuste se souber sua tarifa exata.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={handleCalcular}
                  className="flex items-center gap-3 bg-surface-container-highest hover:bg-primary-container hover:text-on-primary-container transition-all px-6 md:px-8 py-4 font-headline font-bold uppercase tracking-widest text-xs"
                >
                  <span className="material-symbols-outlined text-sm">calculate</span>
                  Calcular Economia
                </button>
              </div>
            </section>

            {/* Step 2: Solicitar Orçamento */}
            <section className="bg-surface-container-low p-6 md:p-8">
              <div className="flex items-center gap-2 mb-8">
                <span className="text-primary border border-primary/30 px-2 py-1 text-[10px] font-headline font-bold">02</span>
                <h2 className="font-headline font-bold uppercase text-xl tracking-tight">Solicitar Orçamento</h2>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-headline font-bold text-on-surface-variant uppercase tracking-widest ml-1">
                    Nome Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nome"
                    value={form.nome}
                    onChange={handleChange}
                    placeholder="Seu nome completo"
                    required
                    className={`w-full bg-surface-container border-none focus:ring-0 border-b-2 text-on-surface placeholder:text-outline/50 transition-all py-3 px-4 ${fieldErrors.nome ? 'border-red-500 focus:border-red-500' : 'border-transparent focus:border-primary-container'}`}
                  />
                  {fieldErrors.nome && <p className="text-[10px] text-red-500 ml-1">{fieldErrors.nome}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-headline font-bold text-on-surface-variant uppercase tracking-widest ml-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="seuemail@exemplo.com"
                    required
                    className={`w-full bg-surface-container border-none focus:ring-0 border-b-2 text-on-surface placeholder:text-outline/50 transition-all py-3 px-4 ${fieldErrors.email ? 'border-red-500 focus:border-red-500' : 'border-transparent focus:border-primary-container'}`}
                  />
                  {fieldErrors.email && <p className="text-[10px] text-red-500 ml-1">{fieldErrors.email}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-headline font-bold text-on-surface-variant uppercase tracking-widest ml-1">
                    Telefone (Opcional)
                  </label>
                  <input
                    type="tel"
                    name="telefone"
                    value={form.telefone}
                    onChange={handleChange}
                    placeholder="(88) 99999-9999"
                    className="w-full bg-surface-container border-none focus:ring-0 border-b-2 border-transparent focus:border-primary-container text-on-surface placeholder:text-outline/50 transition-all py-3 px-4"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-headline font-bold text-on-surface-variant uppercase tracking-widest ml-1">
                    Tipo de Espaço <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="tipoEspaco"
                    value={form.tipoEspaco}
                    onChange={handleChange}
                    placeholder="Onde será instalado? (ex: Galpão, Escola, Igreja...)"
                    required
                    className={`w-full bg-surface-container border-none focus:ring-0 border-b-2 text-on-surface placeholder:text-outline/50 transition-all py-3 px-4 ${fieldErrors.tipoEspaco ? 'border-red-500 focus:border-red-500' : 'border-transparent focus:border-primary-container'}`}
                  />
                  {fieldErrors.tipoEspaco && <p className="text-[10px] text-red-500 ml-1">{fieldErrors.tipoEspaco}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-headline font-bold text-on-surface-variant uppercase tracking-widest ml-1">
                    Endereço do Local <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="endereco"
                    value={form.endereco}
                    onChange={handleChange}
                    placeholder="Endereço completo"
                    required
                    className={`w-full bg-surface-container border-none focus:ring-0 border-b-2 text-on-surface placeholder:text-outline/50 transition-all py-3 px-4 ${fieldErrors.endereco ? 'border-red-500 focus:border-red-500' : 'border-transparent focus:border-primary-container'}`}
                  />
                  {fieldErrors.endereco && <p className="text-[10px] text-red-500 ml-1">{fieldErrors.endereco}</p>}
                </div>
              </div>
            </section>

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
              <button
                type="button"
                onClick={handleEnviarWhatsApp}
                disabled={!simulacao || savingLead}
                className="w-full md:w-auto bg-[#25d366] text-white font-headline font-bold uppercase tracking-[0.15em] text-sm px-10 md:px-12 py-5 text-center flex items-center justify-center gap-4 hover:bg-[#1ebc5b] hover:shadow-[0_0_30px_rgba(37,211,102,0.3)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined">send</span>
                {savingLead ? 'Salvando Lead...' : 'Enviar Solicitação'}
              </button>
              <button
                type="button"
                onClick={handleSimularOrcamento}
                disabled={!simulacao || savingLead}
                className="w-full md:w-auto bg-tertiary-container text-on-tertiary-container font-headline font-bold uppercase tracking-[0.15em] text-sm px-10 md:px-12 py-5 text-center flex items-center justify-center gap-4 hover:shadow-[0_0_30px_rgba(255,177,79,0.3)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined">request_quote</span>
                {savingLead ? 'Salvando Lead...' : 'Simular Orçamento'}
              </button>
            </div>
            {leadStatus && (
              <div className={`p-3 text-xs ${leadStatus.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {leadStatus.text}
              </div>
            )}
            <p className="text-[10px] text-on-surface-variant leading-relaxed">
              "Enviar Solicitação" encaminha seus dados para a equipe Ventiloar via WhatsApp. "Simular Orçamento" gera uma estimativa de valores.
            </p>
          </div>

          {/* Right Column: Results */}
          <aside className="lg:col-span-5 space-y-8">
            {/* Simulation Results */}
            <div className="bg-surface-container-low/60 backdrop-blur-xl p-6 md:p-8 border-l-4 border-primary-container h-fit sticky top-28">
              <h3 className="font-headline font-bold uppercase text-xs tracking-[0.3em] text-primary-container mb-6">
                Resultados da Simulação
              </h3>

              {simulacao ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    {[
                      ['Tamanho do Espaço', `${simulacao.tamanhoEspaco} m²`],
                      ['Hélice', `${simulacao.tamanhoHelice} cm`],
                      ['Qtd. Hélices', fmtNum(simulacao.quantidadeHelices)],
                      ['Motores em Série', fmtNum(simulacao.quantidadeMotoresSerie)],
                      ['Motor', `${simulacao.motor.modelo} (${simulacao.motor.potencia}W)`],
                      ['Motores Tradicionais', fmtNum(simulacao.quantidadeMotoresTradicionais)],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between items-center p-3 bg-surface-container-lowest">
                        <span className="text-[10px] uppercase font-headline text-on-surface-variant tracking-widest">{label}</span>
                        <span className="font-mono text-sm text-on-surface">{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Consumption comparison */}
                  <div className="pt-4 border-t border-outline-variant/10">
                    <div className="text-[10px] uppercase font-headline text-on-surface-variant tracking-widest mb-3">Comparação de Consumo</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-surface-container-lowest p-3">
                        <div className="text-[9px] uppercase font-headline text-primary tracking-widest mb-1">Série</div>
                        <div className="text-sm font-mono text-primary">{fmtKWh(simulacao.consumoMensalSerie)}</div>
                        <div className="text-xs text-on-surface-variant">{fmtBRL(simulacao.custoMensalSerie)}/mês</div>
                      </div>
                      <div className="bg-surface-container-lowest p-3">
                        <div className="text-[9px] uppercase font-headline text-error tracking-widest mb-1">Tradicional</div>
                        <div className="text-sm font-mono text-error">{fmtKWh(simulacao.consumoMensalTradicional)}</div>
                        <div className="text-xs text-on-surface-variant">{fmtBRL(simulacao.custoMensalTradicional)}/mês</div>
                      </div>
                    </div>
                  </div>

                  {/* Economy badge */}
                  <div className="bg-gradient-to-r from-primary-container/20 to-tertiary-container/20 p-4 text-center">
                    <div className="text-[10px] uppercase font-headline text-on-surface-variant tracking-widest mb-1">Economia Mensal</div>
                    <div className="text-3xl font-mono text-tertiary-fixed-dim">{fmtBRL(simulacao.economia)}</div>
                  </div>

                  <div className="p-4 border border-outline-variant/20">
                    <p className="text-sm text-on-surface-variant leading-relaxed italic">
                      * Valores estimados com base em {simulacao.horasUso}h/dia de operação e tarifa de R$ {simulacao.valorKw}/kWh.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-surface-container-lowest p-4">
                    <div className="text-[10px] text-on-surface-variant uppercase font-headline tracking-widest mb-1">Economia Mensal</div>
                    <div className="text-3xl font-mono text-on-surface-variant/30">R$ 0,00</div>
                    <div className="mt-2 h-1 w-full bg-outline-variant/20" />
                  </div>
                  <p className="text-sm text-on-surface-variant/60 italic text-center py-4">
                    Preencha os dados do espaço e clique em "Calcular Economia" para ver os resultados.
                  </p>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-outline-variant/10">
                <div className="flex items-center gap-3 text-xs font-headline font-medium text-on-secondary-container">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  Simulação baseada em dados reais de consumo
                </div>
              </div>
            </div>

            {/* Budget Results */}
            {orcamento && (
              <div className="bg-surface-container-low/60 backdrop-blur-xl p-6 md:p-8 border-l-4 border-tertiary-container">
                <h3 className="font-headline font-bold uppercase text-xs tracking-[0.3em] text-tertiary-container mb-6">
                  Orçamento Simulado
                </h3>
                <div className="space-y-4">
                  <div className="bg-surface-container-lowest p-4">
                    <div className="text-[10px] uppercase font-headline text-on-surface-variant tracking-widest mb-2">Hélices</div>
                    <p className="text-sm text-on-surface">
                      {fmtNum(simulacao.quantidadeHelices)} hélices de {simulacao.tamanhoHelice} cm + engrenagens, cabos, conectores
                    </p>
                    <p className="font-mono text-primary mt-1">{fmtBRL(orcamento.totalHelices)}</p>
                  </div>

                  <div className="bg-surface-container-lowest p-4">
                    <div className="text-[10px] uppercase font-headline text-on-surface-variant tracking-widest mb-2">Motores</div>
                    <p className="text-sm text-on-surface">
                      {fmtNum(simulacao.quantidadeMotoresSerie)} motor(es) em série {simulacao.motor.potencia}W
                    </p>
                    <p className="font-mono text-primary mt-1">{fmtBRL(orcamento.totalMotores)}</p>
                  </div>

                  <div className="bg-primary-container p-4 text-center">
                    <div className="text-[10px] uppercase font-headline text-on-primary-container tracking-widest mb-1">Valor Total</div>
                    <div className="text-2xl font-mono font-bold text-on-primary-container">{fmtBRL(orcamento.totalInvestimento)}</div>
                  </div>

                  {orcamento.mesesParaRetorno && (
                    <div className="bg-gradient-to-r from-primary-container/20 to-tertiary-container/20 p-4 text-center">
                      <div className="text-[10px] uppercase font-headline text-on-surface-variant tracking-widest mb-1">Recuperação do Investimento</div>
                      <div className="text-xl font-mono text-tertiary-fixed-dim">{orcamento.mesesParaRetorno} meses</div>
                    </div>
                  )}

                  <div className="bg-surface-container-lowest p-4 text-xs text-on-surface-variant space-y-1">
                    <p><strong>Projetação Empreendimentos Ltda</strong></p>
                    <p>Sistema Ventiloar</p>
                    <p>CNPJ: 47.950.352/0001-71</p>
                    <p>📞 Contato: (88) 99476-0657</p>
                  </div>

                  <div className="p-3 border border-outline-variant/20 text-center">
                    <p className="text-[10px] text-on-surface-variant">
                      ⚠️ Frete e instalação por conta do cliente.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCompartilharOrcamento}
                    className="w-full bg-[#25d366] text-white font-headline font-bold uppercase tracking-[0.15em] text-xs py-4 flex items-center justify-center gap-3 hover:bg-[#1ebc5b] transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">share</span>
                    Compartilhar Orçamento
                  </button>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  )
}
