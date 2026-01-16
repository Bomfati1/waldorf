import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../css/App.css";
import "../css/Login.css";

const RecuperarSenhaPage = () => {
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [mensagemTipo, setMensagemTipo] = useState(null); // 'success' | 'error'

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:3001/recuperar-senha", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMensagem("Link de recuperação enviado para seu email!");
        setMensagemTipo("success");
      } else {
        setMensagem(
          data?.error || "Erro ao enviar email de recuperação. Tente novamente."
        );
        setMensagemTipo("error");
      }
    } catch (error) {
      setMensagem(
        "Erro ao conectar com o servidor. Tente novamente mais tarde."
      );
      setMensagemTipo("error");
    }
  };

  return (
    <div className="App">
      <div className="container">
        <form onSubmit={handleSubmit}>
          <h1>Recuperar senha</h1>

          {mensagem && (
            <p className={`status-message ${mensagemTipo || ""}`}>{mensagem}</p>
          )}

          <div className="input-field">
            <input
              type="email"
              placeholder="E-mail"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button type="submit">Enviar link de recuperação</button>

          <div className="signup-link">
            <p>
              Lembrou a senha? <Link to="/">Voltar ao login</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecuperarSenhaPage;
