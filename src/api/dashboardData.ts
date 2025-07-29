// src/lib/hooks/useDashboardData.ts
import { useQuery } from '@tanstack/react-query';
import { orderService } from '../lib/api/services/order.service';
import { menuService } from '../lib/api/services/menu.service';

const STALE_TIME = 1000 * 60 * 5; // 5 minutes
const CACHE_TIME = 1000 * 60 * 60; // 1 hour

export const useDashboardData = () => {
    const { data: orders = [], isLoading: isLoadingOrders, isError: isErrorOrders, refetch: refetchOrders } = useQuery({
        queryKey: ['orders', { period: 'day' }],
        queryFn: () => orderService.getOrders({ period: 'day' }),
        staleTime: STALE_TIME,
        cacheTime: CACHE_TIME,
    });

    const { data: menuItems = [], isLoading: isLoadingMenuItems, isError: isErrorMenuItems, refetch: refetchMenuItems } = useQuery({
        queryKey: ['menuItems'],
        queryFn: menuService.getItems,
        staleTime: STALE_TIME,
        cacheTime: CACHE_TIME,
    });

    const isLoading = isLoadingOrders || isLoadingMenuItems;
    const isError = isErrorOrders || isErrorMenuItems;

    const refetch = () => {
        refetchOrders();
        refetchMenuItems();
    };

    return { orders, menuItems, isLoading, isError, refetch };
};
