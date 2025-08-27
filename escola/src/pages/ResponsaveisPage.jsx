import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

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
      max-width: 500px;
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
  if (!responsavel) return null;

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
        const response = await fetch("http://localhost:3001/responsaveis");
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
        <h1 style={{ fontSize: "2rem", margin: 0 }}>Lista de Responsáveis</h1>
        <div className="search-container">
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
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
      />
    </div>
  );
};

export default ResponsaveisPage;
