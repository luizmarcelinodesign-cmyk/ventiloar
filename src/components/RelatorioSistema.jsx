import { useState, useEffect, useCallback } from 'react'
import { isSupabaseAvailable } from '../services/supabaseClient'
import { listDocuments } from '../services/storageService'
import { getAuditLog } from '../services/auditService'

/* ══════════════════════════════════════════════════════
   FINANCIAL DATA (Dashboard constants)
   ══════════════════════════════════════════════════════ */
const FIN = {
  empresa: 'Projetação Empreendimentos Ltda',
  cnpj: '047.950.352/0001-71',
  conta: 'Bradesco Ag 687 CC 0037844-5',
  periodo: '07/07/2025 a 04/04/2026',
  totalEntradas: 261072.30,
  totalRendimentos: 6141.09,
  totalSaidas: 237103.57,
  saldoReal: 30109.82,
  entradas: [
    { origem: 'FUNCAP (TED 1)', data: '26/09/2025', valor: 169005.93 },
    { origem: 'FUNCAP (TED 2)', data: '26/09/2025', valor: 84502.97 },
    { origem: 'Francisco V Alves (PIX)', data: '08/08/2025', valor: 13.40 },
    { origem: 'Francisco V Alves (PIX)', data: '19/08/2025', valor: 7550.00 },
  ],
  saidas: [
    { tipo: 'Fornecedores e Prestadores', valor: 228571.97, pct: 96.4 },
    { tipo: 'Boletos / Cobranças', valor: 693.02, pct: 0.3 },
    { tipo: 'Impostos — Receita Federal', valor: 4199.75, pct: 1.8 },
    { tipo: 'Impostos — SEFAZ', valor: 2088.20, pct: 0.9 },
    { tipo: 'Tarifas Bancárias', valor: 1550.51, pct: 0.7 },
    { tipo: 'Encargos / IOF', valor: 0.12, pct: 0.0 },
  ],
}

/* ══════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════ */
const fmtBRL = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtPct = (v) => `${Number(v || 0).toFixed(1)}%`

