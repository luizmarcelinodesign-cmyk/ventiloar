# 📱 Manual do Usuário - Tela de Admin

**Versão**: 1.0
**Público**: Administradores do Ventiloar  
**Objetivo**: Entender todas as funcionalidades de Admin

---

## 🔓 Como Acessar o Admin

1. Abra o site: `http://localhost:5173` (ou seu domínio)
2. Clique em "Admin" (canto superior direito)
3. Digite o PIN: **123456**
4. Clique em "Entrar"

✅ Você agora acesso total ao painel administrativo.

---

## 📊 Os 5 Painéis

### 1️⃣ **PAINEL GERAL**
Visão geral do sistema, atalhos rápidos.

**O que você vê:**
- Status do sistema
- Links para as outras abas
- Informações gerais

**O que fazer:**
- Apenas navegação, clique em outros painéis

---

### 2️⃣ **DASHBOARD**
Dados financeiros e resumo do negócio.

**O que você vê:**
- Receita total
- Produtos vendidos
- Dados de faturamento

**O que fazer:**
- Visualizar trends
- Exportar relatórios

---

### 3️⃣ **ENGENHARIA**
Especificações técnicas de produtos.

**O que você vê:**
- Lista de produtos em desenvolvimento
- Especificações técnicas
- Histórico de edições

**O que fazer:**
- Adicionar novo produto
- Editar especificações
- Ver quem editou e quando

---

### 4️⃣ **DADOS** ⭐ (NOVO!)
Gerencia TODOS os dados do sistema.

**O que você vê:**
- Abas para: Shopping List, Produtos, Pricing, Orçamentos, Dados Financeiros
- Tabela com todos os registros
- Botões: Novo, Editar, Deletar

**O que fazer:**
- ✅ Criar novo registro
- ✅ Editar registro existente  
- ✅ Deletar registro
- ✅ Buscar/filtrar
- ✅ Exportar para JSON
- ✅ Importar de JSON

