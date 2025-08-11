import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

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

// Definindo as rotas usando a API moderna do React Router
const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/dashboard",
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
        path: "cadastrar-turma",
        element: <CadastrarTurmaPage />,
      },
      {
        path: "cadastrar-aluno",
        element: <CadastrarAlunoPage />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
