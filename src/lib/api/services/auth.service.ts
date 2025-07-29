import { api } from '../axios';
import { AuthResponse, LoginCredentials, SignupData, User } from '@/types/auth';
import { API_ENDPOINTS } from '../endpoints';
import { tokenService } from '@/lib/services/token.service';
import logger from '@/lib/services/logger.service';

export const authService = {
    login: async (credentials: LoginCredentials) => {
        try {
            logger.info('Attempting to log in user.');
            const response = await api.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials);
            logger.info('User logged in successfully.');
            return response.data;
        } catch (error) {
            logger.error('Login failed:', { error });
            throw error;
        }
    },

    signup: async (data: SignupData) => {
        try {
            logger.info('Attempting to sign up new user.');
            const response = await api.post<AuthResponse>(API_ENDPOINTS.AUTH.SIGNUP, data);
            logger.info('User signed up successfully.');
            return response.data;
        } catch (error) {
            logger.error('Signup failed:', { error });
            throw error;
        }
    },

    logout: async () => {
        try {
            logger.info('Attempting to log out user.');
            await api.post(API_ENDPOINTS.AUTH.LOGOUT);
            logger.info('User logged out successfully.');
        } catch (error) {
            logger.error('Logout failed:', { error });
            throw error;
        }
    },

    refreshToken: async () => {
        try {
            logger.info('Attempting to refresh token.');
            const response = await api.post<AuthResponse>(API_ENDPOINTS.AUTH.REFRESH, {});
            logger.info('Token refreshed successfully.');
            return response.data;
        } catch (error) {
            logger.error('Token refresh failed:', { error });
            throw error;
        }
    },

    updateProfile: async (data: Partial<User>) => {
        try {
            logger.info('Attempting to update user profile.');
            const response = await api.put<User>(API_ENDPOINTS.AUTH.PROFILE, data);
            logger.info('User profile updated successfully.');
            return response.data;
        } catch (error) {
            logger.error('Profile update failed:', { error });
            throw error;
        }
    },

    changePassword: async (currentPassword: string, newPassword: string) => {
        try {
            logger.info('Attempting to change password.');
            await api.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, { currentPassword, newPassword });
            logger.info('Password changed successfully.');
        } catch (error) {
            logger.error('Password change failed:', { error });
            throw error;
        }
    },
};
