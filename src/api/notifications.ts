// src/api/notifications.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const STALE_TIME = 1000 * 60 * 1; // 1 minute
const CACHE_TIME = 1000 * 60 * 5; // 5 minutes

const getNotifications = async (): Promise<Notification[]> => {
    // Simulate API call
    return new Promise(resolve => {
        setTimeout(() => {
            resolve([]);
        }, 500);
    });
};

const markAsRead = async (id: number): Promise<void> => {
    // Simulate API call
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, 500);
    });
};

const markAllAsRead = async (): Promise<void> => {
    // Simulate API call
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, 500);
    });
};

const clearNotifications = async (): Promise<void> => {
    // Simulate API call
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, 500);
    });
};

export const useNotifications = () => {
    return useQuery({
        queryKey: ['notifications'],
        queryFn: getNotifications,
        staleTime: STALE_TIME,
        gcTime: CACHE_TIME,
    });
};

export const useMarkAsRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => markAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
};

export const useMarkAllAsRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => markAllAsRead(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
};

export const useClearNotifications = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => clearNotifications(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
};
