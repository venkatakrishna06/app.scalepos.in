import { api } from '../axios';
import { API_ENDPOINTS } from '../endpoints';
import { Table } from '@/types';

export const tableService = {
  getTables: async () => {
    const response = await api.get<Table[]>(API_ENDPOINTS.TABLES.LIST);
    return response.data;
  },

  createTable: async (table: Omit<Table, 'id'>) => {
    const response = await api.post<Table>(API_ENDPOINTS.TABLES.CREATE, table);
    return response.data;
  },

  updateTable: async (id: number, table: Partial<Table>) => {
    const response = await api.put<Table>(API_ENDPOINTS.TABLES.UPDATE(id), table);
    return response.data;
  },

  deleteTable: async (id: number) => {
    await api.delete(API_ENDPOINTS.TABLES.DELETE(id));
  },
};