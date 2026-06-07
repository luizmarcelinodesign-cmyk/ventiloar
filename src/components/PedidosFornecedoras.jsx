import { useState, useEffect, useRef } from 'react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import {
  listDocuments,
  addDocument,
  seedFornecedoresEProdutos,
  STORES
} from '../services/storageService'
import { isSupabaseAvailable } from '../services/supabaseClient'

// DADOS ESTÁTICOS PADRÕES PARA SEED NO BANCO
const CABOS_PADRAO = [
  // CABO FLEX
  { id: 1, fornecedorId: 'padrao', cod: 'AM260502', desc: 'CABO CONF AM260502', tam: '1010MM', preco: 147.90 },
  { id: 2, fornecedorId: 'padrao', cod: 'AM260503', desc: 'CABO CONF AM260503', tam: '2010MM', preco: 167.60 },
  { id: 3, fornecedorId: 'padrao', cod: 'AM260504', desc: 'CABO CONF AM260504', tam: '3020MM', preco: 187.50 },
  { id: 4, fornecedorId: 'padrao', cod: 'AM260505', desc: 'CABO CONF AM260505', tam: '4020MM', preco: 207.20 },
  
  // KALATEC AUTOMACAO - Motores
  { id: 20, fornecedorId: 'kalatec', cod: '4226', desc: 'MOTOR DE INDUCAO 90YT60WGV22 (M560-402)', tam: '60W', preco: 462.73 },
  { id: 21, fornecedorId: 'kalatec', cod: '6278', desc: 'MOTOR 90YT120WGV22', tam: '120W', preco: 576.89 },
  { id: 22, fornecedorId: 'kalatec', cod: '6279', desc: 'MOTOR 100YT200WGV22', tam: '200W', preco: 795.18 },
  { id: 23, fornecedorId: 'kalatec', cod: '7313', desc: 'MOTOR 100YT250WGV22T (c/ Redutor)', tam: '250W', preco: 876.66 },
  
  // KALATEC AUTOMACAO - Redutores
  { id: 30, fornecedorId: 'kalatec', cod: '6570', desc: 'REDUTOR 3:1 90GF03H', tam: '60W', preco: 337.64 },
  { id: 31, fornecedorId: 'kalatec', cod: '6570', desc: 'REDUTOR 3:1 90GF03H', tam: '120W', preco: 337.64 },
  { id: 32, fornecedorId: 'kalatec', cod: '6571', desc: 'REDUTOR 3:1 100GF03H', tam: '200W', preco: 486.26 },
  { id: 33, fornecedorId: 'kalatec', cod: '6571', desc: 'REDUTOR 3:1 100GF03H', tam: '250W', preco: 486.26 },
  
  // GRANJTEC
  { id: 40, fornecedorId: 'granjtec', cod: '609', desc: 'Ventilador para Aviário s/ motor', tam: '-', preco: 259.35 },
  
  // AVATTUS (SMARTKITS) - Filamentos
  { id: 50, fornecedorId: 'avattus', cod: 'SK5740', desc: 'Filamento PLA+ Ender Laranja - Creality', tam: '1Kg/1,75mm', preco: 139.90 },
  { id: 51, fornecedorId: 'avattus', cod: 'SK1621', desc: 'Filamento PLA Speed Premium Branco - 3DLab', tam: '1Kg/1,75mm', preco: 139.90 },
  { id: 52, fornecedorId: 'avattus', cod: 'SK1689', desc: 'Filamento PETG Branco - 3DLab', tam: '1Kg/1,75mm', preco: 139.90 },
  { id: 53, fornecedorId: 'avattus', cod: 'SK1690', desc: 'Filamento PETG Preto - 3DLab', tam: '1Kg/1,75mm', preco: 139.90 },
  { id: 54, fornecedorId: 'avattus', cod: 'SK1616', desc: 'Filamento PLA Speed Premium Azul Claro - 3DLab', tam: '1Kg/1,75mm', preco: 139.90 },
  { id: 55, fornecedorId: 'avattus', cod: 'SK3197', desc: 'Filamento PLA Speed Premium Amarelo - 3DLab', tam: '1Kg/1,75mm', preco: 139.90 },
  { id: 56, fornecedorId: 'avattus', cod: 'SK1624', desc: 'Filamento PLA Speed Premium Vermelho - 3DLab', tam: '1Kg/1,75mm', preco: 139.90 },
  
  // A.F COMERCIO DE PECAS
  { id: 60, fornecedorId: 'afcomercio', cod: 'PR03', desc: 'POLIA 40', tam: '-', preco: 115.00 },
  { id: 61, fornecedorId: 'afcomercio', cod: 'PR04', desc: 'POLIA 20', tam: '-', preco: 26.00 },
  { id: 62, fornecedorId: 'afcomercio', cod: 'PR05', desc: 'CORREIA 267', tam: '-', preco: 59.00 },
  { id: 63, fornecedorId: 'afcomercio', cod: 'PR01', desc: 'EIXO', tam: '45cm', preco: 37.68 },
  { id: 64, fornecedorId: 'afcomercio', cod: 'PR02', desc: 'EIXO', tam: '38cm', preco: 43.15 },
  
  // FIXOTRAVAS
  { id: 70, fornecedorId: 'fixotravas', cod: '1585', desc: 'BOTÃO 2516', tam: '1/4', preco: 1.20 },
  { id: 71, fornecedorId: 'fixotravas', cod: '1637', desc: 'BOTÃO 2516', tam: '1/4 x 30', preco: 2.25 },
  { id: 72, fornecedorId: 'fixotravas', cod: '3930', desc: 'MANÍPULO 3522 c/ PORCA', tam: '1/4', preco: 1.35 },
  { id: 73, fornecedorId: 'fixotravas', cod: '4063', desc: 'MANÍPULO 3522', tam: '1/4 x 65', preco: 2.45 },
  
  // BEACH BIKE
  { id: 80, fornecedorId: 'beachbike', cod: '13904', desc: 'ROLAMENTO BIC 2RS 6000 PRIMEIRA LINHA NA CAIXA BMK', tam: '-', preco: 2.22 },
  
  // TTV FIBRAMETAL
  { id: 90, fornecedorId: 'fibrametal', cod: 'H500AF6325-PAG3AFE103-51', desc: 'HÉLICE H/500/AF6-3/25/PAG/3AFE/10/-/35/1 ALLEN 1/4" MH', tam: '500mm', preco: 130.00 },
  { id: 91, fornecedorId: 'fibrametal', cod: 'H500AF6325-PAG3AFD103-51', desc: 'HÉLICE H/500/AF6-3/25/PAG/3AFD/10/-/35/1 ALLEN 1/4" MH', tam: '500mm', preco: 130.00 },
  
  // METALURGICA VENTISILVA
  { id: 100, fornecedorId: 'ventisilva', cod: '2005635', desc: 'CJ GRADE VPL/VCL Pintado Preto c/ Gancho', tam: '-', preco: 102.84 }
]

