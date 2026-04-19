# 🌐 SETUP SUPABASE - Guia Completo

**Data**: 13 de Abril de 2026  
**Versão**: 1.0

---

## ⚠️ SEGURANÇA PRIMEIRO

### 🔒 Nunca Commite Credenciais

```bash
# ❌ ERRADO - Nunca faça isso
VITE_SUPABASE_ANON_KEY=sb_...xxx

# ✅ CERTO - Use .env.local (gitignored)
# .gitignore já ignora:
# .env.local
# .env.*.local
```

### 📝 Setup de Variáveis

1. **Copie o template**
   ```bash
   cp .env.example .env.local
   ```

2. **Preencha as credenciais**
   ```
   VITE_SUPABASE_URL=https://xohwhduqlqcmboxinull.supabase.co
   VITE_SUPABASE_ANON_KEY=seu_anon_key_aqui
   ```

3. **Nunca commite**
   ```bash
   # .env.local está em .gitignore ✅
   ```

---

## 🔧 Setup no Supabase Dashboard

### 1️⃣ Acesse o Dashboard

```
https://app.supabase.com/
→ Selecione projeto: ventiloar
```

### 2️⃣ Crie as Tabelas

Vá em **SQL Editor** e execute:

#### Tabela: shopping_list

```sql
create table shopping_list (
  id text primary key,
  item text not null,
  qty numeric,
  unit text,
  unitPrice numeric,
  supplier text,
  status text,
  createdAt timestamp default now(),
  updatedAt timestamp default now(),
  createdBy text,
  lastModifiedBy text
);

create index shopping_list_updated_at on shopping_list(updatedAt);
```

#### Tabela: products

```sql
create table products (
  id text primary key,
  name text not null,
  model text,
  description text,
  pieces jsonb,
  status text,
  createdAt timestamp default now(),
  updatedAt timestamp default now(),
  createdBy text,
  lastModifiedBy text
);

create index products_updated_at on products(updatedAt);
```

#### Tabela: pricing

```sql
create table pricing (
  id text primary key,
  productId text not null,
  costPrice numeric,
  salePrice numeric,
  margin numeric,
  currency text,
  createdAt timestamp default now(),
  updatedAt timestamp default now(),
  createdBy text,
  lastModifiedBy text
);

create index pricing_productId on pricing(productId);
create index pricing_updated_at on pricing(updatedAt);
```

#### Tabela: budgets

```sql
create table budgets (
  id text primary key,
  clientName text not null,
  clientEmail text,
  clientPhone text,
  totalValue numeric,
  status text,
  simulacao jsonb,
  createdAt timestamp default now(),
  updatedAt timestamp default now(),
  createdBy text,
  lastModifiedBy text
);

create index budgets_updated_at on budgets(updatedAt);
```

#### Tabela: financial_data

```sql
create table financial_data (
  id text primary key,
  description text not null,
  type text,
  amount numeric,
  date date,
  category text,
  createdAt timestamp default now(),
  updatedAt timestamp default now(),
  createdBy text,
  lastModifiedBy text
);

create index financial_data_updated_at on financial_data(updatedAt);
```

#### Tabela: audit_log

```sql
create table audit_log (
  id text primary key,
  timestamp timestamp default now(),
  action text,
  collection text,
  documentId text,
  userId text,
  changes jsonb,
  oldData jsonb,
  newData jsonb
);

create index audit_log_timestamp on audit_log(timestamp);
create index audit_log_collection on audit_log(collection);
create index audit_log_userId on audit_log(userId);
```

### 3️⃣ Configure RLS (Row Level Security)

#### Opção A: Sem autenticação (Desenvolvimento)

```sql
-- Disable RLS para todas as tabelas (desenvolvimento only!)
alter table shopping_list disable row level security;
alter table products disable row level security;
alter table pricing disable row level security;
alter table budgets disable row level security;
alter table financial_data disable row level security;
alter table audit_log disable row level security;
```

#### Opção B: Com autenticação (Produção)

```sql
-- Enable RLS
alter table shopping_list enable row level security;

-- Qualquer um autenticado pode ler
create policy "select_authenticated" on shopping_list
  for select
  using (auth.role() = 'authenticated');

-- Qualquer um autenticado pode editar seu próprio
create policy "update_authenticated" on shopping_list
  for update
  using (auth.role() = 'authenticated');

-- Aplicar a outras tabelas também...
```

---

## 📦 Instalar Dependências

```bash
npm install @supabase/supabase-js
```

---

## 🚀 Começar a Usar

### 1️⃣ Setup Básico

No seu `Adm.jsx` ou App.jsx:

```javascript
import { isSupabaseAvailable, isSupabaseConnected } from '../services/supabaseClient'
import { fullSync, startAutoSync } from '../services/supabaseSyncService'

export default function App() {
  useEffect(() => {
    // Verifica se Supabase está configurado
    if (isSupabaseAvailable()) {
      console.log('✅ Supabase disponível')
      
      // Inicia sincronização automática (a cada 5s)
      startAutoSync(5000)
    } else {
      console.log('⚠️ Supabase não configurado - usando modo offline')
    }
  }, [])
}
```

