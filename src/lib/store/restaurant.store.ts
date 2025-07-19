import {create} from 'zustand';
import {Restaurant} from '@/types';
import {restaurantService} from '@/lib/api/services/restaurant.service';
import {toast} from '@/lib/toast';

interface RestaurantState {
    restaurant: Restaurant | null;
    loading: boolean;
    error: string | null;
    fetchRestaurant: () => Promise<void>;
    updateRestaurant: (updates: Partial<Restaurant>) => Promise<void>;
    updateGstSettings: (sgstRate: number, cgstRate: number) => Promise<void>;
    toggleOrderTracking: (enabled: boolean) => Promise<void>;
}

/**
 * Store for managing restaurant information
 *
 * This store handles:
 * - Fetching restaurant information from the API
 * - Updating restaurant details
 * - Updating GST settings
 */
export const useRestaurantStore = create<RestaurantState>((set, get) => ({
    restaurant: null,
    loading: false,
    error: null,

    fetchRestaurant: async () => {
        try {
            set({loading: true, error: null});
            const restaurant = await restaurantService.getRestaurant();
            set({restaurant});
        } catch (err) {

            const errorMessage = 'Failed to fetch restaurant information';
            set({error: errorMessage});
            toast.error(errorMessage);
        } finally {
            set({loading: false});
        }
    },

    updateRestaurant: async (updates) => {
        try {
            set({loading: true, error: null});
            const restaurant = get().restaurant;
            if (!restaurant) {
                throw new Error('No restaurant found');
            }
            const updatedRestaurant = await restaurantService.updateRestaurant(restaurant.id, updates);
            set({restaurant: updatedRestaurant});
            toast.success('Restaurant information updated successfully');
        } catch (err) {

            const errorMessage = 'Failed to update restaurant information';
            set({error: errorMessage});
            toast.error(errorMessage);
        } finally {
            set({loading: false});
        }
    },

    updateGstSettings: async (sgstRate, cgstRate) => {
        try {
            set({loading: true, error: null});
            const restaurant = get().restaurant;
            if (!restaurant) {
                throw new Error('No restaurant found');
            }
            const updatedRestaurant = await restaurantService.updateGstSettings(restaurant.id, sgstRate, cgstRate);
            set({restaurant: updatedRestaurant});
            toast.success('GST settings updated successfully');
        } catch (err) {

            const errorMessage = 'Failed to update GST settings';
            set({error: errorMessage});
            toast.error(errorMessage);
        } finally {
            set({loading: false});
        }
    },

    toggleOrderTracking: async (enabled) => {
        try {
            set({loading: true, error: null});
            const restaurant = get().restaurant;
            if (!restaurant) {
                throw new Error('No restaurant found');
            }
            const updatedRestaurant = await restaurantService.updateRestaurant(restaurant.id, {
                enable_order_status_tracking: enabled
            });
            set({restaurant: updatedRestaurant});
            toast.success(`Order status tracking ${enabled ? 'enabled' : 'disabled'} successfully`);
        } catch (err) {
            const errorMessage = `Failed to ${enabled ? 'enable' : 'disable'} order status tracking`;
            set({error: errorMessage});
            toast.error(errorMessage);
        } finally {
            set({loading: false});
        }
    },
}));
