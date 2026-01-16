import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getApiUrl } from "../../config/api";
import InputWithHint from "../components/InputWithHint";
import SelectWithHint from "../components/SelectWithHint";
import TextareaWithHint from "../components/TextareaWithHint";
import "../css/FormLayout.css";
import "../css/CadastrarAlunoPage.css";

const CadastrarAlunoPage = () => {
  // Estado único para todos os campos do formulário
  const [formData, setFormData] = useState({
    nome_completo_aluno: "",
    data_nascimento: "",
    informacoes_saude: "",
    status_pagamento: "Integral",
    cpf_responsavel: "",
    nome_completo_responsavel: "",
    telefone: "",
    email: "",
    outro_telefone: "",
  });

  const [responsavelExistente, setResponsavelExistente] = useState(null);
  const [responsaveis, setResponsaveis] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingResponsaveis, setLoadingResponsaveis] = useState(false);
  // Estados para controle da UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  // Buscar todos os responsáveis ao carregar
  useEffect(() => {
    const fetchResponsaveis = async () => {
      setLoadingResponsaveis(true);
      try {
        const response = await fetch(getApiUrl("/responsaveis"), {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setResponsaveis(data);
        }
      } catch (err) {
        console.error("Erro ao buscar responsáveis:", err);
      } finally {
        setLoadingResponsaveis(false);
      }
    };
    fetchResponsaveis();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Filtrar responsáveis com base no termo de busca
  const responsaveisFiltrados = responsaveis.filter((resp) =>
    resp.nome_completo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Selecionar responsável
  const handleSelectResponsavel = (responsavel) => {
    setResponsavelExistente(responsavel);
    setFormData((prev) => ({
      ...prev,
      cpf_responsavel: responsavel.cpf || "",
      nome_completo_responsavel: responsavel.nome_completo || "",
      telefone: responsavel.telefone || "",
      email: responsavel.email || "",
      outro_telefone: responsavel.outro_telefone || "",
    }));
    setSearchTerm(""); // Limpa a busca após selecionar
    setError(""); // Limpa qualquer erro anterior
  };

  // Limpar seleção de responsável
  const handleClearResponsavel = () => {
    setResponsavelExistente(null);
    setFormData((prev) => ({
      ...prev,
      cpf_responsavel: "",
      nome_completo_responsavel: "",
      telefone: "",
      email: "",
      outro_telefone: "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Valida se um responsável foi vinculado
    if (!responsavelExistente) {
      setError(
        "Por favor, vincule um responsável existente antes de cadastrar o aluno."
      );
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    console.log("📝 [CADASTRO FRONTEND] Iniciando cadastro de aluno");
    console.log("📄 [CADASTRO FRONTEND] Dados do formulário:", formData);

    try {
      const response = await fetch(
        getApiUrl("/cadastrar-aluno-completo"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      console.log("📡 [CADASTRO FRONTEND] Response status:", response.status);

      const data = await response.json();
      console.log("📦 [CADASTRO FRONTEND] Resposta do servidor:", data);

      if (!response.ok) {
        throw new Error(data.error || "Ocorreu um erro ao cadastrar.");
      }

      console.log("✅ [CADASTRO FRONTEND] Aluno cadastrado com sucesso!");
      console.log(
        "🔔 [CADASTRO FRONTEND] Notificação deve ter sido criada no backend"
      );

      setSuccess(data.message || "Aluno cadastrado com sucesso!");

      console.log("⏳ [CADASTRO FRONTEND] Redirecionando em 2 segundos...");
      setTimeout(() => {
        console.log("➡️ [CADASTRO FRONTEND] Navegando para /home/alunos");
        navigate("/home/alunos");
      }, 2000);
    } catch (err) {
      console.error("❌ [CADASTRO FRONTEND] Erro ao cadastrar:", err.message);
      console.error("❌ [CADASTRO FRONTEND] Stack:", err.stack);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cadastrar-aluno-container">
      {/* Header Fixo */}
      <div className="page-header">
        <h1>📝 Cadastrar Novo Aluno</h1>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit}>
        {/* Mensagens de Feedback */}
        {error && <div className="message error">⚠ {error}</div>}
        {success && <div className="message success">✓ {success}</div>}

        {/* Seção: Dados do Aluno */}
        <div className="form-section">
          <h3 className="form-section-title">👤 Dados do Aluno</h3>

          <div className="form-grid grid-2-cols">
            <div className="form-group full-width">
              <InputWithHint
                label="Nome Completo"
                hint="Digite o nome completo do aluno conforme consta no documento de identidade"
                name="nome_completo_aluno"
                type="text"
                value={formData.nome_completo_aluno}
                onChange={handleChange}
                required
                placeholder="Digite o nome completo do aluno"
              />
            </div>

            <div className="form-group">
              <InputWithHint
                label="Data de Nascimento"
                hint="Selecione a data de nascimento do aluno"
                name="data_nascimento"
                type="date"
                value={formData.data_nascimento}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <SelectWithHint
                label="Status Financeiro"
                hint="Indique se o aluno paga o valor integral ou possui algum tipo de bolsa/desconto"
                name="status_pagamento"
                value={formData.status_pagamento}
                onChange={handleChange}
              >
                <option value="Integral">Integral</option>
                <option value="Bolsista">Bolsista</option>
              </SelectWithHint>
            </div>

            <div className="form-group full-width">
              <TextareaWithHint
                label="Informações de Saúde"
                hint="Informe alergias, medicamentos em uso, condições especiais de saúde ou qualquer informação médica relevante"
                name="informacoes_saude"
                value={formData.informacoes_saude}
                onChange={handleChange}
                placeholder="Alergias, medicamentos, condições especiais, etc."
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Seção: Vincular Responsável */}
        <div className="form-section mt-3">
          <h3 className="form-section-title">👨‍👩‍👧 Vincular Responsável</h3>

          <p style={{ marginBottom: "1rem", color: "#666" }}>
            Para cadastrar um aluno, é necessário vincular um responsável já
            cadastrado no sistema. Se o responsável ainda não está cadastrado,
            acesse{" "}
            <a
              href="/home/cadastrar-responsavel"
              style={{ color: "#007bff", textDecoration: "underline" }}
              target="_blank"
              rel="noopener noreferrer"
            >
              Cadastrar Responsável
            </a>{" "}
            primeiro.
          </p>

          {/* Campo de busca por nome */}
          {!responsavelExistente && (
            <div style={{ marginBottom: "1rem" }}>
              <InputWithHint
                label="Buscar Responsável por Nome"
                hint="Digite o nome do responsável para encontrá-lo na lista"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Digite o nome do responsável..."
              />

              {/* Lista de responsáveis filtrados */}
              {searchTerm && responsaveisFiltrados.length > 0 && (
                <div
                  style={{
                    marginTop: "0.5rem",
                    maxHeight: "200px",
                    overflowY: "auto",
                    border: "1px solid #dee2e6",
                    borderRadius: "6px",
                    backgroundColor: "#fff",
                  }}
                >
                  {responsaveisFiltrados.map((resp) => (
                    <div
                      key={resp.id}
                      onClick={() => handleSelectResponsavel(resp)}
                      style={{
                        padding: "0.75rem",
                        cursor: "pointer",
                        borderBottom: "1px solid #f0f0f0",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.target.style.backgroundColor = "#f8f9fa")
                      }
                      onMouseLeave={(e) =>
                        (e.target.style.backgroundColor = "#fff")
                      }
                    >
                      <div style={{ fontWeight: "600", color: "#333" }}>
                        {resp.nome_completo}
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "#666" }}>
                        {resp.cpf && `CPF: ${resp.cpf}`}
                        {resp.telefone && ` • Tel: ${resp.telefone}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searchTerm && responsaveisFiltrados.length === 0 && (
                <div
                  style={{
                    marginTop: "0.5rem",
                    padding: "0.75rem",
                    backgroundColor: "#fff3cd",
                    border: "1px solid #ffc107",
                    borderRadius: "6px",
                    color: "#856404",
                  }}
                >
                  Nenhum responsável encontrado com este nome.
                </div>
              )}
            </div>
          )}

          {/* Informações do responsável vinculado */}
          {responsavelExistente && (
            <div
              style={{
                padding: "1rem",
                backgroundColor: "#f8f9fa",
                borderRadius: "8px",
                border: "1px solid #dee2e6",
                marginTop: "1rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.75rem",
                }}
              >
                <h4 style={{ margin: 0, color: "#28a745" }}>
                  ✓ Responsável Vinculado
                </h4>
                <button
                  type="button"
                  onClick={handleClearResponsavel}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                  }}
                >
                  Alterar
                </button>
              </div>
              <div style={{ display: "grid", gap: "0.5rem" }}>
                <p style={{ margin: 0 }}>
                  <strong>Nome:</strong> {responsavelExistente.nome_completo}
                </p>
                {responsavelExistente.cpf && (
                  <p style={{ margin: 0 }}>
                    <strong>CPF:</strong> {responsavelExistente.cpf}
                  </p>
                )}
                {responsavelExistente.telefone && (
                  <p style={{ margin: 0 }}>
                    <strong>Telefone:</strong> {responsavelExistente.telefone}
                  </p>
                )}
                {responsavelExistente.email && (
                  <p style={{ margin: 0 }}>
                    <strong>Email:</strong> {responsavelExistente.email}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer com Botão de Submit */}
        <div className="page-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/home/alunos")}
          >
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <>
                <span className="loading-spinner"></span> Cadastrando...
              </>
            ) : (
              <>💾 Cadastrar Aluno</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CadastrarAlunoPage;
