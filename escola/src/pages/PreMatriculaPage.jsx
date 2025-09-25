// src/pages/PreMatriculaPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import InteressadosDashboardPage from "./InteressadosDashboardPage"; // Importa o componente do dashboard
import ImportDropdown from "../components/ImportDropdown";
import "../css/ImportDropdown.css";

const statusOptions = [
  "Entrou Em Contato",
  "Conversando",
  "Negociando",
  "Visita Agendada",
  "Ganho",
  "Perdido",
];

// Opções padronizadas para o campo "como_conheceu"
const comoConheceuOptions = [
  "Google",
  "Instagram",
  "Facebook",
  "Tik Tok",
  "Indicação",
  "Outro:",
];

const getStatusSelectStyles = (status) => {
  const baseStyle = {
    padding: "4px 12px",
    borderRadius: "12px",
    color: "white",
    fontSize: "12px",
    textTransform: "capitalize",
    border: "none",
    cursor: "pointer",
  };

  // Define as cores de fundo com base no status
  const statusStyles = {
    "Entrou Em Contato": { backgroundColor: "#17a2b8" }, // Cor para "info"
    Conversando: { backgroundColor: "#007bff" }, // Cor para "primary"
    Negociando: { backgroundColor: "#fd7e14" }, // Cor "laranja"
    "Visita Agendada": { backgroundColor: "#ffc107", color: "#212529" }, // Cor para "warning" com texto escuro
    Ganho: { backgroundColor: "#28a745" }, // Cor para "success"
    Perdido: { backgroundColor: "#dc3545" }, // Cor para "danger"
  };

  // Combina o estilo base com o estilo específico do status
  const style = { ...baseStyle, ...statusStyles[status] };

  return style;
};

const getTabStyle = (isActive) => ({
  padding: "10px 20px",
  fontSize: "16px",
  cursor: "pointer",
  backgroundColor: "transparent",
  border: "none",
  borderBottom: isActive ? "3px solid #007bff" : "3px solid transparent",
  color: isActive ? "#007bff" : "#495057",
  fontWeight: isActive ? "bold" : "normal",
  marginRight: "10px",
  transition: "all 0.2s ease-in-out",
  outline: "none",
});

