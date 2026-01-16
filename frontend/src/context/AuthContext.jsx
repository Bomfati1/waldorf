import React, { createContext, useState, useEffect, useContext } from "react";
import { getApiUrl, fetchWithAuth } from '../config/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Ao iniciar a aplicação, verifica se há dados do usuário no localStorage
  // e também verifica se há um token válido no backend
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Primeiro verifica se há dados no localStorage
        const storedUserInfo = localStorage.getItem("userInfo");
        const token = localStorage.getItem("token");
        
        if (storedUserInfo) {
          setUser(JSON.parse(storedUserInfo));
        }

        // Só verifica no backend se houver token
        if (token) {
          // Depois verifica se o token no backend ainda é válido
          const response = await fetchWithAuth('/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            credentials: "include",
          });

          if (response.ok) {
            const userData = await response.json();
            console.log(
              "[AuthContext] Dados do usuário carregados do backend:",
              userData
            );
            // Atualiza os dados do usuário com informações do backend
            setUser(userData);
            localStorage.setItem("userInfo", JSON.stringify(userData));
          } else {
            // Token inválido, limpa os dados
            localStorage.removeItem("userInfo");
            localStorage.removeItem("token");
            setUser(null);
          }
        } else {
          // Sem token, usuário não autenticado
          console.log("Usuário não autenticado");
        }
      } catch (error) {
        // Erro na verificação, mantém os dados do localStorage se existirem
        console.log("Erro ao verificar autenticação:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Função para fazer login: salva no estado e no localStorage
  const login = (userData) => {
    localStorage.setItem("userInfo", JSON.stringify(userData));
    setUser(userData);
  };

  // Função para fazer logout: limpa o estado, localStorage e chama o backend
  const logout = async () => {
    try {
      const token = localStorage.getItem("token");
      // Chama o backend para limpar o cookie
      await fetchWithAuth('/logout', {
        method: "POST",
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: "include",
      });
    } catch (error) {
      console.error("Erro ao fazer logout no backend:", error);
    } finally {
      // Sempre limpa o estado local
      localStorage.removeItem("userInfo");
      localStorage.removeItem("token");
      sessionStorage.clear(); // Limpa todo sessionStorage
      setUser(null);

      // Substitui a entrada atual do histórico pela página de login
      // Isso impede que o botão voltar retorne para páginas autenticadas
      window.location.replace("/");
    }
  };

  // Função para atualizar dados do usuário
  const updateUser = (updatedUserData) => {
    const newUserData = { ...user, ...updatedUserData };
    setUser(newUserData);
    localStorage.setItem("userInfo", JSON.stringify(newUserData));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook customizado para facilitar o uso do contexto
export const useAuth = () => useContext(AuthContext);
