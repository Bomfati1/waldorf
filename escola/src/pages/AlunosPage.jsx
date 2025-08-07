import React, { useState } from "react";

// Dados de exemplo que virão do backend futuramente
const initialAlunos = [
  {
    id: 1,
    nome: "Beatriz Martins",
    nascimento: "2018-05-15",
    informacaoSaude: "Alergia a amendoim",
    pagamento: "integral",
    anoMatricula: 2023,
    periodo: "integral",
    nivel: "jardim",
    turma: "Jardim II - Integral",
    historico: "Entrou em 2022 no Maternal. Ótimo desenvolvimento motor.",
    responsavel: {
      nome: "Ana Martins",
      telefone: "(11) 91111-1111",
      email: "ana.martins@email.com",
      outroTelefone: "(11) 2222-2222",
    },
  },
  {
    id: 2,
    nome: "Lucas Fernandes",
    nascimento: "2019-02-20",
    informacaoSaude: "Nenhuma",
    pagamento: "bolsista",
    anoMatricula: 2023,
    periodo: "manhã",
    nivel: "jardim",
    turma: "Jardim I - Manhã",
    historico: "Adaptação tranquila. Interage bem com os colegas.",
    responsavel: {
      nome: "Carlos Fernandes",
      telefone: "(21) 93333-3333",
      email: "carlos.f@email.com",
      outroTelefone: "",
    },
  },
  {
    id: 3,
    nome: "Júlia Rodrigues",
    nascimento: "2018-11-10",
    informacaoSaude: "Asma",
    pagamento: "integral",
    anoMatricula: 2022,
    periodo: "tarde",
    nivel: "maternal",
    turma: "Maternal II - Tarde",
    historico: "Demonstra grande interesse por atividades artísticas.",
    responsavel: {
      nome: "Mariana Rodrigues",
      telefone: "(31) 94444-4444",
      email: "mari.rodrigues@email.com",
      outroTelefone: "(31) 5555-5555",
    },
  },
  {
    id: 4,
    nome: "Guilherme Alves",
    nascimento: "2020-01-30",
    informacaoSaude: "Nenhuma",
    pagamento: "integral",
    anoMatricula: 2024,
    periodo: "manhã",
    nivel: "maternal",
    turma: "Maternal I - Manhã",
    historico: "Recém-matriculado. Período de adaptação em andamento.",
    responsavel: {
      nome: "Fernanda Alves",
      telefone: "(41) 96666-6666",
      email: "fe.alves@email.com",
      outroTelefone: "",
    },
  },
  {
    id: 5,
    nome: "Sofia Ribeiro",
    nascimento: "2019-07-22",
    informacaoSaude: "Intolerância à lactose",
    pagamento: "bolsista",
    anoMatricula: 2024,
    periodo: "integral",
    nivel: "jardim",
    turma: "Jardim II - Integral",
    historico: "Excelente participação nas aulas de música.",
    responsavel: {
      nome: "Roberto Ribeiro",
      telefone: "(51) 97777-7777",
      email: "roberto.ribeiro@email.com",
      outroTelefone: "",
    },
  },
];

// Gera uma lista de anos para o filtro, baseado nos dados
const getAnosMatricula = (alunos) => {
  const anos = alunos.map((aluno) => aluno.anoMatricula);
  return [...new Set(anos)].sort((a, b) => b - a); // Ordena do mais recente para o mais antigo
};

