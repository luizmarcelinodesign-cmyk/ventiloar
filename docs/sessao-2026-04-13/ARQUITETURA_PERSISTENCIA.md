# Arquitetura de Persistência e Auditoria - Ventiloar

## 📋 Visão Geral

O sistema foi refatorado para incluir uma solução **centralizada**, **coerente** e **auditada** de persistência de dados. Tudo é automaticamente registrado em histórico com:

- ✅ **Timestamp** preciso
- ✅ **Usuário** que realizou a ação
- ✅ **Operação** (CREATE, UPDATE, DELETE, etc)
- ✅ **Campos alterados** (antes e depois)
- ✅ **Filtros** por usuário, coleção, data

---

## 🏗️ Arquitetura

```
src/
├── services/
│   ├── storageService.js     # IndexedDB + localStorage
│   └── auditService.js       # Histórico centralizado
└── components/
    ├── DataManager.jsx       # CRUD para todas entidades
    └── AuditLog.jsx          # Visualizar histórico
```

### Camadas

| Camada | Responsabilidade | Armazenamento |
|--------|------------------|---------------|
| **UI** | Componentes (DataManager, AuditLog) | - |
| **Storage** | CRUD operations com auditoria automática | IndexedDB |
| **Audit** | Registra todas ações em histórico | localStorage |

---

## 🗄️ Entidades Gerenciadas

Todas as seguintes coleções possuem CRUD + Auditoria:

1. **shopping_list** - Lista de compras (engenharia)
2. **products** - Produtos/Peças
3. **pricing** - Precificação
4. **budgets** - Orçamentos/Solicitações de clientes
5. **financial_data** - Dados financeiros do dashboard

---

## 🔧 Como Usar

### 1. **Adicionar um Documento**

```javascript
import { addDocument } from '../services/storageService'

const newItem = {
  item: 'Hélice 3 pás',
  qty: 50,
  unit: 'unidades',
  unitPrice: 45.50,
  supplier: 'Fornecedor XYZ',
  status: 'Pendente'
}

const created = await addDocument('shopping_list', newItem, 'admin')
// Automático: registra em auditoria!
```

### 2. **Listar Documentos**

```javascript
import { listDocuments } from '../services/storageService'

const items = await listDocuments('shopping_list')

// Com filtros
const filtered = await listDocuments('shopping_list', {
  status: 'Pendente',
  createdAfter: '2026-04-01'
})
```

### 3. **Atualizar Documento**

```javascript
import { updateDocument } from '../services/storageService'

const updates = {
  status: 'Recebido',
  qty: 48
}

await updateDocument('shopping_list', documentId, updates, 'admin')
// Automático: registra o quê mudou!
```

### 4. **Deletar Documento**

```javascript
import { deleteDocument } from '../services/storageService'

await deleteDocument('shopping_list', documentId, 'admin')
// Automático: registra a exclusão com dados antigos!
```

---

## 📊 Auditoria

### Ver Histórico de um Documento

```javascript
import { getDocumentHistory } from '../services/auditService'

const history = getDocumentHistory(documentId)
// [{
//   timestamp: "2026-04-13T14:30:00Z",
//   action: "UPDATE",
//   userId: "admin",
//   changes: {
//     status: { from: "Pendente", to: "Recebido" }
//   }
// }, ...]
```

### Ver Histórico de uma Coleção

```javascript
import { getCollectionHistory } from '../services/auditService'

const history = getCollectionHistory('shopping_list', limit=100)
```

### Ver Atividade de um Usuário

```javascript
import { getUserActivity } from '../services/auditService'

const adminActions = getUserActivity('admin')
```

### Filtros Avançados

```javascript
import { getAuditLog } from '../services/auditService'

const entries = getAuditLog({
  userId: 'admin',
  collection: 'shopping_list',
  action: 'UPDATE',
  fromDate: '2026-04-01',
  toDate: '2026-04-30'
})
```

### Estatísticas

```javascript
import { getAuditStats } from '../services/auditService'

const stats = getAuditStats()
// {
//   totalEntries: 1250,
//   uniqueUsers: 3,
//   uniqueCollections: 5,
//   actionCounts: { CREATE: 45, UPDATE: 200, DELETE: 5 }
// }
```

---

## 💾 Backup e Importação

### Exportar uma Coleção

```javascript
import { exportCollection } from '../services/storageService'

const json = await exportCollection('shopping_list')
// Salva em arquivo JSON
```

### Exportar Tudo

```javascript
import { exportAll } from '../services/storageService'

const backup = await exportAll()
// {
//   shopping_list: [...],
//   products: [...],
//   pricing: [...],
//   budgets: [...],
//   financial_data: [...]
// }
```

### Importar Dados

```javascript
import { importData } from '../services/storageService'

const jsonString = '...' // JSON com dados

await importData(jsonString, 'admin')
// Replaces entire collections!
// Auditoria registra a importação
```

### Sincronizar Dados Legados

```javascript
import { syncEngenhariaLegacy } from '../services/storageService'

await syncEngenhariaLegacy()
// Move dados do localStorage antigo para IndexedDB
```

---

## 🎨 Componentes UI

### DataManager

