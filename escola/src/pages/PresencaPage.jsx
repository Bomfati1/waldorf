import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const statusOptions = [
  { value: "P", label: "Presente" },
  { value: "F", label: "Falta" },
  { value: "FJ", label: "Falta Justificada" },
];

const PresencaPage = () => {
  const { turmaId } = useParams();
  const navigate = useNavigate();
  const [turma, setTurma] = useState(null);
  const [presencas, setPresencas] = useState({});
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!turmaId || !selectedDate) return;

      setLoading(true);
      setError("");

      try {
        // Busca detalhes da turma e presenças existentes em paralelo
        const [turmaRes, presencasRes] = await Promise.all([
          fetch(`http://localhost:3001/turmas/${turmaId}/detalhes-presenca`),
          fetch(
            `http://localhost:3001/turmas/${turmaId}/presencas?data=${selectedDate}`
          ),
        ]);

        if (!turmaRes.ok) {
          // Verifica se a resposta é JSON antes de tentar fazer o parse
          const contentType = turmaRes.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await turmaRes.json();
            throw new Error(
              errorData.error || "Falha ao buscar dados da turma."
            );
          }
          // Se não for JSON, é um erro inesperado (como o HTML de fallback)
          throw new Error(
            `Resposta inesperada do servidor (status: ${turmaRes.status}). Verifique se o backend está rodando.`
          );
        }

        const turmaData = await turmaRes.json();
        // --- PONTO DE DEPURAÇÃO ---
        // Vamos verificar exatamente o que a API está retornando para a turma.
        console.log("Dados recebidos da API para a turma:", turmaData);
        // -------------------------
        // É normal não encontrar presenças se for o primeiro registro do dia.
        // Nesse caso, o backend pode retornar 404, e tratamos como um array vazio.
        const presencasData = presencasRes.ok ? await presencasRes.json() : [];

        // Validação para garantir que a resposta da API contém a lista de alunos
        if (!turmaData || !Array.isArray(turmaData.alunos)) {
          throw new Error(
            "A resposta da API para os dados da turma é inválida ou não contém uma lista de alunos."
          );
        }

        setTurma(turmaData);

        // Cria um mapa de presenças existentes para facilitar a consulta
        const presencasMap = presencasData.reduce((acc, p) => {
          acc[p.aluno_id] = {
            status: p.status_presenca,
            observacao: p.observacao || "",
          };
          return acc;
        }, {});

        // Inicializa o estado de presença
        const initialPresencas = turmaData.alunos.reduce((acc, aluno) => {
          acc[aluno.id] = presencasMap[aluno.id] || {
            status: "P", // Padrão para Presente
            observacao: "",
          };
          return acc;
        }, {});
        setPresencas(initialPresencas);
      } catch (err) {
        console.error("Erro ao carregar dados da presença:", err);
        setError(
          err.message || "Ocorreu um erro desconhecido ao carregar os dados."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [turmaId, selectedDate]);

  const handleStatusChange = (alunoId, status) => {
    setPresencas((prev) => ({
      ...prev,
      [alunoId]: { ...prev[alunoId], status },
    }));
  };

  const handleObservacaoChange = (alunoId, observacao) => {
    setPresencas((prev) => ({
      ...prev,
      [alunoId]: { ...prev[alunoId], observacao },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");

    const payload = {
      data_aula: selectedDate,
      presencas: Object.entries(presencas).map(([alunoId, data]) => ({
        aluno_id: parseInt(alunoId, 10),
        status_presenca: data.status,
        observacao: data.observacao,
      })),
    };

    try {
      const response = await fetch(
        `http://localhost:3001/turmas/${turmaId}/presencas`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao salvar presença.");
      }

      alert("Presença salva com sucesso!");
      navigate("/home/turmas");
    } catch (err) {
      setError(err.message);
      alert(`Erro: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem" }}>Carregando informações da turma...</div>
    );
  }

  if (error) {
    return <div style={{ padding: "2rem", color: "red" }}>Erro: {error}</div>;
  }

  if (!turma) {
    return <div style={{ padding: "2rem" }}>Turma não encontrada.</div>;
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
          Registro de Presença: {turma.nome_turma}
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
                  width: "30%",
                }}
              >
                Aluno
              </th>
              <th
                style={{
                  padding: "12px",
                  textAlign: "left",
                  width: "35%",
                }}
              >
                Status
              </th>
              <th
                style={{
                  padding: "12px",
                  textAlign: "left",
                  width: "35%",
                }}
              >
                Observação
              </th>
            </tr>
          </thead>
          <tbody>
            {turma?.alunos?.length > 0 ? (
              turma.alunos.map((aluno) => (
                <tr
                  key={aluno.id}
                  style={{ borderBottom: "1px solid #f0f0f0" }}
                >
                  <td style={{ padding: "12px" }}>{aluno.nome_completo}</td>
                  <td style={{ padding: "12px", display: "flex", gap: "1rem" }}>
                    {statusOptions.map((option) => (
                      <label
                        key={option.value}
                        style={{
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <input
                          type="radio"
                          name={`status-${aluno.id}`}
                          value={option.value}
                          checked={presencas[aluno.id]?.status === option.value}
                          onChange={() =>
                            handleStatusChange(aluno.id, option.value)
                          }
                          style={{ marginRight: "0.5rem" }}
                        />
                        {option.label}
                      </label>
                    ))}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <input
                      type="text"
                      value={presencas[aluno.id]?.observacao || ""}
                      onChange={(e) =>
                        handleObservacaoChange(aluno.id, e.target.value)
                      }
                      placeholder="Adicionar observação..."
                      style={{
                        width: "95%",
                        padding: "8px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                      }}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="3"
                  style={{ padding: "16px", textAlign: "center" }}
                >
                  Nenhum aluno encontrado para esta turma.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: "2rem", textAlign: "right" }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "12px 24px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "16px",
            cursor: "pointer",
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "Salvando..." : "Salvar Presença"}
        </button>
      </div>
    </div>
  );
};

export default PresencaPage;
