import React, { useState, useEffect } from "react";
import PlanejamentoISO from "../components/PlanejamentoISO";
import SelectWithHint from "../components/SelectWithHint";
import "../css/PlanejamentosISOPage.css";

const PlanejamentosISOPage = () => {
  console.log("🎯 [PLANEJAMENTOS-ISO] Componente montado!");

  const [turmas, setTurmas] = useState([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState(null);
  const [loading, setLoading] = useState(true);
  const [anosDisponiveis, setAnosDisponiveis] = useState([]);
  const [anoSelecionado, setAnoSelecionado] = useState(null);

  useEffect(() => {
    console.log("🔄 [PLANEJAMENTOS-ISO] useEffect disparado");
    fetchTurmas();
  }, []);

  const fetchTurmas = async () => {
    console.log("📡 [PLANEJAMENTOS-ISO] Buscando turmas...");
    try {
      const response = await fetch("http://localhost:3001/turmas", {
        credentials: "include",
      });

      console.log("📊 [PLANEJAMENTOS-ISO] Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ [PLANEJAMENTOS-ISO] Turmas carregadas:", data.length);
        setTurmas(data);

        // Monta anos disponíveis a partir das turmas (ano_letivo preferencial)
        const years = [
          ...new Set(
            data
              .map((t) => t.ano_letivo ?? t.ano)
              .filter((y) => typeof y === "number" || typeof y === "string")
          ),
        ]
          .map((y) => Number(y))
          .filter((y) => !Number.isNaN(y))
          .sort((a, b) => b - a);

        setAnosDisponiveis(years);

        // Seleciona ano mais recente e primeira turma desse ano
        if (data.length > 0) {
          const initialYear = years[0] ?? new Date().getFullYear();
          setAnoSelecionado(initialYear);
          const primeiraTurmaDoAno = data.find(
            (t) => (t.ano_letivo ?? t.ano) === initialYear
          );
          if (primeiraTurmaDoAno) {
            setTurmaSelecionada(primeiraTurmaDoAno.id);
            console.log(
              "🎯 [PLANEJAMENTOS-ISO] Turma selecionada:",
              primeiraTurmaDoAno.nome_turma
            );
          }
        }
      }
    } catch (error) {
      console.error("❌ [PLANEJAMENTOS-ISO] Erro ao buscar turmas:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filtra turmas por ano selecionado
  const turmasFiltradas = anoSelecionado
    ? turmas.filter((t) => (t.ano_letivo ?? t.ano) === Number(anoSelecionado))
    : turmas;

  return (
    <div className="planejamentos-iso-page">
      <div className="page-header-iso">
        <div className="header-content">
          <h1>📅 Planejamentos por Semana ISO</h1>
          <p className="subtitle">
            Visualize e gerencie planejamentos usando semanas ISO 8601. Semanas
            que atravessam meses aparecem em ambos!
          </p>
        </div>

        {loading ? (
          <div className="loading-turmas">Carregando turmas...</div>
        ) : (
          <div className="turma-selector">
            {/* Seletor de Ano Letivo */}
            <div style={{ minWidth: 220, marginRight: 16 }}>
              <SelectWithHint
                label={
                  <span>
                    <span className="label-icon">📆</span> Ano letivo:
                  </span>
                }
                hint="Escolha o ano para filtrar as turmas e as semanas ISO visíveis no calendário"
                value={anoSelecionado || ""}
                onChange={(e) => {
                  const novoAno = Number(e.target.value);
                  setAnoSelecionado(novoAno);
                  const primeiraDoAno = turmas.find(
                    (t) => (t.ano_letivo ?? t.ano) === novoAno
                  );
                  setTurmaSelecionada(primeiraDoAno ? primeiraDoAno.id : "");
                }}
              >
                {anosDisponiveis.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </SelectWithHint>
            </div>

            <div style={{ minWidth: 320 }}>
              <SelectWithHint
                label={
                  <span>
                    <span className="label-icon">🏫</span> Selecione a Turma:
                  </span>
                }
                hint="Selecione a turma. Depois, clique em uma semana para abrir/criar o planejamento correspondente"
                value={turmaSelecionada || ""}
                onChange={(e) => setTurmaSelecionada(e.target.value)}
              >
                <option value="">-- Selecione uma turma --</option>
                {turmasFiltradas.map((turma) => (
                  <option key={turma.id} value={turma.id}>
                    {turma.nome_turma} - {turma.periodo} (
                    {turma.ano_letivo ?? turma.ano})
                  </option>
                ))}
              </SelectWithHint>
            </div>
          </div>
        )}
      </div>

      {/* Info sobre Semanas ISO */}
      <div className="info-banner">
        <div className="info-icon">ℹ️</div>
        <div className="info-content">
          <strong>O que são Semanas ISO?</strong>
          <p>
            Semanas ISO 8601 são o padrão internacional para numeração de
            semanas. Cada semana começa na segunda-feira e pode atravessar meses
            diferentes. Quando isso acontece, a semana aparece em{" "}
            <strong>ambos os meses</strong>!
          </p>
        </div>
      </div>

      {/* Legenda */}
      <div className="legenda">
        <h3>Legenda:</h3>
        <div className="legenda-items">
          <div className="legenda-item">
            <div className="legenda-box normal"></div>
            <span>Semana normal (apenas 1 mês)</span>
          </div>
          <div className="legenda-item">
            <div className="legenda-box compartilhada"></div>
            <span>Semana compartilhada (2 meses)</span>
          </div>
          <div className="legenda-item">
            <div className="legenda-badge pendente">Pendente</div>
            <span>Aguardando aprovação</span>
          </div>
          <div className="legenda-item">
            <div className="legenda-badge aprovado">Aprovado</div>
            <span>Planejamento aprovado</span>
          </div>
        </div>
      </div>

      {/* Componente Principal */}
      {turmaSelecionada ? (
        <PlanejamentoISO turmaId={turmaSelecionada} ano={anoSelecionado} />
      ) : (
        <div className="empty-state-page">
          <div className="empty-icon">📚</div>
          <h2>Selecione uma turma para começar</h2>
          <p>
            Escolha uma turma no seletor acima para visualizar os planejamentos
            semanais
          </p>
        </div>
      )}
    </div>
  );
};

export default PlanejamentosISOPage;
