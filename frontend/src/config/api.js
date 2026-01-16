import axios from "axios";

// Configuração da API
// Remove trailing slash se existir
const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
export const API_URL = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

// Helper para construir URLs de API
export const getApiUrl = (path) => {
  // Garante que o path começa com / mas não duplica
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_URL}${normalizedPath}`;
};

// Instância do axios com configurações padrão
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Interceptor para adicionar token do localStorage em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
