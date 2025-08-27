// src/pages/ConfiguracoesPage.jsx
import React, { useState, useEffect, useCallback } from "react";
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
  const [membros, setMembros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberPassword, setNewMemberPassword] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("Professor");

  const membrosAgrupados = agruparPorCargo(membros);
  // Define a ordem de exibição dos cargos
  const cargos = [
    "Administrador Geral",
    "Administrador Pedagógico",
    "Professor",
  ];

  const fetchMembros = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:3001/usuarios");
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
  }, []);

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
          <div className="add-member-form">
            <h3>Adicionar Novo Membro</h3>
            <form onSubmit={handleAddMember}>
              <div className="form-group">
                <label htmlFor="nome">Nome</label>
                <input
                  type="text"
                  id="nome"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Nome completo do membro"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="senha">Senha Provisória</label>
                <input
                  type="password"
                  id="senha"
                  value={newMemberPassword}
                  onChange={(e) => setNewMemberPassword(e.target.value)}
                  placeholder="Crie uma senha para o novo membro"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="cargo">Cargo</label>
                <select
                  id="cargo"
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                >
                  {cargos.map((cargo) => (
                    <option key={cargo} value={cargo}>
                      {cargo}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="submit-button">
                Salvar Membro
              </button>
            </form>
          </div>
        )}

        {loading && <p>Carregando membros...</p>}
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
