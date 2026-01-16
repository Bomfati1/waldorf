import React from "react";
import { useNavigate } from "react-router-dom";

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        padding: "20px",
      }}
    >
      <div
        style={{
          textAlign: "center",
          backgroundColor: "white",
          padding: "60px 40px",
          borderRadius: "12px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          maxWidth: "500px",
          width: "100%",
        }}
      >
        <h1
          style={{
            fontSize: "120px",
            margin: "0",
            color: "#dc3545",
            fontWeight: "bold",
          }}
        >
          404
        </h1>
        <h2
          style={{
            fontSize: "28px",
            margin: "20px 0",
            color: "#333",
            fontWeight: "600",
          }}
        >
          Página Não Encontrada
        </h2>
        <p
          style={{
            fontSize: "16px",
            color: "#666",
            marginBottom: "30px",
            lineHeight: "1.6",
          }}
        >
          A página que você está tentando acessar não existe ou você não tem
          permissão para visualizá-la.
        </p>
        <button
          onClick={() => navigate("/")}
          style={{
            padding: "12px 30px",
            fontSize: "16px",
            fontWeight: "500",
            color: "white",
            backgroundColor: "#007bff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#0056b3";
            e.target.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "#007bff";
            e.target.style.transform = "translateY(0)";
          }}
        >
          Ir para o Login
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;
