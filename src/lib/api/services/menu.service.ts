import {api} from '../axios';
import {API_ENDPOINTS} from '../endpoints';
import {Category, MenuItem} from '@/types';
import logger from '@/lib/services/logger.service';

export const menuService = {
    getItems: async () => {
        try {
            const response = await api.get<MenuItem[]>(API_ENDPOINTS.MENU.ITEMS);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    createItem: async (item: Omit<MenuItem, 'id'>) => {
        try {
            const response = await api.post<MenuItem>(API_ENDPOINTS.MENU.CREATE, item);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    updateItem: async (id: number, item: Partial<MenuItem>) => {
        try {
            const response = await api.put<MenuItem>(API_ENDPOINTS.MENU.ITEM_UPDATE(id), item);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    deleteItem: async (id: number) => {
        try {
            await api.delete(API_ENDPOINTS.MENU.ITEM_UPDATE(id));
            } catch (error) {
            throw error;
        }
    },

    getCategories: async () => {
        try {
            const response = await api.get<Category[]>(API_ENDPOINTS.MENU.CATEGORIES);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    createCategory: async (category: Omit<Category, 'id'>) => {
        try {
            const response = await api.post<Category>(API_ENDPOINTS.MENU.CATEGORIES, category);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    updateCategory: async (id: number, category: Partial<Category>) => {
        try {
            const response = await api.put<Category>(API_ENDPOINTS.MENU.CATEGORY_UPDATE(id), category);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    deleteCategory: async (id: number) => {
        try {
            await api.delete(API_ENDPOINTS.MENU.CATEGORY_UPDATE(id));
            } catch (error) {
            throw error;
        }
    },
};
