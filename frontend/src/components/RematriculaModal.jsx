import React, { useState, useEffect } from "react";
import { getApiUrl } from "../config/api";
import InputWithHint from "./InputWithHint";
import SelectWithHint from "./SelectWithHint";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import "../css/FormLayout.css";
import "../css/RematriculaModal.css";

const RematriculaModal = ({
  turmaOrigem,
  todasTurmas,
  onClose,
  onRematricular,
}) => {
  // Bloqueia o scroll do body enquanto o modal está aberto
  useBodyScrollLock(true);
  const [turmaDestinoId, setTurmaDestinoId] = useState("");
  const [alunosSelecionados, setAlunosSelecionados] = useState([]);
  const [novoAnoLetivo, setNovoAnoLetivo] = useState(new Date().getFullYear());
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Busca alunos da turma origem
  useEffect(() => {
    const fetchAlunos = async () => {
      try {
        const response = await fetch(
          getApiUrl(`/turmas/${turmaOrigem.id}/alunos`),
          {
            credentials: "include",
          }
        );

        if (response.ok) {
          const data = await response.json();
          setAlunos(data);
        } else {
          setError("Erro ao carregar alunos da turma.");
        }
      } catch (err) {
        setError("Erro de conexão ao carregar alunos.");
        console.error("Erro ao buscar alunos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlunos();
  }, [turmaOrigem.id]);

  const handleAlunoToggle = (alunoId) => {
    setAlunosSelecionados((prev) =>
      prev.includes(alunoId)
        ? prev.filter((id) => id !== alunoId)
        : [...prev, alunoId]
    );
  };

  const handleSelecionarTodos = () => {
    if (alunosSelecionados.length === alunos.length) {
      setAlunosSelecionados([]);
    } else {
      setAlunosSelecionados(alunos.map((a) => a.id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!turmaDestinoId) {
      setError("Selecione a turma de destino.");
      return;
    }

    if (alunosSelecionados.length === 0) {
      setError("Selecione pelo menos um aluno.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        getApiUrl(`/turmas/${turmaOrigem.id}/rematricula`),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            turmaDestinoId: parseInt(turmaDestinoId),
            alunosIds: alunosSelecionados,
            novoAnoLetivo,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert(data.message || "Rematrícula realizada com sucesso!");
        onRematricular(data);
        onClose();
      } else {
        setError(data.error || "Erro ao processar rematrícula.");
      }
    } catch (err) {
      setError("Erro de conexão. Tente novamente.");
      console.error("Erro ao rematricular:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Filtra turmas disponíveis (exclui a turma de origem)
  const turmasDisponiveis = todasTurmas.filter((t) => t.id !== turmaOrigem.id);

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 99999 }}>
      <div
        className="modal-content modal-large"
        onClick={(e) => e.stopPropagation()}
        style={{ position: 'relative', zIndex: 100000 }}
      >
        {/* Header Fixo */}
        <div className="modal-header">
          <h2>🔄 Rematrícula de Alunos</h2>
          <button className="modal-close-button" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Body Scrollável */}
        <div className="modal-body">
          {error && <div className="message error">⚠ {error}</div>}

          <form onSubmit={handleSubmit}>
            {/* Informações da Turma Origem */}
            <div className="form-section">
              <h3 className="form-section-title">📚 Turma Atual</h3>
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
                  padding: "1rem",
                  borderRadius: "8px",
                  border: "1px solid #dee2e6",
                }}
              >
                <p style={{ margin: "0.25rem 0", fontSize: "1.125rem" }}>
                  <strong>{turmaOrigem.nome_turma}</strong>
                </p>
                <p style={{ margin: "0.25rem 0", color: "#6c757d" }}>
                  📅 Ano Letivo: {turmaOrigem.ano_letivo}
                </p>
                <p style={{ margin: "0.25rem 0", color: "#6c757d" }}>
                  ⏰ Período: {turmaOrigem.periodo}
                </p>
                <p style={{ margin: "0.25rem 0", color: "#6c757d" }}>
                  👥 Total de alunos: {alunos.length}
                </p>
              </div>
            </div>

            {/* Seção: Destino */}
            <div className="form-section mt-3">
              <h3 className="form-section-title">
                🎯 Configuração da Rematrícula
              </h3>

              <div className="form-grid grid-2-cols">
                <div className="form-group">
                  <SelectWithHint
                    label="Turma de Destino"
                    hint="Selecione a turma para onde os alunos serão rematriculados. Escolha uma turma compatível com o nível e ano letivo desejado"
                    value={turmaDestinoId}
                    onChange={(e) => setTurmaDestinoId(e.target.value)}
                    required
                  >
                    <option value="">Selecione a turma...</option>
                    {turmasDisponiveis.map((turma) => (
                      <option key={turma.id} value={turma.id}>
                        {turma.nome_turma} - {turma.ano_letivo} ({turma.periodo}
                        )
                      </option>
                    ))}
                  </SelectWithHint>
                </div>

                <div className="form-group">
                  <InputWithHint
                    label="Ano Letivo"
                    hint="Ano letivo da rematrícula. Geralmente o próximo ano em relação à turma atual"
                    type="number"
                    value={novoAnoLetivo}
                    onChange={(e) => setNovoAnoLetivo(parseInt(e.target.value))}
                    min="2020"
                    max="2030"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Seção: Seleção de Alunos */}
            <div className="form-section mt-3">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                <h3 className="form-section-title" style={{ margin: 0 }}>
                  👥 Selecione os Alunos ({alunosSelecionados.length}/
                  {alunos.length})
                </h3>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleSelecionarTodos}
                  style={{ minWidth: "auto" }}
                >
                  {alunosSelecionados.length === alunos.length
                    ? "❌ Desmarcar Todos"
                    : "✅ Selecionar Todos"}
                </button>
              </div>

              {loading ? (
                <p style={{ textAlign: "center", color: "#6c757d" }}>
                  ⏳ Carregando alunos...
                </p>
              ) : alunos.length === 0 ? (
                <div className="message info">
                  ℹ Nenhum aluno encontrado nesta turma.
                </div>
              ) : (
                <div className="alunos-list">
                  {alunos.map((aluno) => (
                    <label key={aluno.id} className="aluno-checkbox">
                      <input
                        type="checkbox"
                        checked={alunosSelecionados.includes(aluno.id)}
                        onChange={() => handleAlunoToggle(aluno.id)}
                      />
                      <span className="aluno-nome">{aluno.nome_completo}</span>
                      <span className="aluno-info">
                        {aluno.data_nascimento
                          ? new Date(aluno.data_nascimento).toLocaleDateString(
                              "pt-BR"
                            )
                          : "Sem data"}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer Fixo */}
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting || alunosSelecionados.length === 0}
          >
            {submitting ? (
              <>
                <span className="loading-spinner"></span> Processando...
              </>
            ) : (
              <>🔄 Rematricular {alunosSelecionados.length} Aluno(s)</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RematriculaModal;
