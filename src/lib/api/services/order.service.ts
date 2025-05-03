import { api } from '../axios';
import { API_ENDPOINTS } from '../endpoints';
import { Order } from '@/types';

export const orderService = {
  getOrders: async () => {
    const response = await api.get<Order[]>(API_ENDPOINTS.ORDERS.LIST);
    return response.data;
  },

  createOrder: async (order: Omit<Order, 'id'>) => {
    const response = await api.post<Order>(API_ENDPOINTS.ORDERS.CREATE, order);
    return response.data;
  },

  updateOrder: async (id: number, order: Partial<Order>) => {
    const response = await api.put<Order>(API_ENDPOINTS.ORDERS.UPDATE(id), order);
    return response.data;
  },

  deleteOrder: async (id: number) => {
    await api.delete(API_ENDPOINTS.ORDERS.DELETE(id));
  },

  getOrdersByTable: async (tableId: number) => {
    const response = await api.get<Order[]>(`${API_ENDPOINTS.ORDERS.LIST}?tableId=${tableId}`);
    return response.data;
  },
};