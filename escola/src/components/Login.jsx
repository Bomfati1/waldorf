import React, { useState, useEffect } from "react";
import { FaUser, FaLock } from "react-icons/fa";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Importar o hook useAuth
import "../css/Login.css";
import "../css/App.css";

const Login = () => {
  // Alterado de 'username' para 'email' para corresponder ao backend
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Novo estado para armazenar e exibir mensagens de erro
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth(); // Obter a função de login do contexto

  const navigate = useNavigate();

  // Efeito para verificar se o usuário já está logado via cookie
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch("http://localhost:3001/auth/me", {
          credentials: "include",
        });

        if (response.ok) {
          const userData = await response.json();
          // Usuário já está logado, redirecionar para o dashboard
          login(userData);
          navigate("/home");
        }
      } catch (error) {
        // Usuário não está logado, continuar na página de login
        console.log("Usuário não autenticado");
      }
    };

    checkAuthStatus();
  }, [login, navigate]);

  // A função de submit foi reescrita para ser assíncrona e se comunicar com a API
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(""); // Limpa erros anteriores a cada nova tentativa

    try {
      // Faz a requisição POST para o endpoint de login do nosso backend
      const response = await fetch("http://localhost:3001/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Importante para cookies
        // Envia o email, senha e rememberMe no corpo da requisição
        body: JSON.stringify({
          email: email,
          password: password,
          rememberMe: rememberMe,
        }),
      });

      // Converte a resposta do backend para JSON
      const data = await response.json();

      // Se a resposta NÃO for OK (status diferente de 200), algo deu errado
      if (!response.ok) {
        // Lança um erro com a mensagem que veio do backend (ex: "Credenciais inválidas.")
        throw new Error(data.error || "Erro ao tentar fazer login.");
      }

      // Se o login for bem-sucedido:
      console.log("Login realizado com sucesso!", data);

      // Salva os dados do usuário no contexto e no localStorage
      login({
        userId: data.userId,
        nome: data.nome,
        cargo: data.cargo,
        email: email, // O email vem do estado do formulário
      });

      // O "Lembre de mim" agora é gerenciado pelo backend via cookies JWT
      // Não é mais necessário salvar dados no localStorage

      // Navega para o dashboard
      navigate("/home");
    } catch (err) {
      // Captura qualquer erro (de rede ou da lógica acima) e o exibe para o usuário
      console.error("Erro no login:", err.message);
      setError(err.message);
    }
  };

  return (
    <div className="App">
      <div className="container">
        <form onSubmit={handleSubmit}>
          <h1>Acesse o sistema</h1>

          {/* Bloco para exibir a mensagem de erro, se houver */}
          {error && <p className="error-message">{error}</p>}

          <div className="input-field">
            <div className="icon-container">
              <FaUser className="icon" />
            </div>
            <input
              type="email"
              placeholder="E-mail"
              required // Boa prática adicionar validação de campo obrigatório
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="input-field">
            <div className="icon-container">
              <FaLock className="icon" />
            </div>
            <input
              type="password"
              placeholder="Senha"
              required
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="recall-forget">
            <label>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Lembre de mim
            </label>
            <Link to="/recuperar-senha">Esqueceu a senha?</Link>
          </div>

          <button type="submit">Entrar</button>
        </form>
      </div>
    </div>
  );
};

// Adicione este estilo ao seu Login.css para a mensagem de erro
/*
.error-message {
  color: #ff4d4d;
  background-color: #ffdddd;
  border: 1px solid #ff4d4d;
  padding: 10px;
  border-radius: 5px;
  text-align: center;
  margin-bottom: 15px;
}
*/

export default Login;
