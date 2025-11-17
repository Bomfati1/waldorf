// src/pages/ConfiguracoesPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
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

  const [membros, setMembros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberPassword, setNewMemberPassword] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("Professor");

  // Bloqueia o scroll do body quando o modal está aberto
  useBodyScrollLock(showForm);

  const membrosAgrupados = agruparPorCargo(membros);
  // Define a ordem de exibição dos cargos
  const cargos = [
    "Administrador Geral",
    "Administrador Pedagógico",
    "Professor",
  ];

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
      const response = await fetch("http://localhost:3001/usuarios", {
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
    try {
      const response = await fetch("http://localhost:3001/register", {
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
          `http://localhost:3001/usuarios/${memberId}`,
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
          <div
            className="user-modal-overlay"
            onClick={() => setShowForm(false)}
          >
            <div
              className="user-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="user-modal-close"
                type="button"
                title="Fechar"
                onClick={() => setShowForm(false)}
              >
                ×
              </button>
              <div className="add-member-form" style={{ margin: 0 }}>
                <h3>Adicionar Novo Membro</h3>
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
                      hint="Email institucional que será usado para fazer login no sistema"
                      type="email"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      placeholder="email@exemplo.com"
                      required
                    />
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
                      hint="Selecione o nível de acesso: Administrador Geral (acesso total), Administrador Pedagógico (acesso pedagógico) ou Professor (acesso limitado)"
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value)}
                    >
                      {cargos.map((cargo) => (
                        <option key={cargo} value={cargo}>
                          {cargo}
                        </option>
                      ))}
                    </SelectWithHint>
                  </div>
                  <button type="submit" className="submit-button">
                    Salvar Membro
                  </button>
                </form>
              </div>
            </div>
          </div>
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
