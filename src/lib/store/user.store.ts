import {create} from 'zustand';
import {User} from '@/types';
import {userService} from '@/lib/api/services/user.service';
import {toast} from '@/lib/toast';
import {useAuthStore} from './auth.store';

interface UserState {
  users: User[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (id: number, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: number) => Promise<void>;
}

/**
 * Store for managing users
 * 
 * This store handles:
 * - Fetching users from the API
 * - Adding, updating, and deleting users
 */
export const useUserStore = create<UserState>((set) => ({
  users: [],
  loading: false,
  error: null,

  fetchUsers: async () => {
    try {
      set({ loading: true, error: null });

      // Get current user role
      const { user } = useAuthStore.getState();

      if (!user) {
        set({ users: [] });
        return;
      }

      // Only admin should have access to user management
      if (user.role !== 'admin') {
        // Non-admin users don't need access to user data
        set({ users: [] });
        return;
      }

      // Fetch from API directly (no caching)
      const users = await userService.getUsers();
      set({ users });
    } catch (error) {
      const errorMessage = 'Failed to fetch users';
      set({ error: errorMessage });

      // Only show error toast for admin role
      const { user } = useAuthStore.getState();
      if (user && user.role === 'admin') {
        toast.error(errorMessage);
      }
    } finally {
      set({ loading: false });
    }
  },

  addUser: async (user) => {
    try {
      set({ loading: true, error: null });
      await userService.createUser(user);
      // Refresh the user list after adding a new user
      // await set.getState().fetchUsers();
      toast.success('User added successfully');
    } catch (err) {

      const errorMessage = 'Failed to add user';
      set({ error: errorMessage });
      toast.error(errorMessage);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  updateUser: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      const updatedUser = await userService.updateUser(id, updates);
      set(state => ({
        users: state.users.map(user => user.id === id ? updatedUser : user),
      }));
      toast.success('User updated successfully');
    } catch (err) {

      const errorMessage = 'Failed to update user';
      set({ error: errorMessage });
      toast.error(errorMessage);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  deleteUser: async (id) => {
    try {
      set({ loading: true, error: null });
      await userService.deleteUser(id);
      set(state => ({
        users: state.users.filter(user => user.id !== id),
      }));
      toast.success('User deleted successfully');
    } catch (err) {

      const errorMessage = 'Failed to delete user';
      set({ error: errorMessage });
      toast.error(errorMessage);
      throw err;
    } finally {
      set({ loading: false });
    }
  },
}));
