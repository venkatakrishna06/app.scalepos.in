// src/api/restaurant.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { restaurantService } from '@/lib/api/services/restaurant.service';
import { Restaurant } from '@/types';

const STALE_TIME = 1000 * 60 * 60; // 1 hour
const CACHE_TIME = 1000 * 60 * 60; // 1 hour

export const useRestaurant = () => {
    return useQuery({
        queryKey: ['restaurant'],
        queryFn: restaurantService.getRestaurant,
        staleTime: STALE_TIME,
        cacheTime: CACHE_TIME,
    });
};

export const useUpdateRestaurant = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number, data: Partial<Restaurant> }) => restaurantService.updateRestaurant(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['restaurant'] });
        },
    });
};

export const useUpdateGstSettings = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, sgstRate, cgstRate }: { id: number, sgstRate: number, cgstRate: number }) =>
            restaurantService.updateGstSettings(id, sgstRate, cgstRate),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['restaurant'] });
        },
    });
};
