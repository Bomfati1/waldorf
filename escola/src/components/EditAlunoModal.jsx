import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import InputWithHint from "./InputWithHint";
import SelectWithHint from "./SelectWithHint";
import TextareaWithHint from "./TextareaWithHint";
import ResponsavelCPF from "./ResponsavelCPF";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import "../css/FormLayout.css";

const EditAlunoModal = ({ alunoData, turmas, onClose, onSave }) => {
  // Bloqueia o scroll do body enquanto o modal está aberto
  useBodyScrollLock(true);

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
  const navigate = useNavigate();

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
          `http://localhost:3001/alunos/${alunoData.aluno_id}/responsaveis`,
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
        `http://localhost:3001/alunos/${alunoData.aluno_id}/upload-photo`,
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
        `http://localhost:3001/alunos/${alunoData.aluno_id}/remove-photo`,
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
    const payload = {
      ...formData,
      turma_id:
        formData.turma_id !== undefined && formData.turma_id !== ""
          ? Number(formData.turma_id)
          : formData.turma_id,
    };
    onSave(payload);
  };

  const refetchAlunoDetalhes = async () => {
    try {
      const response = await fetch(
        `http://localhost:3001/alunos/${alunoData.aluno_id}/detalhes`,
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
        `http://localhost:3001/alunos/${alunoData.aluno_id}/responsaveis`,
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
        `http://localhost:3001/alunos/${alunoData.aluno_id}/vincular-responsavel`,
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
        `http://localhost:3001/alunos/${alunoData.aluno_id}/vincular-responsavel`,
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
      const criar = await fetch("http://localhost:3001/responsaveis", {
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
        `http://localhost:3001/alunos/${alunoData.aluno_id}/vincular-responsavel`,
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
        `http://localhost:3001/alunos/${alunoData.aluno_id}/responsaveis/${familiaId}`,
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content modal-large"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Fixo */}
        <div className="modal-header" style={{ alignItems: "center" }}>
          <h2>✏️ Editar Aluno</h2>
          <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              className="btn btn-light"
              onClick={() =>
                navigate(`/home/alunos/perfil/${alunoData.aluno_id}`)
              }
              title="Visualizar perfil do aluno"
            >
              👁️ Ver Perfil
            </button>
            <button
              type="button"
              className="btn btn-light"
              onClick={() => setLinkRespOpen((v) => !v)}
              title="Vincular um novo responsável"
            >
              ➕ Vincular Responsável
            </button>
            <button className="modal-close-button" onClick={onClose}>
              &times;
            </button>
          </div>
        </div>

        {/* Body Scrollável */}
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            {/* Mensagens de Feedback */}
            {message && (
              <div className={`message ${messageType}`}>
                {messageType === "success" ? "✓" : "⚠"} {message}
              </div>
            )}

            {/* Seção de Foto - Destaque */}
            <div className="photo-upload-section full-width">
              <div className="photo-preview-container">
                <div className="photo-preview">
                  {formData.foto_perfil ? (
                    <img
                      src={`http://localhost:3001${formData.foto_perfil}`}
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
                    className={`photo-upload-btn ${
                      uploading ? "disabled" : ""
                    }`}
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
                    label="Situação Financeira"
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
                  >
                    <option value="">Manter como está</option>
                    {turmas?.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nome_turma} ({t.periodo})
                      </option>
                    ))}
                  </select>
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
                    Busque por CPF para usar um responsável existente, ou
                    preencha os campos abaixo e clique em "Criar e Vincular".
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
                  {formData.outro_telefone &&
                    formData.outro_telefone.trim() && (
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
        </div>

        {/* Footer Fixo */}
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={uploading}
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
    </div>
  );
};

export default EditAlunoModal;
