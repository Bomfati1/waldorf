import React, { useState, useEffect } from "react";
import { getApiUrl, API_URL, fetchWithAuth } from "../config/api";
import { useNavigate } from "react-router-dom";
import { useModal } from "../context/ModalContext";
import ModalBase from "./ModalBase";
import InputWithHint from "./InputWithHint";
import SelectWithHint from "./SelectWithHint";
import TextareaWithHint from "./TextareaWithHint";
import ResponsavelCPF from "./ResponsavelCPF";
import jsPDF from "jspdf";
import { drawHeader, drawFooter } from "../utils/pdfUtils";
import "../css/FormLayout.css";

const EditAlunoModal = ({ alunoData, turmas, onClose, onSave }) => {
  const { openModal, closeModal, getZIndex } = useModal();
  const modalId = `edit-aluno-modal-${alunoData.aluno_id}`;

  const [formData, setFormData] = useState(alunoData);
  const [responsaveisList, setResponsaveisList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [linkRespOpen, setLinkRespOpen] = useState(false);
  const [respSelection, setRespSelection] = useState({
    familiaId: null,
    cpf: "",
    data: null,
  });
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [showAnexos, setShowAnexos] = useState(false);
  const [anexos, setAnexos] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    openModal(modalId);
    return () => closeModal(modalId);
  }, []);

  // Função para formatar telefone
  const formatPhone = (phone) => {
    if (!phone) return "";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(
        7
      )}`;
    } else if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(
        6
      )}`;
    }
    return phone;
  };

  useEffect(() => {
    setFormData(alunoData);
  }, [alunoData]);

  // Carregar responsáveis vinculados (N:N)
  useEffect(() => {
    const fetchResponsaveis = async () => {
      try {
        const res = await fetch(
          getApiUrl(`/alunos/${alunoData.aluno_id}/responsaveis`),
          { credentials: "include" }
        );
        if (res.ok) {
          const data = await res.json();
          setResponsaveisList(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error("Erro ao carregar responsáveis do aluno:", e);
      }
    };
    if (alunoData?.aluno_id) fetchResponsaveis();
  }, [alunoData?.aluno_id]);

  // Carregar anexos do aluno
  useEffect(() => {
    const fetchAnexos = async () => {
      try {
        const res = await fetch(
          getApiUrl(`/alunos/${alunoData.aluno_id}/anexos`),
          { credentials: "include" }
        );
        if (res.ok) {
          const data = await res.json();
          setAnexos(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error("Erro ao carregar anexos do aluno:", e);
      }
    };
    if (alunoData?.aluno_id && showAnexos) fetchAnexos();
  }, [alunoData?.aluno_id, showAnexos]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = async (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Por favor, selecione apenas arquivos de imagem.");
      setMessageType("error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("A imagem deve ter no máximo 5MB.");
      setMessageType("error");
      return;
    }

    setUploading(true);
    setMessage("");
    setMessageType("");

    const uploadFormData = new FormData();
    uploadFormData.append("alunoPhoto", file);

    try {
      const response = await fetch(
        getApiUrl(`/alunos/${alunoData.aluno_id}/upload-photo`),
        {
          method: "POST",
          body: uploadFormData,
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setMessageType("success");
        setFormData((prev) => ({ ...prev, foto_perfil: data.imageUrl }));
      } else {
        setMessage(data.error || "Erro ao fazer upload da foto.");
        setMessageType("error");
      }
    } catch (error) {
      setMessage("Erro de conexão. Tente novamente.");
      setMessageType("error");
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!formData.foto_perfil) return;

    if (!window.confirm("Tem certeza que deseja remover a foto do aluno?")) {
      return;
    }

    setUploading(true);
    setMessage("");
    setMessageType("");

    try {
      const response = await fetch(
        getApiUrl(`/alunos/${alunoData.aluno_id}/remove-photo`),
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setMessageType("success");
        setFormData((prev) => ({ ...prev, foto_perfil: null }));
      } else {
        setMessage(data.error || "Erro ao remover a foto.");
        setMessageType("error");
      }
    } catch (error) {
      setMessage("Erro de conexão. Tente novamente.");
      setMessageType("error");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let turmaIdToSend;

    // Lógica para turma_id:
    // - Se for "sem_turma", envia null para remover da turma
    // - Se for vazio "", mantém undefined (não altera)
    // - Se for um número, converte e envia
    if (formData.turma_id === "sem_turma") {
      turmaIdToSend = null;
    } else if (formData.turma_id === "" || formData.turma_id === undefined) {
      turmaIdToSend = undefined; // Mantém como está
    } else {
      turmaIdToSend = Number(formData.turma_id);
    }

    const payload = {
      ...formData,
      turma_id: turmaIdToSend,
    };

    console.log("[EDIT ALUNO] Payload enviado:", payload);
    onSave(payload);
  };

  const refetchAlunoDetalhes = async () => {
    try {
      const response = await fetch(
        getApiUrl(`/alunos/${alunoData.aluno_id}/detalhes`),
        { credentials: "include" }
      );
      if (response.ok) {
        const data = await response.json();
        setFormData(data);
      }
    } catch (e) {
      console.error("Erro ao recarregar detalhes do aluno:", e);
    }
  };

  const refetchResponsaveis = async () => {
    try {
      const res = await fetch(
        getApiUrl(`/alunos/${alunoData.aluno_id}/responsaveis`),
        { credentials: "include" }
      );
      if (res.ok) {
        const data = await res.json();
        setResponsaveisList(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Erro ao recarregar responsáveis:", e);
    }
  };

  const vincularResponsavelExistente = async () => {
    if (!respSelection.familiaId) return;
    try {
      const resp = await fetch(
        getApiUrl(`/alunos/${alunoData.aluno_id}/vincular-responsavel`),
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ familia_id: respSelection.familiaId }),
        }
      );
      const data = await resp.json();
      if (!resp.ok)
        throw new Error(data.error || "Falha ao vincular responsável");
      setMessage("Responsável vinculado com sucesso.");
      setMessageType("success");
      await refetchAlunoDetalhes();
      await refetchResponsaveis();
      setLinkRespOpen(false);
    } catch (e) {
      setMessage(e.message);
      setMessageType("error");
    }
  };

  const vincularResponsavelPorId = async (familiaId) => {
    if (!familiaId) return;
    try {
      const resp = await fetch(
        getApiUrl(`/alunos/${alunoData.aluno_id}/vincular-responsavel`),
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ familia_id: familiaId }),
        }
      );
      const data = await resp.json();
      if (!resp.ok)
        throw new Error(data.error || "Falha ao vincular responsável");
      setMessage("Responsável vinculado com sucesso.");
      setMessageType("success");
      await refetchAlunoDetalhes();
      await refetchResponsaveis();
      setLinkRespOpen(false);
    } catch (e) {
      setMessage(e.message);
      setMessageType("error");
    }
  };

  const criarEVincularResponsavel = async () => {
    if (!respSelection.cpf) {
      setMessage("Informe um CPF válido do responsável para criar e vincular.");
      setMessageType("error");
      return;
    }
    try {
      // Cria o responsável usando os dados do formulário atual
      const criar = await fetchWithAuth("/responsaveis", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome_completo: formData.nome_responsavel,
          email: formData.email,
          telefone: formData.telefone,
          outro_telefone: formData.outro_telefone,
          cpf: respSelection.cpf,
        }),
      });
      const novo = await criar.json();
      if (!criar.ok)
        throw new Error(novo.error || "Falha ao criar responsável");

      // Vincula ao aluno
      setRespSelection((prev) => ({ ...prev, familiaId: novo.id }));
      const vinc = await fetch(
        getApiUrl(`/alunos/${alunoData.aluno_id}/vincular-responsavel`),
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ familia_id: novo.id }),
        }
      );
      const vincData = await vinc.json();
      if (!vinc.ok)
        throw new Error(vincData.error || "Falha ao vincular novo responsável");

      setMessage("Novo responsável criado e vinculado com sucesso.");
      setMessageType("success");
      await refetchAlunoDetalhes();
      await refetchResponsaveis();
      setLinkRespOpen(false);
    } catch (e) {
      setMessage(e.message);
      setMessageType("error");
    }
  };

  const desvincularResponsavel = async (familiaId) => {
    if (!familiaId) return;
    if (!window.confirm("Desvincular este responsável do aluno?")) return;
    try {
      const resp = await fetch(
        getApiUrl(`/alunos/${alunoData.aluno_id}/responsaveis/${familiaId}`),
        { method: "DELETE", credentials: "include" }
      );
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Falha ao desvincular");
      setMessage("Responsável desvinculado.");
      setMessageType("success");
      await refetchResponsaveis();
    } catch (e) {
      setMessage(e.message);
      setMessageType("error");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setMessage("O arquivo deve ter no máximo 10MB.");
      setMessageType("error");
      return;
    }

    setUploadingFile(true);
    setMessage("");

    const formData = new FormData();
    formData.append("arquivo", file);

    try {
      const response = await fetch(
        getApiUrl(`/alunos/${alunoData.aluno_id}/anexos`),
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao fazer upload do arquivo");
      }

      setMessage("Arquivo enviado com sucesso!");
      setMessageType("success");

      // Recarregar lista de anexos
      const res = await fetch(
        getApiUrl(`/alunos/${alunoData.aluno_id}/anexos`),
        { credentials: "include" }
      );
      if (res.ok) {
        const anexosData = await res.json();
        setAnexos(Array.isArray(anexosData) ? anexosData : []);
      }
    } catch (error) {
      setMessage(error.message);
      setMessageType("error");
    } finally {
      setUploadingFile(false);
      e.target.value = "";
    }
  };

  const handleDeleteAnexo = async (anexoId) => {
    if (!window.confirm("Deseja realmente excluir este arquivo?")) return;

    try {
      const response = await fetch(
        getApiUrl(`/alunos/${alunoData.aluno_id}/anexos/${anexoId}`),
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao excluir arquivo");
      }

      setMessage("Arquivo excluído com sucesso!");
      setMessageType("success");

      // Recarregar lista de anexos
      const res = await fetch(
        getApiUrl(`/alunos/${alunoData.aluno_id}/anexos`),
        { credentials: "include" }
      );
      if (res.ok) {
        const anexosData = await res.json();
        setAnexos(Array.isArray(anexosData) ? anexosData : []);
      }
    } catch (error) {
      setMessage(error.message);
      setMessageType("error");
    }
  };

  const generatePresencaReport = async () => {
    if (!alunoData || !selectedYear) return;

    setGeneratingPDF(true);
    try {
      const resp = await fetch(
        getApiUrl(
          `/alunos/${alunoData.aluno_id}/presencas?ano=${selectedYear}`
        ),
        { credentials: "include" }
      );
      const data = await resp.json();

      if (!resp.ok) throw new Error(data.error || "Erro ao buscar presenças");

      const presencas = data.presencas || [];

      // Mapear status_presenca para texto legível
      const statusMap = {
        P: "Presente",
        F: "Falta",
        FJ: "Falta Justificada",
      };

      // Criar PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Header padronizado
      let yPosition = await drawHeader(doc, {
        title: "Relatório de Presença Individual",
        subtitle: `${alunoData.nome_aluno || "N/A"} • Turma: ${
          alunoData.turma_nome || "Sem turma"
        } • Ano: ${selectedYear}`,
      });

      // Informações do aluno
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("ALUNO:", 20, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(alunoData.nome_aluno || "N/A", 42, yPosition);
      yPosition += 8;

      // Turma
      doc.setFont("helvetica", "bold");
      doc.text("TURMA:", 20, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(alunoData.turma_nome || "Sem turma", 42, yPosition);
      yPosition += 8;

      // Ano letivo
      doc.setFont("helvetica", "bold");
      doc.text("ANO LETIVO:", 20, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(selectedYear.toString(), 54, yPosition);
      yPosition += 12;

      // Resumo estatístico
      const totalDias = presencas.length;
      const presentes = presencas.filter(
        (p) => p.status_presenca === "P"
      ).length;
      const ausentes = presencas.filter(
        (p) => p.status_presenca === "F"
      ).length;
      const justificados = presencas.filter(
        (p) => p.status_presenca === "FJ"
      ).length;

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("RESUMO ESTATÍSTICO:", 20, yPosition);
      yPosition += 8;

      doc.setFont("helvetica", "normal");
      doc.text(`• Total de Aulas: ${totalDias}`, 25, yPosition);
      yPosition += 6;
      doc.text(`• Presenças: ${presentes}`, 25, yPosition);
      yPosition += 6;
      doc.text(`• Faltas: ${ausentes}`, 25, yPosition);
      yPosition += 6;
      doc.text(`• Faltas Justificadas: ${justificados}`, 25, yPosition);
      yPosition += 12;

      // Tabela de presenças
      if (presencas.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.text("HISTÓRICO DETALHADO:", 20, yPosition);
        yPosition += 8;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");

        presencas.forEach((p, idx) => {
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = 20;
          }

          const data = new Date(p.data_aula).toLocaleDateString("pt-BR");
          const status = statusMap[p.status_presenca] || "N/A";
          const obs = p.observacao ? ` - ${p.observacao}` : "";

          doc.text(`${data} - ${status}${obs}`, 25, yPosition);
          yPosition += 6;
        });
      } else {
        doc.setFontSize(11);
        doc.text(
          "Nenhum registro de presença encontrado para este ano.",
          20,
          yPosition
        );
      }

      // Footer padronizado
      drawFooter(doc);

      // Salvar PDF
      doc.save(
        `presenca_${alunoData.nome_aluno || "aluno"}_${selectedYear}.pdf`
      );

      setMessage("Relatório gerado com sucesso!");
      setMessageType("success");
    } catch (e) {
      setMessage(e.message || "Erro ao gerar relatório");
      setMessageType("error");
    } finally {
      setGeneratingPDF(false);
    }
  };

  return (
    <ModalBase
      isOpen={true}
      onClose={onClose}
      title="✏️ Editar Aluno"
      size="full"
      zIndex={getZIndex(modalId)}
      showCloseButton={false}
    >
      {/* Header customizado com botões adicionais */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "0.5rem",
          marginBottom: "1.5rem",
          paddingBottom: "1rem",
          borderBottom: "1px solid #eee",
        }}
      >
        <button
          type="button"
          onClick={() => setShowAnexos((v) => !v)}
          title="Gerenciar documentos e anexos do aluno"
          style={{
            padding: "8px 16px",
            backgroundColor: showAnexos ? "#007bff" : "#f8f9fa",
            color: showAnexos ? "white" : "#333",
            border: "1px solid #dee2e6",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          📎 {showAnexos ? "Fechar Anexos" : "Documentos"}
        </button>
        <button
          onClick={onClose}
          style={{
            padding: "8px 16px",
            backgroundColor: "#f8f9fa",
            color: "#666",
            border: "1px solid #dee2e6",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "18px",
            lineHeight: "1",
          }}
        >
          ×
        </button>
      </div>

      <div>
        <form onSubmit={handleSubmit}>
          {/* Mensagens de Feedback */}
          {message && (
            <div className={`message ${messageType}`}>
              {messageType === "success" ? "✓" : "⚠"} {message}
            </div>
          )}

          {/* Área de Anexos */}
          {showAnexos && (
            <div
              className="form-section"
              style={{
                border: "2px solid #007bff",
                padding: "1.5rem",
                borderRadius: "8px",
                backgroundColor: "#f8f9fa",
                marginBottom: "1.5rem",
              }}
            >
              <h3 className="form-section-title" style={{ marginTop: 0 }}>
                📎 Documentos e Anexos
              </h3>
              <p style={{ color: "#555", marginBottom: "1rem" }}>
                Faça upload de documentos do aluno (máximo 10MB por arquivo).
              </p>

              {/* Upload de arquivo */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  htmlFor="file-upload"
                  style={{
                    display: "inline-block",
                    padding: "10px 20px",
                    backgroundColor: uploadingFile ? "#ccc" : "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: uploadingFile ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  {uploadingFile ? "📤 Enviando..." : "📤 Adicionar Arquivo"}
                </label>
                <input
                  type="file"
                  id="file-upload"
                  style={{ display: "none" }}
                  onChange={handleFileUpload}
                  disabled={uploadingFile}
                />
              </div>

              {/* Lista de anexos */}
              {anexos.length > 0 ? (
                <div>
                  <h4 style={{ marginTop: 0, marginBottom: "1rem" }}>
                    Arquivos:
                  </h4>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {anexos.map((anexo) => (
                      <li
                        key={anexo.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "12px",
                          backgroundColor: "white",
                          border: "1px solid #dee2e6",
                          borderRadius: "6px",
                          marginBottom: "8px",
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div
                            style={{ fontWeight: "500", marginBottom: "4px" }}
                          >
                            📄 {anexo.nome_original}
                          </div>
                          <div style={{ fontSize: "12px", color: "#666" }}>
                            Enviado em:{" "}
                            {new Date(anexo.data_upload).toLocaleDateString(
                              "pt-BR"
                            )}
                            {anexo.tamanho &&
                              ` • ${(anexo.tamanho / 1024).toFixed(1)} KB`}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <a
                            href={`${API_URL}${anexo.caminho_arquivo}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: "6px 12px",
                              backgroundColor: "#007bff",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              textDecoration: "none",
                              fontSize: "12px",
                              cursor: "pointer",
                            }}
                          >
                            👁️ Abrir
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDeleteAnexo(anexo.id)}
                            style={{
                              padding: "6px 12px",
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              fontSize: "12px",
                              cursor: "pointer",
                            }}
                          >
                            🗑️ Excluir
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p style={{ color: "#999", fontStyle: "italic" }}>
                  Nenhum documento anexado ainda.
                </p>
              )}
            </div>
          )}

          {/* Seção de Foto - Destaque */}
          <div className="photo-upload-section full-width">
            <div className="photo-preview-container">
              <div className="photo-preview">
                {formData.foto_perfil ? (
                  <img
                    src={`${API_URL}${formData.foto_perfil}`}
                    alt="Foto do aluno"
                  />
                ) : (
                  <div className="photo-placeholder">
                    {formData.nome_aluno
                      ? formData.nome_aluno.charAt(0).toUpperCase()
                      : "A"}
                  </div>
                )}
              </div>
            </div>

            <div className="photo-actions-container">
              <h3>Foto de Perfil</h3>
              <p>
                Adicione ou altere a foto do aluno. Tamanho máximo: 5MB.
                Formatos aceitos: JPG, PNG, GIF.
              </p>
              <div className="photo-buttons">
                <label
                  htmlFor="aluno-photo-upload"
                  className={`photo-upload-btn ${uploading ? "disabled" : ""}`}
                >
                  {uploading ? (
                    <>
                      <span className="loading-spinner"></span> Enviando...
                    </>
                  ) : (
                    <>📷 Alterar Foto</>
                  )}
                </label>
                {formData.foto_perfil && (
                  <button
                    type="button"
                    className="photo-remove-btn"
                    onClick={handleRemovePhoto}
                    disabled={uploading}
                  >
                    🗑️ Remover Foto
                  </button>
                )}
                <input
                  type="file"
                  id="aluno-photo-upload"
                  accept="image/*"
                  style={{ display: "none" }}
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      handlePhotoUpload(file);
                    }
                    e.target.value = "";
                  }}
                />
              </div>
            </div>
          </div>

          {/* Seção: Relatório de Presença */}
          <div
            className="form-section mt-3"
            style={{
              border: "1px solid #dee2e6",
              padding: "1.5rem",
              borderRadius: "8px",
              backgroundColor: "#f8f9fa",
            }}
          >
            <h3 className="form-section-title">📊 Relatório de Presença</h3>
            <p style={{ color: "#555", marginBottom: "1rem" }}>
              Gere um relatório individual de presença do aluno para o ano
              selecionado.
            </p>
            <div
              style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}
            >
              <div
                className="form-group"
                style={{ marginBottom: 0, flex: "0 0 200px" }}
              >
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "500",
                  }}
                >
                  Ano Letivo
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #ced4da",
                    borderRadius: "4px",
                    fontSize: "14px",
                  }}
                >
                  {Array.from(
                    { length: 10 },
                    (_, i) => new Date().getFullYear() - i
                  ).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={generatePresencaReport}
                disabled={generatingPDF}
                style={{
                  padding: "10px 20px",
                  backgroundColor: generatingPDF ? "#ccc" : "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: generatingPDF ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {generatingPDF ? (
                  <>
                    <span className="loading-spinner"></span> Gerando...
                  </>
                ) : (
                  <>📄 Gerar Relatório</>
                )}
              </button>
            </div>
          </div>

          {/* Seção: Dados do Aluno */}
          <div className="form-section mt-3">
            <h3 className="form-section-title">👤 Dados do Aluno</h3>

            <div className="form-grid grid-2-cols">
              <div className="form-group full-width">
                <InputWithHint
                  label="Nome Completo"
                  hint="Nome completo do aluno conforme consta no documento de identidade"
                  name="nome_aluno"
                  type="text"
                  value={formData.nome_aluno || ""}
                  onChange={handleChange}
                  required
                  placeholder="Digite o nome completo do aluno"
                />
              </div>

              <div className="form-group">
                <InputWithHint
                  label="Data de Nascimento"
                  hint="Data de nascimento do aluno"
                  type="date"
                  name="data_nascimento"
                  value={
                    formData.data_nascimento
                      ? formData.data_nascimento.split("T")[0]
                      : ""
                  }
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <SelectWithHint
                  label="Status Financeiro"
                  hint="Situação de pagamento: Integral (valor total) ou Bolsista (possui bolsa/desconto)"
                  name="status_pagamento"
                  value={formData.status_pagamento || "Integral"}
                  onChange={handleChange}
                >
                  <option value="Integral">Integral</option>
                  <option value="Bolsista">Bolsista</option>
                </SelectWithHint>
              </div>

              <div className="form-group full-width">
                <TextareaWithHint
                  label="Informações de Saúde"
                  hint="Alergias, medicamentos em uso, restrições alimentares ou condições médicas relevantes"
                  name="informacoes_saude"
                  value={formData.informacoes_saude || ""}
                  onChange={handleChange}
                  placeholder="Alergias, medicamentos, condições especiais, etc."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Seção: Turma */}
          <div className="form-section mt-3">
            <h3 className="form-section-title">🎓 Informações de Turma</h3>

            <div className="form-grid grid-2-cols">
              <div className="form-group">
                <label htmlFor="turma_atual">Turma Atual</label>
                <input
                  id="turma_atual"
                  type="text"
                  value={
                    formData.nome_turma
                      ? `${formData.nome_turma} (${
                          formData.periodo?.replace(/^\w/, (c) =>
                            c.toUpperCase()
                          ) || ""
                        }) - ${formData.ano_letivo || ""}`
                      : "Nenhuma turma associada"
                  }
                  disabled
                />
              </div>

              <div className="form-group">
                <label htmlFor="turma_id">Alterar Turma</label>
                <select
                  id="turma_id"
                  name="turma_id"
                  value={
                    formData.turma_id !== undefined &&
                    formData.turma_id !== null
                      ? String(formData.turma_id)
                      : ""
                  }
                  onChange={handleChange}
                  style={{
                    padding: "10px",
                    border: "1px solid #ced4da",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                >
                  <option value="">Manter como está</option>
                  <option value="sem_turma">🚫 Sem Turma</option>
                  <optgroup label="Turmas Disponíveis">
                    {turmas?.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nome_turma} ({t.periodo}) - {t.ano_letivo || ""}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <small
                  style={{
                    color: "#6c757d",
                    marginTop: "4px",
                    display: "block",
                  }}
                >
                  {formData.turma_id === null ||
                  formData.turma_id === undefined ||
                  formData.turma_id === ""
                    ? "⚠️ Aluno atualmente sem turma"
                    : "Selecione 'Sem Turma' para remover da turma atual"}
                </small>
              </div>
            </div>
          </div>

          {/* Seção: Responsável */}
          <div className="form-section mt-3">
            <h3 className="form-section-title">👨‍👩‍👧 Dados do Responsável</h3>
            {responsaveisList?.length > 0 && (
              <div
                className="form-group full-width"
                style={{
                  border: "1px solid #eee",
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 12,
                }}
              >
                <h4 style={{ marginTop: 0 }}>
                  Responsáveis vinculados ({responsaveisList.length})
                </h4>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {responsaveisList.map((r) => (
                    <li
                      key={r.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 0",
                        borderBottom: "1px dashed #eee",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>
                          {r.nome_completo || r.nome_responsavel}
                        </div>
                        <div style={{ color: "#555", fontSize: 13 }}>
                          {r.telefone || "sem telefone"}
                          {r.outro_telefone ? ` • ${r.outro_telefone}` : ""}
                        </div>
                        <div style={{ color: "#555", fontSize: 13 }}>
                          {r.email || "sem email"}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-light"
                        onClick={() => desvincularResponsavel(r.id)}
                        title="Desvincular"
                      >
                        ❌ Desvincular
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {linkRespOpen && (
              <div
                className="form-group full-width"
                style={{
                  border: "1px dashed #ccc",
                  padding: "12px",
                  borderRadius: 8,
                  marginBottom: 12,
                }}
              >
                <h4 style={{ marginTop: 0, marginBottom: 8 }}>
                  Vincular novo responsável
                </h4>
                <p style={{ marginTop: 0, color: "#555" }}>
                  Busque por CPF para usar um responsável existente, ou preencha
                  os campos abaixo e clique em "Criar e Vincular".
                </p>
                <ResponsavelCPF
                  onResponsavelFound={(data) => {
                    // Sinaliza seleção e preenche os campos do responsável automaticamente
                    setRespSelection({
                      familiaId: data.id,
                      cpf: data.cpf_responsavel || data.cpf,
                      data,
                    });
                    setFormData((prev) => ({
                      ...prev,
                      nome_responsavel:
                        data.nome_responsavel || prev.nome_responsavel || "",
                      email: data.email || prev.email || "",
                      telefone: data.telefone || prev.telefone || "",
                      outro_telefone:
                        data.outro_telefone || prev.outro_telefone || "",
                    }));
                    setMessage(
                      "Responsável encontrado. Dados preenchidos automaticamente."
                    );
                    setMessageType("success");
                  }}
                  onResponsavelNotFound={({ cpf_responsavel }) => {
                    // Mantém dados já digitados e guarda o CPF para criação
                    setRespSelection({
                      familiaId: null,
                      cpf: cpf_responsavel,
                      data: null,
                    });
                    setMessage(
                      "CPF não cadastrado. Preencha os dados para criar um novo responsável."
                    );
                    setMessageType("warning");
                  }}
                  onVincularResponsavel={(data) =>
                    vincularResponsavelPorId(data.id)
                  }
                />
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!respSelection.familiaId}
                    onClick={vincularResponsavelExistente}
                  >
                    ✓ Vincular responsável existente
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={criarEVincularResponsavel}
                  >
                    ➕ Criar e Vincular
                  </button>
                </div>
              </div>
            )}

            <div className="form-grid grid-2-cols">
              <div className="form-group full-width">
                <InputWithHint
                  label="Nome do Responsável"
                  hint="Nome completo do responsável legal pelo aluno"
                  name="nome_responsavel"
                  type="text"
                  value={formData.nome_responsavel || ""}
                  onChange={handleChange}
                  required
                  placeholder="Nome completo do responsável"
                />
              </div>

              <div className="form-group">
                <InputWithHint
                  label="Telefone Principal"
                  hint="Telefone principal para contato de emergência. Formato: (00) 00000-0000"
                  type="tel"
                  name="telefone"
                  value={formData.telefone || ""}
                  onChange={handleChange}
                  required
                  placeholder="(00) 00000-0000"
                />
                {formData.telefone && (
                  <small style={{ color: "#2a5298", marginTop: "0.25rem" }}>
                    📞 {formatPhone(formData.telefone)}
                  </small>
                )}
              </div>

              <div className="form-group">
                <InputWithHint
                  label="Telefone Adicional"
                  hint="Telefone secundário para contato alternativo (opcional)"
                  type="tel"
                  name="outro_telefone"
                  value={formData.outro_telefone || ""}
                  onChange={handleChange}
                  placeholder="(00) 00000-0000 (opcional)"
                />
                {formData.outro_telefone && formData.outro_telefone.trim() && (
                  <small style={{ color: "#28a745", marginTop: "0.25rem" }}>
                    ✓ {formatPhone(formData.outro_telefone)}
                  </small>
                )}
              </div>

              <div className="form-group">
                <InputWithHint
                  label="Email"
                  hint="Email do responsável para comunicações e notificações importantes"
                  type="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={handleChange}
                  required
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer Fixo */}
        <div
          style={{
            marginTop: "2rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid #eee",
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.75rem",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "10px 20px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={uploading}
            style={{
              padding: "10px 20px",
              backgroundColor: uploading ? "#ccc" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: uploading ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            {uploading ? (
              <>
                <span className="loading-spinner"></span> Salvando...
              </>
            ) : (
              <>💾 Salvar Alterações</>
            )}
          </button>
        </div>
      </div>
    </ModalBase>
  );
};

export default EditAlunoModal;
