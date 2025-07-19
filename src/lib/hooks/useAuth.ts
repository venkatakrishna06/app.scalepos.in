import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {authService} from '@/lib/api/services/auth.service';
import {tokenService} from '@/lib/services/token.service';
import {api} from '@/lib/api/axios';
import {User} from '@/types/auth';

// Key for storing user data in storage
const USER_STORAGE_KEY = 'user_data';

// Helper functions to store and retrieve user data from storage
// Uses the same storage type (session or local) as the token service
const saveUserToStorage = (user: User | null): void => {
    if (user) {
        if (tokenService.isPersistentSession()) {
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        } else {
            sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        }
    } else {
        // Clear from both storages to ensure it's completely removed
        localStorage.removeItem(USER_STORAGE_KEY);
        sessionStorage.removeItem(USER_STORAGE_KEY);
    }
};

const getUserFromStorage = (): User | null => {
    const isPersistent = tokenService.isPersistentSession();
    const userData = isPersistent
        ? localStorage.getItem(USER_STORAGE_KEY)
        : sessionStorage.getItem(USER_STORAGE_KEY);
    return userData ? JSON.parse(userData) : null;
};

export const useAuth = () => {
    const queryClient = useQueryClient();

    // Query to check if user is authenticated
    const {data: user, isLoading: isAuthLoading} = useQuery({
        queryKey: ['auth', 'user'],
        queryFn: async () => {
            // Check if token is valid
            if (tokenService.isTokenValid()) {
                // Load user data from storage
                const userData = getUserFromStorage();
                return userData;
            } else {
                // If token is invalid but refresh token exists, try to refresh
                const refreshToken = tokenService.getRefreshToken();
                if (refreshToken) {
                    try {
                        // Try to refresh the token
                        const response = await authService.refreshToken();

                        // Store the new tokens
                        tokenService.setToken(response.token);
                        if (response.refreshToken) {
                            tokenService.setRefreshToken();
                        }

                        // Save user data to storage
                        saveUserToStorage(response.user_account);
                        return response.user_account;
                    } catch {
                        // If refresh fails, clear tokens and user data
                        tokenService.clearTokens();
                        saveUserToStorage(null);
                        return null;
                    }
                } else {
                    // If no refresh token, clear everything
                    tokenService.clearTokens();
                    saveUserToStorage(null);
                    return null;
                }
            }
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: false,
    });

    // Login mutation
    const loginMutation = useMutation({
        mutationFn: async ({email, password, rememberMe = true}: {
            email: string;
            password: string;
            rememberMe?: boolean
        }) => {
            // Set persistent session preference before making the login request
            tokenService.setPersistentSession(rememberMe);

            const response = await authService.login({email, password});

            // Store both tokens if refresh token is provided
            if (response.refreshToken) {
                tokenService.setRefreshToken(response.refreshToken);
            }

            // Save user data to storage
            saveUserToStorage(response.user_account);

            // Set token in axios headers
            const token = response.token;
            tokenService.setToken(token);
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            return response.user_account;
        },
        onSuccess: (data) => {
            // Update the user query data
            queryClient.setQueryData(['auth', 'user'], data);
        },
    });

    // Signup mutation
    const signupMutation = useMutation({
        mutationFn: async ({
                               email,
                               password,
                               restaurant_name,
                               restaurant_address,
                               restaurant_phone,
                               restaurant_email,
                               restaurant_gst
                           }: {
            email: string;
            password: string;
            restaurant_name: string;
            restaurant_address?: string;
            restaurant_phone?: string;
            restaurant_email?: string;
            restaurant_gst?: string;
        }) => {
            const response = await authService.signup({
                email,
                password,
                restaurant_name,
                restaurant_address,
                restaurant_phone,
                restaurant_email,
                restaurant_gst
            });

            // Store both tokens if refresh token is provided
            if (response.refreshToken) {
                tokenService.setRefreshToken(response.refreshToken);
            }

            // Save user data to storage
            saveUserToStorage(response.user);

            // Set token in axios headers
            const token = response.token;
            tokenService.setToken(token);
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            return response.user;
        },
        onSuccess: (data) => {
            // Update the user query data
            queryClient.setQueryData(['auth', 'user'], data);
        },
    });

    // Logout mutation
    const logoutMutation = useMutation({
        mutationFn: async () => {
            try {
                // Temporarily disabled logout API call
                // await authService.logout();
            } catch {
                // Continue with logout even if API call fails
            }

            // Clear tokens and user data from storage
            tokenService.clearTokens();
            saveUserToStorage(null);

            // Clear Authorization header
            delete api.defaults.headers.common['Authorization'];
        },
        onSuccess: () => {
            // Clear the user query data
            queryClient.setQueryData(['auth', 'user'], null);
            // Invalidate all queries to force refetch
            queryClient.invalidateQueries();
        },
    });

    // Update profile mutation
    const updateProfileMutation = useMutation({
        mutationFn: async (data: Partial<User>) => {
            const updatedUser = await authService.updateProfile(data);
            // Save updated user data to storage
            saveUserToStorage(updatedUser);
            return updatedUser;
        },
        onSuccess: (data) => {
            // Update the user query data
            queryClient.setQueryData(['auth', 'user'], data);
        },
    });

    // Change password mutation
    const changePasswordMutation = useMutation({
        mutationFn: async ({currentPassword, newPassword}: { currentPassword: string; newPassword: string }) => {
            await authService.changePassword(currentPassword, newPassword);
        },
    });

    return {
        user,
        isAuthenticated: !!user,
        isAuthLoading,
        token: tokenService.getToken(),
        login: loginMutation.mutate,
        isLoginLoading: loginMutation.isPending,
        loginError: loginMutation.error,
        signup: signupMutation.mutate,
        isSignupLoading: signupMutation.isPending,
        signupError: signupMutation.error,
        logout: logoutMutation.mutate,
        isLogoutLoading: logoutMutation.isPending,
        updateProfile: updateProfileMutation.mutate,
        isUpdateProfileLoading: updateProfileMutation.isPending,
        updateProfileError: updateProfileMutation.error,
        changePassword: changePasswordMutation.mutate,
        isChangePasswordLoading: changePasswordMutation.isPending,
        changePasswordError: changePasswordMutation.error,
    };
};