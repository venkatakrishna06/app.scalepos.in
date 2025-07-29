import { api } from '../axios';
import { API_ENDPOINTS } from '../endpoints';
import { StaffMember } from '@/types';
import logger from '@/lib/services/logger.service';

export const staffService = {
    getStaff: async () => {
        try {
            logger.info('Fetching staff members.');
            const response = await api.get<StaffMember[]>(API_ENDPOINTS.STAFF.LIST);
            logger.info('Staff members fetched successfully.');
            return response.data;
        } catch (error) {
            logger.error('Failed to fetch staff members:', { error });
            throw error;
        }
    },

    createStaff: async (staff: Omit<StaffMember, 'id'>) => {
        try {
            logger.info('Creating new staff member.');
            const response = await api.post<StaffMember>(API_ENDPOINTS.STAFF.CREATE, staff);
            logger.info('Staff member created successfully.');
            return response.data;
        } catch (error) {
            logger.error('Failed to create staff member:', { error, staff });
            throw error;
        }
    },

    updateStaff: async (id: number, staff: Partial<StaffMember>) => {
        try {
            logger.info(`Updating staff member with id: ${id}`);
            const response = await api.put<StaffMember>(API_ENDPOINTS.STAFF.UPDATE(id), staff);
            logger.info(`Staff member with id: ${id} updated successfully.`);
            return response.data;
        } catch (error) {
            logger.error(`Failed to update staff member with id: ${id}`, { error, staff });
            throw error;
        }
    },

    deleteStaff: async (id: number) => {
        try {
            logger.info(`Deleting staff member with id: ${id}`);
            await api.delete(API_ENDPOINTS.STAFF.DELETE(id));
            logger.info(`Staff member with id: ${id} deleted successfully.`);
        } catch (error) {
            logger.error(`Failed to delete staff member with id: ${id}`, { error, id });
            throw error;
        }
    },
};
