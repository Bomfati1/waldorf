# 🧪 GUIA DE TESTE - Planejamentos ISO

## ✅ Status da Implementação

### Componentes Verificados:

- ✅ **PlanejamentosISOPage.jsx** - Componente principal com seletor de turma
- ✅ **PlanejamentoISO.jsx** - Componente de visualização de semanas
- ✅ **App.jsx** - Rota `/home/planejamentos-iso` configurada
- ✅ **Sidebar.jsx** - Link "Planejamentos ISO" (📅)
- ✅ **Backend** - Rota `/planejamentos/semanas-iso/:ano/:mes` implementada

---

## 🔍 Teste Passo a Passo

### 1️⃣ Abra o Navegador

- URL: `http://localhost:5173`
- **Backend deve estar rodando:** `http://localhost:3001`

### 2️⃣ Faça Login

- Use suas credenciais normais
- Deve entrar no dashboard

### 3️⃣ Acesse Planejamentos ISO

**OPÇÃO A - Via Sidebar:**

1. Procure o ícone 📅 "Planejamentos ISO" na sidebar esquerda
2. Clique nele

**OPÇÃO B - Via URL direta:**

1. Cole na barra de endereço: `http://localhost:5173/home/planejamentos-iso`

---

## 📊 O Que Você DEVE Ver

### Cabeçalho da Página:

```
📅 Planejamentos por Semana ISO
Visualize e gerencie planejamentos usando semanas ISO 8601.
Semanas que atravessam meses aparecem em ambos!
```

### Seletor de Turma:

```
🏫 Selecione a Turma:
[Dropdown com lista de turmas]
```

### Banner Informativo:

```
ℹ️ O que são Semanas ISO?
Semanas ISO 8601 são o padrão internacional...
```

### Legenda:

- ⬜ Semana normal (apenas 1 mês)
- 🟥 Semana compartilhada (2 meses)
- 🟡 Pendente
- 🟢 Aprovado

### Calendário de Semanas:

```
← Anterior  |  NOVEMBRO 2025  |  Próximo →

┌─────────────────────────────────────┐
│ Semana 45              2025         │
│ 03/11 - 09/11                       │
│ [+ Criar Planejamento]              │
│ S T Q Q S S D                       │
│ 3 4 5 6 7 8 9                       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Semana 46              2025         │
│ 10/11 - 16/11                       │
│ [+ Criar Planejamento]              │
│ S T Q Q S S D                       │
│ 10 11 12 13 14 15 16                │
└─────────────────────────────────────┘
```

---

## 🐛 Se NÃO Aparecer Nada

### Abra o Console do Navegador (F12)

**Procure por estes logs:**

```
✅ 🚀 [APP] App.jsx renderizando...
✅ 📋 [APP] Rotas disponíveis: [...]
✅ 🎯 [PLANEJAMENTOS-ISO] Componente montado!
✅ 🔄 [PLANEJAMENTOS-ISO] useEffect disparado
✅ 📡 [PLANEJAMENTOS-ISO] Buscando turmas...
✅ 📊 [PLANEJAMENTOS-ISO] Response status: 200
✅ ✅ [PLANEJAMENTOS-ISO] Turmas carregadas: X
✅ 🎯 [PLANEJAMENTOS-ISO] Turma selecionada: Nome da Turma
✅ 📅 Buscando semanas para 11/2025, Turma: X
✅ ✅ Recebidas X semanas: [...]
```

### Se aparecer erros:

1. **Tire um print do console**
2. **Copie TODOS os erros em vermelho**
3. **Me envie aqui**

---

## 🔴 Possíveis Problemas e Soluções

### ❌ Problema: "No routes matched location"

**Solução:**

- Limpe o cache do navegador (Ctrl+Shift+R)
- Feche e abra o navegador
- Verifique se está em `http://localhost:5173` (não 5174)

### ❌ Problema: Página em branco

**Solução:**

1. Abra F12 (Console)
2. Procure por erros em vermelho
3. Verifique se backend está rodando

### ❌ Problema: "Carregando turmas..." infinito

**Solução:**

- Verifique se backend está rodando em `http://localhost:3001`
- Verifique se você está logado
- Verifique se há turmas cadastradas no sistema

### ❌ Problema: "Nenhuma semana encontrada"

**Solução:**

- Isso é normal se não houver planejamentos
- Tente navegar para outros meses (← →)
- Clique em "Criar Planejamento" para criar o primeiro

---

## 🎯 Ações Disponíveis

### Quando SEM planejamento:

- ✅ Botão **"+ Criar Planejamento"** deve aparecer

### Quando COM planejamento:

- ✅ Badge de status: **Pendente** ou **Aprovado**
- ✅ Botão **👁️ Ver** (visualizar)
- ✅ Botão **✏️ Editar** (editar)

### Navegação:

- ✅ **← Anterior** - Vai para mês anterior
- ✅ **Próximo →** - Vai para próximo mês

### Troca de Turma:

- ✅ Selecione outra turma no dropdown
- ✅ Página deve recarregar as semanas da nova turma

---

## 📸 TESTE AGORA!

1. Acesse: `http://localhost:5173/home/planejamentos-iso`
2. Tire um print da tela
3. Abra F12 e copie os logs
4. Me envie:
   - ✅ O que você vê na tela
   - ✅ Se há erros no console
   - ✅ Print da tela (se possível)

---

## 🆘 Checklist Rápido

- [ ] Backend rodando (`http://localhost:3001`)
- [ ] Frontend rodando (`http://localhost:5173`)
- [ ] Consegue fazer login
- [ ] Sidebar aparece
- [ ] Link "Planejamentos ISO" (📅) está visível
- [ ] Clicou no link
- [ ] Abriu Console (F12)
- [ ] Viu os logs de debug

**Me envie o resultado! 🚀**
