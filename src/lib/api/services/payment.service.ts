import { api } from '../axios';
import { API_ENDPOINTS } from '../endpoints';
import { Payment } from '@/types';
import logger from '@/lib/services/logger.service';

// Import the ApiErrorResponse interface
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
const handleApiError = (error: ApiErrorResponse | Error, defaultMessage: string, context: object = {}) => {
    if ('response' in error && error.response?.data?.error) {
        const apiError = error.response.data.error;
        logger.error(defaultMessage, { ...context, error: apiError });
        throw new Error(apiError.message || defaultMessage);
    }
    logger.error(defaultMessage, { ...context, error });
    throw new Error(defaultMessage);
};

export const paymentService = {
    getPayments: async () => {
        try {
            logger.info('Fetching payments.');
            const response = await api.get<Payment[]>(API_ENDPOINTS.PAYMENTS.LIST);
            logger.info('Payments fetched successfully.');
            return response.data;
        } catch (error) {
            handleApiError(error as ApiErrorResponse, 'Failed to fetch payments');
            return [];
        }
    },

    createPayment: async (payment: Omit<Payment, 'id'>) => {
        try {
            logger.info('Creating new payment.');
            const response = await api.post<Payment>(API_ENDPOINTS.PAYMENTS.CREATE, payment);
            logger.info('Payment created successfully.');
            return response.data;
        } catch (error) {
            handleApiError(error as ApiErrorResponse, 'Failed to create payment', { payment });
            throw error;
        }
    },

    updatePayment: async (id: number, payment: Partial<Payment>) => {
        try {
            logger.info(`Updating payment with id: ${id}`);
            const response = await api.put<Payment>(API_ENDPOINTS.PAYMENTS.UPDATE(id), payment);
            logger.info(`Payment with id: ${id} updated successfully.`);
            return response.data;
        } catch (error) {
            handleApiError(error as ApiErrorResponse, `Failed to update payment with id: ${id}`, { id, payment });
            throw error;
        }
    },

    getPaymentsByOrder: async (orderId: number) => {
        try {
            logger.info(`Fetching payments for order with id: ${orderId}`);
            const response = await api.get<Payment[]>(`${API_ENDPOINTS.PAYMENTS.LIST}?order_id=${orderId}`);
            logger.info(`Payments for order with id: ${orderId} fetched successfully.`);
            return response.data;
        } catch (error) {
            handleApiError(error as ApiErrorResponse, `Failed to fetch payments for order with id: ${orderId}`, { orderId });
            return [];
        }
    },
};
