import { api } from '../axios';
import { AuthResponse, LoginCredentials, SignupData, User } from '@/types/auth';
import { API_ENDPOINTS } from '../endpoints';

export const authService = {
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        try {
            debugger
            const response = await api.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    signup: async (data: SignupData): Promise<AuthResponse> => {
        try {
            const response = await api.post<AuthResponse>(API_ENDPOINTS.AUTH.SIGNUP, data);
            return response.data;
        } catch (error) {

            throw error;
        }
    },

    logout: async (): Promise<void> => {
        try {

            await api.post(API_ENDPOINTS.AUTH.LOGOUT);
        } catch (error) {

            // Don't throw, allow logout to proceed on the client
        }
    },

    refreshToken: async (): Promise<AuthResponse> => {
        try {

            // The refresh token is sent as an HttpOnly cookie, so no payload is needed.
            const response = await api.post<AuthResponse>(API_ENDPOINTS.AUTH.REFRESH, {});

            return response.data;
        } catch (error) {

            throw error;
        }
    },

    updateProfile: async (data: Partial<User>): Promise<User> => {
        try {

            const response = await api.put<User>(API_ENDPOINTS.AUTH.PROFILE, data);

            return response.data;
        } catch (error) {

            throw error;
        }
    },

    changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
        try {

            await api.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, { currentPassword, newPassword });

        } catch (error) {

            throw error;
        }
    },
};
