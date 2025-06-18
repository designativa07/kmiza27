import axios from 'axios';
import { LoginCredentials, LoginResponse, User, UserStats, CreateAdminData } from '@/types/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.kmiza27.com';

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

export const authService = {
  // Autenticação
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  async verifyToken(token: string): Promise<{ valid: boolean; user?: any }> {
    try {
      const response = await api.post('/auth/verify', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return { valid: false };
    }
  },

  async createAdmin(adminData: CreateAdminData): Promise<{ success: boolean; message: string; user?: User }> {
    const response = await api.post('/auth/create-admin', adminData);
    return response.data;
  },

  // Usuários
  async getAllUsers(): Promise<User[]> {
    const response = await api.get('/users');
    return response.data;
  },

  async getAdminUsers(): Promise<User[]> {
    const response = await api.get('/users/admins');
    return response.data;
  },

  async getUserStats(): Promise<UserStats> {
    const response = await api.get('/users/stats');
    return response.data;
  },

  async promoteToAdmin(userId: number): Promise<{ success: boolean; message: string }> {
    const response = await api.patch(`/users/${userId}/promote-admin`);
    return response.data;
  },

  async demoteFromAdmin(userId: number): Promise<{ success: boolean; message: string }> {
    const response = await api.patch(`/users/${userId}/demote-admin`);
    return response.data;
  },

  async deleteUser(userId: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  },

  async updateAdmin(userId: number, adminData: Partial<CreateAdminData>): Promise<{ success: boolean; message: string; user?: User }> {
    const response = await api.put(`/users/${userId}`, adminData);
    return response.data;
  },
};

export default authService; 