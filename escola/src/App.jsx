// src/App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import DashboardLayout from "./components/DashboardLayout";
import AlunosPage from "./pages/AlunosPage";
import ConfiguracoesPage from "./pages/ConfiguracoesPage";
import DashboardHomePage from "./pages/DashboardHomePage";
import PreMatriculaPage from "./pages/PreMatriculaPage";
import TurmasPage from "./pages/TurmasPage";
import InteressadosDashboardPage from "./pages/InteressadosDashboardPage";
import PlanejamentosPage from "./pages/PlanejamentosPage";
import ResponsaveisPage from "./pages/ResponsaveisPage";
import CadastrarAlunoPage from "./pages/CadastrarAlunoPage";
import CadastrarTurmaPage from "./pages/CadastrarTurmaPage";
import RelatoriosPage from "./pages/RelatoriosPage";
import PerfilPage from "./pages/PerfilPage";
import EditarResponsavelPage from "./pages/EditarResponsavelPage";

function App() {
  return (
    <Routes>
      {/* Rota para a página de Login */}
      <Route path="/" element={<Login />} />

      {/* Rota para o Dashboard, que usa o DashboardLayout */}
      <Route path="/home" element={<DashboardLayout />}>
        <Route index element={<DashboardHomePage />} />
        <Route path="alunos" element={<AlunosPage />} />
        <Route path="planejamentos" element={<PlanejamentosPage />} />
        <Route path="turmas" element={<TurmasPage />} />
        <Route path="responsaveis" element={<ResponsaveisPage />} />
        <Route
          path="responsaveis/:id/editar"
          element={<EditarResponsavelPage />}
        />
        <Route path="pre-matricula" element={<PreMatriculaPage />} />
        <Route path="cadastrar-aluno" element={<CadastrarAlunoPage />} />
        <Route path="cadastrar-turma" element={<CadastrarTurmaPage />} />
        {/* <Route path="relatorios" element={<RelatoriosPage />} /> */}
        <Route path="perfil" element={<PerfilPage />} />
        <Route path="configuracoes" element={<ConfiguracoesPage />} />
        <Route
          path="interessados-dashboard"
          element={<InteressadosDashboardPage />}
        />
      </Route>
    </Routes>
  );
}

export default App;
