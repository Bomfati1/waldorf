import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getApiUrl, fetchWithAuth } from "../config/api";
import ResponsavelCPF from "../components/ResponsavelCPF";
import InputWithHint from "../components/InputWithHint";
import "../css/FormLayout.css";

const CadastrarResponsavelPage = () => {
  const [formData, setFormData] = useState({
    cpf: "",
    nome_completo: "",
    telefone: "",
    email: "",
    outro_telefone: "",
    rg: "",
    cidade: "",
    bairro: "",
    logradouro: "",
    numero: "",
    complemento: "",
  });

  const [responsavelExistente, setResponsavelExistente] = useState(null);
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
    setError("Este CPF já está cadastrado no sistema.");
    setFormData((prev) => ({
      ...prev,
      cpf: responsavel.cpf_responsavel || responsavel.cpf,
      nome_completo: responsavel.nome_responsavel || responsavel.nome_completo,
      telefone: responsavel.telefone,
      email: responsavel.email || "",
      outro_telefone: responsavel.outro_telefone || "",
      rg: responsavel.rg || "",
      cidade: responsavel.cidade || "",
      bairro: responsavel.bairro || "",
      logradouro: responsavel.logradouro || "",
      numero: responsavel.numero || "",
      complemento: responsavel.complemento || "",
    }));
  };

  // Callback quando responsável não é encontrado (novo)
  const handleResponsavelNotFound = (data) => {
    setResponsavelExistente(null);
    setError("");
    setFormData((prev) => ({
      ...prev,
      cpf: data.cpf_responsavel || "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Valida se já existe responsável com este CPF
    if (responsavelExistente) {
      setError("Não é possível cadastrar. Este CPF já está no sistema.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    console.log("📝 [CADASTRO RESPONSÁVEL] Iniciando cadastro");
    console.log("📄 [CADASTRO RESPONSÁVEL] Dados:", formData);

    try {
      const response = await fetchWithAuth("/responsaveis", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      console.log(
        "📡 [CADASTRO RESPONSÁVEL] Response status:",
        response.status,
      );

      const data = await response.json();
      console.log("📦 [CADASTRO RESPONSÁVEL] Resposta:", data);

      if (!response.ok) {
        throw new Error(
          data.error || "Ocorreu um erro ao cadastrar responsável.",
        );
      }

      console.log("✅ [CADASTRO RESPONSÁVEL] Cadastrado com sucesso!");
      setSuccess(data.message || "Responsável cadastrado com sucesso!");

      setTimeout(() => {
        console.log(
          "➡️ [CADASTRO RESPONSÁVEL] Navegando para /home/responsaveis",
        );
        navigate("/home/responsaveis");
      }, 2000);
    } catch (err) {
      console.error("❌ [CADASTRO RESPONSÁVEL] Erro:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cadastrar-aluno-container">
      {/* Header Fixo */}
      <div className="page-header">
        <h1>👨‍👩‍👧 Cadastrar Novo Responsável</h1>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit}>
        {/* Mensagens de Feedback */}
        {error && <div className="message error">⚠ {error}</div>}
        {success && <div className="message success">✓ {success}</div>}

        {/* Seção: Dados do Responsável */}
        <div className="form-section">
          <h3 className="form-section-title">📋 Dados do Responsável</h3>

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
                label="Nome Completo"
                hint="Digite o nome completo do responsável conforme consta no documento de identidade"
                name="nome_completo"
                type="text"
                value={formData.nome_completo}
                onChange={handleChange}
                disabled={responsavelExistente !== null}
                required
                placeholder={
                  responsavelExistente
                    ? "✓ CPF já cadastrado"
                    : "Digite o nome completo do responsável"
                }
              />
            </div>

            <div className="form-group">
              <InputWithHint
                label="CPF"
                hint="CPF do responsável (somente números)"
                name="cpf"
                type="text"
                value={formData.cpf}
                onChange={handleChange}
                disabled={true}
                required
                placeholder="Busque o CPF acima"
              />
            </div>

            <div className="form-group">
              <InputWithHint
                label="RG"
                hint="Número do RG do responsável (opcional)"
                name="rg"
                type="text"
                value={formData.rg}
                onChange={handleChange}
                disabled={responsavelExistente !== null}
                placeholder={
                  responsavelExistente
                    ? "✓ CPF já cadastrado"
                    : "Digite o RG (opcional)"
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
                    ? "✓ CPF já cadastrado"
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
                    ? "✓ CPF já cadastrado"
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
                    ? "✓ CPF já cadastrado"
                    : "email@exemplo.com"
                }
              />
            </div>
          </div>
        </div>

        {/* Seção: Endereço */}
        <div className="form-section">
          <h3 className="form-section-title">📍 Endereço </h3>

          <div className="form-grid grid-2-cols">
            <div className="form-group">
              <InputWithHint
                label="Cidade"
                hint="Cidade onde o responsável reside"
                name="cidade"
                type="text"
                value={formData.cidade}
                onChange={handleChange}
                disabled={responsavelExistente !== null}
                placeholder={
                  responsavelExistente
                    ? "✓ CPF já cadastrado"
                    : "Digite a cidade"
                }
              />
            </div>

            <div className="form-group">
              <InputWithHint
                label="Bairro"
                hint="Bairro do endereço"
                name="bairro"
                type="text"
                value={formData.bairro}
                onChange={handleChange}
                disabled={responsavelExistente !== null}
                placeholder={
                  responsavelExistente
                    ? "✓ CPF já cadastrado"
                    : "Digite o bairro"
                }
              />
            </div>

            <div className="form-group">
              <InputWithHint
                label="Logradouro"
                hint="Nome completo do logradouro (Ex: Rua das Flores, Avenida Brasil)"
                name="logradouro"
                type="text"
                value={formData.logradouro}
                onChange={handleChange}
                disabled={responsavelExistente !== null}
                placeholder={
                  responsavelExistente
                    ? "✓ CPF já cadastrado"
                    : "Nome da rua/avenida"
                }
              />
            </div>

            <div className="form-group">
              <InputWithHint
                label="Número"
                hint="Número do imóvel"
                name="numero"
                type="text"
                value={formData.numero}
                onChange={handleChange}
                disabled={responsavelExistente !== null}
                placeholder={
                  responsavelExistente ? "✓ CPF já cadastrado" : "Número"
                }
              />
            </div>

            <div className="form-group">
              <InputWithHint
                label="Complemento"
                hint="Complemento do endereço (Apt, Bloco, Casa, etc.)"
                name="complemento"
                type="text"
                value={formData.complemento}
                onChange={handleChange}
                disabled={responsavelExistente !== null}
                placeholder={
                  responsavelExistente
                    ? "✓ CPF já cadastrado"
                    : "Ex: Apt 101, Bloco A"
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
            onClick={() => navigate("/home/responsaveis")}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || responsavelExistente !== null}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span> Cadastrando...
              </>
            ) : (
              <>💾 Cadastrar Responsável</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CadastrarResponsavelPage;
