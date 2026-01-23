import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../config/firebase";
import api from "../config/api";
export async function requestUploadUrl(fileName, fileType, category, refId) {
  console.log("🔗 [requestUploadUrl] Solicitando signed URL:", {
    fileName,
    fileType,
    category,
    refId,
  });
  const response = await api.post("/api/upload/request-upload", {
    fileName,
    fileType,
    category,
    refId,
  });
  console.log("✅ [requestUploadUrl] Signed URL obtida:", response.data);
  return response.data;
}

/**
 * Realiza upload de arquivo para o Firebase Storage usando signed URL
 * @param {File} arquivo - Arquivo selecionado pelo usuário
 * @param {string} categoria - Tipo de arquivo (ex: 'anexos_planejamento')
 * @param {string|number} idReferencia - ID do planejamento, aluno, etc
 * @param {Function} onProgress - Callback opcional para progresso do upload (0-100)
 * @returns {Promise<string>} - Retorna o caminho do arquivo no Firebase
 */
export async function uploadAoFirebase(
  arquivo,
  categoria,
  idReferencia,
  onProgress,
) {
  try {
    console.log("📤 [uploadAoFirebase] Iniciando upload:", {
      categoria,
      idReferencia,
      fileName: arquivo.name,
    });

    // Solicitar signed URL ao backend
    const { url, destPath } = await requestUploadUrl(
      arquivo.name,
      arquivo.type,
      categoria,
      idReferencia,
    );

    console.log("🔗 [uploadAoFirebase] Fazendo PUT para signed URL:", url);

    // Fazer upload via PUT para a signed URL
    const response = await fetch(url, {
      method: "PUT",
      body: arquivo,
      headers: {
        "Content-Type": arquivo.type,
      },
    });

    if (!response.ok) {
      console.error(
        "❌ [uploadAoFirebase] PUT falhou:",
        response.status,
        response.statusText,
      );
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    console.log("✅ [uploadAoFirebase] Upload concluído, caminho:", destPath);

    // Simular progresso se callback fornecido (opcional)
    if (onProgress) {
      onProgress(100); // Upload concluído
    }

    return destPath; // Caminho no Firebase
  } catch (error) {
    console.error("❌ [uploadAoFirebase] Erro:", error);
    throw new Error(error.message || "Falha ao fazer upload do arquivo");
  }
}

/**
 * Gera URL de download de um arquivo do Firebase Storage via signed URL
 *
 * @param {string} caminhoArquivo - Caminho completo do arquivo no Firebase
 * @returns {Promise<string>} - URL assinada para download (válida por 1 hora)
 *
 * @example
 * const url = await getDownloadUrl('anexos_aluno/123/documento.pdf');
 * window.open(url, '_blank'); // Abre o arquivo em nova aba
 */
export async function getDownloadUrl(caminhoArquivo) {
  try {
    console.log(
      "📥 [getDownloadUrl] Solicitando signed URL para download:",
      caminhoArquivo,
    );
    const response = await api.post("/api/upload/request-download", {
      filePath: caminhoArquivo,
    });
    console.log("✅ [getDownloadUrl] Signed URL obtida:", response.data.url);
    return response.data.url;
  } catch (error) {
    console.error("❌ [getDownloadUrl] Erro:", error);
    throw new Error(
      error.response?.data?.error || "Falha ao gerar URL de download",
    );
  }
}

/**
 * Deleta um arquivo do Firebase Storage
 *
 * @param {string} caminhoArquivo - Caminho completo do arquivo no Firebase
 * @returns {Promise<void>}
 *
 * @example
 * await deleteArquivo('anexos_aluno/123/documento.pdf');
 */
export async function deleteArquivo(caminhoArquivo) {
  try {
    console.log("🗑️ [deleteArquivo] Deletando arquivo:", caminhoArquivo);
    await api.delete("/api/upload/delete", {
      data: { filePath: caminhoArquivo },
    });
    console.log("✅ [deleteArquivo] Arquivo deletado com sucesso");
  } catch (error) {
    console.error("❌ [deleteArquivo] Erro:", error);
    throw new Error(error.response?.data?.error || "Falha ao deletar arquivo");
  }
}

/**
 * Lista todos os arquivos de uma categoria/referência
 *
 * @param {string} categoria - Categoria do arquivo
 * @param {string|number} idReferencia - ID da referência
 * @returns {Promise<Array>} - Lista de arquivos
 *
 * @example
 * const arquivos = await listarArquivos('anexos_aluno', 123);
 */
export async function listarArquivos(categoria, idReferencia) {
  try {
    const response = await api.get(
      `/api/upload/list/${categoria}/${idReferencia}`,
    );

    return response.data.files;
  } catch (error) {
    console.error("Erro ao listar arquivos:", error);
    throw new Error(error.response?.data?.error || "Falha ao listar arquivos");
  }
}

/**
 * Valida tamanho e tipo do arquivo antes do upload
 *
 * @param {File} arquivo - Arquivo a ser validado
 * @param {Object} opcoes - Opções de validação
 * @param {number} opcoes.maxSizeMB - Tamanho máximo em MB (padrão: 10)
 * @param {Array<string>} opcoes.allowedTypes - Tipos permitidos (padrão: todos)
 * @returns {Object} - {valid: boolean, error: string}
 *
 * @example
 * const validacao = validarArquivo(arquivo, {
 *   maxSizeMB: 5,
 *   allowedTypes: ['application/pdf', 'image/jpeg', 'image/png']
 * });
 * if (!validacao.valid) {
 *   alert(validacao.error);
 * }
 */
export function validarArquivo(arquivo, opcoes = {}) {
  const { maxSizeMB = 10, allowedTypes = [] } = opcoes;

  // Valida tamanho
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (arquivo.size > maxSizeBytes) {
    return {
      valid: false,
      error: `Arquivo muito grande. Máximo: ${maxSizeMB}MB`,
    };
  }

  // Valida tipo
  if (allowedTypes.length > 0 && !allowedTypes.includes(arquivo.type)) {
    return {
      valid: false,
      error: "Tipo de arquivo não permitido",
    };
  }

  return { valid: true };
}

/**
 * Retorna a URL para exibir uma imagem, detectando se é Firebase ou local
 * @param {string} caminhoImagem - Caminho da imagem
 * @returns {Promise<string|null>} - URL da imagem ou null se erro
 */
export async function getImageUrl(caminhoImagem) {
  if (!caminhoImagem) return null;

  // Se começa com "alunos/", "usuarios/", "imagem_perfil/", etc., é Firebase
  if (
    caminhoImagem.startsWith("alunos/") ||
    caminhoImagem.startsWith("usuarios/") ||
    caminhoImagem.startsWith("imagem_aluno/") ||
    caminhoImagem.startsWith("imagem_perfil/")
  ) {
    try {
      return await getDownloadUrl(caminhoImagem);
    } catch (error) {
      console.error("Erro ao obter URL do Firebase:", error);
      return null;
    }
  } else {
    // É caminho local, usar API_URL
    const API_URL = api.defaults.baseURL
      ? api.defaults.baseURL.replace("/api", "")
      : "";
    return `${API_URL}${caminhoImagem}`;
  }
}

/**
 * Faz upload da foto de perfil do usuário para o Firebase
 * @param {File} arquivo - Arquivo de imagem selecionado
 * @param {string|number} usuarioId - ID do usuário
 * @param {Function} onProgress - Callback opcional para progresso
 * @returns {Promise<string>} - Caminho do arquivo no Firebase
 */
export async function uploadFotoPerfilUsuario(arquivo, usuarioId, onProgress) {
  return await uploadAoFirebase(arquivo, "imagem_perfil", usuarioId, onProgress);
}

/**
 * Remove a foto de perfil do usuário do Firebase
 * @param {string} caminhoImagem - Caminho da imagem no Firebase
 * @returns {Promise<void>}
 */
export async function excluirFotoPerfilUsuario(caminhoImagem) {
  if (!caminhoImagem) return;
  return await deleteArquivo(caminhoImagem);
}
