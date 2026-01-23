require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const db = require("./db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");
const xlsx = require("xlsx");
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const swaggerDocument = YAML.load(path.join(__dirname, "doc", "swagger.yaml"));

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
const pool = require("./db");

const JWT_SECRET =
  process.env.JWT_SECRET || "sua_chave_secreta_muito_segura_aqui_2024";
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

// Lista de origens permitidas
const allowedOrigins = [
  FRONTEND_ORIGIN,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "https://waldorf-git-main-bomfas-projects.vercel.app",
  "https://waldorf.vercel.app",
];

// Adiciona URL da Vercel se configurada
if (process.env.VERCEL_URL) {
  allowedOrigins.push(`https://${process.env.VERCEL_URL}`);
}

app.use(
  cors({
    origin: function (origin, callback) {
      // Permite requisições sem origin (ex: Postman, mobile apps)
      if (!origin) return callback(null, true);

      // Permite qualquer subdomínio da Vercel
      if (origin.includes("vercel.app")) {
        return callback(null, true);
      }

      // Verifica se a origin está na lista permitida
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cookie",
      "X-Requested-With",
    ],
    exposedHeaders: ["Authorization"],
  }),
);
app.use(express.json());
app.use(cookieParser());

// Middleware para prevenir cache de páginas autenticadas
app.use((req, res, next) => {
  // Adiciona headers para prevenir cache em rotas autenticadas
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
    "Surrogate-Control": "no-store",
  });
  next();
});

// Rotas do Firebase Storage
const uploadRoutes = require("./src/routes/upload.routes");
app.use("/api/upload", uploadRoutes);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

async function sendResetEmail(to, resetLink) {
  try {
    const nodemailer = require("nodemailer");
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } =
      process.env;

    console.log("📧 [sendResetEmail] ======= INÍCIO DO ENVIO DE EMAIL =======");
    console.log("📧 [sendResetEmail] Destinatário:", to);
    console.log("📧 [sendResetEmail] Link de reset:", resetLink);
    console.log("📧 [sendResetEmail] SMTP_HOST:", SMTP_HOST);
    console.log("📧 [sendResetEmail] SMTP_PORT:", SMTP_PORT);
    console.log("📧 [sendResetEmail] SMTP_USER:", SMTP_USER ? "***" + SMTP_USER.slice(-10) : "Não definido");
    console.log("📧 [sendResetEmail] SMTP_PASS:", SMTP_PASS ? "***" + SMTP_PASS.slice(-5) : "Não definido");
    console.log("📧 [sendResetEmail] EMAIL_FROM:", EMAIL_FROM);

    if (!SMTP_HOST) {
      console.log("❌ [sendResetEmail] SMTP_HOST não configurado - abortando envio");
      return false;
    }

    if (!SMTP_USER || !SMTP_PASS) {
      console.log("❌ [sendResetEmail] Credenciais SMTP incompletas");
      console.log("❌ [sendResetEmail] SMTP_USER:", !!SMTP_USER);
      console.log("❌ [sendResetEmail] SMTP_PASS:", !!SMTP_PASS);
      return false;
    }

    console.log("📧 [sendResetEmail] Criando transporter...");
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT ? parseInt(SMTP_PORT) : 587,
      secure: false, // false para TLS
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      // Adicionar opções de debug
      debug: true,
      logger: true,
    });

    console.log("📧 [sendResetEmail] Verificando conexão com SMTP...");
    try {
      await transporter.verify();
      console.log("✅ [sendResetEmail] Conexão SMTP verificada com sucesso");
    } catch (verifyError) {
      console.error("❌ [sendResetEmail] Falha na verificação SMTP:", verifyError.message);
      throw verifyError;
    }

    console.log("📧 [sendResetEmail] Enviando email...");
    const mailOptions = {
      from: EMAIL_FROM || SMTP_USER,
      to: to,
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
    };

    console.log("📧 [sendResetEmail] Mail options:", {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
    });

    const result = await transporter.sendMail(mailOptions);

    console.log("✅ [sendResetEmail] Email enviado com sucesso!");
    console.log("📧 [sendResetEmail] Message ID:", result.messageId);
    console.log("📧 [sendResetEmail] Response:", result.response);
    console.log("📧 [sendResetEmail] ======= FIM DO ENVIO =======");

    return true;

  } catch (err) {
    console.error("❌ [sendResetEmail] ======= ERRO NO ENVIO =======");
    console.error("❌ [sendResetEmail] Tipo do erro:", err.constructor.name);
    console.error("❌ [sendResetEmail] Mensagem:", err.message);
    console.error("❌ [sendResetEmail] Código do erro:", err.code);
    console.error("❌ [sendResetEmail] Comando de resposta:", err.response);
    console.error("❌ [sendResetEmail] Stack trace:", err.stack);
    console.error("❌ [sendResetEmail] ======= FIM DO ERRO =======");

    return false;
  }
}

app.post("/login", async (req, res) => {
  console.log("🔐 Tentativa de login:", {
    email: req.body.email,
    hasPassword: !!req.body.password,
  });

  const { email, password, rememberMe } = req.body;
  if (!email || !password) {
    console.log("❌ Login falhou: email ou senha ausente");
    return res.status(400).json({ error: "Email e senha são obrigatórios." });
  }
  try {
    console.log("🔍 Buscando usuário no banco:", email);
    const userQuery = await db.query(
      "SELECT * FROM usuarios WHERE email = $1",
      [email],
    );
    console.log(
      "📊 Resultado da query:",
      userQuery.rows.length,
      "usuário(s) encontrado(s)",
    );

    if (userQuery.rows.length === 0) {
      console.log("❌ Usuário não encontrado:", email);
      return res.status(401).json({ error: "Credenciais inválidas." });
    }
    const user = userQuery.rows[0];
    console.log("✓ Usuário encontrado, verificando senha...");

    const isMatch = await bcrypt.compare(password, user.senha);
    console.log("🔑 Senha válida:", isMatch);

    if (!isMatch) {
      console.log("❌ Senha incorreta para:", email);
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

    console.log("✅ Login bem-sucedido para:", email);
    res.status(200).json({
      message: "Login bem-sucedido!",
      userId: user.id,
      nome: user.nome,
      cargo: user.cargo,
      email: user.email,
      rememberMe: rememberMe,
      token: token, // Retorna o token no response para uso com localStorage
    });
  } catch (err) {
    console.error("❌ ERRO NO LOGIN:", err.message);
    console.error("   Stack:", err.stack);
    console.error("   Code:", err.code);
    res.status(500).json({ error: "Erro no servidor." });
  }
});

// Middleware para verificar token JWT
const authenticateToken = (req, res, next) => {
  console.log("\n🔐 [AUTH] Verificando autenticação...");
  console.log("📍 [AUTH] Rota:", req.method, req.path);

  // Tenta pegar o token do header Authorization primeiro
  const authHeader = req.headers.authorization || req.headers.Authorization;
  console.log(
    "🔑 [AUTH] Authorization Header:",
    authHeader ? authHeader.substring(0, 50) + "..." : "Não encontrado",
  );

  let token = null;

  if (authHeader) {
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
      console.log("✅ [AUTH] Token extraído do header Bearer");
    } else {
      // Tenta usar diretamente como token
      token = authHeader;
      console.log("⚠️ [AUTH] Header sem 'Bearer', usando valor direto");
    }
  }

  // Se não tiver no header, tenta pegar do cookie
  if (!token) {
    token = req.cookies.authToken;
    console.log(
      "🍪 [AUTH] Tentando cookie:",
      token ? "Encontrado" : "Não encontrado",
    );
  }

  if (!token) {
    console.log("❌ [AUTH] Token não fornecido - rejeitando requisição");
    return res.status(401).json({ error: "Token não fornecido" });
  }

  console.log("🔍 [AUTH] Validando token com JWT_SECRET...");
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log("❌ [AUTH] Token inválido:", err.message);
      console.log("❌ [AUTH] Detalhes do erro:", err.name);
      return res.status(403).json({ error: "Token inválido ou expirado" });
    }
    console.log(
      "✅ [AUTH] Token válido - Usuário:",
      user.userId,
      user.email,
      "Cargo:",
      user.cargo,
    );
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
      [req.user.userId],
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const user = userQuery.rows[0];
    console.log("[/auth/me] Retornando dados do usuário:", {
      userId: user.id,
      nome: user.nome,
      foto_perfil: user.foto_perfil,
    });
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

  // Headers adicionais para garantir que não há cache
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
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

// Normaliza o período para os valores aceitos pelo ENUM do banco
// Mapeia variações e remove acentos: "manhã" -> "manha", "matutino" -> "manha", "vespertino" -> "tarde"
function normalizePeriodo(value) {
  if (!value) return "";
  const base = String(value)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
  // mapeamentos comuns
  if (["manha", "manhã", "matutino"].includes(base)) return "manha";
  if (["tarde", "vespertino"].includes(base)) return "tarde";
  if (["noite", "noturno"].includes(base)) return "noite";
  if (
    [
      "integral",
      "tempo_integral",
      "diurno_integral",
      "tempoIntegral".toLowerCase(),
    ].includes(base)
  )
    return "integral";
  // mantém como está (sem acento), mas ainda pode falhar se enum for diferente
  return base;
}

// Início do fluxo de recuperação de senha
app.post("/recuperar-senha", async (req, res) => {
  try {
    console.log("🔑 [recuperar-senha] ======= NOVA SOLICITAÇÃO =======");
    const { email } = req.body;
    console.log("🔑 [recuperar-senha] Email recebido:", email);

    if (!email) {
      console.log("❌ [recuperar-senha] Email não fornecido");
      return res.status(400).json({ error: "Email é obrigatório." });
    }

    const userQuery = await db.query(
      "SELECT id, email, nome FROM usuarios WHERE LOWER(email) = LOWER($1)",
      [email],
    );

    console.log("🔑 [recuperar-senha] Usuários encontrados:", userQuery.rows.length);

    // Resposta genérica para não vazar existência de e-mails
    const genericMsg = {
      message:
        "Se o email estiver cadastrado, enviaremos um link de recuperação.",
    };

    if (userQuery.rows.length === 0) {
      console.log("❌ [recuperar-senha] Usuário não encontrado - retornando resposta genérica");
      return res.status(200).json(genericMsg);
    }

    const user = userQuery.rows[0];
    console.log("✅ [recuperar-senha] Usuário encontrado:", user.email, "(ID:", user.id + ")");

    const resetToken = jwt.sign(
      { type: "password_reset", userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "10m" },
    );

    // Link para a página do frontend que irá receber o token
    const RESET_LINK_ORIGIN = process.env.RESET_LINK_ORIGIN || FRONTEND_ORIGIN;
    const resetLink = `${RESET_LINK_ORIGIN.replace(
      /\/$/,
      "",
    )}/resetar-senha?token=${encodeURIComponent(resetToken)}`;

    console.log("🔗 [recuperar-senha] Link gerado:", resetLink);
    console.log("🔗 [recuperar-senha] RESET_LINK_ORIGIN:", RESET_LINK_ORIGIN);
    console.log("🔗 [recuperar-senha] FRONTEND_ORIGIN:", FRONTEND_ORIGIN);

    // Tenta enviar o e-mail; se SMTP não estiver configurado, loga o link
    console.log("📧 [recuperar-senha] Chamando sendResetEmail...");
    const emailSent = await sendResetEmail(user.email, resetLink);

    if (emailSent) {
      console.log("✅ [recuperar-senha] Email enviado com sucesso");
    } else {
      console.log("❌ [recuperar-senha] Falha no envio do email");
    }

    console.log("🔑 [recuperar-senha] ======= FIM DA SOLICITAÇÃO =======");
    return res.status(200).json(genericMsg);
  } catch (err) {
    console.error("❌ [recuperar-senha] Erro:", err);
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
  express.static(path.join(__dirname, "uploads/aluno_image")),
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

// Configuração do multer para anexos de alunos
const alunoAnexosUploadDir = path.join(__dirname, "uploads", "anexos_aluno");
if (!fs.existsSync(alunoAnexosUploadDir)) {
  fs.mkdirSync(alunoAnexosUploadDir, { recursive: true });
}

const alunoAnexosStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, alunoAnexosUploadDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.]/g, "_");
    cb(null, `${timestamp}_${sanitized}`);
  },
});

const alunoAnexosUpload = multer({
  storage: alunoAnexosStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Limite de 10MB
  },
});

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
  },
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
      [id],
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
        `Arquivo físico não encontrado em: ${absoluteFilePath}. O registro no banco de dados foi removido.`,
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
    const query = `
      SELECT 
        id, 
        nome_completo, 
        email, 
        telefone, 
        outro_telefone, 
        data_cadastro, 
        rg, 
        cpf,
        cidade,
        bairro,
        tipo_logradouro,
        logradouro,
        numero,
        complemento
      FROM familias 
      ORDER BY nome_completo ASC
    `;
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

