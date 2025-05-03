import { api } from '../axios';
import { API_ENDPOINTS } from '../endpoints';
import { Payment } from '@/types';

export const paymentService = {
  getPayments: async () => {
    const response = await api.get<Payment[]>(API_ENDPOINTS.PAYMENTS.LIST);
    return response.data;
  },

  createPayment: async (payment: Omit<Payment, 'id'>) => {
    const response = await api.post<Payment>(API_ENDPOINTS.PAYMENTS.CREATE, payment);
    return response.data;
  },

  updatePayment: async (id: number, payment: Partial<Payment>) => {
    const response = await api.put<Payment>(API_ENDPOINTS.PAYMENTS.UPDATE(id), payment);
    return response.data;
  },
};