// src/pages/PreMatriculaPage.jsx
import React, { useState } from "react";

// Dados de exemplo que virão do backend/Google Forms futuramente
const initialPreMatriculas = [
  {
    id: 1,
    nome: "João da Silva",
    telefone: "(11) 98765-4321",
    comoConheceu: "Indicação",
    intencaoMatricula: "Sim",
    dataContato: "2023-10-26",
    status: "conversando",
  },
  {
    id: 2,
    nome: "Maria Oliveira",
    telefone: "(21) 91234-5678",
    comoConheceu: "Google",
    intencaoMatricula: "Sim",
    dataContato: "2023-10-25",
    status: "visita agendada",
  },
  {
    id: 3,
    nome: "Pedro Souza",
    telefone: "(31) 99999-8888",
    comoConheceu: "Instagram",
    intencaoMatricula: "Não",
    dataContato: "2023-10-24",
    status: "perdido",
  },
  {
    id: 4,
    nome: "Ana Costa",
    telefone: "(41) 98888-7777",
    comoConheceu: "Facebook",
    intencaoMatricula: "Sim",
    dataContato: "2023-10-23",
    status: "ganho",
  },
  {
    id: 5,
    nome: "Carlos Pereira",
    telefone: "(51) 97777-6666",
    comoConheceu: "Outros",
    intencaoMatricula: "Sim",
    dataContato: "2023-10-22",
    status: "entrou em contato",
  },
  {
    id: 6,
    nome: "Mariana Lima",
    telefone: "(61) 96666-5555",
    comoConheceu: "Indicação",
    intencaoMatricula: "Sim",
    dataContato: "2023-10-21",
    status: "negociando",
  },
];

const statusOptions = [
  "entrou em contato",
  "conversando",
  "visita agendada",
  "negociando",
  "ganho",
  "perdido",
];

const getStatusSelectStyles = (status) => {
  const baseStyle = {
    padding: "4px 12px",
    borderRadius: "12px",
    color: "white",
    fontSize: "12px",
    textTransform: "capitalize",
    border: "none",
    cursor: "pointer",
  };

  // Define as cores de fundo com base no status
  const statusStyles = {
    "entrou em contato": { backgroundColor: "#6c757d" },
    conversando: { backgroundColor: "#17a2b8" },
    "visita agendada": { backgroundColor: "#ffc107" },
    negociando: { backgroundColor: "#007bff" },
    ganho: { backgroundColor: "#28a745" },
    perdido: { backgroundColor: "#dc3545" },
  };

  // Garante que o texto seja legível em fundos claros
  if (status === "visita agendada") {
    baseStyle.color = "white";
  }

  const style = { ...baseStyle, ...statusStyles[status] };

  return style;
};

const PreMatriculaPage = () => {
  // Usa o estado para que a UI possa ser atualizada
  const [preMatriculas, setPreMatriculas] = useState(initialPreMatriculas);

  // Estado para os filtros
  const [filters, setFilters] = useState({
    nome: "",
    data: "",
    status: "todos", // 'todos' para não filtrar por padrão
  });

  // No futuro, você fará uma chamada a uma API aqui para buscar os dados.
  // useEffect(() => { /* fetch data */ }, []);

  const handleStatusChange = (id, newStatus) => {
    setPreMatriculas((currentMatriculas) =>
      currentMatriculas.map((matricula) =>
        matricula.id === id ? { ...matricula, status: newStatus } : matricula
      )
    );
    // Futuramente, você enviará essa atualização para o backend aqui
    console.log(`ID ${id} atualizado para o status: ${newStatus}`);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  // Aplica os filtros aos dados
  const filteredMatriculas = preMatriculas.filter((matricula) => {
    const matchNome = matricula.nome
      .toLowerCase()
      .includes(filters.nome.toLowerCase());
    const matchData =
      filters.data === "" || matricula.dataContato === filters.data;
    const matchStatus =
      filters.status === "todos" || matricula.status === filters.status;
    return matchNome && matchData && matchStatus;
  });

  return (
    <div
      style={{
        padding: "2rem",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      <h1 style={{ marginBottom: "1.5rem", fontSize: "2rem" }}>
        Pré-matrículas
      </h1>

      {/* Seção de Filtros */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          name="nome"
          placeholder="Buscar por nome..."
          value={filters.nome}
          onChange={handleFilterChange}
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        />
        <input
          type="date"
          name="data"
          value={filters.data}
          onChange={handleFilterChange}
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        />
        <select
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        >
          <option value="todos">Todos os Status</option>
          {statusOptions.map((option) => (
            <option
              key={option}
              value={option}
              style={{ textTransform: "capitalize" }}
            >
              {/* Capitaliza a primeira letra para melhor leitura */}
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: "600px",
          }}
        >
          <thead>
            <tr style={{ borderBottom: "2px solid #dee2e6" }}>
              <th
                style={{
                  padding: "12px",
                  textAlign: "left",
                  backgroundColor: "#f8f9fa",
                  fontWeight: "normal", // Garante que o texto não seja negrito
                }}
              >
                Nome
              </th>
              <th
                style={{
                  padding: "12px",
                  textAlign: "left",
                  backgroundColor: "#f8f9fa",
                  fontWeight: "normal",
                }}
              >
                Telefone
              </th>
              <th
                style={{
                  padding: "12px",
                  textAlign: "left",
                  backgroundColor: "#f8f9fa",
                  fontWeight: "normal",
                }}
              >
                Como Conheceu
              </th>
              <th
                style={{
                  padding: "12px",
                  textAlign: "left",
                  backgroundColor: "#f8f9fa",
                  fontWeight: "normal",
                }}
              >
                Intenção
              </th>
              <th
                style={{
                  padding: "12px",
                  textAlign: "left",
                  backgroundColor: "#f8f9fa",
                  fontWeight: "normal",
                }}
              >
                Data Contato
              </th>
              <th
                style={{
                  padding: "12px",
                  textAlign: "left",
                  backgroundColor: "#f8f9fa",
                  fontWeight: "normal",
                }}
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredMatriculas.map((matricula) => (
              <tr
                key={matricula.id}
                style={{ borderBottom: "1px solid #dee2e6" }}
              >
                <td style={{ padding: "12px" }}>{matricula.nome}</td>
                <td style={{ padding: "12px" }}>{matricula.telefone}</td>
                <td style={{ padding: "12px" }}>{matricula.comoConheceu}</td>
                <td style={{ padding: "12px" }}>
                  {matricula.intencaoMatricula}
                </td>
                <td style={{ padding: "12px" }}>{matricula.dataContato}</td>
                <td style={{ padding: "12px" }}>
                  <select
                    value={matricula.status}
                    onChange={(e) =>
                      handleStatusChange(matricula.id, e.target.value)
                    }
                    style={getStatusSelectStyles(matricula.status)}
                  >
                    {statusOptions.map((option) => (
                      <option
                        key={option}
                        value={option}
                        style={{ color: "black", backgroundColor: "white" }}
                      >
                        {option}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PreMatriculaPage;
