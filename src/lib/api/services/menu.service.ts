import {api} from '../axios';
import {API_ENDPOINTS} from '../endpoints';
import {Category, MenuItem} from '@/types';

export const menuService = {
  getItems: async () => {
    const response = await api.get<MenuItem[]>(API_ENDPOINTS.MENU.ITEMS);
    return response.data;
  },

  createItem: async (item: Omit<MenuItem, 'id'>) => {
    const response = await api.post<MenuItem>(API_ENDPOINTS.MENU.CREATE, item);
    return response.data;
  },

  updateItem: async (id: number, item: Partial<MenuItem>) => {
    const response = await api.put<MenuItem>(API_ENDPOINTS.MENU.ITEM_UPDATE(id), item);
    return response.data;
  },

  deleteItem: async (id: number) => {
    await api.delete(API_ENDPOINTS.MENU.ITEM_UPDATE(id));
  },

  getCategories: async () => {
    const response = await api.get<Category[]>(API_ENDPOINTS.MENU.CATEGORIES);
    return response.data;
  },

  createCategory: async (category: Omit<Category, 'id'>) => {
    const response = await api.post<Category>(API_ENDPOINTS.MENU.CATEGORIES, category);
    return response.data;
  },

  updateCategory: async (id: number, category: Partial<Category>) => {
    const response = await api.put<Category>(API_ENDPOINTS.MENU.CATEGORY_UPDATE(id), category);
    return response.data;
  },

  deleteCategory: async (id: number) => {
    await api.delete(API_ENDPOINTS.MENU.CATEGORY_UPDATE(id));
  },
};
