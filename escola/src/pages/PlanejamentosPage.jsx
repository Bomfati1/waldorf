import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "../context/AuthContext"; // Para obter o usuário logado
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import SelectWithHint from "../components/SelectWithHint";
import ListaComentarios from "../components/ListaComentarios";
import "../css/PlanejamentosPage.css";

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

const PlanejamentosPageCSS = () => (
  <style>{`
    .week-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      cursor: pointer;
      border-radius: 4px;
      transition: background-color 0.2s;
    }
    .planning-status-badge {
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    .status-aprovado { background-color: #dcfce7; color: #166534; }
    .status-reprovado { background-color: #fee2e2; color: #991b1b; }
    .status-pendente { background-color: #fef9c3; color: #854d0e; }

    /* Estilos para o Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.6);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      animation: fadeIn 0.3s ease-out;
      overflow-y: auto;
      padding: 20px;
    }

    .modal-content {
      background-color: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
      width: 90%;
      max-width: 700px;
      max-height: 90vh;
      overflow-y: auto;
      position: relative;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideIn {
      from { transform: translateY(-30px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 1rem;
      margin-bottom: 1.5rem;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 1.5rem;
    }

    .modal-close-button {
      background: transparent;
      border: none;
      font-size: 2rem;
      cursor: pointer;
      line-height: 1;
      padding: 0;
      color: #555;
      transition: color 0.2s;
    }
    .modal-close-button:hover {
      color: #000;
    }

    .tabs-container {
      display: flex;
      border-bottom: 1px solid #ccc;
      margin-bottom: 1.5rem;
    }

    .tab-button {
      padding: 10px 20px;
      cursor: pointer;
      border: none;
      background-color: transparent;
      border-bottom: 3px solid transparent;
      margin-bottom: -1px;
      font-size: 1rem;
      color: #555;
      transition: color 0.2s, border-color 0.2s;
    }

    .tab-button.active {
      border-bottom-color: #17a2b8;
      color: #000;
      font-weight: 600;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
  `}</style>
);

