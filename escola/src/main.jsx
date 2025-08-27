import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext"; // 1. Importar o AuthProvider

// Importando os componentes de página e layout
import Login from "./components/Login";
import DashboardLayout from "./components/DashboardLayout";
import DashboardHomePage from "./pages/DashboardHomePage";
import AlunosPage from "./pages/AlunosPage";
import PreMatriculaPage from "./pages/PreMatriculaPage";
import TurmasPage from "./pages/TurmasPage";
import PresencaPage from "./pages/PresencaPage";
import HistoricoPresencaPage from "./pages/HistoricoPresencaPage";
import ConfiguracoesPage from "./pages/ConfiguracoesPage";
import PerfilPage from "./pages/PerfilPage";
import FamiliasPage from "./pages/FamiliasPage";
import CadastrarTurmaPage from "./pages/CadastrarTurmaPage";
import CadastrarAlunoPage from "./pages/CadastrarAlunoPage";
import PlanejamentosPage from "./pages/PlanejamentosPage";
import ResponsaveisPage from "./pages/ResponsaveisPage";
import RelatoriosPage from "./pages/RelatoriosPage";
import InteressadosDashboardPage from "./pages/InteressadosDashboardPage"; // Importe o novo componente
import EditarResponsavelPage from "./pages/EditarResponsavelPage";

// Definindo as rotas usando a API moderna do React Router
const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/home",
    element: <DashboardLayout />,
    children: [
      {
        index: true,
        element: <DashboardHomePage />,
      },
      {
        path: "alunos",
        element: <AlunosPage />,
      },
      {
        path: "pre-matricula",
        element: <PreMatriculaPage />,
      },
      {
        path: "turmas",
        element: <TurmasPage />,
      },
      {
        path: "turmas/:turmaId/presenca",
        element: <PresencaPage />,
      },
      {
        path: "turmas/:turmaId/historico-presenca",
        element: <HistoricoPresencaPage />,
      },
      {
        path: "configuracoes",
        element: <ConfiguracoesPage />,
      },
      {
        path: "perfil",
        element: <PerfilPage />,
      },
      {
        path: "familias",
        element: <FamiliasPage />,
      },
      {
        path: "responsaveis",
        element: <ResponsaveisPage />,
      },
      {
        path: "responsaveis/:id/editar",
        element: <EditarResponsavelPage />,
      },
      {
        path: "planejamentos",
        element: <PlanejamentosPage />,
      },
      {
        path: "relatorios",
        element: <RelatoriosPage />,
      },
      {
        path: "interessados-dashboard", // Nova rota para o dashboard
        element: <InteressadosDashboardPage />,
      },
      {
        path: "cadastrar-turma",
        element: <CadastrarTurmaPage />,
      },
      {
        path: "cadastrar-aluno",
        element: <CadastrarAlunoPage />,
      },
      {
        path: "alunos/:alunoId/editar",
        element: <CadastrarAlunoPage />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* 2. Envolver a aplicação com o AuthProvider */}
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
