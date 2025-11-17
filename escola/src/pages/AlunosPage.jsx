import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import EditAlunoModal from "../components/EditAlunoModal";
import InputWithHint from "../components/InputWithHint";
import SelectWithHint from "../components/SelectWithHint";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import "../css/AlunosPage.css";

// O componente AssignTurmaModal também permanece o mesmo.
const AssignTurmaModal = ({ aluno, onClose, onAssign }) => {
  // Bloqueia o scroll do body enquanto o modal está aberto
  useBodyScrollLock(true);

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

  // Lógica de filtragem e ordenação alfabética
  const filteredAlunos = useMemo(() => {
    return alunos
      .filter((aluno) => {
        const nomeMatch = aluno.nome_completo
          .toLowerCase()
          .includes(filters.nome.toLowerCase());
        const pagamentoMatch =
          !filters.pagamento || aluno.status_pagamento === filters.pagamento;
        // Lógica de filtro de turma mais robusta para evitar problemas com null/undefined e tipos diferentes.
        const turmaMatch =
          !filters.turmaId ||
          (aluno.turma_id != null &&
            String(aluno.turma_id) === filters.turmaId);
        const statusMatch =
          !filters.status || aluno.status_aluno == filters.status;
        return nomeMatch && pagamentoMatch && turmaMatch && statusMatch;
      })
      .sort((a, b) => {
        // Ordenação alfabética por nome completo
        return a.nome_completo.localeCompare(b.nome_completo, "pt-BR");
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
          <InputWithHint
            id="filter-nome-aluno"
            label="Nome do Aluno"
            hint="Digite o nome ou parte do nome do aluno para filtrar a lista"
            type="text"
            name="nome"
            value={filters.nome}
            onChange={handleFilterChange}
            placeholder="Digite para buscar..."
          />
        </div>
        <div className="filter-item">
          <SelectWithHint
            label="Status"
            hint="Filtre por alunos ativos (matriculados) ou inativos (desmatriculados)"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="">Todos</option>
            <option value="1">Ativo</option>
            <option value="0">Inativo</option>
          </SelectWithHint>
        </div>
        <div className="filter-item">
          <SelectWithHint
            label="Situação Financeira"
            hint="Filtre por alunos que pagam valor integral ou possuem bolsa"
            name="pagamento"
            value={filters.pagamento}
            onChange={handleFilterChange}
          >
            <option value="">Todos</option>
            <option value="Integral">Integral</option>
            <option value="Bolsista">Bolsista</option>
          </SelectWithHint>
        </div>
        <div className="filter-item">
          <SelectWithHint
            label="Turma"
            hint="Filtre alunos por turma específica ou visualize todas as turmas"
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
          </SelectWithHint>
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
