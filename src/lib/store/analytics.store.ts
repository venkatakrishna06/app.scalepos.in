import {create} from 'zustand';
import {analyticsService} from '@/lib/api/services/analytics.service';
import {
    AnalyticsParams,
    CustomerAnalytics,
    HourlySalesAnalytics,
    MenuItemAnalytics,
    PaymentMethodAnalytics,
    SalesAnalytics,
    StaffAnalytics,
    TableAnalytics
} from '@/types/analytics';
import {toast} from '@/lib/toast';

interface AnalyticsState {
  // State
  salesAnalytics: SalesAnalytics[];
  menuItemAnalytics: MenuItemAnalytics[];
  staffAnalytics: StaffAnalytics[];
  tableAnalytics: TableAnalytics[];
  paymentMethodAnalytics: PaymentMethodAnalytics[];
  hourlySalesAnalytics: HourlySalesAnalytics[];
  customerAnalytics: CustomerAnalytics[];
  loading: boolean;
  error: string | null;

  // API Actions
  fetchSalesAnalytics: (params: AnalyticsParams) => Promise<void>;
  fetchMenuItemAnalytics: (params: AnalyticsParams) => Promise<void>;
  fetchStaffAnalytics: (params: AnalyticsParams) => Promise<void>;
  fetchTableAnalytics: (params: AnalyticsParams) => Promise<void>;
  fetchPaymentMethodAnalytics: (params: AnalyticsParams) => Promise<void>;
  fetchHourlySalesAnalytics: (params: AnalyticsParams) => Promise<void>;
  fetchCustomerAnalytics: (params: AnalyticsParams) => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  salesAnalytics: [],
  menuItemAnalytics: [],
  staffAnalytics: [],
  tableAnalytics: [],
  paymentMethodAnalytics: [],
  hourlySalesAnalytics: [],
  customerAnalytics: [],
  loading: false,
  error: null,

  fetchSalesAnalytics: async (params) => {
    try {
      set({ loading: true, error: null });
      const data = await analyticsService.getSalesAnalytics(params);
      set({ salesAnalytics: data });
    } catch (err) {

      const errorMessage = 'Failed to fetch sales analytics';
      set({ error: errorMessage });
      toast.error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },

  fetchMenuItemAnalytics: async (params) => {
    try {
      set({ loading: true, error: null });
      const data = await analyticsService.getMenuItemAnalytics(params);
      set({ menuItemAnalytics: data });
    } catch (err) {

      const errorMessage = 'Failed to fetch menu item analytics';
      set({ error: errorMessage });
      toast.error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },

  fetchStaffAnalytics: async (params) => {
    try {
      set({ loading: true, error: null });
      const data = await analyticsService.getStaffAnalytics(params);
      set({ staffAnalytics: data });
    } catch (err) {

      const errorMessage = 'Failed to fetch staff analytics';
      set({ error: errorMessage });
      toast.error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },

  fetchTableAnalytics: async (params) => {
    try {
      set({ loading: true, error: null });
      const data = await analyticsService.getTableAnalytics(params);
      set({ tableAnalytics: data });
    } catch (err) {

      const errorMessage = 'Failed to fetch table analytics';
      set({ error: errorMessage });
      toast.error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },

  fetchPaymentMethodAnalytics: async (params) => {
    try {
      set({ loading: true, error: null });
      const data = await analyticsService.getPaymentMethodAnalytics(params);
      set({ paymentMethodAnalytics: data });
    } catch (err) {

      const errorMessage = 'Failed to fetch payment method analytics';
      set({ error: errorMessage });
      toast.error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },

  fetchHourlySalesAnalytics: async (params) => {
    try {
      set({ loading: true, error: null });
      const data = await analyticsService.getHourlySalesAnalytics(params);
      set({ hourlySalesAnalytics: data });
    } catch (err) {

      const errorMessage = 'Failed to fetch hourly sales analytics';
      set({ error: errorMessage });
      toast.error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },

  fetchCustomerAnalytics: async (params) => {
    try {
      set({ loading: true, error: null });
      const data = await analyticsService.getCustomerAnalytics(params);
      set({ customerAnalytics: data });
    } catch (err) {

      const errorMessage = 'Failed to fetch customer analytics';
      set({ error: errorMessage });
      toast.error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },
}));