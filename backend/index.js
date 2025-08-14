// Importa as bibliotecas necessárias
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const db = require("./db"); // Importa nossa configuração do banco de dados

// Inicializa o aplicativo Express
const app = express();
const port = 3001; // Define a porta em que o servidor vai rodar

// Middlewares
app.use(cors()); // Habilita o CORS para permitir requisições do frontend
app.use(express.json()); // Permite que o servidor entenda JSON no corpo das requisições

// --- ROTAS DE AUTENTICAÇÃO ---

// Rota para REGISTRAR um novo usuário (agora com suporte a nome e cargos)
app.post("/register", async (req, res) => {
  // Agora esperamos também o 'nome' e o 'cargo'
  const { nome, email, password, cargo } = req.body;

  // Adicionamos 'nome' à validação
  if (!nome || !email || !password) {
    return res
      .status(400)
      .json({ error: "Nome, email e senha são obrigatórios." });
  }

  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    let queryText;
    let queryParams;

    // Se um cargo for fornecido, inclua-o na inserção.
    if (cargo) {
      const validRoles = [
        "administrador geral",
        "administrador pedagógico",
        "professor",
      ];
      if (!validRoles.includes(cargo)) {
        return res.status(400).json({ error: "Cargo inválido." });
      }
      queryText =
        "INSERT INTO usuarios (nome, email, senha, cargo) VALUES ($1, $2, $3, $4) RETURNING id, nome, email, cargo";
      queryParams = [nome, email, hashedPassword, cargo];
    } else {
      // Se nenhum cargo for fornecido, o valor DEFAULT do banco será usado.
      queryText =
        "INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING id, nome, email, cargo";
      queryParams = [nome, email, hashedPassword];
    }

    const newUser = await db.query(queryText, queryParams);

    res.status(201).json(newUser.rows[0]);
  } catch (err) {
    console.error(err.message);
    if (err.code === "23505") {
      return res.status(409).json({ error: "Este e-mail já está cadastrado." });
    }
    if (err.code === "23514" || err.code === "22P02") {
      return res.status(400).json({ error: "Cargo inválido." });
    }
    res.status(500).json({ error: "Erro ao registrar usuário." });
  }
});

// Rota para LOGIN (agora retorna o nome e o cargo do usuário)
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

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

    // Se a senha estiver correta, envia uma resposta de sucesso com mais dados do usuário
    res.status(200).json({
      message: "Login bem-sucedido!",
      userId: user.id,
      nome: user.nome, // Adicionamos o nome na resposta!
      cargo: user.cargo,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Erro no servidor." });
  }
});

// Inicia o servidor para ouvir na porta definida
app.listen(port, () => {
  console.log(`Servidor backend rodando em http://localhost:3001`);
});
