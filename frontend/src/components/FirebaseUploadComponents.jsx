import React, { useState } from "react";
import {
  uploadAoFirebase,
  deleteArquivo,
  getDownloadUrl,
  validarArquivo,
} from "../utils/firebaseUpload";
import api from "../config/api";

/**
 * Componente para upload de anexos de alunos (PDFs/Docs)
 * Usado na página de perfil do aluno
 */
export function AnexoAlunoUpload({ alunoId, onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Valida o arquivo (máximo 10MB, apenas PDFs e Docs)
    const validation = validarArquivo(file, {
      maxSizeMB: 10,
      allowedTypes: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
    });

    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setError("");
    setUploading(true);
    setProgress(0);

    try {
      // Upload para o Firebase
      const caminhoFirebase = await uploadAoFirebase(
        file,
        "anexos_aluno",
        alunoId,
        setProgress,
      );

      // Salva a referência no banco de dados
      console.log("📤 [AnexoAlunoUpload] Salvando referência no banco:", {
        aluno_id: alunoId,
        nome_arquivo: file.name,
        caminho_firebase: caminhoFirebase,
      });
      await api.post("/alunos/anexos", {
        aluno_id: alunoId,
        nome_arquivo: file.name,
        tipo_arquivo: file.type,
        caminho_firebase: caminhoFirebase,
        tamanho: file.size,
      });
      console.log("✅ [AnexoAlunoUpload] Referência salva com sucesso");

      setUploading(false);
      setProgress(0);

      if (onUploadSuccess) {
        onUploadSuccess(caminhoFirebase);
      }

      alert("Anexo enviado com sucesso!");
    } catch (error) {
      setError(error.message);
      setUploading(false);
    }
  };

  return (
    <div className="anexo-upload-container">
      <label
        htmlFor="anexo-file"
        className="upload-button-aluno"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "12px 20px",
          background: uploading
            ? "#6c757d"
            : "linear-gradient(135deg, #28a745 0%, #20c997 100%)",
          color: "#fff",
          borderRadius: "8px",
          cursor: uploading ? "not-allowed" : "pointer",
          fontSize: "14px",
          fontWeight: "600",
          transition: "all 0.3s ease",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          border: "none",
          userSelect: "none",
        }}
        onMouseEnter={(e) => {
          if (!uploading) e.target.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          if (!uploading) e.target.style.transform = "translateY(0)";
        }}
      >
        {uploading ? (
          <>
            <span>⏳</span> Enviando... {progress}%
          </>
        ) : (
          <>
            <span>📎</span> Anexar PDF/DOC
          </>
        )}
      </label>
      <input
        id="anexo-file"
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleFileSelect}
        disabled={uploading}
        style={{ display: "none" }}
      />
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

/**
 * Componente para upload de imagens de alunos
 * Usado na página de perfil do aluno
 */