const MINHA_EMPRESA_PADRAO = {
  id: 'minha',
  nome: 'PROJETACAO EMPREENDIMENTOS LTDA',
  telefone: '(088) 94760657',
  cnpj: '47950352000171',
  ie: '073095265',
  endereco: 'RUA SIMONE APARECIDA ROCHA, 143',
  bairro: 'SAO JOSE - MADALENA / CE',
  cep: '63860-000',
  email: 'aprojetacao@gmail.com',
  contato: 'FRANCISCO'
}

const FORNECEDORAS_PADRAO = [
  {
    id: 'padrao',
    nome: 'CABO FLEX',
    telefone: '(11) 94657-4643',
    whatsapp: '5511946574643',
    cnpj: '00.000.000/0001-00',
    ie: 'ISENTO',
    endereco: 'Av. Paulista, 1000',
    bairro: 'Bela Vista - São Paulo / SP',
    cep: '01310-100',
    email: 'contato@caboflex.com.br',
    contato: 'Atendimento Comercial'
  },
  {
    id: 'kalatec',
    nome: 'KALATEC AUTOMACAO LTDA',
    telefone: '(19) 3045-4900',
    whatsapp: '551930454867',
    cnpj: '65.670.424/0001-09',
    ie: '244423344110',
    endereco: 'R. Salto, 99 - Jd. do Trevo',
    bairro: 'Campinas / SP',
    cep: '13.030-145',
    email: 'cobranca@kalatec.com.br',
    contato: 'MICHAEL DOUGLAS SANTOS'
  },
  {
    id: 'granjtec',
    nome: 'GRANJTEC INDUSTRIA E COMERCIO LTDA',
    telefone: '(35) 3591-3000',
    whatsapp: '553592278938',
    cnpj: '03.512.339/0001-65',
    ie: '4320531220064',
    endereco: 'Rua Gedeone Castellani, 333',
    bairro: 'Parque Industrial - Monte Santo de Minas / MG',
    cep: '37968-000',
    email: 'contato@granjtec.com.br',
    contato: 'Atendimento Comercial'
  },
  {
    id: 'avattus',
    nome: 'AVATTUS COMERCIO DE COMPONENTES ELETRONICOS LTDA (SMARTKITS)',
    telefone: '(85) 3051-5550',
    whatsapp: '558530515550',
    cnpj: '20.228.852/0001-48',
    ie: '06.662.3901',
    endereco: 'Rua Torres Câmara, 280, Loja 03 e 04',
    bairro: 'Aldeota - Fortaleza / CE',
    cep: '60.150-060',
    email: 'contato@smartkits.com.br',
    contato: 'Atendimento Comercial'
  },
  {
    id: 'afcomercio',
    nome: 'A.F COMERCIO DE PECAS LTDA',
    telefone: '(11) 3921-9303',
    whatsapp: '5511910774379',
    cnpj: '56.877.470/0001-92',
    ie: '153388732117',
    endereco: 'Rua do Inverno, 258',
    bairro: 'Jd. Guarani - São Paulo / SP',
    cep: '02848-050',
    email: 'afcomerciodepecas@gmail.com',
    contato: 'SUPERVISOR'
  },
  {
    id: 'fixotravas',
    nome: 'FIXOTRAVAS COMERCIO DE PECAS E ACESSORIOS INDUSTRIAIS LTDA',
    telefone: '(41) 3284-1886',
    whatsapp: '554188197091',
    cnpj: '07.315.124/0001-05',
    ie: '9033482830',
    endereco: 'R. Oliveira Viana, 2831',
    bairro: 'Boqueirão - Curitiba / PR',
    cep: '81670-090',
    email: 'vendas@fixotravas.com.br',
    contato: 'ANTONIO DA SILVA FILHO'
  },
  {
    id: 'beachbike',
    nome: 'BEACH BIKE DISTRIBUIDORA DE PECAS DE MOTO',
    telefone: '(85) 3476-3828',
    whatsapp: '558596170080',
    cnpj: '02.541.582/0001-49',
    ie: '062667220',
    endereco: 'Avenida Maestro Lisboa, 2943',
    bairro: 'Lagoa Redonda - Fortaleza / CE',
    cep: '60832-400',
    email: 'contato@beachbike.com.br',
    contato: 'Atendimento Comercial'
  },
  {
    id: 'fibrametal',
    nome: 'TTV FIBRAMETAL TECNOLOGIA EM MOVIMENTACAO DO AR LTDA',
    telefone: '(11) 4038-4333',
    whatsapp: '551140384333',
    cnpj: '43.058.741/0001-36',
    ie: '245127145112',
    endereco: 'Rua Geraldo Perez, 128',
    bairro: 'Sítio São Miguel - Campo Limpo Paulista / SP',
    cep: '13236-500',
    email: 'nfe@fibrametal.com.br',
    contato: 'Atendimento Comercial'
  },
  {
    id: 'ventisilva',
    nome: 'METALURGICA VENTISILVA LTDA',
    telefone: '(11) 2602-2400',
    whatsapp: '5511984161450',
    cnpj: '61.129.268/0001-12',
    ie: '103834367117',
    endereco: 'R. Dianópolis, 770',
    bairro: 'Parque da Mooca - São Paulo / SP',
    cep: '03126-007',
    email: 'vendas@ventisilva.com.br',
    contato: 'Atendimento Comercial'
  }
]

const VERSAO = '15.0'