> **Saiba mais**: [Seção "DADOS" detalhada abaixo](#funcionalidades-de-dados)

---

### 5️⃣ **AUDITORIA** ⭐ (NOVO!)
Histórico de tudo que foi feito.

**O que você vê:**
- Log completo de edições
- Quem fez, quando, o quê
- Antes e depois de cada mudança

**O que fazer:**
- 🔍 Filtrar por usuário
- 🔍 Filtrar por ação (criar/editar/deletar)
- 🔍 Filtrar por data
- 📊 Ver estatísticas
- 📥 Exportar relatório

> **Saiba mais**: [Seção "AUDITORIA" detalhada abaixo](#funcionalidades-de-auditoria)

---

## 💾 Funcionalidades de DADOS

### O Painel DADOS tem 5 abas:

#### 1. 📦 Shopping List
**Listas de compras/recursos necessários**
- Descrição do item
- Quantidade
- Status (ativo/inativo)

**Como adicionar:**
1. Clique em "Novo"
2. Preencha: Descrição, Quantidade
3. Clique "Salvar"
✅ Item criado! Auditoria registrada.

#### 2. 🏭 Produtos
**Catálogo de produtos Ventiloar**
- Nome
- Categoria
- Descrição

**Como editar:**
1. Encontre na tabela
2. Clique "Editar"
3. Mude o que quiser
4. Clique "Salvar"
✅ Mudança registrada em auditoria!

#### 3. 💰 Pricing
**Tabela de preços**
- Produto
- Custo base
- Margem
- Preço final

**Como deletar (cuidado!):**
1. Encontre na tabela
2. Clique "Deletar"
3. Confirme
⚠️ Item deletado! (mas histórico permanece)

#### 4. 📋 Orçamentos
**Orçamentos para clientes**
- Cliente
- Itens
- Total
- Data

**O que você pode fazer:**
- Ver todos os orçamentos pendentes
- Marcar como concluído
- Ver quem criou

#### 5. 💹 Dados Financeiros
**Resumo financeiro**
- Receita mensal
- Despesas
- Lucro

**O que você pode fazer:**
- Adicionar nova entrada
- Ver histórico de valores

---

### 🔧 Funções Especiais em DADOS

#### 🔄 Sincronizar Legacy
Se tiver dados antigos em outro lugar:
1. Clique "Sincronizar Legacy"
2. Dados migram para novo sistema
3. Verde ✅ = sucesso

#### 📤 Exportar JSON
Fazer backup dos dados:
1. Clique "Exportar [Nome da Aba]"
2. Arquivo baixa: `ventiloar_export.json`
3. Guarde em lugar seguro

#### 📥 Importar JSON
Restaurar com arquivo backup:
1. Clique "Importar"
2. Selecione arquivo `.json`
3. Dados restauram no sistema

---

## 📜 Funcionalidades de AUDITORIA

### O que é Auditoria?
**Registro permanente de tudo** que foi feito no sistema:
- Quem fez
- Quando fez  
- O quê fez (criar/editar/deletar)
- Como era antes
- Como ficou depois

### Como Usar

#### 1️⃣ Ver Tudo (Padrão)
Simplesmente abra a aba "AUDITORIA"
- Mostra últimas 100 ações
- Mais recentes em cima

#### 2️⃣ Filtrar por Usuário
```
Filtro: [dropdown] Usuário
Selecionar: admin
Resultado: Mostra só ações do admin
```

#### 3️⃣ Filtrar por Ação
```
Filtro: [dropdown] Ação
Opções: CREATE / UPDATE / DELETE
Resultado: Mostra só criações, edições ou deletados
```

#### 4️⃣ Filtrar por Data
```
Data de: 01/01/2025
Data até: 31/01/2025
Resultado: Mostra só janeiro
```

#### 5️⃣ Ver Antes e Depois
```
Clique na ação
Expande mostrando:
  ✓ Dados ANTES
  ✓ Dados DEPOIS
  ✓ Diferenças destacadas
```

#### 📊 Ver Estatísticas
No topo há cards mostrando:
- Total de ações
- Quantas criações
- Quantas edições
- Quantas deletações

#### 📥 Exportar Relatório
```
Clique "Exportar Auditoria"
Arquivo baixa: auditoria_report.json
Use em Excel/BI para análise
```

---

## 🔄 SINCRONIZAÇÃO (Novo Recurso!)

### O que é Sincronização?
Copiar dados do telemóvel/PC para a nuvem Supabase.

### Como Funciona
1. Você faz mudanças **no navegador** (funciona offline)
2. Quando tem internet, **sincroniza automaticamente** a cada 5 segundos
3. Dados ficam seguros na nuvem

### No Painel Admin

#### 📡 SyncStatus (Cards no topo)

**Online/Offline**
- 🟢 Verde = Internet OK
- 🔴 Vermelho = Sem internet (app continua funcionando!)

**Supabase Conectado**
- 🟢 Verde = Supabase OK
- 🟡 Amarelo = Supabase não configurado
- 🔴 Vermelho = Erro

**Auto-Sync**
- ON = Automático a cada 5s
- OFF = Manual (clique botão)

#### 🔘 Botões

**"Sincronizar"**
- Força sincronização imediata
- Use se dados não atualizarem

**"Auto ON/OFF"**
- Liga/desliga sincronização automática
- Padrão: ON

#### 📊 Tabela de Status

Mostra para cada coleção:
- Nome da coleção
- Quantos documentos
- Última sincronização

---

## ✅ Guia Rápido - Tarefas Comuns

### "Quero Adicionar um Novo Produto"
1. Admin → DADOS aba "Produtos"
2. Clique "Novo"
3. Preencha campos
4. Clique "Salvar"
✅ Pronto! Sincroniza automaticamente.

### "Quero Editar Preço de um Produto"
1. Admin → DADOS aba "Pricing"
2. Encontre na tabela
3. Clique "Editar"
4. Mude o preço
5. Clique "Salvar"
✅ Pronto! Histórico guardado.

### "Quero Ver Quem Mudou Algo"
1. Admin → AUDITORIA
2. Filtro: "Usuário" = admin
3. Expanda a ação (clique)
4. Veja Antes/Depois ✅

### "Quero Fazer Backup"
1. Admin → DADOS (qualquer aba)
2. Clique "Exportar [Aba]"
3. Arquivo baixa em JSON
4. Guarde em lugar seguro ✅

### "Quero Restaurar Backup"
1. Admin → DADOS
2. Clique "Importar"
3. Selecione arquivo .json
4. Dados restauram ✅

### "Dados Não Sincronizam"
1. Abra Admin
2. Veja SyncStatus (verde/vermelho?)
3. Se vermelho, clique "Sincronizar"
4. Aguarde 5 segundos
✅ Pronto!

### "Quero Relatório de Auditoria"
1. Admin → AUDITORIA
2. Configure filtros se necessário
3. Clique "Exportar Auditoria"
4. Arquivo baixa
5. Abra em Excel ✅

---

## ⚠️ Cuidado!

### Deletar é Permanente
Quando clica "Deletar":
- ❌ Dado sai da tabela
- ✅ Mas histórico permanece em AUDITORIA
- ✅ Pode recuperar se necessário

### Sincronização é Automática
- Não precisa fazer nada
- A cada 5 segundos, sincroniza
- Se estiver offline, espera conexão

### Backups são Importantes
- Exportar JSON regularmente
- Supabase faz backup automático
- Duas camadas de proteção

---

## 🎨 Interface Visual

### Paleta de Cores
```
Verde (✅) = Sucesso, online, pronto
Amarelo (⚠️) = Aviso, aguardando
Vermelho (❌) = Erro, offline, cuidado
Azul (ℹ️) = Informação, clicável
```

### Ícones Comuns
```
🔄 = Sincronizar, atualizar
📥 = Importar, transferir para dentro
📤 = Exportar, transferir para fora
🗑️ = Deletar, remover
✏️ = Editar, mudar
➕ = Novo, adicionar
🔍 = Buscar, filtrar
```

---

## 📞 Dúvidas Frequentes

**P: Preciso estar online para usar Admin?**  
R: Não! Funciona offline. Dados sincronizam quando voltar online.

**P: Posso deletar dados permanentemente?**  
R: Sim, mas fica registrado em AUDITORIA. Fale com dev para recuperar.

**P: Quanto tempo leva para sincronizar?**  
R: 5 segundos normalmente. Internet lenta pode levar mais.

**P: Por que vejo "modo offline"?**  
R: Supabase não está configurado (dev deve fazer). Use IndexedDB normalmente.

**P: Posso compartilhar dados entre usuários?**  
R: Sim! Supabase permite. Dev deve configurar RLS (permissões).

**P: Como faço backup completo?**  
R: Admin → DADOS → Exportar cada aba → Guarde arquivos JSON

**P: Dados são encriptados?**  
R: Em trânsito sim (HTTPS). No servidor é seguro. Dev pode ativar mais proteção.

---

## 🎯 Próximos Passos

1. ✅ Leia este manual
2. ✅ Acesse Admin (PIN: 123456)
3. ✅ Teste a aba DADOS
4. ✅ Teste a aba AUDITORIA
5. ✅ Faça um backup teste
6. ✅ Teste sincronização

Pronto! Você é um Admin Expert! 🎉

---

## 📚 Documentação para Desenvolvimento

Se é **desenvolvedor** e quer integrar o sistema:

- [ARCHITECTURE.md](ARQUITETURA_PERSISTENCIA.md) - Sistema técnico
- [SETUP_SUPABASE.md](SETUP_SUPABASE.md) - Backend setup
- [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) - Integração em pages
- [QUICKSTART.md](QUICKSTART.md) - Setup rápido

---

**Versão**: 1.0  
**Última atualização**: 13 de Abril de 2026  
**Status**: Pronto para uso! ✅
