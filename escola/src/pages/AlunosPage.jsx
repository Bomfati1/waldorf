import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

// Componente para injetar o CSS diretamente no DOM.
// Isso resolve o erro de não encontrar o arquivo CSS externo.
const AlunosPageCSS = () => (
  <style>{`
    .alunos-page-container {
      padding: 2rem;
      font-family: sans-serif;
      background-color: #f9fafb;
    }
    .alunos-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }
    .add-aluno-button {
      background-color: #067decff;
      color: white;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 0.5rem;
      cursor: pointer;
      font-size: 1rem;
      transition: background-color 0.3s;
    }
    .add-aluno-button:hover {
      background-color: #0a6cddff;
    }
    .filters-container {
      display: flex;
      gap: 1.5rem;
      align-items: flex-end;
      margin-bottom: 2rem;
      padding: 1.5rem;
      background-color: white;
      border-radius: 0.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .filter-item {
      display: flex;
      flex-direction: column;
    }
    .filter-item label {
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #374151;
    }
    .filter-item input, .filter-item select {
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      min-width: 200px;
    }
    .clear-filters-button {
      background-color: #e5e7eb;
      color: #374151;
      padding: 0.5rem 1rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      cursor: pointer;
      transition: background-color 0.3s;
    }
    .clear-filters-button:hover {
      background-color: #d1d5db;
    }
    .alunos-table-container {
      background-color: white;
      border-radius: 0.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      background-color: #f3f4f6;
      font-weight: 600;
      color: #374151;
    }
    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-weight: 500;
      font-size: 0.875rem;
    }
    .status-ativo {
      background-color: #d1fae5;
      color: #065f46;
    }
    .status-inativo {
      background-color: #fee2e2;
      color: #991b1b;
    }
    .action-button, .action-button-ativar, .action-button-delete {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 0.375rem;
      cursor: pointer;
      margin-right: 0.5rem;
      transition: opacity 0.3s;
    }
    .action-button:hover, .action-button-ativar:hover, .action-button-delete:hover {
      opacity: 0.8;
    }
    .action-button {
      background-color: #3b82f6;
      color: white;
    }
    .action-button-ativar {
      background-color: #10b981;
      color: white;
    }
    .action-button-delete {
      background-color: #ef4444;
      color: white;
    }
    /* Estilos do Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    .modal-content {
      background-color: white;
      padding: 2rem;
      border-radius: 0.5rem;
      width: 90%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 1rem;
      margin-bottom: 1rem;
    }
    .modal-close-button {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
    }
    .aluno-form .form-section {
      margin-bottom: 1.5rem;
      border: 1px solid #e5e7eb;
      padding: 1.5rem;
      border-radius: 0.5rem;
    }
    .aluno-form .form-group {
      margin-bottom: 1rem;
    }
    .aluno-form label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }
    .aluno-form input, .aluno-form select, .aluno-form textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
    }
    .submit-button {
      width: 100%;
      padding: 0.75rem;
      background-color: #4f46e5;
      color: white;
      border: none;
      border-radius: 0.5rem;
      font-size: 1rem;
      cursor: pointer;
    }
    
    /* Estilos para a seção de foto de perfil */
    .photo-section {
      border: 2px dashed #e5e7eb;
      border-radius: 0.5rem;
      padding: 1.5rem;
      background-color: #f9fafb;
    }
    
    .photo-container {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }
    
    .photo-preview {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      overflow: hidden;
      border: 3px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: white;
    }
    
    .aluno-photo {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .photo-placeholder {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 24px;
    }
    
    .photo-actions {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .photo-upload-btn, .photo-remove-btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 0.375rem;
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.2s;
      text-align: center;
    }
    
    .photo-upload-btn {
      background-color: #3b82f6;
      color: white;
    }
    
    .photo-upload-btn:hover {
      background-color: #2563eb;
      transform: translateY(-1px);
    }
    
    .photo-remove-btn {
      background-color: #ef4444;
      color: white;
    }
    
    .photo-remove-btn:hover {
      background-color: #dc2626;
      transform: translateY(-1px);
    }
    
    /* Estilos para fotos na tabela */
    .table-photo {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      overflow: hidden;
      border: 2px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: white;
    }
    
    .table-aluno-photo {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .table-photo-placeholder {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 14px;
    }
    
    /* Estilos para mensagens de feedback */
    .photo-message {
      padding: 12px 16px;
      border-radius: 6px;
      margin-bottom: 1rem;
      font-weight: 500;
      font-size: 14px;
    }
    
    .photo-message.success {
      background-color: #d1fae5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }
    
    .photo-message.error {
      background-color: #fee2e2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }
    
    .photo-upload-btn.uploading {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `}</style>
);

