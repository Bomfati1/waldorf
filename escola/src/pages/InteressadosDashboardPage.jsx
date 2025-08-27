// src/pages/InteressadosDashboardPage.jsx
import React, { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const InteressadosDashboardPage = ({ isEmbedded = false }) => {
  const [dashboardData, setDashboardData] = useState({
    statusCounts: [],
    channelCounts: [],
    monthlyPerformance: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          "http://localhost:3001/interessados/dashboard-summary"
        );
        if (!response.ok) {
          throw new Error("Falha ao buscar dados do dashboard.");
        }
        const data = await response.json();
        setDashboardData(data); // A resposta agora é um objeto { statusCounts: [], channelCounts: [] }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const chartContainerStyle = {
    backgroundColor: "#ffffff",
    border: "1px solid #dee2e6",
    borderRadius: "8px",
    padding: "1.5rem",
    boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
  };

  const DashboardContent = () => {
    if (loading) return <p>Carregando dados do dashboard...</p>;
    if (error) return <p style={{ color: "red" }}>Erro: {error}</p>;
    if (!dashboardData) return <p>Nenhum dado encontrado.</p>;

    // Dados para o Gráfico de Pizza (Status)
    const statusPieData = {
      labels: dashboardData.statusCounts.map((item) => item.status),
      datasets: [
        {
          label: "Interessados",
          data: dashboardData.statusCounts.map((item) => item.count),
          backgroundColor: [
            "#17a2b8", // Entrou Em Contato
            "#007bff", // Conversando
            "#fd7e14", // Negociando
            "#ffc107", // Visita Agendada
            "#28a745", // Ganho
            "#dc3545", // Perdido
          ],
          borderColor: "#ffffff",
          borderWidth: 2,
        },
      ],
    };

    // Dados para o Gráfico de Barras (Canais)
    const channelBarData = {
      labels: dashboardData.channelCounts.map((item) => item.como_conheceu),
      datasets: [
        {
          label: "Quantidade por Canal",
          data: dashboardData.channelCounts.map((item) => item.count),
          backgroundColor: "rgba(0, 123, 255, 0.6)",
          borderColor: "rgba(0, 123, 255, 1)",
          borderWidth: 1,
        },
      ],
    };

    // Dados para o Gráfico de Barras (Desempenho Mensal)
    const monthlyPerformanceData = {
      labels: dashboardData.monthlyPerformance.map((item) => {
        const [year, month] = item.month.split("-");
        return new Date(year, month - 1).toLocaleString("pt-BR", {
          month: "short",
          year: "numeric",
        });
      }),
      datasets: [
        {
          label: "Ganhos",
          data: dashboardData.monthlyPerformance.map((item) =>
            parseInt(item.ganhos, 10)
          ),
          backgroundColor: "rgba(40, 167, 69, 0.7)",
          borderColor: "rgba(40, 167, 69, 1)",
          borderWidth: 1,
        },
        {
          label: "Perdidos",
          data: dashboardData.monthlyPerformance.map((item) =>
            parseInt(item.perdidos, 10)
          ),
          backgroundColor: "rgba(220, 53, 69, 0.7)",
          borderColor: "rgba(220, 53, 69, 1)",
          borderWidth: 1,
        },
      ],
    };

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: "1.5rem",
        }}
      >
        <div style={chartContainerStyle}>
          <h3 style={{ textAlign: "center", marginBottom: "1rem" }}>
            Distribuição por Status
          </h3>
          {dashboardData.statusCounts.length > 0 ? (
            <Pie
              data={statusPieData}
              options={{ responsive: true, maintainAspectRatio: true }}
            />
          ) : (
            <p>Sem dados de status.</p>
          )}
        </div>

        <div style={chartContainerStyle}>
          <h3 style={{ textAlign: "center", marginBottom: "1rem" }}>
            Canais de Aquisição
          </h3>
          {dashboardData.channelCounts.length > 0 ? (
            <Bar data={channelBarData} options={{ responsive: true }} />
          ) : (
            <p>Sem dados de canais.</p>
          )}
        </div>

        <div style={{ ...chartContainerStyle, gridColumn: "1 / -1" }}>
          <h3 style={{ textAlign: "center", marginBottom: "1rem" }}>
            Evolução Mensal (Ganhos e Perdidos)
          </h3>
          {dashboardData.monthlyPerformance.length > 0 ? (
            <Bar data={monthlyPerformanceData} options={{ responsive: true }} />
          ) : (
            <p>Sem dados de desempenho mensal para exibir.</p>
          )}
        </div>
      </div>
    );
  };

  if (isEmbedded) {
    return <DashboardContent />;
  }

  return (
    <div
      style={{
        padding: "2rem",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      <h1 style={{ marginBottom: "1.5rem", fontSize: "2rem" }}>
        Dashboard de Pré-matrículas
      </h1>
      <DashboardContent />
    </div>
  );
};

export default InteressadosDashboardPage;
