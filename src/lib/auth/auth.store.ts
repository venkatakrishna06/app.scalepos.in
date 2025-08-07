import {create} from 'zustand';
import {User} from '@/types/auth';
import {authService} from '@/lib/api/services/auth.service';
import {tokenService} from '@/lib/services/token.service';
import {api} from '@/lib/api/axios';
import {toast} from '@/lib/toast';
import {queryClient} from '@/lib/queryClient';

const USER_STORAGE_KEY = 'user_data';

const saveUserToStorage = (user: User | null): void => {
    const storage = tokenService.isPersistentSession() ? localStorage : sessionStorage;
    if (user) {
        storage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
        localStorage.removeItem(USER_STORAGE_KEY);
        sessionStorage.removeItem(USER_STORAGE_KEY);
    }
};

const getUserFromStorage = (): User | null => {
    const storage = tokenService.isPersistentSession() ? localStorage : sessionStorage;
    const userData = storage.getItem(USER_STORAGE_KEY);
    return userData ? JSON.parse(userData) : null;
};

interface AuthState {
    user: User | null;
    loading: boolean;
    isInitializing: boolean; // <-- The ONLY addition
    error: string | null;
    isAuthenticated: boolean;
    token: string | null;
    login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
    signup: (email:string,
             password :string,
             restaurant_name : string,
             restaurant_address : string,
             restaurant_phone:string,
             restaurant_email : string,
             restaurant_gst:string) => Promise<void>;
    logout: () => Promise<void>;
    // Other functions omitted for brevity...
    initAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: getUserFromStorage(),
    loading: false,
    isInitializing: true, // <-- Start as true
    error: null,
    isAuthenticated: tokenService.isTokenValid(),
    token: tokenService.getToken(),

    initAuth: async () => {
        set({ isInitializing: true });
        try {
            const token = tokenService.getToken();
            if (token && tokenService.isTokenValid()) {
                const user = getUserFromStorage();
                if (user) {
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    set({ user, isAuthenticated: true, token });
                } else { throw new Error("User not found in storage"); }
            } else if (tokenService.getRefreshToken()) {
                const response = await authService.refreshToken();
                tokenService.setToken(response.token);
                tokenService.setRefreshToken();
                saveUserToStorage(response.user_account);
                api.defaults.headers.common['Authorization'] = `Bearer ${response.token}`;
                set({ user: response.user_account, isAuthenticated: true, token: response.token });
            } else {
                throw new Error("No valid tokens");
            }
        } catch (error) {
            // If any part of auth fails, perform a clean logout
            tokenService.clearTokens();
            saveUserToStorage(null);
            delete api.defaults.headers.common['Authorization'];
            set({ user: null, isAuthenticated: false, token: null });
        } finally {
            set({ isInitializing: false }); // <-- Set to false only at the very end
        }
    },

    login: async (email, password, rememberMe = true) => {
        set({ loading: true, error: null });
        try {
            tokenService.setPersistentSession(rememberMe);
            const response = await authService.login({ email, password });
            tokenService.setToken(response.token);
            tokenService.setRefreshToken();
            saveUserToStorage(response.user_account);
            api.defaults.headers.common['Authorization'] = `Bearer ${response.token}`;
            set({ user: response.user_account, isAuthenticated: true, loading: false });
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || 'Login failed.';
            toast.error(errorMessage);
            set({ error: errorMessage, loading: false });
            throw error;
        }
    },

    logout: async () => {
        tokenService.clearTokens();
        sessionStorage.clear();
        saveUserToStorage(null);
        delete api.defaults.headers.common['Authorization'];
        // Clear React Query cache
        queryClient.clear();
        set({ user: null, isAuthenticated: false, loading: false, token: null, isInitializing: false });
    },

    // Other functions from your original file...
    signup: async (
        email,
        password ,
        restaurant_name ,
        restaurant_address ,
        restaurant_phone,
        restaurant_email ,
        restaurant_gst
    ) => {
        try {
            set({loading: true, error: null});
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
                // This now just sets a flag indicating we have a refresh token
                // The actual token is stored as an HttpOnly cookie by the server
                tokenService.setRefreshToken();
            }

            // Save user data to sessionStorage
            saveUserToStorage(response.user);

            set(state => {
                state.setToken(response.token);
                return {user: response.user, isAuthenticated: true};
            });
        } catch {
            set({error: 'Failed to create account'});
        } finally {
            set({loading: false});
        }
    },
    updateProfile: async (data) => {
        try {
            set({loading: true, error: null});
            const updatedUser = await authService.updateProfile(data);

            // Save updated user data to sessionStorage
            saveUserToStorage(updatedUser);

            set({user: updatedUser});
        } catch {
            set({error: 'Failed to update profile'});
        } finally {
            set({loading: false});
        }
    },
    changePassword: async (currentPassword:string, newPassword:string) => {
        try {
            set({loading: true, error: null});
            await authService.changePassword(currentPassword, newPassword);
        } catch {
            set({error: 'Failed to change password'});
        } finally {
            set({loading: false});
        }
    },
    clearError: () => {},
    setToken: () => {},
}));