const STATUS_COLORS = {
  Novo:             { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  Simulado:         { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE' },
  Solicitado:       { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
  'Em Atendimento': { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' },
  Fechado:          { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' },
  Perdido:          { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' },
}

const ACTION_STYLE = {
  CREATE: { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' },
  UPDATE: { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
  DELETE: { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' },
}

function readEngStorage() {
  try { return JSON.parse(localStorage.getItem('ventiloar-engenharia') || 'null') } catch { return null }
}
function readPlantStorage() {
  try { return JSON.parse(localStorage.getItem('ventiloar-plantas-tecnicas') || '[]') } catch { return [] }
}

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════ */
export default function RelatorioSistema() {
  const [loading, setLoading] = useState(true)
  const [leads, setLeads] = useState(null)       // null = não carregado
  const [auditLog, setAuditLog] = useState(null) // null = não carregado
  const [supabaseOk, setSupabaseOk] = useState(false)
  const [engData, setEngData] = useState(null)
  const [plantas, setPlantas] = useState([])
  const [generating, setGenerating] = useState(false)

  /* ── Carrega dados ── */
  const loadData = useCallback(async () => {
    setLoading(true)

    // localStorage — sempre disponível
    setEngData(readEngStorage())
    setPlantas(readPlantStorage())

    // Supabase — opcional
    const sbOk = isSupabaseAvailable()
    setSupabaseOk(sbOk)
    if (sbOk) {
      try {
        const [leadsData, auditData] = await Promise.allSettled([
          listDocuments('budgets'),
          getAuditLog({ }),
        ])
        setLeads(leadsData.status === 'fulfilled' ? leadsData.value : [])
        setAuditLog(auditData.status === 'fulfilled' ? auditData.value.slice(0, 50) : [])
      } catch {
        setLeads([]); setAuditLog([])
      }
    }

    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  /* ── Derived ── */
  const eng = engData || {}
  const shoppingList = eng.shoppingList || []
  const products = eng.products || []
  const pricing = eng.pricing || []

  const shoppingTotal = shoppingList.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0), 0)

  const getProductCost = (product) =>
    (product.pieces || []).reduce((sum, piece) => {
      const shopItem = shoppingList.find((i) => i.id === piece.shoppingItemId)
      return sum + (Number(piece.qty) || 0) * (Number(shopItem?.unitPrice) || 0)
    }, 0)

  const calcPrice = (row) => {
    const product = products.find((p) => p.id === row.productId)
    const cost = product ? getProductCost(product) : 0
    const prod = cost * ((Number(row.custoProd) || 0) / 100)
    const sub = cost + prod
    const tax = sub * ((Number(row.impostos) || 0) / 100)
    const subT = sub + tax
    const profit = subT * ((Number(row.lucro) || 0) / 100)
    return subT + profit
  }

  // Leads by status
  const leadsOk = Array.isArray(leads)
  const leadsByStatus = leadsOk
    ? Object.entries(
        leads.reduce((acc, l) => {
          const s = l.status || 'Novo'
          acc[s] = (acc[s] || 0) + 1
          return acc
        }, {})
      ).sort((a, b) => b[1] - a[1])
    : []

  const leadsConvertidos = leadsOk ? leads.filter((l) => l.status === 'Fechado').length : 0
  const leadsAtivos = leadsOk ? leads.filter((l) => !['Fechado', 'Perdido'].includes(l.status || 'Novo')).length : 0
  const leadsLoss = leadsOk ? leads.filter((l) => l.status === 'Perdido').length : 0

  // Audit summary
  const auditOk = Array.isArray(auditLog)
  const auditByAction = auditOk
    ? auditLog.reduce((acc, e) => {
        acc[e.action] = (acc[e.action] || 0) + 1
        return acc
      }, {})
    : {}

  const now = new Date()
  const geradoEm = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) + ' às ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const totalRecursos = FIN.totalEntradas + FIN.totalRendimentos
  const pctExec = ((FIN.totalSaidas / totalRecursos) * 100).toFixed(1)

  /* ══════════════════════════════════════════════════════
     GENERATE PDF
     ══════════════════════════════════════════════════════ */
  const handlePdf = () => {
    setGenerating(true)
    setTimeout(() => {
      const scLead = (status) => { const s = STATUS_COLORS[status] || STATUS_COLORS.Novo; return s }
      const leadsRows = leadsOk && leads.length > 0
        ? leads.slice(0, 80).map(l => {
            const sc = scLead(l.status || 'Novo')
            return `<tr>
            <td>${l.clientName || '—'}</td>
            <td>${l.clientEmail || '—'}</td>
            <td>${l.clientPhone || '—'}</td>
            <td><span class="badge" style="background:${sc.bg};color:${sc.text};border-color:${sc.border}">${l.status || 'Novo'}</span></td>
            <td>${l.simulacao?.tipoEspaco || '—'}</td>
            <td style="text-align:right;font-family:monospace">${fmtBRL(l.simulacao?.valorEstimado || 0)}</td>
            <td style="color:#9CA3AF;font-size:8pt">${l.createdAt ? new Date(l.createdAt).toLocaleDateString('pt-BR') : '—'}</td>
          </tr>`}).join('')
        : '<tr><td colspan="7" style="text-align:center;color:#9CA3AF;padding:10px 0">Dados não disponíveis (Supabase necessário)</td></tr>'


      const shopRows = shoppingList.map(i => {
        const tot = (Number(i.qty) || 0) * (Number(i.unitPrice) || 0)
        return `<tr><td>${i.name || '—'}</td><td style="text-align:center;font-family:monospace">${i.qty}</td><td style="text-align:center;color:#6B7280">${i.unit || 'un'}</td><td style="text-align:right;font-family:monospace">${fmtBRL(i.unitPrice)}</td><td style="text-align:right;font-family:monospace;font-weight:700">${fmtBRL(tot)}</td></tr>`
      }).join('')

      const prodRows = pricing.map(row => {
        const product = products.find(p => p.id === row.productId)
        const cost = product ? getProductCost(product) : 0
        const price = calcPrice(row)
        return `<tr><td style="font-weight:600">${product?.name || '—'}</td><td style="text-align:right;font-family:monospace">${fmtBRL(cost)}</td><td style="text-align:center;color:#6B7280">${row.custoProd || 0}%</td><td style="text-align:center;color:#6B7280">${row.impostos || 0}%</td><td style="text-align:center;color:#6B7280">${row.lucro || 0}%</td><td style="text-align:right;font-family:monospace;font-weight:700;color:#1D4ED8">${fmtBRL(price)}</td></tr>`
      }).join('')

      const auditRows = auditOk && auditLog.length > 0
        ? auditLog.slice(0, 30).map(e => {
            const s = ACTION_STYLE[e.action] || ACTION_STYLE.CREATE
            return `<tr><td style="color:#9CA3AF;font-size:8pt">${e.timestamp ? new Date(e.timestamp).toLocaleString('pt-BR') : '—'}</td><td><span class="badge" style="background:${s.bg};color:${s.text};border-color:${s.border}">${e.action}</span></td><td style="font-family:monospace;font-size:8pt">${e.collection || '—'}</td><td>${e.userId || '—'}</td><td style="color:#9CA3AF;font-size:8pt;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e.documentId || '—'}</td></tr>`
          }).join('')
        : '<tr><td colspan="5" style="text-align:center;color:#9CA3AF;padding:10px 0">Dados não disponíveis (Supabase necessário)</td></tr>'

      const plantasRows = plantas.map(p => `<tr><td style="font-weight:600">${p.name || '—'}</td><td style="font-family:monospace;text-align:center">${p.data?.W || '—'}×${p.data?.H || '—'} m</td><td style="text-align:center">${p.data?.CABO || '—'} m</td><td style="text-align:center">${p.data?.ports?.length || 0}</td><td style="text-align:center;font-weight:700">${((p.data?.W || 0)*(p.data?.H || 0)).toFixed(0)} m²</td><td style="color:#9CA3AF;font-size:8pt">${p.savedAt ? new Date(p.savedAt).toLocaleDateString('pt-BR') : '—'}</td></tr>`).join('')

      const statusSummaryRows = leadsByStatus.map(([st, n]) => {
        const sc = STATUS_COLORS[st] || STATUS_COLORS.Novo
        return `<tr><td><span class="badge" style="background:${sc.bg};color:${sc.text};border-color:${sc.border}">${st}</span></td><td style="text-align:center;font-weight:700">${n}</td><td style="text-align:center;color:#6B7280">${leadsOk && leads.length ? fmtPct((n/leads.length)*100) : '—'}</td></tr>`
      }).join('')

      const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Ventiloar — Relatório do Sistema</title>
<style>
  @page { size: A4 portrait; margin: 15mm 14mm 12mm }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0 }
  body { font-family: Arial, 'Helvetica Neue', sans-serif; font-size: 9.5pt; color: #1a1a1a; background: #fff; line-height: 1.45 }
  .pb { page-break-before: always }

  /* Cover */
  .cover { display: flex; align-items: flex-end; border-bottom: 3px solid #111; margin-bottom: 14px; padding-bottom: 12px }
  .brand { font-size: 24pt; font-weight: 900; letter-spacing: -0.04em; text-transform: uppercase; color: #111; line-height: 1 }
  .brand span { color: #1D4ED8 }
  .brand-sub { font-size: 7.5pt; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.14em; margin-top: 4px }
  .cover-right { margin-left: auto; text-align: right; font-size: 8pt; color: #6B7280; line-height: 1.7 }
  .cover-right strong { color: #111 }

  /* Page header (repeated pages) */
  .pghdr { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #111; padding-bottom: 6px; margin-bottom: 12px; font-size: 7.5pt; color: #6B7280 }
  .pghdr .bname { font-size: 12pt; font-weight: 900; letter-spacing: -0.03em; color: #111; text-transform: uppercase }
  .pghdr .bname span { color: #1D4ED8 }

  /* Sections */
  .sec { font-size: 8pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #111; border-left: 3px solid #1D4ED8; padding-left: 7px; margin: 14px 0 8px }
  .subsec { font-size: 7.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #374151; margin: 10px 0 5px }

  /* KPI grid */
  .kpis { display: grid; gap: 7px; margin-bottom: 12px }
  .k4 { grid-template-columns: repeat(4,1fr) }
  .k3 { grid-template-columns: repeat(3,1fr) }
  .kpi { border: 1px solid #E5E7EB; padding: 9px 10px }
  .kpi.accent { border-left-width: 3px }
  .kpi .val { font-size: 13pt; font-weight: 800; font-family: 'Courier New', monospace; line-height: 1; color: #111 }
  .kpi .lbl { font-size: 6.5pt; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 3px; font-weight: 700 }

  /* Info strip */
  .info { background: #F8FAFC; border: 1px solid #E2E8F0; border-left: 3px solid #1D4ED8; padding: 7px 10px; font-size: 8pt; line-height: 1.7; margin-bottom: 10px; color: #374151 }
  .info b { color: #111 }

  /* Progress */
  .prog-wrap { background: #F3F4F6; height: 8px; border-radius: 2px; overflow: hidden; margin-bottom: 3px }
  .prog-bar { height: 100%; background: #1D4ED8 }
  .prog-label { font-size: 7pt; color: #6B7280; margin-bottom: 10px; text-align: right }

  /* Finance layout */
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 10px }
  .grid13 { display: grid; grid-template-columns: 1fr 2fr; gap: 10px; margin-bottom: 10px }
  .finrow { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #F3F4F6; padding: 5px 0; font-size: 8.5pt }
  .finrow .lab { color: #374151 }
  .finrow .sub { font-size: 7pt; color: #9CA3AF; margin-top: 1px }
  .finrow .val { font-family: 'Courier New', monospace; font-weight: 700; color: #111; white-space: nowrap }
  .finrow.hi .val { color: #1D4ED8 }
  .finrow.red .val { color: #B91C1C }
  .finrow.grn .val { color: #065F46 }
  .finrow.muted { opacity: 0.6 }
  .finrow.border-t2 { border-top: 2px solid #111 }
  .bar-item { margin-bottom: 6px }
  .bar-row { display: flex; justify-content: space-between; font-size: 8pt; color: #374151; margin-bottom: 2px }
  .bar-row .val { font-family: 'Courier New', monospace; font-weight: 600 }
  .bar-wrap { background: #F3F4F6; height: 6px; border-radius: 2px; overflow: hidden }
  .bar-fill { height: 100%; border-radius: 2px }

  /* Tables */
  table { width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 10px }
  thead tr { background: #F9FAFB; border-bottom: 2px solid #E5E7EB }
  th { padding: 5px 8px; text-align: left; font-size: 7pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.09em; color: #9CA3AF }
  td { padding: 5px 8px; border-bottom: 1px solid #F3F4F6; vertical-align: middle; color: #374151 }
  tr:last-child td { border-bottom: none }
  .tfoot td { background: #F9FAFB; border-top: 2px solid #E5E7EB; border-bottom: none; font-weight: 700; color: #111 }

  /* Badge */
  .badge { font-size: 7pt; font-weight: 700; padding: 2px 7px; border-radius: 20px; border: 1px solid; display: inline-block }

  /* Footer */
  .ft { margin-top: 16px; border-top: 1px solid #E5E7EB; padding-top: 7px; font-size: 7pt; color: #9CA3AF; display: flex; justify-content: space-between }

  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact } }
</style>
</head>
<body>

<!-- ══ PÁGINA 1: CAPA + RESUMO + FINANCEIRO ══ -->
<div class="cover">
  <div>
    <div class="brand">VENTILO<span>AR</span></div>
    <div class="brand-sub">Sistema de Ventilação Industrial — Relatório Completo do Sistema</div>
  </div>
  <div class="cover-right">
    <div>Emitido em <strong>${geradoEm}</strong></div>
    <div>${FIN.empresa}</div>
    <div>CNPJ ${FIN.cnpj}</div>
    <div>${FIN.conta}</div>
  </div>
</div>

<div class="sec">Resumo Executivo</div>
<div class="kpis k4">
  <div class="kpi accent" style="border-left-color:#1D4ED8"><div class="val">${fmtBRL(FIN.totalEntradas)}</div><div class="lbl">Total Entradas</div></div>
  <div class="kpi accent" style="border-left-color:#B91C1C"><div class="val">${fmtBRL(FIN.totalSaidas)}</div><div class="lbl">Total Saídas</div></div>
  <div class="kpi accent" style="border-left-color:#065F46"><div class="val">${fmtBRL(FIN.saldoReal)}</div><div class="lbl">Saldo Disponível</div></div>
  <div class="kpi accent" style="border-left-color:#B45309"><div class="val">${pctExec}%</div><div class="lbl">% Executado</div></div>
</div>
<div class="kpis k4">
  <div class="kpi"><div class="val">${shoppingList.length}</div><div class="lbl">Itens de Compra</div></div>
  <div class="kpi"><div class="val">${products.length}</div><div class="lbl">Produtos Eng.</div></div>
  <div class="kpi"><div class="val">${leadsOk ? leads.length : '—'}</div><div class="lbl">Leads / Orçamentos</div></div>
  <div class="kpi"><div class="val">${plantas.length}</div><div class="lbl">Plantas Técnicas</div></div>
</div>

<div class="sec">Financeiro — Prestação de Contas</div>
<div class="info"><b>${FIN.empresa}</b> &nbsp;·&nbsp; CNPJ ${FIN.cnpj} &nbsp;·&nbsp; ${FIN.conta}<br>Período de apuração: <b>${FIN.periodo}</b></div>

<div class="prog-wrap"><div class="prog-bar" style="width:${pctExec}%"></div></div>
<div class="prog-label">Execução dos recursos: ${pctExec}% &nbsp;(${fmtBRL(FIN.totalSaidas)} de ${fmtBRL(totalRecursos)})</div>

<div class="grid2">
  <div>
    <div class="subsec">Entradas Recebidas</div>
    ${FIN.entradas.map(e => `<div class="finrow"><div class="lab">${e.origem}<div class="sub">${e.data}</div></div><div class="val">${fmtBRL(e.valor)}</div></div>`).join('')}
    <div class="finrow hi border-t2"><div class="lab"><b>Total Entradas</b></div><div class="val">${fmtBRL(FIN.totalEntradas)}</div></div>
    <div class="finrow muted"><div class="lab">+ Rendimentos (CDB + CC)</div><div class="val">${fmtBRL(FIN.totalRendimentos)}</div></div>
    <div class="finrow hi" style="border-top:1px solid #E5E7EB"><div class="lab"><b>Total de Recursos</b></div><div class="val">${fmtBRL(totalRecursos)}</div></div>
  </div>
  <div>
    <div class="subsec">Saídas por Categoria</div>
    ${FIN.saidas.map(s => `<div class="bar-item"><div class="bar-row"><span>${s.tipo}</span><span class="val">${fmtBRL(s.valor)}</span></div><div class="bar-wrap"><div class="bar-fill" style="width:${(s.pct/96.4)*100}%;background:${s.pct>50?'#B91C1C':s.pct>1?'#B45309':'#9CA3AF'}"></div></div></div>`).join('')}
    <div class="finrow red border-t2" style="margin-top:6px"><div class="lab"><b>Total Saídas</b></div><div class="val">${fmtBRL(FIN.totalSaidas)}</div></div>
    <div class="finrow grn"><div class="lab"><b>Saldo Disponível</b></div><div class="val">${fmtBRL(FIN.saldoReal)}</div></div>
  </div>
</div>

<!-- ══ PÁGINA 2: ENGENHARIA ══ -->
<div class="pb"></div>
<div class="pghdr">
  <div class="bname">VENTILO<span>AR</span></div>
  <div>Engenharia &amp; Precificação &nbsp;·&nbsp; ${geradoEm}</div>
</div>

<div class="sec">Engenharia &amp; Precificação</div>
<div class="kpis k4">
  <div class="kpi accent" style="border-left-color:#1D4ED8"><div class="val">${shoppingList.length}</div><div class="lbl">Itens na Lista</div></div>
  <div class="kpi accent" style="border-left-color:#B91C1C"><div class="val">${fmtBRL(shoppingTotal)}</div><div class="lbl">Total em Compras</div></div>
  <div class="kpi accent" style="border-left-color:#065F46"><div class="val">${products.length}</div><div class="lbl">Produtos</div></div>
  <div class="kpi accent" style="border-left-color:#6D28D9"><div class="val">${pricing.length}</div><div class="lbl">Precificações</div></div>
</div>

<div class="subsec">Lista de Compras</div>
${shoppingList.length > 0 ? `<table>
  <thead><tr><th>Item</th><th style="text-align:center">Qtd</th><th style="text-align:center">Un</th><th style="text-align:right">V. Unit.</th><th style="text-align:right">V. Total</th></tr></thead>
  <tbody>${shopRows}</tbody>
  <tfoot><tr class="tfoot"><td colspan="4"><b>TOTAL DA LISTA</b></td><td style="text-align:right;font-family:monospace;color:#1D4ED8">${fmtBRL(shoppingTotal)}</td></tr></tfoot>
</table>` : '<p style="font-size:8pt;color:#9CA3AF;margin-bottom:8px">Nenhum item cadastrado.</p>'}

<div class="subsec" style="margin-top:12px">Precificação de Produtos</div>
${pricing.length > 0 ? `<table>
  <thead><tr><th>Produto</th><th style="text-align:right">Custo Total</th><th style="text-align:center">C. Prod.</th><th style="text-align:center">Impostos</th><th style="text-align:center">Lucro</th><th style="text-align:right">Preço Final</th></tr></thead>
  <tbody>${prodRows}</tbody>
</table>` : '<p style="font-size:8pt;color:#9CA3AF;margin-bottom:8px">Nenhuma precificação cadastrada.</p>'}

<!-- ══ PÁGINA 3: LEADS + PLANTAS + AUDITORIA ══ -->
<div class="pb"></div>
<div class="pghdr">
  <div class="bname">VENTILO<span>AR</span></div>
  <div>Leads, Plantas Técnicas &amp; Auditoria &nbsp;·&nbsp; ${geradoEm}</div>
</div>

<div class="sec">Leads / Orçamentos Solicitados</div>
${leadsOk ? `<div class="kpis k4">
  <div class="kpi accent" style="border-left-color:#1D4ED8"><div class="val">${leads.length}</div><div class="lbl">Total</div></div>
  <div class="kpi accent" style="border-left-color:#065F46"><div class="val">${leadsConvertidos}</div><div class="lbl">Convertidos</div></div>
  <div class="kpi accent" style="border-left-color:#B45309"><div class="val">${leadsAtivos}</div><div class="lbl">Em Aberto</div></div>
  <div class="kpi accent" style="border-left-color:#B91C1C"><div class="val">${leadsLoss}</div><div class="lbl">Perdidos</div></div>
</div>
<div class="grid13">
  <div>
    <div class="subsec">Por Status</div>
    <table><thead><tr><th>Status</th><th style="text-align:center">Qtd</th><th style="text-align:center">%</th></tr></thead><tbody>${statusSummaryRows}</tbody></table>
  </div>
  <div>
    <div class="subsec">Relação de Leads</div>
    <table><thead><tr><th>Nome</th><th>E-mail</th><th>Telefone</th><th>Status</th><th>Espaço</th><th style="text-align:right">Estimativa</th><th>Data</th></tr></thead><tbody>${leadsRows}</tbody></table>
  </div>
</div>` : '<p style="font-size:8pt;color:#9CA3AF;margin-bottom:10px">Dados não disponíveis — Supabase necessário.</p>'}

<div class="sec" style="margin-top:14px">Plantas Técnicas Salvas</div>
${plantas.length > 0 ? `<table>
  <thead><tr><th>Nome</th><th style="text-align:center">Dimensão</th><th style="text-align:center">Cabo</th><th style="text-align:center">Portas</th><th style="text-align:center">Área</th><th>Salvo em</th></tr></thead>
  <tbody>${plantasRows}</tbody>
</table>` : '<p style="font-size:8pt;color:#9CA3AF;margin-bottom:10px">Nenhuma planta técnica salva.</p>'}

<div class="sec" style="margin-top:14px">Auditoria — Últimas Ações</div>
${auditOk && auditLog.length > 0 ? `<div class="kpis k3" style="margin-bottom:8px">
  <div class="kpi accent" style="border-left-color:#065F46"><div class="val">${auditByAction['CREATE'] || 0}</div><div class="lbl">Criações</div></div>
  <div class="kpi accent" style="border-left-color:#B45309"><div class="val">${auditByAction['UPDATE'] || 0}</div><div class="lbl">Atualizações</div></div>
  <div class="kpi accent" style="border-left-color:#B91C1C"><div class="val">${auditByAction['DELETE'] || 0}</div><div class="lbl">Exclusões</div></div>
</div>
<table><thead><tr><th>Data/Hora</th><th>Ação</th><th>Coleção</th><th>Usuário</th><th>Document ID</th></tr></thead><tbody>${auditRows}</tbody></table>
` : '<p style="font-size:8pt;color:#9CA3AF">Dados não disponíveis — Supabase necessário.</p>'}

<div class="ft">
  <span>Ventiloar &nbsp;·&nbsp; ${FIN.empresa} &nbsp;·&nbsp; CNPJ ${FIN.cnpj}</span>
  <span>Gerado em ${geradoEm}</span>
</div>
</body>
</html>`

      const w = window.open('', '_blank', 'width=960,height=780')
      if (w) {
        w.document.write(html)
        w.document.close()
        w.onload = () => setTimeout(() => w.print(), 500)
      }
      setGenerating(false)
    }, 100)
  }

  /* ══════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════ */
  if (loading) {
    return (
      <div className="flex items-center gap-3 py-16 text-on-surface-variant text-sm">
        <span className="material-symbols-outlined animate-spin text-primary-container">autorenew</span>
        Carregando dados do sistema…
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-outline-variant/20">
        <div>
          <p className="text-sm text-on-surface-variant">Relatório consolidado de todos os módulos do sistema.</p>
          <p className="text-[11px] text-on-surface-variant/40 mt-0.5">Gerado em {geradoEm}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-headline font-bold uppercase tracking-widest bg-surface-container-high text-on-surface-variant border border-outline-variant hover:bg-surface-container-highest transition-colors"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            Atualizar
          </button>
          <button
            onClick={handlePdf}
            disabled={generating}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-headline font-bold uppercase tracking-widest bg-[#1D4ED8] text-white hover:bg-[#1E40AF] disabled:opacity-50 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">{generating ? 'hourglass_empty' : 'picture_as_pdf'}</span>
            {generating ? 'Gerando…' : 'Baixar PDF'}
          </button>
        </div>
      </div>

      {!supabaseOk && (
        <div className="flex items-start gap-3 border border-yellow-500/30 bg-yellow-500/5 px-4 py-3 text-sm text-yellow-400">
          <span className="material-symbols-outlined text-base mt-0.5">info</span>
          <span>Supabase não configurado — leads e auditoria indisponíveis. Engenharia e plantas (localStorage) estão incluídos.</span>
        </div>
      )}

      {/* ══ DOCUMENTO BRANCO ══ */}
      <div className="bg-white text-gray-900 shadow-lg" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>

        {/* Cabeçalho */}
        <div className="flex items-end justify-between px-8 pt-8 pb-5 border-b-[3px] border-gray-900">
          <div>
            <div className="text-3xl font-black uppercase tracking-tight leading-none">
              VENTILO<span className="text-blue-700">AR</span>
            </div>
            <div className="text-[10px] text-gray-400 uppercase tracking-[0.18em] mt-1.5">
              Sistema de Ventilação Industrial — Relatório Completo
            </div>
          </div>
          <div className="text-right text-[11px] text-gray-500 leading-relaxed">
            <div className="font-semibold text-gray-800">{FIN.empresa}</div>
            <div>CNPJ {FIN.cnpj}</div>
            <div className="text-gray-400">Emitido em {geradoEm}</div>
          </div>
        </div>

        <div className="px-8 py-7 divide-y divide-gray-100 space-y-0">

          {/* ── 01 RESUMO EXECUTIVO ── */}
          <section className="pb-8">
            <div className="flex items-center gap-3 mb-5 mt-0">
              <span className="text-[10px] font-black bg-gray-900 text-white px-2 py-0.5 tracking-widest">01</span>
              <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-900 border-l-[3px] border-blue-700 pl-3">Resumo Executivo</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              {[
                { val: fmtBRL(FIN.totalEntradas), lbl: 'Total Entradas',   c: '#1D4ED8' },
                { val: fmtBRL(FIN.totalSaidas),   lbl: 'Total Saídas',     c: '#B91C1C' },
                { val: fmtBRL(FIN.saldoReal),      lbl: 'Saldo Disponível', c: '#065F46' },
                { val: `${pctExec}%`,               lbl: '% Executado',     c: '#B45309' },
              ].map(({ val, lbl, c }) => (
                <div key={lbl} className="border border-gray-200 p-4" style={{ borderLeftWidth: 3, borderLeftColor: c }}>
                  <div className="text-lg font-black font-mono leading-none text-gray-900">{val}</div>
                  <div className="text-[9px] uppercase tracking-widest text-gray-400 mt-1.5 font-bold">{lbl}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { val: shoppingList.length, lbl: 'Itens de compra' },
                { val: products.length,     lbl: 'Produtos eng.' },
                { val: leadsOk ? leads.length : '—', lbl: 'Leads / Orçamentos' },
                { val: plantas.length,      lbl: 'Plantas técnicas' },
              ].map(({ val, lbl }) => (
                <div key={lbl} className="border border-gray-100 bg-gray-50 p-4">
                  <div className="text-2xl font-black font-mono text-gray-700 leading-none">{val}</div>
                  <div className="text-[9px] uppercase tracking-widest text-gray-400 mt-1.5 font-bold">{lbl}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ── 02 FINANCEIRO ── */}
          <section className="py-8">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-[10px] font-black bg-gray-900 text-white px-2 py-0.5 tracking-widest">02</span>
              <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-900 border-l-[3px] border-blue-700 pl-3">Financeiro — Prestação de Contas</h2>
            </div>

            <div className="bg-blue-50 border border-blue-100 border-l-[3px] border-l-blue-700 px-4 py-3 text-xs text-gray-600 mb-5 leading-relaxed">
              <strong className="text-gray-900">{FIN.empresa}</strong> &nbsp;·&nbsp; CNPJ {FIN.cnpj} &nbsp;·&nbsp; {FIN.conta}
              &nbsp;·&nbsp; Período: <strong className="text-gray-900">{FIN.periodo}</strong>
            </div>

            <div className="mb-5">
              <div className="flex justify-between text-[11px] text-gray-500 mb-1.5">
                <span>Execução dos recursos</span>
                <span className="font-mono font-bold text-gray-900">{pctExec}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-700 rounded-full" style={{ width: `${pctExec}%` }} />
              </div>
              <div className="text-right text-[10px] text-gray-400 mt-1">{fmtBRL(FIN.totalSaidas)} de {fmtBRL(totalRecursos)}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-blue-700 mb-3">Entradas Recebidas</div>
                {FIN.entradas.map((e, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-100">
                    <div>
                      <div className="text-xs font-medium text-gray-800">{e.origem}</div>
                      <div className="text-[10px] text-gray-400">{e.data}</div>
                    </div>
                    <div className="font-mono text-sm font-bold text-gray-900">{fmtBRL(e.valor)}</div>
                  </div>
                ))}
                <div className="flex items-center justify-between py-2.5 border-t-2 border-gray-900 mt-1">
                  <span className="text-xs font-bold uppercase tracking-wide text-gray-900">Total Entradas</span>
                  <span className="font-mono text-sm font-black text-blue-700">{fmtBRL(FIN.totalEntradas)}</span>
                </div>
                <div className="flex items-center justify-between py-2 text-gray-400">
                  <span className="text-[11px]">+ Rendimentos (CDB + CC)</span>
                  <span className="font-mono text-[11px]">{fmtBRL(FIN.totalRendimentos)}</span>
                </div>
                <div className="flex items-center justify-between py-2.5 border-t border-gray-200">
                  <span className="text-xs font-bold text-gray-700">Total de Recursos</span>
                  <span className="font-mono text-sm font-bold text-gray-900">{fmtBRL(totalRecursos)}</span>
                </div>
              </div>
              <div>
                <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-red-700 mb-3">Saídas por Categoria</div>
                {FIN.saidas.map((s, i) => (
                  <div key={i} className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">{s.tipo}</span>
                      <span className="font-mono font-semibold text-gray-900">{fmtBRL(s.valor)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(s.pct / 96.4) * 100}%`, background: s.pct > 50 ? '#B91C1C' : s.pct > 1 ? '#B45309' : '#9CA3AF' }} />
                    </div>
                    <div className="text-right text-[9px] text-gray-400 mt-0.5">{fmtPct(s.pct)}</div>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 border-t-2 border-gray-900">
                  <span className="text-xs font-bold uppercase tracking-wide text-gray-900">Total Saídas</span>
                  <span className="font-mono text-sm font-black text-red-700">{fmtBRL(FIN.totalSaidas)}</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs font-bold text-gray-700">Saldo Disponível</span>
                  <span className="font-mono text-sm font-black text-green-800">{fmtBRL(FIN.saldoReal)}</span>
                </div>
              </div>
            </div>
          </section>

          {/* ── 03 ENGENHARIA ── */}
          <section className="py-8">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-[10px] font-black bg-gray-900 text-white px-2 py-0.5 tracking-widest">03</span>
              <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-900 border-l-[3px] border-blue-700 pl-3">Engenharia &amp; Precificação</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { val: shoppingList.length,   lbl: 'Itens de compra',     c: '#1D4ED8' },
                { val: fmtBRL(shoppingTotal),  lbl: 'Total em compras',    c: '#B91C1C' },
                { val: products.length,        lbl: 'Produtos cadastrados', c: '#065F46' },
                { val: pricing.length,         lbl: 'Precificações ativas', c: '#6D28D9' },
              ].map(({ val, lbl, c }) => (
                <div key={lbl} className="border border-gray-200 p-4" style={{ borderLeftWidth: 3, borderLeftColor: c }}>
                  <div className="text-lg font-black font-mono leading-none text-gray-900">{val}</div>
                  <div className="text-[9px] uppercase tracking-widest text-gray-400 mt-1.5 font-bold">{lbl}</div>
                </div>
              ))}
            </div>

            {shoppingList.length === 0 && products.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhum dado de engenharia. Acesse a aba Engenharia para cadastrar itens.</p>
            ) : (
              <div className="space-y-6">
                {shoppingList.length > 0 && (
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">Lista de Compras</div>
                    <table className="w-full text-xs border-collapse">
                      <thead><tr className="bg-gray-50 border-y border-gray-200">
                        {['Item', 'Qtd', 'Un', 'V. Unitário', 'V. Total'].map((h, i) => (
                          <th key={h} className={`px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-gray-400 ${i > 0 ? 'text-right' : 'text-left'}`}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {shoppingList.map((item) => {
                          const tot = (Number(item.qty) || 0) * (Number(item.unitPrice) || 0)
                          return (
                            <tr key={item.id} className="border-b border-gray-100">
                              <td className="px-3 py-2 text-gray-800">{item.name || '—'}</td>
                              <td className="px-3 py-2 text-right font-mono text-gray-700">{item.qty}</td>
                              <td className="px-3 py-2 text-right text-gray-500">{item.unit}</td>
                              <td className="px-3 py-2 text-right font-mono text-gray-700">{fmtBRL(item.unitPrice)}</td>
                              <td className="px-3 py-2 text-right font-mono font-bold text-gray-900">{fmtBRL(tot)}</td>
                            </tr>
                          )
                        })}
                        <tr className="bg-gray-50 border-t-2 border-gray-300">
                          <td className="px-3 py-2 font-bold text-[10px] uppercase tracking-widest text-gray-600" colSpan={4}>Total da Lista</td>
                          <td className="px-3 py-2 text-right font-mono font-black text-blue-700">{fmtBRL(shoppingTotal)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
                {pricing.length > 0 && (
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-gray-500 mb-2">Precificação de Produtos</div>
                    <table className="w-full text-xs border-collapse">
                      <thead><tr className="bg-gray-50 border-y border-gray-200">
                        {['Produto', 'Custo Total', 'C. Prod.', 'Impostos', 'Lucro', 'Preço Final'].map((h, i) => (
                          <th key={h} className={`px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-gray-400 ${i > 0 ? 'text-right' : 'text-left'}`}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {pricing.map((row) => {
                          const product = products.find(p => p.id === row.productId)
                          const cost = product ? getProductCost(product) : 0
                          const price = calcPrice(row)
                          return (
                            <tr key={row.id || row.productId} className="border-b border-gray-100">
                              <td className="px-3 py-2 text-gray-800 font-medium">{product?.name || '—'}</td>
                              <td className="px-3 py-2 text-right font-mono text-gray-700">{fmtBRL(cost)}</td>
                              <td className="px-3 py-2 text-right text-gray-500">{row.custoProd || 0}%</td>
                              <td className="px-3 py-2 text-right text-gray-500">{row.impostos || 0}%</td>
                              <td className="px-3 py-2 text-right text-gray-500">{row.lucro || 0}%</td>
                              <td className="px-3 py-2 text-right font-mono font-black text-blue-700">{fmtBRL(price)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ── 04 LEADS ── */}
          <section className="py-8">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-[10px] font-black bg-gray-900 text-white px-2 py-0.5 tracking-widest">04</span>
              <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-900 border-l-[3px] border-blue-700 pl-3">Leads / Orçamentos Solicitados</h2>
            </div>
            {!supabaseOk ? (
              <p className="text-sm text-gray-400">Supabase não configurado — dados de leads indisponíveis.</p>
            ) : !leadsOk ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="material-symbols-outlined text-base animate-spin">autorenew</span>
                Carregando leads…
              </div>
            ) : leads.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhum lead cadastrado.</p>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { val: leads.length,     lbl: 'Total',        c: '#1D4ED8' },
                    { val: leadsConvertidos, lbl: 'Convertidos',  c: '#065F46' },
                    { val: leadsAtivos,      lbl: 'Em aberto',    c: '#B45309' },
                    { val: leadsLoss,        lbl: 'Perdidos',     c: '#B91C1C' },
                  ].map(({ val, lbl, c }) => (
                    <div key={lbl} className="border border-gray-200 p-4" style={{ borderLeftWidth: 3, borderLeftColor: c }}>
                      <div className="text-2xl font-black font-mono text-gray-900 leading-none">{val}</div>
                      <div className="text-[9px] uppercase tracking-widest text-gray-400 mt-1.5 font-bold">{lbl}</div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {leadsByStatus.map(([status, count]) => {
                    const sc = STATUS_COLORS[status] || STATUS_COLORS.Novo
                    return (
                      <div key={status} className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border font-medium"
                        style={{ background: sc.bg, color: sc.text, borderColor: sc.border }}>
                        <span className="font-bold text-sm">{count}</span>
                        <span>{status}</span>
                        <span className="opacity-40">·</span>
                        <span>{fmtPct((count / leads.length) * 100)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </section>

          {/* ── 05 PLANTAS ── */}
          <section className="py-8">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-[10px] font-black bg-gray-900 text-white px-2 py-0.5 tracking-widest">05</span>
              <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-900 border-l-[3px] border-blue-700 pl-3">Plantas Técnicas Salvas</h2>
            </div>
            {plantas.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhuma planta técnica salva. Acesse a aba Planta Técnica para criar.</p>
            ) : (
              <div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { val: plantas.length, lbl: 'Plantas', c: '#1D4ED8' },
                    { val: plantas.reduce((s, p) => s + (p.data?.ports?.length || 0), 0), lbl: 'Total de portas', c: '#065F46' },
                    { val: plantas.reduce((s, p) => s + (p.data?.colsP?.length || 0), 0), lbl: 'Total de colunas', c: '#6D28D9' },
                  ].map(({ val, lbl, c }) => (
                    <div key={lbl} className="border border-gray-200 p-4" style={{ borderLeftWidth: 3, borderLeftColor: c }}>
                      <div className="text-2xl font-black font-mono text-gray-900 leading-none">{val}</div>
                      <div className="text-[9px] uppercase tracking-widest text-gray-400 mt-1.5 font-bold">{lbl}</div>
                    </div>
                  ))}
                </div>
                <table className="w-full text-xs border-collapse">
                  <thead><tr className="bg-gray-50 border-y border-gray-200">
                    {['Nome', 'Dimensão', 'Cabo', 'Portas', 'Área', 'Salvo em'].map((h, i) => (
                      <th key={h} className={`px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-gray-400 ${i > 0 ? 'text-center' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {plantas.map(plant => (
                      <tr key={plant.id} className="border-b border-gray-100">
                        <td className="px-3 py-2 font-medium text-gray-800">{plant.name}</td>
                        <td className="px-3 py-2 text-center font-mono text-gray-700">{plant.data?.W}×{plant.data?.H} m</td>
                        <td className="px-3 py-2 text-center text-gray-600">{plant.data?.CABO} m</td>
                        <td className="px-3 py-2 text-center text-gray-600">{plant.data?.ports?.length || 0}</td>
                        <td className="px-3 py-2 text-center font-mono font-bold text-gray-900">{((plant.data?.W || 0) * (plant.data?.H || 0)).toFixed(0)} m²</td>
                        <td className="px-3 py-2 text-center text-gray-400 text-[10px]">{new Date(plant.savedAt).toLocaleDateString('pt-BR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ── 06 AUDITORIA ── */}
          <section className="py-8">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-[10px] font-black bg-gray-900 text-white px-2 py-0.5 tracking-widest">06</span>
              <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-900 border-l-[3px] border-blue-700 pl-3">Auditoria — Últimas Ações</h2>
            </div>
            {!supabaseOk ? (
              <p className="text-sm text-gray-400">Supabase não configurado — dados de auditoria indisponíveis.</p>
            ) : !auditOk ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="material-symbols-outlined text-base animate-spin">autorenew</span>
                Carregando auditoria…
              </div>
            ) : auditLog.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhuma ação registrada.</p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { val: auditByAction['CREATE'] || 0, lbl: 'Criações',     c: '#065F46' },
                    { val: auditByAction['UPDATE'] || 0, lbl: 'Atualizações', c: '#B45309' },
                    { val: auditByAction['DELETE'] || 0, lbl: 'Exclusões',    c: '#B91C1C' },
                  ].map(({ val, lbl, c }) => (
                    <div key={lbl} className="border border-gray-200 p-4" style={{ borderLeftWidth: 3, borderLeftColor: c }}>
                      <div className="text-2xl font-black font-mono text-gray-900 leading-none">{val}</div>
                      <div className="text-[9px] uppercase tracking-widest text-gray-400 mt-1.5 font-bold">{lbl}</div>
                    </div>
                  ))}
                </div>
                <table className="w-full text-xs border-collapse">
                  <thead><tr className="bg-gray-50 border-y border-gray-200">
                    {['Data/Hora', 'Ação', 'Coleção', 'Usuário', 'Document ID'].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-gray-400">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {auditLog.map((e, i) => {
                      const s = ACTION_STYLE[e.action] || ACTION_STYLE.CREATE
                      return (
                        <tr key={i} className="border-b border-gray-100">
                          <td className="px-3 py-2 text-gray-400 text-[10px]">{e.timestamp ? new Date(e.timestamp).toLocaleString('pt-BR') : '—'}</td>
                          <td className="px-3 py-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border font-mono" style={{ background: s.bg, color: s.text, borderColor: s.border }}>{e.action}</span>
                          </td>
                          <td className="px-3 py-2 font-mono text-[10px] text-gray-700">{e.collection || '—'}</td>
                          <td className="px-3 py-2 text-gray-600">{e.userId || '—'}</td>
                          <td className="px-3 py-2 font-mono text-[10px] text-gray-400 max-w-[200px] truncate">{e.documentId || '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Rodapé do documento */}
          <div className="flex items-center justify-between pt-5 text-[10px] text-gray-400">
            <span>Ventiloar — {FIN.empresa} · CNPJ {FIN.cnpj}</span>
            <span>Gerado em {geradoEm}</span>
          </div>

        </div>
      </div>

      {/* Botão PDF inferior */}
      <div className="flex justify-end pt-2 pb-6">
        <button
          onClick={handlePdf}
          disabled={generating}
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-headline font-bold uppercase tracking-widest bg-[#1D4ED8] text-white hover:bg-[#1E40AF] disabled:opacity-50 transition-colors"
        >
          <span className="material-symbols-outlined">{generating ? 'hourglass_empty' : 'picture_as_pdf'}</span>
          {generating ? 'Gerando PDF…' : 'Baixar Relatório em PDF'}
        </button>
      </div>
    </div>
  )
}
