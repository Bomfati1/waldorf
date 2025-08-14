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
app.post("/register", async (req, res) => {
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
      return res.status(409).json({ error: "Este e-mail já está cadastrado." });
    }
    res.status(500).json({ error: "Erro ao registrar usuário." });
  }
});
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
                f.id as familia_id,
                f.nome_completo as nome_responsavel,
                f.email,
                f.telefone,
                f.outro_telefone
            FROM alunos a
            JOIN familias f ON a.familia_id = f.id
            WHERE a.id = $1
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
    // Usamos uma transação para garantir que ambas as tabelas sejam atualizadas com sucesso
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

    await db.query("COMMIT"); // Confirma as alterações

    res.status(200).json({ message: "Dados atualizados com sucesso!" });
  } catch (err) {
    await db.query("ROLLBACK"); // Desfaz as alterações em caso de erro
    console.error("Erro ao atualizar dados:", err.message);
    res.status(500).json({ error: "Erro interno ao atualizar os dados." });
  }
});
// Rota para buscar todos os usuários com o cargo de "professor"
app.get("/usuarios/professores", async (req, res) => {
  try {
    const professores = await db.query(
      "SELECT id, nome FROM usuarios WHERE cargo = 'professor' ORDER BY nome ASC"
    );
    res.status(200).json(professores.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Erro ao buscar professores." });
  }
});

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
    res.status(200).json({
      message: "Login bem-sucedido!",
      userId: user.id,
      nome: user.nome,
      cargo: user.cargo,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Erro no servidor." });
  }
});

// --- ROTAS PARA GERENCIAMENTO DE TURMAS ---
// Rota para CRIAR uma nova turma e associar professores
app.post("/turmas", async (req, res) => {
  const { nome_turma, ano_letivo, periodo, nivel_ensino, professoresIds } =
    req.body;

  if (
    !nome_turma ||
    !ano_letivo ||
    !periodo ||
    nivel_ensino == null ||
    !professoresIds ||
    professoresIds.length === 0
  ) {
    return res.status(400).json({
      error:
        "Todos os campos, incluindo ao menos um professor, são obrigatórios.",
    });
  }
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const newTurmaQuery = await client.query(
      "INSERT INTO turmas (nome_turma, ano_letivo, periodo, nivel_ensino) VALUES ($1, $2, $3, $4) RETURNING *",
      [nome_turma, ano_letivo, periodo, nivel_ensino]
    );
    const novaTurma = newTurmaQuery.rows[0];

    const insertProfessoresPromises = professoresIds.map((professorId) => {
      return client.query(
        "INSERT INTO turma_professores (turma_id, usuario_id) VALUES ($1, $2)",
        [novaTurma.id, professorId]
      );
    });
    await Promise.all(insertProfessoresPromises);

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

// Rota para LISTAR alunos ATIVOS
app.get("/alunos/ativos", async (req, res) => {
  try {
    const allAlunos = await db.query(
      `SELECT * FROM alunos WHERE status_aluno = TRUE ORDER BY nome_completo ASC`
    );
    res.status(200).json(allAlunos.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Erro ao buscar alunos ativos." });
  }
});
// Rota para LISTAR alunos INATIVOS (com dados da família)
app.get("/alunos/inativos", async (req, res) => {
  try {
    // A query agora seleciona o status_pagamento, que estava faltando.
    const allAlunos = await db.query(
      `SELECT id, nome_completo, data_nascimento, status_pagamento 
       FROM alunos
       WHERE status_aluno = FALSE 
       ORDER BY nome_completo ASC`
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

// Rota para DELETAR um aluno
app.delete("/alunos/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deleteQuery = await db.query(
      "DELETE FROM alunos WHERE id = $1 RETURNING *",
      [id]
    );

    if (deleteQuery.rowCount === 0) {
      return res.status(404).json({ error: "Aluno não encontrado." });
    }

    res.status(200).json({ message: "Aluno excluído com sucesso." });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Erro ao excluir aluno." });
  }
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

// Inicia o servidor para ouvir na porta definida
app.listen(port, () => {
  console.log(`Servidor backend rodando em http://localhost:3001`);
});
