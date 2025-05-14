import {api} from '../axios';
import {API_ENDPOINTS} from '../endpoints';
import {Restaurant} from '@/types';

export const restaurantService = {
  getRestaurant: async () => {
    const response = await api.get<Restaurant[]>(API_ENDPOINTS.RESTAURANT.GET);
    // Assuming the first restaurant is the current one
    return response.data[0];
  },

  updateRestaurant: async (id: number, data: Partial<Restaurant>) => {
    const response = await api.put<Restaurant>(API_ENDPOINTS.RESTAURANT.UPDATE(id), data);
    return response.data;
  },

  updateGstSettings: async (id: number, sgstRate: number, cgstRate: number) => {
    return await restaurantService.updateRestaurant(id, {
      default_sgst_rate: sgstRate,
      default_cgst_rate: cgstRate,
    });
  },
};