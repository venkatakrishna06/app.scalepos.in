import { api } from '../axios';
import { API_ENDPOINTS } from '../endpoints';
import { Order, OrderItem } from '@/types';
import { orderSchema, ordersSchema, validateApiResponse } from '@/lib/validation/apiSchemas';
import logger from '@/lib/services/logger.service';

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
const handleApiError = (error: ApiErrorResponse | Error, defaultMessage: string, context: object = {}) => {
    if ('response' in error && error.response?.data?.error) {
        const apiError = error.response.data.error;
        logger.error(defaultMessage, { ...context, error: apiError });
        throw new Error(apiError.message || defaultMessage);
    }
    logger.error(defaultMessage, { ...context, error });
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
            const finalParams = params || { period: 'day' };
            if (!finalParams.period && !finalParams.start_date && !finalParams.end_date) {
                finalParams.period = 'day';
            }
            logger.info('Fetching orders with params:', { params: finalParams });
            const response = await api.get<Order[]>(API_ENDPOINTS.ORDERS.LIST, { params: finalParams });
            logger.info('Orders fetched successfully.');
            return validateApiResponse(response.data, ordersSchema);
        } catch (error) {
            handleApiError(error, 'Failed to fetch orders', { params });
            return [];
        }
    },

    createOrder: async (order: Omit<Order, 'id'>) => {
        try {
            logger.info('Creating new order.');
            const response = await api.post<Order>(API_ENDPOINTS.ORDERS.CREATE, order);
            logger.info('Order created successfully.');
            return validateApiResponse(response.data, orderSchema);
        } catch (error) {
            handleApiError(error, 'Failed to create order', { order });
            throw error;
        }
    },

    updateOrder: async (id: number, order: Partial<Order>) => {
        try {
            logger.info(`Updating order with id: ${id}`);
            const response = await api.put<Order>(API_ENDPOINTS.ORDERS.UPDATE(id), order);
            logger.info(`Order with id: ${id} updated successfully.`);
            return validateApiResponse(response.data, orderSchema);
        } catch (error) {
            handleApiError(error, `Failed to update order with id: ${id}`, { order });
            throw error;
        }
    },

    deleteOrder: async (id: number) => {
        try {
            logger.info(`Deleting order with id: ${id}`);
            await api.delete(API_ENDPOINTS.ORDERS.DELETE(id));
            logger.info(`Order with id: ${id} deleted successfully.`);
        } catch (error) {
            handleApiError(error, `Failed to delete order with id: ${id}`, { id });
            throw error;
        }
    },

    getOrdersByTable: async (tableId: number) => {
        try {
            logger.info(`Fetching orders for table with id: ${tableId}`);
            const response = await api.get<Order[]>(`${API_ENDPOINTS.ORDERS.LIST}?table_id=${tableId}`);
            logger.info(`Orders for table with id: ${tableId} fetched successfully.`);
            return validateApiResponse(response.data, ordersSchema);
        } catch (error) {
            handleApiError(error, `Failed to fetch orders for table with id: ${tableId}`, { tableId });
            return [];
        }
    },

    updateOrderStatus: async (id: number, status: string) => {
        try {
            logger.info(`Updating order status for order with id: ${id} to ${status}`);
            const response = await api.put<OrderStatusUpdateResponse>(
                API_ENDPOINTS.ORDERS.UPDATE_STATUS(id),
                { status }
            );
            logger.info(`Order status for order with id: ${id} updated successfully.`);
            return response.data;
        } catch (error) {
            handleApiError(error, `Failed to update order status for order with id: ${id}`, { id, status });
            throw error;
        }
    },

    getOrderStatusHistory: async (id: number) => {
        try {
            logger.info(`Fetching order status history for order with id: ${id}`);
            const response = await api.get<StatusHistoryRecord[]>(
                API_ENDPOINTS.ORDERS.STATUS_HISTORY(id)
            );
            logger.info(`Order status history for order with id: ${id} fetched successfully.`);
            return response.data;
        } catch (error) {
            handleApiError(error, `Failed to fetch order status history for order with id: ${id}`, { id });
            return [];
        }
    },

    cancelOrder: async (id: number, reason: string) => {
        try {
            logger.info(`Cancelling order with id: ${id}`);
            const response = await api.post<Order>(
                API_ENDPOINTS.ORDERS.CANCEL(id),
                { reason }
            );
            logger.info(`Order with id: ${id} cancelled successfully.`);
            return response.data;
        } catch (error) {
            handleApiError(error, `Failed to cancel order with id: ${id}`, { id, reason });
            throw error;
        }
    },

    getOrderCancellations: async (id: number) => {
        try {
            logger.info(`Fetching order cancellations for order with id: ${id}`);
            const response = await api.get<CancellationRecord[]>(
                API_ENDPOINTS.ORDERS.CANCELLATIONS(id)
            );
            logger.info(`Order cancellations for order with id: ${id} fetched successfully.`);
            return response.data;
        } catch (error) {
            handleApiError(error, `Failed to fetch order cancellations for order with id: ${id}`, { id });
            return [];
        }
    },

    updateOrderItem: async (orderId: number, itemId: number, updates: Partial<OrderItem>) => {
        try {
            logger.info(`Updating order item with id: ${itemId} in order with id: ${orderId}`);
            const response = await api.put<OrderItem>(`${API_ENDPOINTS.ORDER_ITEMS.UPDATE(itemId)}`, updates);
            logger.info(`Order item with id: ${itemId} in order with id: ${orderId} updated successfully.`);
            return response.data;
        } catch (error) {
            handleApiError(error, `Failed to update order item with id: ${itemId}`, { orderId, itemId, updates });
            throw error;
        }
    },

    updateOrderItemStatus: async (itemId: number, status: string) => {
        try {
            logger.info(`Updating order item status for item with id: ${itemId} to ${status}`);
            const response = await api.put<OrderItemStatusUpdateResponse>(
                API_ENDPOINTS.ORDER_ITEMS.UPDATE_STATUS(itemId),
                { status }
            );
            logger.info(`Order item status for item with id: ${itemId} updated successfully.`);
            return response.data;
        } catch (error) {
            handleApiError(error, `Failed to update order item status for item with id: ${itemId}`, { itemId, status });
            throw error;
        }
    },

    getOrderItemStatusHistory: async (itemId: number) => {
        try {
            logger.info(`Fetching order item status history for item with id: ${itemId}`);
            const response = await api.get<StatusHistoryRecord[]>(
                API_ENDPOINTS.ORDER_ITEMS.STATUS_HISTORY(itemId)
            );
            logger.info(`Order item status history for item with id: ${itemId} fetched successfully.`);
            return response.data;
        } catch (error) {
            handleApiError(error, `Failed to fetch order item status history for item with id: ${itemId}`, { itemId });
            return [];
        }
    },

    cancelOrderItem: async (orderId: number, itemId: number, reason: string) => {
        try {
            logger.info(`Cancelling order item with id: ${itemId} in order with id: ${orderId}`);
            const response = await api.post<Order>(
                API_ENDPOINTS.ORDER_ITEMS.CANCEL(orderId, itemId),
                { reason }
            );
            logger.info(`Order item with id: ${itemId} in order with id: ${orderId} cancelled successfully.`);
            return response.data;
        } catch (error) {
            handleApiError(error, `Failed to cancel order item with id: ${itemId}`, { orderId, itemId, reason });
            throw error;
        }
    },

    getOrderItemCancellations: async (itemId: number) => {
        try {
            logger.info(`Fetching order item cancellations for item with id: ${itemId}`);
            const response = await api.get<CancellationRecord[]>(
                API_ENDPOINTS.ORDER_ITEMS.CANCELLATIONS(itemId)
            );
            logger.info(`Order item cancellations for item with id: ${itemId} fetched successfully.`);
            return response.data;
        } catch (error) {
            handleApiError(error, `Failed to fetch order item cancellations for item with id: ${itemId}`, { itemId });
            return [];
        }
    },

    removeOrderItem: async (orderId: number, itemId: number) => {
        try {
            logger.info(`Removing order item with id: ${itemId} from order with id: ${orderId}`);
            await api.delete(API_ENDPOINTS.ORDER_ITEMS.DELETE(itemId));
            logger.info(`Order item with id: ${itemId} from order with id: ${orderId} removed successfully.`);
        } catch (error) {
            handleApiError(error, `Failed to remove order item with id: ${itemId}`, { orderId, itemId });
            throw error;
        }
    },
};
