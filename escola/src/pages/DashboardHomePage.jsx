import React from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import "../css/DashboardHomePage.css"; // Criaremos este arquivo CSS

const HomePage = () => {
  const { user } = useAuth();

  // Componente para o card de perfil do usuário
  const UserProfileCard = () => {
    if (!user) {
      return (
        <div className="profile-card">
          <p>Carregando perfil...</p>
        </div>
      );
    }

    return (
      <div className="profile-card">
        <div className="profile-card-header">
          <div className="profile-photo-placeholder">
            <span>{user.nome ? user.nome.charAt(0) : "?"}</span>
          </div>
          <h3>{user.nome}</h3>
          <p>{user.cargo}</p>
        </div>
        <div className="profile-card-body">
          <p>
            <strong>Email:</strong> {user.email}
          </p>
        </div>
        <div className="profile-card-footer">
          <Link to="/home/perfil" className="profile-card-link">
            Ver/Editar Perfil Completo
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="home-page-container">
      <div className="welcome-section">
        <h1 className="welcome-title">
          Bem-vindo ao Portal Primavera Waldorf, {user?.nome || "Usuário"}!
        </h1>
        <p className="welcome-text">
          Selecione uma opção no menu à esquerda para começar a navegar.
        </p>
        <p className="welcome-text">
          Este é o seu painel de controle central, onde você pode acessar
          rapidamente as principais funcionalidades do sistema, como gestão de
          alunos, turmas.
        </p>
      </div>
      <div className="profile-section">
        <UserProfileCard />
      </div>
    </div>
  );
};

export default HomePage;
