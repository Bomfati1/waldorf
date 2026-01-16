import React, { useState, useEffect } from "react";
import { validateCPF, maskCPF, cleanCPF } from "../utils/cpfValidator";
import InputWithHint from "./InputWithHint";
import "../css/ResponsavelCPF.css";

const ResponsavelCPF = ({
  onResponsavelFound,
  onResponsavelNotFound,
  onVincularResponsavel, // opcional: aciona vínculo imediato ao clicar no botão
  initialData = {},
}) => {
  const [cpf, setCpf] = useState(initialData.cpf_responsavel || "");
  const [searching, setSearching] = useState(false);
  const [responsavelEncontrado, setResponsavelEncontrado] = useState(null);
  const [error, setError] = useState("");
  const [cpfValido, setCpfValido] = useState(true);

  // Busca responsável quando CPF estiver completo
  useEffect(() => {
    const cpfLimpo = cleanCPF(cpf);
    console.log("🔄 [ResponsavelCPF] useEffect - CPF digitado:", cpf);
    console.log(
      "🔄 [ResponsavelCPF] useEffect - CPF limpo:",
      cpfLimpo,
      "Tamanho:",
      cpfLimpo.length
    );

    if (cpfLimpo.length === 11) {
      const cpfValido = validateCPF(cpfLimpo);
      console.log("✔️ [ResponsavelCPF] CPF completo - Válido?", cpfValido);

      if (cpfValido) {
        buscarResponsavel(cpfLimpo);
        setCpfValido(true);
        setError("");
      } else {
        setCpfValido(false);
        setError("CPF inválido");
        setResponsavelEncontrado(null);
        console.log(
          "❌ [ResponsavelCPF] CPF inválido segundo algoritmo de validação"
        );
      }
    } else {
      setResponsavelEncontrado(null);
      setError("");
      setCpfValido(true);
      if (cpf) {
        console.log(
          "⏳ [ResponsavelCPF] CPF incompleto, aguardando digitação..."
        );
      }
    }
  }, [cpf]);

  const buscarResponsavel = async (cpfLimpo) => {
    setSearching(true);
    setError("");

    console.log("🔍 [ResponsavelCPF] Buscando CPF:", cpfLimpo);

    try {
      const url = `http://localhost:3001/responsaveis/buscar-por-cpf/${cpfLimpo}`;
      console.log("🌐 [ResponsavelCPF] URL da requisição:", url);

      const response = await fetch(url, {
        credentials: "include",
      });

      console.log("📡 [ResponsavelCPF] Status da resposta:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ [ResponsavelCPF] Responsável encontrado:", data);
        setResponsavelEncontrado(data);
        if (onResponsavelFound) {
          onResponsavelFound(data);
        }
      } else if (response.status === 404) {
        console.log(
          "❌ [ResponsavelCPF] Responsável não encontrado - CPF não cadastrado"
        );
        setResponsavelEncontrado(null);
        if (onResponsavelNotFound) {
          onResponsavelNotFound({ cpf_responsavel: cpfLimpo });
        }
      } else {
        const errorText = await response.text();
        console.error(
          "⚠️ [ResponsavelCPF] Erro na busca:",
          response.status,
          errorText
        );
        throw new Error("Erro ao buscar responsável");
      }
    } catch (err) {
      console.error("❌ [ResponsavelCPF] Erro na requisição:", err);
      setError("Erro ao buscar responsável");
    } finally {
      setSearching(false);
    }
  };

  const handleCPFChange = (e) => {
    const valor = e.target.value;
    const mascarado = maskCPF(valor);
    setCpf(mascarado);
  };

  const limparBusca = () => {
    setCpf("");
    setResponsavelEncontrado(null);
    setError("");
    setCpfValido(true);
    // Limpa os campos do responsável mantendo os dados do aluno
    if (onResponsavelNotFound) {
      onResponsavelNotFound({ cpf_responsavel: "" });
    }
  };

  return (
    <div className="responsavel-cpf-container">
      <div className="cpf-input-group">
        <InputWithHint
          label={
            <>
              CPF do Responsável
              {searching && (
                <span className="searching-indicator"> 🔍 Buscando...</span>
              )}
            </>
          }
          hint="Digite o CPF do responsável. Se já cadastrado, os dados serão preenchidos automaticamente. Formato: 000.000.000-00"
          type="text"
          value={cpf}
          onChange={handleCPFChange}
          placeholder="000.000.000-00"
          maxLength={14}
          className={`cpf-input ${!cpfValido ? "invalid" : ""} ${
            responsavelEncontrado ? "found" : ""
          }`}
          required
        />
        {cpf && (
          <button
            type="button"
            className="clear-cpf-btn"
            onClick={limparBusca}
            title="Limpar CPF"
            style={{
              position: "absolute",
              right: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "transparent",
              border: "none",
              fontSize: "1.2rem",
              cursor: "pointer",
              color: "#6c757d",
            }}
          >
            ✕
          </button>
        )}
        {!cpfValido && <small className="error-message">⚠️ {error}</small>}
      </div>

      {responsavelEncontrado && (
        <div className="responsavel-encontrado">
          <div className="responsavel-header">
            <span className="check-icon">✅</span>
            <h4>Responsável Encontrado!</h4>
          </div>

          <div className="responsavel-info">
            <div className="info-row">
              <strong>Nome:</strong>
              <span>{responsavelEncontrado.nome_responsavel}</span>
            </div>
            <div className="info-row">
              <strong>Telefone:</strong>
              <span>{responsavelEncontrado.telefone}</span>
            </div>
            {responsavelEncontrado.email && (
              <div className="info-row">
                <strong>Email:</strong>
                <span>{responsavelEncontrado.email}</span>
              </div>
            )}
            {responsavelEncontrado.outro_telefone && (
              <div className="info-row">
                <strong>Outro Telefone:</strong>
                <span>{responsavelEncontrado.outro_telefone}</span>
              </div>
            )}
          </div>

          {responsavelEncontrado.alunos &&
            responsavelEncontrado.alunos.length > 0 && (
              <div className="alunos-vinculados">
                <strong>Alunos já vinculados a este responsável:</strong>
                <ul>
                  {responsavelEncontrado.alunos.map((aluno, index) => (
                    <li key={index}>
                      👶 {aluno.nome_aluno}
                      {aluno.turma && ` - ${aluno.turma}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          <div className="responsavel-actions">
            <button
              type="button"
              className="btn-use-responsavel"
              onClick={() => {
                if (onVincularResponsavel) {
                  onVincularResponsavel(responsavelEncontrado);
                }
              }}
              title="Adicionar/Vincular este responsável ao aluno"
            >
              ✓ Adicionar este responsável
            </button>
            <button
              type="button"
              className="btn-change-cpf"
              onClick={limparBusca}
            >
              ✏️ Buscar outro CPF
            </button>
          </div>
        </div>
      )}

      {cpf &&
        cleanCPF(cpf).length === 11 &&
        !responsavelEncontrado &&
        !searching &&
        cpfValido && (
          <div className="responsavel-nao-encontrado">
            <div className="info-header">
              <span className="info-icon">ℹ️</span>
              <h4>Novo Responsável</h4>
            </div>
            <p>
              Este CPF não está cadastrado. Preencha os dados do responsável
              abaixo.
            </p>
          </div>
        )}
    </div>
  );
};

export default ResponsavelCPF;
