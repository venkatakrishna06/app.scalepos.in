import {create} from 'zustand';
import {StaffMember} from '@/types';
import {staffService} from "@/lib/api/services/staff.service";
import {toast} from '@/lib/toast';

interface StaffState {
  staff: StaffMember[];
  currentStaff: StaffMember | null;
  loading: boolean;
  error: string | null;
  fetchStaff: () => Promise<void>;
  setCurrentStaff: (staff: StaffMember | null) => void;
  addStaff: (staff: Omit<StaffMember, 'id'>) => Promise<void>;
  updateStaff: (id: number, updates: Partial<StaffMember>) => Promise<void>;
  deleteStaff: (id: number) => Promise<void>;
}

/**
 * Store for managing staff members
 * 
 * This store handles:
 * - Fetching staff members from the API
 * - Adding, updating, and deleting staff members
 * - Tracking the currently selected staff member
 */
export const useStaffStore = create<StaffState>((set) => ({
  staff: [],
  currentStaff: null,
  loading: false,
  error: null,

  fetchStaff: async () => {
    try {
      set({ loading: true, error: null });
      const staff = await staffService.getStaff();
      set({ staff: staff });
    } catch (err) {
      console.error('Error fetching staff:', err);
      const errorMessage = 'Failed to fetch staff';
      set({ error: errorMessage });
      toast.error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },

  setCurrentStaff: (staff) => {
    set({ currentStaff: staff });
  },

  addStaff: async (staff) => {
    try {
      set({ loading: true, error: null });
      const newStaff = await staffService.createStaff(staff);
      set(state => ({ staff: [...state.staff, newStaff] }));
      toast.success('Staff member added successfully');
    } catch (err) {
      console.error('Error adding staff:', err);
      const errorMessage = 'Failed to add staff member';
      set({ error: errorMessage });
      toast.error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },

  updateStaff: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      const updatedStaff = await staffService.updateStaff(id, updates);
      set(state => ({
        staff: state.staff.map(s => s.id === id ? updatedStaff : s),
        currentStaff: state.currentStaff?.id === id ? updatedStaff : state.currentStaff,
      }));
      toast.success('Staff member updated successfully');
    } catch (err) {
      console.error('Error updating staff:', err);
      const errorMessage = 'Failed to update staff member';
      set({ error: errorMessage });
      toast.error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },

  deleteStaff: async (id) => {
    try {
      set({ loading: true, error: null });
      await staffService.deleteStaff(id);
      set(state => ({
        staff: state.staff.filter(s => s.id !== id),
        currentStaff: state.currentStaff?.id === id ? null : state.currentStaff,
      }));
      toast.success('Staff member deleted successfully');
    } catch (err) {
      console.error('Error deleting staff:', err);
      const errorMessage = 'Failed to delete staff member';
      set({ error: errorMessage });
      toast.error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },
}));
