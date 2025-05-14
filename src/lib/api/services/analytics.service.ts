import {api} from '../axios';
import {API_ENDPOINTS} from '../endpoints';
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

// Define error type for better type safety
interface ApiErrorResponse {
  response?: {
    data?: {
      error?: {
        type?: string;
        code?: string;
        message?: string;
        details?: Record<string, unknown>;
        request_id?: string;
      };
    };
  };
}

// Helper function to handle API errors
const handleApiError = (error: ApiErrorResponse | Error, defaultMessage: string) => {
  if ('response' in error && error.response?.data?.error) {
    const apiError = error.response.data.error;
    throw new Error(apiError.message || defaultMessage);
  }
  throw new Error(defaultMessage);
};

export const analyticsService = {
  getSalesAnalytics: async (params: AnalyticsParams) => {
    try {
      const response = await api.get<SalesAnalytics[]>(API_ENDPOINTS.ANALYTICS.SALES, { params });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to fetch sales analytics');
      // This line will never be reached because handleApiError throws an error
      // But TypeScript requires a return statement
      return [];
    }
  },

  getMenuItemAnalytics: async (params: AnalyticsParams) => {
    try {
      const response = await api.get<MenuItemAnalytics[]>(API_ENDPOINTS.ANALYTICS.MENU_ITEMS, { params });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to fetch menu item analytics');
      // This line will never be reached because handleApiError throws an error
      // But TypeScript requires a return statement
      return [];
    }
  },

  getStaffAnalytics: async (params: AnalyticsParams) => {
    try {
      const response = await api.get<StaffAnalytics[]>(API_ENDPOINTS.ANALYTICS.STAFF, { params });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to fetch staff analytics');
      // This line will never be reached because handleApiError throws an error
      // But TypeScript requires a return statement
      return [];
    }
  },

  getTableAnalytics: async (params: AnalyticsParams) => {
    try {
      const response = await api.get<TableAnalytics[]>(API_ENDPOINTS.ANALYTICS.TABLES, { params });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to fetch table analytics');
      // This line will never be reached because handleApiError throws an error
      // But TypeScript requires a return statement
      return [];
    }
  },

  getPaymentMethodAnalytics: async (params: AnalyticsParams) => {
    try {
      const response = await api.get<PaymentMethodAnalytics[]>(API_ENDPOINTS.ANALYTICS.PAYMENT_METHODS, { params });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to fetch payment method analytics');
      // This line will never be reached because handleApiError throws an error
      // But TypeScript requires a return statement
      return [];
    }
  },

  getHourlySalesAnalytics: async (params: AnalyticsParams) => {
    try {
      const response = await api.get<HourlySalesAnalytics[]>(API_ENDPOINTS.ANALYTICS.HOURLY_SALES, { params });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to fetch hourly sales analytics');
      // This line will never be reached because handleApiError throws an error
      // But TypeScript requires a return statement
      return [];
    }
  },

  getCustomerAnalytics: async (params: AnalyticsParams) => {
    try {
      const response = await api.get<CustomerAnalytics[]>(API_ENDPOINTS.ANALYTICS.CUSTOMERS, { params });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to fetch customer analytics');
      // This line will never be reached because handleApiError throws an error
      // But TypeScript requires a return statement
      return [];
    }
  },
};
