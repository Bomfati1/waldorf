require("dotenv").config();
// Importa as bibliotecas necessárias
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const db = require("./db"); // Importa nossa configuração do banco de dados
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");
const xlsx = require("xlsx"); // Para ler arquivos Excel
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
// Swagger UI e YAML
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const swaggerDocument = YAML.load(path.join(__dirname, "doc", "swagger.yaml"));
// Inicializa o aplicativo Express
const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT) : 3001; // Define a porta em que o servidor vai rodar
const pool = require("./db");

// Chave secreta para JWT (em produção, use uma variável de ambiente)
const JWT_SECRET =
  process.env.JWT_SECRET || "sua_chave_secreta_muito_segura_aqui_2024";

// Middlewares
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
app.use(
  cors({
    origin: [FRONTEND_ORIGIN, "http://localhost:5173", "http://localhost:5174"], // Aceita múltiplas origens
    credentials: true, // Permite cookies
  })
); // Habilita o CORS para permitir requisições do frontend
app.use(express.json()); // Permite que o servidor entenda JSON no corpo das requisições
app.use(cookieParser()); // Permite que o servidor leia cookies

// Rota da documentação Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Utilitário opcional para envio de email (carregado sob demanda)
async function sendResetEmail(to, resetLink) {
  try {
    const nodemailer = require("nodemailer");
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } =
      process.env;

    if (!SMTP_HOST) {
      console.log("SMTP não configurado. Link de recuperação:", resetLink);
      return;
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT ? parseInt(SMTP_PORT) : 587,
      secure: false,
      auth: SMTP_USER
        ? {
            user: SMTP_USER,
            pass: SMTP_PASS,
          }
        : undefined,
    });

    await transporter.sendMail({
      from: EMAIL_FROM || "no-reply@escola.local",
      to,
      subject: "Recuperação de senha - Sistema Escolar",
      text: `Para redefinir sua senha, acesse: ${resetLink}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; text-align: center;">Recuperação de Senha</h2>
          <p>Olá,</p>
          <p>Você solicitou a recuperação de senha para sua conta no Sistema Escolar.</p>
          <p>Para redefinir sua senha, clique no botão abaixo:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Redefinir Senha</a>
          </div>
          <p>Ou copie e cole este link no seu navegador:</p>
          <p style="word-break: break-all; color: #666;">${resetLink}</p>
          <p><strong>Importante:</strong> Este link expira em 10 minutos por motivos de segurança.</p>
          <p>Se você não solicitou esta recuperação de senha, ignore este email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">Este é um email automático, não responda a esta mensagem.</p>
        </div>
      `,
    });
  } catch (err) {
    console.log(
      "Falha ao enviar e-mail. Link de recuperação:",
      resetLink,
      "Erro:",
      err.message
    );
  }
}

app.post("/login", async (req, res) => {
  const { email, password, rememberMe } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email e senha são obrigatórios." });
  }
  try {
    const userQuery = await db.query(
      "SELECT * FROM usuarios WHERE email = $1",
      [email]
    );
    if (userQuery.rows.length === 0) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }
    const user = userQuery.rows[0];
    const isMatch = await bcrypt.compare(password, user.senha);
    if (!isMatch) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    // Criar payload do token JWT
    const payload = {
      userId: user.id,
      email: user.email,
      nome: user.nome,
      cargo: user.cargo,
    };

    // Gerar token JWT
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: rememberMe ? "30d" : "24h", // 30 dias se "lembre de mim", 24h se não
    });

    // Configurar cookie
    const cookieOptions = {
      httpOnly: true, // Cookie não pode ser acessado via JavaScript
      secure: false, // Em produção, deve ser true para HTTPS
      sameSite: "strict", // Proteção contra CSRF
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000, // 30 dias ou 24h
    };

    // Definir cookie
    res.cookie("authToken", token, cookieOptions);

    res.status(200).json({
      message: "Login bem-sucedido!",
      userId: user.id,
      nome: user.nome,
      cargo: user.cargo,
      email: user.email,
      rememberMe: rememberMe,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Erro no servidor." });
  }
});

// Middleware para verificar token JWT
const authenticateToken = (req, res, next) => {
  const token = req.cookies.authToken;

  if (!token) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Token inválido ou expirado" });
    }
    req.user = user;
    next();
  });
};

// Rota para verificar se o usuário está logado
app.get("/auth/me", authenticateToken, async (req, res) => {
  try {
    // Busca os dados completos do usuário incluindo a foto de perfil
    const userQuery = await db.query(
      "SELECT id, nome, email, cargo, foto_perfil FROM usuarios WHERE id = $1",
      [req.user.userId]
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const user = userQuery.rows[0];
    res.json({
      userId: user.id,
      email: user.email,
      nome: user.nome,
      cargo: user.cargo,
      foto_perfil: user.foto_perfil,
    });
  } catch (err) {
    console.error("Erro ao buscar dados do usuário:", err.message);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Rota para fazer logout
app.post("/logout", (req, res) => {
  res.clearCookie("authToken", {
    httpOnly: true,
    secure: false,
    sameSite: "strict",
  });
  res.json({ message: "Logout realizado com sucesso" });
});

// --- Controle de Acesso baseado em cargo/role ---
const normalizeRole = (role) => {
  if (!role) return "";
  return String(role)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z_]/g, "");
};

// Função específica para normalizar cargos do banco
const normalizeCargo = (cargo) => {
  if (!cargo) return "";
  return String(cargo)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z_]/g, "");
};

const authorizeRoles =
  (...allowed) =>
  (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Não autenticado" });
    const userRole = normalizeCargo(req.user.cargo);
    const allowedNormalized = allowed.map(normalizeCargo);
    console.log("Verificando autorização:", {
      userCargo: req.user.cargo,
      normalizedUserRole: userRole,
      allowedRoles: allowed,
      normalizedAllowed: allowedNormalized,
    });
    if (!allowedNormalized.includes(userRole)) {
      return res.status(403).json({ error: "Acesso negado" });
    }
    return next();
  };

// Início do fluxo de recuperação de senha
app.post("/recuperar-senha", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email é obrigatório." });
    }

    const userQuery = await db.query(
      "SELECT id, email, nome FROM usuarios WHERE LOWER(email) = LOWER($1)",
      [email]
    );

    // Resposta genérica para não vazar existência de e-mails
    const genericMsg = {
      message:
        "Se o email estiver cadastrado, enviaremos um link de recuperação.",
    };

    if (userQuery.rows.length === 0) {
      return res.status(200).json(genericMsg);
    }

    const user = userQuery.rows[0];
    const resetToken = jwt.sign(
      { type: "password_reset", userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "10m" }
    );

    // Link para a página do frontend que irá receber o token
    const RESET_LINK_ORIGIN = process.env.RESET_LINK_ORIGIN || FRONTEND_ORIGIN;
    const resetLink = `${RESET_LINK_ORIGIN.replace(
      /\/$/,
      ""
    )}/resetar-senha?token=${encodeURIComponent(resetToken)}`;

    // Tenta enviar o e-mail; se SMTP não estiver configurado, loga o link
    await sendResetEmail(user.email, resetLink);

    return res.status(200).json(genericMsg);
  } catch (err) {
    console.error("Erro em /recuperar-senha:", err);
    return res.status(500).json({ error: "Erro no servidor." });
  }
});

app.post("/resetar-senha", async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res
        .status(400)
        .json({ error: "Token e nova senha são obrigatórios." });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res
          .status(400)
          .json({ error: "O link expirou. Solicite um novo." });
      }
      return res.status(400).json({ error: "Token inválido." });
    }

    if (decoded.type !== "password_reset") {
      return res.status(400).json({ error: "Token inválido." });
    }

    const userId = decoded.userId;
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    await db.query("UPDATE usuarios SET senha = $1 WHERE id = $2", [
      hashedPassword,
      userId,
    ]);

    return res.json({ message: "Senha atualizada com sucesso." });
  } catch (err) {
    console.error("Erro em /resetar-senha:", err);
    return res.status(500).json({ error: "Erro no servidor." });
  }
});
// Fim do fluxo de recuperação de senha

// Servir arquivos estáticos da pasta 'uploads'
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// Servir arquivos estáticos da pasta 'uploads/aluno_image' especificamente
app.use(
  "/uploads/aluno_image",
  express.static(path.join(__dirname, "uploads/aluno_image"))
);

// --- CONFIGURAÇÃO DO MULTER ---
// Define onde os arquivos serão salvos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Salva os arquivos na pasta 'uploads/'
  },
  filename: function (req, file, cb) {
    // Garante que cada arquivo tenha um nome único (timestamp + nome original)
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

// Multer para upload em memória (para processamento de arquivos Excel)
const memoryUpload = multer({ storage: multer.memoryStorage() });

// Multer específico para upload de imagens de perfil
const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/image/"); // Salva as imagens na pasta 'uploads/image/'
  },
  filename: function (req, file, cb) {
    // Gera um nome único para a imagem: userId_timestamp.extensao
    const userId = req.user?.userId || "unknown";
    const timestamp = Date.now();
    const extension = file.originalname.split(".").pop();
    cb(null, `profile_${userId}_${timestamp}.${extension}`);
  },
});

const imageUpload = multer({
  storage: imageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite de 5MB
  },
  fileFilter: function (req, file, cb) {
    // Aceita apenas imagens
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Apenas arquivos de imagem são permitidos!"), false);
    }
  },
});

// --- ROTAS ---

// --- ROTAS PARA RELATÓRIOS ---
// Garante que o diretório de uploads de relatórios exista
const relatoriosUploadDir = path.join(__dirname, "uploads", "relatorios");
if (!fs.existsSync(relatoriosUploadDir)) {
  fs.mkdirSync(relatoriosUploadDir, { recursive: true });
}

// Configuração do multer para relatórios
const relatoriosStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, relatoriosUploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_"));
  },
});

const relatoriosUpload = multer({ storage: relatoriosStorage });

// Função auxiliar para determinar o tipo MIME
function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls": "application/vnd.ms-excel",
    ".xlsx":
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".txt": "text/plain",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
  };

  return mimeTypes[ext] || "application/octet-stream";
}

// Rota para buscar todos os relatórios
app.get("/relatorios", async (req, res) => {
  try {
    const query = `
      SELECT 
        r.id,
        r.nome_arquivo,
        r.nome_original,
        r.tipo_mime,
        r.tamanho_bytes,
        r.data_upload,
        r.tipo_destino,
        r.destino_id,
        r.caminho_arquivo,
        CASE 
          WHEN r.tipo_destino = 'aluno' THEN a.nome_completo
          WHEN r.tipo_destino = 'turma' THEN t.nome_turma
        END as nome_destino
      FROM relatorios r
      LEFT JOIN alunos a ON r.tipo_destino = 'aluno' AND r.destino_id = a.id
      LEFT JOIN turmas t ON r.tipo_destino = 'turma' AND r.destino_id = t.id
      ORDER BY r.data_upload DESC
    `;

    const { rows } = await pool.query(query);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Erro ao buscar relatórios:", error);
    res
      .status(500)
      .json({ error: "Erro interno do servidor ao buscar relatórios." });
  }
});

// Rota para upload de relatórios
app.post(
  "/relatorios/upload",
  relatoriosUpload.single("relatorio"),
  async (req, res) => {
    const { tipo, alunoId, turmaId } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo foi enviado." });
    }

    // Validação dos IDs
    const finalAlunoId = tipo === "aluno" ? parseInt(alunoId, 10) : null;
    const finalTurmaId = tipo === "turma" ? parseInt(turmaId, 10) : null;

    // Validação geral dos dados
    if (
      !tipo ||
      (tipo === "aluno" && !finalAlunoId) ||
      (tipo === "turma" && !finalTurmaId)
    ) {
      // Se a validação falhar, removemos o arquivo órfão que foi salvo
      fs.unlinkSync(req.file.path);
      return res
        .status(400)
        .json({ error: "Dados incompletos ou inválidos para o upload." });
    }

    // Extrai todas as informações necessárias do arquivo
    const { originalname, mimetype, size, filename } = req.file;
    const relativePath = path
      .join("uploads", "relatorios", filename)
      .replace(/\\/g, "/");

    try {
      const query = `
      INSERT INTO relatorios 
        (nome_arquivo, nome_original, tipo_mime, tamanho_bytes, tipo_destino, destino_id, caminho_arquivo)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id;
    `;

      const queryParams = [
        filename,
        originalname,
        mimetype,
        size,
        tipo,
        tipo === "aluno" ? finalAlunoId : finalTurmaId,
        relativePath,
      ];

      const result = await pool.query(query, queryParams);

      res.status(201).json({
        message: "Relatório enviado com sucesso!",
        relatorioId: result.rows[0].id,
        file: req.file,
      });
    } catch (error) {
      // Log detalhado do erro para depuração
      console.error("Erro ao salvar relatório no banco de dados:", {
        message: error.message,
        code: error.code,
        detail: error.detail,
      });

      // Se houver erro no DB, também removemos o arquivo salvo
      fs.unlinkSync(req.file.path);

      // Retorna uma mensagem de erro mais específica se possível
      if (error.code === "23503") {
        // Foreign key violation
        return res
          .status(404)
          .json({ error: "O aluno ou turma selecionado não foi encontrado." });
      }

      res
        .status(500)
        .json({ error: "Erro interno do servidor ao salvar o relatório." });
    }
  }
);

