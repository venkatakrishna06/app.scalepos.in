import {User} from '@/types';
import {API_ENDPOINTS} from '../endpoints';
import {api} from '../axios';
import logger from '@/lib/services/logger.service';

export const userService = {
    getUsers: async (): Promise<User[]> => {
        try {
            const response = await api.get(API_ENDPOINTS.USER_ACCOUNTS.LIST);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getUser: async (id: number): Promise<User> => {
        try {
            const response = await api.get(API_ENDPOINTS.USER_ACCOUNTS.GET_BY_ID(id));
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    createUser: async (user: Omit<User, 'id'>): Promise<User> => {
        try {
            const response = await api.post(API_ENDPOINTS.USER_ACCOUNTS.CREATE, user);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    updateUser: async (id: number, user: Partial<User>): Promise<User> => {
        try {
            const response = await api.put(API_ENDPOINTS.USER_ACCOUNTS.UPDATE(id), user);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    deleteUser: async (id: number): Promise<void> => {
        try {
            await api.delete(API_ENDPOINTS.USER_ACCOUNTS.DELETE(id));
            } catch (error) {
            throw error;
        }
    }
};
