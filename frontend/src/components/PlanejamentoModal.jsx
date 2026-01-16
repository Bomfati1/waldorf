import React, { useEffect, useMemo, useState } from "react";
import { getApiUrl, API_URL } from "../config/api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "../context/AuthContext";
import ModalBase from "./ModalBase";
import ListaComentarios from "./ListaComentarios";

const PlanejamentoModalStyles = () => (
  <style>{`
    .tabs-container { display:flex; border-bottom:1px solid #ccc; margin-bottom:1.5rem; }
    .tab-button { padding:10px 20px; cursor:pointer; border:none; background:transparent; border-bottom:3px solid transparent; margin-bottom:-1px; font-size:1rem; color:#555 }
    .tab-button.active { border-bottom-color:#17a2b8; color:#000; font-weight:600 }
    @keyframes spin { 0%{transform:rotate(0)} 100%{transform:rotate(360deg)} }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.7} }
    .delete-button{ background:transparent; border:none; color:#dc3545; font-size:20px; cursor:pointer }
    .submit-button{ margin-left:.5rem; padding:8px 16px; background:#17a2b8; color:#fff; border:none; border-radius:4px; cursor:pointer }
  `}</style>
);

const PlanejamentoModal = ({ info, onClose, onUpdate, onDelete }) => {
  if (!info) return null;

  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("planejamento");

  const [localInfo, setLocalInfo] = useState(info);
  const [anexos, setAnexos] = useState([]);
  const [comentarios, setComentarios] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isoInfo, setIsoInfo] = useState(null);
  const [isoLoading, setIsoLoading] = useState(false);

  useEffect(() => {
    setLocalInfo(info);
    setAnexos(info.anexos || []);
    setComentarios(info.comentarios || []);
    // Busca informações extras da semana ISO para exibir calendário/período, quando aplicável
    const hasISO = info.ano_iso && info.semana_iso;
    if (hasISO) {
      (async () => {
        try {
          setIsoLoading(true);
          const resp = await fetch(
            getApiUrl(`/planejamentos/semana-iso/${info.ano_iso}/${info.semana_iso}`),
            { credentials: "include" }
          );
          if (resp.ok) {
            const data = await resp.json();
            setIsoInfo(data);
          } else {
            setIsoInfo(null);
          }
        } catch (e) {
          setIsoInfo(null);
        } finally {
          setIsoLoading(false);
        }
      })();
    } else {
      setIsoInfo(null);
    }
  }, [info]);

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

  const formatDate = (dateString) => {
    if (!dateString) return "Data não informada";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Data em formato inválido";
    return date.toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  const refetchPlanejamento = async () => {
    const resp = await fetch(
      getApiUrl(`/planejamentos/${localInfo.id_planejamento}`),
      { credentials: "include" }
    );
    if (!resp.ok) throw new Error("Falha ao recarregar planejamento.");
    const data = await resp.json();
    setLocalInfo(data);
    setAnexos(data.anexos || []);
    setComentarios(data.comentarios || []);
    onUpdate?.(data);
  };

  const handleUploadAttachment = async () => {
    if (!selectedFile) return alert("Por favor, selecione um arquivo.");
    const allowedExt = ["pdf", "doc", "docx", "odt"];
    const allowedMime = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.oasis.opendocument.text",
    ];
    const name = selectedFile.name || "";
    const ext = name.split(".").pop().toLowerCase();
    const type = selectedFile.type;
    if (!allowedExt.includes(ext) && !allowedMime.includes(type)) {
      return alert(
        "Tipo de arquivo não permitido. Envie PDF, DOC, DOCX ou ODT."
      );
    }
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("anexo", selectedFile);

    // Indica primeiro anexo (paridade com página mensal)
    const isFirstAttachment = localInfo.anexos?.length === 0;
    if (isFirstAttachment) formData.append("set_creation_date", "true");

    try {
      const response = await fetch(
        getApiUrl(`/planejamentos/${localInfo.id_planejamento}/anexos`),
        { method: "POST", credentials: "include", body: formData }
      );
      if (!response.ok) throw new Error("Falha ao enviar anexo.");
      await refetchPlanejamento();
      setSelectedFile(null);
      const input = document.getElementById("planejamento-upload");
      if (input) input.value = "";
      alert("Anexo enviado com sucesso!");
    } catch (error) {
      alert(`Erro: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAttachment = async (anexoId) => {
    if (!window.confirm("Tem certeza que deseja excluir este anexo?")) return;
    try {
      const response = await fetch(getApiUrl(`/anexos/${anexoId}`), {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Falha ao excluir anexo.");
      await refetchPlanejamento();
      alert("Anexo excluído com sucesso!");
    } catch (error) {
      alert(`Erro: ${error.message}`);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    setIsRefreshing(true);
    try {
      const response = await fetch(
        getApiUrl(`/planejamentos/${localInfo.id_planejamento}/comentarios`),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            usuario_id: user.userId,
            texto_comentario: newComment,
          }),
        }
      );
      if (!response.ok) throw new Error("Falha ao adicionar comentário.");
      await refetchPlanejamento();
      setNewComment("");
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
    } catch (error) {
      console.error("Erro ao recarregar planejamento:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (
      !window.confirm(
        `Tem certeza que deseja ${newStatus.toLowerCase()} este planejamento?`
      )
    )
      return;
    setIsSubmitting(true);
    try {
      const response = await fetch(
        getApiUrl(`/planejamentos/${localInfo.id_planejamento}/status`),
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: newStatus }),
        }
      );
      if (!response.ok) throw new Error("Falha ao atualizar o status.");
      const updated = await response.json();
      alert(`Planejamento ${newStatus.toLowerCase()} com sucesso!`);
      setLocalInfo(updated);
      onUpdate?.(updated);
      onClose();
    } catch (error) {
      alert(`Erro: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gera o título com o nome do mês
  const getTituloMes = () => {
    if (!localInfo.mes || !localInfo.ano) return "Planejamento";
    const nomeMes = format(new Date(localInfo.ano, localInfo.mes - 1), "MMMM", {
      locale: ptBR,
    });
    return `${nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)} ${
      localInfo.ano
    }`;
  };

  // Permissões
  const userCargo = String(user?.cargo || "").toLowerCase();
  const isAdminGeral = userCargo === "administrador geral";
  const canModerate =
    userCargo === "administrador pedagógico" ||
    userCargo === "administrador geral";

  return (
    <ModalBase
      isOpen={true}
      onClose={onClose}
      title={getTituloMes()}
      size="medium"
      closeOnOverlayClick={false}
    >
      <PlanejamentoModalStyles />

      {/* Bloco de informações de semana ISO com mini calendário, igual à ideia do PlanejamentosISO */}
      {isoInfo && (
        <div
          style={{
            border: "1px solid #eee",
            borderRadius: 8,
            padding: "12px 14px",
            marginBottom: "16px",
            background: "#fafafa",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <div style={{ fontWeight: 700, color: "#2c3e50" }}>
              Semana {localInfo.semana_iso} · {localInfo.ano_iso}
            </div>
            <div
              style={{
                fontSize: 13,
                color: "#7f8c8d",
                background: "#ecf0f1",
                padding: "4px 10px",
                borderRadius: 8,
              }}
            >
              {new Date(isoInfo.inicioSemana).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
              })}{" "}
              -
              {new Date(isoInfo.fimSemana).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
              })}
            </div>
          </div>

          {isoInfo?.compartilhamento &&
            Array.isArray(isoInfo.compartilhamento.nomesMeses) &&
            isoInfo.compartilhamento.nomesMeses.length > 1 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 10px",
                  background: "#ffe5e5",
                  color: "#c0392b",
                  border: "1px solid #ffcccc",
                  borderRadius: 8,
                  marginBottom: 8,
                }}
              >
                <span>🔗</span>
                <span>
                  Também em: {isoInfo.compartilhamento.nomesMeses.join(", ")}
                </span>
              </div>
            )}

          {Array.isArray(isoInfo.diasSemana) && (
            <div style={{ marginTop: 8 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: 4,
                  marginBottom: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#95a5a6",
                  textTransform: "uppercase",
                  textAlign: "center",
                }}
              >
                {["S", "T", "Q", "Q", "S", "S", "D"].map((d, i) => (
                  <div key={i}>{d}</div>
                ))}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: 4,
                }}
              >
                {isoInfo.diasSemana.map((dia) => (
                  <div
                    key={dia}
                    title={new Date(dia).toLocaleDateString("pt-BR")}
                    style={{
                      aspectRatio: "1 / 1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background:
                        "linear-gradient(135deg,#ecf0f1 0%,#d5dbdb 100%)",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#2c3e50",
                    }}
                  >
                    {new Date(dia).getDate()}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
          <div className="form-group" style={{ marginBottom: "1.5rem" }}>
            <label>Anexos</label>
            {anexos && anexos.length > 0 ? (
              <ul style={{ listStyle: "none", padding: 0, marginTop: ".5rem" }}>
                {anexos.map((anexo) => {
                  const caminhoDoArquivo =
                    anexo.path_arquivo ||
                    anexo.caminho_arquivo ||
                    anexo.caminho;
                  const nomeDoArquivo =
                    anexo.nome_original ||
                    anexo.nome_arquivo ||
                    (caminhoDoArquivo
                      ? caminhoDoArquivo.split("/").pop()
                      : "Anexo");
                  return (
                    <li
                      key={anexo.id_anexo}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: 8,
                        border: "1px solid #eee",
                        borderRadius: 4,
                        marginBottom: ".5rem",
                      }}
                    >
                      {caminhoDoArquivo ? (
                        <a
                          href={getApiUrl(`/${caminhoDoArquivo}`)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {nomeDoArquivo}
                        </a>
                      ) : (
                        <span style={{ color: "#dc3545", fontStyle: "italic" }}>
                          {nomeDoArquivo} (caminho inválido)
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteAttachment(anexo.id_anexo)}
                        className="delete-button"
                        title="Excluir anexo"
                      >
                        &times;
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p>Nenhum anexo encontrado.</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="planejamento-upload">Adicionar novo anexo</label>
            <input
              type="file"
              id="planejamento-upload"
              accept=".pdf,.doc,.docx,.odt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.oasis.opendocument.text"
              onChange={(e) => setSelectedFile(e.target.files[0])}
            />
            <button
              onClick={handleUploadAttachment}
              disabled={isSubmitting}
              className="submit-button"
            >
              {isSubmitting ? "Enviando..." : "Enviar Anexo"}
            </button>
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
            onClick={() =>
              onDelete?.(
                localInfo.id_planejamento,
                localInfo.mes,
                localInfo.semana
              )
            }
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
    </ModalBase>
  );
};

export default PlanejamentoModal;
