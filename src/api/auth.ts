// src/api/auth.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/lib/api/services/auth.service';
import { LoginCredentials, SignupData, User } from '@/types/auth';

export const useLogin = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user'] });
        },
    });
};

export const useSignup = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: SignupData) => authService.signup(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user'] });
        },
    });
};

export const useLogout = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => authService.logout(),
        onSuccess: () => {
            queryClient.clear();
        },
    });
};

export const useUpdateProfile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<User>) => authService.updateProfile(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user'] });
        },
    });
};

export const useChangePassword = () => {
    return useMutation({
        mutationFn: ({ currentPassword, newPassword }: { currentPassword: string, newPassword: string }) =>
            authService.changePassword(currentPassword, newPassword),
    });
};
