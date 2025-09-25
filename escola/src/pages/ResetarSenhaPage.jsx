import React, { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import "../css/App.css";
import "../css/Login.css";

const ResetarSenhaPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [tipo, setTipo] = useState(null); // success | error

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem("");
    setTipo(null);

    if (!token) {
      setMensagem("Token inválido.");
      setTipo("error");
      return;
    }

    if (password.length < 6) {
      setMensagem("A senha deve ter pelo menos 6 caracteres.");
      setTipo("error");
      return;
    }
    if (password !== confirm) {
      setMensagem("As senhas não coincidem.");
      setTipo("error");
      return;
    }

    try {
      const resp = await fetch("http://localhost:3001/resetar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data?.error || "Não foi possível redefinir a senha.");
      }
      setMensagem("Senha redefinida com sucesso! Redirecionando...");
      setTipo("success");
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      setMensagem(err.message);
      setTipo("error");
    }
  };

  return (
    <div className="App">
      <div className="container">
        <form onSubmit={handleSubmit}>
          <h1>Definir nova senha</h1>

          {mensagem && (
            <p className={`status-message ${tipo || ""}`}>{mensagem}</p>
          )}

          <div className="input-field">
            <input
              type="password"
              placeholder="Nova senha"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="input-field">
            <input
              type="password"
              placeholder="Confirmar nova senha"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>

          <button type="submit">Salvar nova senha</button>

          <div className="signup-link">
            <p>
              Voltar ao <Link to="/">login</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetarSenhaPage;
