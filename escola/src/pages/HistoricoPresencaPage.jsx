import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";

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

  const generatePDF = (dia) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Cabeçalho do relatório
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("RELATÓRIO DE PRESENÇA", pageWidth / 2, yPosition, {
      align: "center",
    });
    yPosition += 15;

    // Informações da turma
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("TURMA:", 20, yPosition);
    doc.setFont("helvetica", "normal");
    doc.text(turmaInfo?.nome_turma || "N/A", 50, yPosition);
    yPosition += 10;

    // Data do relatório
    doc.setFont("helvetica", "bold");
    doc.text("DATA:", 20, yPosition);
    doc.setFont("helvetica", "normal");
    doc.text(formatDate(dia.data_aula), 50, yPosition);
    yPosition += 10;

    // Período da turma (se disponível)
    if (turmaInfo?.periodo) {
      doc.setFont("helvetica", "bold");
      doc.text("PERÍODO:", 20, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(turmaInfo.periodo, 50, yPosition);
      yPosition += 10;
    }

    // Ano letivo (se disponível)
    if (turmaInfo?.ano_letivo) {
      doc.setFont("helvetica", "bold");
      doc.text("ANO LETIVO:", 20, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(turmaInfo.ano_letivo.toString(), 50, yPosition);
      yPosition += 10;
    }

    // Resumo da presença
    yPosition += 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("RESUMO:", 20, yPosition);
    yPosition += 8;

    doc.setFont("helvetica", "normal");
    doc.text(`• Total de Alunos: ${dia.registros.length}`, 25, yPosition);
    yPosition += 6;
    doc.text(`• Presentes: ${dia.presentes}`, 25, yPosition);
    yPosition += 6;
    doc.text(`• Faltas: ${dia.faltas}`, 25, yPosition);
    yPosition += 6;
    doc.text(
      `• Faltas Justificadas: ${dia.faltas_justificadas}`,
      25,
      yPosition
    );
    yPosition += 6;

    // Percentual de presença
    const percentualPresenca =
      dia.registros.length > 0
        ? ((dia.presentes / dia.registros.length) * 100).toFixed(1)
        : 0;
    doc.text(`• Percentual de Presença: ${percentualPresenca}%`, 25, yPosition);
    yPosition += 15;

    // Tabela de presenças
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("LISTA DE PRESENÇAS:", 20, yPosition);
    yPosition += 10;

    // Cabeçalho da tabela
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Nº", 20, yPosition);
    doc.text("NOME DO ALUNO", 35, yPosition);
    doc.text("STATUS", 120, yPosition);
    doc.text("OBSERVAÇÃO", 150, yPosition);
    yPosition += 8;

    // Linha separadora
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 5;

    // Dados dos alunos
    doc.setFont("helvetica", "normal");
    dia.registros.forEach((reg, index) => {
      // Verifica se precisa de nova página
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }

      doc.text((index + 1).toString(), 20, yPosition);
      doc.text(reg.nome_completo, 35, yPosition);

      // Status com cor
      const statusText = statusMap[reg.status]?.text || reg.status;
      doc.text(statusText, 120, yPosition);

      // Observação (limitada a 30 caracteres para não sair da página)
      const observacao = reg.observacao || "---";
      const observacaoLimitada =
        observacao.length > 30
          ? observacao.substring(0, 30) + "..."
          : observacao;
      doc.text(observacaoLimitada, 150, yPosition);

      yPosition += 6;
    });

    // Rodapé
    yPosition = pageHeight - 20;
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(
      "Relatório gerado automaticamente pelo Sistema Escola",
      pageWidth / 2,
      yPosition,
      { align: "center" }
    );
    doc.text(
      `Data de geração: ${new Date().toLocaleDateString(
        "pt-BR"
      )} às ${new Date().toLocaleTimeString("pt-BR")}`,
      pageWidth / 2,
      yPosition + 5,
      { align: "center" }
    );

    // Salva o PDF
    const fileName = `relatorio_presenca_${
      turmaInfo?.nome_turma?.replace(/\s+/g, "_") || "turma"
    }_${formatDate(dia.data_aula).replace(/\//g, "-")}.pdf`;
    doc.save(fileName);
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
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => {
              navigate(`/home/historico-aluno-presenca/${turmaId}`);
            }}
            style={{
              padding: "8px 16px",
              cursor: "pointer",
              backgroundColor: "#007bff",
              color: "white",
              border: "1px solid #007bff",
              borderRadius: "4px",
            }}
          >
            Observação
          </button>
          <button
            onClick={() => navigate(-1)}
            style={{ padding: "8px 16px", cursor: "pointer" }}
          >
            Voltar
          </button>
        </div>
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
                <div
                  style={{ display: "flex", gap: "1rem", alignItems: "center" }}
                >
                  <span>Presentes: {dia.presentes}</span>
                  <span>Faltas: {dia.faltas}</span>
                  <span>Justificadas: {dia.faltas_justificadas}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      generatePDF(dia);
                    }}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      fontWeight: "bold",
                      marginLeft: "1rem",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "#c82333";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "#dc3545";
                    }}
                  >
                    📄 Gerar PDF
                  </button>
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