// Rota para deletar relatórios
app.delete("/relatorios/:id", async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Busca o caminho do arquivo no banco antes de deletar o registro
    const selectResult = await client.query(
      "SELECT caminho_arquivo FROM relatorios WHERE id = $1",
      [id]
    );

    if (selectResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Relatório não encontrado." });
    }

    const dbPath = selectResult.rows[0].caminho_arquivo;
    const absoluteFilePath = path.join(__dirname, dbPath);

    // 2. Deleta o registro do banco de dados
    await client.query("DELETE FROM relatorios WHERE id = $1", [id]);

    // 3. Deleta o arquivo físico do servidor
    if (fs.existsSync(absoluteFilePath)) {
      fs.unlinkSync(absoluteFilePath);
    } else {
      console.warn(
        `Arquivo físico não encontrado em: ${absoluteFilePath}. O registro no banco de dados foi removido.`
      );
    }

    await client.query("COMMIT");
    res.status(200).json({ message: "Relatório excluído com sucesso." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erro ao excluir relatório:", error);
    res
      .status(500)
      .json({ error: "Erro interno do servidor ao excluir o relatório." });
  } finally {
    client.release();
  }
});

// Rota para buscar todos os responsáveis
app.get("/responsaveis", authenticateToken, async (req, res) => {
  try {
    const query =
      "SELECT id, nome_completo, email, telefone, outro_telefone, data_cadastro, rg, cpf FROM familias ORDER BY nome_completo ASC";
    const { rows } = await pool.query(query);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Erro ao buscar responsáveis:", err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Rota para buscar um responsável específico pelo ID
app.get("/responsaveis/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const query = "SELECT * FROM familias WHERE id = $1";
    const { rows } = await pool.query(query, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Responsável não encontrado." });
    }
    res.status(200).json(rows[0]);
  } catch (err) {
    console.error("Erro ao buscar responsável:", err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Rota para buscar os alunos de um responsável específico
app.get("/responsaveis/:id/alunos", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const query =
      "SELECT id, nome_completo, data_nascimento, status_aluno FROM alunos WHERE familia_id = $1 ORDER BY nome_completo ASC";
    const { rows } = await pool.query(query, [id]);
    // Retorna um array (pode ser vazio) de alunos
    res.status(200).json(rows);
  } catch (err) {
    console.error("Erro ao buscar alunos do responsável:", err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// --- ROTAS PARA INTERESSADOS ---

// Rota para CRIAR um novo interessado
app.post("/interessados", authenticateToken, async (req, res) => {
  let { nome, telefone, como_conheceu } = req.body;
  let { intencao } = req.body;

  if (!nome || !telefone) {
    return res
      .status(400)
      .json({ error: "Nome completo e telefone são obrigatórios." });
  }

  // Normaliza 'como_conheceu' para as opções usadas no frontend
  const allowedComoConheceu = [
    "Google",
    "Instagram",
    "Facebook",
    "Tik Tok",
    "Indicação",
    "Outro:",
  ];
  if (typeof como_conheceu === "string") {
    const normalized = como_conheceu.trim();
    if (normalized === "") {
      como_conheceu = null;
    } else if (normalized.toLowerCase() === "indicacao") {
      como_conheceu = "Indicação";
    } else if (
      allowedComoConheceu
        .map((v) => v.toLowerCase())
        .includes(normalized.toLowerCase())
    ) {
      const idx = allowedComoConheceu
        .map((v) => v.toLowerCase())
        .indexOf(normalized.toLowerCase());
      como_conheceu = allowedComoConheceu[idx];
    } else {
      // Se vier outro valor não vazio, classifica como "Outro:"
      como_conheceu = "Outro:";
    }
  }

  // Converte a string 'sim'/'nao' para um valor booleano que o PostgreSQL entende.
  const intencaoBooleana =
    typeof intencao === "string"
      ? intencao.toLowerCase() === "sim"
      : !!intencao;

  // O campo 'status' é definido como 'Entrou Em Contato' por padrão na inserção.
  const insertQuery = `
    INSERT INTO interessados (nome, telefone, como_conheceu, intencao, status)
    VALUES ($1, $2, $3, $4, 'Entrou Em Contato')
    RETURNING *;
  `;

  try {
    const novoInteressado = await pool.query(insertQuery, [
      nome,
      telefone,
      como_conheceu,
      intencaoBooleana,
    ]);
    res.status(201).json(novoInteressado.rows[0]);
  } catch (error) {
    console.error("Erro ao inserir interessado:", error);
    res.status(500).json({ error: "Ocorreu um erro no servidor." });
  }
});

// Rota para BUSCAR todos os interessados
app.get("/interessados", authenticateToken, async (req, res) => {
  try {
    const query =
      "SELECT id, nome, telefone, como_conheceu, intencao, data_contato, status FROM interessados ORDER BY data_contato DESC, nome ASC";
    const { rows } = await pool.query(query);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Erro ao buscar interessados:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Rota para ATUALIZAR um interessado (principalmente status e intenção)
app.put("/interessados/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  // Desestrutura o corpo da requisição
  let { nome, telefone, como_conheceu, status, data_contato } = req.body;
  let { intencao } = req.body; // 'intencao' é tratada separadamente

  // Busca o registro atual para permitir updates parciais
  let current;
  try {
    const { rows } = await pool.query(
      "SELECT * FROM interessados WHERE id = $1",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Interessado não encontrado." });
    }
    current = rows[0];
  } catch (error) {
    console.error("Erro ao buscar interessado para update:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }

  // Fallbacks para manter valor atual quando não enviado
  nome = typeof nome === "string" ? nome : current.nome;
  telefone = typeof telefone === "string" ? telefone : current.telefone;
  status = typeof status === "string" ? status : current.status;
  data_contato =
    typeof data_contato === "string" ? data_contato : current.data_contato;

  // Normaliza 'como_conheceu' se enviado; caso contrário mantém atual
  if (typeof como_conheceu === "string") {
    const normalized = como_conheceu.trim();
    if (normalized === "") {
      como_conheceu = null;
    } else if (normalized.toLowerCase() === "indicacao") {
      como_conheceu = "Indicação";
    } else if (
      ["Google", "Instagram", "Facebook", "Tik Tok", "Indicação", "Outro:"]
        .map((v) => v.toLowerCase())
        .includes(normalized.toLowerCase())
    ) {
      const allowed = [
        "Google",
        "Instagram",
        "Facebook",
        "Tik Tok",
        "Indicação",
        "Outro:",
      ];
      const idx = allowed
        .map((v) => v.toLowerCase())
        .indexOf(normalized.toLowerCase());
      como_conheceu = allowed[idx];
    } else {
      como_conheceu = "Outro:";
    }
  } else if (como_conheceu === undefined) {
    como_conheceu = current.como_conheceu;
  }

  // Converte a string 'sim'/'nao' para um valor booleano que o PostgreSQL entende.
  // Se 'intencao' for uma string, compara com 'sim'. Caso contrário, converte para booleano.
  const intencaoBooleana =
    typeof intencao === "string"
      ? intencao.toLowerCase() === "sim"
      : !!intencao;

  try {
    const updateQuery = `
      UPDATE interessados
      SET nome = $1,
          telefone = $2,
          como_conheceu = $3,
          intencao = $4,
          status = $5,
          data_contato = $6
      WHERE id = $7
      RETURNING *;
    `;
    const { rows } = await pool.query(updateQuery, [
      nome,
      telefone,
      como_conheceu,
      intencaoBooleana,
      status,
      data_contato,
      id,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Interessado não encontrado." });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Erro ao atualizar interessado:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Rota para DELETAR um interessado
app.delete("/interessados/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const deleteQuery = await pool.query(
      "DELETE FROM interessados WHERE id = $1 RETURNING *",
      [id]
    );
    if (deleteQuery.rowCount === 0) {
      return res.status(404).json({ error: "Interessado não encontrado." });
    }
    res.status(200).json({ message: "Interessado excluído com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir interessado:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Rota para obter um resumo dos interessados por status (para dashboard)
app.get(
  "/interessados/dashboard-summary",
  authenticateToken,
  async (req, res) => {
    try {
      const statusQuery = `
      SELECT status, COUNT(*) AS count
      FROM interessados
      GROUP BY status
      ORDER BY status;
    `;

      const channelQuery = `
      SELECT como_conheceu, COUNT(*) AS count
      FROM interessados
      WHERE como_conheceu IS NOT NULL
      GROUP BY como_conheceu
      ORDER BY count DESC;
    `;

      const monthlyPerformanceQuery = `
      SELECT
          TO_CHAR(data_contato, 'YYYY-MM') as month,
          COUNT(*) FILTER (WHERE status = 'Ganho') as ganhos,
          COUNT(*) FILTER (WHERE status = 'Perdido') as perdidos
      FROM
          interessados
      WHERE
          data_contato IS NOT NULL
          AND status IN ('Ganho', 'Perdido')
      GROUP BY
          month
      ORDER BY
          month ASC;
    `;

      // Executa as consultas em paralelo para mais eficiência
      const [statusResult, channelResult, monthlyResult] = await Promise.all([
        pool.query(statusQuery),
        pool.query(channelQuery),
        pool.query(monthlyPerformanceQuery),
      ]);

      res.status(200).json({
        statusCounts: statusResult.rows,
        channelCounts: channelResult.rows,
        monthlyPerformance: monthlyResult.rows,
      });
    } catch (error) {
      console.error(
        "Erro ao buscar resumo do dashboard de interessados:",
        error
      );
      res.status(500).json({
        error: "Erro interno do servidor ao buscar dados do dashboard.",
      });
    }
  }
);

// Rota para UPLOAD de interessados via Excel/CSV
app.post(
  "/interessados/upload-excel",
  memoryUpload.single("interessados_excel"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo foi enviado." });
    }

    const client = await pool.connect();

    try {
      // Ler o arquivo do buffer de memória
      const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Converter a planilha para JSON
      const data = xlsx.utils.sheet_to_json(worksheet);

      if (data.length === 0) {
        return res.status(400).json({
          error: "O arquivo Excel está vazio ou em formato inválido.",
        });
      }

      await client.query("BEGIN");

      let insertedCount = 0;
      for (const row of data) {
        // Tenta encontrar os dados nas colunas, sendo flexível com maiúsculas/minúsculas e espaços
        const nome =
          row["Nome"] ||
          row["nome"] ||
          row["Nome Completo"] ||
          row["nome_completo"];
        const telefone = row["Telefone"] || row["telefone"];
        let como_conheceu =
          row["Como Conheceu"] || row["como_conheceu"] || row["como conheceu"];
        const intencao =
          row["Intenção"] ||
          row["intenção"] ||
          row["Intencao"] ||
          row["intencao"];

        // Normaliza o valor de 'intencao' para booleano, aceitando variações comuns
        const intencaoBooleana = intencao
          ? ["sim", "s", "yes", "y", "true", "t", "1"].includes(
              String(intencao).toLowerCase().trim()
            )
          : false;

        // Normaliza o valor de 'como_conheceu' para corresponder aos valores do ENUM
        if (como_conheceu) {
          como_conheceu = String(como_conheceu).trim(); // Remove espaços em branco
          if (como_conheceu.toLowerCase() === "indicacao") {
            como_conheceu = "Indicação"; // Assume que "Indicação" é o valor correto no ENUM
          }
          // Adicione outras normalizações aqui se houver mais variações
          // Ex: if (como_conheceu.toLowerCase() === "redes sociais") { como_conheceu = "Redes Sociais"; }
        }

        // Validação mínima: nome e telefone são obrigatórios para inserir
        if (nome && telefone) {
          const insertQuery = `
            INSERT INTO interessados (nome, telefone, como_conheceu, intencao, status)
            VALUES ($1, $2, $3, $4, 'Entrou Em Contato');
          `;
          await client.query(insertQuery, [
            String(nome),
            String(telefone),
            como_conheceu || null, // Usa o valor normalizado ou null
            intencaoBooleana,
          ]);
          insertedCount++;
        }
      }

      await client.query("COMMIT");

      res.status(201).json({
        message: `${insertedCount} de ${data.length} interessados foram importados com sucesso!`,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Erro ao importar interessados do Excel:", error);
      res
        .status(500)
        .json({ error: "Ocorreu um erro no servidor ao processar o arquivo." });
    } finally {
      client.release();
    }
  }
);

// Rota para ATUALIZAR (EDITAR) um responsável
app.put("/responsaveis/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { nome_completo, nome, email, telefone, outro_telefone, cpf, rg } =
    req.body;

  // Aceita tanto nome quanto nome_completo para compatibilidade
  const nomeField = nome_completo || nome;

  if (!nomeField || !email || !telefone) {
    return res
      .status(400)
      .json({ error: "Nome, email e telefone são obrigatórios." });
  }
  // Converte strings vazias para NULL para campos com restrição de unicidade.
  // Isso evita que o banco de dados retorne um erro se múltiplos responsáveis
  // forem salvos sem CPF ou RG, o que resultaria em múltiplas strings vazias ('').
  const finalCpf = cpf && cpf.trim() ? cpf.trim() : null;
  const finalRg = rg && rg.trim() ? rg.trim() : null;

  try {
    const updateQuery = await pool.query(
      `UPDATE familias SET nome_completo = $1, email = $2, telefone = $3, outro_telefone = $4, cpf = $5, rg = $6 WHERE id = $7 RETURNING *`,
      [nomeField, email, telefone, outro_telefone, finalCpf, finalRg, id]
    );

    if (updateQuery.rowCount === 0) {
      return res.status(404).json({ error: "Responsável não encontrado." });
    }
    res.status(200).json(updateQuery.rows[0]);
  } catch (err) {
    console.error("Erro ao atualizar responsável:", err);
    if (err.code === "23505" && err.constraint === "uk_familias_cpf") {
      return res
        .status(409)
        .json({ error: "O CPF informado já está cadastrado." });
    }
    res.status(500).json({ error: "Erro interno ao atualizar o responsável." });
  }
});
// --- ROTAS DE AUTENTICAÇÃO ---
app.post(
  "/register",
  authenticateToken,
  authorizeRoles("Administrador Geral"),
  async (req, res) => {
    const { nome, email, password, cargo } = req.body;
    if (!nome || !email || !password) {
      return res
        .status(400)
        .json({ error: "Nome, email e senha são obrigatórios." });
    }
    try {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const queryText =
        "INSERT INTO usuarios (nome, email, senha, cargo) VALUES ($1, $2, $3, $4) RETURNING id, nome, email, cargo";
      const queryParams = [nome, email, hashedPassword, cargo || "professor"];
      const newUser = await db.query(queryText, queryParams);
      res.status(201).json(newUser.rows[0]);
    } catch (err) {
      console.error(err.message);
      if (err.code === "23505") {
        return res
          .status(409)
          .json({ error: "Este e-mail já está cadastrado." });
      }
      res.status(500).json({ error: "Erro ao registrar usuário." });
    }
  }
);
// Rota para buscar todos os usuários com o cargo de "professor"
app.get(
  "/usuarios/professores",
  authenticateToken,
  authorizeRoles("Administrador Geral", "Administrador Pedagógico"),
  async (req, res) => {
    try {
      const professores = await db.query(
        "SELECT id, nome FROM usuarios WHERE LOWER(cargo::text) = 'professor' ORDER BY nome ASC"
      );
      res.status(200).json(professores.rows);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: "Erro ao buscar professores." });
    }
  }
);

// Rota para buscar todos os usuários (membros da equipe)
app.get(
  "/usuarios",
  authenticateToken,
  authorizeRoles("Administrador Geral"),
  async (req, res) => {
    try {
      // Ordena por cargo e depois por nome para uma exibição organizada
      const query =
        "SELECT id, nome, email, cargo FROM usuarios ORDER BY cargo, nome";
      const { rows } = await db.query(query);
      res.status(200).json(rows);
    } catch (err) {
      console.error("Erro ao buscar usuários:", err.message);
      res.status(500).json({ error: "Erro ao buscar usuários." });
    }
  }
);

// Rota para BUSCAR os detalhes de um aluno específico para edição
app.get("/alunos/:id/detalhes", async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
            SELECT 
                a.id as aluno_id,
                a.nome_completo as nome_aluno,
                a.data_nascimento,
                a.informacoes_saude,
                a.status_pagamento,
                a.foto_perfil,
                f.id as familia_id,
                f.nome_completo as nome_responsavel,
                f.email,
                f.telefone,
                f.outro_telefone,
                t.id as turma_id,
                t.nome_turma,
                t.periodo,
                t.ano_letivo
            FROM alunos a 
            JOIN familias f ON a.familia_id = f.id 
            LEFT JOIN turma_alunos ta ON a.id = ta.aluno_id
            LEFT JOIN turmas t ON ta.turma_id = t.id
            WHERE a.id = $1;
        `;
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Aluno não encontrado." });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Erro ao buscar detalhes do aluno." });
  }
});

// Rota para ATUALIZAR os dados de um aluno e sua família
app.put("/alunos/:id", async (req, res) => {
  const { id } = req.params;
  const {
    nome_aluno,
    data_nascimento,
    informacoes_saude,
    status_pagamento,
    familia_id, // Precisamos do ID da família para saber qual registro atualizar
    nome_responsavel,
    email,
    telefone,
    outro_telefone,
    turma_id, // NOVO: id da turma para alterar
  } = req.body;

  // Validação básica
  if (
    !nome_aluno ||
    !data_nascimento ||
    !nome_responsavel ||
    !email ||
    !telefone ||
    !familia_id
  ) {
    return res
      .status(400)
      .json({ error: "Todos os campos obrigatórios devem ser preenchidos." });
  }

  try {
    // Usamos uma transação para garantir que todas as tabelas sejam atualizadas com sucesso
    await db.query("BEGIN");

    // Atualiza a tabela 'alunos'
    const alunoUpdateQuery = `
      UPDATE alunos 
      SET nome_completo = $1, data_nascimento = $2, informacoes_saude = $3, status_pagamento = $4
      WHERE id = $5
    `;
    await db.query(alunoUpdateQuery, [
      nome_aluno,
      data_nascimento,
      informacoes_saude,
      status_pagamento,
      id,
    ]);

    // Atualiza a tabela 'familias'
    const familiaUpdateQuery = `
      UPDATE familias
      SET nome_completo = $1, email = $2, telefone = $3, outro_telefone = $4
      WHERE id = $5
    `;
    await db.query(familiaUpdateQuery, [
      nome_responsavel,
      email,
      telefone,
      outro_telefone,
      familia_id,
    ]);

    // Atualiza ou insere a turma do aluno se turma_id for fornecido
    if (turma_id) {
      // Verifica se já existe relação
      const rel = await db.query(
        "SELECT * FROM turma_alunos WHERE aluno_id = $1",
        [id]
      );
      if (rel.rows.length) {
        // Atualiza relação existente
        await db.query(
          "UPDATE turma_alunos SET turma_id = $1 WHERE aluno_id = $2",
          [turma_id, id]
        );
      } else {
        // Cria nova relação
        await db.query(
          "INSERT INTO turma_alunos (aluno_id, turma_id) VALUES ($1, $2)",
          [id, turma_id]
        );
      }
    }

    await db.query("COMMIT"); // Confirma as alterações

    res.status(200).json({ message: "Dados atualizados com sucesso!" });
  } catch (err) {
    await db.query("ROLLBACK"); // Desfaz as alterações em caso de erro
    console.error("Erro ao atualizar dados:", err.message);
    res.status(500).json({ error: "Erro interno ao atualizar os dados." });
  }
});

// Serve arquivos estáticos da pasta 'uploads' para que os downloads funcionem
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- ROTAS PARA GERENCIAMENTO DE TURMAS ---

// Rota para LISTAR todas as turmas com detalhes
app.get("/turmas", authenticateToken, async (req, res) => {
  try {
    const userRole = normalizeCargo(req.user.cargo);
    let query;
    let queryParams = [];

    // Se for professor, mostra apenas suas turmas
    if (userRole === "professor") {
      query = `
        SELECT
            t.id,
            t.nome_turma,
            t.ano_letivo,
            t.periodo,
            t.nivel,
            COALESCE(
                json_agg(
                    DISTINCT jsonb_build_object('id', u.id, 'nome', u.nome)
                ) FILTER (WHERE u.id IS NOT NULL),
                '[]'::json
            ) as professores,
            (SELECT
                COALESCE(json_agg(jsonb_build_object('id', a.id, 'nome_completo', a.nome_completo)), '[]'::json)
                FROM turma_alunos ta
                JOIN alunos a ON ta.aluno_id = a.id
                WHERE ta.turma_id = t.id
            ) as alunos,
            (SELECT COUNT(*) FROM turma_alunos ta WHERE ta.turma_id = t.id)::int as alunos_count
        FROM
            turmas t
        INNER JOIN
            turma_professores tp ON t.id = tp.turma_id
        LEFT JOIN
            usuarios u ON tp.usuario_id = u.id
        WHERE
            tp.usuario_id = $1
        GROUP BY
            t.id
        ORDER BY
            t.nome_turma;
      `;
      queryParams = [req.user.userId];
    } else {
      // Para administradores, mostra todas as turmas
      query = `
        SELECT
            t.id,
            t.nome_turma,
            t.ano_letivo,
            t.periodo,
            t.nivel,
            COALESCE(
                json_agg(
                    DISTINCT jsonb_build_object('id', u.id, 'nome', u.nome)
                ) FILTER (WHERE u.id IS NOT NULL),
                '[]'::json
            ) as professores,
            (SELECT
                COALESCE(json_agg(jsonb_build_object('id', a.id, 'nome_completo', a.nome_completo)), '[]'::json)
                FROM turma_alunos ta
                JOIN alunos a ON ta.aluno_id = a.id
                WHERE ta.turma_id = t.id
            ) as alunos,
            (SELECT COUNT(*) FROM turma_alunos ta WHERE ta.turma_id = t.id)::int as alunos_count
        FROM
            turmas t
        LEFT JOIN
            turma_professores tp ON t.id = tp.turma_id
        LEFT JOIN
            usuarios u ON tp.usuario_id = u.id
        GROUP BY
            t.id
        ORDER BY
            t.nome_turma;
      `;
    }

    const turmas = await db.query(query, queryParams);
    res.status(200).json(turmas.rows);
  } catch (err) {
    console.error("Erro ao buscar turmas:", err.message);
    res.status(500).json({ error: "Erro ao buscar turmas." });
  }
});

// Rota para CRIAR uma nova turma e associar professores
app.post("/turmas", async (req, res) => {
  // O campo `nivel` virá do formulário (0 para Jardim, 1 para Maternal).
  // O campo `professoresIds` é opcional e pode ser um array de IDs de professores.
  const { nome_turma, ano_letivo, periodo, nivel, professoresIds } = req.body;

  if (
    !nome_turma ||
    !ano_letivo ||
    !periodo ||
    nivel == null // 0 é um valor válido para nivel (Jardim)
  ) {
    return res.status(400).json({
      error:
        "Os campos nome_turma, ano_letivo, periodo e nivel são obrigatórios.",
    });
  }
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    // Insere a nova turma na tabela 'turmas', usando o campo 'nivel' para a coluna 'nivel_ensino'
    const newTurmaQuery = await client.query(
      "INSERT INTO turmas (nome_turma, ano_letivo, periodo, nivel) VALUES ($1, $2, $3, $4) RETURNING *",
      // Converte o período para minúsculas para corresponder aos valores do ENUM no banco de dados (ex: 'manhã', 'tarde', 'integral')
      [nome_turma, ano_letivo, periodo.toLowerCase(), nivel]
    );
    const novaTurma = newTurmaQuery.rows[0];

    // Associa os professores à turma, apenas se os IDs forem fornecidos no corpo da requisição
    if (professoresIds && professoresIds.length > 0) {
      const insertProfessoresPromises = professoresIds.map((professorId) => {
        return client.query(
          "INSERT INTO turma_professores (turma_id, usuario_id) VALUES ($1, $2)",
          [novaTurma.id, professorId]
        );
      });
      await Promise.all(insertProfessoresPromises);
    }

    await client.query("COMMIT");

    res.status(201).json(novaTurma);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err.message);
    res.status(500).json({ error: "Erro ao criar turma." });
  } finally {
    client.release();
  }
});

// Rota para DELETAR uma turma
app.delete(
  "/turmas/:id",
  authenticateToken,
  authorizeRoles("Administrador Geral", "Administrador Pedagógico"),
  async (req, res) => {
    const { id } = req.params;
    const client = await db.connect();
    try {
      // A exclusão em cascata (ON DELETE CASCADE) nas tabelas
      // turma_professores e turma_alunos cuidará das associações.
      await client.query("BEGIN");
      const deleteQuery = await client.query(
        "DELETE FROM turmas WHERE id = $1 RETURNING *",
        [id]
      );

      if (deleteQuery.rowCount === 0) {
        return res.status(404).json({ error: "Turma não encontrada." });
      }
      await client.query("COMMIT");
      res.status(200).json({ message: "Turma excluída com sucesso." });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Erro ao excluir turma:", err.message);
      res.status(500).json({ error: "Erro interno ao excluir a turma." });
    } finally {
      client.release();
    }
  }
);

// Rota para LISTAR alunos de uma turma específica
app.get("/turmas/:id/alunos", authenticateToken, async (req, res) => {
  try {
    const { id: turmaId } = req.params;

    console.log(`Buscando alunos para turma ID: ${turmaId}`);

    const query = `
      SELECT 
        a.id,
        a.nome_completo,
        a.data_nascimento,
        a.status_aluno,
        a.status_pagamento,
        f.nome_completo as responsavel_nome,
        f.telefone as responsavel_telefone,
        f.email as responsavel_email
      FROM alunos a
      INNER JOIN turma_alunos ta ON a.id = ta.aluno_id
      LEFT JOIN familias f ON a.id = f.id
      WHERE ta.turma_id = $1
      ORDER BY a.nome_completo ASC
    `;

    const result = await db.query(query, [turmaId]);
    console.log(
      `Encontrados ${result.rows.length} alunos para a turma ${turmaId}`
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Erro ao buscar alunos da turma:", err.message);
    console.error("Stack trace:", err.stack);
    res.status(500).json({ error: "Erro ao buscar alunos da turma." });
  }
}); // Rota para LISTAR alunos ATIVOS
app.get("/alunos/ativos", authenticateToken, async (req, res) => {
  try {
    const allAlunos = await db.query(
      `SELECT
        a.id, a.nome_completo, a.data_nascimento, a.status_pagamento, a.status_aluno, a.foto_perfil,
        ta.turma_id
       FROM alunos a
       LEFT JOIN turma_alunos ta ON a.id = ta.aluno_id
       WHERE a.status_aluno = TRUE
       ORDER BY nome_completo ASC`
    );
    res.status(200).json(allAlunos.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Erro ao buscar alunos ativos." });
  }
});
// Rota para LISTAR alunos INATIVOS (com dados da família)
app.get("/alunos/inativos", authenticateToken, async (req, res) => {
  try {
    // A query agora seleciona o status_pagamento, que estava faltando.
    const allAlunos = await db.query(`
       SELECT
        a.id, a.nome_completo, a.data_nascimento, a.status_pagamento, a.status_aluno, a.foto_perfil,
        ta.turma_id
       FROM alunos a
       LEFT JOIN turma_alunos ta ON a.id = ta.aluno_id
       WHERE status_aluno = FALSE 
       ORDER BY nome_completo ASC`);
    res.status(200).json(allAlunos.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Erro ao buscar alunos inativos." });
  }
});
// Rota para ATIVAR um aluno
app.patch("/alunos/:id/ativar", async (req, res) => {
  const { id } = req.params;
  try {
    const updatedAluno = await db.query(
      "UPDATE alunos SET status_aluno = TRUE WHERE id = $1 RETURNING *",
      [id]
    );

    if (updatedAluno.rowCount === 0) {
      return res.status(404).json({ error: "Aluno não encontrado." });
    }

    res.status(200).json({
      message: "Aluno ativado com sucesso!",
      aluno: updatedAluno.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Erro ao ativar aluno." });
  }
});

// Rota para ATIVAR e MATRICULAR um aluno em uma turma
app.post("/alunos/:alunoId/matricular", async (req, res) => {
  const { alunoId } = req.params;
  const { turmaId } = req.body;

  if (!turmaId) {
    return res.status(400).json({ error: "O ID da turma é obrigatório." });
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    // 1. Ativa o aluno
    const updateAlunoQuery = await client.query(
      "UPDATE alunos SET status_aluno = TRUE WHERE id = $1 RETURNING *",
      [alunoId]
    );

    if (updateAlunoQuery.rowCount === 0) {
      throw new Error("Aluno não encontrado.");
    }

    // 2. Matricula o aluno na turma
    await client.query(
      "INSERT INTO turma_alunos (aluno_id, turma_id) VALUES ($1, $2)",
      [alunoId, turmaId]
    );

    await client.query("COMMIT");

    res
      .status(200)
      .json({ message: "Aluno ativado e matriculado com sucesso!" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Erro ao matricular aluno:", err.message);
    res.status(500).json({ error: "Erro interno ao processar a matrícula." });
  } finally {
    client.release();
  }
});

// Rota para DELETAR um aluno
app.delete("/alunos/:id", async (req, res) => {
  const { id } = req.params;
  const client = await db.connect(); // Usar um cliente para a transação

  try {
    await client.query("BEGIN");

    // 1. Antes de deletar, busca o familia_id do aluno
    const alunoResult = await client.query(
      "SELECT familia_id FROM alunos WHERE id = $1",
      [id]
    );

    if (alunoResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Aluno não encontrado." });
    }
    const { familia_id } = alunoResult.rows[0];

    // 2. Deleta o aluno.
    await client.query("DELETE FROM alunos WHERE id = $1", [id]);

    // 3. Verifica se existem outros alunos associados à mesma família
    const outrosAlunosResult = await client.query(
      "SELECT COUNT(*) FROM alunos WHERE familia_id = $1",
      [familia_id]
    );
    const count = parseInt(outrosAlunosResult.rows[0].count, 10);

    // 4. Se não houver mais nenhum aluno, deleta a família
    if (count === 0) {
      await client.query("DELETE FROM familias WHERE id = $1", [familia_id]);
    }

    await client.query("COMMIT");
    res.status(200).json({
      message: "Aluno e responsável (se aplicável) excluídos com sucesso.",
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Erro ao excluir aluno e família:", err.message);
    res.status(500).json({ error: "Erro interno ao excluir o aluno." });
  } finally {
    client.release();
  }
});

// Rota para DELETAR um usuário
app.delete(
  "/usuarios/:id",
  authenticateToken,
  authorizeRoles("Administrador Geral"),
  async (req, res) => {
    const { id } = req.params;
    try {
      const deleteQuery = await db.query(
        "DELETE FROM usuarios WHERE id = $1 RETURNING *",
        [id]
      );
      if (deleteQuery.rowCount === 0) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }
      res.status(200).json({ message: "Usuário removido com sucesso." });
    } catch (err) {
      console.error("Erro ao remover usuário:", err.message);
      res.status(500).json({ error: "Erro interno ao remover o usuário." });
    }
  }
);

// --- Rotas de Suporte (para preencher os selects no frontend) ---
app.get("/alunos/ativos", async (req, res) => {
  const result = await pool.query(
    "SELECT id, nome_completo FROM alunos WHERE status_aluno = TRUE ORDER BY nome_completo"
  );
  res.json(result.rows);
});

app.get("/turmas", async (req, res) => {
  const result = await pool.query(
    "SELECT id, nome_turma FROM turmas ORDER BY nome_turma"
  );
  res.json(result.rows);
});
// --- ROTA DE CADASTRO COMPLETO (ALUNO + FAMÍLIA) ---
app.post("/cadastrar-aluno-completo", async (req, res) => {
  const {
    nome_completo_aluno,
    data_nascimento,
    informacoes_saude,
    status_pagamento,
    nome_completo_responsavel,
    telefone,
    email,
    outro_telefone,
  } = req.body;

  // Validação dos campos obrigatórios
  if (
    !nome_completo_aluno ||
    !data_nascimento ||
    !nome_completo_responsavel ||
    !telefone ||
    !email
  ) {
    return res.status(400).json({
      error: "Dados essenciais do aluno ou do responsável estão faltando.",
    });
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    // Passo 1: Cadastra a família (ou encontra, se já existir)
    let familiaId;
    const familiaExistente = await client.query(
      "SELECT id FROM familias WHERE email = $1",
      [email]
    );

    if (familiaExistente.rows.length > 0) {
      familiaId = familiaExistente.rows[0].id;
    } else {
      const novaFamilia = await client.query(
        "INSERT INTO familias (nome_completo, email, telefone, outro_telefone) VALUES ($1, $2, $3, $4) RETURNING id",
        [nome_completo_responsavel, email, telefone, outro_telefone]
      );
      familiaId = novaFamilia.rows[0].id;
    }

    // Passo 2: Cadastra o aluno, associando à família.
    const novoAluno = await client.query(
      `INSERT INTO alunos (nome_completo, data_nascimento, informacoes_saude, status_pagamento, familia_id, status_aluno) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        nome_completo_aluno,
        data_nascimento,
        informacoes_saude,
        status_pagamento,
        familiaId,
        false,
      ]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Aluno e responsável cadastrados com sucesso!",
      aluno: novoAluno.rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Erro no cadastro completo:", err.message);
    if (err.code === "23505") {
      return res
        .status(409)
        .json({ error: "O e-mail do responsável já está cadastrado." });
    }
    res.status(500).json({ error: "Erro interno ao processar o cadastro." });
  } finally {
    client.release();
  }
});

// --- ROTAS PARA GERENCIAMENTO DE PRESENÇA ---

// Rota para buscar os detalhes de uma turma e seus alunos para a página de presença
app.get("/turmas/:turmaId/detalhes-presenca", async (req, res) => {
  const { turmaId } = req.params;
  try {
    const query = `
      SELECT
          t.id as turma_id,
          t.nome_turma,
          COALESCE(json_agg(
              json_build_object('id', a.id, 'nome_completo', a.nome_completo)
              ORDER BY a.nome_completo
          ) FILTER (WHERE a.id IS NOT NULL), '[]'::json) as alunos
      FROM turmas t
      LEFT JOIN turma_alunos ta ON t.id = ta.turma_id
      LEFT JOIN alunos a ON ta.aluno_id = a.id
      WHERE t.id = $1
      GROUP BY t.id, t.nome_turma;
    `;
    const result = await db.query(query, [turmaId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Turma não encontrada." });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(
      "Erro ao buscar detalhes da turma para presença:",
      err.message
    );
    res
      .status(500)
      .json({ error: "Erro interno ao buscar detalhes da turma." });
  }
});

// Rota para buscar as presenças de uma turma em uma data específica
app.get("/turmas/:turmaId/presencas", async (req, res) => {
  const { turmaId } = req.params;
  const { data } = req.query; // data no formato 'YYYY-MM-DD'

  if (!data) {
    return res.status(400).json({ error: "A data é obrigatória." });
  }

  try {
    const query = `
      SELECT aluno_id, status_presenca, observacao
      FROM presencas
      WHERE turma_id = $1 AND data_aula = $2;
    `;
    const result = await db.query(query, [turmaId, data]);

    if (result.rows.length === 0) {
      // Retorna 404 se não houver registros. O frontend está preparado para isso.
      return res
        .status(404)
        .json({ message: "Nenhum registro de presença para esta data." });
    }
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Erro ao buscar presenças:", err.message);
    res.status(500).json({ error: "Erro interno ao buscar presenças." });
  }
});

// Rota para buscar o HISTÓRICO COMPLETO de presenças de uma turma
app.get("/turmas/:turmaId/historico-presenca", async (req, res) => {
  const { turmaId } = req.params;
  try {
    const query = `
      SELECT
        p.data_aula,
        COUNT(*) FILTER (WHERE p.status_presenca = 'P') as presentes,
        COUNT(*) FILTER (WHERE p.status_presenca = 'F') as faltas,
        COUNT(*) FILTER (WHERE p.status_presenca = 'FJ') as faltas_justificadas,
        json_agg(
            json_build_object(
                'aluno_id', a.id,
                'nome_completo', a.nome_completo,
                'status', p.status_presenca,
                'observacao', p.observacao
            ) ORDER BY a.nome_completo
        ) as registros
      FROM presencas p
      JOIN alunos a ON p.aluno_id = a.id
      WHERE p.turma_id = $1
      GROUP BY p.data_aula
      ORDER BY p.data_aula DESC;
    `;
    const result = await db.query(query, [turmaId]);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(
      "Erro ao buscar histórico de presenças da turma:",
      err.message
    );
    res
      .status(500)
      .json({ error: "Erro interno ao buscar o histórico de presenças." });
  }
});

// Rota para salvar (UPSERT) as presenças de uma turma
app.post("/turmas/:turmaId/presencas", async (req, res) => {
  const { turmaId } = req.params;
  const { data_aula, presencas } = req.body; // presencas é um array de { aluno_id, status_presenca, observacao }

  if (!data_aula || !presencas || !Array.isArray(presencas)) {
    return res.status(400).json({ error: "Formato de dados inválido." });
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const upsertPromises = presencas.map((p) => {
      const query = `
        INSERT INTO presencas (aluno_id, turma_id, data_aula, status_presenca, observacao)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (aluno_id, turma_id, data_aula) 
        DO UPDATE SET
          status_presenca = EXCLUDED.status_presenca,
          observacao = EXCLUDED.observacao;
      `;
      return client.query(query, [
        p.aluno_id,
        turmaId,
        data_aula,
        p.status_presenca,
        p.observacao,
      ]);
    });

    await Promise.all(upsertPromises);

    await client.query("COMMIT");
    res.status(200).json({ message: "Presença salva com sucesso!" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Erro ao salvar presença:", err.message);
    res.status(500).json({ error: "Erro interno ao salvar presença." });
  } finally {
    client.release();
  }
});

// Rota para BUSCAR OU CRIAR um planejamento baseado na seleção do frontend
// Esta é a principal rota para a sua página de planejamentos
app.post(
  "/planejamentos/find-or-create",
  authenticateToken,
  async (req, res) => {
    // Dados que vêm do seu frontend
    const { turma_id, ano, mes, semana, usuario_id } = req.body;

    if (!turma_id || !ano || !mes || !semana || !usuario_id) {
      return res
        .status(400)
        .json({ error: "Turma, ano, mês, semana e usuário são obrigatórios." });
    }

    try {
      const userRole = normalizeCargo(req.user.cargo);

      // Se for professor, verifica se a turma pertence a ele
      if (userRole === "professor") {
        const turmaPermissionCheck = await db.query(
          `SELECT tp.turma_id FROM turma_professores tp 
           WHERE tp.turma_id = $1 AND tp.usuario_id = $2`,
          [turma_id, req.user.userId]
        );

        if (turmaPermissionCheck.rows.length === 0) {
          return res.status(403).json({
            error:
              "Você não tem permissão para acessar planejamentos desta turma.",
          });
        }
      }
      // 1. Tenta encontrar um planejamento existente
      let findResult = await db.query(
        `SELECT * FROM planejamentos
       WHERE turma_id = $1 AND ano = $2 AND mes = $3 AND semana = $4`,
        [turma_id, ano, mes, semana]
      );

      let planejamento;

      if (findResult.rows.length > 0) {
        // 2a. Se encontrou, usa o planejamento existente
        planejamento = findResult.rows[0];
      } else {
        // 2b. Se não encontrou, cria um novo com status 'Pendente'
        const insertResult = await db.query(
          `INSERT INTO planejamentos (turma_id, ano, mes, semana, status, usuario_id)
         VALUES ($1, $2, $3, $4, 'Pendente', $5) RETURNING *`,
          [turma_id, ano, mes, semana, usuario_id]
        );
        planejamento = insertResult.rows[0];
      }

      // 3. Busca o planejamento completo (com anexos e comentários) para retornar
      // Este código assume que você tem tabelas 'usuarios' e 'turmas' com as colunas corretas
      const fullPlanejamentoResult = await db.query(
        `SELECT
          p.id_planejamento, p.turma_id, p.ano, p.mes, p.semana, p.status,
          t.nome_turma AS nome_turma, -- Supondo que a coluna em 'turmas' se chama 'nome'
          u.nome AS nome_usuario, -- Supondo que a coluna em 'usuarios' se chama 'nome'
          COALESCE(
              (SELECT json_agg(anexos.*) FROM planejamento_anexos AS anexos WHERE anexos.planejamento_id = p.id_planejamento),
              '[]'::json
          ) AS anexos,
          COALESCE(
              (SELECT json_agg(
                  json_build_object(
                      'id', c.id_comentario,
                      'planejamento_id', c.planejamento_id,
                      'usuario_id', c.usuario_id,
                      'texto_comentario', c.texto_comentario,
                      'data_comentario', c.data_comentario,
                      'nome_usuario', u_com.nome
                  ) ORDER BY c.data_comentario ASC
              )
              FROM planejamento_comentarios AS c
              JOIN usuarios u_com ON c.usuario_id = u_com.id
              WHERE c.planejamento_id = p.id_planejamento),
              '[]'::json
          ) AS comentarios
       FROM planejamentos p
       LEFT JOIN turmas t ON p.turma_id = t.id -- AJUSTE AQUI se a PK de turmas for outra
       LEFT JOIN usuarios u ON p.usuario_id = u.id -- AJUSTE AQUI se a PK de usuarios for outra
       WHERE p.id_planejamento = $1`,
        [planejamento.id_planejamento]
      );

      res.status(200).json(fullPlanejamentoResult.rows[0]);
    } catch (err) {
      console.error("Erro em find-or-create planejamento:", err.message);
      res
        .status(500)
        .json({ error: "Erro interno ao processar planejamento." });
    }
  }
);
// Rota para DELETAR um responsável (família)
app.delete("/responsaveis/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Primeiro, verifica se a família tem alunos associados.
    // Isso previne a exclusão de um responsável se houver alunos ligados a ele.
    const checkAlunos = await pool.query(
      "SELECT COUNT(*) FROM alunos WHERE familia_id = $1",
      [id]
    );

    if (parseInt(checkAlunos.rows[0].count, 10) > 0) {
      return res.status(400).json({
        error:
          "Não é possível excluir este responsável, pois existem alunos associados a ele.",
      });
    }

    // Se não houver alunos, procede com a exclusão.
    const deleteQuery = await pool.query(
      "DELETE FROM familias WHERE id = $1 RETURNING *",
      [id]
    );

    if (deleteQuery.rowCount === 0) {
      return res.status(404).json({ error: "Responsável não encontrado." });
    }

    res.status(200).json({ message: "Responsável excluído com sucesso." });
  } catch (err) {
    console.error("Erro ao excluir responsável:", err);
    res.status(500).json({ error: "Erro interno ao excluir o responsável." });
  }
});

// Rota para BUSCAR os status de todos os planejamentos de uma turma/ano
app.get("/planejamentos/status", authenticateToken, async (req, res) => {
  const { turma_id, ano } = req.query;

  if (!turma_id || !ano) {
    return res
      .status(400)
      .json({ error: "ID da turma e ano são obrigatórios." });
  }

  try {
    const userRole = normalizeCargo(req.user.cargo);

    // Se for professor, verifica se a turma pertence a ele
    if (userRole === "professor") {
      const turmaPermissionCheck = await db.query(
        `SELECT tp.turma_id FROM turma_professores tp 
         WHERE tp.turma_id = $1 AND tp.usuario_id = $2`,
        [turma_id, req.user.userId]
      );

      if (turmaPermissionCheck.rows.length === 0) {
        return res.status(403).json({
          error: "Você não tem permissão para acessar status desta turma.",
        });
      }
    }

    const query = `
      SELECT mes, semana, status
      FROM planejamentos
      WHERE turma_id = $1 AND ano = $2;
    `;
    const result = await db.query(query, [turma_id, ano]);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Erro ao buscar status dos planejamentos:", err.message);
    res.status(500).json({ error: "Erro interno ao buscar status." });
  }
});

// --- ROTAS PARA COMENTÁRIOS DE PLANEJAMENTO ---

// Rota para ATUALIZAR o STATUS de um planejamento (Aprovar/Reprovar)
app.put(
  "/planejamentos/:id/status",
  authenticateToken,
  authorizeRoles("Administrador Pedagógico", "Administrador Geral"),
  async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'Aprovado' ou 'Reprovado'

    if (!status || !["Aprovado", "Reprovado"].includes(status)) {
      return res.status(400).json({ error: "Status inválido." });
    }

    try {
      const result = await db.query(
        "UPDATE planejamentos SET status = $1, data_modificacao = NOW() WHERE id_planejamento = $2 RETURNING *",
        [status, id]
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Planejamento não encontrado." });
      }
      res.status(200).json(result.rows[0]);
    } catch (err) {
      console.error("Erro ao atualizar status do planejamento:", err.message);
      res.status(500).json({ error: "Erro interno ao atualizar o status." });
    }
  }
);

// Rota para ADICIONAR um comentário
app.post(
  "/planejamentos/:id/comentarios",
  authenticateToken,
  async (req, res) => {
    const { id: planejamento_id } = req.params;
    const { usuario_id, texto_comentario } = req.body;

    if (!usuario_id || !texto_comentario) {
      return res
        .status(400)
        .json({ error: "Usuário e comentário são obrigatórios." });
    }

    try {
      const userRole = normalizeCargo(req.user.cargo);

      // Se for professor, verifica se o planejamento pertence a uma turma sua
      if (userRole === "professor") {
        const planejamentoCheck = await db.query(
          `SELECT p.turma_id FROM planejamentos p
           JOIN turma_professores tp ON p.turma_id = tp.turma_id
           WHERE p.id_planejamento = $1 AND tp.usuario_id = $2`,
          [planejamento_id, req.user.userId]
        );

        if (planejamentoCheck.rows.length === 0) {
          return res.status(403).json({
            error: "Você não tem permissão para comentar neste planejamento.",
          });
        }
      }

      const result = await db.query(
        `INSERT INTO planejamento_comentarios (planejamento_id, usuario_id, texto_comentario)
       VALUES ($1, $2, $3) RETURNING *`,
        [planejamento_id, usuario_id, texto_comentario]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error("Erro ao adicionar comentário:", err.message);
      res.status(500).json({ error: "Erro interno ao adicionar comentário." });
    }
  }
);

// ROTA PARA DELETAR UM COMENTÁRIO ESPECÍFICO
app.delete("/comentarios/:id", authenticateToken, async (req, res) => {
  // Pega o ID do comentário que vem da URL (ex: /comentarios/15)
  const { id } = req.params;

  try {
    const userRole = normalizeCargo(req.user.cargo);

    // Se for professor, verifica se o comentário pertence a um planejamento de uma turma sua
    if (userRole === "professor") {
      const comentarioCheck = await db.query(
        `SELECT pc.planejamento_id FROM planejamento_comentarios pc
         JOIN planejamentos p ON pc.planejamento_id = p.id_planejamento
         JOIN turma_professores tp ON p.turma_id = tp.turma_id
         WHERE pc.id_comentario = $1 AND tp.usuario_id = $2`,
        [id, req.user.userId]
      );

      if (comentarioCheck.rows.length === 0) {
        return res.status(403).json({
          error: "Você não tem permissão para deletar este comentário.",
        });
      }
    }

    // Executa o comando DELETE no banco de dados
    // 'RETURNING *' faz com que o comando retorne o comentário que foi deletado
    const result = await db.query(
      "DELETE FROM planejamento_comentarios WHERE id_comentario = $1 RETURNING *",
      [id]
    );

    // Verifica se alguma linha foi realmente deletada
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Comentário não encontrado." });
    }

    // Se deu certo, envia uma resposta de sucesso
    res.status(200).json({
      message: "Comentário excluído com sucesso.",
      deletedComment: result.rows[0], // Envia o comentário deletado de volta
    });
  } catch (err) {
    console.error("Erro ao deletar comentário:", err.message);
    res.status(500).json({ error: "Erro interno ao deletar o comentário." });
  }
});

// --- ROTAS PARA ANEXOS DE PLANEJAMENTO ---

// ROTA PARA FAZER UPLOAD DE UM NOVO ANEXO
// `upload.single('anexo')` é o middleware do multer que processa o arquivo
app.post(
  "/planejamentos/:id/anexos",
  authenticateToken,
  upload.single("anexo"),
  async (req, res) => {
    const { id: planejamento_id } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado." });
    }

    const { originalname: nome_arquivo, path: path_arquivo } = req.file;

    try {
      const userRole = normalizeCargo(req.user.cargo);

      // Se for professor, verifica se o planejamento pertence a uma turma sua
      if (userRole === "professor") {
        const planejamentoCheck = await db.query(
          `SELECT p.turma_id FROM planejamentos p
           JOIN turma_professores tp ON p.turma_id = tp.turma_id
           WHERE p.id_planejamento = $1 AND tp.usuario_id = $2`,
          [planejamento_id, req.user.userId]
        );

        if (planejamentoCheck.rows.length === 0) {
          return res.status(403).json({
            error:
              "Você não tem permissão para adicionar anexos a este planejamento.",
          });
        }
      }

      const query = `
      INSERT INTO planejamento_anexos (planejamento_id, nome_arquivo, path_arquivo)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
      const result = await db.query(query, [
        planejamento_id,
        nome_arquivo,
        path_arquivo,
      ]);
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error("Erro ao salvar anexo:", err.message);
      res.status(500).json({ error: "Erro interno ao salvar anexo." });
    }
  }
);

// ROTA PARA DELETAR UM ANEXO (SUA FUNÇÃO DE "EDITAR")
app.delete("/anexos/:id", authenticateToken, async (req, res) => {
  const { id: anexo_id } = req.params;

  try {
    const userRole = normalizeCargo(req.user.cargo);

    // Se for professor, verifica se o anexo pertence a um planejamento de uma turma sua
    if (userRole === "professor") {
      const anexoCheck = await db.query(
        `SELECT pa.planejamento_id FROM planejamento_anexos pa
         JOIN planejamentos p ON pa.planejamento_id = p.id_planejamento
         JOIN turma_professores tp ON p.turma_id = tp.turma_id
         WHERE pa.id_anexo = $1 AND tp.usuario_id = $2`,
        [anexo_id, req.user.userId]
      );

      if (anexoCheck.rows.length === 0) {
        return res.status(403).json({
          error: "Você não tem permissão para deletar este anexo.",
        });
      }
    }

    // 1. Primeiro, busca o registro no banco para saber o caminho do arquivo
    const findResult = await db.query(
      "SELECT path_arquivo FROM planejamento_anexos WHERE id_anexo = $1",
      [anexo_id]
    );

    if (findResult.rowCount === 0) {
      return res.status(404).json({ error: "Anexo não encontrado." });
    }

    const pathDoArquivo = findResult.rows[0].path_arquivo;

    // 2. Deleta o registro do banco de dados
    await db.query("DELETE FROM planejamento_anexos WHERE id_anexo = $1", [
      anexo_id,
    ]);

    // 3. Deleta o arquivo físico do servidor
    fs.unlink(pathDoArquivo, (err) => {
      if (err) {
        console.error("Erro ao deletar arquivo físico:", err);
        // Não envia erro ao cliente, pois o registro do DB já foi removido
      }
    });

    res.status(200).json({ message: "Anexo excluído com sucesso." });
  } catch (err) {
    console.error("Erro ao deletar anexo:", err.message);
    res.status(500).json({ error: "Erro interno ao deletar anexo." });
  }
});

// Excluir planejamento (somente Administrador Geral)
app.delete(
  "/planejamentos/:id",
  authenticateToken,
  authorizeRoles("Administrador Geral"),
  async (req, res) => {
    console.log(
      "Rota DELETE /planejamentos/:id chamada com ID:",
      req.params.id
    );
    console.log("Usuário autenticado:", req.user);

    const { id } = req.params;
    const client = await db.connect();

    try {
      await client.query("BEGIN");

      // Buscar anexos para remover arquivos físicos
      const anexosResult = await client.query(
        "SELECT id_anexo, path_arquivo FROM planejamento_anexos WHERE planejamento_id = $1",
        [id]
      );

      // Deleta comentários do planejamento
      await client.query(
        "DELETE FROM planejamento_comentarios WHERE planejamento_id = $1",
        [id]
      );

      // Deleta anexos do planejamento
      await client.query(
        "DELETE FROM planejamento_anexos WHERE planejamento_id = $1",
        [id]
      );

      // Remove arquivos físicos dos anexos
      for (const row of anexosResult.rows) {
        const filePath = row.path_arquivo;
        if (filePath) {
          try {
            fs.unlinkSync(filePath);
          } catch (err) {
            console.error(
              "Erro ao remover arquivo de anexo:",
              filePath,
              err.message
            );
          }
        }
      }

      // Deleta o planejamento em si
      const delPlan = await client.query(
        "DELETE FROM planejamentos WHERE id_planejamento = $1 RETURNING turma_id, ano, mes, semana",
        [id]
      );

      if (delPlan.rowCount === 0) {
        await client.query("ROLLBACK");
        console.log("Planejamento não encontrado com ID:", id);
        return res.status(404).json({ error: "Planejamento não encontrado." });
      }

      await client.query("COMMIT");
      console.log("Planejamento excluído com sucesso:", delPlan.rows[0]);

      // Retorna dados úteis para o frontend resetar o status local
      return res.status(200).json({
        message: "Planejamento excluído com sucesso.",
        reset: {
          turma_id: delPlan.rows[0].turma_id,
          ano: delPlan.rows[0].ano,
          mes: delPlan.rows[0].mes,
          semana: delPlan.rows[0].semana,
          status: "Pendente",
        },
      });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Erro ao excluir planejamento:", err);
      return res
        .status(500)
        .json({ error: "Erro interno ao excluir planejamento." });
    } finally {
      client.release();
    }
  }
);

// --- FUNÇÕES UTILITÁRIAS PARA FOTOS DE PERFIL ---

// Função para remover arquivo de foto de forma segura
const removePhotoFile = (photoPath) => {
  if (!photoPath) return;

  try {
    const fs = require("fs");
    const path = require("path");
    const filePath = path.join(__dirname, photoPath);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Foto removida: ${photoPath}`);
      return true;
    } else {
      console.log(`Arquivo não encontrado: ${photoPath}`);
      return false;
    }
  } catch (error) {
    console.error(`Erro ao remover foto ${photoPath}:`, error.message);
    return false;
  }
};

// Função para limpar fotos órfãs (fotos que não estão mais referenciadas no banco)
const cleanupOrphanedPhotos = async () => {
  try {
    const fs = require("fs");
    const path = require("path");

    let totalRemovedCount = 0;

    // Limpeza de fotos de usuários
    const userUploadsDir = path.join(__dirname, "uploads", "image");
    if (fs.existsSync(userUploadsDir)) {
      const dbUserPhotos = await db.query(
        "SELECT foto_perfil FROM usuarios WHERE foto_perfil IS NOT NULL"
      );
      const referencedUserPhotos = new Set(
        dbUserPhotos.rows.map((row) => row.foto_perfil)
      );

      const userFiles = fs.readdirSync(userUploadsDir);
      for (const file of userFiles) {
        const filePath = `/uploads/image/${file}`;
        if (!referencedUserPhotos.has(filePath)) {
          const fullPath = path.join(userUploadsDir, file);
          try {
            fs.unlinkSync(fullPath);
            console.log(`Foto órfã de usuário removida: ${file}`);
            totalRemovedCount++;
          } catch (error) {
            console.error(
              `Erro ao remover foto órfã de usuário ${file}:`,
              error.message
            );
          }
        }
      }
    }

    // Limpeza de fotos de alunos
    const alunoUploadsDir = path.join(__dirname, "uploads", "aluno_image");
    if (fs.existsSync(alunoUploadsDir)) {
      const dbAlunoPhotos = await db.query(
        "SELECT foto_perfil FROM alunos WHERE foto_perfil IS NOT NULL"
      );
      const referencedAlunoPhotos = new Set(
        dbAlunoPhotos.rows.map((row) => row.foto_perfil)
      );

      const alunoFiles = fs.readdirSync(alunoUploadsDir);
      for (const file of alunoFiles) {
        const filePath = `/uploads/aluno_image/${file}`;
        if (!referencedAlunoPhotos.has(filePath)) {
          const fullPath = path.join(alunoUploadsDir, file);
          try {
            fs.unlinkSync(fullPath);
            console.log(`Foto órfã de aluno removida: ${file}`);
            totalRemovedCount++;
          } catch (error) {
            console.error(
              `Erro ao remover foto órfã de aluno ${file}:`,
              error.message
            );
          }
        }
      }
    }

    console.log(
      `Limpeza concluída: ${totalRemovedCount} fotos órfãs removidas`
    );
    return totalRemovedCount;
  } catch (error) {
    console.error("Erro na limpeza de fotos órfãs:", error.message);
    return 0;
  }
};

// --- ROTAS PARA UPLOAD DE FOTO DE PERFIL ---

// Rota para verificar e criar a coluna foto_perfil se não existir
app.post("/setup-profile-photo-column", async (req, res) => {
  try {
    // Verifica se a coluna foto_perfil existe
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'usuarios' AND column_name = 'foto_perfil'
    `;

    const result = await db.query(checkColumnQuery);

    if (result.rows.length === 0) {
      // Coluna não existe, vamos criá-la
      const addColumnQuery = `
        ALTER TABLE usuarios 
        ADD COLUMN foto_perfil VARCHAR(255)
      `;

      await db.query(addColumnQuery);
      res.json({ message: "Coluna foto_perfil criada com sucesso!" });
    } else {
      res.json({ message: "Coluna foto_perfil já existe!" });
    }
  } catch (err) {
    console.error("Erro ao verificar/criar coluna foto_perfil:", err.message);
    res.status(500).json({ error: "Erro interno ao configurar coluna." });
  }
});

// Rota para verificar e criar a coluna foto_perfil na tabela alunos
app.post("/setup-aluno-photo-column", async (req, res) => {
  try {
    // Verifica se a coluna foto_perfil existe na tabela alunos
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'alunos' AND column_name = 'foto_perfil'
    `;

    const result = await db.query(checkColumnQuery);

    if (result.rows.length === 0) {
      // Coluna não existe, vamos criá-la
      const addColumnQuery = `
        ALTER TABLE alunos 
        ADD COLUMN foto_perfil VARCHAR(255)
      `;

      await db.query(addColumnQuery);
      res.json({
        message: "Coluna foto_perfil criada na tabela alunos com sucesso!",
      });
    } else {
      res.json({ message: "Coluna foto_perfil já existe na tabela alunos!" });
    }
  } catch (err) {
    console.error(
      "Erro ao verificar/criar coluna foto_perfil na tabela alunos:",
      err.message
    );
    res.status(500).json({ error: "Erro interno ao configurar coluna." });
  }
});

// Rota para fazer upload da foto de perfil
app.post(
  "/upload-profile-photo",
  authenticateToken,
  imageUpload.single("profilePhoto"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nenhuma imagem enviada." });
      }

      const userId = req.user.userId;
      const { filename, path } = req.file;

      // Caminho relativo para acessar a imagem via URL
      const imageUrl = `/uploads/image/${filename}`;

      // 1. Primeiro, busca a foto atual do usuário para removê-la
      const currentPhotoQuery = await db.query(
        "SELECT foto_perfil FROM usuarios WHERE id = $1",
        [userId]
      );

      if (currentPhotoQuery.rowCount === 0) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      const currentPhoto = currentPhotoQuery.rows[0].foto_perfil;

      // 2. Atualiza a foto do usuário no banco de dados
      const updateQuery = `
        UPDATE usuarios 
        SET foto_perfil = $1 
        WHERE id = $2 
        RETURNING id, nome, email, cargo, foto_perfil
      `;

      const result = await db.query(updateQuery, [imageUrl, userId]);

      // 3. Remove a foto antiga do sistema de arquivos (se existir)
      if (currentPhoto) {
        removePhotoFile(currentPhoto);
      }

      res.json({
        message: "Foto de perfil atualizada com sucesso!",
        user: result.rows[0],
        imageUrl: imageUrl,
      });
    } catch (err) {
      console.error("Erro ao fazer upload da foto de perfil:", err.message);
      res.status(500).json({ error: "Erro interno ao fazer upload da foto." });
    }
  }
);

// Rota para remover a foto de perfil
app.delete("/remove-profile-photo", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Busca a foto atual do usuário
    const findResult = await db.query(
      "SELECT foto_perfil FROM usuarios WHERE id = $1",
      [userId]
    );

    if (findResult.rowCount === 0) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    const currentPhoto = findResult.rows[0].foto_perfil;

    // Remove a foto do banco de dados
    const updateQuery = `
      UPDATE usuarios 
      SET foto_perfil = NULL 
      WHERE id = $1 
      RETURNING id, nome, email, cargo, foto_perfil
    `;

    const result = await db.query(updateQuery, [userId]);

    // Se havia uma foto, remove o arquivo físico
    if (currentPhoto) {
      removePhotoFile(currentPhoto);
    }

    res.json({
      message: "Foto de perfil removida com sucesso!",
      user: result.rows[0],
    });
  } catch (err) {
    console.error("Erro ao remover foto de perfil:", err.message);
    res.status(500).json({ error: "Erro interno ao remover a foto." });
  }
});

// Rota para limpeza de fotos órfãs (apenas para administradores)
app.post(
  "/cleanup-orphaned-photos",
  authenticateToken,
  authorizeRoles("Administrador Geral"),
  async (req, res) => {
    try {
      const removedCount = await cleanupOrphanedPhotos();

      res.json({
        message: `Limpeza concluída! ${removedCount} fotos órfãs foram removidas.`,
        removedCount: removedCount,
      });
    } catch (err) {
      console.error("Erro na limpeza de fotos órfãs:", err.message);
      res.status(500).json({ error: "Erro interno na limpeza de fotos." });
    }
  }
);

// --- ROTAS PARA UPLOAD DE FOTO DE ALUNOS ---

// Multer específico para upload de fotos de alunos
const alunoImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/aluno_image/"); // Pasta específica para fotos de alunos
  },
  filename: function (req, file, cb) {
    // Gera um nome único para a foto: alunoId_timestamp.extensao
    const alunoId = req.params.alunoId || "unknown";
    const timestamp = Date.now();
    const extension = file.originalname.split(".").pop();
    cb(null, `aluno_${alunoId}_${timestamp}.${extension}`);
  },
});

const alunoImageUpload = multer({
  storage: alunoImageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite de 5MB
  },
  fileFilter: function (req, file, cb) {
    // Aceita apenas imagens
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Apenas arquivos de imagem são permitidos!"), false);
    }
  },
});

// Rota para fazer upload da foto de um aluno
app.post(
  "/alunos/:alunoId/upload-photo",
  authenticateToken,
  alunoImageUpload.single("alunoPhoto"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nenhuma imagem enviada." });
      }

      const alunoId = req.params.alunoId;
      const { filename } = req.file;

      // Caminho relativo para acessar a imagem via URL
      const imageUrl = `/uploads/aluno_image/${filename}`;

      // 1. Primeiro, busca a foto atual do aluno para removê-la
      const currentPhotoQuery = await db.query(
        "SELECT foto_perfil FROM alunos WHERE id = $1",
        [alunoId]
      );

      if (currentPhotoQuery.rowCount === 0) {
        return res.status(404).json({ error: "Aluno não encontrado." });
      }

      const currentPhoto = currentPhotoQuery.rows[0].foto_perfil;

      // 2. Atualiza a foto do aluno no banco de dados
      const updateQuery = `
        UPDATE alunos 
        SET foto_perfil = $1 
        WHERE id = $2 
        RETURNING id, nome_completo, foto_perfil
      `;

      const result = await db.query(updateQuery, [imageUrl, alunoId]);

      // 3. Remove a foto antiga do sistema de arquivos (se existir)
      if (currentPhoto) {
        removePhotoFile(currentPhoto);
      }

      res.json({
        message: "Foto do aluno atualizada com sucesso!",
        aluno: result.rows[0],
        imageUrl: imageUrl,
      });
    } catch (err) {
      console.error("Erro ao fazer upload da foto do aluno:", err.message);
      res.status(500).json({ error: "Erro interno ao fazer upload da foto." });
    }
  }
);

