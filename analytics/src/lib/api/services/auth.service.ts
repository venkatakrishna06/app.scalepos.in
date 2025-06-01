import { api } from '../axios';
import { API_ENDPOINTS } from '../endpoints';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user_account: {
    id: number;
    email: string;
    name: string;
    role: string;
    staff_id?: number;
  };
  token: string;
  refreshToken?: string;
}

export const authService = {
  login: async (credentials: LoginCredentials) => {
    const response = await api.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials);
    return response.data;
  },

  logout: async () => {
    await api.post(API_ENDPOINTS.AUTH.LOGOUT);
  },

  getProfile: async () => {
    const response = await api.get(API_ENDPOINTS.AUTH.PROFILE);
    return response.data;
  }
};