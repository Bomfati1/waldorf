import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getApiUrl, fetchWithAuth } from "../config/api";
import InputWithHint from "../components/InputWithHint";
import ModalBase from "../components/ModalBase";
import EditAlunoModal from "../components/EditAlunoModal";
import { useModal } from "../context/ModalContext";
import "../css/ResponsaveisPage.css";

// Componente de estilo para a tabela (pode ser movido para um arquivo CSS)
const ResponsaveisPageCSS = () => (
  <style>{`
    .responsaveis-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      background-color: #fff;
      border-radius: 8px;
      overflow: hidden;
    }
    .responsaveis-table th, .responsaveis-table td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    .responsaveis-table th {
      background-color: #f8f9fa;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.85rem;
      color: #333;
    }
    .responsaveis-table tbody tr:hover {
      background-color: #f1f1f1;
    }
    .responsaveis-table tbody tr {
      cursor: pointer;
    }
    .responsaveis-table tbody tr:last-child td {
      border-bottom: none;
    }
    .action-button-delete {
      background-color: #ef4444;
      color: white;
      padding: 8px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
      transition: background-color 0.2s;
    }
    .action-button-delete:hover {
      background-color: #dc2626;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    .search-container {
      display: flex;
      align-items: center;
    }
    .search-input {
      padding: 10px 15px;
      border: 1px solid #ccc;
      border-radius: 6px;
      font-size: 1rem;
      min-width: 300px;
    }

    /* Estilos customizados para detalhes do responsável */
    .detail-item {
      margin-bottom: 1rem;
    }
    .detail-item strong {
      display: block;
      color: #555;
      margin-bottom: 4px;
      font-size: 0.9rem;
    }
    .detail-item span {
      font-size: 1.1rem;
    }
  `}</style>
);

