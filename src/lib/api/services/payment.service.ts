import {api} from '../axios';
import {API_ENDPOINTS} from '../endpoints';
import {Payment} from '@/types';

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
const handleApiError = (error: ApiErrorResponse | Error, defaultMessage: string) => {
    if ('response' in error && error.response?.data?.error) {
        const apiError = error.response.data.error;
        throw new Error(apiError.message || defaultMessage);
    }
    throw new Error(defaultMessage);
};

export const paymentService = {
    getPayments: async () => {
        try {
            const response = await api.get<Payment[]>(API_ENDPOINTS.PAYMENTS.LIST);
            return response.data;
        } catch (error) {
            handleApiError(error as ApiErrorResponse, 'Failed to fetch payments');
            return [];
        }
    },

    createPayment: async (payment: Omit<Payment, 'id'>) => {
        try {
            const response = await api.post<Payment>(API_ENDPOINTS.PAYMENTS.CREATE, payment);
            return response.data;
        } catch (error) {
            handleApiError(error as ApiErrorResponse, 'Failed to create payment');
            throw error;
        }
    },

    updatePayment: async (id: number, payment: Partial<Payment>) => {
        try {
            const response = await api.put<Payment>(API_ENDPOINTS.PAYMENTS.UPDATE(id), payment);
            return response.data;
        } catch (error) {
            handleApiError(error as ApiErrorResponse, 'Failed to update payment');
            throw error;
        }
    },

    getPaymentsByOrder: async (orderId: number) => {
        try {
            const response = await api.get<Payment[]>(`${API_ENDPOINTS.PAYMENTS.LIST}?order_id=${orderId}`);
            return response.data;
        } catch (error) {
            handleApiError(error as ApiErrorResponse, 'Failed to fetch payments for order');
            return [];
        }
    },
};
