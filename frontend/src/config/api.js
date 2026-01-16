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

// Helper para obter headers com token
export const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

// Helper para fazer fetch com autenticação
export const fetchWithAuth = async (path, options = {}) => {
  const url = getApiUrl(path);
  const token = localStorage.getItem("token");
  
  // Não adiciona Content-Type se for FormData (o browser adiciona automaticamente com boundary)
  const isFormData = options.body instanceof FormData;
  
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const config = {
    ...options,
    headers,
    credentials: "include",
  };
  
  const response = await fetch(url, config);
  
  // Se retornar 401, redireciona para login
  if (response.status === 401 && !path.includes('/login')) {
    localStorage.removeItem("token");
    localStorage.removeItem("userInfo");
    window.location.href = "/login";
    throw new Error("Não autenticado");
  }
  
  return response;
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
