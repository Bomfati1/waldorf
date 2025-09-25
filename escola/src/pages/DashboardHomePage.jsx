import React from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import {
  FaUserGraduate,
  FaUsers,
  FaChalkboardTeacher,
  FaFileSignature,
  FaPlusCircle,
  FaUserPlus,
  FaFileAlt,
  FaCalendarCheck,
  FaCog,
} from "react-icons/fa";
import "../css/DashboardHomePage.css";

const HomePage = () => {
  const { user } = useAuth();

  // Lista de funcionalidades disponíveis
  const allFeatures = [
    {
      path: "alunos",
      icon: <FaUserGraduate />,
      label: "Alunos",
      description: "Gerenciar alunos da escola",
    },
    {
      path: "planejamentos",
      icon: <FaCalendarCheck />,
      label: "Planejamentos",
      description: "Criar e gerenciar planejamentos",
    },
    {
      path: "turmas",
      icon: <FaChalkboardTeacher />,
      label: "Turmas",
      description: "Gerenciar turmas e aulas",
    },
    {
      path: "responsaveis",
      icon: <FaUsers />,
      label: "Responsáveis",
      description: "Gerenciar responsáveis pelos alunos",
    },
    {
      path: "pre-matricula",
      icon: <FaFileSignature />,
      label: "Pré-Matrícula",
      description: "Processo de pré-matrícula",
    },
    {
      path: "cadastrar-aluno",
      icon: <FaUserPlus />,
      label: "Cadastrar Aluno",
      description: "Cadastrar novos alunos",
    },
    {
      path: "cadastrar-turma",
      icon: <FaPlusCircle />,
      label: "Cadastrar Turma",
      description: "Criar novas turmas",
    },
    //{ path: "relatorios", icon: <FaFileAlt />, label: "Relatórios", description: "Visualizar relatórios do sistema" },
    {
      path: "configuracoes",
      icon: <FaCog />,
      label: "Configurações",
      description: "Configurações do sistema",
    },
  ];

  // Função para filtrar funcionalidades baseado no cargo
  const getFilteredFeatures = () => {
    if (!user) return allFeatures;

    // Rotas que professores NÃO devem ver
    const restrictedForProfessor = [
      "alunos",
      "pre-matricula",
      "cadastrar-aluno",
      "cadastrar-turma",
      "configuracoes",
    ];

    // Se for professor, filtra as rotas restritas
    if (user.cargo && user.cargo.toLowerCase() === "professor") {
      return allFeatures.filter(
        (feature) => !restrictedForProfessor.includes(feature.path)
      );
    }

    // Administrador Geral e outros cargos administrativos veem todas as funcionalidades
    return allFeatures;
  };

  const availableFeatures = getFilteredFeatures();

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
          {user.foto_perfil ? (
            <img
              src={`http://localhost:3001${user.foto_perfil}`}
              alt="Foto do Perfil"
              className="profile-photo"
            />
          ) : (
            <div className="profile-photo-placeholder">
              <span>{user.nome ? user.nome.charAt(0) : "?"}</span>
            </div>
          )}
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
          Selecione uma das funcionalidades abaixo para começar a navegar.
        </p>
        <p className="welcome-text">
          Este é o seu painel de controle central, onde você pode acessar
          rapidamente as principais funcionalidades do sistema.
        </p>
      </div>

      <div className="main-content-wrapper">
        <div className="features-section">
          <div className="features-grid">
            {availableFeatures.map((feature) => (
              <Link
                key={feature.path}
                to={feature.path}
                className="feature-card"
              >
                <div className="feature-icon">{feature.icon}</div>
                <div className="feature-content">
                  <h3 className="feature-title">{feature.label}</h3>
                  <p className="feature-description">{feature.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="profile-section">
          <UserProfileCard />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
