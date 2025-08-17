// Importa as bibliotecas necessárias
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const db = require("./db"); // Importa nossa configuração do banco de dados
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Inicializa o aplicativo Express
const app = express();
const port = 3001; // Define a porta em que o servidor vai rodar

// Middlewares
app.use(cors()); // Habilita o CORS para permitir requisições do frontend
app.use(express.json()); // Permite que o servidor entenda JSON no corpo das requisições

// Servir arquivos estáticos da pasta 'uploads'
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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

// --- SERVIR ARQUIVOS ESTÁTICOS ---
// Torna a pasta 'uploads' acessível publicamente pela URL '/uploads'
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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
// Rota para buscar todos os usuários com o cargo de "professor"
app.get("/usuarios/professores", async (req, res) => {
  try {
    const professores = await db.query(
      "SELECT id, nome FROM usuarios WHERE LOWER(cargo::text) = 'professor' ORDER BY nome ASC"
    );
    res.status(200).json(professores.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Erro ao buscar professores." });
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
                ,
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

// Rota para LISTAR todas as turmas com detalhes
app.get("/turmas", async (req, res) => {
  try {
    const query = `
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
    const turmas = await db.query(query);
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
app.delete("/turmas/:id", async (req, res) => {
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
app.post("/planejamentos/find-or-create", async (req, res) => {
  // Dados que vêm do seu frontend
  const { turma_id, ano, mes, semana, usuario_id } = req.body;

  if (!turma_id || !ano || !mes || !semana || !usuario_id) {
    return res
      .status(400)
      .json({ error: "Turma, ano, mês, semana e usuário são obrigatórios." });
  }

  try {
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
                  )
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
    res.status(500).json({ error: "Erro interno ao processar planejamento." });
  }
});

// --- ROTAS PARA COMENTÁRIOS DE PLANEJAMENTO ---

// Rota para ATUALIZAR o STATUS de um planejamento (Aprovar/Reprovar)
app.put("/planejamentos/:id/status", async (req, res) => {
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
});

// Rota para ADICIONAR um comentário
app.post("/planejamentos/:id/comentarios", async (req, res) => {
  const { id: planejamento_id } = req.params;
  const { usuario_id, texto_comentario } = req.body;

  if (!usuario_id || !texto_comentario) {
    return res
      .status(400)
      .json({ error: "Usuário e comentário são obrigatórios." });
  }

  try {
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
});
// ROTA PARA DELETAR UM COMENTÁRIO ESPECÍFICO
app.delete("/comentarios/:id", async (req, res) => {
  // Pega o ID do comentário que vem da URL (ex: /comentarios/15)
  const { id } = req.params;

  try {
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
  upload.single("anexo"),
  async (req, res) => {
    const { id: planejamento_id } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado." });
    }

    const { originalname: nome_arquivo, path: path_arquivo } = req.file;

    try {
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
app.delete("/anexos/:id", async (req, res) => {
  const { id: anexo_id } = req.params;

  try {
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

// Inicia o servidor para ouvir na porta definida
app.listen(port, () => {
  console.log(`Servidor backend rodando em http://localhost:3001`);
});
