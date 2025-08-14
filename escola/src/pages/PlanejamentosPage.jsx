import React, { useState, useMemo } from "react";

// Nomes dos meses para exibição
const monthNames = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

// Dados de exemplo que virão do backend futuramente
const turmasData = [
  { id: 1, nome: "Maternal I - Manhã" },
  { id: 2, nome: "Maternal II - Tarde" },
  { id: 3, nome: "Jardim I - Manhã" },
  { id: 4, nome: "Jardim I - Tarde" },
  { id: 5, nome: "Jardim II - Integral" },
];

const PlanejamentosPage = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedTurma, setSelectedTurma] = useState(turmasData[0]?.id || "");
  const [modalInfo, setModalInfo] = useState(null); // Estado para controlar o modal

  // Gera uma lista de anos para o seletor (5 anos para trás e 5 para frente)
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  // `useMemo` otimiza o cálculo, refazendo-o apenas quando o ano mudar
  const monthsData = useMemo(() => {
    return monthNames.map((name) => {
      const weekCount = 4; // Exibir sempre 4 semanas
      const weeks = Array.from(
        { length: weekCount },
        (_, i) => `Semana ${i + 1}`
      );
      return {
        name,
        weeks,
      };
    });
  }, []);

  const handleWeekClick = (monthName, weekName) => {
    const turmaSelecionada = turmasData.find(
      (t) => t.id.toString() === selectedTurma.toString()
    );
    setModalInfo({
      year: selectedYear,
      month: monthName,
      week: weekName,
      turma: turmaSelecionada ? turmaSelecionada.nome : "N/A",
    });
  };

  const handleCloseModal = () => {
    setModalInfo(null);
  };

  return (
    <div
      style={{
        padding: "2rem",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "2rem" }}>Planejamentos</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <label htmlFor="year-select" style={{ fontSize: "1rem" }}>
            Ano:
          </label>
          <select
            id="year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={{
              padding: "8px 12px",
              fontSize: "1rem",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <label htmlFor="turma-select" style={{ fontSize: "1rem" }}>
            Turma:
          </label>
          <select
            id="turma-select"
            value={selectedTurma}
            onChange={(e) => setSelectedTurma(e.target.value)}
            style={{
              padding: "8px 12px",
              fontSize: "1rem",
              borderRadius: "6px",
              border: "1px solid #ccc",
              minWidth: "200px",
            }}
          >
            {turmasData.map((turma) => (
              <option key={turma.id} value={turma.id}>
                {turma.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p>
        Selecione o mês e a semana para gerenciar os planejamentos de aulas.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "1.5rem",
          marginTop: "2rem",
        }}
      >
        {monthsData.map((month, index) => (
          <div
            key={index}
            style={{
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              padding: "1rem",
              backgroundColor: "#fff",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                borderBottom: "1px solid #f0f0f0",
                paddingBottom: "0.75rem",
                marginBottom: "0.75rem",
              }}
            >
              {month.name}
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {month.weeks.map((week, weekIndex) => (
                <li
                  key={weekIndex}
                  onClick={() => handleWeekClick(month.name, week)}
                  style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    borderRadius: "4px",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f8f9fa")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  {week}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <PlanejamentoModal info={modalInfo} onClose={handleCloseModal} />
    </div>
  );
};

const PlanejamentoModal = ({ info, onClose }) => {
  if (!info) return null;
  const [activeTab, setActiveTab] = useState("planejamento");
  const [comment, setComment] = useState("");

  const handleModalContentClick = (e) => {
    e.stopPropagation();
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      alert(`Arquivo selecionado: ${e.target.files[0].name}`);
    }
  };

  const tabButtonStyle = {
    padding: "10px 20px",
    fontSize: "1rem",
    cursor: "pointer",
    border: "none",
    borderBottom: "3px solid transparent",
    backgroundColor: "transparent",
    color: "#555",
  };

  const activeTabButtonStyle = {
    ...tabButtonStyle,
    color: "#007bff",
    borderBottom: "3px solid #007bff",
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
          maxWidth: "500px",
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
            marginBottom: "1.5rem",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.5rem" }}>
            {`Planejamento: ${info.turma}`}
            <span
              style={{
                color: "#6c757d",
                fontSize: "1.2rem",
                marginLeft: "0.5rem",
              }}
            >
              ({`${info.month} - ${info.week}, ${info.year}`})
            </span>
          </h2>
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

        {/* Abas de Navegação */}
        <div style={{ borderBottom: "1px solid #eee", marginBottom: "1.5rem" }}>
          <button
            style={
              activeTab === "planejamento"
                ? activeTabButtonStyle
                : tabButtonStyle
            }
            onClick={() => setActiveTab("planejamento")}
          >
            Planejamento
          </button>
          <button
            style={
              activeTab === "comentarios"
                ? activeTabButtonStyle
                : tabButtonStyle
            }
            onClick={() => setActiveTab("comentarios")}
          >
            Comentários
          </button>
        </div>

        {/* Conteúdo das Abas */}
        {activeTab === "planejamento" && (
          <div style={{ marginBottom: "1.5rem" }}>
            <label
              htmlFor="planejamento-upload"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "bold",
              }}
            >
              Anexar Planejamento
            </label>
            <div
              style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
            >
              <input
                type="file"
                id="planejamento-upload"
                onChange={handleFileChange}
                style={{
                  flexGrow: 1,
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              />
              <button
                onClick={() => alert("Anexo confirmado!")}
                style={{
                  padding: "9px 16px",
                  cursor: "pointer",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "14px",
                  whiteSpace: "nowrap",
                }}
              >
                Confirmar Anexo
              </button>
            </div>
          </div>
        )}

        {activeTab === "comentarios" && (
          <div style={{ marginBottom: "1.5rem" }}>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Adicione um comentário sobre o planejamento..."
              style={{
                width: "100%",
                minHeight: "100px",
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                resize: "vertical",
              }}
            />
            <div style={{ textAlign: "right", marginTop: "0.5rem" }}>
              <button
                onClick={() => alert(`Comentário salvo: ${comment}`)}
                style={{
                  padding: "9px 16px",
                  cursor: "pointer",
                  backgroundColor: "#17a2b8",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              >
                Confirmar Comentário
              </button>
            </div>
          </div>
        )}

        {/* Botões de Ação */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "1rem",
            borderTop: "1px solid #eee",
            paddingTop: "1.5rem",
          }}
        >
          <button
            onClick={() => alert("Plano REPROVADO!")}
            style={{
              padding: "10px 20px",
              cursor: "pointer",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "1rem",
            }}
          >
            Reprovar
          </button>
          <button
            onClick={() => alert("Plano APROVADO!")}
            style={{
              padding: "10px 20px",
              cursor: "pointer",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "1rem",
            }}
          >
            Aprovar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanejamentosPage;
