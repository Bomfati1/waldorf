import React from "react";

const HomePage = () => {
  return (
    <div
      style={{
        padding: "2rem",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      <h1 style={{ fontSize: "2.2rem", fontWeight: "600", color: "#343a40" }}>
        Painel de Controle
      </h1>
      <InteressadosDashboardPage isEmbedded={true} />
    </div>
  );
};

export default HomePage;
