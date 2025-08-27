import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const statusMap = {
  P: { text: "Presente", color: "#28a745" },
  F: { text: "Falta", color: "#dc3545" },
  FJ: { text: "Falta Justificada", color: "#ffc107" },
};

const HistoricoPresencaPage = () => {
  const { turmaId } = useParams();
  const navigate = useNavigate();
  const [historico, setHistorico] = useState([]);
  const [turmaInfo, setTurmaInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openDate, setOpenDate] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!turmaId) return;
      setLoading(true);
      setError("");

      try {
        const [historicoRes, turmaRes] = await Promise.all([
          fetch(`http://localhost:3001/turmas/${turmaId}/historico-presenca`),
          fetch(`http://localhost:3001/turmas/${turmaId}/detalhes-presenca`),
        ]);

        if (!historicoRes.ok || !turmaRes.ok) {
          throw new Error("Falha ao buscar dados do histórico da turma.");
        }

        const historicoData = await historicoRes.json();
        const turmaData = await turmaRes.json();

        setHistorico(historicoData);
        setTurmaInfo(turmaData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [turmaId]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Date(
      date.getTime() + date.getTimezoneOffset() * 60000
    ).toLocaleDateString("pt-BR");
  };

  const toggleDate = (date) => {
    setOpenDate(openDate === date ? null : date);
  };

  if (loading) {
    return <div style={{ padding: "2rem" }}>Carregando histórico...</div>;
  }

  if (error) {
    return <div style={{ padding: "2rem", color: "red" }}>Erro: {error}</div>;
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
          marginBottom: "2rem",
        }}
      >
        <h1 style={{ margin: 0 }}>
          Histórico de Presença: {turmaInfo?.nome_turma || "Turma"}
        </h1>
        <button
          onClick={() => navigate(-1)}
          style={{ padding: "8px 16px", cursor: "pointer" }}
        >
          Voltar
        </button>
      </div>

      {historico.length === 0 ? (
        <p>Nenhum registro de presença encontrado para esta turma.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {historico.map((dia) => (
            <div
              key={dia.data_aula}
              style={{
                border: "1px solid #dee2e6",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <div
                onClick={() => toggleDate(dia.data_aula)}
                style={{
                  padding: "1rem",
                  backgroundColor: "#f8f9fa",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <strong style={{ fontSize: "1.1rem" }}>
                  {formatDate(dia.data_aula)}
                </strong>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <span>Presentes: {dia.presentes}</span>
                  <span>Faltas: {dia.faltas}</span>
                  <span>Justificadas: {dia.faltas_justificadas}</span>
                </div>
              </div>
              {openDate === dia.data_aula && (
                <div style={{ padding: "1rem" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #dee2e6" }}>
                        <th style={{ padding: "8px", textAlign: "left" }}>
                          Aluno
                        </th>
                        <th style={{ padding: "8px", textAlign: "left" }}>
                          Status
                        </th>
                        <th style={{ padding: "8px", textAlign: "left" }}>
                          Observação
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {dia.registros.map((reg) => (
                        <tr
                          key={reg.aluno_id}
                          style={{ borderBottom: "1px solid #f0f0f0" }}
                        >
                          <td style={{ padding: "8px" }}>
                            {reg.nome_completo}
                          </td>
                          <td style={{ padding: "8px" }}>
                            <span
                              style={{
                                color: statusMap[reg.status]?.color || "#000",
                                fontWeight: "bold",
                              }}
                            >
                              {statusMap[reg.status]?.text || reg.status}
                            </span>
                          </td>
                          <td style={{ padding: "8px" }}>
                            {reg.observacao || "---"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoricoPresencaPage;
