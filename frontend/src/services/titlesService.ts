import axios from 'axios';
import { API_ENDPOINTS } from '@/config/api';

// Usar a mesma lógica de configuração da API
const getApiUrl = (): string => {
  // Para desenvolvimento local, usar a API local
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3000';
  }
  
  // Para desenvolvimento sem window (Node.js), usar localhost
  if (typeof window === 'undefined') {
    return 'http://localhost:3000';
  }
  
  // Usar sempre a URL de produção (VPS) - SEM /api prefix
  return 'https://api.kmiza27.com';
};

const API_BASE_URL = getApiUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token automaticamente
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const titlesService = {
  // Buscar todos os títulos
  async getAllTitles(params?: string): Promise<any> {
    const url = params ? `${API_ENDPOINTS.titles.list()}?${params}` : API_ENDPOINTS.titles.list();
    const response = await api.get(url);
    return response.data;
  },

  // Buscar título por ID
  async getTitleById(id: number): Promise<any> {
    const response = await api.get(API_ENDPOINTS.titles.byId(id));
    return response.data;
  },

  // Criar novo título
  async createTitle(titleData: any): Promise<any> {
    const response = await api.post(API_ENDPOINTS.titles.list(), titleData);
    return response.data;
  },

  // Atualizar título
  async updateTitle(id: number, titleData: any): Promise<any> {
    const response = await api.put(API_ENDPOINTS.titles.byId(id), titleData);
    return response.data;
  },

  // Deletar título
  async deleteTitle(id: number): Promise<any> {
    const response = await api.delete(API_ENDPOINTS.titles.byId(id));
    return response.data;
  },

  // Upload de imagem
  async uploadImage(titleId: number, imageFile: File): Promise<any> {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await api.post(API_ENDPOINTS.titles.uploadImage(titleId), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default titlesService; 