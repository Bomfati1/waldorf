// src/pages/ConfiguracoesPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { getApiUrl } from "../config/api";
import { useAuth } from "../context/AuthContext";
import ModalBase from "../components/ModalBase";
import { useModal } from "../context/ModalContext";
import InputWithHint from "../components/InputWithHint";
import SelectWithHint from "../components/SelectWithHint";
import "../css/ConfiguracoesPage.css"; // Importando o novo CSS

// Função para agrupar membros por cargo
const agruparPorCargo = (membros) => {
  return membros.reduce((acc, membro) => {
    const cargo = membro.cargo;
    if (!acc[cargo]) {
      acc[cargo] = [];
    }
    acc[cargo].push(membro);
    return acc;
  }, {});
};

function ConfiguracoesPage() {
  const { user, loading: authLoading } = useAuth();
  const { openModal, closeModal, getZIndex } = useModal();
  const modalId = "add-member-modal";

  const [membros, setMembros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberPassword, setNewMemberPassword] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("Professor");
  const [emailError, setEmailError] = useState("");

  const membrosAgrupados = agruparPorCargo(membros);
  // Define a ordem de exibição dos cargos
  const cargos = [
    "Administrador Geral",
    "Administrador Pedagógico",
    "Professor",
  ];
  
  // Cargos disponíveis no formulário (sem Administrador Pedagógico)
  const cargosFormulario = [
    "Administrador Geral",
    "Professor",
  ];

  useEffect(() => {
    if (showForm) {
      openModal(modalId);
    } else {
      closeModal(modalId);
    }
  }, [showForm]);

  const fetchMembros = useCallback(async () => {
    // Só busca se for admin geral
    const isAdminGeral =
      (user?.cargo || "").toLowerCase() === "administrador geral";
    if (!isAdminGeral) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(getApiUrl("/usuarios"), {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Falha ao buscar os membros da equipe.");
      }
      const data = await response.json();
      setMembros(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.cargo]);

  useEffect(() => {
    fetchMembros();
  }, [fetchMembros]);

  // Validação de sintaxe de e-mail
  const validateEmail = (emailValue) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  // Handler de mudança de e-mail com validação em tempo real
  const handleEmailChange = (value) => {
    setNewMemberEmail(value);

    if (value && !validateEmail(value)) {
      setEmailError("Por favor, insira um e-mail válido (exemplo@dominio.com)");
    } else {
      setEmailError("");
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (
      !newMemberName.trim() ||
      !newMemberEmail.trim() ||
      !newMemberPassword.trim()
    ) {
      alert("Por favor, preencha todos os campos, incluindo a senha.");
      return;
    }

    // Validação final de e-mail antes de enviar
    if (!validateEmail(newMemberEmail)) {
      alert("Por favor, insira um endereço de e-mail válido.");
      return;
    }
    try {
      const response = await fetch(getApiUrl("/register"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          nome: newMemberName,
          email: newMemberEmail,
          password: newMemberPassword,
          cargo: newMemberRole,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Falha ao adicionar membro.");
      }

      alert("Membro adicionado com sucesso!");
      setNewMemberName("");
      setNewMemberEmail("");
      setNewMemberPassword("");
      setNewMemberRole("Professor");
      setShowForm(false);
      fetchMembros(); // Atualiza a lista de membros
    } catch (err) {
      alert(`Erro: ${err.message}`);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (window.confirm("Tem certeza que deseja remover este membro?")) {
      try {
        const response = await fetch(
          getApiUrl(`/usuarios/${memberId}`),
          {
            method: "DELETE",
            credentials: "include",
          }
        );
        if (!response.ok) {
          throw new Error("Falha ao remover membro.");
        }
        alert("Membro removido com sucesso!");
        fetchMembros(); // Atualiza a lista de membros
      } catch (err) {
        alert(`Erro: ${err.message}`);
      }
    }
  };

  const isAdminGeral =
    (user?.cargo || "").toLowerCase() === "administrador geral";

  if (authLoading) {
    return (
      <div className="configuracoes-container">
        <h1>Configurações</h1>
        <p>Carregando...</p>
      </div>
    );
  }

  if (!isAdminGeral) {
    return (
      <div className="configuracoes-container">
        <h1>Configurações</h1>
        <p>Você não tem permissão para acessar esta seção.</p>
      </div>
    );
  }

  return (
    <div className="configuracoes-container">
      <h1>Configurações</h1>
      <p>
        Aqui você poderá ajustar as configurações do sistema e gerenciar os
        membros.
      </p>

      <div className="membros-section">
        <div className="membros-header">
          <h2>Membros da Equipe</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="add-member-button"
          >
            {showForm ? "Cancelar" : "+ Adicionar Membro"}
          </button>
        </div>

        {showForm && (
          <ModalBase
            isOpen={true}
            onClose={() => setShowForm(false)}
            title="👤 Adicionar Novo Membro"
            size="medium"
            zIndex={getZIndex(modalId)}
          >
            <div className="add-member-form" style={{ margin: 0 }}>
              <form onSubmit={handleAddMember}>
                <div className="form-group">
                  <InputWithHint
                    label="Nome"
                    hint="Digite o nome completo do novo membro da equipe"
                    type="text"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="Nome completo do membro"
                    required
                  />
                </div>
                <div className="form-group">
                  <InputWithHint
                    label="Email"
                    hint="Email institucional que será usado para fazer login no sistema. Apenas e-mails válidos e não cadastrados serão aceitos."
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="email@exemplo.com"
                    required
                  />
                  {emailError && (
                    <div
                      style={{
                        marginTop: "0.5rem",
                        padding: "0.5rem",
                        backgroundColor: "#fff3cd",
                        border: "1px solid #ffc107",
                        borderRadius: "4px",
                        color: "#856404",
                        fontSize: "0.875rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      ⚠️ {emailError}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <InputWithHint
                    label="Senha Provisória"
                    hint="Crie uma senha temporária que o membro deverá alterar no primeiro acesso"
                    type="password"
                    value={newMemberPassword}
                    onChange={(e) => setNewMemberPassword(e.target.value)}
                    placeholder="Crie uma senha para o novo membro"
                    required
                  />
                </div>
                <div className="form-group">
                  <SelectWithHint
                    label="Cargo"
                    hint="Selecione o nível de acesso: Administrador Geral (acesso total) ou Professor (acesso limitado)"
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                  >
                    {cargosFormulario.map((cargo) => (
                      <option key={cargo} value={cargo}>
                        {cargo}
                      </option>
                    ))}
                  </SelectWithHint>
                </div>
                <button
                  type="submit"
                  className="submit-button"
                  style={{
                    width: "100%",
                    padding: "12px",
                    backgroundColor: "#4CAF50",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "1rem",
                    fontWeight: "500",
                    cursor: "pointer",
                    marginTop: "1rem",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.target.style.backgroundColor = "#45a049")
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.backgroundColor = "#4CAF50")
                  }
                >
                  Salvar Membro
                </button>
              </form>
            </div>
          </ModalBase>
        )}

        {loading && <p className="loading-message">Carregando membros...</p>}
        {error && (
          <p className="error-message">Erro ao carregar membros: {error}</p>
        )}

        {cargos.map(
          (cargo) =>
            membrosAgrupados[cargo] && (
              <div key={cargo} className="role-section">
                <h3 className="role-title">{cargo}</h3>
                <ul className="member-list">
                  {membrosAgrupados[cargo].map((membro) => (
                    <li key={membro.id} className="member-item">
                      <div className="member-info">
                        <span className="member-name">{membro.nome}</span>
                        <span className="member-email">{membro.email}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveMember(membro.id)}
                        className="remove-member-button"
                      >
                        Remover
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )
        )}
      </div>
    </div>
  );
}

export default ConfiguracoesPage;
