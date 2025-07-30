// src/api/analytics.ts
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/lib/api/services/analytics.service';

const STALE_TIME = 1000 * 60 * 60; // 1 hour

export const useFavoriteItems = () => {
    return useQuery({
        queryKey: ['analytics', 'favoriteItems'],
        queryFn: () => analyticsService.getMostOrderedItems(),
        staleTime: STALE_TIME,
    });
};
