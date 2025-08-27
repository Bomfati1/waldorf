import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/CadastrarTurmaPage.css"; // Importando o CSS para o formulário

const CadastrarTurmaPage = () => {
  const [nomeTurma, setNomeTurma] = useState("");
  const [anoLetivo, setAnoLetivo] = useState(new Date().getFullYear());
  const [periodo, setPeriodo] = useState("Manhã");
  const [nivel, setNivel] = useState("1"); // 1 para Maternal, 0 para Jardim
  const [professores, setProfessores] = useState([]);
  const [professoresSelecionados, setProfessoresSelecionados] = useState([]);

  const [professoresLoading, setProfessoresLoading] = useState(true);
  const [loading, setLoading] = useState(false); // Para o submit do formulário
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  // Busca os professores disponíveis da API
  useEffect(() => {
    const fetchProfessores = async () => {
      setProfessoresLoading(true);
      try {
        const response = await fetch(
          "http://localhost:3001/usuarios/professores"
        );
        if (!response.ok) {
          // Tenta extrair uma mensagem de erro mais específica do backend
          let errorMsg = `Erro HTTP ${response.status}: Falha na comunicação com o servidor.`;
          try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg; // Usa o erro do backend se disponível
          } catch (jsonError) {
            // Se o corpo não for JSON, usa a mensagem de status HTTP
          }
          throw new Error(errorMsg);
        }
        const data = await response.json();
        setProfessores(data);
      } catch (err) {
        setError(
          err.message ||
            "Não foi possível carregar a lista de professores. Verifique se o servidor está rodando."
        );
      } finally {
        setProfessoresLoading(false);
      }
    };
    fetchProfessores();
  }, []);

  const handleProfessoresChange = (e) => {
    const selectedOptions = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    setProfessoresSelecionados(selectedOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const novaTurma = {
      nome_turma: nomeTurma,
      ano_letivo: anoLetivo,
      periodo,
      nivel: Number(nivel),
      professoresIds: professoresSelecionados,
    };

    try {
      const response = await fetch("http://localhost:3001/turmas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novaTurma),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Erro ao cadastrar turma.");
      }

      setSuccess("Turma cadastrada com sucesso! Redirecionando...");
      setTimeout(() => navigate("/home/turmas"), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cadastrar-turma-container">
      <h1>Cadastrar Nova Turma</h1>
      <form onSubmit={handleSubmit} className="turma-form">
        {error && <p className="form-error">{error}</p>}
        {success && <p className="form-success">{success}</p>}
        <div className="form-group">
          <label htmlFor="nome-turma">Nome da Turma</label>
          <input
            type="text"
            id="nome-turma"
            value={nomeTurma}
            onChange={(e) => setNomeTurma(e.target.value)}
            placeholder="Ex: Turma do Sol"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="ano-letivo">Ano Letivo</label>
          <input
            type="number"
            id="ano-letivo"
            value={anoLetivo}
            onChange={(e) => setAnoLetivo(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="periodo">Período</label>
          <select
            id="periodo"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
          >
            <option value="Manhã">Manhã</option>
            <option value="Tarde">Tarde</option>
            <option value="Integral">Integral</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="nivel">Nível</label>
          <select
            id="nivel"
            value={nivel}
            onChange={(e) => setNivel(e.target.value)}
          >
            <option value="1">Maternal</option>
            <option value="0">Jardim</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="professores">Professores</label>
          <select
            id="professores"
            multiple
            value={professoresSelecionados}
            onChange={handleProfessoresChange}
            className="multiple-select"
          >
            {professoresLoading ? (
              <option disabled>Carregando professores...</option>
            ) : professores.length > 0 ? (
              professores.map((prof) => (
                <option key={prof.id} value={prof.id}>
                  {prof.nome}
                </option>
              ))
            ) : (
              <option disabled>Nenhum professor encontrado.</option>
            )}
          </select>
          <small>Segure Ctrl (ou Cmd em Mac) para selecionar mais de um.</small>
        </div>

        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? "Cadastrando..." : "Cadastrar Turma"}
        </button>
      </form>
    </div>
  );
};

export default CadastrarTurmaPage;
