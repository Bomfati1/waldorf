# Escola — Backend (Node.js + Express + PostgreSQL)

Documentação detalhada do backend. Aqui você encontra opções de execução, integração com Google Forms (duas abordagens), estratégias de rematrícula e exclusão de alunos com FKs, troubleshooting e orientações para produção.

---

## Índice

- [Requisitos](#requisitos)
- [Ambiente (.env)](#ambiente-env)
- [Instalação e Execução](#instalação-e-execução)
- [Swagger](#swagger)
- [Integração Google Forms](#integração-google-forms)
  - [Opção A — Apps Script vinculado ao FORM (e.response)](#opção-a-—-apps-script-vinculado-ao-form-eresponse)
  - [Opção B — Apps Script vinculado à PLANILHA (e.namedValues)](#opção-b-—-apps-script-vinculado-à-planilha-enamedvalues)
  - [ngrok: opções, região, domínio fixo, headers](#ngrok-opções-região-domínio-fixo-headers)
  - [Alias opcional de rotas no backend](#alias-opcional-de-rotas-no-backend)
  - [Formato aceito no webhook](#formato-aceito-no-webhook)
- [Autenticação](#autenticação)
- [Turmas e Rematrícula](#turmas-e-rematrícula)
- [Presenças](#presenças)
- [Planejamentos (Semanas ISO)](#planejamentos-semanas-iso)
- [Uploads](#uploads)
- [Notificações](#notificações)
- [Exclusão de Aluno (ordem segura com FKs)](#exclusão-de-aluno-ordem-segura-com-fks)
- [Troubleshooting](#troubleshooting)
- [Produção (notas rápidas)](#produção-notas-rápidas)

---

## Requisitos

- Node.js 18.x (LTS)
- PostgreSQL 13+
- ngrok (opcional — para integrar Forms com seu localhost)

## Ambiente (.env)

Suportado via `DATABASE_URL` OU variáveis individuais:

```
# Forma 1 (string)
DATABASE_URL=postgres://usuario:senha@host:5432/banco
PGSSL=false

# Forma 2 (variáveis)
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=senha
PGDATABASE=escola
PGSSL=false

# App
PORT=3001
JWT_SECRET=sua_chave_segura
FRONTEND_ORIGIN=http://localhost:5173
RESET_LINK_ORIGIN=http://localhost:5173

# Email (SMTP - fallback)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app
EMAIL_FROM=seu-email@gmail.com

# Email (API - recomendado para produção)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxx
# OU
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxx
```

## Instalação e Execução

```
cd backend
npm install
node index.js
```

## Instalação e Execução

```
cd backend
npm install
node index.js
```

- Health: GET http://localhost:3001/
- Swagger: http://localhost:3001/api-docs

## Configuração de Email

O sistema suporta dois métodos para envio de emails de recuperação de senha:

### Método 1: API HTTP (Recomendado para Produção)

**Vantagens:**
- Maior confiabilidade em plataformas como Railway/Vercel
- Não bloqueado por firewalls SMTP
- Melhor deliverability

**Opções suportadas:**

#### Resend (recomendado)
1. Acesse [resend.com](https://resend.com) e crie uma conta
2. Vá para API Keys e gere uma chave
3. Configure no Railway: `RESEND_API_KEY=re_sua_chave_aqui`

#### SendGrid
1. Acesse [sendgrid.com](https://sendgrid.com) e crie uma conta
2. Vá para Settings > API Keys e gere uma chave
3. Configure no Railway: `SENDGRID_API_KEY=SG.sua_chave_aqui`

### Método 2: SMTP (Fallback/Local)

**Para Gmail:**
1. Ative a [verificação em duas etapas](https://myaccount.google.com/security)
2. Gere uma [senha de app](https://myaccount.google.com/apppasswords)
3. Configure as variáveis:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
EMAIL_FROM=seu-email@gmail.com
```

**Para outros provedores:**
Ajuste `SMTP_HOST`, `SMTP_PORT` conforme seu provedor (ex: smtp.outlook.com:587)

### Ordem de Prioridade

O sistema tenta enviar na seguinte ordem:
1. **API HTTP** (Resend/SendGrid) - se configurada
2. **SMTP** - como fallback

### Teste

Para testar o envio de email:

```bash
# Via API
curl -X POST http://localhost:3001/recuperar-senha \
  -H "Content-Type: application/json" \
  -d '{"email":"seu-email@exemplo.com"}'
```

Verifique os logs do backend para confirmar o envio.

## Swagger

- Documenta endpoints principais (autenticação, turmas, alunos, planejamentos, etc.).
- Se adicionar novos endpoints, atualize `backend/doc/swagger.yaml`.

## Integração Google Forms

Este backend expõe `POST /webhook` para receber envios do Forms.

### Opção A — Apps Script vinculado ao FORM (e.response)

- Editor do script do Form > Crie o script abaixo > Adicione um acionador “Ao enviar formulário” para a função `onFormSubmit`.
- NGROK_URL deve apontar para seu túnel e terminar com `/webhook`.

```javascript
const NGROK_URL = "https://SEU-NGROK.ngrok-free.app/webhook"; // ajuste

function onFormSubmit(e) {
  try {
    if (!e || !e.response) {
      Logger.log("Evento sem e.response (gatilho errado?).");
      return;
    }
    const r = e.response;
    const map = {};
    r.getItemResponses().forEach((ir) => {
      const k = ir.getItem().getTitle();
      let v = ir.getResponse();
      if (Array.isArray(v)) v = v.join(", ");
      map[k] = String(v ?? "").trim();
    });
    map["Carimbo de data/hora"] = r.getTimestamp
      ? r.getTimestamp().toISOString()
      : new Date().toISOString();

    const get = (keys) => {
      for (const k of keys) if (map[k] !== undefined) return map[k];
      return "";
    };
    const payload = {
      "Nome Completo": get(["Nome Completo", "Nome"]),
      Telefone: get(["Telefone", "WhatsApp", "Whatsapp", "Celular"]),
      "Como Conheceu": get(["Como Conheceu", "Origem", "Canal"]),
      "Carimbo de data/hora": map["Carimbo de data/hora"],
    };

    const resp = UrlFetchApp.fetch(NGROK_URL, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      headers: { "ngrok-skip-browser-warning": "true" },
      muteHttpExceptions: true,
    });
    Logger.log(`Resp: ${resp.getResponseCode()} - ${resp.getContentText()}`);
  } catch (err) {
    Logger.log("Erro onFormSubmit: " + err);
  }
}
```

### Opção B — Apps Script vinculado à PLANILHA (e.namedValues)

- Abra a planilha de respostas > Extensões > Apps Script.
- Crie o script abaixo e adicione o acionador “Ao enviar formulário” (Da planilha) para `onFormSubmitSheet`.

```javascript
const NGROK_URL = "https://SEU-NGROK.ngrok-free.app/webhook";

function onFormSubmitSheet(e) {
  try {
    const nv = e && e.namedValues ? e.namedValues : {};
    const get = (keys) => {
      for (const k of keys)
        if (nv[k] && nv[k][0] !== undefined) return String(nv[k][0]).trim();
      return "";
    };
    const payload = {
      "Nome Completo": get(["Nome Completo", "Nome"]),
      Telefone: get(["Telefone", "WhatsApp", "Whatsapp", "Celular"]),
      "Como Conheceu": get(["Como Conheceu", "Origem", "Canal"]),
      "Carimbo de data/hora":
        get(["Carimbo de data/hora", "Timestamp", "Data"]) ||
        new Date().toISOString(),
    };
    const resp = UrlFetchApp.fetch(NGROK_URL, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      headers: { "ngrok-skip-browser-warning": "true" },
      muteHttpExceptions: true,
    });
    Logger.log(`Resp: ${resp.getResponseCode()} - ${resp.getContentText()}`);
  } catch (err) {
    Logger.log("Erro onFormSubmitSheet: " + err);
  }
}
```

### ngrok: opções, região, domínio fixo, headers

- Login (uma vez): `ngrok config add-authtoken <TOKEN>`
- Subir túnel (região SA): `ngrok http --region=sa 3001`
- Domínio fixo (plano free com subdomínio): `ngrok http --domain=<sub>.ngrok-free.app 3001`
- Se o túnel reiniciar, a URL muda — atualize no Apps Script.
- O header `ngrok-skip-browser-warning: true` remove o aviso do ngrok.

### Alias opcional de rotas no backend

Se quiser aceitar POST na raiz `/` ou em `/interessados/lote`, você pode adicionar aliases que redirecionam (307) para `/webhook` (não vem por padrão para evitar comportamento implícito). Adicione no `index.js`:

```js
app.use(express.urlencoded({ extended: true })); // aceita form-encoded

app.post("/", (req, res) => res.redirect(307, "/webhook"));
app.post("/interessados/lote", (req, res) => res.redirect(307, "/webhook"));
```

### Formato aceito no webhook

- JSON com chaves como: `Nome Completo`, `Telefone`, `Como Conheceu`, `Carimbo de data/hora`.
- O backend normaliza `como_conheceu` para: `Google`, `Instagram`, `Facebook`, `Tik Tok`, `Indicação`, `Outro:`.
- Converte carimbo `dd/MM/yyyy HH:mm` para ISO quando possível; fallback para `new Date().toISOString()`.
- Logs do dia: `backend/logs/webhook_YYYY-MM-DD.json`.

## Autenticação

- `POST /login` → define cookie httpOnly `authToken` (24h ou 30d com rememberMe)
- `GET /auth/me` → retorna dados do usuário logado
- `POST /logout` → limpa cookie
- Use `credentials: include` no frontend.

## Turmas e Rematrícula

- `GET /turmas`, `GET /turmas/:id/alunos`, `POST /turmas`
- Rematrícula com UPSERT (sem duplicar `aluno_id` em `turma_alunos`):
  - `POST /turmas/:turmaOrigemId/rematricula`
  - Body:
    ```json
    { "turmaDestinoId": 13, "alunosIds": [9, 11], "novoAnoLetivo": 2025 }
    ```
  - Implementação (resumo):
    ```sql
    INSERT INTO turma_alunos (turma_id, aluno_id)
    VALUES ...
    ON CONFLICT (aluno_id) DO UPDATE SET turma_id = EXCLUDED.turma_id;
    ```

## Presenças

- `GET /turmas/:turmaId/presencas?data=YYYY-MM-DD`
- `POST /turmas/:turmaId/presencas` (UPSERT por `(aluno_id, turma_id, data_aula)`).

## Planejamentos (Semanas ISO)

- Utilitário em `backend/utils/semanaUtils.js`.
- Endpoints para consultar semanas ISO, criar/buscar planejamentos por semana/ano.
- Scripts de teste: `backend/test_semana_iso.js`.

## Uploads

- Relatórios: `POST /relatorios/upload` (multipart) → salva em `uploads/relatorios/`
- Anexos de planejamento: `POST /planejamentos/:id/anexos`
- Fotos:
  - Usuário: `POST /upload-profile-photo`, `DELETE /remove-profile-photo`
  - Aluno: `POST /alunos/:alunoId/upload-photo`, `DELETE /alunos/:alunoId/remove-photo`

## Notificações

- `GET /notificacoes` (com autenticação)
- `PATCH /notificacoes/:id/ler`
- `PATCH /notificacoes/ler-todas`

## Exclusão de Aluno (ordem segura com FKs)

Para evitar violação de FK (ex.: `presencas_aluno_id_fkey`):

1. `DELETE FROM presencas WHERE aluno_id = $1`
2. `DELETE FROM turma_alunos WHERE aluno_id = $1`
3. `DELETE FROM aluno_familias WHERE aluno_id = $1`
4. `DELETE FROM alunos WHERE id = $1`
5. Se a família ficou sem vínculos: `DELETE FROM familias WHERE id = $familia_id`

O backend já implementa essa ordem com logs adicionais de diagnóstico.

## Troubleshooting

- `Cannot POST /` (404 pelo ngrok): use `/webhook` no Apps Script ou adicione aliases conforme acima.
- `ERR_NGROK_3200`: túnel offline. Rode `ngrok http --region=sa 3001` e atualize a URL.
- `23505 turma_alunos_aluno_id_key`: já resolvido via UPSERT no endpoint de rematrícula.
- `401/403`: autenticação ausente/expirada. Faça login (cookie `authToken`).
- CORS: ajuste `FRONTEND_ORIGIN` no `.env`.

## Produção (notas rápidas)

- Use HTTPS atrás de um proxy (Nginx/Ingress) e `secure: true` no cookie.
- Gere `JWT_SECRET` forte.
- Configure logs rotativos para `backend/logs/`.
- Aplique migrações versionadas e backups do PostgreSQL.
- ngrok é apenas para desenvolvimento; em produção, exponha o endpoint público real.
