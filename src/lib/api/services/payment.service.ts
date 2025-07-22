import {api} from '../axios';
import {API_ENDPOINTS} from '../endpoints';
import {Payment} from '@/types';
import {handleApiError, ApiError} from '@/lib/toast';

export const paymentService = {
    getPayments: async () => {
        try {
            const response = await api.get<Payment[]>(API_ENDPOINTS.PAYMENTS.LIST);
            return response.data;
        } catch (error) {
            handleApiError(error as ApiError, 'Failed to fetch payments');
            return [];
        }
    },

    createPayment: async (payment: Omit<Payment, 'id'>) => {
        try {
            const response = await api.post<Payment>(API_ENDPOINTS.PAYMENTS.CREATE, payment);
            return response.data;
        } catch (error) {
            // Use handleApiError to show toast and return the error message
            handleApiError(error as ApiError, 'Failed to create payment');
            // Return null instead of throwing to prevent duplicate error handling
            return null;
        }
    },

    updatePayment: async (id: number, payment: Partial<Payment>) => {
        try {
            const response = await api.put<Payment>(API_ENDPOINTS.PAYMENTS.UPDATE(id), payment);
            return response.data;
        } catch (error) {
            // Use handleApiError to show toast and return the error message
            handleApiError(error as ApiError, 'Failed to update payment');
            // Return null instead of throwing to prevent duplicate error handling
            return null;
        }
    },

    getPaymentsByOrder: async (orderId: number) => {
        try {
            const response = await api.get<Payment[]>(`${API_ENDPOINTS.PAYMENTS.LIST}?order_id=${orderId}`);
            return response.data;
        } catch (error) {
            handleApiError(error as ApiError, 'Failed to fetch payments for order');
            return [];
        }
    },
};
