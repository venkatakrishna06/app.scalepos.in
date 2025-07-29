import { api } from '../axios';
import { API_ENDPOINTS } from '../endpoints';
import { Category, MenuItem } from '@/types';
import logger from '@/lib/services/logger.service';

export const menuService = {
    getItems: async () => {
        try {
            logger.info('Fetching menu items.');
            const response = await api.get<MenuItem[]>(API_ENDPOINTS.MENU.ITEMS);
            logger.info('Menu items fetched successfully.');
            return response.data;
        } catch (error) {
            logger.error('Failed to fetch menu items:', { error });
            throw error;
        }
    },

    createItem: async (item: Omit<MenuItem, 'id'>) => {
        try {
            logger.info('Creating new menu item.');
            const response = await api.post<MenuItem>(API_ENDPOINTS.MENU.CREATE, item);
            logger.info('Menu item created successfully.');
            return response.data;
        } catch (error) {
            logger.error('Failed to create menu item:', { error });
            throw error;
        }
    },

    updateItem: async (id: number, item: Partial<MenuItem>) => {
        try {
            logger.info(`Updating menu item with id: ${id}`);
            const response = await api.put<MenuItem>(API_ENDPOINTS.MENU.ITEM_UPDATE(id), item);
            logger.info(`Menu item with id: ${id} updated successfully.`);
            return response.data;
        } catch (error) {
            logger.error(`Failed to update menu item with id: ${id}`, { error });
            throw error;
        }
    },

    deleteItem: async (id: number) => {
        try {
            logger.info(`Deleting menu item with id: ${id}`);
            await api.delete(API_ENDPOINTS.MENU.ITEM_UPDATE(id));
            logger.info(`Menu item with id: ${id} deleted successfully.`);
        } catch (error) {
            logger.error(`Failed to delete menu item with id: ${id}`, { error });
            throw error;
        }
    },

    getCategories: async () => {
        try {
            logger.info('Fetching categories.');
            const response = await api.get<Category[]>(API_ENDPOINTS.MENU.CATEGORIES);
            logger.info('Categories fetched successfully.');
            return response.data;
        } catch (error) {
            logger.error('Failed to fetch categories:', { error });
            throw error;
        }
    },

    createCategory: async (category: Omit<Category, 'id'>) => {
        try {
            logger.info('Creating new category.');
            const response = await api.post<Category>(API_ENDPOINTS.MENU.CATEGORIES, category);
            logger.info('Category created successfully.');
            return response.data;
        } catch (error) {
            logger.error('Failed to create category:', { error });
            throw error;
        }
    },

    updateCategory: async (id: number, category: Partial<Category>) => {
        try {
            logger.info(`Updating category with id: ${id}`);
            const response = await api.put<Category>(API_ENDPOINTS.MENU.CATEGORY_UPDATE(id), category);
            logger.info(`Category with id: ${id} updated successfully.`);
            return response.data;
        } catch (error) {
            logger.error(`Failed to update category with id: ${id}`, { error });
            throw error;
        }
    },

    deleteCategory: async (id: number) => {
        try {
            logger.info(`Deleting category with id: ${id}`);
            await api.delete(API_ENDPOINTS.MENU.CATEGORY_UPDATE(id));
            logger.info(`Category with id: ${id} deleted successfully.`);
        } catch (error) {
            logger.error(`Failed to delete category with id: ${id}`, { error });
            throw error;
        }
    },
};