// Rota para buscar responsável por CPF
app.get(
  "/responsaveis/buscar-por-cpf/:cpf",
  authenticateToken,
  async (req, res) => {
    const { cpf } = req.params;
    console.log("\n========================================");
    console.log("🔍 [Backend] Buscando responsável com CPF:", cpf);
    console.log("========================================");

    try {
      // Normaliza CPF do parâmetro para buscar em ambos os formatos (com/sem máscara)
      const cpfLimpo = String(cpf).replace(/[^0-9]/g, "");
      const cpfMascara =
        cpfLimpo.length === 11
          ? `${cpfLimpo.slice(0, 3)}.${cpfLimpo.slice(3, 6)}.${cpfLimpo.slice(
              6,
              9,
            )}-${cpfLimpo.slice(9)}`
          : cpfLimpo;

      // Busca robusta via coluna gerada cpf_normalizado (apenas dígitos)
      const query = `
      SELECT 
        id, 
        nome_completo as nome_responsavel, 
        email, 
        telefone, 
        outro_telefone, 
        cpf::text as cpf_responsavel,
        data_cadastro
      FROM familias 
      WHERE cpf_normalizado = $1
      LIMIT 1
    `;
      console.log("📊 [Backend] Query SQL:", query.replace(/\s+/g, " ").trim());
      console.log("🔑 [Backend] Parâmetro CPF (limpo):", cpfLimpo);
      console.log("⏳ [Backend] Executando query...");

      const { rows } = await pool.query(query, [cpfLimpo]);

      console.log("📋 [Backend] Query executada! Resultados:", rows.length);
      if (rows.length > 0) {
        console.log(
          "📄 [Backend] Dados do primeiro resultado:",
          JSON.stringify(rows[0], null, 2),
        );
      }

      if (rows.length === 0) {
        console.log("❌ [Backend] CPF não encontrado na tabela familias");
        return res.status(404).json({ error: "Responsável não encontrado." });
      }

      const responsavel = rows[0];
      console.log(
        "✅ [Backend] Responsável encontrado:",
        responsavel.nome_responsavel,
      );
      console.log("👤 [Backend] ID do responsável:", responsavel.id);

      // Busca os alunos vinculados a este responsável
      console.log("\n👨‍👩‍👧‍👦 [Backend] Buscando alunos vinculados...");
      const alunosQuery = `
      SELECT
        a.id,
        a.nome_completo as nome_aluno,
        t.nome_turma as turma,
        t.periodo
      FROM alunos a
      LEFT JOIN turma_alunos ta ON a.id = ta.aluno_id
      LEFT JOIN turmas t ON ta.turma_id = t.id
      WHERE a.familia_id = $1 AND a.status_aluno = true
      ORDER BY a.nome_completo ASC
    `;
      console.log(
        "📊 [Backend] Query de alunos:",
        alunosQuery.replace(/\s+/g, " ").trim(),
      );
      console.log("🔑 [Backend] familia_id:", responsavel.id);
      console.log("⏳ [Backend] Executando query de alunos...");

      const alunosResult = await pool.query(alunosQuery, [responsavel.id]);

      console.log("📋 [Backend] Alunos encontrados:", alunosResult.rows.length);
      if (alunosResult.rows.length > 0) {
        console.log(
          "📄 [Backend] Dados dos alunos:",
          JSON.stringify(alunosResult.rows, null, 2),
        );
      }

      // Adiciona os alunos ao objeto do responsável
      responsavel.alunos = alunosResult.rows.map((aluno) => ({
        nome_aluno: aluno.nome_aluno,
        turma: aluno.turma ? `${aluno.turma} - ${aluno.periodo}` : "Sem turma",
      }));

      console.log("✅ [Backend] Dados completos preparados:", {
        nome: responsavel.nome_responsavel,
        total_alunos: responsavel.alunos.length,
      });
      console.log("📤 [Backend] Enviando resposta ao frontend...");
      console.log("========================================\n");

      res.status(200).json(responsavel);
    } catch (err) {
      console.error("\n❌❌❌ [Backend] ERRO CAPTURADO ❌❌❌");
      console.error("Tipo do erro:", err.constructor.name);
      console.error("Mensagem:", err.message);
      console.error("Código:", err.code);
      console.error("Detalhes:", err.detail);
      console.error("Stack completo:", err.stack);
      console.error("========================================\n");
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  },
);

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
  // O campo 'data_contato' usa NOW() para registrar a data/hora atual
  const insertQuery = `
    INSERT INTO interessados (nome, telefone, como_conheceu, intencao, status, data_contato)
    VALUES ($1, $2, $3, $4, 'Entrou Em Contato', NOW())
    RETURNING *;
  `;

  try {
    const novoInteressado = await pool.query(insertQuery, [
      nome,
      telefone,
      como_conheceu,
      intencaoBooleana,
    ]);

    // Criar notificação para administradores sobre novo lead
    try {
      console.log(
        "📬 [INTERESSADO] Criando notificação para administradores...",
      );
      const admins = await pool.query(
        `SELECT id FROM usuarios WHERE cargo ILIKE '%admin%'`,
      );

      if (admins.rows.length > 0) {
        console.log(
          `📬 [INTERESSADO] Encontrados ${admins.rows.length} administradores`,
        );
        for (const admin of admins.rows) {
          await pool.query(
            `INSERT INTO notificacoes (usuario_id, tipo, mensagem, lida, created_at)
             VALUES ($1, $2, $3, $4, NOW())`,
            [
              admin.id,
              "prematricula",
              `Novo lead de pré-matrícula: ${nome}. Telefone: ${telefone}`,
              false,
            ],
          );
        }
        console.log("✅ [INTERESSADO] Notificações criadas com sucesso!");
      }
    } catch (notifError) {
      console.error("⚠️ [INTERESSADO] Erro ao criar notificação:", notifError);
      // Não bloqueia a criação do interessado
    }

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
      [id],
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
      [id],
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
        error,
      );
      res.status(500).json({
        error: "Erro interno do servidor ao buscar dados do dashboard.",
      });
    }
  },
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
              String(intencao).toLowerCase().trim(),
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
  },
);