Gerenciador completo de CRUD para todas entidades:

```jsx
import DataManager from '../components/DataManager'

<DataManager />
// - Abas por coleção
// - Busca
// - CRUD completo
// - Importação/Exportação
// - Sincronização de dados legados
```

**Features:**
- ✅ Criar, Editar, Deletar documentos
- ✅ Busca em tempo real
- ✅ Exportar coleção individual
- ✅ Exportar backup completo
- ✅ Importar dados de arquivo JSON
- ✅ Sincronizar dados antigos do localStorage

### AuditLog

Visualização completa do histórico:

```jsx
import AuditLog from '../components/AuditLog'

<AuditLog />
// - Filtrar por usuário, coleção, ação, data
// - Expandir detalhes (antes/depois)
// - Estatísticas
// - Exportar relatório
```

**Features:**
- ✅ Filtros avançados
- ✅ Visualizar mudanças específicas
- ✅ Ver dados completos antes/depois
- ✅ Estatísticas de atividade
- ✅ Exportar auditoria em JSON

---

## 🔄 Estrutura de um Documento

Todos os documentos armazenados incluem automaticamente:

```javascript
{
  // Dados do usuário
  id: "unique-id",
  item: "Hélice 3 pás",
  qty: 50,
  
  // Metadata automática
  createdAt: "2026-04-13T10:00:00Z",
  updatedAt: "2026-04-13T14:30:00Z",
  createdBy: "admin",
  lastModifiedBy: "admin"
}
```

---

## 🚀 Painel Admin - Novo Fluxo

1. **Autenticação** → Sincroniza dados legados
2. **Painel Principal** → 4 novos cards:
   - Dashboard (Financeiro)
   - Engenharia (Produtos)
   - **Gerenciar Dados** ← NOVO
   - **Histórico** ← NOVO

3. **Aba Dados** → DataManager
   - Gerencia todas as 5 coleções
   - CRUD completo
   - Import/Export

4. **Aba Auditoria** → AuditLog
   - Visualiza histórico
   - Filtros avançados
   - Relatórios

---

## 📝 Exemplos de Integração

### Engenharia.jsx - Usar novo storage

**Antes (localStorage manual):**
```javascript
const saved = useMemo(() => {
  const raw = localStorage.getItem('ventiloar-engenharia')
  return raw ? JSON.parse(raw) : null
}, [])
```

**Depois (storageService):**
```javascript
useEffect(() => {
  loadData()
}, [])

async function loadData() {
  const items = await listDocuments('shopping_list')
  const products = await listDocuments('products')
  setShoppingList(items)
  setProducts(products)
}

// Ao adicionar item
const handleAddItem = async (item) => {
  await addDocument('shopping_list', item, 'admin')
  loadData()
}
```

### Orcamento.jsx - Persistir orçamentos

```javascript
import { addDocument } from '../services/storageService'

async function handleCriarOrcamento(form, simulacao) {
  const orcamento = {
    clientName: form.nome,
    clientPhone: form.celular,
    totalValue: simulacao.totalPrice,
    status: 'Novo',
    simulacao: simulacao,
    createdAt: new Date().toISOString()
  }
  
  await addDocument('budgets', orcamento, 'sistema')
}
```

---

## 🔒 Segurança

- ✅ Auditoria completa de todas ações
- ✅ Rastreamento de usuário
- ✅ Timestamps precisos
- ✅ Preservação de dados antes/depois
- ✅ Não há operações anônimas

---

## ⚙️ Configuração

### Limite de Entradas de Auditoria
```javascript
// Em auditService.js
const MAX_AUDIT_ENTRIES = 10000
```

### Stores/Coleções
```javascript
// Em storageService.js
const STORES = {
  shoppingList: 'shopping_list',
  products: 'products',
  pricing: 'pricing',
  budgets: 'budgets',
  financialData: 'financial_data',
}
```

---

## 📊 Dados Armazenados

| Coleção | Armazenamento | Limpo | Notas |
|---------|---------------|-------|-------|
| shopping_list | IndexedDB | × | Histórico completo |
| products | IndexedDB | × | Histórico completo |
| pricing | IndexedDB | × | Histórico completo |
| budgets | IndexedDB | × | Histórico completo |
| financial_data | IndexedDB | × | Histórico completo |
| audit_log | localStorage | Manual | Max 10k entradas |

---

## 🐛 Troubleshooting

### Dados não aparecem após importar?
```javascript
// Verifique o formato JSON
// Deve ter estrutura: { shopping_list: [], products: [], ... }
```

### Auditoria vazia?
```javascript
// Auditoria é carregada na inicialização
// Se o site foi aberto em aba privada, será diferente
```

### Sincronização legada não funcionou?
```javascript
// Verifique se há dados em 'ventiloar-engenharia' no localStorage
// O syncEngenhariaLegacy() removerá o item antigo após sincronizar
```

---

## 📞 Suporte

Para adicionar mais campos a uma coleção:

1. Edite `COLLECTIONS_CONFIG` em DataManager.jsx
2. Os campos aparecem automaticamente em CRUD
3. A auditoria registra as mudanças

---

**Arquitetura por:** Sistema de Persistência v1.0 (Abril 2026)
