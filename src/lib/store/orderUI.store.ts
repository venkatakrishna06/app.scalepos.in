import { create } from 'zustand';

interface OrderUIState {
  // UI-specific state
  selectedOrderId: number | null;
  selectedItemId: number | null;
  filterStatus: string;
  filterDateRange: { startDate: Date | null; endDate: Date | null };

  // UI actions
  setSelectedOrderId: (id: number | null) => void;
  setSelectedItemId: (id: number | null) => void;
  setFilterStatus: (status: string) => void;
  setFilterDateRange: (range: { startDate: Date | null; endDate: Date | null }) => void;
  resetFilters: () => void;
}

/**
 * Store for managing order UI state
 * 
 * This store handles UI-specific state like:
 * - Selected order/item IDs
 * - Filter criteria
 * - UI preferences
 * 
 * It does NOT handle server state (use React Query for that)
 */
export const useOrderUIStore = create<OrderUIState>((set) => ({
  // Initial state
  selectedOrderId: null,
  selectedItemId: null,
  filterStatus: 'all',
  filterDateRange: { startDate: null, endDate: null },

  // Actions
  setSelectedOrderId: (id) => set({ selectedOrderId: id }),
  setSelectedItemId: (id) => set({ selectedItemId: id }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setFilterDateRange: (range) => set({ filterDateRange: range }),
  resetFilters: () => set({
    filterStatus: 'all',
    filterDateRange: { startDate: null, endDate: null }
  })
}));
