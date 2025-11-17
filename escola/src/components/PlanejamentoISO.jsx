import React, { useState, useEffect, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import "../css/PlanejamentoISO.css";
import PlanejamentoModal from "./PlanejamentoModal";

const PlanejamentoISO = ({ turmaId, ano }) => {
  const [anoAtual, setAnoAtual] = useState(ano || new Date().getFullYear());
  const [mesAtual, setMesAtual] = useState(new Date().getMonth() + 1);
  const [semanas, setSemanas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalInfo, setModalInfo] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingByWeek, setPendingByWeek] = useState({}); // evita cliques duplos

  useEffect(() => {
    if (turmaId) {
      fetchSemanasDoMes();
    }
  }, [anoAtual, mesAtual, turmaId]);

  // Se o prop de ano for fornecido, sincroniza com o estado interno
  useEffect(() => {
    if (ano && ano !== anoAtual) {
      setAnoAtual(ano);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ano]);

  const fetchSemanasDoMes = async () => {
    setLoading(true);
    setError(null);

    console.log(
      `📅 Buscando semanas para ${mesAtual}/${anoAtual}, Turma: ${turmaId}`
    );

    try {
      const response = await fetch(
        `http://localhost:3001/planejamentos/semanas-iso/${anoAtual}/${mesAtual}?turma_id=${turmaId}`,
        { credentials: "include" }
      );

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Recebidas ${data.length} semanas:`, data);
      setSemanas(data);
    } catch (error) {
      console.error("❌ Erro ao buscar semanas:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const navegarMes = (direcao) => {
    if (direcao === "anterior") {
      if (mesAtual === 1) {
        setMesAtual(12);
        setAnoAtual(anoAtual - 1);
      } else {
        setMesAtual(mesAtual - 1);
      }
    } else {
      if (mesAtual === 12) {
        setMesAtual(1);
        setAnoAtual(anoAtual + 1);
      } else {
        setMesAtual(mesAtual + 1);
      }
    }
  };

  const criarPlanejamento = async (semana) => {
    console.log("🆕 Criando planejamento para semana:", semana);

    try {
      const response = await fetch(
        "http://localhost:3001/planejamentos/semana-iso",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            turma_id: turmaId,
            ano_iso: semana.anoISO,
            semana_iso: semana.semanaISO,
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

      // Abre modal imediatamente e busca detalhes completos em seguida
      setModalInfo({
        ...data,
        semana_iso: data.semana_iso ?? semana.semanaISO,
        ano_iso: data.ano_iso ?? semana.anoISO,
      });
      await fetchSemanasDoMes();
      await abrirModalPorId(id);
    } catch (error) {
      console.error("❌ Erro ao criar planejamento:", error);
    }
  };

  // Abre o modal se existir planejamento, senão cria e abre
  const keyWeek = (s) => `${s.anoISO}-${s.semanaISO}-${turmaId}`;

  const abrirOuCriarPlanejamento = async (semana) => {
    console.log("📂 Ação: abrir ou criar planejamento para semana:", semana);
    const k = keyWeek(semana);
    if (pendingByWeek[k]) return;
    setPendingByWeek((m) => ({ ...m, [k]: true }));

    try {
      if (semana?.planejamento?.id_planejamento) {
        // Abre modal imediatamente com dados mínimos e busca detalhes em seguida
        setModalInfo({
          id_planejamento: semana.planejamento.id_planejamento,
          status: semana.planejamento.status,
          semana_iso: semana.semanaISO,
          ano_iso: semana.anoISO,
          ano: semana.anoISO,
          semana: semana.planejamento.semana,
          mes: semana.planejamento.mes,
        });
        await abrirModalPorId(semana.planejamento.id_planejamento);
      } else {
        await criarPlanejamento(semana);
      }
    } finally {
      setPendingByWeek((m) => {
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

  const getNomeMesCompleto = () => {
    return format(new Date(anoAtual, mesAtual - 1), "MMMM yyyy", {
      locale: ptBR,
    });
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
          onClick={() => navegarMes("anterior")}
          title="Mês anterior"
        >
          ← Anterior
        </button>

        <h2 className="titulo-mes">{getNomeMesCompleto()}</h2>

        <button
          className="btn-navegacao"
          onClick={() => navegarMes("proximo")}
          title="Próximo mês"
        >
          Próximo →
        </button>
      </div>

      {/* Dicas rápidas de uso */}
      <HintStrip />

      {error && (
        <div className="error-message">
          <span>❌ {error}</span>
          <button onClick={fetchSemanasDoMes}>Tentar novamente</button>
        </div>
      )}

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Carregando semanas...</p>
        </div>
      ) : semanas.length === 0 ? (
        <div className="empty-state">
          <p>📅 Nenhuma semana encontrada para este mês</p>
        </div>
      ) : (
        <div className="semanas-grid">
          {semanas.map((semana) => (
            <div
              key={`${semana.anoISO}-W${semana.semanaISO}`}
              className={`semana-card ${
                semana.compartilhada ? "compartilhada" : ""
              }`}
            >
              <div className="semana-header">
                <div className="semana-numero">
                  <strong>Semana {semana.semanaISO}</strong>
                  <span className="ano-iso">{semana.anoISO}</span>
                </div>

                <div className="semana-periodo">
                  {format(parseISO(semana.inicioSemana), "dd/MM")} -
                  {format(parseISO(semana.fimSemana), "dd/MM")}
                </div>
              </div>

              {semana.compartilhada && (
                <div className="badge-compartilhada">
                  <span className="icon">🔗</span>
                  <span className="texto">
                    Também em: {semana.outrosMesesNomes.join(", ")}
                  </span>
                </div>
              )}

              <div className="planejamento-body">
                {semana.planejamento && (
                  <div className="planejamento-existente">
                    <div
                      className={`status-badge status-${semana.planejamento.status
                        ?.toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      {semana.planejamento.status}
                    </div>
                  </div>
                )}
                <button
                  className="btn-abrir"
                  disabled={!!pendingByWeek[keyWeek(semana)]}
                  onClick={() => abrirOuCriarPlanejamento(semana)}
                  title="Abrir modal do planejamento"
                >
                  {pendingByWeek[keyWeek(semana)]
                    ? "Abrindo..."
                    : "📂 Abrir planejamento"}
                </button>
              </div>

              {/* Mini calendário da semana */}
              <div className="mini-calendario">
                <div className="dias-semana-header">
                  {["S", "T", "Q", "Q", "S", "S", "D"].map((dia, idx) => (
                    <div key={idx} className="dia-header">
                      {dia}
                    </div>
                  ))}
                </div>
                <div className="dias-semana-grid">
                  {semana.diasSemana.map((dia) => {
                    const diaDate = parseISO(dia);
                    const diaDoMes = diaDate.getMonth() + 1;
                    const isOutroMes = diaDoMes !== mesAtual;

                    return (
                      <div
                        key={dia}
                        className={`dia ${isOutroMes ? "outro-mes" : ""}`}
                        title={format(diaDate, "dd/MM/yyyy", { locale: ptBR })}
                      >
                        {format(diaDate, "d")}
                      </div>
                    );
                  })}
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
            await fetchSemanasDoMes();
          }}
          onDelete={async (planejamentoId) => {
            try {
              const resp = await fetch(
                `http://localhost:3001/planejamentos/${planejamentoId}`,
                { method: "DELETE", credentials: "include" }
              );
              if (!resp.ok) throw new Error("Falha ao excluir planejamento.");
              await fetchSemanasDoMes();
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

export default PlanejamentoISO;

// Componente interno simples para dicas contextuais
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
            Use os botões "← Anterior" e "Próximo →" para navegar entre os
            meses.
          </li>
          <li>
            Clique em "Abrir planejamento" em uma semana. Se ainda não existir,
            ele será criado automaticamente.
          </li>
          <li>
            Semanas com o ícone 🔗 aparecem em mais de um mês, pois atravessam a
            virada do mês.
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
