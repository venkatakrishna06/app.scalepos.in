import {api} from '../axios';
import {API_ENDPOINTS} from '../endpoints';
import {Table} from '@/types';
import logger from '@/lib/services/logger.service';

export const tableService = {
    getTables: async () => {
        try {
            const response = await api.get<Table[]>(API_ENDPOINTS.TABLES.LIST);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    createTable: async (table: Omit<Table, 'id'>) => {
        try {
            const response = await api.post<Table>(API_ENDPOINTS.TABLES.CREATE, table);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    updateTable: async (id: number, table: Partial<Table>) => {
        try {
            const response = await api.put<Table>(API_ENDPOINTS.TABLES.UPDATE(id), table);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    deleteTable: async (id: number) => {
        try {
            await api.delete(API_ENDPOINTS.TABLES.DELETE(id));
            } catch (error) {
            throw error;
        }
    },
};
