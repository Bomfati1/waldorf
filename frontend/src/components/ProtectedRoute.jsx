import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Previne navegação via botão "voltar" após logout
  useEffect(() => {
    // Função que bloqueia navegação de volta
    const preventBack = () => {
      window.history.pushState(null, "", window.location.href);
    };

    // Adiciona evento para detectar navegação via histórico
    const handlePopState = () => {
      // Se não há usuário autenticado, redireciona para login
      if (!user) {
        window.location.replace("/");
      } else {
        // Se está autenticado, bloqueia navegação de volta
        preventBack();
      }
    };

    // Escuta mudanças no histórico (botão voltar/avançar)
    window.addEventListener("popstate", handlePopState);

    // Previne cache de páginas autenticadas
    window.addEventListener("pageshow", (event) => {
      // Se a página foi carregada do cache e não há usuário, redireciona
      if (event.persisted && !user) {
        window.location.replace("/");
      }
    });

    // Bloqueia navegação de volta na primeira renderização
    if (user) {
      preventBack();
    }

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [user]);

  // Enquanto verifica autenticação, mostra loading
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "1.2rem",
          color: "#555",
        }}
      >
        Verificando autenticação...
      </div>
    );
  }

  // Se não há usuário autenticado, redireciona para 404
  if (!user) {
    // Se está tentando acessar uma rota protegida sem autenticação
    return <Navigate to="/404" replace />;
  }

  // Se há usuário autenticado, renderiza o conteúdo
  return children;
};

export default ProtectedRoute;
