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

function App() {
  return (
    <Routes>
      {/* Rota para a página de Login */}
      <Route path="/" element={<Login />} />

      {/* Rota para o Dashboard, que usa o DashboardLayout */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardHomePage />} />
        <Route path="alunos" element={<AlunosPage />} />
        <Route path="pre-matricula" element={<PreMatriculaPage />} />
        <Route path="turmas" element={<TurmasPage />} />
        <Route path="configuracoes" element={<ConfiguracoesPage />} />
      </Route>
    </Routes>
  );
}

export default App;
