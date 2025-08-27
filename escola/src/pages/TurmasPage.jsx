import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const TurmasPage = () => {
  const [nivelSelecionado, setNivelSelecionado] = useState("jardim");
  const [selectedTurma, setSelectedTurma] = useState(null);
  const [hoveredCardId, setHoveredCardId] = useState(null);
  const [turmas, setTurmas] = useState([]);
  const [yearFilter, setYearFilter] = useState("");
  const [availableYears, setAvailableYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTurmas = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:3001/turmas");
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
        />
      )}
    </div>
  );
};

// --- Componente do Modal ---

const TurmaModal = ({ turma, onClose, onDelete }) => {
  const navigate = useNavigate();
  const fileInputRef = React.useRef(null);
  const [uploadTarget, setUploadTarget] = useState(null); // { type: 'turma' } ou { type: 'aluno', id: alunoId, nome: 'Nome Aluno' }

  const handleAttachReportClick = (target) => {
    setUploadTarget(target);
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file || !uploadTarget) return;

    const targetName =
      uploadTarget.type === "turma"
        ? `turma ${turma.nome_turma}`
        : `aluno(a) ${uploadTarget.nome}`;

    if (
      !window.confirm(
        `Deseja anexar o arquivo "${file.name}" para ${targetName}?`
      )
    ) {
      // Limpa o input se o usuário cancelar
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setUploadTarget(null);
      return;
    }

    // --- Início da Lógica de Upload para o Backend ---
    const formData = new FormData();
    // 'relatorio' é o nome do campo que o backend (ex: multer) vai esperar
    formData.append("relatorio", file);
    formData.append("tipo", uploadTarget.type); // 'turma' ou 'aluno'

    if (uploadTarget.type === "turma") {
      formData.append("turmaId", turma.id);
    } else {
      formData.append("alunoId", uploadTarget.id);
    }

    try {
      // Opcional: Adicionar um estado de loading para feedback visual
      // setLoadingUpload(true);
      alert(`Enviando o arquivo "${file.name}"...`); // Feedback temporário

      const response = await fetch("http://localhost:3001/relatorios/upload", {
        method: "POST",
        body: formData,
        // Nota: Não defina o header 'Content-Type'. O navegador o define
        // automaticamente como 'multipart/form-data' com o boundary correto.
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Falha no upload do arquivo.");
      }

      alert(`Sucesso! Arquivo "${file.name}" anexado para ${targetName}.`);
      console.log("Resposta do servidor:", result);
    } catch (err) {
      console.error("Erro no upload:", err);
      alert(`Erro ao enviar o arquivo: ${err.message}`);
    } finally {
      // Limpa o input e o target após a tentativa de upload
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setUploadTarget(null);
      // setLoadingUpload(false);
    }
    // --- Fim da Lógica de Upload ---
  };

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
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }}
          accept=".pdf,.doc,.docx,.jpg,.png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        />
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
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>
                    {index + 1}. {aluno.nome_completo}
                  </span>
                  <button
                    onClick={() =>
                      handleAttachReportClick({
                        type: "aluno",
                        id: aluno.id,
                        nome: aluno.nome_completo,
                      })
                    }
                    style={{
                      padding: "6px 12px",
                      fontSize: "12px",
                      cursor: "pointer",
                      border: "1px solid #6c757d",
                      backgroundColor: "#fff",
                      color: "#6c757d",
                      borderRadius: "4px",
                    }}
                  >
                    Anexar Relatório
                  </button>
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
            justifyContent: "flex-end",
            gap: "1rem",
            flexWrap: "wrap", // Adicionado para melhor responsividade
          }}
        >
          <button
            onClick={handleDelete}
            style={{
              padding: "10px 16px",
              cursor: "pointer",
              border: "none",
              backgroundColor: "#dc3545",
              color: "white",
              borderRadius: "6px",
              marginRight: "auto", // Empurra este botão para a esquerda
            }}
          >
            Excluir Turma
          </button>

          <button
            onClick={() => handleAttachReportClick({ type: "turma" })}
            style={{
              padding: "10px 16px",
              cursor: "pointer",
              border: "1px solid #17a2b8",
              backgroundColor: "#fff",
              color: "#17a2b8",
              borderRadius: "6px",
            }}
          >
            Anexar Relatório da Turma
          </button>
          <button
            onClick={() =>
              navigate(`/home/turmas/${turma.id}/historico-presenca`)
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
          <button
            onClick={() => navigate(`/home/turmas/${turma.id}/presenca`)}
            style={{
              padding: "10px 16px",
              cursor: "pointer",
              border: "none",
              backgroundColor: "#28a745",
              color: "white",
              borderRadius: "6px",
            }}
          >
            Registrar Presença
          </button>
        </div>
      </div>
    </div>
  );
};

export default TurmasPage;
