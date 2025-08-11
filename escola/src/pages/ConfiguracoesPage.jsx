// src/pages/ConfiguracoesPage.jsx
import React, { useState } from "react";
import "../css/ConfiguracoesPage.css"; // Importando o novo CSS

// Dados de exemplo. No futuro, virão de uma API.
const membrosIniciais = [
  {
    id: 1,
    nome: "Ana Silva",
    email: "ana.silva@escola.com",
    cargo: "Administrador Geral",
  },
  {
    id: 2,
    nome: "Carlos Souza",
    email: "carlos.souza@escola.com",
    cargo: "Administrador Pedagógico",
  },
  {
    id: 3,
    nome: "Beatriz Costa",
    email: "beatriz.costa@escola.com",
    cargo: "Professor",
  },
  {
    id: 4,
    nome: "Daniel Martins",
    email: "daniel.martins@escola.com",
    cargo: "Professor",
  },
  {
    id: 5,
    nome: "Fernanda Lima",
    email: "fernanda.lima@escola.com",
    cargo: "Professor",
  },
];

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
  const [membros, setMembros] = useState(membrosIniciais);
  const [showForm, setShowForm] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("Professor"); // Cargo padrão

  const membrosAgrupados = agruparPorCargo(membros);
  // Define a ordem de exibição dos cargos
  const cargos = [
    "Administrador Geral",
    "Administrador Pedagógico",
    "Professor",
  ];

  const handleAddMember = (e) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim()) {
      alert("Por favor, preencha todos os campos.");
      return;
    }
    const newMember = {
      id: Date.now(), // Usando timestamp como ID simples
      nome: newMemberName,
      email: newMemberEmail,
      cargo: newMemberRole,
    };
    setMembros([...membros, newMember]);
    // Limpa o formulário e o esconde
    setNewMemberName("");
    setNewMemberEmail("");
    setNewMemberRole("Professor");
    setShowForm(false);
  };

  const handleRemoveMember = (memberId) => {
    // Adiciona uma confirmação para evitar remoção acidental
    if (window.confirm("Tem certeza que deseja remover este membro?")) {
      setMembros(membros.filter((membro) => membro.id !== memberId));
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
