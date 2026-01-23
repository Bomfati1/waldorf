import React, { useEffect, useMemo, useState } from "react";
import { getApiUrl, API_URL, fetchWithAuth } from "../config/api";
import ListaComentarios from "./ListaComentarios";
import { useAuth } from "../context/AuthContext";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import {
  uploadAoFirebase,
  getDownloadUrl,
  deleteArquivo,
  validarArquivo,
} from "../utils/firebaseUpload";

const ISOPlanejamentoModalStyles = () => (
  <style>{`
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); display:flex; align-items:center; justify-content:center; z-index:9999; animation: fadeIn .3s ease-out; overflow-y: auto; }
    .modal-content { background: #fff; padding: 2rem; border-radius: 8px; width: 90%; max-width: 700px; max-height: 90vh; overflow: auto; position: relative; animation: slideIn .3s ease-out; margin: 20px; }
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }
    @keyframes slideIn { from{ transform: translateY(-30px); opacity:0 } to{ transform: translateY(0); opacity:1 } }
    .modal-header { display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #e0e0e0; padding-bottom:1rem; margin-bottom:1.5rem; }
    .modal-close-button { background:transparent; border:none; font-size:2rem; line-height:1; cursor:pointer; color:#555 }
    .tabs-container { display:flex; border-bottom:1px solid #ccc; margin-bottom:1.5rem; }
    .tab-button { padding:10px 20px; cursor:pointer; border:none; background:transparent; border-bottom:3px solid transparent; margin-bottom:-1px; font-size:1rem; color:#555 }
    .tab-button.active { border-bottom-color:#17a2b8; color:#000; font-weight:600 }
    @keyframes spin { 0%{transform:rotate(0)} 100%{transform:rotate(360deg)} }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.7} }
    .delete-button{ background:transparent; border:none; color:#dc3545; font-size:20px; cursor:pointer }
    .submit-button{ margin-left:.5rem; padding:8px 16px; background:#17a2b8; color:#fff; border:none; border-radius:4px; cursor:pointer }
  `}</style>
);

