import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import InputWithHint from "../components/InputWithHint";
import ImportDropdown from "../components/ImportDropdown";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import "../css/ImportDropdown.css";
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

    /* Estilos para o Modal de Detalhes */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.6);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    .modal-content {
      background-color: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.3);
      width: 90%;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      position: relative;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 1rem;
      margin-bottom: 1.5rem;
    }
    .modal-header h2 {
      margin: 0;
      font-size: 1.5rem;
    }
    .modal-close-button {
      background: transparent;
      border: none;
      font-size: 2rem;
      cursor: pointer;
      line-height: 1;
    }
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

const ResponsavelModal = ({ responsavel, onClose, onEdit }) => {
  // Bloqueia o scroll do body enquanto o modal está aberto
  useBodyScrollLock(true);

  const [alunos, setAlunos] = useState([]);
  const [loadingAlunos, setLoadingAlunos] = useState(false);

  useEffect(() => {
    const fetchAlunos = async () => {
      if (!responsavel?.id) return;

      setLoadingAlunos(true);
      try {
        const response = await fetch(
          `http://localhost:3001/responsaveis/${responsavel.id}/alunos`,
          {
            credentials: "include",
          }
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

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Date(
      date.getTime() + date.getTimezoneOffset() * 60000
    ).toLocaleDateString("pt-BR");
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Detalhes do Responsável</h2>
          <button className="modal-close-button" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="detail-item">
          <strong>Nome Completo:</strong>{" "}
          <span>{responsavel.nome_completo}</span>
        </div>
        <div className="detail-item">
          <strong>Email:</strong> <span>{responsavel.email}</span>
        </div>
        <div className="detail-item">
          <strong>Telefone:</strong> <span>{responsavel.telefone}</span>
        </div>
        <div className="detail-item">
          <strong>Outro Telefone:</strong>{" "}
          <span>{responsavel.outro_telefone || "N/A"}</span>
        </div>
        <div className="detail-item">
          <strong>CPF:</strong>{" "}
          <span>{responsavel.cpf || "Não informado"}</span>
        </div>
        <div className="detail-item">
          <strong>RG:</strong> <span>{responsavel.rg || "Não informado"}</span>
        </div>

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
              style={{ padding: "10px 0", color: "#666", fontStyle: "italic" }}
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
                  title="Clique para ver mais detalhes do aluno"
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
                        color: aluno.status_aluno === 1 ? "#28a745" : "#dc3545",
                        fontWeight: "500",
                      }}
                    >
                      {aluno.status_aluno === 1 ? "Ativo" : "Inativo"}
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
            }}
          >
            Editar
          </button>
        </div>
      </div>
    </div>
  );
};

const ResponsaveisPage = () => {
  const [responsaveis, setResponsaveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedResponsavel, setSelectedResponsavel] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResponsaveis = async () => {
      try {
        // Vamos assumir que a rota no seu backend será /responsaveis
        const response = await fetch("http://localhost:3001/responsaveis", {
          credentials: "include",
        });
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

    fetchResponsaveis();
  }, []);

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Tem certeza que deseja excluir este responsável? Esta ação não pode ser desfeita."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/responsaveis/${id}`, {
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

  // Filtra os responsáveis com base no termo de busca
  const filteredResponsaveis = useMemo(() => {
    return responsaveis.filter((responsavel) =>
      responsavel.nome_completo.toLowerCase().includes(searchTerm.toLowerCase())
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
        <div className="search-container">
          <InputWithHint
            id="search-responsavel"
            hint="Digite o nome do responsável para filtrar a lista"
            type="text"
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <ImportDropdown
        buttonText="Importar via Excel"
        buttonIcon="📊"
        options={[
          {
            icon: "👥",
            title: "Importar Responsáveis",
            endpoint: "/responsaveis/upload-excel",
            acceptedColumns: [
              {
                name: "Nome Completo",
                description: "Nome completo do responsável",
                required: true,
              },
              {
                name: "Email",
                description: "Endereço de email do responsável",
                required: true,
              },
              {
                name: "Telefone",
                description: "Número de telefone principal",
                required: true,
              },
              {
                name: "Outro Telefone",
                description: "Número de telefone secundário (opcional)",
                required: false,
              },
              {
                name: "RG",
                description: "Número do RG (opcional)",
                required: false,
              },
              {
                name: "CPF",
                description: "Número do CPF (opcional)",
                required: false,
              },
            ],
            description:
              "Faça upload de um arquivo Excel (.xlsx ou .xls) para importar múltiplos responsáveis de uma vez. O sistema criará automaticamente novos registros na base de dados.",
            buttonText: "Importar Responsáveis",
            onSuccess: (data) => {
              // Recarregar a lista de responsáveis após importação bem-sucedida
              fetchResponsaveis();
            },
            onError: (data) => {
              console.error("Erro na importação:", data);
            },
          },
        ]}
      />

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
      />
    </div>
  );
};

export default ResponsaveisPage;
