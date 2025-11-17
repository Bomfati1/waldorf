import React, { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import {
  FaTachometerAlt,
  FaUserGraduate,
  FaUsers,
  FaChalkboardTeacher,
  FaFileSignature,
  FaPlusCircle,
  FaUserPlus,
  FaBook,
  FaCog,
  FaUserCog,
  FaFileAlt,
  FaCalendarCheck, // Ícone para Planejamentos
  FaBars, // Ícone do menu hambúrguer
  FaTimes, // Ícone de fechar
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import logoImage from "../img/bf-fundo-trasnparente-pequeno-YNqrBazK8rUMjRGQ.avif";

// Lista de itens de navegação
const navItems = [
  { path: "alunos", icon: <FaUserGraduate />, label: "Alunos" },
  { path: "planejamentos", icon: <FaCalendarCheck />, label: "Planejamentos" },
  {
    path: "planejamentos-iso",
    icon: <FaCalendarCheck />,
    label: "Planejamentos ISO",
    badge: "Novo",
  },
  { path: "turmas", icon: <FaChalkboardTeacher />, label: "Turmas" },
  { path: "responsaveis", icon: <FaUsers />, label: "Responsáveis" },
  { path: "pre-matricula", icon: <FaFileSignature />, label: "Pré-Matrícula" },
  { path: "cadastrar-aluno", icon: <FaUserPlus />, label: "Cadastrar Aluno" },
  { path: "cadastrar-turma", icon: <FaPlusCircle />, label: "Cadastrar Turma" },
];

const Sidebar = ({ isMenuOpen, onToggleMenu, onCloseMenu }) => {
  const { user } = useAuth();

  // Filtra os itens de navegação baseado no role do usuário
  const getFilteredNavItems = () => {
    if (!user) return navItems;

    // Rotas que professores NÃO devem ver
    const restrictedForProfessor = [
      "alunos",
      "pre-matricula",
      "cadastrar-aluno",
      "cadastrar-turma",
    ];

    // Se for professor, filtra as rotas restritas
    if (user.cargo && user.cargo.toLowerCase() === "professor") {
      return navItems.filter(
        (item) => !restrictedForProfessor.includes(item.path)
      );
    }

    // Para outros roles, retorna todos os itens
    return navItems;
  };

  const filteredNavItems = getFilteredNavItems();

  return (
    <>
      {/* Botão do menu hambúrguer */}
      <button
        className={`menu-toggle ${isMenuOpen ? "menu-open" : ""}`}
        onClick={onToggleMenu}
        aria-label="Abrir menu de navegação"
        title="Abrir menu"
      >
        <FaBars />
      </button>

      {/* Overlay para fechar o menu ao clicar fora */}
      {isMenuOpen && <div className="menu-overlay" onClick={onCloseMenu}></div>}

      {/* Menu suspenso */}
      <aside className={`sidebar ${isMenuOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-header">
          <Link
            to="/home"
            className="sidebar-header-link"
            onClick={onCloseMenu}
          >
            <img
              src={logoImage}
              alt="Portal Primavera Waldorf"
              className="sidebar-logo"
            />
          </Link>
          <button
            className="close-menu"
            onClick={onCloseMenu}
            aria-label="Fechar menu de navegação"
            title="Fechar menu"
          >
            <FaTimes />
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {filteredNavItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => (isActive ? "active" : "")}
                  onClick={onCloseMenu}
                  // 'end' é importante para a rota da dashboard não ficar sempre ativa
                  end={item.path === "/home"}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="badge-novo">{item.badge}</span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          {/* Configurações só aparecem para administradores */}
          {user && user.cargo && user.cargo.toLowerCase() !== "professor" && (
            <NavLink
              to="configuracoes"
              className={({ isActive }) => (isActive ? "active" : "")}
              onClick={onCloseMenu}
            >
              <FaCog /> <span>Configurações</span>
            </NavLink>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
