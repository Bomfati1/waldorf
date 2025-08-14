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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  // Busca os professores disponíveis da API
  useEffect(() => {
    const fetchProfessores = async () => {
      try {
        const response = await fetch(
          "http://localhost:3001/usuarios/professores"
        );
        if (!response.ok) {
          throw new Error("Falha ao buscar professores.");
        }
        const data = await response.json();
        setProfessores(data);
      } catch (err) {
        setError("Não foi possível carregar a lista de professores.");
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
      nivel_ensino: Number(nivel),
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
      setTimeout(() => navigate("/dashboard/turmas"), 2000);
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
            {professores.map((prof) => (
              <option key={prof.id} value={prof.id}>
                {prof.nome}
              </option>
            ))}
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