const PreMatriculaPage = () => {
  const [preMatriculas, setPreMatriculas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState("list"); // 'list' ou 'dashboard'

  // Estado para os filtros
  const [filters, setFilters] = useState({
    nome: "",
    data: "",
    status: "todos", // 'todos' para não filtrar por padrão
  });

  // Estados para o upload de arquivo

  // Estados para edição em linha
  const [editingRowId, setEditingRowId] = useState(null);
  const [editedData, setEditedData] = useState({});

  // Busca os dados dos interessados do backend
  const fetchInteressados = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:3001/interessados", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Falha ao buscar os dados dos interessados.");
      }
      const data = await response.json();
      // Garante que 'intencao' seja sempre um booleano para consistência no frontend
      const processedData = data.map((item) => ({
        ...item,
        intencao:
          typeof item.intencao === "string"
            ? item.intencao.toLowerCase() === "sim" ||
              item.intencao.toLowerCase() === "true"
            : !!item.intencao, // Converte qualquer valor truthy/falsy para booleano
      }));
      setPreMatriculas(processedData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInteressados();
  }, [fetchInteressados]);

  const handleStatusChange = async (id, newStatus) => {
    const interessado = preMatriculas.find((p) => p.id === id);
    if (!interessado) return;

    // Cria o objeto atualizado para enviar ao backend
    const updatedInteressado = { ...interessado, status: newStatus };

    try {
      const response = await fetch(`http://localhost:3001/interessados/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updatedInteressado),
      });

      if (!response.ok) {
        throw new Error("Falha ao atualizar o status.");
      }

      // Atualiza o estado local para feedback imediato na UI
      setPreMatriculas((current) =>
        current.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
      );
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
      alert("Não foi possível atualizar o status. Tente novamente.");
    }
  };

  // Funções para controlar a edição em linha
  const handleEditClick = (matricula) => {
    setEditingRowId(matricula.id);
    // Pre-popula o formulário de edição e formata a data para o input
    const formattedMatricula = {
      ...matricula,
      data_contato: matricula.data_contato
        ? new Date(matricula.data_contato).toISOString().slice(0, 10)
        : "",
    };
    setEditedData(formattedMatricula);
  };

  const handleCancelClick = () => {
    setEditingRowId(null);
    setEditedData({});
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    // Converte o valor para booleano se o campo for 'intencao'
    const finalValue = name === "intencao" ? value === "true" : value;

    setEditedData((prevData) => ({
      ...prevData,
      [name]: finalValue,
    }));
  };

  const handleSaveClick = async (id) => {
    try {
      // Faz uma cópia para não modificar o estado diretamente
      const dataToSave = { ...editedData };

      // O input de data retorna 'YYYY-MM-DD'.
      // Se a data existir, a transformamos em uma string ISO 8601 em UTC
      // (formato 'YYYY-MM-DDTHH:mm:ss.sssZ') para garantir que o backend
      // a interprete corretamente, sem problemas de fuso horário.
      if (dataToSave.data_contato) {
        // Verifica se a data está no formato YYYY-MM-DD (vindo do input)
        if (/^\d{4}-\d{2}-\d{2}$/.test(dataToSave.data_contato)) {
          dataToSave.data_contato = `${dataToSave.data_contato}T00:00:00.000Z`;
        }
        // Se já for um ISO string completo, não faz nada.
      } else {
        // Se o campo for esvaziado, envia null para o backend.
        dataToSave.data_contato = null;
      }

      // Converte o valor booleano de 'intencao' para 'sim' ou 'nao' antes de enviar ao backend
      if (typeof dataToSave.intencao === "boolean") {
        dataToSave.intencao = dataToSave.intencao ? "sim" : "nao";
      }

      // Adiciona um log para depuração. Verifique o console do navegador (F12).
      console.log("Enviando para o backend:", dataToSave);

      const response = await fetch(`http://localhost:3001/interessados/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(dataToSave),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erro retornado pelo backend:", errorData);
        throw new Error(errorData.error || "Falha ao atualizar os dados.");
      }

      const savedData = await response.json();
      console.log("Dados recebidos do backend após salvar:", savedData);

      // O frontend trabalha com booleanos para 'intencao' para facilitar a lógica.
      // Se o backend retornar 'sim'/'nao', convertemos de volta para booleano
      // para manter a consistência do estado local.
      if (typeof savedData.intencao === "string") {
        savedData.intencao = savedData.intencao.toLowerCase() === "sim";
      }

      // Atualiza o estado local com os dados retornados pelo servidor para garantir consistência
      setPreMatriculas((current) =>
        current.map((m) => (m.id === id ? savedData : m))
      );

      setEditingRowId(null);
      setEditedData({});
    } catch (err) {
      console.error("Erro ao salvar:", err);
      alert(`Não foi possível salvar as alterações: ${err.message}`);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };


  // Aplica os filtros aos dados
  const filteredMatriculas = preMatriculas.filter((matricula) => {
    const matchNome = matricula.nome
      .toLowerCase()
      .includes(filters.nome.toLowerCase());
    const matchData =
      filters.data === "" ||
      (matricula.data_contato &&
        matricula.data_contato.startsWith(filters.data));
    const matchStatus =
      filters.status === "todos" || matricula.status === filters.status;
    return matchNome && matchData && matchStatus;
  });

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    // A data vem como uma string ISO do backend (ex: 2024-07-26T03:00:00.000Z).
    // Para exibir a data correta (26/07/2024) sem que o fuso horário do
    // navegador a altere para o dia anterior, formatamos usando o fuso UTC.
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", { timeZone: "UTC" });
  };

  // Estilos para os botões de ação e inputs
  const actionButtonStyle = {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "none",
    color: "white",
    cursor: "pointer",
    fontSize: "14px",
    marginRight: "8px",
  };
  const editButtonStyle = { ...actionButtonStyle, backgroundColor: "#007bff" };
  const saveButtonStyle = { ...actionButtonStyle, backgroundColor: "#28a745" };
  const cancelButtonStyle = {
    ...actionButtonStyle,
    backgroundColor: "#6c757d",
  };
  const deleteButtonStyle = { ...actionButtonStyle, backgroundColor: "#dc3545" };
  const inputStyle = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    boxSizing: "border-box",
    minWidth: "120px",
  };

  const handleDeleteClick = async (id) => {
    const confirmDelete = window.confirm(
      "Tem certeza que deseja excluir este interessado? Esta ação não pode ser desfeita."
    );
    if (!confirmDelete) return;

    try {
      const response = await fetch(`http://localhost:3001/interessados/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Falha ao excluir o interessado.");
      }
      setPreMatriculas((current) => current.filter((m) => m.id !== id));
      if (editingRowId === id) {
        setEditingRowId(null);
        setEditedData({});
      }
    } catch (err) {
      console.error("Erro ao excluir interessado:", err);
      alert(`Não foi possível excluir: ${err.message}`);
    }
  };

  return (
    <div
      style={{
        padding: "2rem",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      <h1 style={{ marginBottom: "1.5rem", fontSize: "2rem" }}>
        Pré-matrículas
      </h1>

      <div
        style={{
          borderBottom: "2px solid #dee2e6",
          marginBottom: "1.5rem",
        }}
      >
        <button
          onClick={() => setActiveView("list")}
          style={getTabStyle(activeView === "list")}
        >
          Lista de Interessados
        </button>
        <button
          onClick={() => setActiveView("dashboard")}
          style={getTabStyle(activeView === "dashboard")}
        >
          Dashboard
        </button>
      </div>

      {activeView === "list" && (
        <>
          {/* Menu Suspenso de Importação */}
          <ImportDropdown
            buttonText="Importar via Excel"
            buttonIcon="📊"
            options={[
              {
                icon: "👥",
                title: "Importar Interessados",
                endpoint: "/interessados/upload-excel",
                acceptedColumns: [
                  { name: "Nome", description: "Nome completo do interessado", required: true },
                  { name: "Email", description: "Endereço de email do interessado", required: true },
                  { name: "Telefone", description: "Número de telefone do interessado", required: true },
                  { name: "Data", description: "Data de interesse (formato: YYYY-MM-DD)", required: false },
                  { name: "Status", description: "Status do interessado (Entrou Em Contato, Conversando, Negociando, Visita Agendada, Ganho, Perdido)", required: false },
                  { name: "Intenção", description: "Intenção de matrícula (sim/nao)", required: false },
                  { name: "Observações", description: "Observações adicionais (opcional)", required: false }
                ],
                description: "Faça upload de um arquivo Excel (.xlsx ou .xls) para importar múltiplos interessados de uma vez. O sistema criará automaticamente novos registros na base de dados.",
                buttonText: "Importar Interessados",
                onSuccess: (data) => {
                  // Recarregar a lista de interessados após importação bem-sucedida
                  fetchInteressados();
                },
                onError: (data) => {
                  console.error("Erro na importação:", data);
                }
              }
            ]}
          />

          {/* Seção de Filtros */}
          <div
            style={{
              display: "flex",
              gap: "1rem",
              marginBottom: "1.5rem",
              flexWrap: "wrap",
            }}
          >
            <input
              type="text"
              name="nome"
              placeholder="Buscar por nome..."
              value={filters.nome}
              onChange={handleFilterChange}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #ccc",
              }}
            />
            <input
              type="date"
              name="data"
              value={filters.data}
              onChange={handleFilterChange}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #ccc",
              }}
            />
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #ccc",
              }}
            >
              <option value="todos">Todos os Status</option>
              {statusOptions.map((option) => (
                <option
                  key={option}
                  value={option}
                  style={{ textTransform: "capitalize" }}
                >
                  {/* Capitaliza a primeira letra para melhor leitura */}
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {loading && <p>Carregando interessados...</p>}
          {error && <p style={{ color: "red" }}>Erro: {error}</p>}

          {!loading && !error && (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "600px",
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "2px solid #dee2e6" }}>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        backgroundColor: "#f8f9fa",
                        fontWeight: "normal", // Garante que o texto não seja negrito
                      }}
                    >
                      Nome
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        backgroundColor: "#f8f9fa",
                        fontWeight: "normal",
                      }}
                    >
                      Telefone
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        backgroundColor: "#f8f9fa",
                        fontWeight: "normal",
                      }}
                    >
                      Como Conheceu
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        backgroundColor: "#f8f9fa",
                        fontWeight: "normal",
                      }}
                    >
                      Intenção
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        backgroundColor: "#f8f9fa",
                        fontWeight: "normal",
                      }}
                    >
                      Data Contato
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        backgroundColor: "#f8f9fa",
                        fontWeight: "normal",
                      }}
                    >
                      Status
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        backgroundColor: "#f8f9fa",
                        fontWeight: "normal",
                      }}
                    >
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMatriculas.map((matricula) =>
                    editingRowId === matricula.id ? (
                      // Linha em modo de edição
                      <tr
                        key={matricula.id}
                        style={{ borderBottom: "1px solid #dee2e6" }}
                      >
                        <td style={{ padding: "12px" }}>
                          <input
                            type="text"
                            name="nome"
                            value={editedData.nome}
                            onChange={handleEditChange}
                            style={inputStyle}
                          />
                        </td>
                        <td style={{ padding: "12px" }}>
                          <input
                            type="text"
                            name="telefone"
                            value={editedData.telefone}
                            onChange={handleEditChange}
                            style={inputStyle}
                          />
                        </td>
                        <td style={{ padding: "12px" }}>
                          <select
                            name="como_conheceu"
                            value={editedData.como_conheceu || ""}
                            onChange={handleEditChange}
                            style={inputStyle}
                          >
                            {/* Se o valor atual não estiver nas opções, preserva-o como primeira opção */}
                            {editedData.como_conheceu &&
                              !comoConheceuOptions.includes(editedData.como_conheceu) && (
                                <option value={editedData.como_conheceu}>
                                  {editedData.como_conheceu}
                                </option>
                              )}
                            {comoConheceuOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <select
                            name="intencao"
                            value={editedData.intencao}
                            onChange={handleEditChange}
                            style={inputStyle}
                          >
                            <option value="true">Sim</option>
                            <option value="false">Não</option>
                          </select>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <input
                            type="date"
                            name="data_contato"
                            value={editedData.data_contato}
                            onChange={handleEditChange}
                            style={inputStyle}
                          />
                        </td>
                        <td style={{ padding: "12px" }}>
                          <select
                            name="status"
                            value={editedData.status}
                            onChange={handleEditChange}
                            style={getStatusSelectStyles(editedData.status)}
                          >
                            {statusOptions.map((option) => (
                              <option
                                key={option}
                                value={option}
                                style={{
                                  color: "black",
                                  backgroundColor: "white",
                                }}
                              >
                                {option}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: "12px", whiteSpace: "nowrap" }}>
                          <button
                            onClick={() => handleSaveClick(matricula.id)}
                            style={saveButtonStyle}
                          >
                            Salvar
                          </button>
                          <button
                            onClick={handleCancelClick}
                            style={cancelButtonStyle}
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleDeleteClick(matricula.id)}
                            style={deleteButtonStyle}
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ) : (
                      // Linha em modo de visualização
                      <tr
                        key={matricula.id}
                        style={{ borderBottom: "1px solid #dee2e6" }}
                      >
                        <td style={{ padding: "12px" }}>{matricula.nome}</td>
                        <td style={{ padding: "12px" }}>
                          {matricula.telefone}
                        </td>
                        <td style={{ padding: "12px" }}>
                          {matricula.como_conheceu}
                        </td>
                        <td style={{ padding: "12px" }}>
                          {matricula.intencao ? "Sim" : "Não"}
                        </td>
                        <td style={{ padding: "12px" }}>
                          {formatDate(matricula.data_contato)}
                        </td>
                        <td style={{ padding: "12px" }}>
                          <select
                            value={matricula.status}
                            onChange={(e) =>
                              handleStatusChange(matricula.id, e.target.value)
                            }
                            style={getStatusSelectStyles(matricula.status)}
                          >
                            {statusOptions.map((option) => (
                              <option
                                key={option}
                                value={option}
                                style={{
                                  color: "black",
                                  backgroundColor: "white",
                                }}
                              >
                                {option}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <button
                            onClick={() => handleEditClick(matricula)}
                            style={editButtonStyle}
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeView === "dashboard" && <InteressadosDashboardPage isEmbedded />}
    </div>
  );
};

export default PreMatriculaPage;