const AlunosPage = () => {
  const [selectedAluno, setSelectedAluno] = useState(null);
  const [hoveredRowId, setHoveredRowId] = useState(null);
  const [alunos, setAlunos] = useState(initialAlunos);
  const [filters, setFilters] = useState({
    nome: "",
    ano: "todos",
    periodo: "todos",
    nivel: "todos",
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  const handleAlunoClick = (aluno) => {
    setSelectedAluno(aluno);
  };

  const handleCloseModal = () => {
    setSelectedAluno(null);
  };

  const anosDisponiveis = getAnosMatricula(alunos);

  const filteredAlunos = alunos.filter((aluno) => {
    const matchNome = aluno.nome
      .toLowerCase()
      .includes(filters.nome.toLowerCase());
    const matchAno =
      filters.ano === "todos" || aluno.anoMatricula.toString() === filters.ano;
    const matchPeriodo =
      filters.periodo === "todos" || aluno.periodo === filters.periodo;
    const matchNivel =
      filters.nivel === "todos" || aluno.nivel === filters.nivel;
    return matchNome && matchAno && matchPeriodo && matchNivel;
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
        Gerenciamento de Alunos
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
        <select
          name="ano"
          value={filters.ano}
          onChange={handleFilterChange}
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        >
          <option value="todos">Todos os Anos</option>
          {anosDisponiveis.map((ano) => (
            <option key={ano} value={ano}>
              {ano}
            </option>
          ))}
        </select>
        <select
          name="periodo"
          value={filters.periodo}
          onChange={handleFilterChange}
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        >
          <option value="todos">Todos os Períodos</option>
          <option value="manhã">Manhã</option>
          <option value="tarde">Tarde</option>
          <option value="integral">Integral</option>
        </select>
        <select
          name="nivel"
          value={filters.nivel}
          onChange={handleFilterChange}
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        >
          <option value="todos">Todos os Níveis</option>
          <option value="maternal">Maternal</option>
          <option value="jardim">Jardim</option>
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
                  fontWeight: "normal",
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
                Nascimento
              </th>
              <th
                style={{
                  padding: "12px",
                  textAlign: "left",
                  backgroundColor: "#f8f9fa",
                  fontWeight: "normal",
                }}
              >
                Info. Saúde
              </th>
              <th
                style={{
                  padding: "12px",
                  textAlign: "left",
                  backgroundColor: "#f8f9fa",
                  fontWeight: "normal",
                }}
              >
                Pagamento
              </th>
              <th
                style={{
                  padding: "12px",
                  textAlign: "left",
                  backgroundColor: "#f8f9fa",
                  fontWeight: "normal",
                }}
              >
                Período
              </th>
              <th
                style={{
                  padding: "12px",
                  textAlign: "left",
                  backgroundColor: "#f8f9fa",
                  fontWeight: "normal",
                }}
              >
                Nível
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAlunos.map((aluno) => (
              <tr
                key={aluno.id}
                onClick={() => handleAlunoClick(aluno)}
                onMouseEnter={() => setHoveredRowId(aluno.id)}
                onMouseLeave={() => setHoveredRowId(null)}
                style={{
                  borderBottom: "1px solid #dee2e6",
                  cursor: "pointer",
                  // Muda a cor de fundo se o mouse estiver sobre a linha
                  backgroundColor:
                    hoveredRowId === aluno.id ? "#f8f9fa" : "transparent",
                  // Adiciona uma transição suave para o efeito
                  transition: "background-color 0.2s",
                  boxShadow:
                    hoveredRowId === aluno.id
                      ? "inset 4px 0 0 #007bff"
                      : "none",
                }}
              >
                <td style={{ padding: "12px" }}>{aluno.nome}</td>
                <td style={{ padding: "12px" }}>{aluno.nascimento}</td>
                <td style={{ padding: "12px" }}>{aluno.informacaoSaude}</td>
                <td style={{ padding: "12px", textTransform: "capitalize" }}>
                  {aluno.pagamento}
                </td>
                <td style={{ padding: "12px", textTransform: "capitalize" }}>
                  {aluno.periodo}
                </td>
                <td style={{ padding: "12px", textTransform: "capitalize" }}>
                  {aluno.nivel}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedAluno && (
        <AlunoModal aluno={selectedAluno} onClose={handleCloseModal} />
      )}
    </div>
  );
};

// --- Componente do Modal ---

const AlunoModal = ({ aluno, onClose }) => {
  const [activeTab, setActiveTab] = useState("aluno");

  const handleModalContentClick = (e) => {
    e.stopPropagation(); // Impede que o clique feche o modal
  };

  // Estilos do Modal
  const modalOverlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  };

  const modalContentStyle = {
    backgroundColor: "#fff",
    padding: "2rem",
    borderRadius: "8px",
    width: "90%",
    maxWidth: "600px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
  };

  const modalHeaderStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #eee",
    paddingBottom: "1rem",
    marginBottom: "1rem",
  };

  const closeButtonStyle = {
    background: "none",
    border: "none",
    fontSize: "1.5rem",
    cursor: "pointer",
    color: "#888",
  };

  const tabContainerStyle = {
    display: "flex",
    marginBottom: "1rem",
  };

  const tabStyle = {
    padding: "10px 20px",
    cursor: "pointer",
    border: "none",
    backgroundColor: "transparent",
    borderBottom: "2px solid transparent",
    fontSize: "1rem",
  };

  const activeTabStyle = {
    ...tabStyle,
    borderBottom: "2px solid #007bff",
    color: "#007bff",
    fontWeight: "bold",
  };

  const infoPStyle = {
    margin: "0.5rem 0",
    lineHeight: "1.6",
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={handleModalContentClick}>
        <div style={modalHeaderStyle}>
          <h2 style={{ margin: 0 }}>{aluno.nome}</h2>
          <button style={closeButtonStyle} onClick={onClose}>
            &times;
          </button>
        </div>

        <div style={tabContainerStyle}>
          <button
            style={activeTab === "aluno" ? activeTabStyle : tabStyle}
            onClick={() => setActiveTab("aluno")}
          >
            Aluno
          </button>
          <button
            style={activeTab === "responsavel" ? activeTabStyle : tabStyle}
            onClick={() => setActiveTab("responsavel")}
          >
            Responsável
          </button>
        </div>

        <div>
          {activeTab === "aluno" && (
            <div>
              <p style={infoPStyle}>
                <strong>Turma Atual:</strong> {aluno.turma}
              </p>
              <p style={infoPStyle}>
                <strong>Informações de Saúde:</strong> {aluno.informacaoSaude}
              </p>
              <p style={infoPStyle}>
                <strong>Histórico:</strong> {aluno.historico}
              </p>
            </div>
          )}
          {activeTab === "responsavel" && (
            <div>
              <p style={infoPStyle}>
                <strong>Nome:</strong> {aluno.responsavel.nome}
              </p>
              <p style={infoPStyle}>
                <strong>Telefone:</strong> {aluno.responsavel.telefone}
              </p>
              <p style={infoPStyle}>
                <strong>Email:</strong> {aluno.responsavel.email}
              </p>
              <p style={infoPStyle}>
                <strong>Outro Telefone:</strong>{" "}
                {aluno.responsavel.outroTelefone || "N/A"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlunosPage;
