import {api} from '../axios';
import {AuthResponse, LoginCredentials, SignupData, User} from '@/types/auth';
import {API_ENDPOINTS} from '../endpoints';
import {tokenService} from '@/lib/services/token.service';

export const authService = {
  login: async (credentials: LoginCredentials) => {
    const response = await api.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials);
    return response.data;
  },

  signup: async (data: SignupData) => {
    const response = await api.post<AuthResponse>(API_ENDPOINTS.AUTH.SIGNUP, data);
    return response.data;
  },

  logout: async () => {
    await api.post(API_ENDPOINTS.AUTH.LOGOUT);
    // Token removal is handled by the auth store
  },

  refreshToken: async () => {
    // Check if we should have a refresh token
    const hasRefreshToken = tokenService.getRefreshToken();


    // No need to send the refresh token in the request body
    // It will be automatically sent as an HttpOnly cookie
    const response = await api.post<AuthResponse>(API_ENDPOINTS.AUTH.REFRESH, {});

    return response.data;
  },

  updateProfile: async (data: Partial<User>) => {
    const response = await api.put<User>(API_ENDPOINTS.AUTH.PROFILE, data);
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    await api.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, { currentPassword, newPassword });
  },
};
