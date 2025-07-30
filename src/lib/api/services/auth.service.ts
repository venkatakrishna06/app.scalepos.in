import { api } from '../axios';
import { AuthResponse, LoginCredentials, SignupData, User } from '@/types/auth';
import { API_ENDPOINTS } from '../endpoints';
import logger from '@/lib/services/logger.service';

export const authService = {
    login: async (credentials: LoginCredentials) => {
        try {
            const response = await api.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    signup: async (data: SignupData) => {
        try {
            const response = await api.post<AuthResponse>(API_ENDPOINTS.AUTH.SIGNUP, data);

            return response.data;
        } catch (error) {

            throw error;
        }
    },

    logout: async () => {
        try {
            await api.post(API_ENDPOINTS.AUTH.LOGOUT);
            } catch (error) {
            throw error;
        }
    },

    refreshToken: async (refreshToken: string) => {
        try {
            const response = await api.post<AuthResponse>(API_ENDPOINTS.AUTH.REFRESH, { refreshToken });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    updateProfile: async (data: Partial<User>) => {
        try {
            const response = await api.put<User>(API_ENDPOINTS.AUTH.PROFILE, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    changePassword: async (currentPassword: string, newPassword: string) => {
        try {
            await api.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, { currentPassword, newPassword });
            } catch (error) {
            throw error;
        }
    },
};
