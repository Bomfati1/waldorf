import React from "react";
import { FaUser, FaLock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "../css/Login.css";
import "../css/App.css";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();

    // No futuro, aqui você colocaria a lógica de autenticação real.
    // Por enquanto, vamos apenas navegar para o dashboard.
    console.log("Enviando os dados:" + username + " - " + password);
    navigate("/dashboard");
  };

  return (
    <div className="App">
      <div className="container">
        <form onSubmit={handleSubmit}>
          <h1>Acesse o sistema</h1>

          <div className="input-field">
            <input
              type="email"
              placeholder="E-mail"
              onChange={(e) => setUsername(e.target.value)}
            />
            <FaUser className="icon" />
          </div>
          <div className="input-field">
            <input
              type="password"
              placeholder="Senha"
              onChange={(e) => setPassword(e.target.value)}
            />
            <FaLock className="icon" />
          </div>

          <div className="recall-forget">
            <label>
              <input type="checkbox" />
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

export default Login;
