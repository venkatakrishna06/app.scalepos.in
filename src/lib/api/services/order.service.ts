import {api} from '../axios';
import {API_ENDPOINTS} from '../endpoints';
import {Order, OrderItem} from '@/types';
import {orderSchema, ordersSchema, validateApiResponse} from '@/lib/validation/apiSchemas';

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

// Define types for the new API responses
interface OrderStatusUpdateResponse {
    order: Order;
    allowed_next_states: string[];
}

interface OrderItemStatusUpdateResponse {
    order: Order;
    item: OrderItem;
    allowed_next_item_states: string[];
    allowed_next_order_states: string[];
}

interface CancellationRecord {
    id: number;
    order_id: number;
    item_id?: number;
    reason: string;
    cancelled_by: number;
    cancelled_at: string;
}

interface StatusHistoryRecord {
    id: number;
    type: string;
    order_id: number;
    user_id: number;
    data: {
        old_status: string;
        new_status: string;
    };
    created_at: string;
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
            const finalParams = params || {period: 'day'};
            if (!finalParams.period && !finalParams.start_date && !finalParams.end_date) {
                finalParams.period = 'day';
            }

            const response = await api.get<Order[]>(API_ENDPOINTS.ORDERS.LIST, {params: finalParams});

            // Validate the response data against the schema
            return validateApiResponse(response.data, ordersSchema);
        } catch (error) {
            handleApiError(error, 'Failed to fetch orders');
            return [];
        }
    },

    createOrder: async (order: Omit<Order, 'id'>) => {
        try {
            const response = await api.post<Order>(API_ENDPOINTS.ORDERS.CREATE, order);
            return validateApiResponse(response.data, orderSchema);
        } catch (error) {
            handleApiError(error, 'Failed to create order');
            throw error;
        }
    },

    updateOrder: async (id: number, order: Partial<Order>) => {
        try {
            const response = await api.put<Order>(API_ENDPOINTS.ORDERS.UPDATE(id), order);
            return validateApiResponse(response.data, orderSchema);
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
            return validateApiResponse(response.data, ordersSchema);
        } catch (error) {
            handleApiError(error, 'Failed to fetch orders for table');
            return [];
        }
    },

    // New methods for order status management
    updateOrderStatus: async (id: number, status: string) => {
        try {
            const response = await api.put<OrderStatusUpdateResponse>(
                API_ENDPOINTS.ORDERS.UPDATE_STATUS(id),
                {status}
            );
            return response.data;
        } catch (error) {
            handleApiError(error, 'Failed to update order status');
            throw error;
        }
    },

    getOrderStatusHistory: async (id: number) => {
        try {
            const response = await api.get<StatusHistoryRecord[]>(
                API_ENDPOINTS.ORDERS.STATUS_HISTORY(id)
            );
            return response.data;
        } catch (error) {
            handleApiError(error, 'Failed to fetch order status history');
            return [];
        }
    },

    cancelOrder: async (id: number, reason: string) => {
        try {
            const response = await api.post<Order>(
                API_ENDPOINTS.ORDERS.CANCEL(id),
                {reason}
            );
            return response.data;
        } catch (error) {
            handleApiError(error, 'Failed to cancel order');
            throw error;
        }
    },

    getOrderCancellations: async (id: number) => {
        try {
            const response = await api.get<CancellationRecord[]>(
                API_ENDPOINTS.ORDERS.CANCELLATIONS(id)
            );
            return response.data;
        } catch (error) {
            handleApiError(error, 'Failed to fetch order cancellations');
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

    // New method for updating order item status
    updateOrderItemStatus: async (itemId: number, status: string) => {
        try {
            const response = await api.put<OrderItemStatusUpdateResponse>(
                API_ENDPOINTS.ORDER_ITEMS.UPDATE_STATUS(itemId),
                {status}
            );
            return response.data;
        } catch (error) {
            handleApiError(error, 'Failed to update order item status');
            throw error;
        }
    },

    getOrderItemStatusHistory: async (itemId: number) => {
        try {
            const response = await api.get<StatusHistoryRecord[]>(
                API_ENDPOINTS.ORDER_ITEMS.STATUS_HISTORY(itemId)
            );
            return response.data;
        } catch (error) {
            handleApiError(error, 'Failed to fetch order item status history');
            return [];
        }
    },

    cancelOrderItem: async (orderId: number, itemId: number, reason: string) => {
        try {
            const response = await api.post<Order>(
                API_ENDPOINTS.ORDER_ITEMS.CANCEL(orderId, itemId),
                {reason}
            );
            return response.data;
        } catch (error) {
            handleApiError(error, 'Failed to cancel order item');
            throw error;
        }
    },

    getOrderItemCancellations: async (itemId: number) => {
        try {
            const response = await api.get<CancellationRecord[]>(
                API_ENDPOINTS.ORDER_ITEMS.CANCELLATIONS(itemId)
            );
            return response.data;
        } catch (error) {
            handleApiError(error, 'Failed to fetch order item cancellations');
            return [];
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