const ResponsavelModal = ({ responsavel, onClose, onEdit, onAlunoClick }) => {
  const { openModal, closeModal, getZIndex } = useModal();
  const modalId = `responsavel-modal-${responsavel?.id || "new"}`;

  const [alunos, setAlunos] = useState([]);
  const [loadingAlunos, setLoadingAlunos] = useState(false);
  const [responsavelCompleto, setResponsavelCompleto] = useState(null);
  const [loadingResponsavel, setLoadingResponsavel] = useState(false);

  useEffect(() => {
    if (responsavel) {
      openModal(modalId);
    }
    return () => closeModal(modalId);
  }, [responsavel]);

  // Busca os dados completos do responsável incluindo endereço
  useEffect(() => {
    const fetchResponsavelCompleto = async () => {
      if (!responsavel?.id) return;

      setLoadingResponsavel(true);
      try {
        const response = await fetchWithAuth(`/responsaveis/${responsavel.id}`);

        if (response.ok) {
          const data = await response.json();
          setResponsavelCompleto(data);
        } else {
          console.error("Erro ao buscar responsável:", response.statusText);
          setResponsavelCompleto(responsavel); // Fallback para os dados básicos
        }
      } catch (err) {
        console.error("Erro ao buscar responsável:", err);
        setResponsavelCompleto(responsavel); // Fallback para os dados básicos
      } finally {
        setLoadingResponsavel(false);
      }
    };

    if (responsavel) {
      fetchResponsavelCompleto();
    }
  }, [responsavel]);

  useEffect(() => {
    const fetchAlunos = async () => {
      if (!responsavel?.id) return;

      setLoadingAlunos(true);
      try {
        const response = await fetchWithAuth(
          `/responsaveis/${responsavel.id}/alunos`,
        );

        if (response.ok) {
          const data = await response.json();
          setAlunos(data);
        } else {
          console.error("Erro ao buscar alunos:", response.statusText);
          setAlunos([]);
        }
      } catch (err) {
        console.error("Erro ao buscar alunos:", err);
        setAlunos([]);
      } finally {
        setLoadingAlunos(false);
      }
    };

    if (responsavel) {
      fetchAlunos();
    }
  }, [responsavel]);

  if (!responsavel) return null;

  // Usa os dados completos se disponíveis, senão usa os dados básicos
  const dadosResponsavel = responsavelCompleto || responsavel;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Date(
      date.getTime() + date.getTimezoneOffset() * 60000,
    ).toLocaleDateString("pt-BR");
  };

  return (
    <ModalBase
      isOpen={true}
      onClose={onClose}
      title="👤 Detalhes do Responsável"
      size="medium"
      zIndex={getZIndex(modalId)}
    >
      {loadingResponsavel ? (
        <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>
          Carregando detalhes...
        </div>
      ) : (
        <div>
          <div className="detail-item">
            <strong>Nome Completo:</strong>{" "}
            <span>{dadosResponsavel.nome_completo}</span>
          </div>
          <div className="detail-item">
            <strong>Email:</strong> <span>{dadosResponsavel.email}</span>
          </div>
          <div className="detail-item">
            <strong>Telefone:</strong> <span>{dadosResponsavel.telefone}</span>
          </div>
          <div className="detail-item">
            <strong>Outro Telefone:</strong>{" "}
            <span>{dadosResponsavel.outro_telefone || "N/A"}</span>
          </div>
          <div className="detail-item">
            <strong>CPF:</strong>{" "}
            <span>{dadosResponsavel.cpf || "Não informado"}</span>
          </div>
          <div className="detail-item">
            <strong>RG:</strong>{" "}
            <span>{dadosResponsavel.rg || "Não informado"}</span>
          </div>

          {/* Seção de Endereço */}
          {(dadosResponsavel.cidade ||
            dadosResponsavel.bairro ||
            dadosResponsavel.logradouro) && (
            <div
              className="detail-item"
              style={{
                marginTop: "1.5rem",
                borderTop: "1px solid #e0e0e0",
                paddingTop: "1rem",
              }}
            >
              <strong>📍 Endereço:</strong>
              <div style={{ marginTop: "8px" }}>
                {dadosResponsavel.cidade && (
                  <div style={{ marginBottom: "4px" }}>
                    <strong style={{ fontSize: "0.9rem" }}>Cidade:</strong>{" "}
                    <span>{dadosResponsavel.cidade}</span>
                  </div>
                )}
                {dadosResponsavel.bairro && (
                  <div style={{ marginBottom: "4px" }}>
                    <strong style={{ fontSize: "0.9rem" }}>Bairro:</strong>{" "}
                    <span>{dadosResponsavel.bairro}</span>
                  </div>
                )}
                {(dadosResponsavel.tipo_logradouro ||
                  dadosResponsavel.logradouro) && (
                  <div style={{ marginBottom: "4px" }}>
                    <strong style={{ fontSize: "0.9rem" }}>Logradouro:</strong>{" "}
                    <span>
                      {dadosResponsavel.tipo_logradouro &&
                        `${dadosResponsavel.tipo_logradouro} `}
                      {dadosResponsavel.logradouro}
                    </span>
                  </div>
                )}
                {dadosResponsavel.numero && (
                  <div style={{ marginBottom: "4px" }}>
                    <strong style={{ fontSize: "0.9rem" }}>Número:</strong>{" "}
                    <span>{dadosResponsavel.numero}</span>
                  </div>
                )}
                {dadosResponsavel.complemento && (
                  <div style={{ marginBottom: "4px" }}>
                    <strong style={{ fontSize: "0.9rem" }}>Complemento:</strong>{" "}
                    <span>{dadosResponsavel.complemento}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Seção de Alunos Vinculados */}
          <div
            className="detail-item"
            style={{
              marginTop: "1.5rem",
              borderTop: "1px solid #e0e0e0",
              paddingTop: "1rem",
            }}
          >
            <strong>
              Alunos Vinculados
              {!loadingAlunos && alunos.length > 0 && (
                <span
                  style={{
                    fontSize: "0.8em",
                    color: "#666",
                    fontWeight: "normal",
                    marginLeft: "8px",
                  }}
                >
                  ({alunos.length} {alunos.length === 1 ? "aluno" : "alunos"})
                </span>
              )}
              :
            </strong>
            {loadingAlunos ? (
              <div
                style={{
                  padding: "10px 0",
                  color: "#666",
                  fontStyle: "italic",
                }}
              >
                Carregando alunos...
              </div>
            ) : alunos.length > 0 ? (
              <div
                style={{
                  marginTop: "10px",
                  maxHeight: "200px",
                  overflowY: alunos.length > 3 ? "auto" : "visible",
                  paddingRight: alunos.length > 3 ? "5px" : "0",
                }}
              >
                {alunos.map((aluno) => (
                  <div
                    key={aluno.id}
                    onClick={() => onAlunoClick && onAlunoClick(aluno.id)}
                    style={{
                      padding: "8px 12px",
                      margin: "5px 0",
                      backgroundColor: "#f8f9fa",
                      borderRadius: "6px",
                      border: "1px solid #e9ecef",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "#e9ecef";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "#f8f9fa";
                    }}
                    title="Clique para editar este aluno"
                  >
                    <div style={{ fontWeight: "600", color: "#333" }}>
                      {aluno.nome_completo}
                    </div>
                    <div
                      style={{
                        fontSize: "0.85em",
                        color: "#666",
                        marginTop: "2px",
                      }}
                    >
                      Nascimento: {formatDate(aluno.data_nascimento)} • Status:{" "}
                      <span
                        style={{
                          color: aluno.status_aluno ? "#28a745" : "#dc3545",
                          fontWeight: "500",
                        }}
                      >
                        {aluno.status_aluno ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  padding: "10px 0",
                  color: "#666",
                  fontStyle: "italic",
                  textAlign: "center",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "6px",
                  margin: "10px 0",
                }}
              >
                Nenhum aluno vinculado a este responsável
              </div>
            )}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "1rem",
              marginTop: "1.5rem",
              paddingTop: "1rem",
              borderTop: "1px solid #e0e0e0",
            }}
          >
            <button
              onClick={() => onEdit(responsavel.id)}
              style={{
                backgroundColor: "#17a2b8",
                color: "white",
                padding: "10px 15px",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: "500",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#138496")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "#17a2b8")}
            >
              Editar
            </button>
          </div>
        </div>
      )}
    </ModalBase>
  );
};

const ResponsaveisPage = () => {
  const [responsaveis, setResponsaveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedResponsavel, setSelectedResponsavel] = useState(null);
  const [selectedAluno, setSelectedAluno] = useState(null);
  const [turmas, setTurmas] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResponsaveis = async () => {
      try {
        // Vamos assumir que a rota no seu backend será /responsaveis
        const response = await fetchWithAuth("/responsaveis");
        if (!response.ok) {
          throw new Error("Falha ao buscar os dados dos responsáveis.");
        }
        const data = await response.json();
        setResponsaveis(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchTurmas = async () => {
      try {
        const response = await fetchWithAuth("/turmas");
        if (response.ok) {
          const data = await response.json();
          setTurmas(data);
        }
      } catch (err) {
        console.error("Erro ao buscar turmas:", err);
      }
    };

    fetchResponsaveis();
    fetchTurmas();
  }, []);

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Tem certeza que deseja excluir este responsável? Esta ação não pode ser desfeita.",
      )
    ) {
      return;
    }

    try {
      const response = await fetchWithAuth(`/responsaveis/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Falha ao excluir o responsável.");
      }

      setResponsaveis((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert(`Erro: ${err.message}`);
    }
  };
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  };

  const handleEdit = (id) => {
    navigate(`/home/responsaveis/${id}/editar`);
  };

  const handleAlunoClick = async (alunoId) => {
    try {
      const response = await fetchWithAuth(`/alunos/${alunoId}/detalhes`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedAluno(data);
      }
    } catch (err) {
      console.error("Erro ao buscar detalhes do aluno:", err);
    }
  };

  const handleSaveAluno = async (updatedData) => {
    try {
      const response = await fetchWithAuth(`/alunos/${updatedData.aluno_id}`, {
        method: "PUT",
        body: JSON.stringify(updatedData),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setSelectedAluno(null);
      // Recarrega o responsável selecionado para atualizar a lista de alunos
      if (selectedResponsavel) {
        setSelectedResponsavel({ ...selectedResponsavel });
      }
    } catch (err) {
      alert(`Erro ao atualizar aluno: ${err.message}`);
    }
  };

  // Filtra os responsáveis com base no termo de busca
  const filteredResponsaveis = useMemo(() => {
    return responsaveis.filter((responsavel) =>
      responsavel.nome_completo
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
    );
  }, [responsaveis, searchTerm]);

  if (loading) {
    return <div style={{ padding: "2rem" }}>Carregando responsáveis...</div>;
  }

  if (error) {
    return <div style={{ padding: "2rem", color: "red" }}>Erro: {error}</div>;
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <ResponsaveisPageCSS />
      <div className="page-header">
        <h1>Lista de Responsáveis</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <InputWithHint
            id="search-responsavel"
            hint="Digite o nome do responsável para filtrar a lista"
            type="text"
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button
            onClick={() => navigate("/home/cadastrar-responsavel")}
            style={{
              padding: "10px 16px",
              cursor: "pointer",
              border: "none",
              backgroundColor: "#28a745",
              color: "white",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "500",
              whiteSpace: "nowrap",
            }}
            title="Cadastrar um novo responsável"
          >
            ➕ Cadastrar Responsável
          </button>
        </div>
      </div>

      <table className="responsaveis-table">
        <thead>
          <tr>
            <th>Nome Completo</th>
            <th>Email</th>
            <th>Telefone</th>
            <th>Outro Telefone</th>
            <th>Data de Cadastro</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {filteredResponsaveis.map((responsavel) => (
            <tr
              key={responsavel.id}
              onClick={() => setSelectedResponsavel(responsavel)}
            >
              <td>{responsavel.nome_completo}</td>
              <td>{responsavel.email}</td>
              <td>{responsavel.telefone}</td>
              <td>{responsavel.outro_telefone || "---"}</td>
              <td>{formatDate(responsavel.data_cadastro)}</td>
              <td>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Impede que o modal abra ao clicar no botão de excluir
                    handleDelete(responsavel.id);
                  }}
                  className="action-button-delete"
                >
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filteredResponsaveis.length === 0 && !loading && (
        <p style={{ textAlign: "center", marginTop: "2rem" }}>
          Nenhum responsável encontrado com os filtros aplicados.
        </p>
      )}

      <ResponsavelModal
        responsavel={selectedResponsavel}
        onClose={() => setSelectedResponsavel(null)}
        onEdit={handleEdit}
        onAlunoClick={handleAlunoClick}
      />

      {selectedAluno && (
        <EditAlunoModal
          alunoData={selectedAluno}
          turmas={turmas}
          onClose={() => setSelectedAluno(null)}
          onSave={handleSaveAluno}
        />
      )}
    </div>
  );
};

export default ResponsaveisPage;
