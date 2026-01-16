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
  const token = localStorage.getItem("token");
  const url = getApiUrl(path);
  
  console.log("🔐 [fetchWithAuth] Endpoint:", path);
  console.log("🔐 [fetchWithAuth] Token presente:", !!token);
  console.log("🔐 [fetchWithAuth] URL completa:", url);
  
  // Detecta se é FormData
  const isFormData = options.body instanceof FormData;
  
  // Cria headers usando Headers API para garantir que funcionem
  const headers = new Headers();
  
  // Adiciona Content-Type apenas se não for FormData
  if (!isFormData) {
    headers.set("Content-Type", "application/json");
  }
  
  // Adiciona headers customizados passados nas options
  if (options.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      headers.set(key, value);
    });
  }
  
  // FORÇA adicionar o token se existir
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
    console.log("✅ [fetchWithAuth] Header Authorization adicionado:", `Bearer ${token.substring(0, 20)}...`);
  } else {
    console.warn("⚠️ [fetchWithAuth] Nenhum token encontrado no localStorage!");
  }
  
  console.log("📡 [fetchWithAuth] Headers finais:", Array.from(headers.entries()));
  
  const config = {
    ...options,
    headers,
    credentials: "include",
  };
  
  console.log("🚀 [fetchWithAuth] Fazendo requisição...");
  const response = await fetch(url, config);
  console.log("📥 [fetchWithAuth] Response status:", response.status);
  
  // Se retornar 401, redireciona para login
  if (response.status === 401 && !path.includes('/login')) {
    console.log("❌ [fetchWithAuth] 401 Unauthorized - Limpando token e redirecionando");
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
