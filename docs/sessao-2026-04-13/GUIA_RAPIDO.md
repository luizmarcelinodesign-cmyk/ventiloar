# 🚀 Guia Rápido - Integração com Novos Serviços

## Resumo Executivo

Novo sistema de **persistência centralizada + auditoria automática** foi implementado. Todos os dados agora passam por:

1. ✅ **IndexedDB** (armazenamento principal)
2. ✅ **Audit Log** (histórico com timestamp + usuário)
3. ✅ **DataManager UI** (CRUD visual)
4. ✅ **AuditLog UI** (histórico com filtros)

---

## O Que Mudou

### Antes (Engenharia.jsx)
```javascript
// localStorage manual, sem histórico
const saved = localStorage.getItem('ventiloar-engenharia')
localStorage.setItem('ventiloar-engenharia', JSON.stringify(data))
```

### Agora
```javascript
// IndexedDB + auditoria automática
const items = await listDocuments('shopping_list')
await addDocument('shopping_list', item, userId)
// ✅ Automaticamente registra em histórico!
```

---

## ⚡ Início Rápido

### 1. Listar Dados
```javascript
import { listDocuments } from '../services/storageService'

const [items, setItems] = useState([])

useEffect(() => {
  listDocuments('shopping_list').then(setItems)
}, [])
```

### 2. Adicionar Dados
```javascript
import { addDocument } from '../services/storageService'

const handleAdd = async (formData) => {
  await addDocument('shopping_list', formData, 'admin')
  // Dados salvos + auditados ✅
}
```

### 3. Atualizar Dados
```javascript
import { updateDocument } from '../services/storageService'

const handleUpdate = async (id, updates) => {
  await updateDocument('shopping_list', id, updates, 'admin')
  // Antes/depois registrado ✅
}
```

### 4. Deletar Dados
```javascript
import { deleteDocument } from '../services/storageService'

const handleDelete = async (id) => {
  await deleteDocument('shopping_list', id, 'admin')
  // Exclusão auditada ✅
}
```

---

## 📦 Coleções Disponíveis

Use em `listDocuments('colecao')`:

- `'shopping_list'` - Lista de compras
- `'products'` - Produtos/Peças
- `'pricing'` - Precificação
- `'budgets'` - Orçamentos
- `'financial_data'` - Dados financeiros

---

## 🔍 Ver Histórico

```javascript
import { getDocumentHistory } from '../services/auditService'

const history = getDocumentHistory(documentId)
history.forEach(entry => {
  console.log(`${entry.action} por ${entry.userId} em ${entry.timestamp}`)
})
```

---

## 📊 Dashboard Admin

Acesse em `/adm` (código: `123456`):

**Novo!** → Abas extras no painel:

| Aba | O Que Faz |
|-----|-----------|
| **Painel** | Overview com cards de acesso |
| **Dados** | CRUD visual para todas coleções |
| **Auditoria** | Histórico com filtros |

---

## 📁 Arquivos Criados

```
src/
├── services/
│   ├── storageService.js     ← Persistência (IndexedDB)
│   └── auditService.js       ← Histórico
└── components/
    ├── DataManager.jsx       ← CRUD UI
    └── AuditLog.jsx          ← Histórico UI
```

---

## ✅ Checklist de Migração

Para migrar um componente para o novo sistema:

- [ ] Trocar `localStorage.getItem()` → `await listDocuments()`
- [ ] Trocar `localStorage.setItem()` → `await addDocument()`
- [ ] Trocar `updates` → `await updateDocument()`
- [ ] Adicionar `import` dos services
- [ ] Testar em Admin → Dados tab
- [ ] Verificar histórico em Admin → Auditoria tab

---

## 🎯 Próximos Passos

1. **Engenharia.jsx**: Trocar para `storageService`
2. **Orcamento.jsx**: Salvar orçamentos em `budgets`
3. **Dashboard.jsx**: Carregar dados de `financial_data`
4. **Testar** em Admin → Abas Dados + Auditoria

---

## 💡 Dicas

- Sempre passe `userId` (padrão: `'admin'`)
- IndexedDB é assíncrono - use `await`
- Auditoria é automática - sem código extra!
- Dados legados sincronizam ao autenticar

---

**Versão**: 1.0 | **Data**: Abril 2026
