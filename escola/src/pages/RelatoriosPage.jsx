import React, { useState, useEffect } from "react";
import "../css/RelatoriosPage.css"; // Criaremos este arquivo CSS

const RelatoriosPage = () => {
  // Estados para a lista de relatórios
  const [relatorios, setRelatorios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Estados para o formulário de upload
  const [file, setFile] = useState(null);
  const [tipo, setTipo] = useState("aluno"); // 'aluno' ou 'turma'
  const [alunoId, setAlunoId] = useState("");
  const [turmaId, setTurmaId] = useState("");
  const [alunos, setAlunos] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  // Função para buscar os relatórios existentes
  const fetchRelatorios = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:3001/relatorios");
      if (!response.ok) {
        throw new Error("Falha ao buscar relatórios.");
      }
      const data = await response.json();
      setRelatorios(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Efeito para buscar dados iniciais (relatórios, alunos, turmas)
  useEffect(() => {
    fetchRelatorios();

    // Busca alunos ativos para o select
    const fetchAlunos = async () => {
      try {
        const res = await fetch("http://localhost:3001/alunos/ativos");
        const data = await res.json();
        setAlunos(data);
      } catch (error) {
        console.error("Erro ao buscar alunos:", error);
      }
    };

    // Busca turmas para o select
    const fetchTurmas = async () => {
      try {
        const res = await fetch("http://localhost:3001/turmas");
        const data = await res.json();
        setTurmas(data);
      } catch (error) {
        console.error("Erro ao buscar turmas:", error);
      }
    };

    fetchAlunos();
    fetchTurmas();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setUploadError("Por favor, selecione um arquivo.");
      return;
    }
    if (tipo === "aluno" && !alunoId) {
      setUploadError("Por favor, selecione um aluno.");
      return;
    }
    if (tipo === "turma" && !turmaId) {
      setUploadError("Por favor, selecione uma turma.");
      return;
    }

    setUploading(true);
    setUploadError("");
    setUploadSuccess("");

    const formData = new FormData();
    formData.append("relatorio", file);
    formData.append("tipo", tipo);
    if (tipo === "aluno") {
      formData.append("alunoId", alunoId);
    } else {
      formData.append("turmaId", turmaId);
    }

    try {
      const response = await fetch("http://localhost:3001/relatorios/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Ocorreu um erro no upload.");
      }

      setUploadSuccess(data.message);
      // Limpa o formulário e atualiza a lista
      setFile(null);
      e.target.reset();
      fetchRelatorios(); // Re-busca a lista de relatórios
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir este relatório?")) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/relatorios/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Falha ao excluir o relatório.");
      }

      // Atualiza o estado para remover o relatório da lista na UI
      setRelatorios((prevRelatorios) =>
        prevRelatorios.filter((relatorio) => relatorio.id !== id)
      );
    } catch (err) {
      alert(`Erro ao excluir: ${err.message}`);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="relatorios-page-container">
      <h1>Gerenciamento de Relatórios</h1>

      {/* Seção de Upload */}
      <div className="upload-section">
        <h2>Enviar Novo Relatório</h2>
        <form onSubmit={handleSubmit}>
          {uploadError && <p className="form-error">{uploadError}</p>}
          {uploadSuccess && <p className="form-success">{uploadSuccess}</p>}

          <div className="form-group">
            <label htmlFor="file-upload">Selecione o arquivo</label>
            <input
              id="file-upload"
              type="file"
              onChange={handleFileChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Tipo de Relatório</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="tipo"
                  value="aluno"
                  checked={tipo === "aluno"}
                  onChange={(e) => setTipo(e.target.value)}
                />
                Aluno
              </label>
              <label>
                <input
                  type="radio"
                  name="tipo"
                  value="turma"
                  checked={tipo === "turma"}
                  onChange={(e) => setTipo(e.target.value)}
                />
                Turma
              </label>
            </div>
          </div>

          {tipo === "aluno" && (
            <div className="form-group">
              <label htmlFor="aluno-select">Selecione o Aluno</label>
              <select
                id="aluno-select"
                value={alunoId}
                onChange={(e) => setAlunoId(e.target.value)}
                required
              >
                <option value="">-- Selecione um aluno --</option>
                {alunos.map((aluno) => (
                  <option key={aluno.id} value={aluno.id}>
                    {aluno.nome_completo}
                  </option>
                ))}
              </select>
            </div>
          )}

          {tipo === "turma" && (
            <div className="form-group">
              <label htmlFor="turma-select">Selecione a Turma</label>
              <select
                id="turma-select"
                value={turmaId}
                onChange={(e) => setTurmaId(e.target.value)}
                required
              >
                <option value="">-- Selecione uma turma --</option>
                {turmas.map((turma) => (
                  <option key={turma.id} value={turma.id}>
                    {turma.nome_turma}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button type="submit" disabled={uploading} className="submit-button">
            {uploading ? "Enviando..." : "Enviar Relatório"}
          </button>
        </form>
      </div>

      {/* Seção da Lista de Relatórios */}
      <div className="list-section">
        <h2>Relatórios Enviados</h2>
        {loading && <p>Carregando relatórios...</p>}
        {error && <p className="list-error">Erro: {error}</p>}
        {!loading && !error && (
          <table className="relatorios-table">
            <thead>
              <tr>
                <th>Nome do Arquivo</th>
                <th>Tipo</th>
                <th>Destino</th>
                <th>Data de Upload</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {relatorios.length > 0 ? (
                relatorios.map((relatorio) => (
                  <tr key={relatorio.id}>
                    <td>{relatorio.nome_original}</td>
                    <td className="capitalize">
                      {relatorio.aluno_id ? "Aluno" : "Turma"}
                    </td>
                    <td>{relatorio.nome_aluno || relatorio.nome_turma}</td>
                    <td>{formatDate(relatorio.data_upload)}</td>
                    <td>
                      <a
                        href={`http://localhost:3001/${relatorio.caminho_arquivo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="action-button"
                      >
                        Download
                      </a>
                      <button
                        onClick={() => handleDelete(relatorio.id)}
                        className="action-button delete-button"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">Nenhum relatório encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default RelatoriosPage;