export default function PedidosFornecedoras() {
  // Estado básico
  const [minhaEmpresa, setMinhaEmpresa] = useState(MINHA_EMPRESA_PADRAO)
  const [fornecedoras, setFornecedoras] = useState([])
  const [cabos, setCabos] = useState([])
  const [selecionados, setSelecionados] = useState({})
  const [fornecedoraSelecionada, setFornecedoraSelecionada] = useState('')
  
  // Estado dos formulários auxiliares
  const [editMinhaEmpresa, setEditMinhaEmpresa] = useState(false)
  const [addFornecedora, setAddFornecedora] = useState(false)
  const [preview, setPreview] = useState(false)
  
  // Estado de mensagens / feedback / carregamento
  const [alertMsg, setAlertMsg] = useState(null)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [loading, setLoading] = useState(true)

  // Referência para o documento PDF de preview
  const documentoPdfRef = useRef(null)

  // Estado dos inputs dos formulários
  const [formMinha, setFormMinha] = useState({ ...MINHA_EMPRESA_PADRAO })
  const [formFornec, setFormFornec] = useState({
    nome: '', telefone: '', whatsapp: '', cnpj: '', ie: '',
    endereco: '', bairro: '', cep: '', email: '', contato: ''
  })

  // Preview data temporária
  const [pedidoNum, setPedidoNum] = useState('')
  const [pedidoDataStr, setPedidoDataStr] = useState('')

  // Carregar dados remotos do Supabase com fallback local
  const loadDatabaseData = async () => {
    setLoading(true)
    const sbAvailable = isSupabaseAvailable()
    
    // Reset do nome se alterado por testes anteriores
    const savedMinha = localStorage.getItem('minha_empresa_pedidos')
    let currentMinha = MINHA_EMPRESA_PADRAO
    if (savedMinha) {
      try {
        const parsed = JSON.parse(savedMinha)
        if (parsed.nome === 'VENTILOAR PROJETOS LTDA') {
          parsed.nome = 'PROJETACAO EMPREENDIMENTOS LTDA'
          localStorage.setItem('minha_empresa_pedidos', JSON.stringify(parsed))
        }
        currentMinha = parsed
      } catch (e) {
        console.error('Erro ao ler localstorage minha_empresa_pedidos', e)
      }
    }
    setMinhaEmpresa(currentMinha)
    setFormMinha(currentMinha)

    const savedSel = localStorage.getItem('selecionados_pedidos')
    if (savedSel) {
      try {
        setSelecionados(JSON.parse(savedSel))
      } catch (e) {
        console.error(e)
      }
    }

    if (sbAvailable) {
      try {
        // Executa auto-seeding caso as tabelas estejam vazias
        await seedFornecedoresEProdutos(FORNECEDORAS_PADRAO, CABOS_PADRAO)
        
        // Carrega listas do Supabase
        const dbFornec = await listDocuments(STORES.fornecedoras)
        const dbCabos = await listDocuments(STORES.produtosFornecedoras)
        
        setFornecedoras(dbFornec || [])
        setCabos(dbCabos || [])
      } catch (err) {
        console.error('Falha ao conectar no Supabase, usando fallback local:', err.message)
        setFornecedoras(FORNECEDORAS_PADRAO)
        setCabos(CABOS_PADRAO)
      }
    } else {
      setFornecedoras(FORNECEDORAS_PADRAO)
      setCabos(CABOS_PADRAO)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadDatabaseData()
  }, [])

  // Alerta temporário
  const showAlert = (text, type = 'success') => {
    setAlertMsg({ text, type })
    setTimeout(() => setAlertMsg(null), 3000)
  }

  // Auxiliares de formatação
  const fmtBRL = (valor) => {
    return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  // Filtragem de produtos ativos por fornecedora
  const produtosDisponiveis = cabos.filter(
    c => String(c.fornecedorId) === String(fornecedoraSelecionada)
  )

  // Ações de alteração de estado
  const toggleCabo = (id) => {
    const updated = { ...selecionados }
    if (updated[id]) {
      delete updated[id]
    } else {
      updated[id] = 1
    }
    setSelecionados(updated)
    localStorage.setItem('selecionados_pedidos', JSON.stringify(updated))
  }

  const mudarQtd = (id, val) => {
    const q = Math.max(1, parseInt(val) || 1)
    const updated = { ...selecionados, [id]: q }
    setSelecionados(updated)
    localStorage.setItem('selecionados_pedidos', JSON.stringify(updated))
  }

  // Salvar formulário Minha Empresa
  const handleSaveMinhaEmpresa = (e) => {
    e.preventDefault()
    setMinhaEmpresa(formMinha)
    localStorage.setItem('minha_empresa_pedidos', JSON.stringify(formMinha))
    setEditMinhaEmpresa(false)
    showAlert('Dados do Solicitante atualizados com sucesso!', 'success')
  }

  // Salvar nova Fornecedora no Supabase
  const handleSaveFornecedora = async (e) => {
    e.preventDefault()
    if (!formFornec.nome.trim()) {
      showAlert('O nome da fornecedora é obrigatório!', 'error')
      return
    }

    const novaId = Date.now().toString()
    const nova = {
      ...formFornec,
      id: novaId,
      whatsapp: formFornec.whatsapp.replace(/\D/g, '')
    }

    try {
      const isSb = isSupabaseAvailable()
      let inserted = nova
      
      if (isSb) {
        inserted = await addDocument(STORES.fornecedoras, nova, 'admin')
      } else {
        // Fallback localstorage
        const listaLocal = [...fornecedoras, nova]
        localStorage.setItem('fornecedoras_pedidos', JSON.stringify(listaLocal))
      }

      const listaAtualizada = [...fornecedoras, inserted]
      setFornecedoras(listaAtualizada)
      setFornecedoraSelecionada(inserted.id)
      setAddFornecedora(false)
      setFormFornec({
        nome: '', telefone: '', whatsapp: '', cnpj: '', ie: '',
        endereco: '', bairro: '', cep: '', email: '', contato: ''
      })
      showAlert('Fornecedora cadastrada com sucesso no Supabase!', 'success')
    } catch (err) {
      showAlert(`Erro ao cadastrar fornecedora: ${err.message}`, 'error')
    }
  }

  // Limpar formulário de seleção
  const handleLimpar = () => {
    if (window.confirm('Deseja limpar todos os itens selecionados?')) {
      setSelecionados({})
      localStorage.setItem('selecionados_pedidos', JSON.stringify({}))
      setPreview(false)
      showAlert('Seleção limpa!', 'success')
    }
  }

  // Obter itens ativos e calcular totais
  const getItensAtivos = () => {
    return Object.keys(selecionados)
      .filter(id => selecionados[id] > 0)
      .map(id => {
        const item = cabos.find(c => String(c.id) === String(id))
        const qtd = selecionados[id]
        return { item, qtd, subtotal: item ? Number(item.preco) * qtd : 0 }
      })
      .filter(x => x.item && String(x.item.fornecedorId) === String(fornecedoraSelecionada))
  }

  const itensAtivos = getItensAtivos()
  const totalPedido = itensAtivos.reduce((acc, curr) => acc + curr.subtotal, 0)

  // Gerar pré-visualização
  const handleGerarPreview = () => {
    if (!fornecedoraSelecionada) {
      showAlert('Selecione uma fornecedora primeiro!', 'error')
      return
    }
    if (itensAtivos.length === 0) {
      showAlert('Selecione pelo menos um produto!', 'error')
      return
    }
    
    const randomNum = String(Math.floor(Math.random() * 1000000)).padStart(6, '0')
    const dateStr = new Date().toLocaleDateString('pt-BR')
    
    setPedidoNum(randomNum)
    setPedidoDataStr(dateStr)
    setPreview(true)
    
    setTimeout(() => {
      const el = document.getElementById('documentoPDF')
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }, 100)
    
    showAlert('Pré-visualização gerada com sucesso!', 'success')
  }

  // Ações de exportação
  const fornecAtual = fornecedoras.find(f => String(f.id) === String(fornecedoraSelecionada))

  const downloadPDF = async () => {
    const element = documentoPdfRef.current
    if (!element) {
      showAlert('Gere a pré-visualização primeiro!', 'error')
      return
    }

    setGeneratingPdf(true)
    showAlert('Gerando arquivo PDF, aguarde...', 'success')

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.98)
      const pdf = new jsPDF('p', 'mm', 'a4')

      const pdfWidth = 210
      const pdfHeight = 297
      const margin = 10
      const imgWidth = pdfWidth - (margin * 2)
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      if (imgHeight <= pdfHeight - margin * 2) {
        pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight)
      } else {
        let heightLeft = imgHeight
        let position = margin
        pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight)
        heightLeft -= (pdfHeight - margin * 2)

        while (heightLeft > 0) {
          position = heightLeft - imgHeight + margin
          pdf.addPage()
          pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight)
          heightLeft -= (pdfHeight - margin * 2)
        }
      }

      const nomeArquivo = `pedido_${fornecAtual ? fornecAtual.nome.replace(/\s+/g, '_') : 'fornecedora'}_${pedidoDataStr.replace(/\//g, '-')}.pdf`
      pdf.save(nomeArquivo)
      showAlert('PDF baixado com sucesso!', 'success')
      return nomeArquivo
    } catch (err) {
      showAlert(`Erro ao gerar PDF: ${err.message}`, 'error')
      console.error(err)
      return null
    } finally {
      setGeneratingPdf(false)
    }
  }

  const handleWhatsApp = async () => {
    if (!fornecAtual || !fornecAtual.whatsapp) {
      showAlert('Fornecedora sem WhatsApp cadastrado!', 'error')
      return
    }

    const nomeArquivo = await downloadPDF()
    if (nomeArquivo) {
      setTimeout(() => {
        const textMsg = encodeURIComponent(`Olá, segue em anexo o nosso pedido de compra (${nomeArquivo}).`)
        const url = `https://wa.me/${fornecAtual.whatsapp}?text=${textMsg}`
        window.open(url, '_blank')
        showAlert('WhatsApp aberto na conversa da fornecedora! Arraste o PDF baixado para enviar.', 'success')
      }, 1000)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-16 text-on-surface-variant text-sm justify-center">
        <span className="material-symbols-outlined animate-spin text-primary-container">autorenew</span>
        Carregando dados das fornecedoras...
      </div>
    )
  }

  return (
    <div className="space-y-8 font-body">
      {/* Alertas */}
      {alertMsg && (
        <div
          className={`p-4 text-sm font-semibold tracking-wide border flex items-center gap-2 transition-all ${
            alertMsg.type === 'success'
              ? 'bg-green-950/40 text-green-400 border-green-800/55'
              : 'bg-red-950/40 text-red-400 border-red-800/55'
          }`}
        >
          <span className="material-symbols-outlined text-base">
            {alertMsg.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {alertMsg.text}
        </div>
      )}

      {/* Capa de Boas-vindas Industrial */}
      <div className="bg-surface-container-low p-8 border border-outline-variant/30 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-32 h-32 opacity-5 pointer-events-none industrial-pattern" />
        <div className="space-y-4 max-w-xl">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary-container text-4xl">local_shipping</span>
            <h2 className="font-headline font-bold uppercase text-2xl md:text-3xl tracking-wide text-on-surface">
              Pedidos para Fornecedoras
            </h2>
          </div>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Selecione uma fornecedora homologada, filtre e marque os itens necessários, insira as quantidades e gere um pedido de compra timbrado com faturamento e condicional de pagamento pronto em PDF.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
          {[
            { step: '1', desc: 'Selecione a Fornecedora' },
            { step: '2', desc: 'Escolha itens/quantidades' },
            { step: '3', desc: 'Gere a prévia em PDF' },
            { step: '4', desc: 'Envie via WhatsApp' }
          ].map((item) => (
            <div key={item.step} className="bg-surface-container-high p-3 border border-outline-variant/20 flex flex-col justify-between min-w-[130px]">
              <span className="font-headline font-bold text-xs text-primary-container tracking-wider">PASSO 0{item.step}</span>
              <span className="text-[11px] text-on-surface-variant font-medium mt-1">{item.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SEÇÃO 01: MINHA EMPRESA */}
      <section className="bg-surface-container-low p-6 border border-outline-variant/20 space-y-4">
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container">domain</span>
            <h3 className="font-headline font-bold uppercase tracking-wider text-sm text-on-surface">
              Solicitante (Minha Empresa)
            </h3>
          </div>
          {!editMinhaEmpresa && (
            <button
              onClick={() => setEditMinhaEmpresa(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-headline font-bold uppercase tracking-widest bg-surface-container-high text-on-surface hover:bg-surface-container-highest border border-outline-variant/30 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">settings</span>
              Configurar Dados
            </button>
          )}
        </div>

        {editMinhaEmpresa ? (
          <form onSubmit={handleSaveMinhaEmpresa} className="space-y-4 bg-surface-container-high/40 p-4 border border-outline-variant/20">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-headline">Nome da Empresa</label>
                <input
                  type="text"
                  value={formMinha.nome}
                  onChange={(e) => setFormMinha({ ...formMinha, nome: e.target.value })}
                  placeholder="Ex: PROJETACAO EMPREENDIMENTOS LTDA"
                  className="bg-surface-container-high text-on-surface text-xs px-3 py-2 border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary-container"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-headline">CNPJ</label>
                <input
                  type="text"
                  value={formMinha.cnpj}
                  onChange={(e) => setFormMinha({ ...formMinha, cnpj: e.target.value })}
                  placeholder="Apenas números"
                  className="bg-surface-container-high text-on-surface text-xs px-3 py-2 border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary-container"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-headline">Inscrição Estadual (I.E.)</label>
                <input
                  type="text"
                  value={formMinha.ie}
                  onChange={(e) => setFormMinha({ ...formMinha, ie: e.target.value })}
                  placeholder="Ex: 073095265"
                  className="bg-surface-container-high text-on-surface text-xs px-3 py-2 border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary-container"
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2 md:col-span-3">
                <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-headline">Endereço Completo</label>
                <input
                  type="text"
                  value={formMinha.endereco}
                  onChange={(e) => setFormMinha({ ...formMinha, endereco: e.target.value })}
                  placeholder="Ex: Rua, número, complemento"
                  className="bg-surface-container-high text-on-surface text-xs px-3 py-2 border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary-container"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-headline">Bairro / Cidade / UF</label>
                <input
                  type="text"
                  value={formMinha.bairro}
                  onChange={(e) => setFormMinha({ ...formMinha, bairro: e.target.value })}
                  placeholder="Ex: São José - Madalena / CE"
                  className="bg-surface-container-high text-on-surface text-xs px-3 py-2 border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary-container"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-headline">CEP</label>
                <input
                  type="text"
                  value={formMinha.cep}
                  onChange={(e) => setFormMinha({ ...formMinha, cep: e.target.value })}
                  placeholder="Ex: 63860-000"
                  className="bg-surface-container-high text-on-surface text-xs px-3 py-2 border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary-container"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-headline">Telefone</label>
                <input
                  type="text"
                  value={formMinha.telefone}
                  onChange={(e) => setFormMinha({ ...formMinha, telefone: e.target.value })}
                  placeholder="Ex: (88) 9476-0657"
                  className="bg-surface-container-high text-on-surface text-xs px-3 py-2 border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary-container"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-headline">Email</label>
                <input
                  type="email"
                  value={formMinha.email}
                  onChange={(e) => setFormMinha({ ...formMinha, email: e.target.value })}
                  placeholder="Ex: financeiro@email.com"
                  className="bg-surface-container-high text-on-surface text-xs px-3 py-2 border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary-container"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-headline">Contato / Responsável</label>
                <input
                  type="text"
                  value={formMinha.contato}
                  onChange={(e) => setFormMinha({ ...formMinha, contato: e.target.value })}
                  placeholder="Nome do contato"
                  className="bg-surface-container-high text-on-surface text-xs px-3 py-2 border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary-container"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="submit"
                className="px-4 py-2 text-xs font-headline font-bold uppercase tracking-wider bg-primary-container text-on-primary-container hover:bg-primary transition-colors"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormMinha(minhaEmpresa)
                  setEditMinhaEmpresa(false)
                }}
                className="px-4 py-2 text-xs font-headline font-bold uppercase tracking-wider bg-surface-container-high text-on-surface hover:bg-surface-container-highest border border-outline-variant/30 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-surface-container-high/40 p-4 border border-outline-variant/10 text-xs leading-relaxed grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4">
            <div><strong>Nome:</strong> <span className="text-on-surface-variant">{minhaEmpresa.nome}</span></div>
            <div><strong>CNPJ:</strong> <span className="text-on-surface-variant">{minhaEmpresa.cnpj}</span></div>
            <div><strong>I.E.:</strong> <span className="text-on-surface-variant">{minhaEmpresa.ie}</span></div>
            <div className="sm:col-span-2"><strong>Endereço:</strong> <span className="text-on-surface-variant">{minhaEmpresa.endereco}, {minhaEmpresa.bairro} - CEP {minhaEmpresa.cep}</span></div>
            <div><strong>Fone:</strong> <span className="text-on-surface-variant">{minhaEmpresa.telefone}</span></div>
            <div><strong>Email:</strong> <span className="text-on-surface-variant">{minhaEmpresa.email}</span></div>
            <div><strong>Responsável:</strong> <span className="text-on-surface-variant">{minhaEmpresa.contato}</span></div>
          </div>
        )}
      </section>

      {/* SEÇÃO 02: SELEÇÃO DE FORNECEDORA */}
      <section className="bg-surface-container-low p-6 border border-outline-variant/20 space-y-4">
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container">contacts</span>
            <h3 className="font-headline font-bold uppercase tracking-wider text-sm text-on-surface">
              Selecione a Fornecedora
            </h3>
          </div>
          {!addFornecedora && (
            <button
              onClick={() => setAddFornecedora(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-headline font-bold uppercase tracking-widest bg-surface-container-high text-on-surface hover:bg-surface-container-highest border border-outline-variant/30 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Nova Fornecedora
            </button>
          )}
        </div>

        {addFornecedora ? (
          <form onSubmit={handleSaveFornecedora} className="space-y-4 bg-surface-container-high/40 p-4 border border-outline-variant/20">
            <h4 className="text-xs font-bold font-headline uppercase tracking-wider text-primary-container">Adicionar Fornecedora</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-headline">Nome da Fornecedora</label>
                <input
                  type="text"
                  value={formFornec.nome}
                  onChange={(e) => setFormFornec({ ...formFornec, nome: e.target.value })}
                  placeholder="Ex: CABO FLEX LTDA"
                  className="bg-surface-container-high text-on-surface text-xs px-3 py-2 border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary-container"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-headline">Telefone de Contato</label>
                <input
                  type="text"
                  value={formFornec.telefone}
                  onChange={(e) => setFormFornec({ ...formFornec, telefone: e.target.value })}
                  placeholder="Ex: (11) 94657-4643"
                  className="bg-surface-container-high text-on-surface text-xs px-3 py-2 border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary-container"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-headline">WhatsApp para Envio (Internacional)</label>
                <input
                  type="text"
                  value={formFornec.whatsapp}
                  onChange={(e) => setFormFornec({ ...formFornec, whatsapp: e.target.value })}
                  placeholder="Ex: 5511946574643"
                  className="bg-surface-container-high text-on-surface text-xs px-3 py-2 border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary-container"
                />
                <span className="text-[9px] text-amber-400">Sem espaços ou símbolos (Ex: 55 + DDD + Número)</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-headline">CNPJ</label>
                <input
                  type="text"
                  value={formFornec.cnpj}
                  onChange={(e) => setFormFornec({ ...formFornec, cnpj: e.target.value })}
                  placeholder="CNPJ da fornecedora"
                  className="bg-surface-container-high text-on-surface text-xs px-3 py-2 border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary-container"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-headline">Inscrição Estadual (I.E.)</label>
                <input
                  type="text"
                  value={formFornec.ie}
                  onChange={(e) => setFormFornec({ ...formFornec, ie: e.target.value })}
                  placeholder="I.E. ou ISENTO"
                  className="bg-surface-container-high text-on-surface text-xs px-3 py-2 border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary-container"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-headline">CEP</label>
                <input
                  type="text"
                  value={formFornec.cep}
                  onChange={(e) => setFormFornec({ ...formFornec, cep: e.target.value })}
                  placeholder="Ex: 01310-100"
                  className="bg-surface-container-high text-on-surface text-xs px-3 py-2 border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary-container"
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2 md:col-span-3">
                <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-headline">Endereço Completo</label>
                <input
                  type="text"
                  value={formFornec.endereco}
                  onChange={(e) => setFormFornec({ ...formFornec, endereco: e.target.value })}
                  placeholder="Rua, Av, número..."
                  className="bg-surface-container-high text-on-surface text-xs px-3 py-2 border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary-container"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-headline">Bairro / Cidade / UF</label>
                <input
                  type="text"
                  value={formFornec.bairro}
                  onChange={(e) => setFormFornec({ ...formFornec, bairro: e.target.value })}
                  placeholder="Ex: Bela Vista - São Paulo / SP"
                  className="bg-surface-container-high text-on-surface text-xs px-3 py-2 border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary-container"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-headline">Email</label>
                <input
                  type="email"
                  value={formFornec.email}
                  onChange={(e) => setFormFornec({ ...formFornec, email: e.target.value })}
                  placeholder="Ex: vendas@fornecedor.com"
                  className="bg-surface-container-high text-on-surface text-xs px-3 py-2 border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary-container"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-headline">Contato Comercial</label>
                <input
                  type="text"
                  value={formFornec.contato}
                  onChange={(e) => setFormFornec({ ...formFornec, contato: e.target.value })}
                  placeholder="Ex: Representante de Vendas"
                  className="bg-surface-container-high text-on-surface text-xs px-3 py-2 border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary-container"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="submit"
                className="px-4 py-2 text-xs font-headline font-bold uppercase tracking-wider bg-primary-container text-on-primary-container hover:bg-primary transition-colors"
              >
                Salvar Fornecedora
              </button>
              <button
                type="button"
                onClick={() => setAddFornecedora(false)}
                className="px-4 py-2 text-xs font-headline font-bold uppercase tracking-wider bg-surface-container-high text-on-surface hover:bg-surface-container-highest border border-outline-variant/30 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={fornecedoraSelecionada}
                onChange={(e) => {
                  setFornecedoraSelecionada(e.target.value)
                  setPreview(false)
                }}
                className="flex-1 bg-surface-container-high text-on-surface px-4 py-3 text-xs border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary-container appearance-none"
              >
                <option value="">-- Clique aqui para selecionar uma Fornecedora --</option>
                {fornecedoras.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nome}
                  </option>
                ))}
              </select>
            </div>

            {fornecAtual && (
              <div className="bg-surface-container-high/40 p-4 border border-outline-variant/10 text-xs leading-relaxed grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4">
                <div><strong>Nome:</strong> <span className="text-on-surface-variant">{fornecAtual.nome}</span></div>
                <div><strong>WhatsApp:</strong> <span className="text-on-surface-variant">{fornecAtual.whatsapp || '-'}</span></div>
                <div><strong>CNPJ:</strong> <span className="text-on-surface-variant">{fornecAtual.cnpj || '-'}</span></div>
                <div className="sm:col-span-2"><strong>Endereço:</strong> <span className="text-on-surface-variant">{fornecAtual.endereco}, {fornecAtual.bairro} - CEP {fornecAtual.cep}</span></div>
                <div><strong>Fone:</strong> <span className="text-on-surface-variant">{fornecAtual.telefone || '-'}</span></div>
                <div><strong>Email:</strong> <span className="text-on-surface-variant">{fornecAtual.email || '-'}</span></div>
                <div><strong>Contato:</strong> <span className="text-on-surface-variant">{fornecAtual.contato || '-'}</span></div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* SEÇÃO 03: SELEÇÃO DE CABOS E PRODUTOS */}
      <section className="bg-surface-container-low p-6 border border-outline-variant/20 space-y-4">
        <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-3">
          <span className="material-symbols-outlined text-primary-container">shopping_cart</span>
          <h3 className="font-headline font-bold uppercase tracking-wider text-sm text-on-surface">
            Selecione os Cabos e Peças
          </h3>
        </div>

        {!fornecedoraSelecionada ? (
          <div className="border-2 border-dashed border-outline-variant/30 p-8 text-center text-on-surface-variant space-y-2">
            <span className="material-symbols-outlined text-4xl opacity-50">arrow_upward</span>
            <p className="font-bold text-xs uppercase font-headline">Selecione uma fornecedora acima</p>
            <p className="text-[11px] opacity-75">Os produtos homologados correspondentes serão exibidos aqui.</p>
          </div>
        ) : produtosDisponiveis.length === 0 ? (
          <div className="bg-surface-container-high/30 p-6 text-center text-xs text-on-surface-variant border border-outline-variant/15">
            Nenhum produto pré-cadastrado no sistema para esta fornecedora.
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {produtosDisponiveis.map((c) => {
              const qtd = selecionados[c.id] || 0
              const itemChecked = qtd > 0
              const subtotal = Number(c.preco || 0) * qtd

              return (
                <div
                  key={c.id}
                  className={`p-3 border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    itemChecked
                      ? 'bg-surface-container-highest/80 border-primary-container/60 text-on-surface'
                      : 'bg-surface-container-high/40 border-outline-variant/15 text-on-surface-variant/70 hover:border-outline-variant/30'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                    <input
                      type="checkbox"
                      checked={itemChecked}
                      onChange={() => toggleCabo(c.id)}
                      className="w-4 h-4 accent-primary-container bg-surface-container cursor-pointer border-outline-variant focus:outline-none"
                    />
                    <div className="text-xs">
                      <div className="font-mono font-bold text-on-surface text-sm uppercase">{c.cod}</div>
                      <div className="text-on-surface-variant text-[11px] mt-0.5">{c.desc} {c.tam !== '-' && `| ${c.tam}`}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                    <div className="text-right text-xs">
                      <span className="text-[10px] block text-on-surface-variant/50">Unitário</span>
                      <strong className="text-primary-container font-mono">{fmtBRL(c.preco)}</strong>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-on-surface-variant/50 block sm:hidden">Qtd:</span>
                      <input
                        type="number"
                        min="1"
                        disabled={!itemChecked}
                        value={itemChecked ? qtd : ''}
                        placeholder="1"
                        onChange={(e) => mudarQtd(c.id, e.target.value)}
                        className="w-16 bg-surface-container text-on-surface text-center py-1 text-xs border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary-container disabled:opacity-30 disabled:pointer-events-none font-mono"
                      />
                    </div>

                    <div className="text-right min-w-[90px] text-xs">
                      <span className="text-[10px] block text-on-surface-variant/50">Subtotal</span>
                      <strong className={itemChecked ? 'text-green-400 font-mono' : 'text-on-surface-variant/30 font-mono'}>
                        {itemChecked ? fmtBRL(subtotal) : '-'}
                      </strong>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* SEÇÃO 04: RESUMO DO PEDIDO */}
      {itensAtivos.length > 0 && (
        <section className="bg-surface-container-low p-6 border border-outline-variant/20 space-y-4">
          <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-3">
            <span className="material-symbols-outlined text-primary-container">list_alt</span>
            <h3 className="font-headline font-bold uppercase tracking-wider text-sm text-on-surface">
              Resumo do Pedido Atual
            </h3>
          </div>

          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
            {itensAtivos.map(({ item, qtd, subtotal }) => (
              <div key={item.id} className="flex justify-between items-center text-xs py-1.5 border-b border-outline-variant/10 text-on-surface-variant">
                <span>
                  <strong className="font-mono text-on-surface">{item.cod}</strong> (x{qtd})
                </span>
                <span className="font-mono text-on-surface">{fmtBRL(subtotal)}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-outline-variant/35">
            <span className="font-headline font-bold uppercase text-xs text-on-surface tracking-wider">TOTAL DO PEDIDO:</span>
            <span className="font-mono font-black text-xl text-primary-container">{fmtBRL(totalPedido)}</span>
          </div>
        </section>
      )}

      {/* BOTÕES DE AÇÕES PRINCIPAIS */}
      <div className="flex justify-center gap-4">
        <button
          onClick={handleGerarPreview}
          disabled={!fornecedoraSelecionada || itensAtivos.length === 0}
          className="inline-flex items-center gap-2 px-6 py-3 text-xs font-headline font-bold uppercase tracking-widest bg-primary-container text-on-primary-container hover:bg-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-sm">pageview</span>
          Gerar Pedido
        </button>
        <button
          onClick={handleLimpar}
          disabled={itensAtivos.length === 0}
          className="inline-flex items-center gap-2 px-6 py-3 text-xs font-headline font-bold uppercase tracking-widest bg-surface-container-high text-on-surface hover:bg-surface-container-highest border border-outline-variant/30 transition-colors disabled:opacity-30"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
          Limpar Seleção
        </button>
      </div>

      {/* ÁREA DE PRÉ-VISUALIZAÇÃO / TIMBRADO */}
      {preview && (
        <div className="space-y-6 pt-6 border-t-2 border-dashed border-outline-variant/30">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#ffdad6]">picture_as_pdf</span>
            <h3 className="font-headline font-bold uppercase tracking-wider text-sm text-[#ffdad6]">
              Pré-visualização do Pedido (Folha Timbrada A4)
            </h3>
          </div>

          {/* DOCUMENTO FISCAL / PDF TIMBRADO */}
          <div className="bg-surface-container-high/30 p-4 border border-outline-variant/20 overflow-x-auto">
            <div
              id="documentoPDF"
              ref={documentoPdfRef}
              className="bg-white text-gray-900 shadow-md p-8 max-w-[800px] mx-auto text-xs leading-normal"
              style={{ fontFamily: 'Arial, sans-serif' }}
            >
              <div className="border-2 border-black p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold uppercase tracking-tight text-blue-700">{minhaEmpresa.nome}</h2>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Solicitante de Compra</p>
                  </div>
                  <div className="text-right text-[11px] font-semibold text-gray-800 space-y-0.5">
                    <div>Data: {pedidoDataStr}</div>
                    <div>Pedido Nº: {pedidoNum}</div>
                  </div>
                </div>
                <div className="border-t border-black pt-3 text-center">
                  <h1 className="text-lg font-black tracking-widest uppercase">PEDIDO DE COMPRA</h1>
                </div>
              </div>

              {/* Informações Solicitante vs Fornecedora */}
              <div className="grid grid-cols-2 border-x border-b border-black divide-x divide-black">
                <div className="p-4 space-y-1">
                  <h3 className="font-bold text-blue-700 uppercase tracking-wider text-[11px] mb-2">FORNECEDORA</h3>
                  <div><strong>Razão Social:</strong> {fornecAtual?.nome}</div>
                  <div><strong>Endereço:</strong> {fornecAtual?.endereco}</div>
                  <div><strong>Bairro/Cidade:</strong> {fornecAtual?.bairro}</div>
                  <div><strong>CEP:</strong> {fornecAtual?.cep}</div>
                  <div><strong>CNPJ:</strong> {fornecAtual?.cnpj}</div>
                  <div><strong>I.E.:</strong> {fornecAtual?.ie}</div>
                  <div><strong>Telefone:</strong> {fornecAtual?.telefone}</div>
                  <div><strong>E-mail:</strong> {fornecAtual?.email}</div>
                  <div><strong>Contato:</strong> {fornecAtual?.contato}</div>
                </div>
                <div className="p-4 space-y-1">
                  <h3 className="font-bold text-blue-700 uppercase tracking-wider text-[11px] mb-2">SOLICITANTE</h3>
                  <div><strong>Razão Social:</strong> {minhaEmpresa.nome}</div>
                  <div><strong>Endereço:</strong> {minhaEmpresa.endereco}</div>
                  <div><strong>Bairro/Cidade:</strong> {minhaEmpresa.bairro}</div>
                  <div><strong>CEP:</strong> {minhaEmpresa.cep}</div>
                  <div><strong>CNPJ:</strong> {minhaEmpresa.cnpj}</div>
                  <div><strong>I.E.:</strong> {minhaEmpresa.ie}</div>
                  <div><strong>Telefone:</strong> {minhaEmpresa.telefone}</div>
                  <div><strong>E-mail:</strong> {minhaEmpresa.email}</div>
                  <div><strong>Contato:</strong> {minhaEmpresa.contato}</div>
                </div>
              </div>

              {/* Tabela de Produtos */}
              <table className="w-full mt-6 border-collapse text-[10px]">
                <thead>
                  <tr className="bg-gray-100 border border-black">
                    <th className="border border-black px-2 py-1.5 text-center font-bold uppercase w-12">Item</th>
                    <th className="border border-black px-2 py-1.5 text-left font-bold uppercase w-24">Código</th>
                    <th className="border border-black px-2 py-1.5 text-left font-bold uppercase">Descrição</th>
                    <th className="border border-black px-2 py-1.5 text-center font-bold uppercase w-20">Dimensão</th>
                    <th className="border border-black px-2 py-1.5 text-center font-bold uppercase w-16">Qtd.</th>
                    <th className="border border-black px-2 py-1.5 text-right font-bold uppercase w-24">Unitário</th>
                    <th className="border border-black px-2 py-1.5 text-right font-bold uppercase w-24">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {itensAtivos.map(({ item, qtd, subtotal }, index) => (
                    <tr key={item.id} className="border border-black">
                      <td className="border border-black px-2 py-1.5 text-center font-mono">{String(index + 1).padStart(2, '0')}</td>
                      <td className="border border-black px-2 py-1.5 font-mono font-bold">{item.cod}</td>
                      <td className="border border-black px-2 py-1.5">{item.desc}</td>
                      <td className="border border-black px-2 py-1.5 text-center">{item.tam}</td>
                      <td className="border border-black px-2 py-1.5 text-center font-mono">{qtd}</td>
                      <td className="border border-black px-2 py-1.5 text-right font-mono">{fmtBRL(item.preco)}</td>
                      <td className="border border-black px-2 py-1.5 text-right font-mono font-bold">{fmtBRL(subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Faturamento e Condições */}
              <div className="grid grid-cols-5 border-x border-b border-black divide-x divide-black mt-0">
                <div className="col-span-3 p-4 space-y-1">
                  <h4 className="font-bold mb-2">Observações de Faturamento:</h4>
                  <p className="text-[9px] text-gray-600 leading-relaxed">
                    Pedido de compra emitido eletronicamente para fins de consumo/produção. Solicitamos a confirmação imediata de recebimento do pedido, prazo de fabricação e previsão de despacho da carga.
                  </p>
                  <div className="pt-2 text-[10px]">
                    <strong>Condição de Pagamento:</strong> À Vista (PIX / Depósito Antecipado)<br />
                    <strong>Tipo de Envio:</strong> FOB (Retirada por conta do destinatário)
                  </div>
                </div>
                <div className="col-span-2 p-4 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span>Total Produtos:</span>
                      <span className="font-mono">{fmtBRL(totalPedido)}</span>
                    </div>
                    <div className="flex justify-between text-[9px] text-gray-500">
                      <span>IPI Estimado (0%):</span>
                      <span className="font-mono">R$ 0,00</span>
                    </div>
                    <div className="flex justify-between text-[9px] text-gray-500">
                      <span>Frete (FOB):</span>
                      <span className="font-mono">R$ 0,00</span>
                    </div>
                  </div>
                  <div className="border-t border-black pt-3 flex justify-between font-bold text-sm text-blue-700">
                    <span>TOTAL GERAL:</span>
                    <span className="font-mono">{fmtBRL(totalPedido)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BOTÕES DE EXPORTAÇÃO */}
          <div className="flex justify-center gap-4 py-2">
            <button
              onClick={downloadPDF}
              disabled={generatingPdf}
              className="inline-flex items-center gap-2 px-6 py-3 text-xs font-headline font-bold uppercase tracking-widest bg-green-700 text-white hover:bg-green-800 transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">
                {generatingPdf ? 'sync' : 'download'}
              </span>
              {generatingPdf ? 'Gerando...' : 'Salvar em PDF'}
            </button>
            <button
              onClick={handleWhatsApp}
              className="inline-flex items-center gap-2 px-6 py-3 text-xs font-headline font-bold uppercase tracking-widest bg-[#25D366] text-white hover:bg-[#1ebd53] transition-colors"
            >
              <span className="material-symbols-outlined text-sm font-bold">send</span>
              Enviar WhatsApp
            </button>
            <button
              onClick={() => setPreview(false)}
              className="inline-flex items-center gap-2 px-6 py-3 text-xs font-headline font-bold uppercase tracking-widest bg-surface-container-high text-on-surface hover:bg-surface-container-highest border border-outline-variant/30 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">close</span>
              Fechar Prévia
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
