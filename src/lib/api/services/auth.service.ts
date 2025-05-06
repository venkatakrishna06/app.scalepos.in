import { api } from '../axios';
import { AuthResponse, LoginCredentials, SignupData } from '@/types/auth';

export const authService = {
  login: async (credentials: LoginCredentials) => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  signup: async (data: SignupData) => {
    const response = await api.post<AuthResponse>('/auth/signup', data);
    return response.data;
  },

  logout: async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
  },

  refreshToken: async () => {
    const response = await api.post<AuthResponse>('/auth/refresh');
    return response.data;
  },

  updateProfile: async (data: Partial<User>) => {
    const response = await api.put<User>('/auth/profile', data);
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    await api.put('/auth/password', { currentPassword, newPassword });
  },
};