// O componente EditAlunoModal permanece o mesmo, pois sua lógica interna não precisa de alterações.
const EditAlunoModal = ({ alunoData, turmas, onClose, onSave }) => {
  const [formData, setFormData] = useState(alunoData);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // Função para formatar telefone (simples)
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = async (file) => {
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      setMessage("Por favor, selecione apenas arquivos de imagem.");
      setMessageType("error");
      return;
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage("A imagem deve ter no máximo 5MB.");
      setMessageType("error");
      return;
    }

    setUploading(true);
    setMessage("");
    setMessageType("");

    const formData = new FormData();
    formData.append("alunoPhoto", file);

    try {
      const response = await fetch(
        `http://localhost:3001/alunos/${alunoData.aluno_id}/upload-photo`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setMessageType("success");
        // Atualiza os dados do formulário com a nova foto
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
        // Atualiza os dados do formulário removendo a foto
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
    // Garante que turma_id seja numérico quando selecionado
    const payload = {
      ...formData,
      turma_id:
        formData.turma_id !== undefined && formData.turma_id !== ""
          ? Number(formData.turma_id)
          : formData.turma_id,
    };
    onSave(payload);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Editar Aluno</h2>
          <button className="modal-close-button" onClick={onClose}>
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit} className="aluno-form">
          {/* Mensagens de feedback */}
          {message && (
            <div className={`photo-message ${messageType}`}>{message}</div>
          )}

          <fieldset className="form-section">
            <legend>Dados do Aluno</legend>

            {/* Seção de Foto de Perfil */}
            <div className="form-group photo-section">
              <label>Foto de Perfil</label>
              <div className="photo-container">
                <div className="photo-preview">
                  {formData.foto_perfil ? (
                    <img
                      src={`http://localhost:3001${formData.foto_perfil}`}
                      alt="Foto do aluno"
                      className="aluno-photo"
                    />
                  ) : (
                    <div className="photo-placeholder">
                      <span>
                        {formData.nome_aluno
                          ? formData.nome_aluno.charAt(0).toUpperCase()
                          : "A"}
                      </span>
                    </div>
                  )}
                </div>
                <div className="photo-actions">
                  <label
                    htmlFor="aluno-photo-upload"
                    className={`photo-upload-btn ${
                      uploading ? "uploading" : ""
                    }`}
                  >
                    {uploading ? "⏳ Enviando..." : "📷 Alterar Foto"}
                  </label>
                  {formData.foto_perfil && (
                    <button
                      type="button"
                      className="photo-remove-btn"
                      onClick={handleRemovePhoto}
                      disabled={uploading}
                    >
                      🗑️ Remover
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
                      // Limpa o input para permitir selecionar o mesmo arquivo novamente
                      e.target.value = "";
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="nome_aluno">Nome Completo *</label>
              <input
                id="nome_aluno"
                name="nome_aluno"
                value={formData.nome_aluno || ""}
                onChange={handleChange}
                required
              />
            </div>
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
                style={{ backgroundColor: "#f0f0f0", cursor: "not-allowed" }}
              />
            </div>
            <div className="form-group">
              <label htmlFor="turma_id">Alterar para</label>
              <select
                id="turma_id"
                name="turma_id"
                value={
                  formData.turma_id !== undefined && formData.turma_id !== null
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
            <div className="form-group">
              <label htmlFor="data_nascimento">Data de Nascimento *</label>
              <input
                id="data_nascimento"
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
              <label htmlFor="informacoes_saude">Informações de Saúde</label>
              <textarea
                id="informacoes_saude"
                name="informacoes_saude"
                value={formData.informacoes_saude || ""}
                onChange={handleChange}
              ></textarea>
            </div>
            <div className="form-group">
              <label htmlFor="status_pagamento">Status do Pagamento</label>
              <select
                id="status_pagamento"
                name="status_pagamento"
                value={formData.status_pagamento || "Integral"}
                onChange={handleChange}
              >
                <option value="Integral">Integral</option>
                <option value="Bolsista">Bolsista</option>
              </select>
            </div>
          </fieldset>

          <fieldset className="form-section">
            <legend>Dados do Responsável</legend>
            <div className="form-group">
              <label htmlFor="nome_responsavel">Nome do Responsável *</label>
              <input
                id="nome_responsavel"
                name="nome_responsavel"
                value={formData.nome_responsavel || ""}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="telefone">Telefone *</label>
              <input
                id="telefone"
                type="tel"
                name="telefone"
                value={formData.telefone || ""}
                onChange={handleChange}
                required
              />
              {formData.telefone && (
                <small
                  style={{
                    color: "#007bff",
                    fontSize: "0.8em",
                    display: "block",
                    marginTop: "4px",
                  }}
                >
                  📞 Principal: {formatPhone(formData.telefone)}
                </small>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="outro_telefone">Outro Telefone</label>
              <input
                id="outro_telefone"
                type="tel"
                name="outro_telefone"
                value={formData.outro_telefone || ""}
                onChange={handleChange}
                placeholder="Telefone adicional (opcional)"
              />
              {formData.outro_telefone && formData.outro_telefone.trim() && (
                <small
                  style={{
                    color: "#28a745",
                    fontSize: "0.8em",
                    display: "block",
                    marginTop: "4px",
                  }}
                >
                  ✓ Segundo telefone: {formatPhone(formData.outro_telefone)}
                </small>
              )}
              {!formData.outro_telefone && (
                <small
                  style={{
                    color: "#6c757d",
                    fontSize: "0.8em",
                    display: "block",
                    marginTop: "4px",
                  }}
                >
                  Nenhum telefone adicional cadastrado
                </small>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email || ""}
                onChange={handleChange}
                required
              />
            </div>
          </fieldset>

          <button type="submit" className="submit-button">
            Salvar Alterações
          </button>
        </form>
      </div>
    </div>
  );
};

// O componente AssignTurmaModal também permanece o mesmo.
const AssignTurmaModal = ({ aluno, onClose, onAssign }) => {
  const [turmas, setTurmas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTurma, setSelectedTurma] = useState("");

  useEffect(() => {
    const fetchTurmas = async () => {
      try {
        const response = await fetch("http://localhost:3001/turmas", {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Falha ao buscar turmas.");
        const data = await response.json();
        setTurmas(data);
      } catch (error) {
        console.error(error);
        // Substituindo alert por uma mensagem mais amigável
      } finally {
        setLoading(false);
      }
    };
    fetchTurmas();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onAssign(aluno.id, selectedTurma);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Matricular Aluno em Turma</h2>
          <button className="modal-close-button" onClick={onClose}>
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit} className="aluno-form">
          <p>
            Selecione a turma para matricular{" "}
            <strong>{aluno.nome_completo}</strong>:
          </p>
          <div className="form-group">
            <label htmlFor="turma-select">Turmas Disponíveis</label>
            <select
              id="turma-select"
              value={selectedTurma}
              onChange={(e) => setSelectedTurma(e.target.value)}
              required
            >
              <option value="" disabled>
                Selecione uma turma...
              </option>
              {loading ? (
                <option disabled>Carregando turmas...</option>
              ) : (
                turmas.map((turma) => (
                  <option key={turma.id} value={turma.id}>
                    {turma.nome_turma} ({turma.periodo})
                  </option>
                ))
              )}
            </select>
          </div>
          <div
            className="modal-actions"
            style={{ textAlign: "right", marginTop: "1rem" }}
          >
            <button
              type="submit"
              className="submit-button"
              disabled={!selectedTurma || loading}
            >
              Matricular e Ativar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AlunosPage = () => {
  const [alunos, setAlunos] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAluno, setEditingAluno] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningAluno, setAssigningAluno] = useState(null);

  // Estado para os filtros
  const [filters, setFilters] = useState({
    nome: "",
    pagamento: "",
    turmaId: "",
    status: "",
  });

  // Função para buscar todos os dados necessários
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Usando Promise.all para buscar alunos e turmas em paralelo
      const [ativosRes, inativosRes, turmasRes] = await Promise.all([
        fetch("http://localhost:3001/alunos/ativos", {
          credentials: "include",
        }),
        fetch("http://localhost:3001/alunos/inativos", {
          credentials: "include",
        }),
        fetch("http://localhost:3001/turmas", {
          credentials: "include",
        }),
      ]);

      if (!ativosRes.ok || !inativosRes.ok || !turmasRes.ok) {
        throw new Error("Falha ao buscar dados do servidor.");
      }

      const ativosData = await ativosRes.json();
      const inativosData = await inativosRes.json();
      const turmasData = await turmasRes.json();

      // Combina os alunos ativos e inativos em uma única lista
      setAlunos([...ativosData, ...inativosData]);
      setTurmas(turmasData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Lógica de filtragem
  const filteredAlunos = useMemo(() => {
    return alunos.filter((aluno) => {
      const nomeMatch = aluno.nome_completo
        .toLowerCase()
        .includes(filters.nome.toLowerCase());
      const pagamentoMatch =
        !filters.pagamento || aluno.status_pagamento === filters.pagamento;
      // Lógica de filtro de turma mais robusta para evitar problemas com null/undefined e tipos diferentes.
      const turmaMatch =
        !filters.turmaId ||
        (aluno.turma_id != null && String(aluno.turma_id) === filters.turmaId);
      const statusMatch =
        !filters.status || aluno.status_aluno == filters.status;
      return nomeMatch && pagamentoMatch && turmaMatch && statusMatch;
    });
  }, [alunos, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ nome: "", pagamento: "", turmaId: "", status: "" });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Date(
      date.getTime() + date.getTimezoneOffset() * 60000
    ).toLocaleDateString("pt-BR");
  };

  const handleOpenEditModal = async (alunoId) => {
    try {
      const response = await fetch(
        `http://localhost:3001/alunos/${alunoId}/detalhes`,
        {
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("Falha ao buscar detalhes do aluno.");
      const data = await response.json();
      setEditingAluno(data);
      setIsEditModalOpen(true);
    } catch (err) {
      // Substituir alert por um método de notificação melhor no futuro
      console.error(`Erro: ${err.message}`);
    }
  };

  const handleSave = async (updatedData) => {
    try {
      const response = await fetch(
        `http://localhost:3001/alunos/${updatedData.aluno_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(updatedData),
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setIsEditModalOpen(false);
      setEditingAluno(null);
      fetchData(); // Recarrega os dados para mostrar as alterações
    } catch (err) {
      console.error(`Erro ao salvar: ${err.message}`);
    }
  };

  const handleAtivarClick = (aluno) => {
    setAssigningAluno(aluno);
    setIsAssignModalOpen(true);
  };

  const handleConfirmAssign = async (alunoId, turmaId) => {
    if (!turmaId) {
      console.error("Por favor, selecione uma turma.");
      return;
    }
    try {
      const response = await fetch(
        `http://localhost:3001/alunos/${alunoId}/matricular`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ turmaId }),
        }
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Falha ao matricular o aluno.");

      setIsAssignModalOpen(false);
      setAssigningAluno(null);
      fetchData(); // Recarrega os dados
    } catch (err) {
      console.error(`Erro: ${err.message}`);
    }
  };

  const handleDeleteClick = async (alunoId) => {
    // Substituindo window.confirm por uma abordagem que não bloqueia a UI
    // O ideal é usar um modal de confirmação para uma melhor experiência do usuário.
    const userConfirmed = window.confirm(
      "Tem certeza que deseja excluir este aluno? A ação não pode ser desfeita."
    );

    if (userConfirmed) {
      try {
        const response = await fetch(
          `http://localhost:3001/alunos/${alunoId}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Falha ao excluir o aluno.");
        }

        fetchData(); // Recarrega os dados após a exclusão
      } catch (err) {
        console.error("Erro ao excluir aluno:", err);
      }
    }
  };

  return (
    <div className="alunos-page-container">
      <AlunosPageCSS />
      <div className="alunos-header">
        <h1>Alunos</h1>
        <button
          onClick={() => navigate("/home/cadastrar-aluno")}
          className="add-aluno-button"
        >
          + Cadastrar Aluno
        </button>
      </div>

      {/* Seção de Filtros */}
      <div className="filters-container">
        <div className="filter-item">
          <label htmlFor="filter-nome">Nome do Aluno</label>
          <input
            id="filter-nome"
            type="text"
            name="nome"
            value={filters.nome}
            onChange={handleFilterChange}
            placeholder="Digite para buscar..."
          />
        </div>
        <div className="filter-item">
          <label htmlFor="filter-status">Status</label>
          <select
            id="filter-status"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="">Todos</option>
            <option value="1">Ativo</option>
            <option value="0">Inativo</option>
          </select>
        </div>
        <div className="filter-item">
          <label htmlFor="filter-pagamento">Status do Pagamento</label>
          <select
            id="filter-pagamento"
            name="pagamento"
            value={filters.pagamento}
            onChange={handleFilterChange}
          >
            <option value="">Todos</option>
            <option value="Integral">Integral</option>
            <option value="Bolsista">Bolsista</option>
          </select>
        </div>
        <div className="filter-item">
          <label htmlFor="filter-turmaId">Turma</label>
          <select
            id="filter-turmaId"
            name="turmaId"
            value={filters.turmaId}
            onChange={handleFilterChange}
          >
            <option value="">Todas</option>
            {turmas.map((turma) => (
              <option key={turma.id} value={turma.id}>
                {turma.nome_turma} ({turma.periodo})
              </option>
            ))}
          </select>
        </div>
        <button onClick={clearFilters} className="clear-filters-button">
          Limpar Filtros
        </button>
      </div>

      <div className="tab-content">
        {loading && <div>Carregando...</div>}
        {error && <div className="error-message">Erro: {error}</div>}

        {!loading && !error && (
          <div className="alunos-table-container">
            <table>
              <thead>
                <tr>
                  <th>Foto</th>
                  <th>Nome Completo</th>
                  <th>Nascimento</th>
                  <th>Pagamento</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlunos.length > 0 ? (
                  filteredAlunos.map((aluno) => (
                    <tr key={aluno.id}>
                      <td>
                        <div className="table-photo">
                          {aluno.foto_perfil ? (
                            <img
                              src={`http://localhost:3001${aluno.foto_perfil}`}
                              alt="Foto do aluno"
                              className="table-aluno-photo"
                            />
                          ) : (
                            <div className="table-photo-placeholder">
                              {aluno.nome_completo.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>{aluno.nome_completo}</td>
                      <td>{formatDate(aluno.data_nascimento)}</td>
                      <td>{aluno.status_pagamento}</td>
                      <td>
                        <span
                          className={`status-badge status-${
                            aluno.status_aluno == 1 ? "ativo" : "inativo"
                          }`}
                        >
                          {aluno.status_aluno == 1 ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="action-button"
                          onClick={() => handleOpenEditModal(aluno.id)}
                        >
                          Editar
                        </button>
                        {aluno.status_aluno == 0 && (
                          <button
                            className="action-button-ativar"
                            onClick={() => handleAtivarClick(aluno)}
                          >
                            Ativar
                          </button>
                        )}
                        <button
                          className="action-button-delete"
                          onClick={() => handleDeleteClick(aluno.id)}
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6">
                      Nenhum aluno encontrado com os filtros aplicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isEditModalOpen && editingAluno && (
        <EditAlunoModal
          alunoData={editingAluno}
          turmas={turmas}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingAluno(null);
          }}
          onSave={handleSave}
        />
      )}

      {isAssignModalOpen && assigningAluno && (
        <AssignTurmaModal
          aluno={assigningAluno}
          onClose={() => {
            setIsAssignModalOpen(false);
            setAssigningAluno(null);
          }}
          onAssign={handleConfirmAssign}
        />
      )}
    </div>
  );
};

export default AlunosPage;