// Rota para remover a foto de um aluno
app.delete(
  "/alunos/:alunoId/remove-photo",
  authenticateToken,
  async (req, res) => {
    try {
      const alunoId = req.params.alunoId;

      // Busca a foto atual do aluno
      const findResult = await db.query(
        "SELECT foto_perfil FROM alunos WHERE id = $1",
        [alunoId]
      );

      if (findResult.rowCount === 0) {
        return res.status(404).json({ error: "Aluno não encontrado." });
      }

      const currentPhoto = findResult.rows[0].foto_perfil;

      // Remove a foto do banco de dados
      const updateQuery = `
      UPDATE alunos 
      SET foto_perfil = NULL 
      WHERE id = $1 
      RETURNING id, nome_completo, foto_perfil
    `;

      const result = await db.query(updateQuery, [alunoId]);

      // Se havia uma foto, remove o arquivo físico
      if (currentPhoto) {
        removePhotoFile(currentPhoto);
      }

      res.json({
        message: "Foto do aluno removida com sucesso!",
        aluno: result.rows[0],
      });
    } catch (err) {
      console.error("Erro ao remover foto do aluno:", err.message);
      res.status(500).json({ error: "Erro interno ao remover a foto." });
    }
  }
);

// --- ROTAS PARA IMPORTAÇÃO EXCEL ---

