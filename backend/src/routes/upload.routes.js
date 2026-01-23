const express = require("express");
const router = express.Router();
const { bucket } = require("../config/firebase");

/**
 * POST /api/upload/request-upload
 * Gera uma URL assinada para upload direto ao Firebase Storage
 *
 * Categorias suportadas:
 * - anexos_aluno: Documentos/PDFs de alunos (por aluno_id)
 * - imagem_aluno: Fotos dos alunos (por aluno_id)
 * - anexos_planejamento: Documentos de planejamento (por planejamento_id)
 * - imagem_perfil: Fotos de perfil dos usuários do sistema (por usuario_id)
 * - relatorios: Relatórios de alunos/turmas (por aluno_id ou turma_id)
 */
router.post("/request-upload", async (req, res) => {
  try {
    const { fileName, fileType, category, refId } = req.body;

    console.log(
      "📋 [request-upload] RECEIVED BODY:",
      JSON.stringify(req.body, null, 2),
    );
    console.log("📋 [request-upload] Parâmetros recebidos:", {
      fileName,
      fileType,
      category,
      refId,
      refIdType: typeof refId,
    });

    // Validação básica
    if (
      !fileName ||
      !fileType ||
      !category ||
      refId === undefined ||
      refId === null
    ) {
      console.log("❌ [request-upload] Parâmetros faltando:", {
        hasFileName: !!fileName,
        hasFileType: !!fileType,
        hasCategory: !!category,
        hasRefId: refId !== undefined && refId !== null,
        refId,
      });
      return res.status(400).json({
        error: "Parâmetros obrigatórios: fileName, fileType, category, refId",
      });
    }

    // Validar categorias permitidas
    const categoriesAllowed = [
      "anexos_aluno",
      "imagem_aluno",
      "anexos_planejamento",
      "imagem_perfil",
      "relatorios",
    ];

    if (!categoriesAllowed.includes(category)) {
      return res.status(400).json({
        error: `Categoria inválida. Use: ${categoriesAllowed.join(", ")}`,
      });
    }

    // Criar caminho virtual no Firebase Storage
    // Exemplo: anexos_aluno/123/1737375600000_documento.pdf
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const destPath = `${category}/${refId}/${timestamp}_${sanitizedFileName}`;

    const file = bucket.file(destPath);

    // Gera a URL assinada (válida por 15 minutos)
    const [url] = await file.getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 15 * 60 * 1000,
      contentType: fileType,
    });

    res.status(200).json({
      url,
      destPath,
      expiresIn: "15 minutos",
    });
  } catch (error) {
    console.error("Erro ao gerar URL de upload:", error);
    res.status(500).json({
      error: "Falha ao gerar permissão de upload",
      details: error.message,
    });
  }
});

/**
 * POST /api/upload/request-download
 * Gera uma URL assinada para download de arquivo do Firebase Storage
 */
router.post("/request-download", async (req, res) => {
  try {
    const { filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: "filePath é obrigatório" });
    }

    const file = bucket.file(filePath);

    // Verifica se o arquivo existe
    const [exists] = await file.exists();
    if (!exists) {
      return res.status(404).json({ error: "Arquivo não encontrado" });
    }

    // Gera URL assinada para download (válida por 1 hora)
    const [url] = await file.getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + 60 * 60 * 1000,
    });

    res.status(200).json({
      url,
      expiresIn: "1 hora",
    });
  } catch (error) {
    console.error("Erro ao gerar URL de download:", error);
    res.status(500).json({
      error: "Falha ao gerar URL de download",
      details: error.message,
    });
  }
});

/**
 * DELETE /api/upload/delete
 * Deleta um arquivo do Firebase Storage
 */
router.delete("/delete", async (req, res) => {
  try {
    const { filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: "filePath é obrigatório" });
    }

    const file = bucket.file(filePath);

    // Verifica se o arquivo existe
    const [exists] = await file.exists();
    if (!exists) {
      return res.status(404).json({ error: "Arquivo não encontrado" });
    }

    await file.delete();

    res.status(200).json({
      message: "Arquivo deletado com sucesso",
      filePath,
    });
  } catch (error) {
    console.error("Erro ao deletar arquivo:", error);
    res.status(500).json({
      error: "Falha ao deletar arquivo",
      details: error.message,
    });
  }
});

/**
 * GET /api/upload/list/:category/:refId
 * Lista todos os arquivos de uma categoria/referência
 */
router.get("/list/:category/:refId", async (req, res) => {
  try {
    const { category, refId } = req.params;

    const prefix = `${category}/${refId}/`;
    const [files] = await bucket.getFiles({ prefix });

    const fileList = files.map((file) => ({
      name: file.name,
      size: file.metadata.size,
      contentType: file.metadata.contentType,
      created: file.metadata.timeCreated,
      updated: file.metadata.updated,
    }));

    res.status(200).json({
      files: fileList,
      count: fileList.length,
    });
  } catch (error) {
    console.error("Erro ao listar arquivos:", error);
    res.status(500).json({
      error: "Falha ao listar arquivos",
      details: error.message,
    });
  }
});

module.exports = router;
