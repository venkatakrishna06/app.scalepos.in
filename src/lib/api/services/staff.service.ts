import { api } from '../axios';
import { API_ENDPOINTS } from '../endpoints';
import { StaffMember } from '@/types';

export const staffService = {
  getStaff: async () => {
    const response = await api.get<StaffMember[]>(API_ENDPOINTS.STAFF.LIST);
    return response.data;
  },

  createStaff: async (staff: Omit<StaffMember, 'id'>) => {
    const response = await api.post<StaffMember>(API_ENDPOINTS.STAFF.CREATE, staff);
    return response.data;
  },

  updateStaff: async (id: number, staff: Partial<StaffMember>) => {
    const response = await api.put<StaffMember>(API_ENDPOINTS.STAFF.UPDATE(id), staff);
    return response.data;
  },

  deleteStaff: async (id: number) => {
    await api.delete(API_ENDPOINTS.STAFF.DELETE(id));
  },
};