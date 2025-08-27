// Exemplo de como implementar em um componente React (ex: ListaComentarios.jsx)
import React from "react";
import { FaTrash } from "react-icons/fa"; // Usando um ícone de lixeira para o botão

const formatDate = (dateString) => new Date(dateString).toLocaleString("pt-BR");

/**
 * Componente que renderiza a lista de comentários e o botão de exclusão.
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
      <h3>Comentários</h3>
      <div
        className="comments-list"
        style={{
          maxHeight: "300px",
          overflowY: "auto",
          marginBottom: "1.5rem",
          paddingRight: "10px",
        }}
      >
        {comentarios && comentarios.length > 0 ? (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {comentarios.map((comentario) => (
              <li
                key={comentario.id}
                style={{
                  borderBottom: "1px solid #eee",
                  padding: "0.75rem 0",
                  marginBottom: "0.5rem",
                  position: "relative",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <p style={{ margin: 0, fontWeight: "bold", color: "#333" }}>
                    {comentario.nome_usuario || "Usuário"}
                    <span
                      style={{
                        fontWeight: "normal",
                        color: "#777",
                        marginLeft: "0.5rem",
                        fontSize: "0.8rem",
                      }}
                    >
                      em {formatDate(comentario.data_comentario)}
                    </span>
                  </p>
                  <p style={{ margin: "0.25rem 0 0 0", color: "#555" }}>
                    {comentario.texto_comentario}
                  </p>
                </div>

                {/* A verificação de permissão foi temporariamente removida para teste. 
                    O botão de excluir aparecerá para todos os usuários em todos os comentários. */}
                <button
                  onClick={() => handleExcluirComentario(comentario.id)}
                  className="botao-excluir-comentario"
                  title="Excluir comentário"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#dc3545",
                    cursor: "pointer",
                    fontSize: "1rem",
                    padding: "0 5px",
                  }}
                >
                  <FaTrash />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>Nenhum comentário ainda. Seja o primeiro a comentar!</p>
        )}
      </div>
    </div>
  );
}

export default ListaComentarios;
