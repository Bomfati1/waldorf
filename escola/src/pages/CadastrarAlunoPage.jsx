import React, { useState } from "react";
import "../css/CadastrarAlunoPage.css"; // Importar o CSS
import { useNavigate } from "react-router-dom";
import ImportDropdown from "../components/ImportDropdown";
import "../css/ImportDropdown.css";

const CadastrarAlunoPage = () => {
  // Estado único para todos os campos do formulário
  const [formData, setFormData] = useState({
    nome_completo_aluno: "",
    data_nascimento: "",
    informacoes_saude: "",
    status_pagamento: "Integral",
    // turma_id foi removido
    nome_completo_responsavel: "",
    telefone: "",
    email: "",
    outro_telefone: "",
  });

  // Estados para controle da UI
  // O estado 'turmas' e o useEffect foram removidos
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // A validação de turma_id foi removida
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        "http://localhost:3001/cadastrar-aluno-completo",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Ocorreu um erro ao cadastrar.");
      }

      setSuccess(data.message || "Aluno cadastrado com sucesso!");
      setTimeout(() => navigate("/home/alunos"), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cadastrar-aluno-container">
      <h1>Cadastrar Novo Aluno</h1>
      
      <ImportDropdown
        buttonText="Importar via Excel"
        buttonIcon="📊"
        options={[
          {
            icon: "🎓",
            title: "Importar Alunos",
            endpoint: "/alunos/upload-excel",
            acceptedColumns: [
              { name: "Nome Completo Aluno", description: "Nome completo do aluno", required: true },
              { name: "Data Nascimento", description: "Data de nascimento do aluno (formato: YYYY-MM-DD)", required: true },
              { name: "Informações Saúde", description: "Informações de saúde do aluno (opcional)", required: false },
              { name: "Status Pagamento", description: "Status do pagamento (Integral ou Bolsista)", required: false },
              { name: "Nome Responsável", description: "Nome completo do responsável", required: true },
              { name: "Telefone", description: "Número de telefone do responsável", required: true },
              { name: "Email", description: "Endereço de email do responsável", required: true },
              { name: "Outro Telefone", description: "Número de telefone secundário (opcional)", required: false },
              { name: "RG", description: "Número do RG do responsável (opcional)", required: false },
              { name: "CPF", description: "Número do CPF do responsável (opcional)", required: false }
            ],
            description: "Faça upload de um arquivo Excel (.xlsx ou .xls) para importar múltiplos alunos de uma vez. O sistema criará automaticamente novos registros de alunos e responsáveis na base de dados.",
            buttonText: "Importar Alunos",
            onSuccess: (data) => {
              // Redirecionar para a lista de alunos após importação bem-sucedida
              setTimeout(() => navigate("/home/alunos"), 2000);
            },
            onError: (data) => {
              console.error("Erro na importação:", data);
            }
          }
        ]}
      />

      <form onSubmit={handleSubmit} className="aluno-form">
        {error && <p className="form-error">{error}</p>}
        {success && <p className="form-success">{success}</p>}

        <fieldset className="form-section">
          <legend>Dados do Aluno</legend>

          {/* O campo de seleção de turma foi removido daqui */}

          <div className="form-group">
            <label htmlFor="nome_completo_aluno">Nome Completo *</label>
            <input
              id="nome_completo_aluno"
              name="nome_completo_aluno"
              type="text"
              value={formData.nome_completo_aluno}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="data_nascimento">Data de Nascimento *</label>
            <input
              id="data_nascimento"
              name="data_nascimento"
              type="date"
              value={formData.data_nascimento}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="informacoes_saude">Informações de Saúde</label>
            <textarea
              id="informacoes_saude"
              name="informacoes_saude"
              value={formData.informacoes_saude}
              onChange={handleChange}
              placeholder="Alergias, medicamentos, etc."
            />
          </div>

          <div className="form-group">
            <label htmlFor="status_pagamento">Status do Pagamento</label>
            <select
              id="status_pagamento"
              name="status_pagamento"
              value={formData.status_pagamento}
              onChange={handleChange}
            >
              <option value="Integral">Integral</option>
              <option value="Bolsista">Bolsista</option>
            </select>
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend>Dados do Responsável</legend>
          <div className="form-group">
            <label htmlFor="nome_completo_responsavel">
              Nome do Responsável *
            </label>
            <input
              id="nome_completo_responsavel"
              name="nome_completo_responsavel"
              type="text"
              value={formData.nome_completo_responsavel}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="telefone">Telefone *</label>
            <input
              id="telefone"
              name="telefone"
              type="tel"
              value={formData.telefone}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="outro_telefone">Outro Telefone</label>
            <input
              id="outro_telefone"
              name="outro_telefone"
              type="tel"
              value={formData.outro_telefone}
              onChange={handleChange}
            />
          </div>
        </fieldset>

        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? "Cadastrando..." : "Cadastrar Aluno"}
        </button>
      </form>
    </div>
  );
};

export default CadastrarAlunoPage;