const ISOPlanejamentoModal = ({ info, onClose, onRefresh }) => {
  // Bloqueia o scroll do body enquanto o modal está aberto
  useBodyScrollLock(true);

  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("planejamento");
  const [localInfo, setLocalInfo] = useState(info);
  const [comentarios, setComentarios] = useState(info.comentarios || []);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [anexos, setAnexos] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setLocalInfo(info);
    setComentarios(info.comentarios || []);
    carregarAnexos();
  }, [info]);

  const carregarAnexos = async () => {
    try {
      const response = await fetchWithAuth(
        `/planejamentos/${info.id_planejamento}/anexos`,
      );
      if (response.ok) {
        const data = await response.json();
        setAnexos(data);
      }
    } catch (error) {
      console.error("Erro ao carregar anexos:", error);
    }
  };

  const comentariosParaLista = useMemo(() => {
    if (!comentarios) return [];
    return comentarios.map((c) => ({
      id: c.id,
      usuario_id: c.usuario_id,
      nome_usuario: c.nome_usuario,
      texto_comentario: c.texto_comentario,
      data_comentario: c.data_comentario,
    }));
  }, [comentarios]);

  const handleModalContentClick = (e) => e.stopPropagation();

  const refetchPlanejamento = async () => {
    const resp = await fetchWithAuth(
      `/planejamentos/${localInfo.id_planejamento}`,
    );
    if (!resp.ok) throw new Error("Falha ao recarregar planejamento.");
    const data = await resp.json();
    setLocalInfo(data);
    setComentarios(data.comentarios || []);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    setIsRefreshing(true);
    try {
      const response = await fetchWithAuth(
        `/planejamentos/${localInfo.id_planejamento}/comentarios`,
        {
          method: "POST",
          body: JSON.stringify({ texto_comentario: newComment }),
        },
      );
      if (!response.ok) throw new Error("Falha ao adicionar comentário.");
      await refetchPlanejamento();
      setNewComment("");
      onRefresh?.();
    } catch (error) {
      alert(`Erro: ${error.message}`);
    } finally {
      setIsSubmitting(false);
      setIsRefreshing(false);
    }
  };

  const handleComentarioExcluido = async () => {
    setIsRefreshing(true);
    try {
      await refetchPlanejamento();
      onRefresh?.();
    } catch (error) {
      console.error("Erro ao recarregar planejamento:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (
      !window.confirm(
        `Tem certeza que deseja ${newStatus.toLowerCase()} este planejamento?`,
      )
    )
      return;
    setIsSubmitting(true);
    try {
      const response = await fetchWithAuth(
        `/planejamentos/${localInfo.id_planejamento}/status`,
        {
          method: "PUT",
          body: JSON.stringify({ status: newStatus }),
        },
      );
      if (!response.ok) throw new Error("Falha ao atualizar o status.");
      await refetchPlanejamento();
      onRefresh?.();
      onClose();
      alert(`Planejamento ${newStatus.toLowerCase()} com sucesso!`);
    } catch (error) {
      alert(`Erro: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Data não informada";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Data em formato inválido";
    return date.toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  const userCargo = String(user?.cargo || "").toLowerCase();
  const isAdminGeral = userCargo === "administrador geral";
  const canModerate =
    userCargo === "administrador pedagógico" ||
    userCargo === "administrador geral";

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log(
      "📎 Arquivo selecionado:",
      file.name,
      "Tamanho:",
      (file.size / 1024 / 1024).toFixed(2),
      "MB",
    );

    // Valida o arquivo (máximo 15MB, PDFs, Docs e Excel)
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
      console.error("❌ Validação falhou:", validation.error);
      alert(validation.error);
      return;
    }

    console.log("✅ Validação passou, iniciando upload...");
    setIsUploading(true);
    setUploadProgress(0);

    try {
      console.log("🚀 Fazendo upload para Firebase...");
      // Upload para o Firebase
      const caminhoFirebase = await uploadAoFirebase(
        file,
        "anexos_planejamento",
        localInfo.id_planejamento,
        (progress) => {
          console.log(`📊 Progresso: ${progress}%`);
          setUploadProgress(progress);
        },
      );

      console.log("✅ Upload completo! Caminho:", caminhoFirebase);
      console.log("💾 Salvando referência no banco...");

      // Salva a referência no banco de dados
      const response = await fetchWithAuth("/planejamentos/anexos", {
        method: "POST",
        body: JSON.stringify({
          planejamento_id: localInfo.id_planejamento,
          nome_arquivo: file.name,
          tipo_arquivo: file.type,
          caminho_firebase: caminhoFirebase,
          tamanho: file.size,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Erro ao salvar no banco:", errorData);
        throw new Error(
          errorData.error || "Falha ao salvar anexo no banco de dados",
        );
      }

      console.log("✅ Anexo salvo no banco!");
      await carregarAnexos();
      alert("✅ Anexo enviado com sucesso!");
    } catch (error) {
      console.error("💥 Erro no upload:", error);
      alert(`❌ Erro ao fazer upload: ${error.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // Limpa o input
      event.target.value = "";
    }
  };

  const handleDownloadAnexo = async (anexo) => {
    try {
      const url = await getDownloadUrl(anexo.caminho_firebase);
      window.open(url, "_blank");
    } catch (error) {
      alert("Erro ao baixar arquivo");
    }
  };

  const handleDeleteAnexo = async (anexo) => {
    if (!window.confirm(`Deseja realmente excluir ${anexo.nome_arquivo}?`)) {
      return;
    }

    try {
      // Deleta do Firebase
      await deleteArquivo(anexo.caminho_firebase);

      // Deleta do banco
      const response = await fetchWithAuth(
        `/planejamentos/anexos/${anexo.id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Falha ao excluir anexo do banco de dados");
      }

      await carregarAnexos();
      alert("Anexo excluído com sucesso!");
    } catch (error) {
      alert(`Erro ao excluir anexo: ${error.message}`);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <ISOPlanejamentoModalStyles />
      <div
        className="modal-content"
        style={{ maxWidth: "600px" }}
        onClick={handleModalContentClick}
      >
        <div className="modal-header">
          <h2>
            Semana ISO {localInfo.semana_iso || localInfo.semana} -{" "}
            {localInfo.ano_iso || localInfo.ano}
          </h2>
          <button className="modal-close-button" onClick={onClose}>
            &times;
          </button>
        </div>

        <div
          style={{
            fontSize: ".9rem",
            color: "#555",
            marginBottom: "1rem",
            padding: ".5rem 1rem",
            background: "#f8f9fa",
            borderRadius: 4,
          }}
        >
          <p style={{ margin: ".25rem 0" }}>
            Status:{" "}
            <strong
              style={{
                color:
                  localInfo.status === "Aprovado"
                    ? "green"
                    : localInfo.status === "Reprovado"
                      ? "red"
                      : "orange",
              }}
            >
              {localInfo.status || "Pendente"}
            </strong>
          </p>
          <p style={{ margin: ".25rem 0" }}>
            Última modificação: {formatDate(localInfo.data_modificacao)}
          </p>
        </div>

        <div className="tabs-container" style={{ marginBottom: "1.5rem" }}>
          <button
            className={`tab-button ${
              activeTab === "planejamento" ? "active" : ""
            }`}
            onClick={() => setActiveTab("planejamento")}
          >
            Planejamento
          </button>
          <button
            className={`tab-button ${
              activeTab === "comentarios" ? "active" : ""
            }`}
            onClick={() => setActiveTab("comentarios")}
          >
            Comentários ({comentarios.length})
          </button>
        </div>

        {activeTab === "planejamento" && (
          <div>
            <div style={{ marginBottom: "1.5rem" }}>
              <h3
                style={{
                  fontSize: "1.1rem",
                  marginBottom: "1rem",
                  color: "#333",
                }}
              >
                📎 Anexos do Planejamento
              </h3>

              <div style={{ marginBottom: "1rem" }}>
                <label
                  htmlFor="anexo-planejamento-file"
                  style={{
                    display: "inline-block",
                    padding: "12px 24px",
                    background: isUploading
                      ? "#6c757d"
                      : "linear-gradient(135deg, #17a2b8 0%, #138496 100%)",
                    color: "#fff",
                    borderRadius: "8px",
                    cursor: isUploading ? "not-allowed" : "pointer",
                    fontSize: "1rem",
                    fontWeight: "600",
                    transition: "all 0.3s ease",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    border: "none",
                    userSelect: "none",
                  }}
                  onMouseOver={(e) => {
                    if (!isUploading) {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow =
                        "0 4px 8px rgba(0,0,0,0.15)";
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 2px 4px rgba(0,0,0,0.1)";
                  }}
                >
                  {isUploading
                    ? `📤 Enviando... ${uploadProgress}%`
                    : "📎 + Adicionar Anexo"}
                </label>
                <input
                  id="anexo-planejamento-file"
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                  style={{ display: "none" }}
                />
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "#666",
                    marginTop: "0.5rem",
                    fontStyle: "italic",
                  }}
                >
                  📄 Formatos aceitos: PDF, DOC, DOCX, XLS, XLSX (máx. 15MB)
                </p>
              </div>

              {anexos.length === 0 ? (
                <div
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    background: "#f8f9fa",
                    borderRadius: "8px",
                    color: "#6c757d",
                  }}
                >
                  <p style={{ fontSize: "2rem", margin: "0 0 0.5rem 0" }}>📄</p>
                  <p style={{ margin: 0 }}>Nenhum anexo adicionado ainda</p>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  {anexos.map((anexo) => (
                    <div
                      key={anexo.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px 16px",
                        background: "#f8f9fa",
                        borderRadius: "6px",
                        border: "1px solid #e0e0e0",
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
                          {anexo.nome_arquivo}
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "#666" }}>
                          {(anexo.tamanho / 1024 / 1024).toFixed(2)} MB •{" "}
                          {new Date(anexo.criado_em).toLocaleDateString(
                            "pt-BR",
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          onClick={() => handleDownloadAnexo(anexo)}
                          style={{
                            padding: "8px 16px",
                            background: "#28a745",
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
                            e.currentTarget.style.background = "#218838";
                            e.currentTarget.style.transform = "scale(1.05)";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = "#28a745";
                            e.currentTarget.style.transform = "scale(1)";
                          }}
                        >
                          ⬇️ Baixar
                        </button>
                        <button
                          onClick={() => handleDeleteAnexo(anexo)}
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
                            e.currentTarget.style.background = "#c82333";
                            e.currentTarget.style.transform = "scale(1.05)";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = "#dc3545";
                            e.currentTarget.style.transform = "scale(1)";
                          }}
                        >
                          🗑️ Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "comentarios" && (
          <div style={{ marginBottom: "1.5rem", position: "relative" }}>
            {isRefreshing && (
              <div
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  background: "#007bff",
                  color: "#fff",
                  padding: "8px 16px",
                  borderRadius: 20,
                  fontSize: ".85rem",
                  fontWeight: 600,
                  zIndex: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 2px 8px rgba(0,123,255,0.3)",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              >
                <span
                  style={{
                    width: 12,
                    height: 12,
                    border: "2px solid #fff",
                    borderTop: "2px solid transparent",
                    borderRadius: "50%",
                    animation: "spin .8s linear infinite",
                  }}
                ></span>
                Atualizando...
              </div>
            )}
            <ListaComentarios
              comentarios={comentariosParaLista}
              usuarioAtual={{ id: user.userId, cargo: user.cargo }}
              onComentarioExcluido={handleComentarioExcluido}
            />
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Adicione um comentário sobre o planejamento..."
              style={{
                width: "100%",
                minHeight: 100,
                padding: 8,
                border: "1px solid #ccc",
                borderRadius: 4,
                resize: "vertical",
              }}
            />
            <div style={{ textAlign: "right", marginTop: ".5rem" }}>
              <button
                onClick={handleAddComment}
                disabled={isSubmitting || !newComment.trim()}
                style={{
                  padding: "9px 16px",
                  cursor: "pointer",
                  background: "#17a2b8",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  fontSize: 14,
                }}
              >
                {isSubmitting ? "Enviando..." : "Confirmar Comentário"}
              </button>
            </div>
          </div>
        )}

        {canModerate && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "1rem",
              borderTop: "1px solid #eee",
              paddingTop: "1.5rem",
            }}
          >
            <button
              onClick={() => handleUpdateStatus("Reprovado")}
              style={{
                padding: "10px 20px",
                cursor: "pointer",
                background: "#dc3545",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: "1rem",
              }}
              disabled={isSubmitting || localInfo.status === "Reprovado"}
            >
              Reprovar
            </button>
            <button
              onClick={() => handleUpdateStatus("Aprovado")}
              style={{
                padding: "10px 20px",
                cursor: "pointer",
                background: "#28a745",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: "1rem",
              }}
              disabled={isSubmitting || localInfo.status === "Aprovado"}
            >
              Aprovar
            </button>
          </div>
        )}

        {isAdminGeral && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "1rem",
            }}
          >
            <button
              onClick={async () => {
                if (
                  !window.confirm(
                    "Tem certeza que deseja excluir este planejamento?",
                  )
                )
                  return;
                try {
                  const resp = await fetchWithAuth(
                    `/planejamentos/${localInfo.id_planejamento}`,
                    { method: "DELETE" },
                  );
                  if (!resp.ok)
                    throw new Error("Falha ao excluir planejamento.");
                  onRefresh?.();
                  onClose();
                  alert("Planejamento excluído com sucesso.");
                } catch (e) {
                  alert(`Erro: ${e.message}`);
                }
              }}
              style={{
                padding: "10px 20px",
                cursor: "pointer",
                background: "#6b7280",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: "1rem",
              }}
              type="button"
            >
              Excluir Planejamento
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ISOPlanejamentoModal;
