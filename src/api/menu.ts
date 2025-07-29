// src/api/menu.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { menuService } from '@/lib/api/services/menu.service';
import { Category, MenuItem } from '@/types';

const STALE_TIME = 1000 * 60 * 5; // 5 minutes
const CACHE_TIME = 1000 * 60 * 60; // 1 hour

export const useMenuItems = () => {
    return useQuery({
        queryKey: ['menuItems'],
        queryFn: menuService.getItems,
        staleTime: STALE_TIME,
        cacheTime: CACHE_TIME,
    });
};

export const useCreateMenuItem = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (item: Omit<MenuItem, 'id'>) => menuService.createItem(item),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['menuItems'] });
        },
    });
};

export const useUpdateMenuItem = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, item }: { id: number, item: Partial<MenuItem> }) => menuService.updateItem(id, item),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['menuItems'] });
        },
    });
};

export const useDeleteMenuItem = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => menuService.deleteItem(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['menuItems'] });
        },
    });
};

export const useCategories = () => {
    return useQuery({
        queryKey: ['categories'],
        queryFn: menuService.getCategories,
        staleTime: STALE_TIME,
        cacheTime: CACHE_TIME,
    });
};

export const useCreateCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (category: Omit<Category, 'id'>) => menuService.createCategory(category),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
    });
};

export const useUpdateCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, category }: { id: number, category: Partial<Category> }) => menuService.updateCategory(id, category),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
    });
};

export const useDeleteCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => menuService.deleteCategory(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
    });
};
