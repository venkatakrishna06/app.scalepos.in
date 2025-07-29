import { api } from '../axios';
import { API_ENDPOINTS } from '../endpoints';
import { Restaurant } from '@/types';
import logger from '@/lib/services/logger.service';

export const restaurantService = {
    getRestaurant: async () => {
        try {
            logger.info('Fetching restaurant information.');
            const response = await api.get<Restaurant[]>(API_ENDPOINTS.RESTAURANT.GET);
            logger.info('Restaurant information fetched successfully.');
            // Assuming the first restaurant is the current one
            return response.data[0];
        } catch (error) {
            logger.error('Failed to fetch restaurant information:', { error });
            throw error;
        }
    },

    updateRestaurant: async (id: number, data: Partial<Restaurant>) => {
        try {
            logger.info(`Updating restaurant with id: ${id}`);
            const response = await api.put<Restaurant>(API_ENDPOINTS.RESTAURANT.UPDATE(id), data);
            logger.info(`Restaurant with id: ${id} updated successfully.`);
            return response.data;
        } catch (error) {
            logger.error(`Failed to update restaurant with id: ${id}`, { error, data });
            throw error;
        }
    },

    updateGstSettings: async (id: number, sgstRate: number, cgstRate: number) => {
        try {
            logger.info(`Updating GST settings for restaurant with id: ${id}`);
            const response = await restaurantService.updateRestaurant(id, {
                default_sgst_rate: sgstRate,
                default_cgst_rate: cgstRate,
            });
            logger.info(`GST settings for restaurant with id: ${id} updated successfully.`);
            return response;
        } catch (error) {
            logger.error(`Failed to update GST settings for restaurant with id: ${id}`, { error, sgstRate, cgstRate });
            throw error;
        }
    },
};
