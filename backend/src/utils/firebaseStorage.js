const { bucket } = require("../config/firebase");
const path = require("path");
const fs = require("fs");

/**
 * Valida se o arquivo é do tipo permitido (PDF ou DOC)
 * @param {string} filename - Nome do arquivo
 * @param {string} mimetype - Tipo MIME do arquivo
 * @returns {boolean} - true se for válido, false caso contrário
 */
function isValidDocumentType(filename, mimetype) {
  const allowedExtensions = [".pdf", ".doc", ".docx"];
  const allowedMimeTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  const ext = path.extname(filename).toLowerCase();
  const isValidExt = allowedExtensions.includes(ext);
  const isValidMime = allowedMimeTypes.includes(mimetype);

  return isValidExt && isValidMime;
}

/**
 * Faz upload de um arquivo para o Firebase Storage
 * @param {Object} file - Objeto do arquivo do multer (req.file)
 * @param {string} category - Categoria do arquivo (ex: 'relatorios', 'anexos_aluno', 'anexos_planejamento')
 * @param {string} refId - ID de referência (aluno_id, planejamento_id, etc)
 * @returns {Promise<Object>} - Objeto com { filePath, downloadURL, metadata }
 */
async function uploadFileToFirebase(file, category, refId) {
  try {
    // Validação básica
    if (!file) {
      throw new Error("Arquivo não fornecido");
    }
    if (!category) {
      throw new Error("Categoria não fornecida");
    }
    if (!refId) {
      throw new Error("ID de referência não fornecido");
    }

    // Validação do tipo de arquivo
    if (!isValidDocumentType(file.originalname, file.mimetype)) {
      throw new Error(
        "Tipo de arquivo não permitido. Apenas PDF e DOC são aceitos."
      );
    }

    // Cria o caminho no Firebase Storage
    // Formato: categoria/refId/timestamp_nome_arquivo
    const timestamp = Date.now();
    const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    const destPath = `${category}/${refId}/${timestamp}_${sanitizedFileName}`;

    console.log(`[Firebase Upload] Iniciando upload: ${destPath}`);

    // Cria referência do arquivo no bucket
    const fileRef = bucket.file(destPath);

    // Faz upload do arquivo
    // Se o arquivo está em disco (file.path), lê o arquivo
    // Se está em memória (file.buffer), usa o buffer diretamente
    let fileContent;
    if (file.buffer) {
      fileContent = file.buffer;
      console.log(`[Firebase Upload] Usando buffer do arquivo (${file.buffer.length} bytes)`);
    } else if (file.path) {
      if (!fs.existsSync(file.path)) {
        throw new Error(`Arquivo não encontrado em: ${file.path}`);
      }
      fileContent = fs.readFileSync(file.path);
      console.log(`[Firebase Upload] Lendo arquivo do disco: ${file.path} (${fileContent.length} bytes)`);
    } else {
      throw new Error("Arquivo não possui buffer nem path válido");
    }

    const metadata = {
      contentType: file.mimetype,
      metadata: {
        originalName: file.originalname,
        uploadedAt: new Date().toISOString(),
      },
    };

    console.log(`[Firebase Upload] Fazendo upload para Firebase Storage...`);
    await fileRef.save(fileContent, {
      metadata: metadata,
    });

    console.log(`[Firebase Upload] Upload concluído. Gerando URL de download...`);

    // Gera URL assinada para download
    // Firebase Storage permite no máximo 7 dias (604800 segundos) de expiração
    const [downloadURL] = await fileRef.getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 dias (máximo permitido)
    });

    console.log(`[Firebase Upload] Upload bem-sucedido: ${destPath}`);

    return {
      filePath: destPath,
      downloadURL: downloadURL,
      metadata: {
        originalName: file.originalname,
        size: file.size,
        contentType: file.mimetype,
      },
    };
  } catch (error) {
    console.error("[Firebase Upload] Erro detalhado:", {
      message: error.message,
      stack: error.stack,
      category,
      refId,
      fileName: file?.originalname,
    });
    throw error;
  }
}

/**
 * Deleta um arquivo do Firebase Storage
 * @param {string} filePath - Caminho do arquivo no Firebase Storage
 * @returns {Promise<void>}
 */
async function deleteFileFromFirebase(filePath) {
  try {
    const fileRef = bucket.file(filePath);
    const [exists] = await fileRef.exists();

    if (exists) {
      await fileRef.delete();
      console.log(`Arquivo deletado do Firebase: ${filePath}`);
    } else {
      console.log(`Arquivo não encontrado no Firebase: ${filePath}`);
    }
  } catch (error) {
    console.error("Erro ao deletar arquivo do Firebase Storage:", error);
    throw error;
  }
}

/**
 * Gera URL assinada para download de um arquivo
 * @param {string} filePath - Caminho do arquivo no Firebase Storage
 * @param {number} expiresInHours - Horas até a URL expirar (padrão: 1 hora)
 * @returns {Promise<string>} - URL assinada
 */
async function getSignedDownloadURL(filePath, expiresInHours = 1) {
  try {
    const fileRef = bucket.file(filePath);
    const [exists] = await fileRef.exists();

    if (!exists) {
      throw new Error("Arquivo não encontrado no Firebase Storage");
    }

    const [url] = await fileRef.getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + expiresInHours * 60 * 60 * 1000,
    });

    return url;
  } catch (error) {
    console.error("Erro ao gerar URL de download:", error);
    throw error;
  }
}

module.exports = {
  uploadFileToFirebase,
  deleteFileFromFirebase,
  getSignedDownloadURL,
  isValidDocumentType,
};
