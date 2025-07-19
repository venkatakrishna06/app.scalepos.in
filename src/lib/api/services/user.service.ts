import {User} from '@/types';
import {API_ENDPOINTS} from '../endpoints';
import {api} from '../axios';


export const userService = {
    getUsers: async (): Promise<User[]> => {
        const response = await api.get(API_ENDPOINTS.USER_ACCOUNTS.LIST);
        return response.data;
    },

    getUser: async (id: number): Promise<User> => {
        const response = await api.get(API_ENDPOINTS.USER_ACCOUNTS.GET_BY_ID(id));
        return response.data;
    },

    createUser: async (user: Omit<User, 'id'>): Promise<User> => {
        const response = await api.post(API_ENDPOINTS.USER_ACCOUNTS.CREATE, user);
        return response.data;
    },

    updateUser: async (id: number, user: Partial<User>): Promise<User> => {
        const response = await api.put(API_ENDPOINTS.USER_ACCOUNTS.UPDATE(id), user);
        return response.data;
    },

    deleteUser: async (id: number): Promise<void> => {
        await api.delete(API_ENDPOINTS.USER_ACCOUNTS.DELETE(id));
    }
};
