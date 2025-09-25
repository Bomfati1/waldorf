# Sistema de Escola – Frontend (React + Vite) e Backend (Node + PostgreSQL)

Aplicação web para gestão de interessados e pré‑matrículas, com painel (dashboard), importação via Excel e integração com Google Forms.

## Visão geral

- Frontend em React (Vite) localizado em `escola/`
- Backend em Node.js/Express com PostgreSQL localizado em `backend/`
- Autenticação baseada em cookie (as rotas protegidas exigem `credentials: include` no fetch)
- Módulo de Pré‑matrículas com:
  - Lista com edição in‑line, mudança de status e exclusão
  - Dashboard com Canais de Aquisição e Evolução Mensal (com filtro de ano)
  - Importação de interessados via Excel
  - Webhook para receber respostas do Google Forms

## Estrutura do projeto

```
./backend          # API Express + integração PostgreSQL
./escola           # Frontend React (Vite)
```

## Requisitos

- Node.js 18+
- PostgreSQL 13+

## Configuração do Backend

1) Crie um arquivo `.env` em `backend/` com as variáveis (duas formas suportadas):

Usando DATABASE_URL:
```
DATABASE_URL=postgres://usuario:senha@host:5432/banco
PGSSL=true
JWT_SECRET=um_segredo_forte
PORT=3001
```

Ou usando variáveis individuais:
```
PGHOST=localhost
PGPORT=5432
PGUSER=usuario
PGPASSWORD=senha
PGDATABASE=banco
PGSSL=false
JWT_SECRET=um_segredo_forte
PORT=3001
```

2) Instale as dependências e rode:
```
cd backend
npm install
npm start
```

O backend ficará disponível em `http://localhost:3001`.

### Endpoints principais

- Autenticados (exigem cookie de sessão):
  - `GET /interessados` – lista interessados
  - `POST /interessados` – cria interessado (status padrão: "Entrou Em Contato")
  - `PUT /interessados/:id` – atualização parcial (mantém campos não enviados)
  - `DELETE /interessados/:id` – exclui interessado
  - `GET /interessados/dashboard-summary` – dados para o dashboard
  - `POST /interessados/upload-excel` – upload Excel para importar interessados

- Webhook Google Forms (não autenticado):
  - `POST /webhook` – recebe payload do Forms e insere em `interessados`

### Campo como_conheceu (Enum)

O backend normaliza `como_conheceu` para os valores usados no frontend:
`Google`, `Instagram`, `Facebook`, `Tik Tok`, `Indicação`, `Outro:`.
Valores desconhecidos e não vazios viram `Outro:`; strings vazias viram `null`.

### Data de contato

O webhook tenta converter o "Carimbo de data/hora" do Forms para ISO UTC e usa como `data_contato`. Se falhar, utiliza o timestamp atual.

## Configuração do Frontend

1) Instale dependências e rode:
```
cd escola
npm install
npm run dev
```

O frontend ficará em `http://localhost:5173` (padrão Vite).

### Pré‑matrículas – Funcionalidades

- Lista de interessados com filtros (nome, data, status)
- Edição in‑line com salvamento (`PUT /interessados/:id`)
- Mudança de status na própria lista
- Exclusão durante o modo de edição (`DELETE /interessados/:id`)
- Importação via Excel (`POST /interessados/upload-excel`)
- Dashboard:
  - Canais de Aquisição ampliado
  - Evolução Mensal com seletor de ano
  - (Distribuição por Status removida)

Observação: as chamadas protegidas usam `credentials: include` no `fetch`.

## Integração com Google Forms

- Publique o Forms para enviar um POST ao endpoint `POST /webhook`.
- O servidor faz o mapeamento flexível dos rótulos (ex.: "Nome Completo", "Telefone", "Como Conheceu", "Carimbo de data/hora").
- O log do webhook é salvo em `backend/logs/webhook_YYYY-MM-DD.json`.

## Importar via Excel

Na página de Pré‑matrículas use "Importar Interessados". Formatos aceitos: `.xlsx` e `.xls`.
Colunas recomendadas: Nome, Email (opcional), Telefone, Data (YYYY-MM-DD), Status, Intenção, Observações.

## Scripts úteis

Backend:
```
npm start       # inicia o servidor
```

Frontend:
```
npm run dev     # inicia o Vite em modo dev
npm run build   # build de produção
```

## Solução de problemas

- 401/403 ao salvar/alterar status: verifique autenticação e cookies; o frontend envia `credentials: include`.
- Erro de coluna inexistente `email`: a tabela `interessados` não possui `email`; o webhook já evita inserir esse campo.
- Dados do Forms não aparecem: confira os rótulos no Forms e o console do backend (serão logadas chaves e valores brutos), e se o backend está rodando.

---

Qualquer dúvida ou sugestão, abra uma issue ou entre em contato.
