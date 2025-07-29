import { User } from '@/types';
import { API_ENDPOINTS } from '../endpoints';
import { api } from '../axios';
import logger from '@/lib/services/logger.service';

export const userService = {
    getUsers: async (): Promise<User[]> => {
        try {
            logger.info('Fetching users.');
            const response = await api.get(API_ENDPOINTS.USER_ACCOUNTS.LIST);
            logger.info('Users fetched successfully.');
            return response.data;
        } catch (error) {
            logger.error('Failed to fetch users:', { error });
            throw error;
        }
    },

    getUser: async (id: number): Promise<User> => {
        try {
            logger.info(`Fetching user with id: ${id}`);
            const response = await api.get(API_ENDPOINTS.USER_ACCOUNTS.GET_BY_ID(id));
            logger.info(`User with id: ${id} fetched successfully.`);
            return response.data;
        } catch (error) {
            logger.error(`Failed to fetch user with id: ${id}`, { error, id });
            throw error;
        }
    },

    createUser: async (user: Omit<User, 'id'>): Promise<User> => {
        try {
            logger.info('Creating new user.');
            const response = await api.post(API_ENDPOINTS.USER_ACCOUNTS.CREATE, user);
            logger.info('User created successfully.');
            return response.data;
        } catch (error) {
            logger.error('Failed to create user:', { error, user });
            throw error;
        }
    },

    updateUser: async (id: number, user: Partial<User>): Promise<User> => {
        try {
            logger.info(`Updating user with id: ${id}`);
            const response = await api.put(API_ENDPOINTS.USER_ACCOUNTS.UPDATE(id), user);
            logger.info(`User with id: ${id} updated successfully.`);
            return response.data;
        } catch (error) {
            logger.error(`Failed to update user with id: ${id}`, { error, user });
            throw error;
        }
    },

    deleteUser: async (id: number): Promise<void> => {
        try {
            logger.info(`Deleting user with id: ${id}`);
            await api.delete(API_ENDPOINTS.USER_ACCOUNTS.DELETE(id));
            logger.info(`User with id: ${id} deleted successfully.`);
        } catch (error) {
            logger.error(`Failed to delete user with id: ${id}`, { error, id });
            throw error;
        }
    }
};