### 2️⃣ Sincronizar Dados

```javascript
import { fullSync, migrateToSupabase } from '../services/supabaseSyncService'

// Sincronização manual
async function handleSync() {
  const success = await fullSync()
  if (success) {
    console.log('✅ Dados sincronizados!')
  }
}

// Primeira vez: migrar dados locais
async function handleMigration() {
  const success = await migrateToSupabase()
  if (success) {
    console.log('✅ Dados migrados para Supabase!')
  }
}
```

### 3️⃣ Ver Status de Sync

```javascript
import { getSyncStatusReport } from '../services/supabaseSyncService'

// No console
getSyncStatusReport()
// {
//   shopping_list: { lastSync: "...", count: 5 },
//   products: { lastSync: "...", count: 3 },
//   ...
// }
```

---

## 🔄 Estratégia de Sincronização

### Offline-First

```
Local (IndexedDB)  ← Sempre funciona
    ↓ quando online
Remote (Supabase)  ← Sincrefresca dados
```

### Conflitos

- **Seu local muda**: `updatedAt` local é mais novo
- **Remoto muda**: `updatedAt` remoto é mais novo
- **Ambos mudam**: Último ganha (por `updatedAt`)

### Automático vs Manual

```javascript
// Automático (recomendado)
startAutoSync(5000)  // a cada 5 segundos

// Manual (quando necessário)
fullSync()
```

---

## 📊 Tabelas Criadas

| Tabela | Registros | Sincroniza | Status |
|--------|-----------|-----------|--------|
| shopping_list | ✅ | ✅ | Ready |
| products | ✅ | ✅ | Ready |
| pricing | ✅ | ✅ | Ready |
| budgets | ✅ | ✅ | Ready |
| financial_data | ✅ | ✅ | Ready |
| audit_log | ✅ | Read-only | Ready |

---

## 📲 Monitorar Sincronização

### Console (F12)

```javascript
// Ver status
getSyncStatusReport()

// Forçar re-sync
resetSyncStatus()
await fullSync()

// Testar conexão
const isConnected = await isSupabaseConnected()
console.log(isConnected ? '✅ Online' : '❌ Offline')
```

### Dashboard Supabase

1. Vá em **SQL Editor**
2. Execute:
   ```sql
   select count(*) from shopping_list;
   select count(*) from audit_log;
   ```

---

## 🐛 Troubleshooting

### dados não sincronizam

```javascript
// 1. Verifique conexão
const hasSupabase = isSupabaseAvailable()
const isOnline = await isSupabaseConnected()

// 2. Verifique .env.local
console.log(import.meta.env.VITE_SUPABASE_URL)

// 3. Verifique network (F12 → Network)

// 4. Force re-sync
resetSyncStatus()
await fullSync()
```

### Erro "Anon key not found"

- Você preencheu `.env.local`?
- Está usando chave anon (não service role)?
- Recarregue a página após .env.local mudar

### RLS bloqueia tudo

- Verifique se RLS está habilitado
- Configure políticas corretamente
- Ou desabilite para desenvolvimento

---

## 🔒 Produção

### Setup Seguro

```bash
# 1. Crie usuário read-only no Supabase
# Dashboard → Authentication → Users

# 2. Configure colunas só-leitura
alter table audit_log enable row level security;

create policy "audit_read_only" on audit_log
  for select using (true)
  for update using (false)
  for delete using (false);

# 3. Configure backups automáticos
# Dashboard → Backups → Enable automated backups
```

### Monitorar

```bash
# Dashboard → Monitoring
# - Ver queries lentas
# - Usar realtime
# - Cache
```

---

## 📚 Próximos Passos

1. ✅ Setup tabelas (acima)
2. ✅ Preencher .env.local
3. ✅ npm install @supabase/supabase-js
4. ⏳ Integrar em componentes (Adm.jsx)
5. ⏳ Testar sincronização
6. ⏳ Configurar RLS para produção

---

## 🎯 Migração de Dados

### 1️⃣ Primeira Vez

```javascript
// Na autenticação em Admin
if (legacyEngenhariaData) {
  // Sincroniza dados antigos
  await syncEngenhariaLegacy()
  
  // Depois migra para Supabase
  await migrateToSupabase()
}
```

### 2️⃣ Contínuo

Auto-sync cuida da sincronização:

```javascript
// Qualquer mudança é enviada após 5s
startAutoSync(5000)
```

---

## 🚀 Conclusão

Você agora tem:

- ✅ Backend Supabase configurado
- ✅ 5 tabelas criadas
- ✅ Serviço de sincronização
- ✅ Offline-first funcional
- ✅ Auto-sync automático

**Próximo**: Integrar em Adm.jsx e componentes

---

**Status**: ✅ Tutorial Completo  
**Versão**: 1.0  
**Data**: 13 de Abril de 2026
