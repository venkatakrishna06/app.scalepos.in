import { create } from 'zustand';
import { User } from '@/types/auth';
import { authService } from '@/lib/api/services/auth.service';
import { api } from '@/lib/api/axios';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  clearError: () => void;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  token: localStorage.getItem('token'),

  setToken: (token) => {
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    set({ token });
  },

  login: async (email, password) => {
    try {
      set({ loading: true, error: null });
      const response = await authService.login({ email, password });
      set(state => {
        state.setToken(response.token);
        return { user: response.user, isAuthenticated: true };
      });
    } catch (error) {
      set({ error: 'Invalid credentials' });
    } finally {
      set({ loading: false });
    }
  },

  signup: async (email, password, name) => {
    try {
      set({ loading: true, error: null });
      const response = await authService.signup({ email, password, name });
      set(state => {
        state.setToken(response.token);
        return { user: response.user, isAuthenticated: true };
      });
    } catch (error) {
      set({ error: 'Failed to create account' });
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    try {
      set({ loading: true });
      await authService.logout();
    } finally {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      set({ user: null, isAuthenticated: false, loading: false, token: null });
    }
  },

  updateProfile: async (data) => {
    try {
      set({ loading: true, error: null });
      const updatedUser = await authService.updateProfile(data);
      set({ user: updatedUser });
    } catch (error) {
      set({ error: 'Failed to update profile' });
    } finally {
      set({ loading: false });
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    try {
      set({ loading: true, error: null });
      await authService.changePassword(currentPassword, newPassword);
    } catch (error) {
      set({ error: 'Failed to change password' });
    } finally {
      set({ loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));