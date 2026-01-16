import React, { useState, useEffect } from "react";
import { format, parseISO, getDaysInMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import "../css/PlanejamentoISO.css";
import PlanejamentoModal from "./PlanejamentoModal";

const PlanejamentoISOMensal = ({ turmaId, ano }) => {
  const [anoAtual, setAnoAtual] = useState(ano || new Date().getFullYear());
  const [meses, setMeses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalInfo, setModalInfo] = useState(null);
  const [pendingByMonth, setPendingByMonth] = useState({});

  useEffect(() => {
    if (turmaId) {
      fetchMesesDoAno();
    }
  }, [anoAtual, turmaId]);

  useEffect(() => {
    if (ano && ano !== anoAtual) {
      setAnoAtual(ano);
    }
  }, [ano]);

  const fetchMesesDoAno = async () => {
    setLoading(true);
    setError(null);

    console.log(`📅 Buscando meses para o ano ${anoAtual}, Turma: ${turmaId}`);

    try {
      const response = await fetch(
        `http://localhost:3001/planejamentos/meses/${anoAtual}?turma_id=${turmaId}`,
        { credentials: "include" }
      );

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Recebidos ${data.length} meses:`, data);
      setMeses(data);
    } catch (error) {
      console.error("❌ Erro ao buscar meses:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const navegarAno = (direcao) => {
    if (direcao === "anterior") {
      setAnoAtual(anoAtual - 1);
    } else {
      setAnoAtual(anoAtual + 1);
    }
  };

  const keyMonth = (mes) => `${mes.ano}-${mes.mes}`;

  const criarPlanejamento = async (mes) => {
    console.log("🆕 Criando planejamento para mês:", mes);

    try {
      const response = await fetch(
        "http://localhost:3001/planejamentos/mensal",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            turma_id: turmaId,
            ano: mes.ano,
            mes: mes.mes,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || response.statusText);
      }

      const data = await response.json();
      const id = data.id_planejamento;
      console.log(
        data.created ? "✅ Planejamento criado" : "↩️ Planejamento existente",
        data
      );

      await fetchMesesDoAno();
      await abrirModalPorId(id);
    } catch (error) {
      console.error("❌ Erro ao criar planejamento:", error);
      throw error;
    }
  };

  const abrirOuCriarPlanejamento = async (mes) => {
    console.log("📂 Ação: abrir ou criar planejamento para mês:", mes);
    const k = keyMonth(mes);
    if (pendingByMonth[k]) return;
    setPendingByMonth((m) => ({ ...m, [k]: true }));

    try {
      if (mes?.planejamento?.id_planejamento) {
        await abrirModalPorId(mes.planejamento.id_planejamento);
      } else {
        await criarPlanejamento(mes);
      }
    } finally {
      setPendingByMonth((m) => {
        const { [k]: _, ...rest } = m;
        return rest;
      });
    }
  };

  const abrirModalPorId = async (id) => {
    try {
      const resp = await fetch(`http://localhost:3001/planejamentos/${id}`, {
        credentials: "include",
      });
      if (!resp.ok) throw new Error("Falha ao buscar planejamento.");
      const detalhe = await resp.json();
      setModalInfo(detalhe);
    } catch (e) {
      console.error("Erro ao carregar detalhes do planejamento:", e);
    }
  };

  const getNomeMes = (numeroMes) => {
    return format(new Date(anoAtual, numeroMes - 1), "MMMM", { locale: ptBR });
  };

  if (!turmaId) {
    return (
      <div className="planejamento-iso-empty">
        <p>⚠️ Selecione uma turma para visualizar os planejamentos</p>
      </div>
    );
  }

  return (
    <div className="planejamento-iso">
      <div className="header-navegacao">
        <button
          className="btn-navegacao"
          onClick={() => navegarAno("anterior")}
          title="Ano anterior"
        >
          ← Anterior
        </button>

        <h2 className="titulo-mes">Planejamentos {anoAtual}</h2>

        <button
          className="btn-navegacao"
          onClick={() => navegarAno("proximo")}
          title="Próximo ano"
        >
          Próximo →
        </button>
      </div>

      <HintStrip />

      {error && (
        <div className="error-message">
          <span>❌ {error}</span>
          <button onClick={fetchMesesDoAno}>Tentar novamente</button>
        </div>
      )}

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Carregando meses...</p>
        </div>
      ) : meses.length === 0 ? (
        <div className="empty-state">
          <p>📅 Nenhum mês encontrado para este ano</p>
        </div>
      ) : (
        <div className="semanas-grid">
          {meses.map((mes) => (
            <div key={`${mes.ano}-${mes.mes}`} className="semana-card">
              <div className="semana-header">
                <div className="semana-numero">
                  <strong>{getNomeMes(mes.mes)}</strong>
                  <span className="ano-iso">{mes.ano}</span>
                </div>

                <div className="semana-periodo">
                  {getDaysInMonth(new Date(mes.ano, mes.mes - 1))} dias
                </div>
              </div>

              <div className="planejamento-body">
                {mes.planejamento && (
                  <div className="planejamento-existente">
                    <div
                      className={`status-badge status-${mes.planejamento.status
                        ?.toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      {mes.planejamento.status}
                    </div>
                  </div>
                )}
                <button
                  className="btn-abrir"
                  disabled={!!pendingByMonth[keyMonth(mes)]}
                  onClick={() => abrirOuCriarPlanejamento(mes)}
                  title="Abrir modal do planejamento"
                >
                  {pendingByMonth[keyMonth(mes)]
                    ? "Abrindo..."
                    : "📂 Abrir planejamento"}
                </button>
              </div>

              {/* Mini calendário do mês */}
              <div className="mini-calendario">
                <div className="dias-mes-info">
                  <span>
                    {mes.mes.toString().padStart(2, "0")}/{mes.ano}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalInfo && (
        <PlanejamentoModal
          info={modalInfo}
          onClose={() => setModalInfo(null)}
          onUpdate={async (updated) => {
            setModalInfo(updated);
            await fetchMesesDoAno();
          }}
          onDelete={async (planejamentoId) => {
            try {
              const resp = await fetch(
                `http://localhost:3001/planejamentos/${planejamentoId}`,
                { method: "DELETE", credentials: "include" }
              );
              if (!resp.ok) throw new Error("Falha ao excluir planejamento.");
              await fetchMesesDoAno();
              setModalInfo(null);
              alert("Planejamento excluído com sucesso.");
            } catch (e) {
              alert(`Erro: ${e.message}`);
            }
          }}
        />
      )}
    </div>
  );
};

export default PlanejamentoISOMensal;

const HintStrip = () => {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        padding: "10px 12px",
        margin: "12px 0 16px",
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          background: "transparent",
          border: "none",
          color: "#0ea5e9",
          cursor: "pointer",
          fontWeight: 600,
          padding: 0,
        }}
        aria-expanded={open}
        aria-controls="planejamento-iso-hints"
      >
        {open ? "Ocultar dicas" : "Mostrar dicas"}
      </button>
      {open && (
        <ul
          id="planejamento-iso-hints"
          style={{
            margin: "8px 0 0",
            paddingLeft: 18,
            color: "#334155",
            lineHeight: 1.5,
          }}
        >
          <li>
            Use os botões "← Anterior" e "Próximo →" para navegar entre os anos.
          </li>
          <li>
            Clique em "Abrir planejamento" em um mês. Se ainda não existir, ele
            será criado automaticamente.
          </li>
          <li>
            Os planejamentos são organizados mensalmente para facilitar o
            acompanhamento.
          </li>
          <li>
            A tarja de status indica a situação: Aprovado, Pendente ou
            Reprovado.
          </li>
        </ul>
      )}
    </div>
  );
};
