import {api} from '../axios';
import {API_ENDPOINTS} from '../endpoints';
import {StaffMember} from '@/types';
import logger from '@/lib/services/logger.service';

export const staffService = {
    getStaff: async () => {
        try {
            const response = await api.get<StaffMember[]>(API_ENDPOINTS.STAFF.LIST);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    createStaff: async (staff: Omit<StaffMember, 'id'>) => {
        try {
            const response = await api.post<StaffMember>(API_ENDPOINTS.STAFF.CREATE, staff);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    updateStaff: async (id: number, staff: Partial<StaffMember>) => {
        try {
            const response = await api.put<StaffMember>(API_ENDPOINTS.STAFF.UPDATE(id), staff);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    deleteStaff: async (id: number) => {
        try {
            await api.delete(API_ENDPOINTS.STAFF.DELETE(id));
            } catch (error) {
            throw error;
        }
    },
};