// Rota para importar responsáveis via Excel
app.post(
  "/responsaveis/upload-excel",
  memoryUpload.single("responsaveis_excel"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo foi enviado." });
    }

    const client = await pool.connect();

    try {
      // Ler o arquivo do buffer de memória
      const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Converter a planilha para JSON
      const data = xlsx.utils.sheet_to_json(worksheet);

      if (data.length === 0) {
        return res.status(400).json({
          error: "O arquivo Excel está vazio ou em formato inválido.",
        });
      }

      await client.query("BEGIN");

      let insertedCount = 0;
      let errors = [];

      for (const [index, row] of data.entries()) {
        try {
          // Mapear colunas do Excel para campos do banco
          const nome_completo =
            row["Nome Completo"] ||
            row["nome_completo"] ||
            row["Nome"] ||
            row["nome"];
          const email = row["Email"] || row["email"];
          const telefone = row["Telefone"] || row["telefone"];
          const outro_telefone =
            row["Outro Telefone"] ||
            row["outro_telefone"] ||
            row["OutroTelefone"];
          const rg = row["RG"] || row["rg"];
          const cpf = row["CPF"] || row["cpf"];

          // Validação: nome, email e telefone são obrigatórios
          if (!nome_completo || !email || !telefone) {
            errors.push(
              `Linha ${index + 2}: Nome, email e telefone são obrigatórios`
            );
            continue;
          }

          // Verificar se o email já existe
          const existingEmail = await client.query(
            "SELECT id FROM familias WHERE email = $1",
            [email]
          );

          if (existingEmail.rows.length > 0) {
            errors.push(`Linha ${index + 2}: Email já cadastrado: ${email}`);
            continue;
          }

          // Inserir responsável
          const insertQuery = `
            INSERT INTO familias (nome_completo, email, telefone, outro_telefone, rg, cpf, data_cadastro)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
          `;

          await client.query(insertQuery, [
            String(nome_completo).trim(),
            String(email).trim().toLowerCase(),
            String(telefone).trim(),
            outro_telefone ? String(outro_telefone).trim() : null,
            rg ? String(rg).trim() : null,
            cpf ? String(cpf).trim() : null,
          ]);

          insertedCount++;
        } catch (rowError) {
          errors.push(`Linha ${index + 2}: ${rowError.message}`);
        }
      }

      if (errors.length > 0) {
        // Se houveram erros, mas alguns responsáveis foram inseridos, confirma os bem-sucedidos (sucesso parcial).
        if (insertedCount > 0) {
          await client.query("COMMIT");
          return res.status(207).json({
            message: `${insertedCount} responsáveis foram importados com sucesso, mas ${errors.length} linhas tiveram erros.`,
            details: errors,
            insertedCount,
            errorCount: errors.length,
          });
        } else {
          // Se houveram erros e nenhum responsável foi inserido, desfaz a transação.
          await client.query("ROLLBACK");
          return res.status(400).json({
            error: `A importação falhou. Foram encontrados ${errors.length} erros e nenhum responsável foi importado.`,
            details: errors,
          });
        }
      }

      await client.query("COMMIT");

      res.status(201).json({
        message: `${insertedCount} responsáveis foram importados com sucesso!`,
        insertedCount,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Erro ao importar responsáveis do Excel:", error);
      res.status(500).json({
        error: "Ocorreu um erro no servidor ao processar o arquivo.",
      });
    } finally {
      client.release();
    }
  }
);

// Rota para importar alunos via Excel
app.post(
  "/alunos/upload-excel",
  memoryUpload.single("alunos_excel"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo foi enviado." });
    }

    const client = await pool.connect();

    try {
      // Ler o arquivo do buffer de memória
      const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Converter a planilha para JSON
      const data = xlsx.utils.sheet_to_json(worksheet);

      if (data.length === 0) {
        return res.status(400).json({
          error: "O arquivo Excel está vazio ou em formato inválido.",
        });
      }

      await client.query("BEGIN");

      let insertedCount = 0;
      let errors = [];

      for (const [index, row] of data.entries()) {
        try {
          // Mapear colunas do Excel para campos do banco (mais flexível)
          const nome_completo_aluno =
            row["Nome Completo Aluno"] ||
            row["nome_completo_aluno"] ||
            row["Nome Aluno"] ||
            row["nome_aluno"] ||
            row["Nome"] ||
            row["nome"] ||
            row["Nome do Aluno"] ||
            row["nome_do_aluno"];

          // Converter data do Excel para formato válido
          let data_nascimento =
            row["Data Nascimento"] ||
            row["data_nascimento"] ||
            row["Data de Nascimento"] ||
            row["Data"] ||
            row["data"] ||
            row["Nascimento"] ||
            row["nascimento"];

          // Se a data for um número (formato serial do Excel), converter para data
          if (data_nascimento && !isNaN(data_nascimento)) {
            // Converter número serial do Excel para data
            const excelDate = new Date(
              (data_nascimento - 25569) * 86400 * 1000
            );
            data_nascimento = excelDate.toISOString().split("T")[0]; // Formato YYYY-MM-DD
          } else if (data_nascimento && typeof data_nascimento === "string") {
            // Se for string, tentar converter para formato YYYY-MM-DD
            const dateObj = new Date(data_nascimento);
            if (!isNaN(dateObj.getTime())) {
              data_nascimento = dateObj.toISOString().split("T")[0];
            }
          }

          const informacoes_saude =
            row["Informações Saúde"] ||
            row["informacoes_saude"] ||
            row["Saúde"] ||
            row["saude"] ||
            row["Saude"] ||
            row["Informacoes"] ||
            row["informacoes"];
          const status_pagamento =
            row["Status Pagamento"] ||
            row["status_pagamento"] ||
            row["Status"] ||
            row["status"] ||
            "Integral";
          const nome_completo_responsavel =
            row["Nome Responsável"] ||
            row["nome_responsavel"] ||
            row["Responsável"] ||
            row["responsavel"] ||
            row["Responsavel"] ||
            row["Nome do Responsável"] ||
            row["nome_do_responsavel"];
          const telefone =
            row["Telefone"] || row["telefone"] || row["Tel"] || row["tel"];
          const email =
            row["Email"] || row["email"] || row["E-mail"] || row["e-mail"];
          const outro_telefone =
            row["Outro Telefone"] ||
            row["outro_telefone"] ||
            row["OutroTelefone"] ||
            row["Telefone 2"] ||
            row["telefone2"] ||
            row["Celular"] ||
            row["celular"];
          const rg = row["RG"] || row["rg"];
          const cpf = row["CPF"] || row["cpf"];

          // Validação: campos obrigatórios
          if (
            !nome_completo_aluno ||
            !data_nascimento ||
            !nome_completo_responsavel ||
            !telefone ||
            !email
          ) {
            const missingFields = [];
            if (!nome_completo_aluno) missingFields.push("Nome do aluno");
            if (!data_nascimento) missingFields.push("Data de nascimento");
            if (!nome_completo_responsavel)
              missingFields.push("Nome do responsável");
            if (!telefone) missingFields.push("Telefone");
            if (!email) missingFields.push("Email");

            errors.push(
              `Linha ${
                index + 2
              }: Campos obrigatórios não encontrados: ${missingFields.join(
                ", "
              )}`
            );
            continue;
          }

          const sanitizedEmail = String(email).trim().toLowerCase();
          const sanitizedCpf = cpf ? String(cpf).trim() : null;

          // 1. Lógica de verificação de responsável refatorada para maior clareza e robustez
          let familia_id;

          // Primeiro, verifica se o CPF já existe e pertence a um email diferente (conflito)
          if (sanitizedCpf) {
            const conflictCheck = await client.query(
              `SELECT id, email FROM familias WHERE cpf = $1`,
              [sanitizedCpf]
            );
            if (
              conflictCheck.rows.length > 0 &&
              conflictCheck.rows[0].email !== sanitizedEmail
            ) {
              errors.push(
                `Linha ${
                  index + 2
                }: O CPF '${sanitizedCpf}' já está cadastrado para um responsável com um email diferente (${
                  conflictCheck.rows[0].email
                }).`
              );
              continue; // Pula para a próxima linha
            }
          }

          // 2. Tenta encontrar a família por CPF (se houver) ou por email
          let existingFamiliaResult;
          if (sanitizedCpf) {
            existingFamiliaResult = await client.query(
              `SELECT id FROM familias WHERE cpf = $1`,
              [sanitizedCpf]
            );
          } else {
            existingFamiliaResult = await client.query(
              `SELECT id FROM familias WHERE email = $1`,
              [sanitizedEmail]
            );
          }

          if (existingFamiliaResult.rows.length > 0) {
            // Família encontrada, usa o ID existente
            familia_id = existingFamiliaResult.rows[0].id;
          } else {
            // Se o email já estiver em uso (mas o CPF não estava), informa o erro.
            const emailCheck = await client.query(
              `SELECT id FROM familias WHERE email = $1`,
              [sanitizedEmail]
            );
            if (emailCheck.rows.length > 0) {
              errors.push(
                `Linha ${
                  index + 2
                }: O email '${sanitizedEmail}' já está em uso, mas o CPF não corresponde a um registro existente.`
              );
              continue;
            }

            // Nenhuma família correspondente encontrada, cria uma nova.
            const insertFamiliaQuery = `
              INSERT INTO familias (nome_completo, email, telefone, outro_telefone, rg, cpf, data_cadastro)
              VALUES ($1, $2, $3, $4, $5, $6, NOW())
              RETURNING id
            `;
            const familiaResult = await client.query(insertFamiliaQuery, [
              String(nome_completo_responsavel).trim(),
              sanitizedEmail,
              String(telefone).trim(),
              outro_telefone ? String(outro_telefone).trim() : null,
              rg ? String(rg).trim() : null,
              sanitizedCpf,
            ]);
            familia_id = familiaResult.rows[0].id;
          }

          // Inserir aluno
          const insertAlunoQuery = `
             INSERT INTO alunos (nome_completo, data_nascimento, informacoes_saude, status_pagamento, familia_id, status_aluno, created_at)
             VALUES ($1, $2, $3, $4, $5, true, NOW())
           `;

          await client.query(insertAlunoQuery, [
            String(nome_completo_aluno).trim(),
            data_nascimento,
            informacoes_saude ? String(informacoes_saude).trim() : null,
            status_pagamento,
            familia_id,
          ]);

          insertedCount++;
        } catch (rowError) {
          // Adiciona o erro ao array de erros e continua para a próxima linha
          errors.push(
            `Linha ${index + 2}: Erro no banco de dados - ${rowError.message}`
          );
        }
      }

      if (errors.length > 0) {
        // Se houveram erros, mas alguns alunos foram inseridos, confirma os bem-sucedidos (sucesso parcial).
        if (insertedCount > 0) {
          await client.query("COMMIT");
          return res.status(207).json({
            // 207 Multi-Status
            message: `${insertedCount} alunos foram importados com sucesso, mas ${errors.length} linhas tiveram erros.`,
            details: errors,
            insertedCount,
            errorCount: errors.length,
          });
        } else {
          // Se houveram erros e nenhum aluno foi inserido, desfaz a transação.
          await client.query("ROLLBACK");
          return res.status(400).json({
            error: `A importação falhou. Foram encontrados ${errors.length} erros e nenhum aluno foi importado.`,
            details: errors,
          });
        }
      } else {
        // Se não houver erros, confirma a transação.
        await client.query("COMMIT");
        return res.status(201).json({
          message: `${insertedCount} alunos foram importados com sucesso!`,
          insertedCount,
        });
      }
    } catch (error) {
      // Captura erros fatais (ex: falha ao conectar ou iniciar a transação)
      await client.query("ROLLBACK");
      console.error("Erro fatal ao importar alunos do Excel:", error);
      res.status(500).json({
        error: "Ocorreu um erro crítico no servidor ao processar o arquivo.",
        details: error.message,
      });
    } finally {
      client.release();
    }
  }
);

