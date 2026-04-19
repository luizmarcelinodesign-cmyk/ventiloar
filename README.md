# Ventiloar Web

Sistema web da Ventiloar com painel administrativo, gestão de dados, auditoria e persistência em Supabase.

## Visão Geral

Este projeto evoluiu de uma estrutura de site para um sistema web com:

- Administração autenticada por PIN
- CRUD visual de coleções de negócio
- Histórico de auditoria de ações
- Persistência centralizada no Supabase
- Frontend React com Vite e TailwindCSS

## Tecnologias

- React 18
- React Router
- Vite
- TailwindCSS
- Supabase (PostgreSQL + API)

## Estrutura Principal

- [src/pages/Adm.jsx](src/pages/Adm.jsx): painel administrativo
- [src/components/DataManager.jsx](src/components/DataManager.jsx): CRUD visual das coleções
- [src/components/AuditLog.jsx](src/components/AuditLog.jsx): consulta e filtros de auditoria
- [src/components/SyncStatus.jsx](src/components/SyncStatus.jsx): status de conexão com Supabase
- [src/services/storageService.js](src/services/storageService.js): camada de dados (Supabase-only)
- [src/services/auditService.js](src/services/auditService.js): auditoria no Supabase
- [src/services/supabaseClient.js](src/services/supabaseClient.js): inicialização e validação de configuração

## Novidades Adicionadas

Nesta sessão, o projeto recebeu uma atualização estrutural para ambiente web real com backend único.

### 1. Persistência Supabase-Only

- Removido o fallback offline em IndexedDB/localStorage
- Supabase passou a ser fonte única de dados
- Operações de CRUD executadas diretamente nas tabelas remotas

### 2. Auditoria em Banco

- Auditoria migrada para tabela `audit_log` no Supabase
- Registro automático em create/update/delete/import/replace
- Filtros de auditoria mantidos no painel administrativo

### 3. UI Administrativa Atualizada

- Ajustes no painel para remover fluxos legados de sincronização local
- Componente de status mostra configuração/conectividade Supabase
- DataManager e AuditLog operam com chamadas assíncronas em banco

### 4. Organização de Documentação

Os documentos criados na sessão foram organizados em:

- [docs/sessao-2026-04-13](docs/sessao-2026-04-13)

## Variáveis de Ambiente

Crie [ .env.local ](.env.local) (não versionado) com:

```env
VITE_SUPABASE_URL=https://xohwhduqlqcmboxinull.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=SEU_TOKEN
```

Observação:

- O cliente também aceita `VITE_SUPABASE_ANON_KEY`
- Prioridade atual: `VITE_SUPABASE_ANON_KEY` ou, se ausente, `VITE_SUPABASE_PUBLISHABLE_KEY`

## Como Rodar

```bash
npm install
npm run dev
```

Build de produção:

```bash
npm run build
```

## Rotas e Acesso

- App: `/ventiloar/`
- Admin: `/adm`
- PIN padrão atual: `123456`

## Coleções de Dados

Coleções manipuladas no Admin:

- `shopping_list`
- `products`
- `pricing`
- `budgets`
- `financial_data`

Auditoria:

- `audit_log`

## Setup do Banco

Para criar e configurar tabelas/políticas no Supabase, consulte:

- [docs/sessao-2026-04-13/SETUP_SUPABASE.md](docs/sessao-2026-04-13/SETUP_SUPABASE.md)

Para integração e uso das funcionalidades:

- [docs/sessao-2026-04-13/INTEGRATION_GUIDE.md](docs/sessao-2026-04-13/INTEGRATION_GUIDE.md)
- [docs/sessao-2026-04-13/MANUAL_USUARIO.md](docs/sessao-2026-04-13/MANUAL_USUARIO.md)

## Status Atual

- Build validado com sucesso
- Projeto operando em arquitetura web com backend único (Supabase)
- Documentação complementar organizada na pasta de sessão
