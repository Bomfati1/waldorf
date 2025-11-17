import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import { drawHeader, drawFooter, formatBRDate } from "../utils/pdfUtils";

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
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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

  const generatePDF = async (dia) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = await drawHeader(doc, {
      title: "Relatório de Presença",
      subtitle: turmaInfo?.nome_turma
        ? `Turma: ${turmaInfo?.nome_turma}`
        : undefined,
      rightText: formatBRDate(dia.data_aula),
    });

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
    drawFooter(doc);

    // Salva o PDF
    const fileName = `relatorio_presenca_${
      turmaInfo?.nome_turma?.replace(/\s+/g, "_") || "turma"
    }_${formatDate(dia.data_aula).replace(/\//g, "-")}.pdf`;
    doc.save(fileName);
  };

  const isWithinRange = (dateStr) => {
    if (!startDate && !endDate) return true;
    const d = new Date(dateStr);
    if (startDate && new Date(startDate) > d) return false;
    if (endDate && d > new Date(endDate)) return false;
    return true;
  };

  const historicoFiltrado = Array.isArray(historico)
    ? historico.filter((d) => isWithinRange(d.data_aula))
    : [];

  const computeConsolidado = () => {
    const map = new Map();
    historicoFiltrado.forEach((dia) => {
      if (!Array.isArray(dia.registros)) return;
      dia.registros.forEach((reg) => {
        const key = reg.aluno_id;
        if (!map.has(key)) {
          map.set(key, {
            aluno_id: key,
            nome: reg.nome_completo,
            P: 0,
            F: 0,
            FJ: 0,
          });
        }
        const entry = map.get(key);
        if (reg.status === "P") entry.P += 1;
        else if (reg.status === "F") entry.F += 1;
        else if (reg.status === "FJ") entry.FJ += 1;
      });
    });
    const arr = Array.from(map.values()).map((e) => ({
      ...e,
      total: e.P + e.F + e.FJ,
      perc:
        e.P + e.F + e.FJ > 0
          ? ((e.P / (e.P + e.F + e.FJ)) * 100).toFixed(1)
          : "0.0",
    }));
    arr.sort((a, b) => a.nome.localeCompare(b.nome));
    return arr;
  };

  const generateConsolidatedPDF = async () => {
    if (!historicoFiltrado.length) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const periodSubtitle =
      startDate || endDate
        ? `Período: ${startDate ? formatBRDate(startDate) : ""}${
            startDate && endDate ? " a " : ""
          }${endDate ? formatBRDate(endDate) : ""}`
        : "Período: Todos os dias";
    let y = await drawHeader(doc, {
      title: "Consolidado de Presenças",
      subtitle: turmaInfo?.nome_turma
        ? `Turma: ${turmaInfo.nome_turma} • ${periodSubtitle}`
        : periodSubtitle,
    });

    // Table header
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Nº", 20, y);
    doc.text("ALUNO", 30, y);
    doc.text("P", 120, y);
    doc.text("F", 130, y);
    doc.text("FJ", 140, y);
    doc.text("TOTAL", 155, y);
    doc.text("% PRES.", 175, y);
    y += 4;
    doc.line(20, y, pageWidth - 20, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    const rows = computeConsolidado();
    for (let idx = 0; idx < rows.length; idx++) {
      const r = rows[idx];
      if (y > pageHeight - 20) {
        doc.addPage();
        y = await drawHeader(doc, {
          title: "Consolidado de Presenças",
          subtitle: turmaInfo?.nome_turma
            ? `Turma: ${turmaInfo.nome_turma} • ${periodSubtitle}`
            : periodSubtitle,
        });
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Nº", 20, y);
        doc.text("ALUNO", 30, y);
        doc.text("P", 120, y);
        doc.text("F", 130, y);
        doc.text("FJ", 140, y);
        doc.text("TOTAL", 155, y);
        doc.text("% PRES.", 175, y);
        y += 4;
        doc.line(20, y, pageWidth - 20, y);
        y += 6;
        doc.setFont("helvetica", "normal");
      }
      doc.text(String(idx + 1), 20, y);
      doc.text(r.nome, 30, y);
      doc.text(String(r.P), 120, y);
      doc.text(String(r.F), 130, y);
      doc.text(String(r.FJ), 140, y);
      doc.text(String(r.total), 155, y);
      doc.text(`${r.perc}%`, 175, y, { align: "right" });
      y += 7;
    }

    drawFooter(doc);
    const suffix =
      startDate || endDate
        ? `${startDate ? startDate : ""}_${endDate ? endDate : ""}`.replace(
            /\//g,
            "-"
          )
        : "todos";
    const fileName = `consolidado_presencas_${
      turmaInfo?.nome_turma?.replace(/\s+/g, "_") || "turma"
    }_${suffix}.pdf`;
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
      {/* Filtros de período */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          alignItems: "end",
          marginBottom: "1rem",
        }}
      >
        <div>
          <label style={{ display: "block", fontSize: 12, color: "#555" }}>
            De
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ padding: "6px 8px" }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, color: "#555" }}>
            Até
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ padding: "6px 8px" }}
          />
        </div>
        <div style={{ marginLeft: "auto" }}>
          <button
            onClick={generateConsolidatedPDF}
            disabled={!historicoFiltrado.length}
            style={{
              padding: "8px 16px",
              cursor: historicoFiltrado.length ? "pointer" : "not-allowed",
              backgroundColor: historicoFiltrado.length ? "#28a745" : "#ccc",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontWeight: "bold",
            }}
          >
            📄 Gerar PDF Consolidado
          </button>
        </div>
      </div>
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

      {historicoFiltrado.length === 0 ? (
        <p>Nenhum registro de presença encontrado para esta turma.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Consolidado em tela */}
          <div
            style={{
              border: "1px solid #dee2e6",
              borderRadius: 8,
              padding: "1rem",
              backgroundColor: "#f8f9fa",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <strong>Consolidado de Presenças no Período</strong>
              <span style={{ color: "#555", fontSize: 12 }}>
                {startDate || endDate
                  ? `${startDate ? formatDate(startDate) : ""}${
                      startDate && endDate ? " a " : ""
                    }${endDate ? formatDate(endDate) : ""}`
                  : "Todos os dias"}
              </span>
            </div>
            <div style={{ overflowX: "auto", marginTop: 10 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #dee2e6" }}>
                    <th style={{ padding: 8, textAlign: "left" }}>#</th>
                    <th style={{ padding: 8, textAlign: "left" }}>Aluno</th>
                    <th style={{ padding: 8, textAlign: "left" }}>P</th>
                    <th style={{ padding: 8, textAlign: "left" }}>F</th>
                    <th style={{ padding: 8, textAlign: "left" }}>FJ</th>
                    <th style={{ padding: 8, textAlign: "left" }}>Total</th>
                    <th style={{ padding: 8, textAlign: "left" }}>% Pres.</th>
                  </tr>
                </thead>
                <tbody>
                  {computeConsolidado().map((r, idx) => (
                    <tr
                      key={r.aluno_id}
                      style={{ borderBottom: "1px solid #f0f0f0" }}
                    >
                      <td style={{ padding: 8 }}>{idx + 1}</td>
                      <td style={{ padding: 8 }}>{r.nome}</td>
                      <td style={{ padding: 8 }}>{r.P}</td>
                      <td style={{ padding: 8 }}>{r.F}</td>
                      <td style={{ padding: 8 }}>{r.FJ}</td>
                      <td style={{ padding: 8 }}>{r.total}</td>
                      <td style={{ padding: 8 }}>{r.perc}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {historicoFiltrado.map((dia) => (
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
