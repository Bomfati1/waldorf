import React, { useState, useEffect } from "react";
import { FaUser, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Importar o hook useAuth
import "../css/Login.css";
import "../css/App.css";

const Login = () => {
  // Alterado de 'username' para 'email' para corresponder ao backend
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Novo estado para armazenar e exibir mensagens de erro
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth(); // Obter a função de login do contexto

  const navigate = useNavigate();

  // Efeito para carregar os dados salvos do localStorage quando o componente montar
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    // AVISO: Salvar senhas no localStorage não é seguro em produção.
    const rememberedPassword = localStorage.getItem("rememberedPassword");

    if (rememberedEmail && rememberedPassword) {
      setEmail(rememberedEmail);
      setPassword(rememberedPassword);
      setRememberMe(true);
    }
  }, []); // O array vazio garante que isso rode apenas uma vez

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
        // Envia o email e a senha no corpo da requisição
        body: JSON.stringify({ email: email, password: password }),
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

      // Lógica para "Lembre de mim"
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
        // AVISO: Prática insegura para produção!
        localStorage.setItem("rememberedPassword", password);
      } else {
        localStorage.removeItem("rememberedEmail");
        localStorage.removeItem("rememberedPassword");
      }

      // Navega para o dashboard
      navigate("/home");
    } catch (err) {
      // Captura qualquer erro (de rede ou da lógica acima) e o exibe para o usuário
      console.error("Erro no login:", err.message);
      setError(err.message);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="App">
      <div className="container">
        <form onSubmit={handleSubmit}>
          <h1>Acesse o sistema</h1>

          {/* Bloco para exibir a mensagem de erro, se houver */}
          {error && <p className="error-message">{error}</p>}

          <div className="input-field">
            <input
              type="email"
              placeholder="E-mail"
              required // Boa prática adicionar validação de campo obrigatório
              onChange={(e) => setEmail(e.target.value)}
            />
            <FaUser className="icon" />
          </div>
          <div className="password-wrapper">
            <div className="input-field">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Senha"
                required
                onChange={(e) => setPassword(e.target.value)}
              />
              <FaLock className="icon" />
            </div>
            <span
              onClick={togglePasswordVisibility}
              className="password-toggle-icon"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
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
            <a href="#">Esqueceu a senha?</a>
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
