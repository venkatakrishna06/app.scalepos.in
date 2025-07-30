// src/api/users.ts
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {userService} from '@/lib/api/services/user.service';
import {User} from '@/types';

const STALE_TIME = 1000 * 60 * 5; // 5 minutes
const CACHE_TIME = 1000 * 60 * 60; // 1 hour

export const useUsers = () => {
    return useQuery({
        queryKey: ['users'],
        queryFn: userService.getUsers,
        staleTime: STALE_TIME,
        cacheTime: CACHE_TIME,
    });
};

export const useUser = (id: number) => {
    return useQuery({
        queryKey: ['user', id],
        queryFn: () => userService.getUser(id),
        staleTime: STALE_TIME,
        cacheTime: CACHE_TIME,
        enabled: !!id,
    });
};

export const useCreateUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (user: Omit<User, 'id'>) => userService.createUser(user),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['users']});
        },
    });
};

export const useUpdateUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({id, user}: { id: number, user: Partial<User> }) => userService.updateUser(id, user),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['users']});
        },
    });
};

export const useDeleteUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => userService.deleteUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['users']});
        },
    });
};
