import axios from 'axios';

// Configuração da API
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Helper para construir URLs de API
export const getApiUrl = (path) => {
  return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

// Instância do axios com configurações padrão
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Interceptor para adicionar token do localStorage em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
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
