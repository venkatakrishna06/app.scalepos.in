import {create} from 'zustand';
import { OrderItem } from '@/types';

interface OrderUIState {
    // UI-specific state
    selectedOrderId: number | null;
    selectedItemId: number | null;
    filterStatus: string;
    filterDateRange: { startDate: Date | null; endDate: Date | null };
    
    // State for preserving order during processing
    processingOrderItems: OrderItem[] | null;
    processingOrderType: 'dine-in' | 'takeaway' | 'quick-bill' | null;
    processingTableId: number | null;
    processingOrderError: boolean;

    // UI actions
    setSelectedOrderId: (id: number | null) => void;
    setSelectedItemId: (id: number | null) => void;
    setFilterStatus: (status: string) => void;
    setFilterDateRange: (range: { startDate: Date | null; endDate: Date | null }) => void;
    resetFilters: () => void;
    
    // Actions for order processing
    setProcessingOrder: (items: OrderItem[], orderType: 'dine-in' | 'takeaway' | 'quick-bill' | null, tableId: number | null) => void;
    clearProcessingOrder: () => void;
    setProcessingOrderError: (hasError: boolean) => void;
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
    filterDateRange: {startDate: null, endDate: null},
    
    // Initial state for order processing
    processingOrderItems: null,
    processingOrderType: null,
    processingTableId: null,
    processingOrderError: false,

    // Actions
    setSelectedOrderId: (id) => set({selectedOrderId: id}),
    setSelectedItemId: (id) => set({selectedItemId: id}),
    setFilterStatus: (status) => set({filterStatus: status}),
    setFilterDateRange: (range) => set({filterDateRange: range}),
    resetFilters: () => set({
        filterStatus: 'all',
        filterDateRange: {startDate: null, endDate: null}
    }),
    
    // Actions for order processing
    setProcessingOrder: (items, orderType, tableId) => set({
        processingOrderItems: items,
        processingOrderType: orderType,
        processingTableId: tableId,
        processingOrderError: false
    }),
    clearProcessingOrder: () => set({
        processingOrderItems: null,
        processingOrderType: null,
        processingTableId: null,
        processingOrderError: false
    }),
    setProcessingOrderError: (hasError) => set({
        processingOrderError: hasError
    })
}));