export function ImagemAlunoUpload({
  alunoId,
  onUploadSuccess,
  hasPhoto,
  onRemove,
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Valida o arquivo (máximo 5MB, apenas imagens)
    const validation = validarArquivo(file, {
      maxSizeMB: 5,
      allowedTypes: [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/avif",
        "image/webp",
      ],
    });

    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    // Preview da imagem
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    setError("");
    setUploading(true);

    try {
      // Upload para o Firebase
      const caminhoFirebase = await uploadAoFirebase(
        file,
        "imagem_aluno",
        alunoId,
      );

      setUploading(false);

      if (onUploadSuccess) {
        onUploadSuccess(caminhoFirebase);
      }
    } catch (error) {
      setError(error.message);
      setUploading(false);
    }
  };

  return (
    <div
      className="imagem-upload-container"
      style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
    >
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <label
          htmlFor="imagem-aluno-file"
          className="upload-button"
          style={{
            padding: "10px 20px",
            background: uploading
              ? "#6c757d"
              : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: uploading ? "not-allowed" : "pointer",
            fontSize: "0.9rem",
            fontWeight: "600",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
            transform: "translateY(0)",
          }}
          onMouseEnter={(e) => {
            if (!uploading) {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.6)";
            }
          }}
          onMouseLeave={(e) => {
            if (!uploading) {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 15px rgba(102, 126, 234, 0.4)";
            }
          }}
        >
          {uploading ? (
            <>
              <span>⏳</span> Enviando...
            </>
          ) : (
            <>
              <span>📷</span> Alterar Foto
            </>
          )}
        </label>
        {hasPhoto && onRemove && (
          <button
            type="button"
            onClick={async () => {
              if (
                window.confirm(
                  "Tem certeza que deseja remover a foto do aluno?",
                )
              ) {
                try {
                  // Se o caminho for do Firebase, deletar do Firebase
                  if (
                    hasPhoto.startsWith("alunos/") ||
                    hasPhoto.startsWith("imagem_aluno/")
                  ) {
                    await deleteArquivo(hasPhoto);
                  }
                  onRemove();
                } catch (error) {
                  alert("Erro ao remover foto");
                }
              }
            }}
            style={{
              padding: "10px 20px",
              background: "linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: "600",
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 15px rgba(255, 107, 107, 0.4)",
              transform: "translateY(0)",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 6px 20px rgba(255, 107, 107, 0.6)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 15px rgba(255, 107, 107, 0.4)";
            }}
          >
            <span>🗑️</span> Remover
          </button>
        )}
      </div>
      <input
        id="imagem-aluno-file"
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={uploading}
        style={{ display: "none" }}
      />
      {preview && (
        <div style={{ textAlign: "center" }}>
          <img
            src={preview}
            alt="Preview"
            className="image-preview"
            style={{
              maxWidth: "200px",
              maxHeight: "200px",
              borderRadius: "8px",
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
            }}
          />
          <p style={{ marginTop: "0.5rem", color: "#666", fontSize: "0.8rem" }}>
            Preview da nova foto
          </p>
        </div>
      )}
      {error && (
        <div
          className="error-message"
          style={{
            color: "#dc3545",
            background: "#f8d7da",
            border: "1px solid #f5c6cb",
            borderRadius: "4px",
            padding: "8px 12px",
            fontSize: "0.9rem",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

/**
 * Componente para upload de anexos de planejamento (PDFs/Docs)
 * Usado na página de planejamentos ISO
 */
export function AnexoPlanejamentoUpload({ planejamentoId, onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Valida o arquivo
    const validation = validarArquivo(file, {
      maxSizeMB: 15,
      allowedTypes: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ],
    });

    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setError("");
    setUploading(true);
    setProgress(0);

    try {
      // Upload para o Firebase
      const caminhoFirebase = await uploadAoFirebase(
        file,
        "anexos_planejamento",
        planejamentoId,
        setProgress,
      );

      // Salva a referência no banco
      console.log(
        "📤 [AnexoPlanejamentoUpload] Salvando referência no banco:",
        {
          planejamento_id: planejamentoId,
          nome_arquivo: file.name,
          caminho_firebase: caminhoFirebase,
        },
      );
      await api.post("/planejamentos/anexos", {
        planejamento_id: planejamentoId,
        nome_arquivo: file.name,
        tipo_arquivo: file.type,
        caminho_firebase: caminhoFirebase,
        tamanho: file.size,
      });
      console.log("✅ [AnexoPlanejamentoUpload] Referência salva com sucesso");

      setUploading(false);
      setProgress(0);

      if (onUploadSuccess) {
        onUploadSuccess(caminhoFirebase);
      }

      alert("Anexo do planejamento enviado com sucesso!");
    } catch (error) {
      setError(error.message);
      setUploading(false);
    }
  };

  return (
    <div className="anexo-planejamento-container">
      <label
        htmlFor="anexo-planejamento-file"
        className="upload-button-planejamento"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "12px 20px",
          background: uploading
            ? "#6c757d"
            : "linear-gradient(135deg, #28a745 0%, #20c997 100%)",
          color: "#fff",
          borderRadius: "8px",
          cursor: uploading ? "not-allowed" : "pointer",
          fontSize: "14px",
          fontWeight: "600",
          transition: "all 0.3s ease",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          border: "none",
          userSelect: "none",
        }}
        onMouseEnter={(e) => {
          if (!uploading) e.target.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          if (!uploading) e.target.style.transform = "translateY(0)";
        }}
      >
        {uploading ? (
          <>
            <span>⏳</span> Enviando... {progress}%
          </>
        ) : (
          <>
            <span>📎</span> Anexar PDF/DOC
          </>
        )}
      </label>
      <input
        id="anexo-planejamento-file"
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx"
        onChange={handleFileSelect}
        disabled={uploading}
        style={{ display: "none" }}
      />
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

/**
 * Componente para upload de imagem de perfil do usuário
 * Usado na PerfilPage (foto do usuário do sistema)
 */
export function ImagemPerfilUsuarioUpload({ usuarioId, onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Valida o arquivo (máximo 3MB, apenas imagens)
    const validation = validarArquivo(file, {
      maxSizeMB: 3,
      allowedTypes: [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/avif",
        "image/webp",
      ],
    });

    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    // Preview da imagem
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    setError("");
    setUploading(true);

    try {
      // Upload para o Firebase
      const caminhoFirebase = await uploadAoFirebase(
        file,
        "imagem_perfil",
        usuarioId,
      );

      // Atualiza o perfil do usuário no banco
      await api.put("/api/usuarios/perfil", {
        foto_perfil: caminhoFirebase,
      });

      setUploading(false);

      if (onUploadSuccess) {
        onUploadSuccess(caminhoFirebase);
      }

      alert("Foto de perfil atualizada com sucesso!");
    } catch (error) {
      setError(error.message);
      setUploading(false);
    }
  };

  return (
    <div className="perfil-upload-container">
      <label htmlFor="perfil-usuario-file" className="upload-button-perfil">
        {uploading ? "Enviando..." : "Alterar Foto de Perfil"}
      </label>
      <input
        id="perfil-usuario-file"
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={uploading}
        style={{ display: "none" }}
      />
      {preview && (
        <img src={preview} alt="Preview" className="perfil-preview" />
      )}
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

/**
 * Componente para listar e gerenciar anexos
 */
export function ListaAnexos({ anexos, onDelete, tipo, idRef }) {
  const [loading, setLoading] = useState({});

  const handleDownload = async (anexo) => {
    try {
      setLoading((prev) => ({ ...prev, [anexo.id]: true }));
      const url = await getDownloadUrl(
        anexo.caminho_firebase || anexo.caminho_arquivo,
      );
      window.open(url, "_blank");
    } catch (error) {
      alert("Erro ao baixar arquivo");
    } finally {
      setLoading((prev) => ({ ...prev, [anexo.id]: false }));
    }
  };

  const handleDelete = async (anexo) => {
    const nome = anexo.nome_arquivo || anexo.nome_original;
    if (!confirm(`Deseja realmente excluir ${nome}?`)) {
      return;
    }

    try {
      // Deleta do Firebase
      await deleteArquivo(anexo.caminho_firebase || anexo.caminho_arquivo);

      // Deleta do banco
      let deleteUrl = `/anexos/${anexo.id}`;
      if (tipo === "aluno" && idRef) {
        deleteUrl = `/alunos/${idRef}/anexos/${anexo.id}`;
      } else if (tipo === "planejamento") {
        deleteUrl = `/planejamentos/anexos/${anexo.id}`;
      }
      await api.delete(deleteUrl);

      if (onDelete) {
        onDelete(anexo.id);
      }

      alert("Anexo excluído com sucesso!");
    } catch (error) {
      alert("Erro ao excluir anexo");
    }
  };

  return (
    <div className="lista-anexos" style={{ marginTop: "1rem" }}>
      {anexos.map((anexo) => {
        const nome = anexo.nome_arquivo || anexo.nome_original;
        const tamanho = anexo.tamanho;
        const data = anexo.data_upload || anexo.criado_em;
        return (
          <div
            key={anexo.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 16px",
              background: "#f8f9fa",
              borderRadius: "8px",
              border: "1px solid #e0e0e0",
              marginBottom: "8px",
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontWeight: "500",
                  color: "#333",
                  marginBottom: "4px",
                }}
              >
                📄 {nome}
              </div>
              <div style={{ fontSize: "0.85rem", color: "#666" }}>
                {tamanho ? `${(tamanho / 1024 / 1024).toFixed(2)} MB • ` : ""}
                {data ? new Date(data).toLocaleDateString("pt-BR") : ""}
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => handleDownload(anexo)}
                disabled={loading[anexo.id]}
                style={{
                  padding: "8px 16px",
                  background: "#28a745",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: loading[anexo.id] ? "not-allowed" : "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "500",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
                onMouseOver={(e) => {
                  if (!loading[anexo.id]) e.target.style.background = "#218838";
                }}
                onMouseOut={(e) => {
                  if (!loading[anexo.id]) e.target.style.background = "#28a745";
                }}
              >
                {loading[anexo.id] ? "⏳ Baixando..." : "⬇️ Baixar"}
              </button>
              <button
                onClick={() => handleDelete(anexo)}
                style={{
                  padding: "8px 16px",
                  background: "#dc3545",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "500",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
                onMouseOver={(e) => {
                  e.target.style.background = "#c82333";
                }}
                onMouseOut={(e) => {
                  e.target.style.background = "#dc3545";
                }}
              >
                🗑️ Excluir
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
