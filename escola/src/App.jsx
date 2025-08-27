// src/App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import DashboardLayout from "./components/DashboardLayout";
import AlunosPage from "./pages/AlunosPage";
import ConfiguracoesPage from "./pages/ConfiguracoesPage";
import HomePage from "./pages/HomePage";
import PreMatriculaPage from "./pages/PreMatriculaPage";
import TurmasPage from "./pages/TurmasPage";
import InteressadosDashboardPage from "./pages/InteressadosDashboardPage"; // Importe o novo componente

function App() {
  return (
    <Routes>
      {/* Rota para a página de Login */}
      <Route path="/" element={<Login />} />

      {/* Rota para o Dashboard, que usa o DashboardLayout */}
      <Route path="/home" element={<DashboardLayout />}>
        <Route index element={<HomePage />} />
        <Route path="alunos" element={<AlunosPage />} />
        <Route path="pre-matricula" element={<PreMatriculaPage />} />
        <Route path="turmas" element={<TurmasPage />} />
        <Route
          path="interessados-dashboard"
          element={<InteressadosDashboardPage />}
        />{" "}
        {/* Nova rota */}
        <Route path="configuracoes" element={<ConfiguracoesPage />} />
      </Route>
    </Routes>
  );
}

export default App;
