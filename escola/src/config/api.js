// Configuração da API
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Helper para construir URLs de API
export const getApiUrl = (path) => {
  return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
};
