import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../css/Notificacoes.css";

const Notificacoes = () => {
  const [notificacoes, setNotificacoes] = useState([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [aberto, setAberto] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Buscar notificações
  const buscarNotificacoes = async () => {
    console.log("🔔 [FRONTEND] Iniciando busca de notificações...");
    try {
      const response = await fetch("http://localhost:3001/notificacoes", {
        credentials: "include",
      });
      console.log("📡 [FRONTEND] Response status:", response.status);
      console.log("📡 [FRONTEND] Response ok:", response.ok);

      if (response.status === 401) {
        console.warn(
          "🔐 [FRONTEND] Usuário não autenticado - faça login novamente"
        );
        // Limpar notificações em caso de não autenticado
        setNotificacoes([]);
        setNaoLidas(0);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        console.log("📦 [FRONTEND] Dados recebidos:", data);
        console.log("📊 [FRONTEND] Total de notificações:", data.length);
        console.log("🔍 [FRONTEND] Tipos:", data.map((n) => n.tipo).join(", "));
        console.log("📋 [FRONTEND] Primeira notificação:", data[0]);

        setNotificacoes(data);
        setNaoLidas(data.filter((n) => !n.lida).length);
        console.log(
          "✅ [FRONTEND] Estado atualizado - não lidas:",
          data.filter((n) => !n.lida).length
        );
      } else {
        console.error(
          "❌ [FRONTEND] Erro na resposta:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("❌ [FRONTEND] Erro ao buscar notificações:", error);
      console.error("❌ [FRONTEND] Stack:", error.stack);
    }
  };

  // Buscar contador de não lidas
  const buscarContador = async () => {
    try {
      const response = await fetch(
        "http://localhost:3001/notificacoes/nao-lidas/count",
        {
          credentials: "include",
        }
      );

      if (response.status === 401) {
        console.warn("🔐 [FRONTEND] Usuário não autenticado - contador zerado");
        setNaoLidas(0);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setNaoLidas(data.count);
      }
    } catch (error) {
      console.error("Erro ao buscar contador:", error);
    }
  };

  // Marcar notificação como lida
  const marcarComoLida = async (id) => {
    try {
      const response = await fetch(
        `http://localhost:3001/notificacoes/${id}/ler`,
        {
          method: "PATCH",
          credentials: "include",
        }
      );
      if (response.ok) {
        buscarNotificacoes();
      }
    } catch (error) {
      console.error("Erro ao marcar notificação:", error);
    }
  };

  // Marcar todas como lidas
  const marcarTodasLidas = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "http://localhost:3001/notificacoes/ler-todas",
        {
          method: "PATCH",
          credentials: "include",
        }
      );
      if (response.ok) {
        buscarNotificacoes();
      }
    } catch (error) {
      console.error("Erro ao marcar todas:", error);
    } finally {
      setLoading(false);
    }
  };

  // Deletar notificação
  const deletarNotificacao = async (id, event) => {
    event.stopPropagation();
    try {
      const response = await fetch(`http://localhost:3001/notificacoes/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        buscarNotificacoes();
      }
    } catch (error) {
      console.error("Erro ao deletar notificação:", error);
    }
  };

  // Clicar em notificação
  const handleNotificacaoClick = (notificacao) => {
    if (!notificacao.lida) {
      marcarComoLida(notificacao.id);
    }

    // Navegar para o planejamento se houver ID
    if (notificacao.planejamento_id) {
      setAberto(false);
      navigate("/home/planejamentos");
    }
  };

  // Formatar tempo relativo
  const formatarTempo = (dataString) => {
    const data = new Date(dataString);
    const agora = new Date();
    const diff = Math.floor((agora - data) / 1000); // diferença em segundos

    if (diff < 60) return "Agora";
    if (diff < 3600) return `${Math.floor(diff / 60)}min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;

    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  // Ícone por tipo
  const getIcone = (tipo) => {
    switch (tipo) {
      case "anexo_adicionado":
        return "📎";
      case "anexo_deletado":
        return "🗑️";
      case "comentario":
        return "💬";
      case "comentario_deletado":
        return "🗑️";
      case "aprovado":
        return "✅";
      case "reprovado":
        return "❌";
      case "planejamento":
        return "📋";
      default:
        return "🔔";
    }
  };

  // Carregar notificações ao montar
  useEffect(() => {
    console.log("🎯 [FRONTEND] Componente Notificacoes montado!");
    console.log("🎯 [FRONTEND] Estado aberto:", aberto);
    buscarNotificacoes();
    buscarContador();

    // Atualizar a cada 30 segundos
    const interval = setInterval(() => {
      console.log("⏰ [FRONTEND] Atualizando contador (30s)");
      buscarContador();
      if (aberto) {
        console.log("⏰ [FRONTEND] Dropdown aberto - atualizando notificações");
        buscarNotificacoes();
      }
    }, 30000);

    return () => {
      console.log("🔚 [FRONTEND] Componente Notificacoes desmontado");
      clearInterval(interval);
    };
  }, [aberto]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setAberto(false);
      }
    };

    if (aberto) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [aberto]);

  // Abrir notificações quando clicar no sino
  const toggleNotificacoes = () => {
    console.log("🖱️ [FRONTEND] Clique no sino - estado anterior:", aberto);
    setAberto(!aberto);
    if (!aberto) {
      console.log("🔍 [FRONTEND] Abrindo dropdown - buscando notificações...");
      buscarNotificacoes();
    } else {
      console.log("🔒 [FRONTEND] Fechando dropdown");
    }
  };

  console.log("🎨 [FRONTEND RENDER] Estado atual:", {
    notificacoes: notificacoes.length,
    naoLidas,
    aberto,
  });

  return (
    <div className="notificacoes-container" ref={dropdownRef}>
      <button
        className="notificacoes-button"
        onClick={toggleNotificacoes}
        aria-label={`Notificações${
          naoLidas > 0 ? ` - ${naoLidas} não lidas` : ""
        }`}
        title={`${
          naoLidas > 0
            ? `${naoLidas} notificações não lidas`
            : "Sem notificações"
        }`}
      >
        <span className="sino-icon">🔔</span>
        {naoLidas > 0 && <span className="notificacoes-badge">{naoLidas}</span>}
      </button>

      {aberto && (
        <div className="notificacoes-dropdown">
          <div className="notificacoes-header">
            <h3>Notificações</h3>
            {naoLidas > 0 && (
              <button
                className="btn-marcar-todas"
                onClick={marcarTodasLidas}
                disabled={loading}
                aria-label="Marcar todas as notificações como lidas"
                title="Marcar todas como lidas"
              >
                {loading ? "..." : "Marcar todas como lidas"}
              </button>
            )}
          </div>

          <div className="notificacoes-lista">
            {notificacoes.length === 0 ? (
              <div className="notificacoes-vazio">
                <p>🔔 Nenhuma notificação</p>
              </div>
            ) : (
              notificacoes.map((notif) => (
                <div
                  key={notif.id}
                  className={`notificacao-item ${
                    !notif.lida ? "nao-lida" : ""
                  }`}
                  onClick={() => handleNotificacaoClick(notif)}
                >
                  <div className="notificacao-icone">
                    {getIcone(notif.tipo)}
                  </div>
                  <div className="notificacao-conteudo">
                    <p className="notificacao-mensagem">{notif.mensagem}</p>
                    <span className="notificacao-tempo">
                      {formatarTempo(notif.created_at)}
                    </span>
                  </div>
                  <button
                    className="notificacao-delete"
                    onClick={(e) => deletarNotificacao(notif.id, e)}
                    aria-label={`Deletar notificação: ${notif.mensagem.substring(
                      0,
                      50
                    )}...`}
                    title="Deletar notificação"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notificacoes;
