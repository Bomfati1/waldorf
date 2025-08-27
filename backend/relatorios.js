const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const pool = require("./db"); // Certifique-se que o caminho para seu pool de conexão está correto

const router = express.Router();

// --- Configuração do Multer ---

// Garante que o diretório de uploads exista
const uploadDir = path.join(__dirname, "uploads", "relatorios");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configura o armazenamento em disco
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Salva os arquivos em 'backend/uploads/relatorios'
  },
  filename: function (req, file, cb) {
    // Garante um nome de arquivo único e seguro, substituindo espaços
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_"));
  },
});

const upload = multer({ storage: storage });

// --- Rota para buscar todos os relatórios ---
router.get("/", async (req, res) => {
  try {
    const query = `
      SELECT 
        r.id,
        r.caminho_arquivo,
        r.nome_original,
        r.tipo_mime,
        r.tamanho_bytes,
        r.data_upload,
        r.aluno_id,
        a.nome_completo as nome_aluno,
        r.turma_id,
        t.nome_turma
      FROM 
        relatorios r
      LEFT JOIN 
        alunos a ON r.aluno_id = a.id
      LEFT JOIN 
        turmas t ON r.turma_id = t.id
      ORDER BY 
        r.data_upload DESC;
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

// --- Rota para lidar com o upload de arquivos ---
router.post("/upload", upload.single("relatorio"), async (req, res) => {
  // 'relatorio' é o nome do campo que definimos no FormData do frontend
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
  // O caminho a ser salvo no DB deve ser relativo para ser acessado pelo frontend
  const relativePath = path
    .join("uploads", "relatorios", filename)
    .replace(/\\/g, "/");

  // **CORREÇÃO PRINCIPAL AQUI**
  // 1. A query agora lista as colunas corretas.
  // 2. Note que 'data_upload' foi removida, pois o banco de dados a preenche automaticamente com o valor DEFAULT.
  // 3. Os VALUES ($1, $2, etc.) agora correspondem à ordem das colunas.
  const query = `
    INSERT INTO relatorios 
      (caminho_arquivo, nome_original, tipo_mime, tamanho_bytes, aluno_id, turma_id)
    VALUES 
      ($1, $2, $3, $4, $5, $6)
    RETURNING id;
  `;

  // 4. Os parâmetros agora estão na ordem correta para corresponder à query.
  const queryParams = [
    relativePath,
    originalname,
    mimetype,
    size,
    finalAlunoId,
    finalTurmaId,
  ];

  try {
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
      query_params: queryParams, // Loga os parâmetros que causaram o erro
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
});

// --- Rota para DELETAR um relatório ---
router.delete("/:id", async (req, res) => {
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

    // COMPATIBILITY FIX:
    // O arquivo físico está sempre em 'backend/uploads/relatorios'.
    // O caminho no DB pode ser 'relatorios/...' (antigo) ou 'uploads/relatorios/...' (novo).
    // Esta lógica garante que estamos procurando o arquivo no local físico correto.
    const physicalPath = dbPath.startsWith("uploads/")
      ? dbPath
      : path.join("uploads", dbPath);

    const absoluteFilePath = path.join(__dirname, physicalPath);

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

module.exports = router;
