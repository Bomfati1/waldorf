import React from "react";
import { NavLink } from "react-router-dom";
import "../css/DashboardLayout.css"; // Vamos usar o mesmo CSS
import {
  FaUserGraduate,
  FaUsers,
  FaPlusCircle,
  FaAddressBook,
  FaHome,
} from "react-icons/fa";
import { IoSettingsSharp } from "react-icons/io5";

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <NavLink to="/dashboard" className="sidebar-header-link">
          <h2>Primavera Waldorf</h2>
        </NavLink>
      </div>
      <nav className="sidebar-nav">
        <ul>
          <li>
            <NavLink to="/dashboard/pre-matricula">
              <FaAddressBook /> Pré-matrícula
            </NavLink>
          </li>
          <li>
            <NavLink to="/dashboard/alunos">
              <FaUserGraduate /> Alunos
            </NavLink>
          </li>
          <li>
            <NavLink to="/dashboard/turmas">
              <FaUsers /> Turmas
            </NavLink>
          </li>
          <li>
            <NavLink to="/dashboard/familias">
              <FaHome /> Famílias
            </NavLink>
          </li>
          <li>
            <NavLink to="/dashboard/cadastrar-turma">
              <FaPlusCircle /> Cadastrar Turma
            </NavLink>
          </li>
          <li>
            <NavLink to="/dashboard/cadastrar-aluno">
              <FaPlusCircle /> Cadastrar Aluno
            </NavLink>
          </li>
        </ul>
      </nav>
      <div className="sidebar-footer">
        <NavLink to="/dashboard/configuracoes">
          <IoSettingsSharp /> Configurações
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
