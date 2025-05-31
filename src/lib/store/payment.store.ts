import {create} from 'zustand';
import {Payment} from '@/types';
import {paymentService} from '@/lib/api/services/payment.service';
import {toast} from '@/lib/toast';

interface PaymentState {
  payments: Payment[];
  loading: boolean;
  error: string | null;
  fetchPayments: () => Promise<void>;
  addPayment: (payment: Omit<Payment, 'id'>) => Promise<Payment>;
  updatePaymentStatus: (id: number, status: Payment['status']) => Promise<Payment>;
  getPaymentsByOrder: (orderId: number) => Payment[];
}

/**
 * Store for managing payments
 *
 * This store handles:
 * - Fetching payments from the API
 * - Adding payments
 * - Updating payment status
 * - Getting payments by order ID
 */
export const usePaymentStore = create<PaymentState>((set, get) => ({
  payments: [],
  loading: false,
  error: null,

  fetchPayments: async () => {
    try {
      set({ loading: true, error: null });

      // Fetch from API directly (no caching)
      const payments = await paymentService.getPayments();
      set({ payments });
    } catch (err) {

      const errorMessage = 'Failed to fetch payments';
      set({ error: errorMessage });
      toast.error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },

  addPayment: async (payment) => {
    try {
      set({ loading: true, error: null });
      const newPayment = await paymentService.createPayment(payment);

      // If payment is successful, log a message
      // Note: Order status update is handled by the component to avoid circular dependencies
      if (newPayment.payment_status === 'completed') {

        // The order status should be updated by the component using useOrderStore directly
      }

      set(state => ({ payments: [...state.payments, newPayment] }));
      toast.success('Payment processed successfully');
      return newPayment;
    } catch (err) {

      const errorMessage = 'Failed to process payment';
      set({ error: errorMessage });
      toast.error(errorMessage);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  updatePaymentStatus: async (id, status) => {
    try {
      set({ loading: true, error: null });
      const updatedPayment = await paymentService.updatePayment(id, { payment_status: status });

      // If payment is now completed, log a message
      // Note: Order status update is handled by the component to avoid circular dependencies
      if (status === 'completed') {

        // The order status should be updated by the component using useOrderStore directly
      }

      set(state => ({
        payments: state.payments.map(payment =>
            payment.id === id ? updatedPayment : payment
        ),
      }));

      toast.success(`Payment status updated to ${status}`);
      return updatedPayment;
    } catch (err) {

      const errorMessage = 'Failed to update payment status';
      set({ error: errorMessage });
      toast.error(errorMessage);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  getPaymentsByOrder: (orderId) => {
    return get().payments.filter(payment => payment.order_id === orderId);
  },
}));
