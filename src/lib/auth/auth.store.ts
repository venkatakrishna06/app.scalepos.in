import {create} from 'zustand';
import {User} from '@/types/auth';
import {authService} from '@/lib/api/services/auth.service';
import {tokenService} from '@/lib/services/token.service';
import {api} from '@/lib/api/axios';
import {toast} from '@/lib/toast';

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
    signup: (data: any) => Promise<void>;
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
        sessionStorage.clear()
        saveUserToStorage(null);
        delete api.defaults.headers.common['Authorization'];
        set({ user: null, isAuthenticated: false, loading: false, token: null, isInitializing: false });
    },

    // Other functions from your original file...
    signup: async () => {},
    updateProfile: async () => {},
    changePassword: async () => {},
    clearError: () => {},
    setToken: () => {},
}));