// Rota para ATUALIZAR (EDITAR) um responsável
app.put("/responsaveis/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const {
    nome_completo,
    nome,
    email,
    telefone,
    outro_telefone,
    cpf,
    rg,
    cidade,
    bairro,
    tipo_logradouro,
    logradouro,
    numero,
    complemento,
  } = req.body;

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
  // Armazena CPF somente com dígitos (normalizado)
  const finalCpf = cpf && cpf.trim() ? cpf.trim().replace(/[^0-9]/g, "") : null;
  const finalRg = rg && rg.trim() ? rg.trim() : null;
  const finalCidade = cidade && cidade.trim() ? cidade.trim() : null;
  const finalBairro = bairro && bairro.trim() ? bairro.trim() : null;
  const finalTipoLogradouro =
    tipo_logradouro && tipo_logradouro.trim() ? tipo_logradouro.trim() : null;
  const finalLogradouro =
    logradouro && logradouro.trim() ? logradouro.trim() : null;
  const finalNumero = numero && numero.trim() ? numero.trim() : null;
  const finalComplemento =
    complemento && complemento.trim() ? complemento.trim() : null;

  try {
    const updateQuery = await pool.query(
      `UPDATE familias SET nome_completo = $1, email = $2, telefone = $3, outro_telefone = $4, cpf = $5, rg = $6, cidade = $7, bairro = $8, tipo_logradouro = $9, logradouro = $10, numero = $11, complemento = $12 WHERE id = $13 RETURNING *`,
      [
        nomeField,
        email,
        telefone,
        outro_telefone,
        finalCpf,
        finalRg,
        finalCidade,
        finalBairro,
        finalTipoLogradouro,
        finalLogradouro,
        finalNumero,
        finalComplemento,
        id,
      ],
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

// Rota para CRIAR um novo responsável (familia)
app.post("/responsaveis", authenticateToken, async (req, res) => {
  try {
    console.log("\n========================================");
    console.log("📝 [CADASTRO RESPONSÁVEL] Recebendo dados:");
    console.log(
      "📦 [CADASTRO RESPONSÁVEL] Body completo:",
      JSON.stringify(req.body, null, 2),
    );
    console.log("========================================\n");

    const {
      nome_completo,
      email,
      telefone,
      outro_telefone,
      cpf,
      rg,
      cidade,
      bairro,
      tipo_logradouro,
      logradouro,
      numero,
      complemento,
    } = req.body || {};

    if (!nome_completo || !email || !telefone) {
      return res
        .status(400)
        .json({ error: "Nome, email e telefone são obrigatórios." });
    }
    // Strings vazias para campos únicos viram NULL
    // Armazena CPF somente com dígitos (normalizado)
    const finalCpf =
      cpf && String(cpf).trim()
        ? String(cpf)
            .trim()
            .replace(/[^0-9]/g, "")
        : null;
    const finalRg = rg && String(rg).trim() ? String(rg).trim() : null;
    const finalCidade =
      cidade && String(cidade).trim() ? String(cidade).trim() : null;
    const finalBairro =
      bairro && String(bairro).trim() ? String(bairro).trim() : null;
    const finalTipoLogradouro =
      tipo_logradouro && String(tipo_logradouro).trim()
        ? String(tipo_logradouro).trim()
        : null;
    const finalLogradouro =
      logradouro && String(logradouro).trim()
        ? String(logradouro).trim()
        : null;
    const finalNumero =
      numero && String(numero).trim() ? String(numero).trim() : null;
    const finalComplemento =
      complemento && String(complemento).trim()
        ? String(complemento).trim()
        : null;

    const insert = await pool.query(
      `INSERT INTO familias (nome_completo, email, telefone, outro_telefone, cpf, rg, cidade, bairro, tipo_logradouro, logradouro, numero, complemento)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        nome_completo,
        email,
        telefone,
        outro_telefone || null,
        finalCpf,
        finalRg,
        finalCidade,
        finalBairro,
        finalTipoLogradouro,
        finalLogradouro,
        finalNumero,
        finalComplemento,
      ],
    );
    return res.status(201).json(insert.rows[0]);
  } catch (err) {
    console.error("Erro ao criar responsável:", err);
    if (err.code === "23505" && err.constraint === "uk_familias_cpf") {
      return res
        .status(409)
        .json({ error: "O CPF informado já está cadastrado." });
    }
    if (err.code === "23505" && err.constraint === "familias_email_key") {
      // Em caso de e-mail duplicado, reutiliza o responsável existente
      try {
        const existing = await pool.query(
          `SELECT * FROM familias WHERE email = $1 LIMIT 1`,
          [req.body.email],
        );
        if (existing.rowCount > 0) {
          return res.status(200).json(existing.rows[0]);
        }
      } catch (_) {}
    }
    return res
      .status(500)
      .json({ error: "Erro interno ao criar responsável." });
  }
});

// Rota para VINCULAR um responsável existente a um aluno
app.post(
  "/alunos/:id/vincular-responsavel",
  authenticateToken,
  async (req, res) => {
    const { id } = req.params;
    const { familia_id } = req.body || {};
    if (!familia_id) {
      return res.status(400).json({ error: "familia_id é obrigatório." });
    }
    try {
      // Verifica existência
      const [alunoQ, familiaQ] = await Promise.all([
        pool.query("SELECT id FROM alunos WHERE id = $1", [id]),
        pool.query("SELECT id FROM familias WHERE id = $1", [familia_id]),
      ]);
      if (alunoQ.rowCount === 0) {
        return res.status(404).json({ error: "Aluno não encontrado." });
      }
      if (familiaQ.rowCount === 0) {
        return res
          .status(404)
          .json({ error: "Responsável (família) não encontrado." });
      }
      // Atualiza o familia_id do aluno
      const updated = await pool.query(
        `UPDATE alunos SET familia_id = $1 WHERE id = $2 RETURNING *`,
        [familia_id, id],
      );
      return res.status(200).json({
        message: "Responsável vinculado com sucesso.",
        aluno: updated.rows[0],
      });
    } catch (err) {
      console.error("Erro ao vincular responsável ao aluno:", err);
      return res
        .status(500)
        .json({ error: "Erro interno ao vincular responsável." });
    }
  },
);

// Rota para DESVINCULAR um responsável de um aluno
app.delete(
  "/alunos/:id/responsaveis/:familiaId",
  authenticateToken,
  async (req, res) => {
    const { id, familiaId } = req.params;
    try {
      // Define familia_id como null para o aluno
      const updated = await pool.query(
        `UPDATE alunos SET familia_id = NULL WHERE id = $1 AND familia_id = $2 RETURNING *`,
        [id, familiaId],
      );

      if (updated.rowCount === 0) {
        return res.status(404).json({ error: "Vínculo não encontrado." });
      }

      return res
        .status(200)
        .json({ message: "Responsável desvinculado com sucesso." });
    } catch (err) {
      console.error("Erro ao desvincular responsável:", err);
      return res
        .status(500)
        .json({ error: "Erro interno ao desvincular responsável." });
    }
  },
);

// Rota para listar responsáveis de um aluno
app.get("/alunos/:id/responsaveis", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const rs = await pool.query(
      `SELECT f.*
       FROM alunos a
       JOIN familias f ON f.id = a.familia_id
       WHERE a.id = $1
       ORDER BY f.nome_completo ASC`,
      [id],
    );
    return res.status(200).json(rs.rows);
  } catch (err) {
    console.error("Erro ao listar responsáveis do aluno:", err);
    return res
      .status(500)
      .json({ error: "Erro interno ao listar responsáveis." });
  }
});
// --- ROTAS DE AUTENTICAÇÃO ---
app.post(
  "/register",
  authenticateToken,
  authorizeRoles("Administrador Geral"),
  async (req, res) => {
    const { nome, email, password, cargo } = req.body;

    // Validação básica de campos obrigatórios
    if (!nome || !email || !password) {
      return res
        .status(400)
        .json({ error: "Nome, email e senha são obrigatórios." });
    }

    // Validação de sintaxe do e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ error: "Por favor, insira um endereço de e-mail válido." });
    }

    // Normalizar e-mail (lowercase para evitar duplicatas por case)
    const normalizedEmail = email.toLowerCase().trim();

    try {
      // Verificar se o e-mail já existe no banco
      const emailCheck = await db.query(
        "SELECT id FROM usuarios WHERE LOWER(email) = $1",
        [normalizedEmail],
      );

      if (emailCheck.rows.length > 0) {
        return res
          .status(409)
          .json({ error: "Este e-mail já está cadastrado no sistema." });
      }

      // Criar hash da senha
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Inserir novo usuário
      const queryText =
        "INSERT INTO usuarios (nome, email, senha, cargo) VALUES ($1, $2, $3, $4) RETURNING id, nome, email, cargo";
      const queryParams = [
        nome,
        normalizedEmail,
        hashedPassword,
        cargo || "professor",
      ];
      const newUser = await db.query(queryText, queryParams);

      res.status(201).json(newUser.rows[0]);
    } catch (err) {
      console.error("Erro ao registrar usuário:", err.message);

      // Tratamento de erro de duplicata (fallback caso a verificação anterior falhe)
      if (err.code === "23505") {
        return res
          .status(409)
          .json({ error: "Este e-mail já está cadastrado." });
      }

      res.status(500).json({ error: "Erro ao registrar usuário." });
    }
  },
);
// Rota para verificar se um e-mail já está cadastrado (útil para validação em tempo real)
app.post("/check-email", authenticateToken, async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email é obrigatório." });
  }

  // Validação de sintaxe
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      available: false,
      error: "Formato de e-mail inválido.",
    });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const result = await db.query(
      "SELECT id FROM usuarios WHERE LOWER(email) = $1",
      [normalizedEmail],
    );

    const available = result.rows.length === 0;

    res.status(200).json({
      available,
      message: available
        ? "E-mail disponível para cadastro."
        : "Este e-mail já está cadastrado no sistema.",
    });
  } catch (err) {
    console.error("Erro ao verificar e-mail:", err.message);
    res.status(500).json({ error: "Erro ao verificar e-mail." });
  }
});

// Rota para buscar todos os usuários com o cargo de "professor"
app.get(
  "/usuarios/professores",
  authenticateToken,
  authorizeRoles("Administrador Geral", "Administrador Pedagógico"),
  async (req, res) => {
    try {
      const professores = await db.query(
        "SELECT id, nome FROM usuarios WHERE LOWER(cargo::text) = 'professor' ORDER BY nome ASC",
      );
      res.status(200).json(professores.rows);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: "Erro ao buscar professores." });
    }
  },
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
  },
);

// (Removido) Rota duplicada de remoção de usuário
// A lógica consolidada e transacional da exclusão de usuário está definida
// mais abaixo neste arquivo. Manter apenas uma definição evita conflitos
// e garante limpeza de dependências antes de excluir o usuário.

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

// Rota para BUSCAR presenças de um aluno específico
app.get("/alunos/:id/presencas", async (req, res) => {
  const { id } = req.params;
  const { ano } = req.query;

  try {
    let query = `
      SELECT 
        p.data_aula,
        p.status_presenca,
        p.observacao,
        t.nome_turma,
        t.ano_letivo
      FROM presencas p
      JOIN turmas t ON p.turma_id = t.id
      WHERE p.aluno_id = $1
    `;

    const params = [id];

    if (ano) {
      query += ` AND t.ano_letivo = $2`;
      params.push(ano);
    }

    query += ` ORDER BY p.data_aula DESC`;

    const result = await db.query(query, params);

    res.status(200).json({ presencas: result.rows });
  } catch (err) {
    console.error("Erro ao buscar presenças do aluno:", err.message);
    res.status(500).json({ error: "Erro ao buscar presenças do aluno." });
  }
});

// Rota para LISTAR anexos de um aluno
app.get("/alunos/:id/anexos", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      SELECT id, aluno_id, nome_original, caminho_arquivo, tamanho, data_upload
      FROM aluno_anexos
      WHERE aluno_id = $1
      ORDER BY data_upload DESC
    `;

    const result = await db.query(query, [id]);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Erro ao buscar anexos do aluno:", err.message);
    res.status(500).json({ error: "Erro ao buscar anexos do aluno." });
  }
});

// POST - Adicionar novo anexo (para Firebase)
app.post("/alunos/anexos", authenticateToken, async (req, res) => {
  const { aluno_id, nome_arquivo, tipo_arquivo, caminho_firebase, tamanho } =
    req.body;

  if (!aluno_id || !nome_arquivo || !caminho_firebase) {
    return res.status(400).json({
      error: "aluno_id, nome_arquivo e caminho_firebase são obrigatórios",
    });
  }

  try {
    const result = await db.query(
      `INSERT INTO aluno_anexos 
       (aluno_id, nome_original, caminho_arquivo, tamanho)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [aluno_id, nome_arquivo, caminho_firebase, tamanho],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao adicionar anexo do aluno:", err.message);
    res.status(500).json({ error: "Erro ao adicionar anexo." });
  }
});

// Rota para FAZER UPLOAD de anexo
app.post(
  "/alunos/:id/anexos",
  authenticateToken,
  alunoAnexosUpload.single("arquivo"),
  async (req, res) => {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo foi enviado." });
    }

    try {
      const { originalname, filename, size, path: filePath } = req.file;
      const caminhoRelativo = `/uploads/anexos_aluno/${filename}`;

      const query = `
      INSERT INTO aluno_anexos (aluno_id, nome_original, caminho_arquivo, tamanho)
      VALUES ($1, $2, $3, $4)
      RETURNING id, aluno_id, nome_original, caminho_arquivo, tamanho, data_upload
    `;

      const result = await db.query(query, [
        id,
        originalname,
        caminhoRelativo,
        size,
      ]);

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error("Erro ao fazer upload do anexo:", err.message);

      // Tentar deletar o arquivo se falhou salvar no banco
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (e) {
          console.error("Erro ao deletar arquivo:", e);
        }
      }

      res.status(500).json({ error: "Erro ao fazer upload do anexo." });
    }
  },
);

// Rota para EXCLUIR anexo
app.delete(
  "/alunos/:alunoId/anexos/:anexoId",
  authenticateToken,
  async (req, res) => {
    const { alunoId, anexoId } = req.params;

    try {
      // Buscar o anexo para obter o caminho do arquivo
      const selectQuery = `
      SELECT caminho_arquivo
      FROM aluno_anexos
      WHERE id = $1 AND aluno_id = $2
    `;

      const selectResult = await db.query(selectQuery, [anexoId, alunoId]);

      if (selectResult.rows.length === 0) {
        return res.status(404).json({ error: "Anexo não encontrado." });
      }

      const caminhoArquivo = selectResult.rows[0].caminho_arquivo;

      // Deletar do banco de dados
      const deleteQuery = `
      DELETE FROM aluno_anexos
      WHERE id = $1 AND aluno_id = $2
    `;

      await db.query(deleteQuery, [anexoId, alunoId]);

      // Tentar deletar o arquivo físico
      if (caminhoArquivo) {
        const fullPath = path.join(__dirname, caminhoArquivo);
        try {
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        } catch (e) {
          console.error("Erro ao deletar arquivo físico:", e);
        }
      }

      res.status(200).json({ message: "Anexo excluído com sucesso." });
    } catch (err) {
      console.error("Erro ao excluir anexo:", err.message);
      res.status(500).json({ error: "Erro ao excluir anexo." });
    }
  },
);

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
    foto_perfil, // NOVO: caminho da foto no Firebase
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
      SET nome_completo = $1, data_nascimento = $2, informacoes_saude = $3, status_pagamento = $4, foto_perfil = $5
      WHERE id = $6
    `;
    await db.query(alunoUpdateQuery, [
      nome_aluno,
      data_nascimento,
      informacoes_saude,
      status_pagamento,
      foto_perfil,
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

    // Atualiza, insere ou remove a turma do aluno
    if (turma_id !== undefined) {
      if (turma_id === null) {
        // Se turma_id for null, remove o aluno de qualquer turma (define como "Sem Turma")
        console.log(
          `[UPDATE ALUNO] Removendo aluno ${id} de todas as turmas (Sem Turma)`,
        );
        await db.query("DELETE FROM turma_alunos WHERE aluno_id = $1", [id]);

        // Define o aluno como inativo quando removido de todas as turmas
        await db.query("UPDATE alunos SET status_aluno = FALSE WHERE id = $1", [
          id,
        ]);
      } else if (turma_id !== "") {
        // Se turma_id for fornecido, atualiza ou insere
        const turmaIdNum = Number(turma_id);
        console.log(
          `[UPDATE ALUNO] Processando turma_id: ${turmaIdNum} para aluno ${id}`,
        );

        // Ativa o aluno quando uma turma é atribuída
        await db.query("UPDATE alunos SET status_aluno = TRUE WHERE id = $1", [
          id,
        ]);

        // Verifica se já existe a relação ESPECÍFICA (aluno + turma)
        const rel = await db.query(
          "SELECT * FROM turma_alunos WHERE aluno_id = $1 AND turma_id = $2",
          [id, turmaIdNum],
        );

        if (rel.rows.length === 0) {
          console.log(
            `[UPDATE ALUNO] Relação aluno ${id} + turma ${turmaIdNum} não existe, processando...`,
          );
          // Só insere se a relação específica não existir
          // Primeiro, verifica se o aluno tem alguma matrícula anterior
          const existingRel = await db.query(
            "SELECT * FROM turma_alunos WHERE aluno_id = $1",
            [id],
          );

          if (existingRel.rows.length > 0) {
            // Se já existe uma relação (em outra turma), atualiza para a nova turma
            console.log(
              `[UPDATE ALUNO] Atualizando turma existente para aluno ${id}`,
            );
            await db.query(
              "UPDATE turma_alunos SET turma_id = $1 WHERE aluno_id = $2",
              [turmaIdNum, id],
            );
          } else {
            // Se não existe nenhuma relação, cria uma nova
            console.log(`[UPDATE ALUNO] Criando nova relação para aluno ${id}`);
            await db.query(
              "INSERT INTO turma_alunos (aluno_id, turma_id) VALUES ($1, $2)",
              [id, turmaIdNum],
            );
          }
        } else {
          console.log(
            `[UPDATE ALUNO] Relação aluno ${id} + turma ${turmaIdNum} já existe, ignorando`,
          );
        }
      }
      // Se turma_id for string vazia '', não faz nada (mantém como está)
    }

    await db.query("COMMIT"); // Confirma as alterações

    res.status(200).json({ message: "Dados atualizados com sucesso!" });
  } catch (err) {
    await db.query("ROLLBACK"); // Desfaz as alterações em caso de erro
    console.error("Erro ao atualizar dados:", err.message);
    console.error("Stack:", err.stack);

    // Mensagem de erro mais específica para constraint de unicidade
    if (
      err.code === "23505" &&
      err.constraint === "turma_alunos_turma_aluno_unique"
    ) {
      return res.status(409).json({
        error:
          "Este aluno já está matriculado nesta turma. Não é possível duplicar a matrícula.",
      });
    }

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
    // Normaliza período para valores aceitos pelo ENUM (ex: 'manha', 'tarde', 'noite', 'integral')
    const periodoNorm = normalizePeriodo(periodo);
    const allowedPeriodo = new Set(["manha", "tarde", "noite", "integral"]);
    if (!allowedPeriodo.has(periodoNorm)) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error:
          "Período inválido. Use um dos valores: manha, tarde, noite, integral.",
      });
    }

    // Valida o nível
    const allowedNivel = new Set(["jardim", "maternal", "fundamental"]);
    if (!allowedNivel.has(nivel)) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error:
          "Nível inválido. Use um dos valores: jardim, maternal, fundamental.",
      });
    }

    const newTurmaQuery = await client.query(
      "INSERT INTO turmas (nome_turma, ano_letivo, periodo, nivel) VALUES ($1, $2, $3, $4) RETURNING *",
      [nome_turma, ano_letivo, periodoNorm, nivel],
    );
    const novaTurma = newTurmaQuery.rows[0];

    // Associa os professores à turma, apenas se os IDs forem fornecidos no corpo da requisição
    if (professoresIds && professoresIds.length > 0) {
      const insertProfessoresPromises = professoresIds.map((professorId) => {
        return client.query(
          "INSERT INTO turma_professores (turma_id, usuario_id) VALUES ($1, $2)",
          [novaTurma.id, professorId],
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

// Rota para EXCLUIR todas as turmas de um ano específico
// IMPORTANTE: Esta rota DEVE vir ANTES da rota /turmas/:id
// para que o Express não interprete "ano" como um ID de turma
app.delete("/turmas/ano/:anoLetivo", authenticateToken, async (req, res) => {
  const { anoLetivo } = req.params;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Busca todas as turmas do ano
    const turmasResult = await client.query(
      "SELECT id FROM turmas WHERE ano_letivo = $1",
      [anoLetivo],
    );

    if (turmasResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ error: "Nenhuma turma encontrada para este ano." });
    }

    const turmaIds = turmasResult.rows.map((t) => t.id);
    const placeholders = turmaIds.map((_, i) => `$${i + 1}`).join(",");

    // 1) Coleta planejamentos das turmas
    const planRows = await client.query(
      `SELECT id_planejamento FROM planejamentos WHERE turma_id IN (${placeholders})`,
      turmaIds,
    );
    const planIds = planRows.rows.map((r) => r.id_planejamento);

    // 2) Buscar anexos Firebase dos planejamentos para excluir
    let caminhosFirebase = [];
    if (planIds.length > 0) {
      const planPlaceholders = planIds.map((_, i) => `$${i + 1}`).join(",");
      const anexosFirebaseResult = await client.query(
        `SELECT caminho_firebase FROM planejamento_anexos_firebase WHERE planejamento_id IN (${planPlaceholders})`,
        planIds,
      );
      caminhosFirebase = anexosFirebaseResult.rows.map(
        (row) => row.caminho_firebase,
      );
    }

    // 3) Excluir arquivos do Firebase
    console.log(
      "🗑️ [DELETE TURMAS ANO] Arquivos Firebase para excluir:",
      caminhosFirebase,
    );

    const { bucket } = require("./src/config/firebase");
    for (const caminho of caminhosFirebase) {
      if (caminho && caminho.startsWith("anexos_planejamento/")) {
        try {
          const file = bucket.file(caminho);
          const [exists] = await file.exists();
          if (exists) {
            await file.delete();
            console.log(
              `✅ [DELETE TURMAS ANO] Arquivo Firebase excluído: ${caminho}`,
            );
          } else {
            console.log(
              `⚠️ [DELETE TURMAS ANO] Arquivo Firebase não encontrado: ${caminho}`,
            );
          }
        } catch (error) {
          console.warn(
            `[DELETE TURMAS ANO] Erro ao excluir arquivo Firebase ${caminho}:`,
            error.message,
          );
        }
      }
    }

    // 4) Remove dependências dos planejamentos
    if (planIds.length > 0) {
      const planPlaceholders = planIds.map((_, i) => `$${i + 1}`).join(",");
      await client.query(
        `DELETE FROM planejamento_comentarios WHERE planejamento_id IN (${planPlaceholders})`,
        planIds,
      );
      await client.query(
        `DELETE FROM planejamento_anexos WHERE planejamento_id IN (${planPlaceholders})`,
        planIds,
      );
      await client.query(
        `DELETE FROM planejamento_anexos_firebase WHERE planejamento_id IN (${planPlaceholders})`,
        planIds,
      );
      await client.query(
        `DELETE FROM planejamentos WHERE id_planejamento IN (${planPlaceholders})`,
        planIds,
      );
    }

    // 5) Remove presenças
    await client.query(
      `DELETE FROM presencas WHERE turma_id IN (${placeholders})`,
      turmaIds,
    );

    // 6) Remove vínculos com professores e alunos
    await client.query(
      `DELETE FROM turma_professores WHERE turma_id IN (${placeholders})`,
      turmaIds,
    );

    // Coleta todos os alunos das turmas antes de deletar
    const alunosDasTurmas = await client.query(
      `SELECT DISTINCT aluno_id FROM turma_alunos WHERE turma_id IN (${placeholders})`,
      turmaIds,
    );

    await client.query(
      `DELETE FROM turma_alunos WHERE turma_id IN (${placeholders})`,
      turmaIds,
    );

    // Desativa alunos que não estão mais em nenhuma turma
    for (const row of alunosDasTurmas.rows) {
      const alunoId = row.aluno_id;
      const turmasRestantes = await client.query(
        "SELECT COUNT(*) as count FROM turma_alunos WHERE aluno_id = $1",
        [alunoId],
      );

      if (parseInt(turmasRestantes.rows[0].count) === 0) {
        await client.query(
          "UPDATE alunos SET status_aluno = FALSE WHERE id = $1",
          [alunoId],
        );
        console.log(
          `[EXCLUIR TURMAS ANO] Aluno ${alunoId} desativado (sem turmas)`,
        );
      }
    }

    // 7) Remove relatórios associados
    try {
      const rels = await client.query(
        `SELECT caminho_arquivo FROM relatorios WHERE tipo_destino = 'turma' AND destino_id IN (${placeholders})`,
        turmaIds,
      );

      if (rels.rows.length > 0) {
        await client.query(
          `DELETE FROM relatorios WHERE tipo_destino = 'turma' AND destino_id IN (${placeholders})`,
          turmaIds,
        );

        // Remove arquivos do disco
        for (const r of rels.rows) {
          try {
            if (r.caminho_arquivo) {
              fs.unlinkSync(path.resolve(__dirname, r.caminho_arquivo));
            }
          } catch (e) {
            console.warn(
              "[EXCLUIR TURMAS] Falha ao remover arquivo:",
              r.caminho_arquivo,
              e.message,
            );
          }
        }
      }
    } catch (e) {
      console.warn("[EXCLUIR TURMAS] Falha ao limpar relatórios:", e.message);
    }

    // 8) Remove todas as turmas do ano
    await client.query(`DELETE FROM turmas WHERE ano_letivo = $1`, [anoLetivo]);

    await client.query("COMMIT");
    res.status(200).json({
      message: `Todas as turmas do ano ${anoLetivo} foram excluídas com sucesso.`,
      deletedCount: turmasResult.rows.length,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Erro ao excluir turmas do ano:", err.message);
    res
      .status(500)
      .json({ error: "Erro interno ao excluir as turmas do ano." });
  } finally {
    client.release();
  }
});

// Rota para DELETAR uma turma individual
app.delete(
  "/turmas/:id",
  authenticateToken,
  authorizeRoles("Administrador Geral", "Administrador Pedagógico"),
  async (req, res) => {
    const { id } = req.params;
    const turmaId = parseInt(id, 10);
    if (!Number.isInteger(turmaId)) {
      return res.status(400).json({ error: "ID de turma inválido." });
    }

    const client = await db.connect();
    try {
      await client.query("BEGIN");

      // 0) Verifica existência
      const exists = await client.query("SELECT id FROM turmas WHERE id = $1", [
        turmaId,
      ]);
      if (exists.rowCount === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Turma não encontrada." });
      }

      // 1) Coleta planejamentos da turma
      const planRows = await client.query(
        "SELECT id_planejamento FROM planejamentos WHERE turma_id = $1",
        [turmaId],
      );
      const planIds = planRows.rows.map((r) => r.id_planejamento);

      // 2) Buscar anexos Firebase dos planejamentos para excluir
      let caminhosFirebase = [];
      if (planIds.length > 0) {
        const anexosFirebaseResult = await client.query(
          "SELECT caminho_firebase FROM planejamento_anexos_firebase WHERE planejamento_id = ANY($1::int[])",
          [planIds],
        );
        caminhosFirebase = anexosFirebaseResult.rows.map(
          (row) => row.caminho_firebase,
        );
      }

      // 3) Excluir arquivos do Firebase
      console.log(
        "🗑️ [DELETE TURMA] Arquivos Firebase para excluir:",
        caminhosFirebase,
      );

      const { bucket } = require("./src/config/firebase");
      for (const caminho of caminhosFirebase) {
        if (caminho && caminho.startsWith("anexos_planejamento/")) {
          try {
            const file = bucket.file(caminho);
            const [exists] = await file.exists();
            if (exists) {
              await file.delete();
              console.log(
                `✅ [DELETE TURMA] Arquivo Firebase excluído: ${caminho}`,
              );
            } else {
              console.log(
                `⚠️ [DELETE TURMA] Arquivo Firebase não encontrado: ${caminho}`,
              );
            }
          } catch (error) {
            console.warn(
              `[DELETE TURMA] Erro ao excluir arquivo Firebase ${caminho}:`,
              error.message,
            );
          }
        }
      }

      // 4) Remove dependências dos planejamentos (comentários, anexos, notificações via FK CASCADE)
      if (planIds.length > 0) {
        await client.query(
          "DELETE FROM planejamento_comentarios WHERE planejamento_id = ANY($1::int[])",
          [planIds],
        );
        await client.query(
          "DELETE FROM planejamento_anexos WHERE planejamento_id = ANY($1::int[])",
          [planIds],
        );
        await client.query(
          "DELETE FROM planejamento_anexos_firebase WHERE planejamento_id = ANY($1::int[])",
          [planIds],
        );
        await client.query(
          "DELETE FROM planejamentos WHERE id_planejamento = ANY($1::int[])",
          [planIds],
        );
      }

      // 5) Presenças da turma
      await client.query("DELETE FROM presencas WHERE turma_id = $1", [
        turmaId,
      ]);

      // 6) Vínculos com professores e alunos
      await client.query("DELETE FROM turma_professores WHERE turma_id = $1", [
        turmaId,
      ]);

      // Antes de deletar, pega os IDs dos alunos para verificar depois
      const alunosDaTurma = await client.query(
        "SELECT aluno_id FROM turma_alunos WHERE turma_id = $1",
        [turmaId],
      );

      await client.query("DELETE FROM turma_alunos WHERE turma_id = $1", [
        turmaId,
      ]);

      // Desativa alunos que não estão mais em nenhuma turma
      for (const row of alunosDaTurma.rows) {
        const alunoId = row.aluno_id;
        const turmasRestantes = await client.query(
          "SELECT COUNT(*) as count FROM turma_alunos WHERE aluno_id = $1",
          [alunoId],
        );

        if (parseInt(turmasRestantes.rows[0].count) === 0) {
          await client.query(
            "UPDATE alunos SET status_aluno = FALSE WHERE id = $1",
            [alunoId],
          );
          console.log(
            `[EXCLUIR TURMA] Aluno ${alunoId} desativado (sem turmas)`,
          );
        }
      }

      // 7) Relatórios associados à turma (opcional, se houver)
      try {
        const rels = await client.query(
          "SELECT id, caminho_arquivo FROM relatorios WHERE tipo_destino = 'turma' AND destino_id = $1",
          [turmaId],
        );
        if (rels.rowCount > 0) {
          await client.query(
            "DELETE FROM relatorios WHERE tipo_destino = 'turma' AND destino_id = $1",
            [turmaId],
          );
          // Remove arquivos do disco sem falhar a transação em caso de erro
          for (const r of rels.rows) {
            try {
              if (r.caminho_arquivo) {
                fs.unlinkSync(path.resolve(__dirname, r.caminho_arquivo));
              }
            } catch (e) {
              console.warn(
                "[EXCLUIR TURMA] Falha ao remover arquivo de relatório:",
                r.caminho_arquivo,
                e.message,
              );
            }
          }
        }
      } catch (e) {
        console.warn(
          "[EXCLUIR TURMA] Falha ao limpar relatórios da turma:",
          e.message,
        );
      }

      // 8) Finalmente, remove a turma
      await client.query("DELETE FROM turmas WHERE id = $1", [turmaId]);

      await client.query("COMMIT");
      res.status(200).json({ message: "Turma excluída com sucesso." });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Erro ao excluir turma:", err.message);
      res.status(500).json({ error: "Erro interno ao excluir a turma." });
    } finally {
      client.release();
    }
  },
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
      `Encontrados ${result.rows.length} alunos para a turma ${turmaId}`,
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Erro ao buscar alunos da turma:", err.message);
    console.error("Stack trace:", err.stack);
    res.status(500).json({ error: "Erro ao buscar alunos da turma." });
  }
});

// Rota para REMATRICULAR alunos de uma turma para outra
app.post(
  "/turmas/:turmaOrigemId/rematricula",
  authenticateToken,
  async (req, res) => {
    const { turmaOrigemId } = req.params;
    const { turmaDestinoId, alunosIds, novoAnoLetivo } = req.body;

    // Normalização e validação de tipos (evita erros de ANY com tipos incorretos)
    const turmaOrigemIdNum = Number.parseInt(turmaOrigemId, 10);
    const turmaDestinoIdNum = Number.parseInt(turmaDestinoId, 10);
    const alunosIdsNumRaw = Array.isArray(alunosIds) ? alunosIds : [];
    const alunosIdsNum = alunosIdsNumRaw
      .map((v) => Number.parseInt(v, 10))
      .filter((n) => Number.isInteger(n));

    if (!Number.isInteger(turmaDestinoIdNum)) {
      return res.status(400).json({ error: "turmaDestinoId inválido." });
    }
    if (!Number.isInteger(turmaOrigemIdNum)) {
      return res.status(400).json({ error: "turmaOrigemId inválido." });
    }
    if (!Array.isArray(alunosIds) || alunosIds.length === 0) {
      return res
        .status(400)
        .json({ error: "Lista de alunos (alunosIds) é obrigatória." });
    }
    if (alunosIdsNum.length !== alunosIds.length) {
      console.warn("[REMATRICULA] IDs de alunos inválidos serão ignorados", {
        recebidos: alunosIds,
        validos: alunosIdsNum,
      });
    }
    if (alunosIdsNum.length === 0) {
      return res
        .status(400)
        .json({ error: "Nenhum alunoId válido fornecido." });
    }

    const client = await db.connect();

    try {
      await client.query("BEGIN");

      // Verifica se a turma de destino existe
      const turmaCheck = await client.query(
        "SELECT id, nome_turma, ano_letivo FROM turmas WHERE id = $1",
        [turmaDestinoIdNum],
      );

      if (turmaCheck.rows.length === 0) {
        await client.query("ROLLBACK");
        return res
          .status(404)
          .json({ error: "Turma de destino não encontrada." });
      }

      const turmaDestino = turmaCheck.rows[0];

      console.log("[REMATRICULA] Iniciando processo", {
        turmaOrigemId: turmaOrigemIdNum,
        turmaDestinoId: turmaDestinoIdNum,
        qtdAlunos: alunosIdsNum.length,
        novoAnoLetivo: novoAnoLetivo ?? null,
      });

      // INSERT para duplicar alunos (mantém na turma original E adiciona na turma destino)
      // Ignora conflitos caso o aluno já esteja na turma destino
      const valuesClause = alunosIdsNum
        .map((_, i) => `($1, $${i + 2})`)
        .join(",");
      const params = [turmaDestinoIdNum, ...alunosIdsNum];
      const insertSQL = `
        INSERT INTO turma_alunos (turma_id, aluno_id)
        VALUES ${valuesClause}
        ON CONFLICT (turma_id, aluno_id) DO NOTHING
      `;
      console.log(
        "[REMATRICULA] INSERT turma_alunos (duplicar):",
        insertSQL,
        "params:",
        params,
      );
      await client.query(insertSQL, params);

      // Busca informações dos alunos rematriculados
      const alunosInfo = await client.query(
        "SELECT id, nome_completo FROM alunos WHERE id = ANY($1::int[])",
        [alunosIdsNum],
      );

      await client.query("COMMIT");

      res.status(200).json({
        message: `${alunosInfo.rows.length} aluno(s) rematriculado(s) com sucesso!`,
        alunosRematriculados: alunosInfo.rows,
        turmaDestino: turmaDestino.nome_turma,
        anoLetivo: turmaDestino.ano_letivo,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Erro ao rematricular alunos:", error);
      res.status(500).json({ error: "Erro ao processar rematrícula." });
    } finally {
      client.release();
    }
  },
);

// Rota para LISTAR alunos ATIVOS
app.get("/alunos/ativos", authenticateToken, async (req, res) => {
  try {
    const anoAtual = new Date().getFullYear();
    const allAlunos = await db.query(
      `SELECT
        a.id, a.nome_completo, a.data_nascimento, a.status_pagamento, a.status_aluno, a.foto_perfil,
        ta.turma_id,
        t.nome_turma,
        t.ano_letivo,
        t.nivel
       FROM alunos a
       LEFT JOIN turma_alunos ta ON a.id = ta.aluno_id
       LEFT JOIN turmas t ON ta.turma_id = t.id AND t.ano_letivo = $1
       WHERE a.status_aluno = TRUE
       ORDER BY nome_completo ASC`,
      [anoAtual],
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
    const anoAtual = new Date().getFullYear();
    const allAlunos = await db.query(
      `SELECT
        a.id, a.nome_completo, a.data_nascimento, a.status_pagamento, a.status_aluno, a.foto_perfil,
        ta.turma_id,
        t.nome_turma,
        t.ano_letivo,
        t.nivel
       FROM alunos a
       LEFT JOIN turma_alunos ta ON a.id = ta.aluno_id
       LEFT JOIN turmas t ON ta.turma_id = t.id AND t.ano_letivo = $1
       WHERE status_aluno = FALSE 
       ORDER BY nome_completo ASC`,
      [anoAtual],
    );
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
    // Verifica se o aluno está vinculado a alguma turma
    const turmaCheck = await db.query(
      "SELECT turma_id FROM turma_alunos WHERE aluno_id = $1",
      [id],
    );

    // Se o aluno não está em nenhuma turma, não permite ativar
    if (turmaCheck.rowCount === 0) {
      return res.status(400).json({
        error:
          "Não é possível ativar um aluno que não está vinculado a nenhuma turma.",
      });
    }

    const updatedAluno = await db.query(
      "UPDATE alunos SET status_aluno = TRUE WHERE id = $1 RETURNING *",
      [id],
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
      "UPDATE alunos SET status_aluno = TRUE WHERE id = $1 RETURNING status_aluno",
      [alunoId],
    );

    if (updateAlunoQuery.rowCount === 0) {
      throw new Error("Aluno não encontrado.");
    }

    // 2. Matricula o aluno na turma (com proteção contra duplicatas)
    const insertResult = await client.query(
      "INSERT INTO turma_alunos (aluno_id, turma_id) VALUES ($1, $2) ON CONFLICT (turma_id, aluno_id) DO NOTHING",
      [alunoId, turmaId],
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
app.delete("/alunos/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const alunoId = parseInt(id, 10);

  console.log("\n🗑️ [DELETE ALUNO] Tentando excluir aluno ID:", alunoId);
  console.log("👤 [DELETE ALUNO] Usuário:", req.user.email, req.user.cargo);

  if (!Number.isInteger(alunoId)) {
    return res.status(400).json({ error: "ID de aluno inválido." });
  }

  const client = await db.connect(); // Usar um cliente para a transação

  try {
    await client.query("BEGIN");

    // 1) Busca familia_id, foto_perfil e existência do aluno
    const alunoResult = await client.query(
      "SELECT id, familia_id, foto_perfil FROM alunos WHERE id = $1",
      [alunoId],
    );
    if (alunoResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Aluno não encontrado." });
    }
    const { familia_id, foto_perfil } = alunoResult.rows[0];

    // 2) Buscar caminhos dos anexos para excluir do Firebase
    console.log("🗑️ [DELETE ALUNO] Buscando anexos para excluir...");
    const anexosResult = await client.query(
      "SELECT caminho_arquivo FROM aluno_anexos WHERE aluno_id = $1",
      [alunoId],
    );
    const caminhosAnexos = anexosResult.rows.map((row) => row.caminho_arquivo);

    // 3) Excluir arquivos do Firebase (foto e anexos)
    const arquivosParaExcluir = [];
    if (foto_perfil && foto_perfil.startsWith("imagem_aluno/")) {
      arquivosParaExcluir.push(foto_perfil);
    }
    arquivosParaExcluir.push(
      ...caminhosAnexos.filter((c) => c && c.startsWith("anexos_aluno/")),
    );

    console.log(
      "🗑️ [DELETE ALUNO] Arquivos para excluir do Firebase:",
      arquivosParaExcluir,
    );

    // Excluir arquivos do Firebase usando o bucket diretamente
    const { bucket } = require("./src/config/firebase");
    for (const caminho of arquivosParaExcluir) {
      try {
        const file = bucket.file(caminho);
        const [exists] = await file.exists();
        if (exists) {
          await file.delete();
          console.log(`✅ [DELETE ALUNO] Arquivo excluído: ${caminho}`);
        } else {
          console.log(`⚠️ [DELETE ALUNO] Arquivo não encontrado: ${caminho}`);
        }
      } catch (error) {
        console.warn(
          `[DELETE ALUNO] Erro ao excluir arquivo ${caminho}:`,
          error.message,
        );
      }
    }

    // 4) Remove dependências que referenciam o aluno (ordem importante)
    console.log("🗑️ [DELETE ALUNO] Removendo presencas...");
    const presAntes = await client.query(
      "SELECT COUNT(*)::int as c FROM presencas WHERE aluno_id = $1",
      [alunoId],
    );
    const delPres = await client.query(
      "DELETE FROM presencas WHERE aluno_id = $1",
      [alunoId],
    );
    const presDepois = await client.query(
      "SELECT COUNT(*)::int as c FROM presencas WHERE aluno_id = $1",
      [alunoId],
    );

    console.log("🗑️ [DELETE ALUNO] Removendo turma_alunos...");
    let delTurmaAluno;
    try {
      delTurmaAluno = await client.query(
        "DELETE FROM turma_alunos WHERE aluno_id = $1",
        [alunoId],
      );
    } catch (fkErr) {
      console.error(
        "❌ [DELETE ALUNO] Falha ao deletar turma_alunos:",
        fkErr.message,
      );
      console.error("❌ [DELETE ALUNO] presencas antes/depois:", {
        antes: presAntes.rows[0].c,
        depois: presDepois.rows[0].c,
      });
      throw fkErr;
    }

    console.log("🗑️ [DELETE ALUNO] Removendo aluno_anexos...");
    const delAnexos = await client.query(
      "DELETE FROM aluno_anexos WHERE aluno_id = $1",
      [alunoId],
    );

    console.log("✅ [DELETE ALUNO] Removidos registros:", {
      presencas: delPres.rowCount,
      turma_alunos: delTurmaAluno.rowCount,
      aluno_anexos: delAnexos.rowCount,
    });

    // 5) Remove o aluno
    console.log("🗑️ [DELETE ALUNO] Removendo aluno...");
    await client.query("DELETE FROM alunos WHERE id = $1", [alunoId]);

    // 6) Se não houver mais alunos com essa família, remove a família
    if (familia_id) {
      console.log(
        "🗑️ [DELETE ALUNO] Verificando outros alunos da família",
        familia_id,
      );
      const outrosAlunos = await client.query(
        "SELECT COUNT(*)::int as total FROM alunos WHERE familia_id = $1",
        [familia_id],
      );
      const total = outrosAlunos.rows[0].total;
      console.log("🗑️ [DELETE ALUNO] Outros alunos na família:", total);

      if (total === 0) {
        console.log("🗑️ [DELETE ALUNO] Removendo família órfã:", familia_id);
        await client.query("DELETE FROM familias WHERE id = $1", [familia_id]);
      }
    }

    await client.query("COMMIT");
    console.log("✅ [DELETE ALUNO] Aluno excluído com sucesso!");
    res.status(200).json({
      message: "Aluno excluído com sucesso. Registros vinculados foram limpos.",
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ [DELETE ALUNO] Erro ao excluir aluno:", err.message);
    console.error("❌ [DELETE ALUNO] Stack:", err.stack);
    console.error("❌ [DELETE ALUNO] Código:", err.code);
    res.status(500).json({
      error: "Erro interno ao excluir o aluno.",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  } finally {
    client.release();
  }
});

// Nova rota: Atualiza automaticamente o status de alunos sem turma para inativo
app.patch(
  "/alunos/atualizar-status-sem-turma",
  authenticateToken,
  async (req, res) => {
    try {
      // Busca todos os alunos que não estão em nenhuma turma mas estão ativos
      const result = await db.query(`
      UPDATE alunos 
      SET status_aluno = FALSE 
      WHERE id NOT IN (SELECT DISTINCT aluno_id FROM turma_alunos)
      AND status_aluno = TRUE
      RETURNING id, nome_completo
    `);

      res.status(200).json({
        message: `${result.rowCount} aluno(s) foram desativados por não estarem vinculados a nenhuma turma.`,
        alunos: result.rows,
      });
    } catch (err) {
      console.error(
        "Erro ao atualizar status de alunos sem turma:",
        err.message,
      );
      res.status(500).json({ error: "Erro ao atualizar status dos alunos." });
    }
  },
);

// Rota para DELETAR um usuário
app.delete(
  "/usuarios/:id",
  authenticateToken,
  authorizeRoles("Administrador Geral"),
  async (req, res) => {
    const { id } = req.params;
    const userId = parseInt(id, 10);
    if (!Number.isInteger(userId)) {
      return res.status(400).json({ error: "ID de usuário inválido." });
    }

    const client = await db.connect();
    try {
      await client.query("BEGIN");

      // Verifica existência
      const exists = await client.query(
        "SELECT id FROM usuarios WHERE id = $1",
        [userId],
      );
      if (exists.rowCount === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      // Limpa dependências conhecidas que referenciam usuarios.id
      // 1) Comentários de planejamentos
      const delComentarios = await client.query(
        "DELETE FROM planejamento_comentarios WHERE usuario_id = $1",
        [userId],
      );

      // 2) Vínculo professor-turma
      const delTurmaProf = await client.query(
        "DELETE FROM turma_professores WHERE usuario_id = $1",
        [userId],
      );

      // 3) Notificações possuem ON DELETE CASCADE (ver SQL), mas não custa registrar
      const delNotifs = await client.query(
        "DELETE FROM notificacoes WHERE usuario_id = $1",
        [userId],
      );

      // 4) Planejamentos: se a coluna permitir NULL, remove referência ao usuário criador
      try {
        await client.query(
          "UPDATE planejamentos SET usuario_id = NULL WHERE usuario_id = $1",
          [userId],
        );
      } catch (e) {
        console.warn(
          "[REMOVER USUÁRIO] Não foi possível setar NULL em planejamentos.usuario_id (provável NOT NULL ou FK estrita). Prosseguindo.",
          e.message,
        );
      }

      console.log("[REMOVER USUÁRIO] Dependências removidas:", {
        comentarios: delComentarios.rowCount,
        turma_professores: delTurmaProf.rowCount,
        notificacoes: delNotifs.rowCount,
      });

      // Finalmente, remove o usuário
      await client.query("DELETE FROM usuarios WHERE id = $1", [userId]);

      await client.query("COMMIT");
      res.status(200).json({ message: "Usuário removido com sucesso." });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Erro ao remover usuário:", err.message);
      res.status(500).json({ error: "Erro interno ao remover o usuário." });
    } finally {
      client.release();
    }
  },
);

// --- Rotas de Suporte (para preencher os selects no frontend) ---
app.get("/alunos/ativos-simples", async (req, res) => {
  const result = await pool.query(
    "SELECT id, nome_completo FROM alunos WHERE status_aluno = TRUE ORDER BY nome_completo",
  );
  res.json(result.rows);
});

app.get("/turmas", async (req, res) => {
  const result = await pool.query(
    "SELECT id, nome_turma FROM turmas ORDER BY nome_turma",
  );
  res.json(result.rows);
});
// --- ROTA DE CADASTRO COMPLETO (ALUNO + FAMÍLIA) ---
app.post("/cadastrar-aluno-completo", async (req, res) => {
  console.log("👤 [CADASTRO ALUNO] Iniciando cadastro completo");
  console.log(
    "📝 [CADASTRO ALUNO] Dados recebidos:",
    JSON.stringify(req.body, null, 2),
  );

  const {
    nome_completo_aluno,
    data_nascimento,
    informacoes_saude,
    status_pagamento,
    nome_completo_responsavel,
    telefone,
    email,
    outro_telefone,
    cpf_responsavel,
  } = req.body;

  // Validação dos campos obrigatórios
  if (
    !nome_completo_aluno ||
    !data_nascimento ||
    !nome_completo_responsavel ||
    !telefone ||
    !email
  ) {
    console.log("⚠️ [CADASTRO ALUNO] Dados essenciais faltando");
    return res.status(400).json({
      error: "Dados essenciais do aluno ou do responsável estão faltando.",
    });
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");
    console.log("🔄 [CADASTRO ALUNO] Transação iniciada");

    // Passo 1: Cadastra a família (ou encontra, se já existir)
    let familiaId;
    let familiaExistente;

    // Prioriza busca por CPF se fornecido
    if (cpf_responsavel) {
      familiaExistente = await client.query(
        "SELECT id FROM familias WHERE cpf = $1",
        [cpf_responsavel],
      );
      console.log(
        "🔍 [CADASTRO ALUNO] Busca por CPF:",
        familiaExistente.rows.length > 0 ? "Encontrado" : "Não encontrado",
      );
    }

    // Se não encontrou por CPF, busca por email (fallback)
    if (!familiaExistente || familiaExistente.rows.length === 0) {
      familiaExistente = await client.query(
        "SELECT id FROM familias WHERE email = $1",
        [email],
      );
      console.log(
        "🔍 [CADASTRO ALUNO] Busca por email:",
        familiaExistente.rows.length > 0 ? "Encontrado" : "Não encontrado",
      );
    }

    if (familiaExistente && familiaExistente.rows.length > 0) {
      familiaId = familiaExistente.rows[0].id;
      console.log("✅ [CADASTRO ALUNO] Família existente ID:", familiaId);
    } else {
      // Cria nova família com CPF
      const novaFamilia = await client.query(
        "INSERT INTO familias (nome_completo, email, telefone, outro_telefone, cpf) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        [
          nome_completo_responsavel,
          email,
          telefone,
          outro_telefone,
          cpf_responsavel,
        ],
      );
      familiaId = novaFamilia.rows[0].id;
      console.log("✅ [CADASTRO ALUNO] Nova família criada ID:", familiaId);
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
      ],
    );

    const alunoId = novoAluno.rows[0].id_aluno;
    console.log("✅ [CADASTRO ALUNO] Aluno criado ID:", alunoId);

    // PASSO 3: Buscar todos os usuários para criar notificações
    console.log("🔔 [CADASTRO ALUNO] Buscando usuários para notificar...");
    const usuarios = await client.query("SELECT id FROM usuarios");
    console.log(
      "👥 [CADASTRO ALUNO] Usuários encontrados:",
      usuarios.rows.length,
    );

    // Criar notificação para cada usuário
    for (const usuario of usuarios.rows) {
      console.log(
        `📬 [CADASTRO ALUNO] Criando notificação para usuário ID: ${usuario.id}`,
      );
      await client.query(
        `INSERT INTO notificacoes (usuario_id, tipo, mensagem, planejamento_id, lida, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          usuario.id,
          "planejamento",
          `Novo aluno cadastrado: ${nome_completo_aluno}. Vincule-o a uma turma!`,
          null,
          false,
        ],
      );
    }
    console.log("✅ [CADASTRO ALUNO] Notificações criadas com sucesso!");

    await client.query("COMMIT");
    console.log("✅ [CADASTRO ALUNO] Transação finalizada com sucesso");

    res.status(201).json({
      message: "Aluno e responsável cadastrados com sucesso!",
      aluno: novoAluno.rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ [CADASTRO ALUNO] Erro no cadastro:", err.message);
    console.error("❌ [CADASTRO ALUNO] Stack:", err.stack);

    if (err.code === "23505") {
      // Verifica se é erro de CPF ou email duplicado
      if (err.constraint && err.constraint.includes("cpf")) {
        return res.status(409).json({ error: "Este CPF já está cadastrado." });
      }
      return res
        .status(409)
        .json({ error: "O e-mail do responsável já está cadastrado." });
    }
    res.status(500).json({ error: "Erro interno ao processar o cadastro." });
  } finally {
    client.release();
    console.log("🔓 [CADASTRO ALUNO] Conexão liberada");
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
      err.message,
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
      err.message,
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
          [turma_id, req.user.userId],
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
       WHERE turma_id = $1 AND ano = $2 AND mes = $3`,
        [turma_id, ano, mes],
      );

      let planejamento;

      if (findResult.rows.length > 0) {
        // 2a. Se encontrou, usa o planejamento existente
        planejamento = findResult.rows[0];
      } else {
        // 2b. Se não encontrou, cria um novo com status 'Pendente'
        const insertResult = await db.query(
          `INSERT INTO planejamentos (turma_id, ano, mes, status, usuario_id)
         VALUES ($1, $2, $3, 'Pendente', $4) RETURNING *`,
          [turma_id, ano, mes, usuario_id],
        );
        planejamento = insertResult.rows[0];
      }

      // 3. Busca o planejamento completo (com anexos e comentários) para retornar
      // Este código assume que você tem tabelas 'usuarios' e 'turmas' com as colunas corretas
      const fullPlanejamentoResult = await db.query(
        `SELECT
          p.id_planejamento, p.turma_id, p.ano, p.mes, p.status,
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
        [planejamento.id_planejamento],
      );

      res.status(200).json(fullPlanejamentoResult.rows[0]);
    } catch (err) {
      console.error("Erro em find-or-create planejamento:", err.message);
      res
        .status(500)
        .json({ error: "Erro interno ao processar planejamento." });
    }
  },
);
// Rota para DELETAR um responsável (família)
app.delete("/responsaveis/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Primeiro, verifica se a família tem alunos associados.
    // Isso previne a exclusão de um responsável se houver alunos ligados a ele.
    const checkAlunos = await pool.query(
      "SELECT COUNT(*) FROM alunos WHERE familia_id = $1",
      [id],
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
      [id],
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
        [turma_id, req.user.userId],
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
        [status, id],
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Planejamento não encontrado." });
      }

      // Buscar informações do planejamento e criar notificações
      const planejamentoInfo = await db.query(
        `SELECT p.ano, p.mes, p.usuario_id as criador_id, u.nome as avaliador_nome
         FROM planejamentos p
         JOIN usuarios u ON u.id = $2
         WHERE p.id_planejamento = $1`,
        [id, req.user.userId],
      );

      if (planejamentoInfo.rows.length > 0) {
        const { ano, mes, criador_id, avaliador_nome } =
          planejamentoInfo.rows[0];
        const descricao = `Planejamento ${mes}/${ano}`;
        const tipoNotificacao =
          status === "Aprovado" ? "aprovado" : "reprovado";
        const emoji = status === "Aprovado" ? "✅" : "❌";

        // Notificar o criador do planejamento
        await criarNotificacao(
          criador_id,
          tipoNotificacao,
          `${emoji} Seu ${descricao} foi ${status.toLowerCase()} por ${avaliador_nome}`,
          id,
        );

        // Buscar todos os professores da turma para notificar
        const professoresTurma = await db.query(
          `SELECT DISTINCT tp.usuario_id
           FROM turma_professores tp
           JOIN planejamentos p ON tp.turma_id = p.turma_id
           WHERE p.id_planejamento = $1 AND tp.usuario_id != $2`,
          [id, criador_id],
        );

        // Notificar cada professor da turma
        for (const prof of professoresTurma.rows) {
          await criarNotificacao(
            prof.usuario_id,
            tipoNotificacao,
            `${emoji} O ${descricao} foi ${status.toLowerCase()}`,
            id,
          );
        }
      }

      res.status(200).json(result.rows[0]);
    } catch (err) {
      console.error("Erro ao atualizar status do planejamento:", err.message);
      res.status(500).json({ error: "Erro interno ao atualizar o status." });
    }
  },
);

// Rota para BUSCAR um planejamento específico por ID com anexos e comentários
app.get("/planejamentos/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    // 1) Busca os dados básicos do planejamento
    const baseResult = await db.query(
      `SELECT p.*, t.nome_turma, t.periodo
       FROM planejamentos p
       LEFT JOIN turmas t ON p.turma_id = t.id
       WHERE p.id_planejamento = $1`,
      [id],
    );

    if (baseResult.rows.length === 0) {
      return res.status(404).json({ error: "Planejamento não encontrado." });
    }

    const planejamento = baseResult.rows[0];

    // 2) Anexos (com aliases compatíveis com o front)
    const anexosResult = await db.query(
      `SELECT 
         id_anexo,
         path_arquivo AS caminho_arquivo,
         nome_arquivo AS nome_original,
         data_upload
       FROM planejamento_anexos 
       WHERE planejamento_id = $1
       ORDER BY data_upload DESC`,
      [id],
    );

    // 3) Comentários (ordenados por data)
    const comentariosResult = await db.query(
      `SELECT 
         c.id_comentario AS id,
         c.usuario_id,
         u.nome AS nome_usuario,
         c.texto_comentario,
         c.data_comentario
       FROM planejamento_comentarios c
       LEFT JOIN usuarios u ON c.usuario_id = u.id
       WHERE c.planejamento_id = $1
       ORDER BY c.data_comentario ASC`,
      [id],
    );

    res.status(200).json({
      ...planejamento,
      anexos: anexosResult.rows || [],
      comentarios: comentariosResult.rows || [],
    });
  } catch (err) {
    console.error("Erro ao buscar planejamento:", err.message);
    if (err.stack) console.error(err.stack);
    res.status(500).json({ error: "Erro interno ao buscar planejamento." });
  }
});

// Rota para ADICIONAR um comentário
app.post(
  "/planejamentos/:id/comentarios",
  authenticateToken,
  async (req, res) => {
    const { id: planejamento_id } = req.params;
    const { texto_comentario } = req.body;
    const usuario_id = req.user.userId; // Usar o ID do usuário autenticado

    if (!texto_comentario) {
      return res.status(400).json({ error: "Comentário é obrigatório." });
    }

    try {
      const userRole = normalizeCargo(req.user.cargo);

      // Se for professor, verifica se o planejamento pertence a uma turma sua
      if (userRole === "professor") {
        const planejamentoCheck = await db.query(
          `SELECT p.turma_id FROM planejamentos p
           JOIN turma_professores tp ON p.turma_id = tp.turma_id
           WHERE p.id_planejamento = $1 AND tp.usuario_id = $2`,
          [planejamento_id, req.user.userId],
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
        [planejamento_id, usuario_id, texto_comentario],
      );

      // Buscar informações do planejamento e criar notificações
      const planejamentoInfo = await db.query(
        `SELECT p.ano, p.mes, p.usuario_id as criador_id, u.nome as comentarista_nome
         FROM planejamentos p
         JOIN usuarios u ON u.id = $2
         WHERE p.id_planejamento = $1`,
        [planejamento_id, usuario_id],
      );

      if (planejamentoInfo.rows.length > 0) {
        const { ano, mes, criador_id, comentarista_nome } =
          planejamentoInfo.rows[0];

        const descricao = `Planejamento ${mes}/${ano}`;

        // Notificar o criador do planejamento (se não for ele mesmo comentando)
        if (criador_id !== parseInt(usuario_id)) {
          await criarNotificacao(
            criador_id,
            "comentario",
            `${comentarista_nome} comentou no ${descricao}`,
            planejamento_id,
          );
        }

        // Buscar todos os professores da turma para notificar
        const professoresTurma = await db.query(
          `SELECT DISTINCT tp.usuario_id
           FROM turma_professores tp
           JOIN planejamentos p ON tp.turma_id = p.turma_id
           WHERE p.id_planejamento = $1 AND tp.usuario_id != $2`,
          [planejamento_id, usuario_id],
        );

        // Notificar cada professor da turma
        for (const prof of professoresTurma.rows) {
          await criarNotificacao(
            prof.usuario_id,
            "comentario",
            `${comentarista_nome} comentou no ${descricao}`,
            planejamento_id,
          );
        }
      }

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error("Erro ao adicionar comentário:", err.message);
      res.status(500).json({ error: "Erro interno ao adicionar comentário." });
    }
  },
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
        [id, req.user.userId],
      );

      if (comentarioCheck.rows.length === 0) {
        return res.status(403).json({
          error: "Você não tem permissão para deletar este comentário.",
        });
      }
    }

    // Buscar informações antes de deletar para criar notificações
    const comentarioInfo = await db.query(
      `SELECT pc.planejamento_id, pc.texto_comentario, p.ano, p.mes, 
              p.usuario_id as criador_id, u.nome as deletador_nome
       FROM planejamento_comentarios pc
       JOIN planejamentos p ON pc.planejamento_id = p.id_planejamento
       JOIN usuarios u ON u.id = $2
       WHERE pc.id_comentario = $1`,
      [id, req.user.userId],
    );

    // Executa o comando DELETE no banco de dados
    // 'RETURNING *' faz com que o comando retorne o comentário que foi deletado
    const result = await db.query(
      "DELETE FROM planejamento_comentarios WHERE id_comentario = $1 RETURNING *",
      [id],
    );

    // Verifica se alguma linha foi realmente deletada
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Comentário não encontrado." });
    }

    // Criar notificações sobre a exclusão do comentário
    if (comentarioInfo.rows.length > 0) {
      const { planejamento_id, ano, mes, criador_id, deletador_nome } =
        comentarioInfo.rows[0];
      const descricao = `Planejamento ${mes}/${ano}`;

      // Notificar o criador do planejamento (se não for ele mesmo deletando)
      if (criador_id !== req.user.userId) {
        await criarNotificacao(
          criador_id,
          "comentario_deletado",
          `🗑️ ${deletador_nome} deletou um comentário do ${descricao}`,
          planejamento_id,
        );
      }

      // Buscar todos os professores da turma para notificar
      const professoresTurma = await db.query(
        `SELECT DISTINCT tp.usuario_id
         FROM turma_professores tp
         JOIN planejamentos p ON tp.turma_id = p.turma_id
         WHERE p.id_planejamento = $1 AND tp.usuario_id != $2`,
        [planejamento_id, req.user.userId],
      );

      // Notificar cada professor da turma
      for (const prof of professoresTurma.rows) {
        await criarNotificacao(
          prof.usuario_id,
          "comentario_deletado",
          `🗑️ ${deletador_nome} deletou um comentário do ${descricao}`,
          planejamento_id,
        );
      }
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

// ========================================
// � ROTAS PARA ANEXOS DE PLANEJAMENTO (Firebase)
// ========================================

// GET - Listar anexos de um planejamento
app.get("/planejamentos/:id/anexos", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `SELECT id, planejamento_id, nome_arquivo, tipo_arquivo, 
              caminho_firebase, tamanho, criado_em
       FROM planejamento_anexos_firebase
       WHERE planejamento_id = $1
       ORDER BY criado_em DESC`,
      [id],
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Erro ao listar anexos:", err.message);
    res.status(500).json({ error: "Erro ao listar anexos." });
  }
});

// POST - Adicionar novo anexo
app.post("/planejamentos/anexos", authenticateToken, async (req, res) => {
  const {
    planejamento_id,
    nome_arquivo,
    tipo_arquivo,
    caminho_firebase,
    tamanho,
  } = req.body;

  if (!planejamento_id || !nome_arquivo || !caminho_firebase) {
    return res.status(400).json({
      error:
        "planejamento_id, nome_arquivo e caminho_firebase são obrigatórios",
    });
  }

  try {
    const result = await db.query(
      `INSERT INTO planejamento_anexos_firebase 
       (planejamento_id, nome_arquivo, tipo_arquivo, caminho_firebase, tamanho)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [planejamento_id, nome_arquivo, tipo_arquivo, caminho_firebase, tamanho],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao adicionar anexo:", err.message);
    res.status(500).json({ error: "Erro ao adicionar anexo." });
  }
});

// DELETE - Remover anexo
app.delete("/planejamentos/anexos/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    // Primeiro, buscar o caminho do arquivo para excluir do Firebase
    const selectResult = await db.query(
      `SELECT caminho_firebase FROM planejamento_anexos_firebase WHERE id = $1`,
      [id],
    );

    if (selectResult.rows.length === 0) {
      return res.status(404).json({ error: "Anexo não encontrado" });
    }

    const caminhoFirebase = selectResult.rows[0].caminho_firebase;

    // Excluir arquivo do Firebase se existir
    if (caminhoFirebase && caminhoFirebase.startsWith("anexos_planejamento/")) {
      try {
        const { bucket } = require("./src/config/firebase");
        const file = bucket.file(caminhoFirebase);
        const [exists] = await file.exists();
        if (exists) {
          await file.delete();
          console.log(
            `✅ [DELETE ANEXO PLANEJAMENTO] Arquivo Firebase excluído: ${caminhoFirebase}`,
          );
        } else {
          console.log(
            `⚠️ [DELETE ANEXO PLANEJAMENTO] Arquivo Firebase não encontrado: ${caminhoFirebase}`,
          );
        }
      } catch (error) {
        console.warn(
          `[DELETE ANEXO PLANEJAMENTO] Erro ao excluir arquivo Firebase ${caminhoFirebase}:`,
          error.message,
        );
      }
    }

    // Deletar do banco
    const result = await db.query(
      `DELETE FROM planejamento_anexos_firebase
       WHERE id = $1
       RETURNING *`,
      [id],
    );

    res.status(200).json({
      message: "Anexo excluído com sucesso",
      anexo: result.rows[0],
    });
  } catch (err) {
    console.error("Erro ao excluir anexo:", err.message);
    res.status(500).json({ error: "Erro ao excluir anexo." });
  }
});

// ========================================
// �📅 ROTAS PARA PLANEJAMENTO COM SEMANAS ISO
// ========================================

const {
  getInfoSemanaISO,
  getSemanasISOMes,
  isSemanaCompartilhada,
  getNomeMes,
  getInfoCompartilhamento,
} = require("./utils/semanaUtils");

/**
 * Rota para buscar todas as semanas ISO de um mês específico
 * GET /planejamentos/semanas-iso/:ano/:mes
 * Retorna as semanas que tocam o mês, incluindo semanas compartilhadas
 */
app.get(
  "/planejamentos/semanas-iso/:ano/:mes",
  authenticateToken,
  async (req, res) => {
    const { ano, mes } = req.params;
    const { turma_id } = req.query;

    console.log(
      `\n📅 [Semanas ISO] Buscando semanas para ${getNomeMes(
        parseInt(mes),
      )}/${ano}`,
    );
    console.log(`🏫 [Semanas ISO] Turma ID: ${turma_id || "Não especificada"}`);

    try {
      // Validação
      const anoInt = parseInt(ano);
      const mesInt = parseInt(mes);

      if (isNaN(anoInt) || isNaN(mesInt) || mesInt < 1 || mesInt > 12) {
        return res.status(400).json({ error: "Ano ou mês inválido" });
      }

      // Pega todas as semanas ISO que tocam este mês
      const semanasDoMes = getSemanasISOMes(anoInt, mesInt);
      console.log(
        `📊 [Semanas ISO] Encontradas ${semanasDoMes.length} semanas para o mês`,
      );

      // Se turma_id foi fornecida, busca planejamentos existentes
      let planejamentos = [];
      if (turma_id) {
        const planejamentosQuery = await pool.query(
          `SELECT 
          id_planejamento,
          turma_id,
          ano,
          semana_iso,
          ano_iso,
          mes,
          semana,
          status,
          data_criacao,
          usuario_id
        FROM planejamentos 
        WHERE turma_id = $1 
        AND ano_iso = $2 
        AND semana_iso = ANY($3::int[])
        ORDER BY semana_iso`,
          [turma_id, anoInt, semanasDoMes.map((s) => s.semanaISO)],
        );

        planejamentos = planejamentosQuery.rows;
        console.log(
          `📋 [Semanas ISO] Encontrados ${planejamentos.length} planejamentos existentes`,
        );
      }

      // Mapeia as semanas com os planejamentos
      const resultado = semanasDoMes.map((semanaInfo) => {
        const planejamento = planejamentos.find(
          (p) =>
            p.semana_iso === semanaInfo.semanaISO &&
            p.ano_iso === semanaInfo.anoISO,
        );

        const infoCompartilhamento = getInfoCompartilhamento(
          semanaInfo.anoISO,
          semanaInfo.semanaISO,
        );

        return {
          ...semanaInfo,
          planejamento: planejamento || null,
          compartilhamento: infoCompartilhamento,
          outrosMeses: semanaInfo.mesesAbrangidos.filter((m) => m !== mesInt),
          outrosMesesNomes: semanaInfo.mesesAbrangidos
            .filter((m) => m !== mesInt)
            .map((m) => getNomeMes(m)),
        };
      });

      console.log(
        `✅ [Semanas ISO] Retornando ${resultado.length} semanas com informações completas\n`,
      );
      res.json(resultado);
    } catch (err) {
      console.error("❌ [Semanas ISO] Erro ao buscar semanas:", err);
      res.status(500).json({ error: "Erro ao buscar semanas do mês" });
    }
  },
);

/**
 * Rota para buscar todos os meses de um ano
 * GET /planejamentos/meses/:ano
 * Retorna os 12 meses do ano com informações de planejamentos
 */
app.get("/planejamentos/meses/:ano", authenticateToken, async (req, res) => {
  const { ano } = req.params;
  const { turma_id } = req.query;

  console.log(`\n📅 [Meses] Buscando meses para o ano ${ano}`);
  console.log(`🏫 [Meses] Turma ID: ${turma_id || "Não especificada"}`);

  try {
    const anoInt = parseInt(ano);

    if (isNaN(anoInt)) {
      return res.status(400).json({ error: "Ano inválido" });
    }

    // Gera array com os 12 meses
    const meses = Array.from({ length: 12 }, (_, i) => ({
      ano: anoInt,
      mes: i + 1,
      nomeMes: getNomeMes(i + 1),
    }));

    console.log(`📊 [Meses] Gerados ${meses.length} meses`);

    // Se turma_id foi fornecida, busca planejamentos existentes
    let planejamentos = [];
    if (turma_id) {
      const planejamentosQuery = await pool.query(
        `SELECT 
            id_planejamento,
            turma_id,
            ano,
            mes,
            status,
            data_criacao,
            usuario_id
          FROM planejamentos 
          WHERE turma_id = $1 
          AND ano = $2
          ORDER BY mes`,
        [turma_id, anoInt],
      );

      planejamentos = planejamentosQuery.rows;
      console.log(
        `📋 [Meses] Encontrados ${planejamentos.length} planejamentos existentes`,
      );
    }

    // Mapeia os meses com os planejamentos
    const resultado = meses.map((mesInfo) => {
      const planejamento = planejamentos.find(
        (p) => p.mes === mesInfo.mes && p.ano === mesInfo.ano,
      );

      return {
        ...mesInfo,
        planejamento: planejamento || null,
      };
    });

    console.log(
      `✅ [Meses] Retornando ${resultado.length} meses com informações completas\n`,
    );
    res.json(resultado);
  } catch (err) {
    console.error("❌ [Meses] Erro ao buscar meses:", err);
    res.status(500).json({ error: "Erro ao buscar meses do ano" });
  }
});

/**
 * Rota para buscar informações de uma semana ISO específica
 * GET /planejamentos/semana-iso/:ano/:semana
 */
app.get(
  "/planejamentos/semana-iso/:ano/:semana",
  authenticateToken,
  async (req, res) => {
    const { ano, semana } = req.params;

    try {
      const anoInt = parseInt(ano);
      const semanaInt = parseInt(semana);

      if (
        isNaN(anoInt) ||
        isNaN(semanaInt) ||
        semanaInt < 1 ||
        semanaInt > 53
      ) {
        return res.status(400).json({ error: "Ano ou semana inválida" });
      }

      const infoSemana = getInfoSemanaISO(anoInt, semanaInt);
      const infoCompartilhamento = getInfoCompartilhamento(anoInt, semanaInt);

      res.json({
        ...infoSemana,
        compartilhamento: infoCompartilhamento,
      });
    } catch (err) {
      console.error("Erro ao buscar info da semana:", err);
      res.status(500).json({ error: "Erro ao buscar informações da semana" });
    }
  },
);

/**
 * Rota para criar ou atualizar planejamento usando semana ISO
 * POST /planejamentos/semana-iso
 */
app.post("/planejamentos/semana-iso", authenticateToken, async (req, res) => {
  const { turma_id, ano_iso, semana_iso } = req.body;

  console.log(
    `\n📝 [Criar/Unificar Planejamento ISO] Turma ${turma_id}, Semana ${semana_iso}/${ano_iso}`,
  );

  try {
    if (!turma_id || !ano_iso || !semana_iso) {
      return res.status(400).json({
        error: "turma_id, ano_iso e semana_iso são obrigatórios",
      });
    }

    const anoInt = parseInt(ano_iso);
    const semanaInt = parseInt(semana_iso);

    // 1) Infos ISO e mês de referência
    const infoSemana = getInfoSemanaISO(anoInt, semanaInt);
    const mesReferencia = infoSemana.mesesAbrangidos[0];
    const semanasMes = getSemanasISOMes(anoInt, mesReferencia);
    const idx = semanasMes.findIndex(
      (s) => s.semanaISO === semanaInt && s.anoISO === anoInt,
    );
    const semanaDoMes = idx >= 0 ? idx + 1 : 1; // posição dentro do mês

    // 2) Já existe por ISO? devolve ele
    const byIso = await pool.query(
      `SELECT * FROM planejamentos
       WHERE turma_id = $1 AND ano_iso = $2 AND semana_iso = $3
       LIMIT 1`,
      [turma_id, anoInt, semanaInt],
    );
    if (byIso.rowCount > 0) {
      const row = byIso.rows[0];
      console.log(`↩️ Já existia por ISO, ID: ${row.id_planejamento}`);
      return res.status(200).json({ ...row, info_semana: infoSemana });
    }

    // 3) Já existe por chave mensal? atualiza ISO nele e devolve
    const byMonthly = await pool.query(
      `SELECT * FROM planejamentos
       WHERE turma_id = $1 AND ano = $2 AND mes = $3 AND semana = $4
       LIMIT 1`,
      [turma_id, anoInt, mesReferencia, semanaDoMes],
    );
    if (byMonthly.rowCount > 0) {
      const id = byMonthly.rows[0].id_planejamento;
      const up = await pool.query(
        `UPDATE planejamentos
            SET ano_iso = $1, semana_iso = $2
          WHERE id_planejamento = $3
          RETURNING *`,
        [anoInt, semanaInt, id],
      );
      console.log(`🔗 Unificado com mensal, ID: ${id}`);
      return res.status(200).json({ ...up.rows[0], info_semana: infoSemana });
    }

    // 4) Não existe: cria protegendo pela chave mensal e já preenchendo ISO
    const insert = await pool.query(
      `INSERT INTO planejamentos (
         turma_id, ano, ano_iso, semana_iso, mes, semana, status, usuario_id, data_criacao
       ) VALUES ($1,$2,$3,$4,$5,$6,'Pendente',$7,NOW())
       ON CONFLICT (turma_id, ano, mes, semana)
       DO UPDATE SET ano_iso = EXCLUDED.ano_iso, semana_iso = EXCLUDED.semana_iso
       RETURNING *`,
      [
        turma_id,
        anoInt,
        anoInt,
        semanaInt,
        mesReferencia,
        semanaDoMes,
        req.user.userId,
      ],
    );
    const createdRow = insert.rows[0];
    console.log(
      `✅ Criado/Atualizado (upsert), ID: ${createdRow.id_planejamento}`,
    );

    // Criar notificação para administradores sobre novo planejamento
    try {
      console.log(
        "📬 [PLANEJAMENTO] Criando notificação para administradores...",
      );
      const admins = await pool.query(
        `SELECT id FROM usuarios WHERE cargo ILIKE '%admin%'`,
      );
      const turmaInfo = await pool.query(
        `SELECT nome_turma FROM turmas WHERE id = $1`,
        [turma_id],
      );
      const nomeTurma = turmaInfo.rows[0]?.nome_turma || `Turma #${turma_id}`;

      if (admins.rows.length > 0) {
        console.log(
          `📬 [PLANEJAMENTO] Encontrados ${admins.rows.length} administradores`,
        );
        for (const admin of admins.rows) {
          await pool.query(
            `INSERT INTO notificacoes (usuario_id, tipo, mensagem, planejamento_id, lida, created_at)
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [
              admin.id,
              "planejamento",
              `Novo planejamento criado: ${nomeTurma} - Semana ${semanaInt}/${anoInt}`,
              createdRow.id_planejamento,
              false,
            ],
          );
        }
        console.log("✅ [PLANEJAMENTO] Notificações criadas com sucesso!");
      }
    } catch (notifError) {
      console.error("⚠️ [PLANEJAMENTO] Erro ao criar notificação:", notifError);
      // Não bloqueia a criação do planejamento
    }

    // 201 se recém-criado; 200 se conflitou e atualizou. Não diferenciamos aqui; opcional.
    return res.status(201).json({ ...createdRow, info_semana: infoSemana });
  } catch (err) {
    console.error("❌ [Criar/Unificar Planejamento ISO] Erro:", err);
    if (err && err.code === "23505") {
      // Em caso de corrida: lê o existente por chave mensal e retorna
      try {
        const anoInt = parseInt(req.body.ano_iso);
        const semanaInt = parseInt(req.body.semana_iso);
        const infoSemana = getInfoSemanaISO(anoInt, semanaInt);
        const mesReferencia = infoSemana.mesesAbrangidos[0];
        const semanasMes = getSemanasISOMes(anoInt, mesReferencia);
        const idx = semanasMes.findIndex(
          (s) => s.semanaISO === semanaInt && s.anoISO === anoInt,
        );
        const semanaDoMes = idx >= 0 ? idx + 1 : 1;
        const sel = await pool.query(
          `SELECT * FROM planejamentos WHERE turma_id=$1 AND ano=$2 AND mes=$3 LIMIT 1`,
          [req.body.turma_id, anoInt, mesReferencia],
        );
        if (sel.rowCount > 0) {
          console.log(
            `↩️ Corrida resolvida, existente ID: ${sel.rows[0].id_planejamento}`,
          );
          return res
            .status(200)
            .json({ ...sel.rows[0], info_semana: infoSemana });
        }
      } catch (inner) {
        console.error("Falha no fallback 23505:", inner);
      }
    }
    res.status(500).json({ error: "Erro ao criar/encontrar planejamento" });
  }
});

// ========================================
// FIM DAS ROTAS DE SEMANAS ISO
// ========================================

/**
 * Rota para criar planejamento mensal
 * POST /planejamentos/mensal
 */
app.post("/planejamentos/mensal", authenticateToken, async (req, res) => {
  const { turma_id, ano, mes } = req.body;

  console.log(
    `\n📝 [Criar Planejamento Mensal] Turma ${turma_id}, Mês ${mes}/${ano}`,
  );

  try {
    if (!turma_id || !ano || !mes) {
      return res.status(400).json({
        error: "turma_id, ano e mes são obrigatórios",
      });
    }

    const anoInt = parseInt(ano);
    const mesInt = parseInt(mes);

    if (isNaN(anoInt) || isNaN(mesInt) || mesInt < 1 || mesInt > 12) {
      return res.status(400).json({ error: "Ano ou mês inválido" });
    }

    // Verifica se já existe
    const byMonthly = await pool.query(
      `SELECT * FROM planejamentos
       WHERE turma_id = $1 AND ano = $2 AND mes = $3
       LIMIT 1`,
      [turma_id, anoInt, mesInt],
    );

    if (byMonthly.rowCount > 0) {
      const row = byMonthly.rows[0];
      console.log(
        `↩️ Já existia planejamento mensal, ID: ${row.id_planejamento}`,
      );
      return res.status(200).json({ ...row, created: false });
    }

    // Cria novo planejamento mensal
    const insert = await pool.query(
      `INSERT INTO planejamentos (
         turma_id, ano, mes, status, usuario_id
       ) VALUES ($1,$2,$3,'Pendente',$4)
       RETURNING *`,
      [turma_id, anoInt, mesInt, req.user.userId],
    );

    const createdRow = insert.rows[0];
    console.log(
      `✅ Planejamento mensal criado, ID: ${createdRow.id_planejamento}`,
    );

    // Criar notificação para administradores sobre novo planejamento mensal
    try {
      console.log(
        "📬 [PLANEJAMENTO MENSAL] Criando notificação para administradores...",
      );
      const admins = await pool.query(
        `SELECT id FROM usuarios WHERE cargo ILIKE '%admin%'`,
      );
      const turmaInfo = await pool.query(
        `SELECT nome_turma FROM turmas WHERE id = $1`,
        [turma_id],
      );
      const nomeTurma = turmaInfo.rows[0]?.nome_turma || `Turma #${turma_id}`;
      const mesesNomes = [
        "Janeiro",
        "Fevereiro",
        "Março",
        "Abril",
        "Maio",
        "Junho",
        "Julho",
        "Agosto",
        "Setembro",
        "Outubro",
        "Novembro",
        "Dezembro",
      ];
      const nomeMes = mesesNomes[mesInt - 1] || `Mês ${mesInt}`;

      if (admins.rows.length > 0) {
        console.log(
          `📬 [PLANEJAMENTO MENSAL] Encontrados ${admins.rows.length} administradores`,
        );
        for (const admin of admins.rows) {
          await pool.query(
            `INSERT INTO notificacoes (usuario_id, tipo, mensagem, planejamento_id, lida, created_at)
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [
              admin.id,
              "planejamento",
              `Novo planejamento mensal criado: ${nomeTurma} - ${nomeMes}/${anoInt}`,
              createdRow.id_planejamento,
              false,
            ],
          );
        }
        console.log(
          "✅ [PLANEJAMENTO MENSAL] Notificações criadas com sucesso!",
        );
      }
    } catch (notifError) {
      console.error(
        "⚠️ [PLANEJAMENTO MENSAL] Erro ao criar notificação:",
        notifError,
      );
      // Não bloqueia a criação do planejamento
    }

    return res.status(201).json({ ...createdRow, created: true });
  } catch (err) {
    console.error("❌ [Criar Planejamento Mensal] Erro:", err);

    if (err && err.code === "23505") {
      // Conflito, busca o existente
      try {
        const sel = await pool.query(
          `SELECT * FROM planejamentos WHERE turma_id=$1 AND ano=$2 AND mes=$3 LIMIT 1`,
          [req.body.turma_id, parseInt(req.body.ano), parseInt(req.body.mes)],
        );
        if (sel.rowCount > 0) {
          console.log(
            `↩️ Conflito resolvido, existente ID: ${sel.rows[0].id_planejamento}`,
          );
          return res.status(200).json({ ...sel.rows[0], created: false });
        }
      } catch (inner) {
        console.error("Falha no fallback 23505:", inner);
      }
    }
    res.status(500).json({ error: "Erro ao criar planejamento mensal" });
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
          [planejamento_id, req.user.userId],
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

      // Buscar informações do planejamento e criar notificações
      const planejamentoInfo = await db.query(
        `SELECT p.ano, p.mes, p.usuario_id as criador_id, u.nome as uploader_nome
         FROM planejamentos p
         JOIN usuarios u ON u.id = $2
         WHERE p.id_planejamento = $1`,
        [planejamento_id, req.user.userId],
      );

      if (planejamentoInfo.rows.length > 0) {
        const { ano, mes, criador_id, uploader_nome } =
          planejamentoInfo.rows[0];
        const descricao = `Planejamento ${mes}/${ano}`;

        // Notificar o criador do planejamento (se não for ele mesmo fazendo upload)
        if (criador_id !== req.user.userId) {
          await criarNotificacao(
            criador_id,
            "anexo_adicionado",
            `${uploader_nome} adicionou o anexo "${nome_arquivo}" ao ${descricao}`,
            planejamento_id,
          );
        }

        // Buscar todos os professores da turma para notificar
        const professoresTurma = await db.query(
          `SELECT DISTINCT tp.usuario_id
           FROM turma_professores tp
           JOIN planejamentos p ON tp.turma_id = p.turma_id
           WHERE p.id_planejamento = $1 AND tp.usuario_id != $2`,
          [planejamento_id, req.user.userId],
        );

        // Notificar cada professor da turma
        for (const prof of professoresTurma.rows) {
          await criarNotificacao(
            prof.usuario_id,
            "anexo_adicionado",
            `${uploader_nome} adicionou um anexo ao ${descricao}`,
            planejamento_id,
          );
        }
      }

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error("Erro ao salvar anexo:", err.message);
      res.status(500).json({ error: "Erro interno ao salvar anexo." });
    }
  },
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
        [anexo_id, req.user.userId],
      );

      if (anexoCheck.rows.length === 0) {
        return res.status(403).json({
          error: "Você não tem permissão para deletar este anexo.",
        });
      }
    }

    // 1. Primeiro, busca o registro no banco para saber o caminho do arquivo e informações do planejamento
    const findResult = await db.query(
      `SELECT pa.path_arquivo, pa.nome_arquivo, pa.planejamento_id,
              p.ano, p.mes, p.usuario_id as criador_id,
              u.nome as deletador_nome
       FROM planejamento_anexos pa
       JOIN planejamentos p ON pa.planejamento_id = p.id_planejamento
       JOIN usuarios u ON u.id = $2
       WHERE pa.id_anexo = $1`,
      [anexo_id, req.user.userId],
    );

    if (findResult.rowCount === 0) {
      return res.status(404).json({ error: "Anexo não encontrado." });
    }

    const {
      path_arquivo: pathDoArquivo,
      nome_arquivo,
      planejamento_id,
      ano,
      mes,
      criador_id,
      deletador_nome,
    } = findResult.rows[0];

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

    // 4. Criar notificações sobre a exclusão do anexo
    const descricao = `Planejamento ${mes}/${ano}`;

    // Notificar o criador do planejamento (se não for ele mesmo deletando)
    if (criador_id !== req.user.userId) {
      await criarNotificacao(
        criador_id,
        "anexo_deletado",
        `🗑️ ${deletador_nome} deletou o anexo "${nome_arquivo}" do ${descricao}`,
        planejamento_id,
      );
    }

    // Buscar todos os professores da turma para notificar
    const professoresTurma = await db.query(
      `SELECT DISTINCT tp.usuario_id
       FROM turma_professores tp
       JOIN planejamentos p ON tp.turma_id = p.turma_id
       WHERE p.id_planejamento = $1 AND tp.usuario_id != $2`,
      [planejamento_id, req.user.userId],
    );

    // Notificar cada professor da turma
    for (const prof of professoresTurma.rows) {
      await criarNotificacao(
        prof.usuario_id,
        "anexo_deletado",
        `🗑️ ${deletador_nome} deletou um anexo do ${descricao}`,
        planejamento_id,
      );
    }

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
      req.params.id,
    );
    console.log("Usuário autenticado:", req.user);

    const { id } = req.params;
    const client = await db.connect();

    try {
      await client.query("BEGIN");

      // 1) Buscar anexos locais e Firebase para excluir arquivos
      const anexosLocaisResult = await client.query(
        "SELECT id_anexo, path_arquivo FROM planejamento_anexos WHERE planejamento_id = $1",
        [id],
      );

      const anexosFirebaseResult = await client.query(
        "SELECT id, caminho_firebase FROM planejamento_anexos_firebase WHERE planejamento_id = $1",
        [id],
      );

      const caminhosFirebase = anexosFirebaseResult.rows.map(
        (row) => row.caminho_firebase,
      );

      // 2) Excluir arquivos do Firebase
      console.log(
        "🗑️ [DELETE PLANEJAMENTO] Arquivos Firebase para excluir:",
        caminhosFirebase,
      );

      const { bucket } = require("./src/config/firebase");
      for (const caminho of caminhosFirebase) {
        if (caminho && caminho.startsWith("anexos_planejamento/")) {
          try {
            const file = bucket.file(caminho);
            const [exists] = await file.exists();
            if (exists) {
              await file.delete();
              console.log(
                `✅ [DELETE PLANEJAMENTO] Arquivo Firebase excluído: ${caminho}`,
              );
            } else {
              console.log(
                `⚠️ [DELETE PLANEJAMENTO] Arquivo Firebase não encontrado: ${caminho}`,
              );
            }
          } catch (error) {
            console.warn(
              `[DELETE PLANEJAMENTO] Erro ao excluir arquivo Firebase ${caminho}:`,
              error.message,
            );
          }
        }
      }

      // 3) Deleta comentários do planejamento
      await client.query(
        "DELETE FROM planejamento_comentarios WHERE planejamento_id = $1",
        [id],
      );

      // 4) Deleta anexos locais do planejamento
      await client.query(
        "DELETE FROM planejamento_anexos WHERE planejamento_id = $1",
        [id],
      );

      // 5) Deleta anexos Firebase do planejamento
      await client.query(
        "DELETE FROM planejamento_anexos_firebase WHERE planejamento_id = $1",
        [id],
      );

      // 6) Remove arquivos físicos dos anexos locais
      for (const row of anexosLocaisResult.rows) {
        const filePath = row.path_arquivo;
        if (filePath) {
          try {
            fs.unlinkSync(filePath);
          } catch (err) {
            console.error(
              "Erro ao remover arquivo local de anexo:",
              filePath,
              err.message,
            );
          }
        }
      }

      // 7) Deleta o planejamento em si
      const delPlan = await client.query(
        "DELETE FROM planejamentos WHERE id_planejamento = $1 RETURNING turma_id, ano, mes",
        [id],
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
  },
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
        "SELECT foto_perfil FROM usuarios WHERE foto_perfil IS NOT NULL",
      );
      const referencedUserPhotos = new Set(
        dbUserPhotos.rows.map((row) => row.foto_perfil),
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
              error.message,
            );
          }
        }
      }
    }

    // Limpeza de fotos de alunos
    const alunoUploadsDir = path.join(__dirname, "uploads", "aluno_image");
    if (fs.existsSync(alunoUploadsDir)) {
      const dbAlunoPhotos = await db.query(
        "SELECT foto_perfil FROM alunos WHERE foto_perfil IS NOT NULL",
      );
      const referencedAlunoPhotos = new Set(
        dbAlunoPhotos.rows.map((row) => row.foto_perfil),
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
              error.message,
            );
          }
        }
      }
    }

    console.log(
      `Limpeza concluída: ${totalRemovedCount} fotos órfãs removidas`,
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
      err.message,
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
        [userId],
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

      console.log("[upload-profile-photo] Foto salva no banco:", {
        userId: userId,
        imageUrl: imageUrl,
        savedData: result.rows[0],
      });

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
  },
);

// Rota para remover a foto de perfil
app.delete("/remove-profile-photo", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Busca a foto atual do usuário
    const findResult = await db.query(
      "SELECT foto_perfil FROM usuarios WHERE id = $1",
      [userId],
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

// Rota para atualizar foto de perfil do usuário (usando Firebase)
app.put("/usuario/atualizar-foto", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { foto_perfil } = req.body;

    // Validação básica
    if (foto_perfil !== null && typeof foto_perfil !== "string") {
      return res
        .status(400)
        .json({ error: "foto_perfil deve ser uma string ou null." });
    }

    // Atualiza a foto do usuário no banco de dados
    const updateQuery = `
      UPDATE usuarios 
      SET foto_perfil = $1 
      WHERE id = $2 
      RETURNING id, nome, email, cargo, foto_perfil
    `;

    const result = await db.query(updateQuery, [foto_perfil, userId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    console.log("[atualizar-foto] Foto atualizada no banco:", {
      userId: userId,
      foto_perfil: foto_perfil,
      updatedUser: result.rows[0],
    });

    res.json({
      message: "Foto de perfil atualizada com sucesso!",
      user: result.rows[0],
    });
  } catch (err) {
    console.error("Erro ao atualizar foto de perfil:", err.message);
    res.status(500).json({ error: "Erro interno ao atualizar a foto." });
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
  },
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
        [alunoId],
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
  },
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
        [alunoId],
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
  },
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
              `Linha ${index + 2}: Nome, email e telefone são obrigatórios`,
            );
            continue;
          }

          // Verificar se o email já existe
          const existingEmail = await client.query(
            "SELECT id FROM familias WHERE email = $1",
            [email],
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
  },
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
              (data_nascimento - 25569) * 86400 * 1000,
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
                ", ",
              )}`,
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
              [sanitizedCpf],
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
                }).`,
              );
              continue; // Pula para a próxima linha
            }
          }

          // 2. Tenta encontrar a família por CPF (se houver) ou por email
          let existingFamiliaResult;
          if (sanitizedCpf) {
            existingFamiliaResult = await client.query(
              `SELECT id FROM familias WHERE cpf = $1`,
              [sanitizedCpf],
            );
          } else {
            existingFamiliaResult = await client.query(
              `SELECT id FROM familias WHERE email = $1`,
              [sanitizedEmail],
            );
          }

          if (existingFamiliaResult.rows.length > 0) {
            // Família encontrada, usa o ID existente
            familia_id = existingFamiliaResult.rows[0].id;
          } else {
            // Se o email já estiver em uso (mas o CPF não estava), informa o erro.
            const emailCheck = await client.query(
              `SELECT id FROM familias WHERE email = $1`,
              [sanitizedEmail],
            );
            if (emailCheck.rows.length > 0) {
              errors.push(
                `Linha ${
                  index + 2
                }: O email '${sanitizedEmail}' já está em uso, mas o CPF não corresponde a um registro existente.`,
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
            `Linha ${index + 2}: Erro no banco de dados - ${rowError.message}`,
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
  },
);

// ==============================
// WEBHOOK PARA GOOGLE FORMS
// ==============================

// Rota principal para testar se o servidor está no ar
app.get("/", (req, res) => {
  res.send(
    "Servidor no ar! Pronto para receber dados do Google Forms e gerenciar a escola.",
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
              "0",
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
              dateError.message,
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
        "⚠️ Dados insuficientes para salvar no banco (nome obrigatório)",
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
      `webhook_${new Date().toISOString().split("T")[0]}.json`,
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
        `webhook_${new Date().toISOString().split("T")[0]}.json`,
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

// ============================== NOTIFICAÇÕES ==============================

// GET /notificacoes - Listar notificações do usuário logado
app.get("/notificacoes", authenticateToken, async (req, res) => {
  console.log("🔔 [NOTIFICAÇÕES] Requisição recebida");
  console.log("👤 [NOTIFICAÇÕES] req.user:", req.user);
  console.log("👤 [NOTIFICAÇÕES] Usuário ID:", req.user?.userId);

  try {
    const usuarioId = req.user.userId; // CORRIGIDO: era usuarioId, agora é userId

    if (!usuarioId) {
      console.log("⚠️ [NOTIFICAÇÕES] Usuário não autenticado");
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const result = await db.query(
      `SELECT 
        n.id,
        n.usuario_id,
        n.tipo,
        n.mensagem,
        n.planejamento_id,
        n.lida,
        n.created_at
      FROM notificacoes n
      WHERE n.usuario_id = $1
      ORDER BY n.created_at DESC
      LIMIT 50`,
      [usuarioId],
    );

    console.log("📊 [NOTIFICAÇÕES] Total encontradas:", result.rows.length);
    console.log(
      "📋 [NOTIFICAÇÕES] Tipos encontrados:",
      result.rows.map((n) => n.tipo).join(", "),
    );
    console.log(
      "📄 [NOTIFICAÇÕES] Primeira notificação:",
      result.rows[0] || "Nenhuma",
    );

    res.json(result.rows);
  } catch (error) {
    console.error("❌ [NOTIFICAÇÕES] Erro ao buscar:", error);
    res.status(500).json({
      error: "Erro ao buscar notificações",
      details: error.message,
    });
  }
});

// GET /notificacoes/nao-lidas/count - Contar notificações não lidas
app.get(
  "/notificacoes/nao-lidas/count",
  authenticateToken,
  async (req, res) => {
    try {
      const usuarioId = req.user.userId; // CORRIGIDO: era usuarioId, agora é userId

      if (!usuarioId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const result = await db.query(
        "SELECT COUNT(*) as count FROM notificacoes WHERE usuario_id = $1 AND lida = FALSE",
        [usuarioId],
      );

      res.json({ count: parseInt(result.rows[0].count) });
    } catch (error) {
      console.error("Erro ao contar notificações:", error);
      res.status(500).json({
        error: "Erro ao contar notificações",
        details: error.message,
      });
    }
  },
);

// PATCH /notificacoes/:id/ler - Marcar notificação como lida
app.patch("/notificacoes/:id/ler", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.user.userId; // CORRIGIDO: era usuarioId, agora é userId

    if (!usuarioId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const result = await db.query(
      "UPDATE notificacoes SET lida = TRUE WHERE id = $1 AND usuario_id = $2 RETURNING *",
      [id, usuarioId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Notificação não encontrada" });
    }

    res.json({
      message: "Notificação marcada como lida",
      notificacao: result.rows[0],
    });
  } catch (error) {
    console.error("Erro ao marcar notificação como lida:", error);
    res.status(500).json({
      error: "Erro ao marcar notificação",
      details: error.message,
    });
  }
});

// PATCH /notificacoes/ler-todas - Marcar todas as notificações como lidas
// PATCH /notificacoes/ler-todas - Marcar todas as notificações como lidas
app.patch("/notificacoes/ler-todas", authenticateToken, async (req, res) => {
  try {
    const usuarioId = req.user.userId; // CORRIGIDO: era usuarioId, agora é userId

    if (!usuarioId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const result = await db.query(
      "UPDATE notificacoes SET lida = TRUE WHERE usuario_id = $1 AND lida = FALSE RETURNING id",
      [usuarioId],
    );

    res.json({
      message: "Todas as notificações marcadas como lidas",
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Erro ao marcar todas como lidas:", error);
    res.status(500).json({
      error: "Erro ao marcar notificações",
      details: error.message,
    });
  }
});

// DELETE /notificacoes/:id - Deletar notificação
app.delete("/notificacoes/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.user.userId; // CORRIGIDO: era usuarioId, agora é userId

    if (!usuarioId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const result = await db.query(
      "DELETE FROM notificacoes WHERE id = $1 AND usuario_id = $2 RETURNING *",
      [id, usuarioId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Notificação não encontrada" });
    }

    res.json({ message: "Notificação deletada com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar notificação:", error);
    res.status(500).json({
      error: "Erro ao deletar notificação",
      details: error.message,
    });
  }
});

// Função auxiliar para criar notificações
async function criarNotificacao(
  usuarioId,
  tipo,
  mensagem,
  planejamentoId = null,
) {
  console.log("➕ [CRIAR NOTIFICAÇÃO] Tentando criar notificação");
  console.log("   - usuarioId:", usuarioId);
  console.log("   - tipo:", tipo);
  console.log("   - mensagem:", mensagem);
  console.log("   - planejamentoId:", planejamentoId);

  try {
    const result = await db.query(
      `INSERT INTO notificacoes (usuario_id, tipo, mensagem, planejamento_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [usuarioId, tipo, mensagem, planejamentoId],
    );
    console.log(
      "✅ [CRIAR NOTIFICAÇÃO] Notificação criada com sucesso:",
      result.rows[0],
    );
    return result.rows[0];
  } catch (error) {
    console.error("❌ [CRIAR NOTIFICAÇÃO] Erro ao criar notificação:", error);
    console.error("   - Detalhes:", error.message);
    throw error;
  }
}

// ==============================

// Inicia o servidor para ouvir na porta definida
app.listen(port, () => {
  console.log(`🚀 Servidor backend rodando em http://localhost:${port}`);
  console.log(`📋 Webhook disponível em: http://localhost:${port}/webhook`);
  console.log(`📊 Logs dos webhooks em: http://localhost:${port}/webhook/logs`);
});
