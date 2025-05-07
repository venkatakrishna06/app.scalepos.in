import { create } from 'zustand';
import { User } from '@/types/auth';
import { authService } from '@/lib/api/services/auth.service';
import { tokenService } from '@/lib/services/token.service';
import { api } from '@/lib/api/axios';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string, 
    password: string, 
    restaurant_name: string,
    restaurant_address?: string,
    restaurant_phone?: string,
    restaurant_email?: string,
    restaurant_description?: string
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
        // Temporarily disabled refreshToken API call
        // const user = await authService.refreshToken();
        // set({ user: user.user, isAuthenticated: true });

        // Just set authenticated state based on token
        set({ isAuthenticated: true });
      } catch {
        // If getting user profile fails, clear tokens
        tokenService.clearTokens();
        set({ user: null, isAuthenticated: false, token: null });
      } finally {
        set({ loading: false });
      }
    } else {
      // If token is invalid, clear it
      tokenService.clearTokens();
      set({ user: null, isAuthenticated: false, token: null });
    }
  },

  setToken: (token) => {
    tokenService.setToken(token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    set({ token, isAuthenticated: true });
  },

  login: async (email, password) => {
    try {
      set({ loading: true, error: null });
      const response = await authService.login({ email, password });

      // Store both tokens if refresh token is provided
      if (response.refreshToken) {
        tokenService.setRefreshToken(response.refreshToken);
      }

      set(state => {
        state.setToken(response.token);
        return { user: response.user, isAuthenticated: true };
      });
    } catch {
      set({ error: 'Invalid credentials' });
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
    restaurant_description
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
        restaurant_description
      });

      // Store both tokens if refresh token is provided
      // if (response.refreshToken) {
      //   tokenService.setRefreshToken(response.refreshToken);
      // }

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
      tokenService.clearTokens();
      delete api.defaults.headers.common['Authorization'];
      set({ user: null, isAuthenticated: false, loading: false, token: null });
    }
  },

  updateProfile: async (data) => {
    try {
      set({ loading: true, error: null });
      const updatedUser = await authService.updateProfile(data);
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
