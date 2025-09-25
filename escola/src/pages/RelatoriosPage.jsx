import React, { useState, useEffect } from "react";
import "../css/RelatoriosPage.css";

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
      const response = await fetch("http://localhost:3001/relatorios", {
        credentials: "include"
      });
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
        console.log("Buscando alunos ativos...");
        const res = await fetch("http://localhost:3001/alunos/ativos", {
          credentials: "include"
        });
        console.log("Resposta da busca de alunos:", res.status, res.statusText);
        if (!res.ok) {
          throw new Error(`Erro ${res.status}: ${res.statusText}`);
        }
        const data = await res.json();
        console.log("Dados dos alunos recebidos:", data);
        setAlunos(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erro ao buscar alunos:", error);
        setAlunos([]); // Garante que sempre seja um array
      }
    };

    // Busca turmas para o select
    const fetchTurmas = async () => {
      try {
        console.log("Buscando turmas...");
        const res = await fetch("http://localhost:3001/turmas", {
          credentials: "include"
        });
        console.log("Resposta da busca de turmas:", res.status, res.statusText);
        if (!res.ok) {
          throw new Error(`Erro ${res.status}: ${res.statusText}`);
        }
        const data = await res.json();
        console.log("Dados das turmas recebidos:", data);
        setTurmas(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erro ao buscar turmas:", error);
        setTurmas([]); // Garante que sempre seja um array
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
        credentials: "include"
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
        credentials: "include"
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

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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
                {alunos && Array.isArray(alunos) && alunos.length > 0 ? (
                  alunos.map((aluno) => (
                    <option key={aluno.id} value={aluno.id}>
                      {aluno.nome_completo}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    {alunos.length === 0 ? "Nenhum aluno encontrado" : "Carregando alunos..."}
                  </option>
                )}
              </select>
              {alunos.length === 0 && (
                <p style={{ color: 'red', fontSize: '0.9rem', marginTop: '5px' }}>
                  Nenhum aluno ativo encontrado. Verifique se há alunos cadastrados e ativos.
                </p>
              )}
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
                {turmas && Array.isArray(turmas) && turmas.length > 0 ? (
                  turmas.map((turma) => (
                    <option key={turma.id} value={turma.id}>
                      {turma.nome_turma}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    {turmas.length === 0 ? "Nenhuma turma encontrada" : "Carregando turmas..."}
                  </option>
                )}
              </select>
              {turmas.length === 0 && (
                <p style={{ color: 'red', fontSize: '0.9rem', marginTop: '5px' }}>
                  Nenhuma turma encontrada. Verifique se há turmas cadastradas.
                </p>
              )}
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
                <th>Tamanho</th>
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
                      {relatorio.tipo_destino}
                    </td>
                    <td>{relatorio.nome_destino}</td>
                    <td>{formatFileSize(relatorio.tamanho_bytes)}</td>
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
                  <td colSpan="6">Nenhum relatório encontrado.</td>
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