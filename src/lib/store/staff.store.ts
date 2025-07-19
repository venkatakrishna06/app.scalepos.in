import {create} from 'zustand';
import {StaffMember} from '@/types';
import {staffService} from "@/lib/api/services/staff.service";
import {toast} from '@/lib/toast';
import {useAuthStore} from './auth.store';

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
            set({loading: true, error: null});

            // Get current user role
            const {user} = useAuthStore.getState();

            if (!user) {
                set({staff: []});
                return;
            }

            // Check if user role should have access to staff data
            if (user.role === 'server' || user.role === 'kitchen') {
                // Server and kitchen staff don't need access to all staff data
                set({staff: []});
                return;
            }

            // Fetch from API directly (no caching)
            const staff = await staffService.getStaff();
            set({staff: staff});
        } catch (error) {
            const errorMessage = 'Failed to fetch staff';
            set({error: errorMessage});

            // Only show error toast for roles that should have access to staff data
            const {user} = useAuthStore.getState();
            if (user && user.role !== 'server' && user.role !== 'kitchen') {
                toast.error(errorMessage);
            }
        } finally {
            set({loading: false});
        }
    },

    setCurrentStaff: (staff) => {
        set({currentStaff: staff});
    },

    addStaff: async (staff) => {
        try {
            set({loading: true, error: null});
            const newStaff = await staffService.createStaff(staff);
            set(state => ({staff: [...state.staff, newStaff]}));
            toast.success('Staff member added successfully');
        } catch (err) {

            const errorMessage = 'Failed to add staff member';
            set({error: errorMessage});
            toast.error(errorMessage);
        } finally {
            set({loading: false});
        }
    },

    updateStaff: async (id, updates) => {
        try {
            set({loading: true, error: null});
            const updatedStaff = await staffService.updateStaff(id, updates);
            set(state => ({
                staff: state.staff.map(s => s.id === id ? updatedStaff : s),
                currentStaff: state.currentStaff?.id === id ? updatedStaff : state.currentStaff,
            }));
            toast.success('Staff member updated successfully');
        } catch (err) {

            const errorMessage = 'Failed to update staff member';
            set({error: errorMessage});
            toast.error(errorMessage);
        } finally {
            set({loading: false});
        }
    },

    deleteStaff: async (id) => {
        try {
            set({loading: true, error: null});
            await staffService.deleteStaff(id);
            set(state => ({
                staff: state.staff.filter(s => s.id !== id),
                currentStaff: state.currentStaff?.id === id ? null : state.currentStaff,
            }));
            toast.success('Staff member deleted successfully');
        } catch (err) {

            const errorMessage = 'Failed to delete staff member';
            set({error: errorMessage});
            toast.error(errorMessage);
        } finally {
            set({loading: false});
        }
    },
}));
