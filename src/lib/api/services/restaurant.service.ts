import {api} from '../axios';
import {API_ENDPOINTS} from '../endpoints';
import {Restaurant} from '@/types';
import logger from '@/lib/services/logger.service';

export const restaurantService = {
    getRestaurant: async () => {
        try {
            const response = await api.get<Restaurant[]>(API_ENDPOINTS.RESTAURANT.GET);
            // Assuming the first restaurant is the current one
            return response.data[0];
        } catch (error) {
            throw error;
        }
    },

    updateRestaurant: async (id: number, data: Partial<Restaurant>) => {
        try {
            const response = await api.put<Restaurant>(API_ENDPOINTS.RESTAURANT.UPDATE(id), data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    updateGstSettings: async (id: number, sgstRate: number, cgstRate: number) => {
        try {
            const response = await restaurantService.updateRestaurant(id, {
                default_sgst_rate: sgstRate,
                default_cgst_rate: cgstRate,
            });
            return response;
        } catch (error) {
            throw error;
        }
    },
};
