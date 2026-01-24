import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getApiUrl } from "../config/api";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage("As senhas não coincidem.");
      return;
    }
    if (newPassword.length < 6) {
      setMessage("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(getApiUrl("/resetar-senha"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: newPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(
          "Senha redefinida com sucesso! Redirecionando para login...",
        );
        setTimeout(() => navigate("/"), 2000);
      } else {
        setMessage(data.error || "Erro ao redefinir senha.");
      }
    } catch (error) {
      setMessage("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Link Inválido</h2>
        <p>O link de reset de senha é inválido ou expirou.</p>
        <button onClick={() => navigate("/")}>Voltar ao Login</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "0 auto" }}>
      <h2>Redefinir Senha</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "10px" }}>
          <label>Nova Senha:</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            style={{ width: "100%", padding: "8px" }}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>Confirmar Nova Senha:</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={{ width: "100%", padding: "8px" }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
          }}
        >
          {loading ? "Redefinindo..." : "Redefinir Senha"}
        </button>
      </form>
      {message && (
        <p
          style={{
            marginTop: "10px",
            color: message.includes("sucesso") ? "green" : "red",
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}

export default ResetPassword;
