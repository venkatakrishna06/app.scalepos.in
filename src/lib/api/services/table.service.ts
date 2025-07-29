import { api } from '../axios';
import { API_ENDPOINTS } from '../endpoints';
import { Table } from '@/types';
import logger from '@/lib/services/logger.service';

export const tableService = {
    getTables: async () => {
        try {
            logger.info('Fetching tables.');
            const response = await api.get<Table[]>(API_ENDPOINTS.TABLES.LIST);
            logger.info('Tables fetched successfully.');
            return response.data;
        } catch (error) {
            logger.error('Failed to fetch tables:', { error });
            throw error;
        }
    },

    createTable: async (table: Omit<Table, 'id'>) => {
        try {
            logger.info('Creating new table.');
            const response = await api.post<Table>(API_ENDPOINTS.TABLES.CREATE, table);
            logger.info('Table created successfully.');
            return response.data;
        } catch (error) {
            logger.error('Failed to create table:', { error, table });
            throw error;
        }
    },

    updateTable: async (id: number, table: Partial<Table>) => {
        try {
            logger.info(`Updating table with id: ${id}`);
            const response = await api.put<Table>(API_ENDPOINTS.TABLES.UPDATE(id), table);
            logger.info(`Table with id: ${id} updated successfully.`);
            return response.data;
        } catch (error) {
            logger.error(`Failed to update table with id: ${id}`, { error, table });
            throw error;
        }
    },

    deleteTable: async (id: number) => {
        try {
            logger.info(`Deleting table with id: ${id}`);
            await api.delete(API_ENDPOINTS.TABLES.DELETE(id));
            logger.info(`Table with id: ${id} deleted successfully.`);
        } catch (error) {
            logger.error(`Failed to delete table with id: ${id}`, { error, id });
            throw error;
        }
    },
};
