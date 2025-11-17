import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import InputWithHint from "../components/InputWithHint";
import SelectWithHint from "../components/SelectWithHint";
import "../css/FormLayout.css";
import "../css/CadastrarTurmaPage.css";

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
          "http://localhost:3001/usuarios/professores",
          {
            credentials: "include",
          }
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
      periodo: periodo.toLowerCase(),
      nivel: Number(nivel),
      professoresIds: professoresSelecionados,
    };

    try {
      const response = await fetch("http://localhost:3001/turmas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
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
      {/* Header Fixo */}
      <div className="page-header">
        <h1>🎓 Cadastrar Nova Turma</h1>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Mensagens de Feedback */}
        {error && <div className="message error">⚠ {error}</div>}
        {success && <div className="message success">✓ {success}</div>}

        {/* Seção: Informações Básicas */}
        <div className="form-section">
          <h3 className="form-section-title">📋 Informações Básicas</h3>

          <div className="form-grid grid-2-cols">
            <div className="form-group">
              <InputWithHint
                label="Nome da Turma"
                hint="Digite um nome identificador para a turma. Ex: Turma do Sol, Turma da Lua, etc."
                type="text"
                value={nomeTurma}
                onChange={(e) => setNomeTurma(e.target.value)}
                placeholder="Ex: Turma do Sol"
                required
              />
            </div>

            <div className="form-group">
              <InputWithHint
                label="Ano Letivo"
                hint="Informe o ano letivo da turma (entre 2020 e 2030)"
                type="number"
                value={anoLetivo}
                onChange={(e) => setAnoLetivo(e.target.value)}
                min="2020"
                max="2030"
                required
              />
            </div>

            <div className="form-group">
              <SelectWithHint
                label="Período"
                hint="Selecione o período em que a turma funcionará: Manhã, Tarde ou Integral"
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                required
              >
                <option value="Manhã">🌅 Manhã</option>
                <option value="Tarde">🌇 Tarde</option>
                <option value="Integral">☀️ Integral</option>
              </SelectWithHint>
            </div>

            <div className="form-group">
              <SelectWithHint
                label="Nível"
                hint="Escolha o nível de ensino da turma: Maternal (1-3 anos) ou Jardim (4-6 anos)"
                value={nivel}
                onChange={(e) => setNivel(e.target.value)}
                required
              >
                <option value="1">👶 Maternal</option>
                <option value="0">🌱 Jardim</option>
              </SelectWithHint>
            </div>
          </div>
        </div>

        {/* Seção: Professores */}
        <div className="form-section mt-3">
          <h3 className="form-section-title">👨‍🏫 Professores</h3>

          <div className="form-group">
            <label htmlFor="professores">
              Selecione os Professores da Turma
            </label>
            <select
              id="professores"
              multiple
              value={professoresSelecionados}
              onChange={handleProfessoresChange}
              className="multiple-select"
              style={{
                minHeight: "150px",
                padding: "0.75rem",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
              }}
            >
              {professoresLoading ? (
                <option disabled>⏳ Carregando professores...</option>
              ) : professores.length > 0 ? (
                professores.map((prof) => (
                  <option key={prof.id} value={prof.id}>
                    {prof.nome}
                  </option>
                ))
              ) : (
                <option disabled>❌ Nenhum professor encontrado.</option>
              )}
            </select>
            <small
              className="text-muted"
              style={{ display: "block", marginTop: "0.5rem" }}
            >
              💡 Segure <strong>Ctrl</strong> (ou <strong>Cmd</strong> no Mac)
              para selecionar múltiplos professores
            </small>

            {/* Lista de selecionados */}
            {professoresSelecionados.length > 0 && (
              <div
                style={{
                  marginTop: "1rem",
                  padding: "0.75rem",
                  backgroundColor: "#f0f9ff",
                  borderRadius: "6px",
                  border: "1px solid #bfdbfe",
                }}
              >
                <strong style={{ color: "#1e40af" }}>
                  ✓ Professores Selecionados:
                </strong>
                <ul style={{ margin: "0.5rem 0 0 0", paddingLeft: "1.5rem" }}>
                  {professoresSelecionados.map((profId) => {
                    const prof = professores.find(
                      (p) => p.id === Number(profId)
                    );
                    return (
                      <li key={profId} style={{ color: "#1e40af" }}>
                        {prof?.nome || profId}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Footer com Botões */}
        <div className="page-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/home/turmas")}
          >
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <>
                <span className="loading-spinner"></span> Cadastrando...
              </>
            ) : (
              <>💾 Cadastrar Turma</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CadastrarTurmaPage;
