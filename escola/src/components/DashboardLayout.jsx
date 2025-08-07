import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import "../css/DashboardLayout.css"; // Importa como módulo

const DashboardLayout = () => {
  const userName = "Matheus"; // No futuro, este nome virá do estado de login
  const navigate = useNavigate();

  const handleLogout = () => {
    // Em uma aplicação real, você também limparia o estado de autenticação (tokens, etc.)
    console.log("Usuário deslogado.");
    navigate("/"); // Redireciona para a página de login
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <header className="top-header">
          <div className="user-info">
            <span>Olá, {userName}</span>
            <div className="profile-pic"></div>
            <button className="logout-button" onClick={handleLogout}>
              Sair
            </button>
          </div>
        </header>
        <div className="page-content">
          {/* O Outlet renderiza o componente da rota ativa aqui */}
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
