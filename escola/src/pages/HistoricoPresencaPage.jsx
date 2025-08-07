import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

// Dados de exemplo que viriam do seu backend
const turmasData = [
  {
    id: 1,
    nome: "Maternal I - Manhã",
    alunos: ["Guilherme Alves", "Aluno Exemplo 1"],
  },
  { id: 2, nome: "Maternal II - Tarde", alunos: ["Júlia Rodrigues"] },
  { id: 3, nome: "Jardim I - Manhã", alunos: ["Lucas Fernandes"] },
  { id: 4, nome: "Jardim I - Tarde", alunos: [] },
  {
    id: 5,
    nome: "Jardim II - Integral",
    alunos: ["Beatriz Martins", "Sofia Ribeiro"],
  },
];

const historicoData = {
  1: [
    {
      date: "2024-07-29",
      attendances: {
        "Guilherme Alves": "presente",
        "Aluno Exemplo 1": "ausente",
      },
    },
    {
      date: "2024-07-28",
      attendances: {
        "Guilherme Alves": "presente",
        "Aluno Exemplo 1": "presente",
      },
    },
  ],
  5: [
    {
      date: "2024-07-29",
      attendances: {
        "Beatriz Martins": "presente",
        "Sofia Ribeiro": "justificado",
      },
    },
  ],
};

const HistoricoPresencaPage = () => {
  const { turmaId } = useParams();
  const navigate = useNavigate();
  const turma = turmasData.find((t) => t.id.toString() === turmaId);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [attendance, setAttendance] = useState({});

  useEffect(() => {
    if (!turma) return;

    const historicoTurma = historicoData[turmaId] || [];
    const registroDoDia = historicoTurma.find((r) => r.date === selectedDate);

    if (registroDoDia) {
      setAttendance(registroDoDia.attendances);
    } else {
      // Se não houver registro, inicializa todos como presentes
      const initialAttendance = turma.alunos.reduce((acc, aluno) => {
        acc[aluno] = "presente";
        return acc;
      }, {});
      setAttendance(initialAttendance);
    }
  }, [turma, turmaId, selectedDate]);

  const handleStatusChange = (aluno, status) => {
    setAttendance((prev) => ({
      ...prev,
      [aluno]: status,
    }));
  };

  const handleSave = () => {
    console.log("Salvando presença para a data:", selectedDate);
    console.log("Dados:", attendance);
    // Aqui você enviaria os dados para o backend
    // E atualizaria o `historicoData` (neste exemplo, não vamos mutar o mock data)
    alert("Presença salva com sucesso!");
    navigate("/dashboard/turmas"); // Volta para a página de turmas
  };

  if (!turma) {
    return <div>Carregando informações da turma...</div>;
  }

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
        }}
      >
        <h1 style={{ marginBottom: "0.5rem" }}>
          Registro de Presença: {turma.nome}
        </h1>
        <button
          onClick={() => navigate(-1)}
          style={{ padding: "8px 16px", cursor: "pointer" }}
        >
          Voltar
        </button>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <label htmlFor="date-picker" style={{ marginRight: "1rem" }}>
          Data:
        </label>
        <input
          type="date"
          id="date-picker"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        />
      </div>

      <div
        style={{
          border: "1px solid #dee2e6",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr
              style={{
                borderBottom: "2px solid #dee2e6",
                backgroundColor: "#f8f9fa",
              }}
            >
              <th
                style={{
                  padding: "12px",
                  textAlign: "left",
                  fontWeight: "normal",
                }}
              >
                Aluno
              </th>
              <th
                style={{
                  padding: "12px",
                  textAlign: "left",
                  fontWeight: "normal",
                }}
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {turma.alunos.map((aluno, index) => (
              <tr key={index} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "12px" }}>{aluno}</td>
                <td style={{ padding: "12px", display: "flex", gap: "1rem" }}>
                  {["presente", "ausente", "justificado"].map((status) => (
                    <label
                      key={status}
                      style={{ cursor: "pointer", textTransform: "capitalize" }}
                    >
                      <input
                        type="radio"
                        name={`status-${aluno}`}
                        value={status}
                        checked={attendance[aluno] === status}
                        onChange={() => handleStatusChange(aluno, status)}
                        style={{ marginRight: "0.5rem" }}
                      />
                      {status}
                    </label>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: "2rem", textAlign: "right" }}>
        <button
          onClick={handleSave}
          style={{
            padding: "12px 24px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          Salvar Presença
        </button>
      </div>
    </div>
  );
};

export default HistoricoPresencaPage;
