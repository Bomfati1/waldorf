import React from "react";
import { FaTrash, FaUser, FaClock } from "react-icons/fa";

const formatDate = (dateString) => {
  if (!dateString) return "Data não disponível";
  
  const date = new Date(dateString);
  
  // Verifica se a data é válida
  if (isNaN(date.getTime())) {
    return "Data inválida";
  }
  
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit", 
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
};

const formatRelativeTime = (dateString) => {
  if (!dateString) return "";
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return "agora mesmo";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `há ${minutes} minuto${minutes > 1 ? 's' : ''}`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `há ${hours} hora${hours > 1 ? 's' : ''}`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `há ${days} dia${days > 1 ? 's' : ''}`;
  } else {
    return formatDate(dateString);
  }
};

/**
 * Componente que renderiza a lista de comentários com informações detalhadas do usuário e data/hora.
 *
 * @param {object[]} comentarios - Array de objetos de comentário.
 * @param {object} usuarioAtual - Objeto com informações do usuário logado (ex: { id: 1, cargo: 'admin' }).
 * @param {function} onComentarioExcluido - Função para ser chamada após um comentário ser excluído.
 */
function ListaComentarios({ comentarios, usuarioAtual, onComentarioExcluido }) {
  const handleExcluirComentario = async (comentarioId) => {
    // Confirmação antes de excluir
    if (!window.confirm("Tem certeza que deseja excluir este comentário?")) {
      return;
    }

    try {
      // Faz a requisição DELETE para o backend
      const response = await fetch(
        `http://localhost:3001/comentarios/${comentarioId}`,
        {
          method: "DELETE",
          credentials: "include"
        }
      );

      if (!response.ok) {
        const erro = await response.json();
        throw new Error(erro.error || "Falha ao excluir comentário.");
      }

      // Se a exclusão for bem-sucedida, atualiza a interface
      // chamando a função do componente pai para remover o comentário da lista.
      await onComentarioExcluido(comentarioId);

      alert("Comentário excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir comentário:", error);
      alert(error.message);
    }
  };

  return (
    <div className="lista-comentarios">
      <h3 style={{ 
        marginBottom: "1rem", 
        color: "#333", 
        borderBottom: "2px solid #007bff", 
        paddingBottom: "0.5rem" 
      }}>
        Comentários ({comentarios?.length || 0})
      </h3>
      
      <div
        className="comments-list"
        style={{
          maxHeight: "400px",
          overflowY: "auto",
          marginBottom: "1.5rem",
          paddingRight: "10px",
        }}
      >
        {comentarios && comentarios.length > 0 ? (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {comentarios.map((comentario, index) => (
              <li
                key={comentario.id}
                style={{
                  border: "1px solid #e9ecef",
                  borderRadius: "8px",
                  padding: "1rem",
                  marginBottom: "0.75rem",
                  backgroundColor: "#f8f9fa",
                  position: "relative",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
              >
                {/* Cabeçalho do comentário com usuário e data */}
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "0.5rem"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <FaUser style={{ color: "#007bff", fontSize: "0.9rem" }} />
                    <span style={{ 
                      fontWeight: "600", 
                      color: "#333",
                      fontSize: "0.95rem"
                    }}>
                      {comentario.nome_usuario || "Usuário Desconhecido"}
                    </span>
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <FaClock style={{ color: "#6c757d", fontSize: "0.8rem" }} />
                    <div style={{ textAlign: "right" }}>
                      <div style={{
                        fontSize: "0.8rem",
                        color: "#6c757d",
                        fontWeight: "500"
                      }}>
                        {formatRelativeTime(comentario.data_comentario)}
                      </div>
                      <div style={{
                        fontSize: "0.75rem",
                        color: "#adb5bd"
                      }}>
                        {formatDate(comentario.data_comentario)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conteúdo do comentário */}
                <div style={{
                  backgroundColor: "white",
                  padding: "0.75rem",
                  borderRadius: "6px",
                  border: "1px solid #dee2e6",
                  marginBottom: "0.5rem"
                }}>
                  <p style={{ 
                    margin: 0, 
                    color: "#495057",
                    lineHeight: "1.5",
                    whiteSpace: "pre-wrap"
                  }}>
                    {comentario.texto_comentario}
                  </p>
                </div>

                {/* Botão de excluir */}
                <div style={{ textAlign: "right" }}>
                  <button
                    onClick={() => handleExcluirComentario(comentario.id)}
                    className="botao-excluir-comentario"
                    title="Excluir comentário"
                    style={{
                      background: "transparent",
                      border: "1px solid #dc3545",
                      color: "#dc3545",
                      cursor: "pointer",
                      fontSize: "0.8rem",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      transition: "all 0.2s ease"
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = "#dc3545";
                      e.target.style.color = "white";
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = "transparent";
                      e.target.style.color = "#dc3545";
                    }}
                  >
                    <FaTrash style={{ fontSize: "0.7rem" }} />
                    Excluir
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div style={{
            textAlign: "center",
            padding: "2rem",
            color: "#6c757d",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
            border: "2px dashed #dee2e6"
          }}>
            <FaUser style={{ fontSize: "2rem", marginBottom: "1rem", opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: "1rem" }}>
              Nenhum comentário ainda.
            </p>
            <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9rem", opacity: 0.8 }}>
              Seja o primeiro a comentar!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ListaComentarios;