// ==============================
// WEBHOOK PARA GOOGLE FORMS
// ==============================

// Rota principal para testar se o servidor está no ar
app.get("/", (req, res) => {
  res.send(
    "Servidor no ar! Pronto para receber dados do Google Forms e gerenciar a escola."
  );
});

// Rota do webhook que vai receber os dados do Google Forms
app.post("/webhook", async (req, res) => {
  try {
    console.log("🎉 Dados recebidos do Google Forms!");
    console.log("Timestamp:", new Date().toISOString());
    console.log("Dados recebidos:", JSON.stringify(req.body, null, 2));

    // Extrair dados do formulário Google Forms
    const formData = req.body;

    // Função para extrair valor do array do Google Forms
    const extractValue = (field) => {
      if (Array.isArray(field) && field.length > 0) {
        const value = field[0] ? field[0].toString().trim() : "";
        return value === "" ? null : value;
      }
      const value = field ? field.toString().trim() : "";
      return value === "" ? null : value;
    };

    // Função para extrair valor que preserva strings vazias do Google Forms
    const extractValueWithEmpty = (field) => {
      if (Array.isArray(field) && field.length > 0) {
        const value = field[0] ? field[0].toString().trim() : "";
        return value; // Retorna string vazia se for vazia, não null
      }
      const value = field ? field.toString().trim() : "";
      return value; // Retorna string vazia se for vazia, não null
    };

    // Mapear campos do Google Forms para a tabela interessados
    // Suporta variações de rótulos do Google Forms e payloads diretos (raw JSON)
    const getFirstMatch = (keys) => {
      for (const k of keys) {
        if (Object.prototype.hasOwnProperty.call(formData, k)) {
          const val = extractValueWithEmpty(formData[k]);
          if (val !== null && val !== undefined) return { key: k, value: val };
        }
      }
      return { key: null, value: null };
    };

    const nomeMatch = getFirstMatch([
      "Nome Completo",
      "Nome",
      "nome",
      "nome_completo",
      "Nome do Responsável",
      "Nome da Criança",
    ]);
    let nomeCompleto = nomeMatch.value;

    const emailMatch = getFirstMatch(["Email", "email"]);
    const email = emailMatch.value;

    const telefoneMatch = getFirstMatch([
      "Telefone",
      "telefone",
      "Celular",
      "celular",
      "WhatsApp",
      "Whatsapp",
      "whatsapp",
      "Número de telefone",
      "Numero de telefone",
      "numero_telefone",
      "Telefone para contato",
      "Contato",
    ]);
    const telefone = telefoneMatch.value;

    const comoConheceuMatch = getFirstMatch([
      "Como Conheceu",
      "como_conheceu",
      "Como nos conheceu",
      "Como ficou sabendo",
      "Como soube da escola",
      "Canal",
      "Origem",
    ]);
    let comoConheceu = comoConheceuMatch.value;

    const carimboMatch = getFirstMatch([
      "Carimbo de data/hora",
      "Timestamp",
      "timestamp",
      "Data",
      "data",
    ]);
    const carimboDeta = carimboMatch.value;

    console.log("� Dados extraídos:", {
      nome: nomeCompleto,
      email: email,
      telefone: telefone,
      como_conheceu: comoConheceu,
      carimbo: carimboDeta,
    });
    console.log("🔎 Chaves mapeadas:", {
      nomeKey: nomeMatch.key,
      emailKey: emailMatch.key,
      telefoneKey: telefoneMatch.key,
      comoConheceuKey: comoConheceuMatch.key,
      carimboKey: carimboMatch.key,
      availableKeys: Object.keys(formData),
    });
    console.log("📝 Valores brutos do Google Forms:", {
      "Nome Completo": formData["Nome Completo"],
      Telefone: formData["Telefone"],
      "Como Conheceu": formData["Como Conheceu"],
    });

    // Tentar salvar no banco de dados se pelo menos o nome estiver presente
    let savedToDatabase = false;
    // Normalizar campo "Como Conheceu" para os valores esperados no frontend
    const allowedComoConheceu = [
      "Google",
      "Instagram",
      "Facebook",
      "Tik Tok",
      "Indicação",
      "Outro:",
    ];
    if (comoConheceu) {
      const normalized = comoConheceu.trim();
      const normalizedLower = normalized.toLowerCase();
      if (normalizedLower === "indicacao") {
        comoConheceu = "Indicação";
      } else if (
        allowedComoConheceu
          .map((v) => v.toLowerCase())
          .includes(normalizedLower)
      ) {
        // Usa exatamente o valor padronizado conforme a lista (case-sensitive)
        const idx = allowedComoConheceu
          .map((v) => v.toLowerCase())
          .indexOf(normalizedLower);
        comoConheceu = allowedComoConheceu[idx];
      } else {
        // Mantém o texto enviado, mas evita string vazia
        comoConheceu = normalized === "" ? null : normalized;
      }
    }

    // Normaliza nome para Title Case básico (sem afetar nomes compostos com preposições específicas)
    if (nomeCompleto && nomeCompleto.trim() !== "") {
      try {
        const toTitleCase = (str) =>
          str
            .split(/\s+/)
            .filter(Boolean)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(" ");
        nomeCompleto = toTitleCase(nomeCompleto);
      } catch (_) {}
    }

    // Aceita qualquer valor não-nulo para nome (incluindo strings vazias do Google Forms)
    // Mas ainda exige que tenha pelo menos algum conteúdo para salvar
    if (
      nomeCompleto !== null &&
      nomeCompleto !== undefined &&
      nomeCompleto.trim() !== ""
    ) {
      try {
        // Converter carimbo de data/hora do Google Forms para timestamp PostgreSQL
        let dataContato = new Date().toISOString(); // Default para agora
        if (carimboDeta) {
          try {
            // Formato esperado: "15/09/2025 14:37:58"
            const [datePart, timePart] = carimboDeta.split(" ");
            const [day, month, year] = datePart.split("/");
            const formattedDate = `${year}-${month.padStart(
              2,
              "0"
            )}-${day.padStart(2, "0")}`;

            if (timePart) {
              const timestamp = new Date(`${formattedDate}T${timePart}`);
              if (!isNaN(timestamp.getTime())) {
                dataContato = timestamp.toISOString();
              }
            }
          } catch (dateError) {
            console.log(
              "⚠️ Erro ao converter data, usando timestamp atual:",
              dateError.message
            );
          }
        }

        const insertQuery = `
          INSERT INTO interessados (nome, telefone, como_conheceu, intencao, status, data_contato)
          VALUES ($1, $2, $3, $4, 'Entrou Em Contato', $5)
          RETURNING id, nome, telefone, status
        `;

        const result = await pool.query(insertQuery, [
          nomeCompleto,
          telefone,
          comoConheceu || null,
          true, // intencao padrão como true para dados do Google Forms
          dataContato,
        ]);

        console.log("✅ Dados salvos no banco de dados:", result.rows[0]);
        savedToDatabase = true;
      } catch (dbError) {
        console.error("❌ Erro ao salvar no banco de dados:", dbError);
        // Continua o processamento mesmo com erro no banco
      }
    } else {
      console.log(
        "⚠️ Dados insuficientes para salvar no banco (nome obrigatório)"
      );
    }

    // Salvar em arquivo log para histórico (independente do sucesso no banco)
    const logEntry = {
      timestamp: new Date().toISOString(),
      data: formData,
      extracted: {
        nome: nomeCompleto,
        email: email,
        telefone: telefone,
        como_conheceu: comoConheceu,
        carimbo: carimboDeta,
      },
      savedToDatabase: savedToDatabase,
      processed: true,
    };

    // Criar pasta logs se não existir
    const logsDir = path.join(__dirname, "logs");
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir);
    }

    // Salvar log do webhook
    const logFile = path.join(
      logsDir,
      `webhook_${new Date().toISOString().split("T")[0]}.json`
    );
    let existingLogs = [];
    if (fs.existsSync(logFile)) {
      const fileContent = fs.readFileSync(logFile, "utf8");
      existingLogs = JSON.parse(fileContent);
    }
    existingLogs.push(logEntry);
    fs.writeFileSync(logFile, JSON.stringify(existingLogs, null, 2));

    // Responde com status 200 (OK) para o Google saber que recebemos
    res.status(200).json({
      success: true,
      message: "Dados recebidos e processados com sucesso!",
      savedToDatabase: savedToDatabase,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Erro ao processar webhook:", error);

    // Salvar erro no log também
    try {
      const errorLogEntry = {
        timestamp: new Date().toISOString(),
        data: req.body,
        error: error.message,
        processed: false,
      };

      const logsDir = path.join(__dirname, "logs");
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir);
      }

      const logFile = path.join(
        logsDir,
        `webhook_${new Date().toISOString().split("T")[0]}.json`
      );
      let existingLogs = [];
      if (fs.existsSync(logFile)) {
        const fileContent = fs.readFileSync(logFile, "utf8");
        existingLogs = JSON.parse(fileContent);
      }
      existingLogs.push(errorLogEntry);
      fs.writeFileSync(logFile, JSON.stringify(existingLogs, null, 2));
    } catch (logError) {
      console.error("❌ Erro ao salvar log de erro:", logError);
    }

    // Mesmo com erro, responder com 200 para evitar reenvios do Google
    res.status(200).json({
      success: false,
      message: "Erro interno, mas dados foram recebidos",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Rota para consultar logs dos webhooks (opcional)
app.get("/webhook/logs", async (req, res) => {
  try {
    const logsDir = path.join(__dirname, "logs");
    const date = req.query.date || new Date().toISOString().split("T")[0];
    const logFile = path.join(logsDir, `webhook_${date}.json`);

    if (fs.existsSync(logFile)) {
      const logs = JSON.parse(fs.readFileSync(logFile, "utf8"));
      res.json({
        success: true,
        date: date,
        logs: logs,
      });
    } else {
      res.json({
        success: true,
        date: date,
        logs: [],
        message: "Nenhum log encontrado para esta data",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro ao consultar logs",
      error: error.message,
    });
  }
});

// ==============================

// Inicia o servidor para ouvir na porta definida
app.listen(port, () => {
  console.log(`🚀 Servidor backend rodando em http://localhost:${port}`);
  console.log(`📋 Webhook disponível em: http://localhost:${port}/webhook`);
  console.log(`📊 Logs dos webhooks em: http://localhost:${port}/webhook/logs`);
});
