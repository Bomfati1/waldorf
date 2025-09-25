import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import jsPDF from "jspdf";

const TurmasPage = () => {
  const { user } = useAuth();
  const [nivelSelecionado, setNivelSelecionado] = useState("jardim");
  const [selectedTurma, setSelectedTurma] = useState(null);
  const [hoveredCardId, setHoveredCardId] = useState(null);
  const [turmas, setTurmas] = useState([]);
  const [yearFilter, setYearFilter] = useState("");
  const [availableYears, setAvailableYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAlunosModal, setShowAlunosModal] = useState(false);
  const [alunosDaTurma, setAlunosDaTurma] = useState([]);
  const [loadingAlunos, setLoadingAlunos] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTurmas = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:3001/turmas", {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Falha ao buscar dados das turmas.");
        }
        const data = await response.json();
        setTurmas(data);

        // Extrair anos letivos únicos e definir o filtro inicial
        if (data.length > 0) {
          const years = [...new Set(data.map((t) => t.ano_letivo))].sort(
            (a, b) => b - a
          );
          setAvailableYears(years);
          setYearFilter(years[0].toString()); // Define o ano mais recente como padrão
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTurmas();
  }, []);

  // Filtra as turmas com base no nível e ano selecionados
  const turmasFiltradas = turmas.filter((turma) => {
    // O backend retorna 'nivel' como um booleano (false para Jardim, true para Maternal)
    const nivelMatch =
      (nivelSelecionado === "jardim" && turma.nivel === false) ||
      (nivelSelecionado === "maternal" && turma.nivel === true);

    // Se yearFilter for "" (Todos), o filtro de ano passa.
    const yearMatch = !yearFilter || turma.ano_letivo.toString() === yearFilter;

    return nivelMatch && yearMatch;
  });

  const handleDeleteTurma = async (turmaId) => {
    if (
      window.confirm(
        "Tem certeza que deseja excluir esta turma? Esta ação removerá todas as matrículas associadas e não pode ser desfeita."
      )
    ) {
      try {
        const response = await fetch(
          `http://localhost:3001/turmas/${turmaId}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Falha ao excluir a turma.");
        }

        // Remove a turma da lista e fecha o modal
        setTurmas((prevTurmas) => prevTurmas.filter((t) => t.id !== turmaId));
        setSelectedTurma(null);
        alert("Turma excluída com sucesso!");
      } catch (err) {
        console.error("Erro ao excluir turma:", err);
        alert(`Erro: ${err.message}`);
      }
    }
  };

  const handleTurmaClick = (turma) => {
    setSelectedTurma(turma);
  };

  const handleCloseModal = () => {
    setSelectedTurma(null);
  };

  const handleViewAlunos = async (turma) => {
    setLoadingAlunos(true);
    console.log("Buscando alunos para turma:", turma);
    try {
      const url = `http://localhost:3001/turmas/${turma.id}/alunos`;
      console.log("URL da requisição:", url);

      const response = await fetch(url, {
        credentials: "include",
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.log("Erro da resposta:", errorText);
        throw new Error(
          `Falha ao buscar alunos da turma. Status: ${response.status}`
        );
      }
      const alunos = await response.json();
      console.log("Alunos encontrados:", alunos);
      setAlunosDaTurma(alunos);
      setShowAlunosModal(true);
    } catch (err) {
      console.error("Erro ao buscar alunos:", err);
      alert(`Erro: ${err.message}`);
    } finally {
      setLoadingAlunos(false);
    }
  };

  const handleCloseAlunosModal = () => {
    setShowAlunosModal(false);
    setAlunosDaTurma([]);
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

  if (loading) {
    return <div style={{ padding: "2rem" }}>Carregando turmas...</div>;
  }

  if (error) {
    return <div style={{ padding: "2rem" }}>Erro: {error}</div>;
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
          marginBottom: "1.5rem",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "2rem" }}>Gerenciamento de Turmas</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <label htmlFor="year-filter">Ano Letivo:</label>
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
            <option value="">Todos</option>
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Seleção de Nível */}
      <div style={{ marginBottom: "2rem", borderBottom: "1px solid #ccc" }}>
        <button
          style={
            nivelSelecionado === "jardim" ? activeButtonStyle : baseButtonStyle
          }
          onClick={() => setNivelSelecionado("jardim")}
        >
          Jardim
        </button>
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
      </div>

      {/* Grid de Turmas */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {turmasFiltradas.length > 0 ? (
          turmasFiltradas.map((turma) => (
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
                {turma.nome_turma}
              </h3>
              <p style={{ margin: "0.5rem 0" }}>
                <strong>Professor(a):</strong>{" "}
                {turma.professores.length > 0
                  ? turma.professores.map((p) => p.nome).join(", ")
                  : "Nenhum professor associado"}
              </p>
              <p style={{ margin: "0.5rem 0" }}>
                <strong>Período:</strong>{" "}
                <span style={{ textTransform: "capitalize" }}>
                  {turma.periodo}
                </span>
              </p>
              <p style={{ margin: "0.5rem 0" }}>
                <strong>Alunos:</strong> {turma.alunos_count}
              </p>
            </div>
          ))
        ) : (
          <p>Nenhuma turma encontrada para o nível selecionado.</p>
        )}
      </div>

      {selectedTurma && (
        <TurmaModal
          turma={selectedTurma}
          onClose={handleCloseModal}
          onDelete={handleDeleteTurma}
          onViewAlunos={handleViewAlunos}
          user={user}
        />
      )}

      {showAlunosModal && (
        <AlunosModal
          turma={selectedTurma}
          alunos={alunosDaTurma}
          onClose={handleCloseAlunosModal}
          loading={loadingAlunos}
        />
      )}
    </div>
  );
};

// --- Componente do Modal ---

const TurmaModal = ({ turma, onClose, onDelete, onViewAlunos, user }) => {
  const navigate = useNavigate();

  const handleModalContentClick = (e) => {
    e.stopPropagation();
  };

  const handleDelete = () => {
    onDelete(turma.id);
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
          <h2 style={{ margin: 0 }}>{turma.nome_turma}</h2>
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
          <h3 style={{ marginTop: 0 }}>Alunos ({turma.alunos_count})</h3>
          {turma.alunos && turma.alunos.length > 0 ? (
            <ul style={{ listStyle: "none", paddingLeft: "0", margin: 0 }}>
              {turma.alunos.map((aluno, index) => (
                <li
                  key={aluno.id}
                  style={{
                    padding: "12px 8px",
                    borderBottom: "1px solid #f0f0f0",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <span>
                    {index + 1}. {aluno.nome_completo}
                  </span>
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
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          {/* Botão de excluir só aparece para administradores */}
          {user && user.cargo && user.cargo.toLowerCase() !== "professor" && (
            <button
              onClick={handleDelete}
              style={{
                padding: "10px 16px",
                cursor: "pointer",
                border: "none",
                backgroundColor: "#dc3545",
                color: "white",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Excluir Turma
            </button>
          )}

          {/* Grupo de botões principais */}
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {/* Botão Ver Alunos */}
            <button
              onClick={() => onViewAlunos(turma)}
              style={{
                padding: "10px 16px",
                cursor: "pointer",
                border: "none",
                backgroundColor: "#007bff",
                color: "white",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Ver Alunos ({turma.alunos_count})
            </button>

            {/* Botão Ver Histórico de Presença */}
            <button
              onClick={() =>
                navigate(`/home/turmas/${turma.id}/historico-presenca`)
              }
              style={{
                padding: "10px 16px",
                cursor: "pointer",
                border: "1px solid #6c757d",
                backgroundColor: "#fff",
                color: "#6c757d",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Histórico de Presença
            </button>

            {/* Botão Registrar Presença */}
            <button
              onClick={() => navigate(`/home/turmas/${turma.id}/presenca`)}
              style={{
                padding: "10px 16px",
                cursor: "pointer",
                border: "none",
                backgroundColor: "#28a745",
                color: "white",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Registrar Presença
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Componente do Modal de Alunos ---

const AlunosModal = ({ turma, alunos, onClose, loading }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Date(
      date.getTime() + date.getTimezoneOffset() * 60000
    ).toLocaleDateString("pt-BR");
  };

  const generateAlunosPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Cabeçalho do relatório
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("RELATÓRIO DE ALUNOS DA TURMA", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 15;

    // Informações da turma
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("TURMA:", 20, yPosition);
    doc.setFont("helvetica", "normal");
    doc.text(turma?.nome_turma || "N/A", 45, yPosition);
    yPosition += 10;

    // Ano letivo
    doc.setFont("helvetica", "bold");
    doc.text("ANO LETIVO:", 20, yPosition);
    doc.setFont("helvetica", "normal");
    doc.text(turma?.ano_letivo?.toString() || "N/A", 55, yPosition);
    yPosition += 12;

    // Período
    doc.setFont("helvetica", "bold");
    doc.text("PERÍODO:", 20, yPosition);
    doc.setFont("helvetica", "normal");
    doc.text(turma?.periodo || "N/A", 50, yPosition);
    yPosition += 12;

    // Professores
    if (turma?.professores && turma.professores.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.text("PROFESSOR(ES):",20, yPosition);
      doc.setFont("helvetica", "normal");
      const professores = turma.professores.map(p => p.nome).join(", ");
      
      // Verifica se o texto é muito longo e quebra em múltiplas linhas se necessário
      const maxWidth = pageWidth - 70; // Largura máxima disponível
      const lines = doc.splitTextToSize(professores, maxWidth);
      
      if (lines.length === 1) {
        // Se cabe em uma linha, coloca na mesma linha do label
        doc.text(professores, 65, yPosition);
        yPosition += 12;
      } else {
        // Se precisa de múltiplas linhas, coloca na linha seguinte
        yPosition += 6;
        doc.text(lines, 20, yPosition);
        yPosition += (lines.length * 6) + 6;
      }
    }

    // Resumo
    yPosition += 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("RESUMO:", 20, yPosition);
    yPosition += 8;

    doc.setFont("helvetica", "normal");
    doc.text(`• Total de Alunos: ${alunos.length}`, 25, yPosition);
    yPosition += 6;

    // Contar alunos ativos e inativos
    const alunosAtivos = alunos.filter(a => a.status_aluno).length;
    const alunosInativos = alunos.length - alunosAtivos;
    doc.text(`• Alunos Ativos: ${alunosAtivos}`, 25, yPosition);
    yPosition += 6;
    doc.text(`• Alunos Inativos: ${alunosInativos}`, 25, yPosition);
    yPosition += 6;

    // Contar status de pagamento
    const emDia = alunos.filter(a => a.status_pagamento?.toLowerCase() === 'em_dia').length;
    const atrasado = alunos.filter(a => a.status_pagamento?.toLowerCase() === 'atrasado').length;
    const isento = alunos.filter(a => a.status_pagamento?.toLowerCase() === 'isento').length;
    
    doc.text(`• Pagamentos em Dia: ${emDia}`, 25, yPosition);
    yPosition += 6;
    doc.text(`• Pagamentos Atrasados: ${atrasado}`, 25, yPosition);
    yPosition += 6;
    doc.text(`• Isentos: ${isento}`, 25, yPosition);
    yPosition += 15;

    // Tabela de alunos
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("LISTA DE ALUNOS:", 20, yPosition);
    yPosition += 10;

    // Cabeçalho da tabela
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Nº", 20, yPosition);
    doc.text("NOME", 30, yPosition);
    doc.text("NASCIMENTO", 80, yPosition);
    doc.text("STATUS", 110, yPosition);
    doc.text("PAGAMENTO", 130, yPosition);
    doc.text("RESPONSÁVEL", 160, yPosition);
    yPosition += 8;

    // Linha separadora
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 5;

    // Dados dos alunos
    doc.setFont("helvetica", "normal");
    alunos.forEach((aluno, index) => {
      // Verifica se precisa de nova página
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }

      doc.text((index + 1).toString(), 20, yPosition);
      
      // Nome (limitado a 25 caracteres)
      const nome = aluno.nome_completo.length > 25 
        ? aluno.nome_completo.substring(0, 25) + "..." 
        : aluno.nome_completo;
      doc.text(nome, 30, yPosition);
      
      // Data de nascimento
      doc.text(formatDate(aluno.data_nascimento), 80, yPosition);
      
      // Status
      const status = aluno.status_aluno ? "Ativo" : "Inativo";
      doc.text(status, 110, yPosition);
      
      // Status de pagamento
      const pagamento = getPaymentStatusText(aluno.status_pagamento);
      doc.text(pagamento, 130, yPosition);
      
      // Responsável (limitado a 20 caracteres)
      const responsavel = aluno.responsavel_nome || "N/A";
      const responsavelLimitado = responsavel.length > 20 
        ? responsavel.substring(0, 20) + "..." 
        : responsavel;
      doc.text(responsavelLimitado, 160, yPosition);
      
      yPosition += 6;
    });

    // Rodapé
    yPosition = pageHeight - 20;
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("Relatório gerado automaticamente pelo Sistema Escola", pageWidth / 2, yPosition, { align: "center" });
    doc.text(`Data de geração: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`, pageWidth / 2, yPosition + 5, { align: "center" });

    // Salva o PDF
    const fileName = `relatorio_alunos_${turma?.nome_turma?.replace(/\s+/g, '_') || 'turma'}_${turma?.ano_letivo || 'ano'}.pdf`;
    doc.save(fileName);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0);
  };

  const getStatusColor = (status) => {
    return status ? "#28a745" : "#dc3545";
  };

  const getStatusText = (status) => {
    return status ? "Ativo" : "Inativo";
  };

  const getPaymentStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "em_dia":
        return "#28a745";
      case "atrasado":
        return "#dc3545";
      case "isento":
        return "#007bff";
      default:
        return "#6c757d";
    }
  };

  const getPaymentStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case "em_dia":
        return "Em dia";
      case "atrasado":
        return "Atrasado";
      case "isento":
        return "Isento";
      default:
        return "N/A";
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "2rem",
          width: "90%",
          maxWidth: "1000px",
          maxHeight: "80vh",
          overflow: "auto",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            marginBottom: "1.5rem",
            borderBottom: "1px solid #eee",
            paddingBottom: "1rem",
          }}
        >
          <h2 style={{ margin: 0, color: "#333" }}>
            Alunos da Turma: {turma?.nome_turma}
          </h2>
          <p style={{ margin: "0.5rem 0 0 0", color: "#666" }}>
            {turma?.ano_letivo} • {turma?.periodo} • {alunos.length} aluno(s)
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <p>Carregando alunos...</p>
          </div>
        )}

        {/* Lista de Alunos */}
        {!loading && alunos.length > 0 && (
          <div style={{ display: "grid", gap: "1rem" }}>
            {alunos.map((aluno) => (
              <div
                key={aluno.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  padding: "1.5rem",
                  backgroundColor: "#f9f9f9",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "1rem",
                  }}
                >
                  <div>
                    <h4 style={{ margin: "0 0 0.5rem 0", color: "#333" }}>
                      {aluno.nome_completo}
                    </h4>
                    <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                      <strong>Data de Nascimento:</strong>{" "}
                      {formatDate(aluno.data_nascimento)}
                    </p>
                  </div>

                  <div>
                    <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                      <strong>Status:</strong>{" "}
                      <span
                        style={{ color: getStatusColor(aluno.status_aluno) }}
                      >
                        {getStatusText(aluno.status_aluno)}
                      </span>
                    </p>
                    <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                      <strong>Pagamento:</strong>{" "}
                      <span
                        style={{
                          color: getPaymentStatusColor(aluno.status_pagamento),
                        }}
                      >
                        {getPaymentStatusText(aluno.status_pagamento)}
                      </span>
                    </p>
                  </div>

                  <div>
                    {aluno.responsavel_nome && (
                      <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                        <strong>Responsável:</strong> {aluno.responsavel_nome}
                      </p>
                    )}
                    {aluno.responsavel_telefone && (
                      <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                        <strong>Telefone:</strong> {aluno.responsavel_telefone}
                      </p>
                    )}
                    {aluno.responsavel_email && (
                      <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                        <strong>Email:</strong> {aluno.responsavel_email}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mensagem quando não há alunos */}
        {!loading && alunos.length === 0 && (
          <div style={{ textAlign: "center", padding: "2rem", color: "#666" }}>
            <p>Nenhum aluno encontrado nesta turma.</p>
          </div>
        )}

        {/* Botões */}
        <div style={{ marginTop: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            onClick={generateAlunosPDF}
            disabled={loading || alunos.length === 0}
            style={{
              padding: "10px 20px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: alunos.length === 0 ? "not-allowed" : "pointer",
              opacity: alunos.length === 0 ? 0.6 : 1,
              fontSize: "14px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            📄 Gerar PDF
          </button>
          
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TurmasPage;
