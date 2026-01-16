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
  const [selectedYear, setSelectedYear] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          "http://localhost:3001/interessados/dashboard-summary",
          {
            credentials: "include",
          }
        );
        if (!response.ok) {
          throw new Error("Falha ao buscar dados do dashboard.");
        }
        const data = await response.json();
        setDashboardData(data); // A resposta agora é um objeto { statusCounts: [], channelCounts: [], monthlyPerformance: [] }
        // Define ano padrão (último ano disponível nos dados de monthlyPerformance)
        const years = Array.from(
          new Set(
            (data.monthlyPerformance || []).map((item) =>
              String(item.month).split("-")[0]
            )
          )
        ).sort();
        if (years.length > 0) {
          setSelectedYear(years[years.length - 1]);
        }
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

    // Filtro por ano para desempenho mensal
    const filteredMonthly = (dashboardData.monthlyPerformance || []).filter(
      (item) =>
        !selectedYear || String(item.month).startsWith(String(selectedYear))
    );

    // Dados para o Gráfico de Barras (Desempenho Mensal)
    const monthlyPerformanceData = {
      labels: filteredMonthly.map((item) => {
        const [year, month] = item.month.split("-");
        return new Date(year, month - 1).toLocaleString("pt-BR", {
          month: "short",
          year: "numeric",
        });
      }),
      datasets: [
        {
          label: "Ganhos",
          data: filteredMonthly.map((item) =>
            parseInt(item.ganhos, 10)
          ),
          backgroundColor: "rgba(40, 167, 69, 0.7)",
          borderColor: "rgba(40, 167, 69, 1)",
          borderWidth: 1,
        },
        {
          label: "Perdidos",
          data: filteredMonthly.map((item) =>
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
          gridTemplateColumns: "1fr",
          gap: "1.5rem",
        }}
      >
        <div style={{ ...chartContainerStyle }}>
          <h3 style={{ textAlign: "center", marginBottom: "1rem" }}>
            Canais de Aquisição
          </h3>
          {dashboardData.channelCounts.length > 0 ? (
            <div style={{ height: isEmbedded ? 420 : 520 }}>
              <Bar
                data={channelBarData}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          ) : (
            <p>Sem dados de canais.</p>
          )}
        </div>

        <div style={{ ...chartContainerStyle }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ margin: 0 }}>Evolução Mensal (Ganhos e Perdidos)</h3>
            <div>
              <label htmlFor="yearSelect" style={{ marginRight: 8 }}>Ano:</label>
              <select
                id="yearSelect"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #ccc" }}
              >
                {Array.from(
                  new Set(
                    (dashboardData.monthlyPerformance || []).map((item) =>
                      String(item.month).split("-")[0]
                    )
                  )
                )
                  .sort()
                  .map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          {dashboardData.monthlyPerformance.length > 0 ? (
            <div style={{ height: isEmbedded ? 420 : 520 }}>
              <Bar
                data={monthlyPerformanceData}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
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
