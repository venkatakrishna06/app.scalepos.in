import {api} from '../axios';
import {API_ENDPOINTS} from '../endpoints';
import {Order, OrderItem} from '@/types';

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

export const orderService = {
  getOrders: async (params?: {
    period?: 'day' | 'week' | 'month';
    start_date?: string;
    end_date?: string;
    table_number?: number;
  }) => {
    try {
      // Default to current day if no period or date range is specified
      const finalParams = params || { period: 'day' };
      if (!finalParams.period && !finalParams.start_date && !finalParams.end_date) {
        finalParams.period = 'day';
      }

      const response = await api.get<Order[]>(API_ENDPOINTS.ORDERS.LIST, { params: finalParams });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to fetch orders');
      return [];
    }
  },

  createOrder: async (order: Omit<Order, 'id'>) => {
    try {
      const response = await api.post<Order>(API_ENDPOINTS.ORDERS.CREATE, order);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to create order');
      throw error;
    }
  },

  updateOrder: async (id: number, order: Partial<Order>) => {
    try {
      const response = await api.put<Order>(API_ENDPOINTS.ORDERS.UPDATE(id), order);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to update order');
      throw error;
    }
  },

  deleteOrder: async (id: number) => {
    try {
      await api.delete(API_ENDPOINTS.ORDERS.DELETE(id));
    } catch (error) {
      handleApiError(error, 'Failed to delete order');
      throw error;
    }
  },

  getOrdersByTable: async (tableId: number) => {
    try {
      const response = await api.get<Order[]>(`${API_ENDPOINTS.ORDERS.LIST}?table_id=${tableId}`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to fetch orders for table');
      return [];
    }
  },

  // Order item operations
  updateOrderItem: async (orderId: number, itemId: number, updates: Partial<OrderItem>) => {
    try {
      const response = await api.put<OrderItem>(`${API_ENDPOINTS.ORDER_ITEMS.UPDATE(itemId)}`, updates);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to update order item');
      throw error;
    }
  },

  removeOrderItem: async (orderId: number, itemId: number) => {
    try {
      await api.delete(API_ENDPOINTS.ORDER_ITEMS.DELETE(itemId));
    } catch (error) {
      handleApiError(error, 'Failed to remove order item');
      throw error;
    }
  },
};
