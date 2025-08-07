import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Dados de exemplo que virão do backend futuramente
const turmasData = [
  {
    id: 1,
    nome: "Maternal I - Manhã",
    nivel: "maternal",
    periodo: "Manhã",
    alunos: ["Guilherme Alves"],
    professor: "Ana Paula",
    statusHistory: [
      { date: "2024-02-01", status: "Início das aulas" },
      { date: "2024-01-10", status: "Inscrições abertas" },
    ],
  },
  {
    id: 2,
    nome: "Maternal II - Tarde",
    nivel: "maternal",
    periodo: "Tarde",
    alunos: ["Júlia Rodrigues"],
    professor: "Carlos Eduardo",
    statusHistory: [
      { date: "2024-01-10", status: "Inscrições abertas" },
      { date: "2023-11-15", status: "Planejamento" },
    ],
  },
  {
    id: 3,
    nome: "Jardim I - Manhã",
    nivel: "jardim",
    periodo: "Manhã",
    alunos: ["Lucas Fernandes"],
    professor: "Mariana Costa",
    statusHistory: [
      { date: "2024-02-01", status: "Início das aulas" },
      { date: "2023-12-01", status: "Turma confirmada" },
    ],
  },
  {
    id: 4,
    nome: "Jardim I - Tarde",
    nivel: "jardim",
    periodo: "Tarde",
    alunos: [],
    professor: "Fernanda Lima",
    statusHistory: [{ date: "2024-01-15", status: "Aguardando quórum" }],
  },
  {
    id: 5,
    nome: "Jardim II - Integral",
    nivel: "jardim",
    periodo: "Integral",
    alunos: ["Beatriz Martins", "Sofia Ribeiro"],
    professor: "Ricardo Souza",
    statusHistory: [
      { date: "2024-02-01", status: "Início das aulas" },
      { date: "2023-11-20", status: "Turma cheia" },
    ],
  },
];

// Helper para extrair anos únicos do histórico de status
const getAllStatusYears = (data) => {
  const years = new Set();
  data.forEach((turma) => {
    turma.statusHistory.forEach((item) => {
      years.add(new Date(item.date + "T00:00:00").getFullYear().toString());
    });
  });
  return Array.from(years).sort((a, b) => b - a); // Ordena do mais recente
};

