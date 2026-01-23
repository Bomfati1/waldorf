import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import Notificacoes from "./Notificacoes";
import { useAuth } from "../context/AuthContext"; // Importar o hook de autenticação
import { API_URL } from "../config/api";
import { getImageUrl } from "../utils/firebaseUpload";
import "../css/DashboardLayout.css"; // Importa como módulo
import { NavLink } from "react-router-dom";

const DashboardLayout = () => {
  const { user, logout } = useAuth(); // Obter o usuário e a função de logout do contexto
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userImageUrl, setUserImageUrl] = useState(null);

  const handleLogout = () => {
    // Chama a função de logout do contexto para limpar os dados do usuário
    logout();
    // Não precisa de navigate aqui pois o logout já faz window.location.replace
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const loadUserImageUrl = async () => {
      if (user?.foto_perfil) {
        try {
          const url = await getImageUrl(user.foto_perfil);
          setUserImageUrl(url);
        } catch (error) {
          console.error("Erro ao carregar imagem do usuário:", error);
          setUserImageUrl(null);
        }
      } else {
        setUserImageUrl(null);
      }
    };

    loadUserImageUrl();
  }, [user]);

  return (
    <div className="dashboard-container">
      <Sidebar
        isMenuOpen={isMenuOpen}
        onToggleMenu={toggleMenu}
        onCloseMenu={closeMenu}
      />
      <main className={`main-content ${isMenuOpen ? "sidebar-open" : ""}`}>
        <header className="top-header">
          <div className="user-info">
            {/* Notificações - apenas para administradores */}
            {user && user.cargo && user.cargo.toLowerCase() !== "professor" && (
              <Notificacoes />
            )}

            <Link
              to="/home/perfil"
              className="profile-link"
              title={`${user?.nome || "Usuário"} - ${user?.cargo || ""}`}
            >
              <div className="profile-pic">
                {user?.foto_perfil ? (
                  <img
                    src={userImageUrl || `${API_URL}${user.foto_perfil}`}
                    alt="Foto de perfil"
                    className="profile-image"
                  />
                ) : (
                  <div className="profile-placeholder">
                    {user?.nome ? user.nome.charAt(0).toUpperCase() : "U"}
                  </div>
                )}
              </div>
            </Link>

            <button
              className="logout-button"
              onClick={handleLogout}
              title="Sair do sistema"
            >
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
