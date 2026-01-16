import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import jsPDF from "jspdf";
import SelectWithHint from "../components/SelectWithHint";
import { drawHeader, drawFooter, formatBRDate } from "../utils/pdfUtils";

const statusMap = {
  P: { text: "Presente", color: "#28a745" },
  F: { text: "Falta", color: "#dc3545" },
  FJ: { text: "Falta Justificada", color: "#ffc107" },
};

const HistoricoAlunoPresencaPage = () => {
  const navigate = useNavigate();
  const { turmaId } = useParams();
  const [turmas, setTurmas] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [selectedTurma, setSelectedTurma] = useState(turmaId || "");
  const [selectedAluno, setSelectedAluno] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [availableYears, setAvailableYears] = useState([]);
  const [historicoAluno, setHistoricoAluno] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [alunoInfo, setAlunoInfo] = useState(null);
  const [turmaInfo, setTurmaInfo] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Buscar todas as turmas
  useEffect(() => {
    const fetchTurmas = async () => {
      try {
        const response = await fetch("http://localhost:3001/turmas", {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Erro ao buscar turmas");
        const data = await response.json();
        setTurmas(data);

        // Extrair anos letivos únicos e definir o filtro inicial
        if (data.length > 0) {
          const years = [...new Set(data.map((t) => t.ano_letivo))].sort(
            (a, b) => b - a
          );
          setAvailableYears(years);
          setSelectedYear(years[0].toString()); // Define o ano mais recente como padrão
        }
      } catch (err) {
        console.error("Erro ao buscar turmas:", err);
        setError("Erro ao carregar turmas: " + err.message);
      }
    };
    fetchTurmas();
  }, []);

  // Buscar alunos da turma selecionada
  useEffect(() => {
    if (!selectedTurma) {
      setAlunos([]);
      return;
    }

    const fetchAlunos = async () => {
      try {
        const response = await fetch(
          `http://localhost:3001/turmas/${selectedTurma}/alunos`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erro ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        setAlunos(data);
        setError(""); // Limpa erro anterior se a busca for bem-sucedida
      } catch (err) {
        console.error("Erro ao buscar alunos:", err);
        setError("Erro ao carregar alunos: " + err.message);
        setAlunos([]); // Limpa a lista de alunos em caso de erro
      }
    };
    fetchAlunos();
  }, [selectedTurma]);

  // Buscar histórico de presença do aluno
  useEffect(() => {
    if (!selectedTurma || !selectedAluno) {
      setHistoricoAluno([]);
      setAlunoInfo(null);
      setTurmaInfo(null);
      return;
    }

    // Importante: não bloqueie por ano letivo da turma.
    // O filtro de ano será aplicado nos registros por data (data_aula),
    // permitindo visualizar quando o ano selecionado não coincide com o ano da turma.

    const fetchHistoricoAluno = async () => {
      setLoading(true);
      setError("");
      try {
        // Buscar histórico completo da turma e informações básicas
        const [historicoRes, turmaRes] = await Promise.all([
          fetch(
            `http://localhost:3001/turmas/${selectedTurma}/historico-presenca`,
            {
              credentials: "include",
            }
          ),
          fetch(
            `http://localhost:3001/turmas/${selectedTurma}/detalhes-presenca`,
            {
              credentials: "include",
            }
          ),
        ]);

        if (!historicoRes.ok || !turmaRes.ok) {
          const errors = [];
          if (!historicoRes.ok)
            errors.push(`Histórico: ${historicoRes.status}`);
          if (!turmaRes.ok) errors.push(`Turma: ${turmaRes.status}`);
          throw new Error(`Erro ao buscar dados - ${errors.join(", ")}`);
        }

        const historicoData = await historicoRes.json();
        const turmaData = await turmaRes.json();

        console.log("Dados recebidos:");
        console.log("historicoData:", historicoData);
        console.log("turmaData:", turmaData);
        console.log("selectedAluno:", selectedAluno);

        // Usar a lista de alunos da turma em vez de buscar alunos ativos globalmente
        if (!turmaData || !Array.isArray(turmaData.alunos)) {
          throw new Error(
            "Dados da turma são inválidos ou não contêm lista de alunos"
          );
        }

        // Encontrar informações do aluno selecionado na lista de alunos da turma
        const alunoSelecionado = turmaData.alunos.find(
          (aluno) => aluno.id == selectedAluno
        );
        if (!alunoSelecionado) {
          throw new Error("Aluno não encontrado");
        }

        // Filtrar histórico para o aluno específico
        const historicoDoAluno = [];

        // Verificar se historicoData é um array válido
        if (Array.isArray(historicoData) && historicoData.length > 0) {
          console.log(
            "Processando histórico com",
            historicoData.length,
            "dias"
          );

          historicoData.forEach((dia, diaIndex) => {
            console.log(
              `Dia ${diaIndex + 1}:`,
              dia.data_aula,
              "registros:",
              dia.registros?.length
            );

            // Verificar se dia.registros existe e é um array
            if (dia && Array.isArray(dia.registros)) {
              dia.registros.forEach((registro, registroIndex) => {
                console.log(
                  `  Registro ${registroIndex + 1}:`,
                  registro.aluno_id,
                  "status:",
                  registro.status
                );

                if (registro && registro.aluno_id == selectedAluno) {
                  console.log("  -> ENCONTROU ALUNO!", registro);

                  // Filtrar por ano se um ano específico foi selecionado
                  const dataAula = new Date(dia.data_aula);
                  const anoAula = dataAula.getFullYear();

                  console.log(
                    "  -> Ano da aula:",
                    anoAula,
                    "Ano selecionado:",
                    selectedYear
                  );

                  const dentroDoAno =
                    !selectedYear || anoAula.toString() === selectedYear;
                  const dentroDoPeriodo = (() => {
                    if (!startDate && !endDate) return true;
                    const d = new Date(dia.data_aula);
                    if (startDate && new Date(startDate) > d) return false;
                    if (endDate && d > new Date(endDate)) return false;
                    return true;
                  })();

                  if (dentroDoAno && dentroDoPeriodo) {
                    console.log("  -> ADICIONANDO REGISTRO!");
                    console.log(
                      "  -> Observação do registro:",
                      registro.observacao
                    );
                    historicoDoAluno.push({
                      data_aula: dia.data_aula,
                      status: registro.status,
                      observacao: registro.observacao || null,
                    });
                  } else {
                    console.log("  -> FILTRANDO POR ANO");
                  }
                }
              });
            } else {
              console.log(`  Dia sem registros válidos:`, dia.registros);
            }
          });
        } else {
          console.log("historicoData é inválido:", historicoData);
        }

        console.log("Histórico do aluno filtrado:", historicoDoAluno);
        console.log(
          "Observações encontradas:",
          historicoDoAluno.map((h) => h.observacao).filter((obs) => obs)
        );

        setHistoricoAluno(historicoDoAluno);
        setAlunoInfo(alunoSelecionado);
        setTurmaInfo(turmaData);
      } catch (err) {
        console.error("Erro ao carregar histórico:", err);
        setError("Erro ao carregar histórico: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistoricoAluno();
  }, [selectedTurma, selectedAluno, selectedYear, startDate, endDate, turmas]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Date(
      date.getTime() + date.getTimezoneOffset() * 60000
    ).toLocaleDateString("pt-BR");
  };

  const calcularEstatisticas = () => {
    if (!historicoAluno.length)
      return { presencas: 0, faltas: 0, faltasJustificadas: 0, total: 0 };

    let presencas = 0;
    let faltas = 0;
    let faltasJustificadas = 0;

    historicoAluno.forEach((item) => {
      switch (item.status) {
        case "P":
          presencas++;
          break;
        case "F":
          faltas++;
          break;
        case "FJ":
          faltasJustificadas++;
          break;
      }
    });

    return {
      presencas,
      faltas,
      faltasJustificadas,
      total: historicoAluno.length,
    };
  };

  const generatePDF = async () => {
    if (!alunoInfo || !turmaInfo || !historicoAluno.length) {
      alert("Não há dados suficientes para gerar o PDF");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const periodoTexto =
      startDate || endDate
        ? `Período: ${startDate ? formatBRDate(startDate) : ""}${
            startDate && endDate ? " a " : ""
          }${endDate ? formatBRDate(endDate) : ""}`
        : selectedYear
        ? `Ano letivo: ${selectedYear}`
        : "Período: Todos os dias";

    let yPosition = await drawHeader(doc, {
      title: "Histórico Individual de Presença",
      subtitle: `${alunoInfo.nome_completo} • Turma: ${turmaInfo.nome_turma} • ${periodoTexto}`,
    });

    // Informações do aluno
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("ALUNO:", 20, yPosition);
    doc.setFont("helvetica", "normal");
    doc.text(alunoInfo.nome_completo, 55, yPosition);
    yPosition += 10;

    // Informações da turma
    doc.setFont("helvetica", "bold");
    doc.text("TURMA:", 20, yPosition);
    doc.setFont("helvetica", "normal");
    doc.text(turmaInfo.nome_turma, 55, yPosition);
    yPosition += 10;

    // Período de análise
    if (selectedYear) {
      doc.setFont("helvetica", "bold");
      doc.text("ANO LETIVO:", 20, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(selectedYear, 75, yPosition);
      yPosition += 10;
    }

    // Data do relatório
    doc.setFont("helvetica", "bold");
    doc.text("RELATÓRIO GERADO EM:", 20, yPosition);
    doc.setFont("helvetica", "normal");
    doc.text(new Date().toLocaleDateString("pt-BR"), 105, yPosition);
    yPosition += 15;

    // Resumo estatístico
    const stats = calcularEstatisticas();
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("RESUMO ESTATÍSTICO:", 20, yPosition);
    yPosition += 8;

    doc.setFont("helvetica", "normal");
    doc.text(`• Total de Aulas: ${stats.total}`, 25, yPosition);
    yPosition += 6;
    doc.text(`• Presenças: ${stats.presencas}`, 25, yPosition);
    yPosition += 6;
    doc.text(`• Faltas: ${stats.faltas}`, 25, yPosition);
    yPosition += 6;
    doc.text(
      `• Faltas Justificadas: ${stats.faltasJustificadas}`,
      25,
      yPosition
    );
    yPosition += 6;

    // Percentual de presença
    const percentualPresenca =
      stats.total > 0 ? ((stats.presencas / stats.total) * 100).toFixed(1) : 0;
    doc.text(`• Percentual de Presença: ${percentualPresenca}%`, 25, yPosition);
    yPosition += 15;

    // Histórico detalhado
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("HISTÓRICO DETALHADO:", 20, yPosition);
    yPosition += 10;

    // Cabeçalho da tabela
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("DATA", 20, yPosition);
    doc.text("STATUS", 60, yPosition);
    doc.text("OBSERVAÇÃO", 100, yPosition);
    yPosition += 2;

    // Linha separadora
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 6;

    // Dados do histórico
    doc.setFont("helvetica", "normal");
    historicoAluno
      .sort((a, b) => new Date(b.data_aula) - new Date(a.data_aula)) // Ordenar por data (mais recente primeiro)
      .forEach((registro, index) => {
        // Verificar se precisa de nova página
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = 20;

          // Repetir cabeçalho da tabela na nova página
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.text("DATA", 20, yPosition);
          doc.text("STATUS", 60, yPosition);
          doc.text("OBSERVAÇÃO", 100, yPosition);
          yPosition += 2;
          doc.line(20, yPosition, 190, yPosition);
          yPosition += 6;
          doc.setFont("helvetica", "normal");
        }

        // Data
        doc.text(formatDate(registro.data_aula), 20, yPosition);

        // Status
        const statusText = statusMap[registro.status]?.text || registro.status;
        doc.text(statusText, 60, yPosition);

        // Observação (truncada se muito longa)
        const observacao = registro.observacao || "—";
        const maxObsLength = 35;
        const obsText =
          observacao.length > maxObsLength
            ? observacao.substring(0, maxObsLength) + "..."
            : observacao;
        doc.text(obsText, 100, yPosition);

        yPosition += 8;
      });

    // Rodapé
    drawFooter(doc);

    // Nome do arquivo
    const nomeArquivo = `historico_${alunoInfo.nome_completo.replace(
      /\s+/g,
      "_"
    )}_${turmaInfo.nome_turma.replace(/\s+/g, "_")}_${
      selectedYear || "todos_anos"
    }.pdf`;

    // Salvar o PDF
    doc.save(nomeArquivo);
  };

  const stats = calcularEstatisticas();

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Cabeçalho */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h1 style={{ margin: 0 }}>Histórico Individual de Presença</h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={generatePDF}
            disabled={!alunoInfo || !historicoAluno.length}
            style={{
              padding: "8px 16px",
              cursor:
                !alunoInfo || !historicoAluno.length
                  ? "not-allowed"
                  : "pointer",
              backgroundColor:
                !alunoInfo || !historicoAluno.length ? "#ccc" : "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontWeight: "bold",
            }}
          >
            📄 Gerar PDF
          </button>
          <button
            onClick={() => navigate(-1)}
            style={{ padding: "8px 16px", cursor: "pointer" }}
          >
            Voltar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          marginBottom: "2rem",
          alignItems: "end",
        }}
      >
        <div style={{ minWidth: "150px" }}>
          <SelectWithHint
            label="Ano Letivo:"
            hint="Filtre por ano letivo específico ou visualize todos os anos disponíveis"
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(e.target.value);
              setSelectedTurma("");
              setSelectedAluno("");
            }}
          >
            <option value="">Todos os anos</option>
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </SelectWithHint>
        </div>

        <div style={{ minWidth: "200px" }}>
          <SelectWithHint
            label="Selecionar Turma:"
            hint="Escolha a turma para visualizar os alunos e seus históricos de presença"
            value={selectedTurma}
            onChange={(e) => {
              setSelectedTurma(e.target.value);
              setSelectedAluno("");
            }}
          >
            <option value="">Selecione uma turma</option>
            {turmas
              .filter(
                (turma) =>
                  !selectedYear || turma.ano_letivo.toString() === selectedYear
              )
              .map((turma) => (
                <option key={turma.id} value={turma.id}>
                  {turma.nome_turma}
                </option>
              ))}
          </SelectWithHint>
        </div>

        <div style={{ minWidth: "200px" }}>
          <SelectWithHint
            label="Selecionar Aluno:"
            hint="Selecione o aluno para ver seu histórico completo de presença, faltas e justificativas"
            value={selectedAluno}
            onChange={(e) => setSelectedAluno(e.target.value)}
            disabled={!selectedTurma}
          >
            <option value="">Selecione um aluno</option>
            {alunos.map((aluno) => (
              <option key={aluno.id} value={aluno.id}>
                {aluno.nome_completo}
              </option>
            ))}
          </SelectWithHint>
        </div>

        <div style={{ minWidth: 180 }}>
          <label style={{ display: "block", fontSize: 12, color: "#555" }}>
            De
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ padding: "6px 8px", width: "100%" }}
          />
        </div>
        <div style={{ minWidth: 180 }}>
          <label style={{ display: "block", fontSize: 12, color: "#555" }}>
            Até
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ padding: "6px 8px", width: "100%" }}
          />
        </div>
      </div>

      {/* Informações do aluno selecionado */}
      {alunoInfo && turmaInfo && (
        <div
          style={{
            backgroundColor: "#f8f9fa",
            padding: "20px",
            borderRadius: "8px",
            marginBottom: "2rem",
            border: "1px solid #dee2e6",
          }}
        >
          <h2 style={{ margin: "0 0 15px 0", color: "#495057" }}>
            Informações do Aluno
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "10px",
            }}
          >
            <p>
              <strong>Nome:</strong> {alunoInfo.nome_completo}
            </p>
            <p>
              <strong>Turma:</strong> {turmaInfo.nome_turma}
            </p>
          </div>
        </div>
      )}

      {/* Estatísticas */}
      {historicoAluno.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "15px",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{
              backgroundColor: "#d4edda",
              padding: "15px",
              borderRadius: "8px",
              textAlign: "center",
              border: "1px solid #c3e6cb",
            }}
          >
            <h3 style={{ margin: 0, color: "#155724" }}>Presenças</h3>
            <p
              style={{
                fontSize: "24px",
                margin: "5px 0",
                fontWeight: "bold",
                color: "#155724",
              }}
            >
              {stats.presencas}
            </p>
          </div>
          <div
            style={{
              backgroundColor: "#f8d7da",
              padding: "15px",
              borderRadius: "8px",
              textAlign: "center",
              border: "1px solid #f5c6cb",
            }}
          >
            <h3 style={{ margin: 0, color: "#721c24" }}>Faltas</h3>
            <p
              style={{
                fontSize: "24px",
                margin: "5px 0",
                fontWeight: "bold",
                color: "#721c24",
              }}
            >
              {stats.faltas}
            </p>
          </div>
          <div
            style={{
              backgroundColor: "#fff3cd",
              padding: "15px",
              borderRadius: "8px",
              textAlign: "center",
              border: "1px solid #ffeaa7",
            }}
          >
            <h3 style={{ margin: 0, color: "#856404" }}>Faltas Justificadas</h3>
            <p
              style={{
                fontSize: "24px",
                margin: "5px 0",
                fontWeight: "bold",
                color: "#856404",
              }}
            >
              {stats.faltasJustificadas}
            </p>
          </div>
          <div
            style={{
              backgroundColor: "#e2e3e5",
              padding: "15px",
              borderRadius: "8px",
              textAlign: "center",
              border: "1px solid #d6d8db",
            }}
          >
            <h3 style={{ margin: 0, color: "#383d41" }}>Total de Aulas</h3>
            <p
              style={{
                fontSize: "24px",
                margin: "5px 0",
                fontWeight: "bold",
                color: "#383d41",
              }}
            >
              {stats.total}
            </p>
          </div>
        </div>
      )}

      {/* Mensagens de erro ou carregamento */}
      {error && (
        <div
          style={{
            color: "#dc3545",
            marginBottom: "1rem",
            padding: "10px",
            backgroundColor: "#f8d7da",
            borderRadius: "4px",
          }}
        >
          {error}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          Carregando histórico...
        </div>
      )}

      {/* Histórico detalhado */}
      {!loading && !error && selectedAluno && historicoAluno.length === 0 && (
        <div style={{ textAlign: "center", padding: "2rem", color: "#6c757d" }}>
          Nenhum registro de presença encontrado para este aluno.
        </div>
      )}

      {!loading && !error && historicoAluno.length > 0 && (
        <div>
          <h2 style={{ marginBottom: "1rem" }}>
            Histórico Detalhado de Presença
          </h2>
          <div
            style={{
              display: "grid",
              gap: "10px",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            }}
          >
            {historicoAluno.map((registro, index) => {
              const status = statusMap[registro.status] || {
                text: "Desconhecido",
                color: "#6c757d",
              };
              return (
                <div
                  key={index}
                  style={{
                    padding: "15px",
                    border: "1px solid #dee2e6",
                    borderRadius: "8px",
                    backgroundColor: "#fff",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}
                  >
                    <strong>{formatDate(registro.data_aula)}</strong>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        backgroundColor: status.color,
                        color: "white",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    >
                      {status.text}
                    </span>
                  </div>
                  {registro.observacao && (
                    <div
                      style={{
                        padding: "8px",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "4px",
                        fontSize: "14px",
                        borderLeft: "3px solid #007bff",
                      }}
                    >
                      <strong>Observação:</strong> {registro.observacao}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoricoAlunoPresencaPage;
