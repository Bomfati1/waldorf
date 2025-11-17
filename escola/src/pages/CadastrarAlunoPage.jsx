import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ImportDropdown from "../components/ImportDropdown";
import ResponsavelCPF from "../components/ResponsavelCPF";
import InputWithHint from "../components/InputWithHint";
import SelectWithHint from "../components/SelectWithHint";
import TextareaWithHint from "../components/TextareaWithHint";
import "../css/FormLayout.css";
import "../css/CadastrarAlunoPage.css";
import "../css/ImportDropdown.css";

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

  // Callback quando responsável é encontrado
  const handleResponsavelFound = (responsavel) => {
    setResponsavelExistente(responsavel);
    setFormData((prev) => ({
      ...prev,
      cpf_responsavel: responsavel.cpf_responsavel,
      nome_completo_responsavel: responsavel.nome_responsavel,
      telefone: responsavel.telefone,
      email: responsavel.email || "",
      outro_telefone: responsavel.outro_telefone || "",
    }));
  };

  // Callback quando responsável não é encontrado (novo)
  const handleResponsavelNotFound = (data) => {
    setResponsavelExistente(null);
    // Limpa apenas os campos do responsável, mantém os dados do aluno intactos
    setFormData((prev) => ({
      ...prev, // Mantém TODOS os dados existentes (incluindo dados do aluno)
      cpf_responsavel: data.cpf_responsavel || "", // Atualiza apenas o CPF
      nome_completo_responsavel: "", // Limpa para novo cadastro
      telefone: "", // Limpa para novo cadastro
      email: "", // Limpa para novo cadastro
      outro_telefone: "", // Limpa para novo cadastro
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // A validação de turma_id foi removida
    setLoading(true);
    setError("");
    setSuccess("");

    console.log("📝 [CADASTRO FRONTEND] Iniciando cadastro de aluno");
    console.log("📄 [CADASTRO FRONTEND] Dados do formulário:", formData);

    try {
      const response = await fetch(
        "http://localhost:3001/cadastrar-aluno-completo",
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

      {/* Botão de Importação */}
      <div style={{ marginBottom: "2rem" }}>
        <ImportDropdown
          buttonText="Importar via Excel"
          buttonIcon="📊"
          options={[
            {
              icon: "🎓",
              title: "Importar Alunos",
              endpoint: "/alunos/upload-excel",
              acceptedColumns: [
                {
                  name: "Nome Completo Aluno",
                  description: "Nome completo do aluno",
                  required: true,
                },
                {
                  name: "Data Nascimento",
                  description:
                    "Data de nascimento do aluno (formato: YYYY-MM-DD)",
                  required: true,
                },
                {
                  name: "Informações Saúde",
                  description: "Informações de saúde do aluno (opcional)",
                  required: false,
                },
                {
                  name: "Situação Financeira",
                  description: "Situação financeira (Integral ou Bolsista)",
                  required: false,
                },
                {
                  name: "Nome Responsável",
                  description: "Nome completo do responsável",
                  required: true,
                },
                {
                  name: "Telefone",
                  description: "Número de telefone do responsável",
                  required: true,
                },
                {
                  name: "Email",
                  description: "Endereço de email do responsável",
                  required: true,
                },
                {
                  name: "Outro Telefone",
                  description: "Número de telefone secundário (opcional)",
                  required: false,
                },
                {
                  name: "RG",
                  description: "Número do RG do responsável (opcional)",
                  required: false,
                },
                {
                  name: "CPF",
                  description: "Número do CPF do responsável (opcional)",
                  required: false,
                },
              ],
              description:
                "Faça upload de um arquivo Excel (.xlsx ou .xls) para importar múltiplos alunos de uma vez. O sistema criará automaticamente novos registros de alunos e responsáveis na base de dados.",
              buttonText: "Importar Alunos",
              onSuccess: (data) => {
                setTimeout(() => navigate("/home/alunos"), 2000);
              },
              onError: (data) => {
                console.error("Erro na importação:", data);
              },
            },
          ]}
        />
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
                label="Situação Financeira"
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

        {/* Seção: Dados do Responsável */}
        <div className="form-section mt-3">
          <h3 className="form-section-title">👨‍👩‍👧 Dados do Responsável</h3>

          {/* Componente de busca por CPF */}
          <div className="mb-2">
            <ResponsavelCPF
              onResponsavelFound={handleResponsavelFound}
              onResponsavelNotFound={handleResponsavelNotFound}
            />
          </div>

          <div className="form-grid grid-2-cols">
            <div className="form-group full-width">
              <InputWithHint
                label="Nome do Responsável"
                hint="Nome completo do responsável legal pelo aluno. Este campo é preenchido automaticamente se o CPF for encontrado"
                name="nome_completo_responsavel"
                type="text"
                value={formData.nome_completo_responsavel}
                onChange={handleChange}
                disabled={responsavelExistente !== null}
                required
                placeholder={
                  responsavelExistente
                    ? "✓ Preenchido automaticamente via CPF"
                    : "Digite o nome completo do responsável"
                }
              />
            </div>

            <div className="form-group">
              <InputWithHint
                label="Telefone Principal"
                hint="Telefone principal para contato. Formato: (00) 00000-0000"
                name="telefone"
                type="tel"
                value={formData.telefone}
                onChange={handleChange}
                disabled={responsavelExistente !== null}
                required
                placeholder={
                  responsavelExistente
                    ? "✓ Preenchido automaticamente"
                    : "(00) 00000-0000"
                }
              />
            </div>

            <div className="form-group">
              <InputWithHint
                label="Telefone Adicional"
                hint="Telefone secundário ou de contato alternativo (opcional)"
                name="outro_telefone"
                type="tel"
                value={formData.outro_telefone}
                onChange={handleChange}
                disabled={responsavelExistente !== null}
                placeholder={
                  responsavelExistente
                    ? "✓ Preenchido automaticamente"
                    : "(00) 00000-0000 (opcional)"
                }
              />
            </div>

            <div className="form-group">
              <InputWithHint
                label="Email"
                hint="Endereço de email do responsável para comunicações e notificações"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                disabled={responsavelExistente !== null}
                placeholder={
                  responsavelExistente
                    ? "✓ Preenchido automaticamente"
                    : "email@exemplo.com"
                }
              />
            </div>
          </div>
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
