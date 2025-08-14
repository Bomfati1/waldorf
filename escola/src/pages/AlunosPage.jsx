import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/AlunosPage.css"; // Usando o arquivo de estilo dedicado
const EditAlunoModal = ({ alunoData, onClose, onSave }) => {
  const [formData, setFormData] = useState(alunoData);

  useEffect(() => {
    setFormData(alunoData);
  }, [alunoData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
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
          <fieldset className="form-section">
            <legend>Dados do Aluno</legend>
            <div className="form-group">
              <label>Nome Completo *</label>
              <input
                name="nome_aluno"
                value={formData.nome_aluno || ""}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Data de Nascimento *</label>
              <input
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
              <label>Informações de Saúde</label>
              <textarea
                name="informacoes_saude"
                value={formData.informacoes_saude || ""}
                onChange={handleChange}
              ></textarea>
            </div>
            <div className="form-group">
              <label>Status do Pagamento</label>
              <select
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
              <label>Nome do Responsável *</label>
              <input
                name="nome_responsavel"
                value={formData.nome_responsavel || ""}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Telefone *</label>
              <input
                type="tel"
                name="telefone"
                value={formData.telefone || ""}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input
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
const AlunosPage = () => {
  const [alunosAtivos, setAlunosAtivos] = useState([]);
  const [alunosInativos, setAlunosInativos] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const [selectedAluno, setSelectedAluno] = useState(null);
  const [activeTab, setActiveTab] = useState("cadastrados");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAluno, setEditingAluno] = useState(null);
  // Função para buscar todos os dados
  // Função para buscar todos os dados

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ativosRes, inativosRes] = await Promise.all([
        fetch("http://localhost:3001/alunos/ativos"),
        fetch("http://localhost:3001/alunos/inativos"),
      ]);

      if (!ativosRes.ok || !inativosRes.ok) {
        throw new Error("Falha ao buscar dados dos alunos.");
      }

      const ativosData = await ativosRes.json();
      const inativosData = await inativosRes.json();

      setAlunosAtivos(ativosData);
      setAlunosInativos(inativosData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
        `http://localhost:3001/alunos/${alunoId}/detalhes`
      );
      if (!response.ok) throw new Error("Falha ao buscar detalhes do aluno.");
      const data = await response.json();
      setEditingAluno(data);
      setIsEditModalOpen(true);
    } catch (err) {
      alert(`Erro: ${err.message}`);
    }
  };
  const handleSave = async (updatedData) => {
    try {
      const response = await fetch(
        `http://localhost:3001/alunos/${updatedData.aluno_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedData),
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      alert("Dados atualizados com sucesso!");
      setIsEditModalOpen(false);
      setEditingAluno(null);
      fetchData(); // Recarrega os dados para mostrar as alterações
    } catch (err) {
      alert(`Erro ao salvar: ${err.message}`);
    }
  };
  const handleAtivarClick = async (alunoId) => {
    try {
      const response = await fetch(
        `http://localhost:3001/alunos/${alunoId}/ativar`,
        {
          method: "PATCH",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Falha ao ativar o aluno.");
      }

      // Atualiza a UI em tempo real, movendo o aluno de uma lista para outra
      const alunoAtivado = alunosInativos.find((a) => a.id === alunoId);
      setAlunosInativos((prev) => prev.filter((a) => a.id !== alunoId));
      setAlunosAtivos((prev) =>
        [...prev, { ...alunoAtivado, status_aluno: true }].sort((a, b) =>
          a.nome_completo.localeCompare(b.nome_completo)
        )
      );

      alert("Aluno ativado com sucesso!");
    } catch (err) {
      console.error("Erro ao ativar aluno:", err);
      alert(`Erro: ${err.message}`);
    }
  };

  const handleDeleteClick = async (alunoId, status) => {
    if (
      window.confirm(
        "Tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita."
      )
    ) {
      try {
        const response = await fetch(
          `http://localhost:3001/alunos/${alunoId}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Falha ao excluir o aluno.");
        }

        if (status === "ativo") {
          setAlunosAtivos((prev) =>
            prev.filter((aluno) => aluno.id !== alunoId)
          );
        } else {
          setAlunosInativos((prev) =>
            prev.filter((aluno) => aluno.id !== alunoId)
          );
        }
        alert("Aluno excluído com sucesso!");
      } catch (err) {
        console.error("Erro ao excluir aluno:", err);
        alert(`Erro: ${err.message}`);
      }
    }
  };

  return (
    <div className="alunos-page-container">
      <div className="alunos-header">
        <h1>Alunos</h1>
        <button
          onClick={() => navigate("/dashboard/cadastrar-aluno")}
          className="add-aluno-button"
        >
          + Cadastrar Aluno
        </button>
      </div>

      <div className="tabs-container">
        <button
          className={`tab-button ${
            activeTab === "cadastrados" ? "active" : ""
          }`}
          onClick={() => setActiveTab("cadastrados")}
        >
          Alunos Cadastrados
        </button>
        <button
          className={`tab-button ${
            activeTab === "naoCadastrados" ? "active" : ""
          }`}
          onClick={() => setActiveTab("naoCadastrados")}
        >
          Alunos Não Cadastrados
        </button>
      </div>

      <div className="tab-content">
        {loading && <div>Carregando...</div>}
        {error && <div className="error-message">Erro: {error}</div>}

        {!loading && !error && activeTab === "cadastrados" && (
          <div className="alunos-table-container">
            <table>
              <thead>
                <tr>
                  <th>Nome Completo</th>
                  <th>Nascimento</th>
                  <th>Pagamento</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {alunosAtivos.length > 0 ? (
                  alunosAtivos.map((aluno) => (
                    <tr key={aluno.id}>
                      <td>{aluno.nome_completo}</td>
                      <td>{formatDate(aluno.data_nascimento)}</td>
                      <td>{aluno.status_pagamento}</td>
                      <td>
                        <button
                          className="action-button"
                          onClick={() => handleOpenEditModal(aluno.id)}
                        >
                          Editar
                        </button>
                        <button
                          className="action-button-delete"
                          onClick={() => handleDeleteClick(aluno.id, "ativo")}
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4">Nenhum aluno ativo encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* SEÇÃO ALTERADA */}
        {!loading && !error && activeTab === "naoCadastrados" && (
          <div className="alunos-table-container">
            <table>
              <thead>
                <tr>
                  <th>Nome Completo</th>
                  <th>Nascimento</th>
                  <th>Status Pagamento</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {alunosInativos.length > 0 ? (
                  alunosInativos.map((aluno) => (
                    <tr key={aluno.id}>
                      <td>{aluno.nome_completo}</td>
                      <td>{formatDate(aluno.data_nascimento)}</td>
                      <td>{aluno.status_pagamento}</td>
                      <td>
                        <button
                          className="action-button"
                          onClick={() => handleOpenEditModal(aluno.id)}
                        >
                          Editar
                        </button>
                        <button
                          className="action-button-ativar"
                          onClick={() => handleAtivarClick(aluno.id)}
                        >
                          Ativar
                        </button>
                        <button
                          className="action-button-delete"
                          onClick={() => handleDeleteClick(aluno.id, "inativo")}
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4">Nenhum aluno não cadastrado encontrado.</td>
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
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingAluno(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default AlunosPage;