const PlanejamentosPage = () => {
  const [turmas, setTurmas] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedYear, setSelectedYear] = useState(0); // Usar número para consistência
  const [selectedTurma, setSelectedTurma] = useState("");
  const { user } = useAuth(); // Obter dados do usuário logado do contexto
  const [modalInfo, setModalInfo] = useState(null); // Estado para controlar o modal
  const [selectedMonth, setSelectedMonth] = useState(null); // Para controlar a visão de semanas
  const [planningStatuses, setPlanningStatuses] = useState({}); // Para os status das semanas

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // A rota /turmas já retorna o ano letivo, o que é perfeito para o filtro.
        const response = await fetch("http://localhost:3001/turmas", {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Falha ao buscar dados das turmas.");
        }
        const data = await response.json();
        setTurmas(data);

        if (data.length > 0) {
          // Extrai anos letivos únicos e os ordena do mais recente para o mais antigo
          const years = [...new Set(data.map((t) => t.ano_letivo))].sort(
            (a, b) => b - a
          );
          setAvailableYears(years);

          // Define o ano inicial com o mais recente
          const initialYear = years[0] || 0;
          setSelectedYear(initialYear);

          // Filtra as turmas para o ano inicial e define a primeira como selecionada
          const turmasDoAnoInicial = data.filter(
            (t) => t.ano_letivo === initialYear
          );
          setSelectedTurma(turmasDoAnoInicial[0]?.id || "");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Busca os status dos planejamentos sempre que o ano ou a turma mudar
  useEffect(() => {
    const fetchPlanningStatuses = async () => {
      if (!selectedTurma || !selectedYear) {
        setPlanningStatuses({});
        return;
      }
      try {
        const response = await fetch(
          `http://localhost:3001/planejamentos/status?turma_id=${selectedTurma}&ano=${selectedYear}`,
          {
            credentials: "include",
          }
        );
        if (!response.ok) {
          console.error("Falha ao buscar status dos planejamentos.");
          setPlanningStatuses({});
          return;
        }
        const statuses = await response.json();
        // Transforma o array em um mapa para busca rápida: { "mes-semana": "Status" }
        const statusMap = statuses.reduce((acc, curr) => {
          const key = `${curr.mes}-${curr.semana}`;
          acc[key] = curr.status;
          return acc;
        }, {});
        setPlanningStatuses(statusMap);
      } catch (error) {
        console.error("Erro ao buscar status:", error);
        setPlanningStatuses({}); // Reseta em caso de erro
      }
    };
    fetchPlanningStatuses();
  }, [selectedTurma, selectedYear]);

  // Filtra as turmas com base no ano selecionado.
  const filteredTurmas = useMemo(() => {
    if (!selectedYear) return [];
    return turmas.filter((turma) => turma.ano_letivo === selectedYear);
  }, [selectedYear, turmas]);

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

  // Handler para quando o ano é alterado
  const handleYearChange = (e) => {
    const newYear = Number(e.target.value);
    setSelectedYear(newYear);

    // Re-filtra as turmas para o novo ano
    const turmasDoNovoAno = turmas.filter((t) => t.ano_letivo === newYear);

    // Define a primeira turma da nova lista como selecionada
    // ou limpa a seleção se não houver turmas para aquele ano.
    setSelectedTurma(turmasDoNovoAno[0]?.id || "");
  };

  const handleWeekClick = async (monthName, weekName) => {
    if (!selectedTurma || !selectedYear || !user?.userId) {
      alert(
        "Por favor, selecione um ano e uma turma para visualizar o planejamento."
      );
      return;
    }
    const monthNumber = monthNames.indexOf(monthName) + 1;

    if (monthNumber === 0) {
      // monthNumber será 0 se indexOf não encontrar nada
      console.error("Nome do mês inválido:", monthName);
      return;
    }

    // 3. Prepare os dados para enviar ao backend
    const dadosParaBackend = {
      turma_id: selectedTurma,
      ano: selectedYear,
      mes: monthNumber, // <-- ENVIA O NÚMERO, NÃO O NOME
      semana: parseInt(weekName.replace("Semana ", "")), // Ex: "Semana 1" -> 1
      usuario_id: user.userId, // <-- PEGA O ID DO USUÁRIO LOGADO
    };

    console.log("Enviando para o backend:", dadosParaBackend);

    // Idealmente, aqui você mostraria um spinner de carregamento
    try {
      const response = await fetch(
        "http://localhost:3001/planejamentos/find-or-create",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(dadosParaBackend),
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(
          errData.error || "Falha ao buscar ou criar o planejamento."
        );
      }

      const planejamentoData = await response.json();
      setModalInfo(planejamentoData); // O modal agora recebe o objeto completo do DB
    } catch (error) {
      console.error("Erro detalhado ao buscar ou criar planejamento:", error);
      alert(`Erro: ${error.message}`); // Exibe a mensagem de erro vinda do backend
    }
  };

  const handleCloseModal = () => {
    setModalInfo(null);
  };

  // Função para ser passada para o modal, para que ele possa atualizar o estado aqui
  const handleModalUpdate = (updatedData) => {
    // Atualiza as informações do modal, caso ele permaneça aberto
    setModalInfo(updatedData);

    // Atualiza o status na lista principal de planejamentos para refletir a mudança instantaneamente.
    if (updatedData.mes && updatedData.semana && updatedData.status) {
      const statusKey = `${updatedData.mes}-${updatedData.semana}`;
      setPlanningStatuses((prevStatuses) => ({
        ...prevStatuses,
        [statusKey]: updatedData.status,
      }));
    }
  };

  const handleDeletePlanning = async (planejamentoId, mes, semana) => {
    console.log("Tentando excluir planejamento:", {
      planejamentoId,
      mes,
      semana,
      userCargo: user?.cargo,
    });

    if (!window.confirm("Tem certeza que deseja excluir este planejamento?")) {
      return;
    }

    if (!planejamentoId) {
      alert("ID do planejamento não encontrado.");
      return;
    }

    try {
      console.log(
        "Fazendo requisição DELETE para:",
        `http://localhost:3001/planejamentos/${planejamentoId}`
      );

      const response = await fetch(
        `http://localhost:3001/planejamentos/${planejamentoId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      console.log("Resposta da API:", response.status, response.statusText);

      if (!response.ok) {
        let errorData = {};
        try {
          errorData = await response.json();
        } catch (parseErr) {
          console.error("Erro ao fazer parse da resposta de erro:", parseErr);
          errorData = {
            error: `Status ${response.status}: ${response.statusText}`,
          };
        }
        console.error("Erro na resposta:", errorData);
        console.error(
          "Status da resposta:",
          response.status,
          response.statusText
        );
        throw new Error(
          errorData.error ||
            `Falha ao excluir planejamento. Status: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("Resultado da exclusão:", result);

      // Atualiza a lista de status local para Pendente (usa dados do backend se disponíveis)
      const r = result && result.reset ? result.reset : null;
      const finalMes = r?.mes ?? mes;
      const finalSemana = r?.semana ?? semana;
      if (finalMes && finalSemana) {
        const key = `${finalMes}-${finalSemana}`;
        setPlanningStatuses((prev) => ({ ...prev, [key]: "Pendente" }));
      }

      // Fecha o modal
      setModalInfo(null);
      alert("Planejamento excluído e status resetado para Pendente.");
    } catch (err) {
      console.error("Erro ao excluir planejamento:", err);
      console.error("Stack trace:", err.stack);
      console.error("Erro completo:", JSON.stringify(err, null, 2));
      alert(
        `Erro: ${err.message || "Erro desconhecido ao excluir planejamento"}`
      );
    }
  };

  if (loading) {
    return <div style={{ padding: "2rem" }}>Carregando dados...</div>;
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
      <PlanejamentosPageCSS />
      <div className="page-header">
        <h1>Planejamentos</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <div style={{ minWidth: "120px" }}>
            <SelectWithHint
              label="Ano:"
              hint="Selecione o ano letivo para visualizar os planejamentos"
              value={selectedYear}
              onChange={handleYearChange}
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </SelectWithHint>
          </div>

          <div style={{ minWidth: "250px" }}>
            <SelectWithHint
              label="Turma:"
              hint="Escolha a turma para gerenciar os planejamentos semanais"
              value={selectedTurma}
              onChange={(e) => setSelectedTurma(Number(e.target.value))}
            >
              {filteredTurmas.map((turma) => {
                // Extrai o nome do primeiro professor da turma
                const professorNome =
                  turma.professores && turma.professores.length > 0
                    ? turma.professores[0].nome
                    : "Sem professor";

                return (
                  <option key={turma.id} value={turma.id}>
                    {turma.nome_turma} - {professorNome}
                  </option>
                );
              })}
            </SelectWithHint>
          </div>
        </div>
      </div>

      {!selectedMonth ? (
        <>
          <p>Selecione o mês para ver as semanas de planejamento.</p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "1.5rem",
              marginTop: "2rem",
            }}
          >
            {monthsData.map((month, index) => (
              <div
                key={index}
                onClick={() => setSelectedMonth(month)}
                style={{
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  padding: "1.5rem 1rem",
                  backgroundColor: "#fff",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 12px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 2px 4px rgba(0,0,0,0.05)";
                }}
              >
                <h3 style={{ margin: 0, fontSize: "1.25rem" }}>{month.name}</h3>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <button
              onClick={() => setSelectedMonth(null)}
              style={{
                background: "transparent",
                border: "1px solid #ccc",
                borderRadius: "4px",
                padding: "8px 16px",
                cursor: "pointer",
                marginRight: "1rem",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#f8f9fa")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              &larr; Voltar
            </button>
            <h2 style={{ margin: 0 }}>
              {selectedMonth.name} - {selectedYear}
            </h2>
          </div>
          <p>Selecione a semana para gerenciar o planejamento.</p>
          <div
            style={{
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              backgroundColor: "#fff",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              marginTop: "1rem",
            }}
          >
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {selectedMonth.weeks.map((week, weekIndex) =>
                (() => {
                  const monthNumber =
                    monthNames.indexOf(selectedMonth.name) + 1;
                  const weekNumber = weekIndex + 1;
                  const statusKey = `${monthNumber}-${weekNumber}`;
                  const status = planningStatuses[statusKey] || "Pendente";

                  const getStatusClass = (s) =>
                    s.toLowerCase().replace(" ", "-");

                  return (
                    <li
                      key={weekIndex}
                      onClick={() => handleWeekClick(selectedMonth.name, week)}
                      className="week-item"
                      style={{
                        borderBottom:
                          weekIndex < selectedMonth.weeks.length - 1
                            ? "1px solid #f0f0f0"
                            : "none",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#f8f9fa")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      <span>{week}</span>
                      <span
                        className={`planning-status-badge status-${getStatusClass(
                          status
                        )}`}
                      >
                        {status}
                      </span>
                    </li>
                  );
                })()
              )}
            </ul>
          </div>
        </div>
      )}

      {modalInfo && (
        <PlanejamentoModal
          info={modalInfo}
          onClose={handleCloseModal}
          onUpdate={handleModalUpdate} // A prop onUpdate é suficiente para todas as atualizações
          onDelete={handleDeletePlanning} // Passa a função de exclusão
        />
      )}
    </div>
  );
};

const PlanejamentoModal = ({ info, onClose, onUpdate, onDelete }) => {
  if (!info) return null;

  // Bloqueia o scroll do body enquanto o modal está aberto
  useBodyScrollLock(true);

  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("planejamento");

  // Estado interno para gerenciar os dados do planejamento e refresh imediato
  const [localInfo, setLocalInfo] = useState(info);
  const [anexos, setAnexos] = useState([]);
  const [comentarios, setComentarios] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Atualiza o estado interno quando um novo planejamento é aberto
  useEffect(() => {
    setLocalInfo(info);
    setAnexos(info.anexos || []);
    setComentarios(info.comentarios || []);
  }, [info]);

  // Adapta os dados dos comentários para o formato esperado pelo componente ListaComentarios
  const comentariosParaLista = useMemo(() => {
    if (!comentarios) return [];
    return comentarios.map((c) => ({
      id: c.id, // Correção: A propriedade correta é 'id', conforme retornado pelo backend.
      usuario_id: c.usuario_id, // Correção: A propriedade correta é 'usuario_id'.
      nome_usuario: c.nome_usuario, // Correção: A propriedade correta é 'nome_usuario'.
      texto_comentario: c.texto_comentario,
      data_comentario: c.data_comentario,
    }));
  }, [comentarios]);

  const handleModalContentClick = (e) => {
    e.stopPropagation();
  };

  const handleUploadAttachment = async () => {
    if (!selectedFile) return alert("Por favor, selecione um arquivo.");
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("anexo", selectedFile);

    // Verifica se este é o primeiro anexo a ser enviado. Se for, adicionamos
    // um sinalizador no formulário. O backend deve ser ajustado para usar este
    // campo e definir a `data_criacao` do planejamento.
    // Esta é a forma mais robusta de garantir a consistência dos dados.
    const isFirstAttachment = localInfo.anexos.length === 0;
    if (isFirstAttachment) {
      // O backend deve procurar por este campo no corpo da requisição multipart/form-data.
      formData.append("set_creation_date", "true");
    }

    try {
      const response = await fetch(
        `http://localhost:3001/planejamentos/${localInfo.id_planejamento}/anexos`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );
      if (!response.ok) throw new Error("Falha ao enviar anexo.");

      // Recarrega os dados do planejamento para obter a lista de anexos atualizada
      const refetchResponse = await fetch(
        `http://localhost:3001/planejamentos/${localInfo.id_planejamento}`,
        {
          credentials: "include",
        }
      );
      const updatedPlanejamento = await refetchResponse.json();

      // Atualiza o estado local IMEDIATAMENTE para feedback visual instantâneo - força nova referência
      setLocalInfo(updatedPlanejamento);
      setAnexos([...(updatedPlanejamento.anexos || [])]);

      // Atualiza o estado no componente pai
      onUpdate(updatedPlanejamento);

      setSelectedFile(null);
      document.getElementById("planejamento-upload").value = "";
      alert("Anexo enviado com sucesso!"); // Feedback para o usuário
    } catch (error) {
      alert(`Erro: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAttachment = async (anexoId) => {
    if (!window.confirm("Tem certeza que deseja excluir este anexo?")) return;
    try {
      const response = await fetch(`http://localhost:3001/anexos/${anexoId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Falha ao excluir anexo.");

      // Recarrega os dados do planejamento para refletir a exclusão
      const refetchResponse = await fetch(
        `http://localhost:3001/planejamentos/${localInfo.id_planejamento}`,
        {
          credentials: "include",
        }
      );
      const updatedPlanejamento = await refetchResponse.json();

      // Atualiza o estado local IMEDIATAMENTE para feedback visual instantâneo - força nova referência
      setLocalInfo(updatedPlanejamento);
      setAnexos([...(updatedPlanejamento.anexos || [])]);

      // Atualiza o estado no componente pai
      onUpdate(updatedPlanejamento);

      alert("Anexo excluído com sucesso!");
    } catch (error) {
      alert(`Erro: ${error.message}`);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    setIsRefreshing(true);
    try {
      const response = await fetch(
        `http://localhost:3001/planejamentos/${localInfo.id_planejamento}/comentarios`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            usuario_id: user.userId,
            texto_comentario: newComment,
          }),
        }
      );
      if (!response.ok) throw new Error("Falha ao adicionar comentário.");

      // Para obter o comentário com o nome do autor, buscamos o planejamento atualizado
      const refetchResponse = await fetch(
        `http://localhost:3001/planejamentos/${localInfo.id_planejamento}`,
        {
          credentials: "include",
        }
      );
      const updatedPlanejamento = await refetchResponse.json();

      // Atualiza o estado local IMEDIATAMENTE - força nova referência do array
      setLocalInfo(updatedPlanejamento);
      setComentarios([...(updatedPlanejamento.comentarios || [])]);
      setAnexos([...(updatedPlanejamento.anexos || [])]); // Atualiza o estado no componente pai
      onUpdate(updatedPlanejamento);
      setNewComment("");
    } catch (error) {
      alert(`Erro: ${error.message}`);
    } finally {
      setIsSubmitting(false);
      setIsRefreshing(false);
    }
  };

  // Função chamada pelo componente ListaComentarios após uma exclusão bem-sucedida.
  // Apenas atualiza o estado local e o estado do componente pai.
  const handleComentarioExcluido = async (comentarioIdExcluido) => {
    // O comentário já foi excluído no banco de dados pelo componente ListaComentarios.
    // Para garantir que a tela reflita o estado real do banco de dados,
    // vamos buscar novamente os dados completos do planejamento.
    // Essa abordagem é mais robusta do que apenas filtrar o estado local.
    setIsRefreshing(true);
    try {
      const response = await fetch(
        `http://localhost:3001/planejamentos/${localInfo.id_planejamento}`,
        {
          credentials: "include",
        }
      );
      if (!response.ok) {
        throw new Error(
          "Falha ao recarregar os dados do planejamento após a exclusão."
        );
      }
      const updatedPlanejamento = await response.json();

      // Atualiza o estado local IMEDIATAMENTE - força nova referência do array
      setLocalInfo(updatedPlanejamento);
      setComentarios([...(updatedPlanejamento.comentarios || [])]);

      // Atualiza o estado no componente pai, que por sua vez atualizará o modal.
      onUpdate(updatedPlanejamento);
    } catch (error) {
      console.error("Erro ao recarregar planejamento:", error);
      alert(
        "O comentário foi excluído, mas houve um erro ao atualizar a tela. Por favor, feche e abra a janela para ver as mudanças."
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (
      !window.confirm(
        `Tem certeza que deseja ${newStatus.toLowerCase()} este planejamento?`
      )
    )
      return;
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `http://localhost:3001/planejamentos/${localInfo.id_planejamento}/status`,
        {
          method: "PUT", // A rota de status usa PUT
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          // A rota espera apenas o status no corpo
          body: JSON.stringify({ status: newStatus }),
        }
      );
      if (!response.ok)
        throw new Error("Falha ao atualizar o status do planejamento.");
      const updatedData = await response.json();
      alert(`Planejamento ${newStatus.toLowerCase()} com sucesso!`);

      // Atualiza o estado local IMEDIATAMENTE
      setLocalInfo(updatedData);

      // Atualiza o estado no componente pai
      onUpdate(updatedData);
      onClose(); // Fecha o modal
    } catch (error) {
      alert(`Erro: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    // 1. Verifica se a string de data existe. Se não, retorna um texto padrão.
    if (!dateString) {
      return "Data não informada";
    }
    // 2. Tenta criar um objeto Date.
    const date = new Date(dateString);

    // 3. Verifica se a data criada é válida. `getTime()` retorna NaN para datas inválidas.
    if (isNaN(date.getTime())) {
      // Loga o valor problemático no console para ajudar a depurar o backend.
      console.error(
        "Formato de data inválido recebido do backend:",
        dateString
      );
      return "Data em formato inválido"; // Retorna uma mensagem amigável.
    }

    // 4. Se a data for válida, formata e retorna no padrão "dd/mm/aaaa, HH:MM".
    return date.toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: "600px" }}
        onClick={handleModalContentClick}
      >
        <div className="modal-header">
          <h2>{localInfo.titulo}</h2>
          <button className="modal-close-button" onClick={onClose}>
            &times;
          </button>
        </div>

        <div
          style={{
            fontSize: "0.9rem",
            color: "#555",
            marginBottom: "1rem",
            padding: "0.5rem 1rem",
            backgroundColor: "#f8f9fa",
            borderRadius: "4px",
          }}
        >
          <p style={{ margin: "0.25rem 0" }}>
            Status:{" "}
            <strong
              style={{
                color:
                  localInfo.status === "Aprovado"
                    ? "green"
                    : localInfo.status === "Reprovado"
                    ? "red"
                    : "orange",
              }}
            >
              {localInfo.status || "Pendente"}
            </strong>
          </p>
          <p style={{ margin: "0.25rem 0" }}>
            Última modificação: {formatDate(localInfo.data_modificacao)}
          </p>
        </div>

        <div className="tabs-container" style={{ marginBottom: "1.5rem" }}>
          <button
            className={`tab-button ${
              activeTab === "planejamento" ? "active" : ""
            }`}
            onClick={() => setActiveTab("planejamento")}
          >
            Planejamento
          </button>
          <button
            className={`tab-button ${
              activeTab === "comentarios" ? "active" : ""
            }`}
            onClick={() => setActiveTab("comentarios")}
          >
            Comentários ({comentarios.length})
          </button>
        </div>

        {activeTab === "planejamento" && (
          <div>
            {/* Seção de Anexos */}
            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <label>Anexos</label>
              {anexos && anexos.length > 0 ? (
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    marginTop: "0.5rem",
                  }}
                >
                  {anexos.map((anexo) => {
                    // Verifica se o anexo possui a propriedade com o caminho do arquivo.
                    // O nome esperado é 'caminho_arquivo'.
                    const caminhoDoArquivo =
                      anexo.path_arquivo || anexo.caminho;

                    // Define o nome de exibição, com fallbacks para garantir que algo seja mostrado.
                    const nomeDoArquivo =
                      anexo.nome_original ||
                      (caminhoDoArquivo
                        ? caminhoDoArquivo.split("/").pop()
                        : "Anexo sem nome");

                    // Se o caminho não for encontrado, loga um erro para ajudar na depuração do backend.
                    if (!caminhoDoArquivo) {
                      console.error(
                        "Erro no frontend: O objeto 'anexo' não contém a propriedade 'caminho_arquivo'. Dados recebidos:",
                        anexo
                      );
                    }

                    return (
                      <li
                        key={anexo.id_anexo}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "8px",
                          border: "1px solid #eee",
                          borderRadius: "4px",
                          marginBottom: "0.5rem",
                        }}
                      >
                        {caminhoDoArquivo ? ( // Se o caminho existe, cria um link clicável
                          <a
                            href={`http://localhost:3001/${caminhoDoArquivo}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {nomeDoArquivo}
                          </a>
                        ) : (
                          // Se não existe, exibe o nome do arquivo com uma mensagem de erro no 'title'
                          <span
                            style={{ color: "#dc3545", fontStyle: "italic" }}
                            title="O caminho para este arquivo não foi encontrado. Verifique o backend."
                          >
                            {nomeDoArquivo} (caminho inválido)
                          </span>
                        )}
                        <button
                          onClick={() => handleDeleteAttachment(anexo.id_anexo)}
                          className="delete-button"
                          title="Excluir anexo"
                        >
                          &times;
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p>Nenhum anexo encontrado.</p>
              )}
            </div>

            {/* Seção de Upload */}
            <div className="form-group">
              <label htmlFor="planejamento-upload">Adicionar novo anexo</label>
              <input
                type="file"
                id="planejamento-upload"
                onChange={(e) => setSelectedFile(e.target.files[0])}
              />
              <button
                onClick={handleUploadAttachment}
                disabled={isSubmitting}
                className="submit-button"
              >
                {isSubmitting ? "Enviando..." : "Enviar Anexo"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "comentarios" && (
          <div style={{ marginBottom: "1.5rem", position: "relative" }}>
            {/* Indicador de refresh */}
            {isRefreshing && (
              <div
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  backgroundColor: "#007bff",
                  color: "white",
                  padding: "8px 16px",
                  borderRadius: "20px",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  zIndex: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 2px 8px rgba(0,123,255,0.3)",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              >
                <span
                  style={{
                    width: "12px",
                    height: "12px",
                    border: "2px solid white",
                    borderTop: "2px solid transparent",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                ></span>
                Atualizando...
              </div>
            )}
            {/* Reutiliza o componente ListaComentarios, passando os dados e funções necessários */}
            <ListaComentarios
              comentarios={comentariosParaLista}
              usuarioAtual={{ id: user.userId, cargo: user.cargo }}
              onComentarioExcluido={handleComentarioExcluido}
            />
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
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
                onClick={handleAddComment}
                disabled={isSubmitting || !newComment.trim()}
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
                {isSubmitting ? "Enviando..." : "Confirmar Comentário"}
              </button>
            </div>
          </div>
        )}

        {/* Botões de Ação - Aprovar/Reprovar: Admin Pedagógico e Admin Geral */}
        {(String(user.cargo).toLowerCase() === "administrador pedagógico" ||
          String(user.cargo).toLowerCase() === "administrador geral") && (
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
              onClick={() => handleUpdateStatus("Reprovado")}
              style={{
                padding: "10px 20px",
                cursor: "pointer",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "1rem",
              }}
              disabled={isSubmitting || info.status === "Reprovado"}
            >
              Reprovar
            </button>
            <button
              onClick={() => handleUpdateStatus("Aprovado")}
              style={{
                padding: "10px 20px",
                cursor: "pointer",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "1rem",
              }}
              disabled={isSubmitting || localInfo.status === "Aprovado"}
            >
              Aprovar
            </button>
          </div>
        )}

        {/* Botão Excluir - somente Administrador Geral */}
        {(() => {
          const userCargo = String(user?.cargo || "").toLowerCase();
          const isAdminGeral = userCargo === "administrador geral";
          console.log("Verificando se deve mostrar botão excluir:", {
            userCargo: user?.cargo,
            userCargoLower: userCargo,
            isAdminGeral,
            planejamentoId: localInfo.id_planejamento,
            planejamentoStatus: localInfo.status,
          });

          return (
            isAdminGeral && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: "1rem",
                }}
              >
                <button
                  onClick={() => {
                    console.log("Botão Excluir clicado!", {
                      planejamentoId: localInfo.id_planejamento,
                      mes: localInfo.mes,
                      semana: localInfo.semana,
                    });
                    onDelete(
                      localInfo.id_planejamento,
                      localInfo.mes,
                      localInfo.semana
                    );
                  }}
                  style={{
                    padding: "10px 20px",
                    cursor: "pointer",
                    backgroundColor: "#6b7280",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "1rem",
                  }}
                  type="button"
                >
                  Excluir Planejamento
                </button>
              </div>
            )
          );
        })()}
      </div>
    </div>
  );
};

export default PlanejamentosPage;
