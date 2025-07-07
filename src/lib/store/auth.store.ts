import {create} from 'zustand';
import {User} from '@/types/auth';
import {authService} from '@/lib/api/services/auth.service';
import {tokenService} from '@/lib/services/token.service';
import {api} from '@/lib/api/axios';
import {toast} from '@/lib/toast';

// Key for storing user data in storage
const USER_STORAGE_KEY = 'user_data';

// Helper functions to store and retrieve user data from storage
// Uses the same storage type (session or local) as the token service
const saveUserToStorage = (user:User | null): void => {
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

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signup: (
    email: string, 
    password: string, 
    restaurant_name: string,
    restaurant_address?: string,
    restaurant_phone?: string,
    restaurant_email?: string,
    restaurant_gst?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  clearError: () => void;
  setToken: (token: string) => void;
  initAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  error: null,
  isAuthenticated: tokenService.isTokenValid(),
  token: tokenService.getToken(),

  initAuth: async () => {
    // Check if token is valid on app startup
    if (tokenService.isTokenValid()) {
      try {
        set({ loading: true });
        // Load user data from sessionStorage
        const userData = getUserFromStorage();

        // Set user data and authenticated state
        set({ 
          user: userData, 
          isAuthenticated: true,
          token: tokenService.getToken()
        });
      } catch {
        // If getting user profile fails, clear tokens and user data
        tokenService.clearTokens();
        saveUserToStorage(null);
        set({ user: null, isAuthenticated: false, token: null });
      } finally {
        set({ loading: false });
      }
    } else {
      // If token is invalid but refresh token exists, try to refresh
      const refreshToken = tokenService.getRefreshToken();
      if (refreshToken) {
        try {
          set({ loading: true });
          // Try to refresh the token
          const response = await authService.refreshToken();

          // Store the new tokens
          tokenService.setToken(response.token);
          if (response.refreshToken) {
            // This now just sets a flag indicating we have a refresh token
            // The actual token is stored as an HttpOnly cookie by the server
            tokenService.setRefreshToken();
          }

          // Set user data and authenticated state
          saveUserToStorage(response?.user_account);
          set({ 
            user: response.user_account, 
            isAuthenticated: true,
            token: response.token
          });
        } catch {
          // If refresh fails, clear tokens and user data
          tokenService.clearTokens();
          saveUserToStorage(null);
          set({ user: null, isAuthenticated: false, token: null });
        } finally {
          set({ loading: false });
        }
      } else {
        // If no refresh token, clear everything
        tokenService.clearTokens();
        saveUserToStorage(null);
        set({ user: null, isAuthenticated: false, token: null });
      }
    }
  },

  setToken: (token) => {
    tokenService.setToken(token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    set({ token, isAuthenticated: true });
  },

  login: async (email, password, rememberMe = true) => {
    try {
      set({ loading: true, error: null });

      // Set persistent session preference before making the login request
      tokenService.setPersistentSession(rememberMe);

      const response = await authService.login({ email, password });


      // Store both tokens if refresh token is provided
      if (response.refreshToken) {
        // This now just sets a flag indicating we have a refresh token
        // The actual token is stored as an HttpOnly cookie by the server
        tokenService.setRefreshToken(response.refreshToken);
      }

      // Save user data to storage (will use localStorage or sessionStorage based on rememberMe)
      saveUserToStorage(response.user_account);

      set(state => {
        state.setToken(response.token);
        return { user: response.user_account, isAuthenticated: true };
      });
    } catch (error) {
      // Check if the error is a 401 Unauthorized error
      if (error) {
        toast.error('Invalid username or password');
      } else {
        toast.error('Login failed. Please try again.');
      }
    } finally {
      set({ loading: false });
    }
  },

  signup: async (
    email, 
    password, 
    restaurant_name,
    restaurant_address,
    restaurant_phone,
    restaurant_email,
    restaurant_gst
  ) => {
    try {
      set({ loading: true, error: null });
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
        tokenService.setRefreshToken(response.refreshToken);
      }

      // Save user data to sessionStorage
      saveUserToStorage(response.user);

      set(state => {
        state.setToken(response.token);
        return { user: response.user, isAuthenticated: true };
      });
    } catch {
      set({ error: 'Failed to create account' });
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    try {
      set({ loading: true });
      // Temporarily disabled logout API call
      // await authService.logout();
    } catch {
      // Continue with logout even if API call fails
    } finally {
      // Clear tokens and user data from sessionStorage
      tokenService.clearTokens();
      saveUserToStorage(null);

      // Clear Authorization header
      delete api.defaults.headers.common['Authorization'];

      // Reset state
      set({ user: null, isAuthenticated: false, loading: false, token: null });
    }
  },

  updateProfile: async (data) => {
    try {
      set({ loading: true, error: null });
      const updatedUser = await authService.updateProfile(data);

      // Save updated user data to sessionStorage
      saveUserToStorage(updatedUser);

      set({ user: updatedUser });
    } catch {
      set({ error: 'Failed to update profile' });
    } finally {
      set({ loading: false });
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    try {
      set({ loading: true, error: null });
      await authService.changePassword(currentPassword, newPassword);
    } catch {
      set({ error: 'Failed to change password' });
    } finally {
      set({ loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
