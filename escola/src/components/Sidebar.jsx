import React from "react";
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
} from "react-icons/fa";

// Lista de itens de navegação
const navItems = [
  { path: "alunos", icon: <FaUserGraduate />, label: "Alunos" },
  { path: "planejamentos", icon: <FaCalendarCheck />, label: "Planejamentos" },
  { path: "turmas", icon: <FaChalkboardTeacher />, label: "Turmas" },
  { path: "responsaveis", icon: <FaUsers />, label: "Responsáveis" },
  { path: "pre-matricula", icon: <FaFileSignature />, label: "Pré-Matrícula" },
  { path: "cadastrar-aluno", icon: <FaUserPlus />, label: "Cadastrar Aluno" },
  { path: "cadastrar-turma", icon: <FaPlusCircle />, label: "Cadastrar Turma" },
  { path: "relatorios", icon: <FaFileAlt />, label: "Relatórios" },
];

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <Link to="/home" className="sidebar-header-link">
        <div className="sidebar-header">
          <h2>Portal Primavera Waldorf</h2>
        </div>
      </Link>
      <nav className="sidebar-nav">
        <ul>
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => (isActive ? "active" : "")}
                // 'end' é importante para a rota da dashboard não ficar sempre ativa
                end={item.path === "/home"}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="sidebar-footer">
        <NavLink
          to="configuracoes"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          <FaCog /> <span>Configurações</span>
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