const TurmasPage = () => {
  const [nivelSelecionado, setNivelSelecionado] = useState("maternal");
  const [selectedTurma, setSelectedTurma] = useState(null);
  const [hoveredCardId, setHoveredCardId] = useState(null);
  const [yearFilter, setYearFilter] = useState(
    new Date().getFullYear().toString()
  );
  const navigate = useNavigate();

  const turmasFiltradas = turmasData.filter(
    (turma) => turma.nivel === nivelSelecionado
  );

  const allStatusHistory = turmasData
    .flatMap((turma) =>
      turma.statusHistory.map((statusItem) => ({
        ...statusItem,
        turmaNome: turma.nome,
      }))
    )
    .filter(
      (item) =>
        new Date(item.date + "T00:00:00").getFullYear().toString() ===
        yearFilter
    )
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleTurmaClick = (turma) => {
    setSelectedTurma(turma);
  };

  const handleCloseModal = () => {
    setSelectedTurma(null);
  };

  const baseButtonStyle = {
    padding: "10px 20px",
    fontSize: "16px",
    cursor: "pointer",
    border: "1px solid #ccc",
    backgroundColor: "#f8f9fa",
    color: "#333",
    borderBottom: "3px solid transparent",
  };

  const activeButtonStyle = {
    ...baseButtonStyle,
    color: "#007bff",
    borderBottom: "3px solid #007bff",
    backgroundColor: "#fff",
  };

  return (
    <div
      style={{
        padding: "2rem",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      <h1 style={{ marginBottom: "1.5rem", fontSize: "2rem" }}>
        Gerenciamento de Turmas
      </h1>

      {/* Seleção de Nível */}
      <div style={{ marginBottom: "2rem", borderBottom: "1px solid #ccc" }}>
        <button
          style={
            nivelSelecionado === "maternal"
              ? activeButtonStyle
              : baseButtonStyle
          }
          onClick={() => setNivelSelecionado("maternal")}
        >
          Maternal
        </button>
        <button
          style={
            nivelSelecionado === "jardim" ? activeButtonStyle : baseButtonStyle
          }
          onClick={() => setNivelSelecionado("jardim")}
        >
          Jardim
        </button>
      </div>

      {/* Grid de Turmas */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {turmasFiltradas.map((turma) => (
          <div
            key={turma.id}
            onClick={() => handleTurmaClick(turma)}
            onMouseEnter={() => setHoveredCardId(turma.id)}
            onMouseLeave={() => setHoveredCardId(null)}
            style={{
              border: "1px solid #dee2e6",
              borderRadius: "8px",
              padding: "1.5rem",
              backgroundColor: "#fff",
              boxShadow:
                hoveredCardId === turma.id
                  ? "0 4px 12px rgba(0,0,0,0.1)"
                  : "0 2px 4px rgba(0,0,0,0.05)",
              cursor: "pointer",
              transition: "box-shadow 0.2s, transform 0.2s",
              transform:
                hoveredCardId === turma.id ? "translateY(-2px)" : "none",
            }}
          >
            <h3
              style={{ marginTop: 0, marginBottom: "1rem", color: "#343a40" }}
            >
              {turma.nome}
            </h3>
            <p style={{ margin: "0.5rem 0" }}>
              <strong>Professor(a):</strong> {turma.professor}
            </p>
            <p style={{ margin: "0.5rem 0" }}>
              <strong>Período:</strong> {turma.periodo}
            </p>
            <p style={{ margin: "0.5rem 0" }}>
              <strong>Alunos:</strong> {turma.alunos.length}
            </p>
          </div>
        ))}
      </div>

      {/* Histórico de Status da Página */}
      <div style={{ marginTop: "3rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #ccc",
            paddingBottom: "0.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <h2 style={{ margin: 0 }}>Histórico de Status das Turmas</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <label htmlFor="year-filter">Filtrar por ano:</label>
            <select
              id="year-filter"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #ccc",
              }}
            >
              {getAllStatusYears(turmasData).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {allStatusHistory.length > 0 ? (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {allStatusHistory.map((item, index) => (
              <li
                key={index}
                style={{
                  padding: "12px",
                  borderBottom: "1px solid #f0f0f0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <strong>{item.turmaNome}:</strong> {item.status}
                </div>
                <span style={{ color: "#6c757d", fontSize: "0.9em" }}>
                  {new Date(item.date + "T00:00:00").toLocaleDateString(
                    "pt-BR"
                  )}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p>
            Nenhum histórico de status encontrado para o ano de {yearFilter}.
          </p>
        )}
      </div>

      {selectedTurma && (
        <TurmaModal turma={selectedTurma} onClose={handleCloseModal} />
      )}
    </div>
  );
};

// --- Componente do Modal ---

const TurmaModal = ({ turma, onClose }) => {
  const navigate = useNavigate();
  const handleModalContentClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      style={{
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
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#fff",
          padding: "2rem",
          borderRadius: "8px",
          width: "90%",
          maxWidth: "700px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
        }}
        onClick={handleModalContentClick}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #eee",
            paddingBottom: "1rem",
            marginBottom: "1rem",
          }}
        >
          <h2 style={{ margin: 0 }}>{turma.nome}</h2>
          <button
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              color: "#888",
            }}
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        <div style={{ overflowY: "auto", paddingRight: "1rem" }}>
          {/* Lista de Alunos */}
          <h3 style={{ marginTop: 0 }}>Alunos ({turma.alunos.length})</h3>
          {turma.alunos.length > 0 ? (
            <ul style={{ listStyle: "disc", paddingLeft: "20px" }}>
              {turma.alunos.map((aluno, index) => (
                <li key={index} style={{ padding: "4px 0" }}>
                  {aluno}
                </li>
              ))}
            </ul>
          ) : (
            <p>Nenhum aluno matriculado nesta turma.</p>
          )}
        </div>
        <div
          style={{
            marginTop: "1.5rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid #eee",
            textAlign: "right",
          }}
        >
          <button
            onClick={() =>
              navigate(`/dashboard/turmas/${turma.id}/historico-presenca`)
            }
            style={{
              padding: "10px 16px",
              cursor: "pointer",
              border: "1px solid #007bff",
              backgroundColor: "#fff",
              color: "#007bff",
              borderRadius: "6px",
            }}
          >
            Ver Histórico de Presença
          </button>
        </div>
      </div>
    </div>
  );
};

export default TurmasPage;
