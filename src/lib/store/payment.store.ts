import {create} from 'zustand';
import {Payment} from '@/types';
import {paymentService} from '@/lib/api/services/payment.service';
import {toast} from '@/lib/toast';
import {CACHE_KEYS, cacheService} from '@/lib/services/cache.service';

interface PaymentState {
  payments: Payment[];
  loading: boolean;
  error: string | null;
  fetchPayments: (skipCache?: boolean) => Promise<void>;
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

  fetchPayments: async (skipCache = false) => {
    try {
      set({ loading: true, error: null });

      // Try to get data from cache first if skipCache is false
      if (!skipCache) {
        const cachedPayments = cacheService.getCache<Payment[]>(CACHE_KEYS.PAYMENTS);
        if (cachedPayments) {
          console.log('Using cached payments data');
          set({ payments: cachedPayments });
          set({ loading: false });

          // Fetch in background to update cache silently
          paymentService.getPayments().then(freshPayments => {
            cacheService.setCache(CACHE_KEYS.PAYMENTS, freshPayments);
            set({ payments: freshPayments });
          }).catch(err => {
            console.error('Background fetch for payments failed:', err);
          });

          return;
        }
      }

      // If skipCache is true or no valid cache, fetch from API
      const payments = await paymentService.getPayments();

      // Update cache
      cacheService.setCache(CACHE_KEYS.PAYMENTS, payments);

      set({ payments });
    } catch (err) {
      console.error('Failed to fetch payments:', err);
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
        console.log('Payment completed for order:', newPayment.order_id);
        // The order status should be updated by the component using useOrderStore directly
      }

      set(state => ({ payments: [...state.payments, newPayment] }));
      toast.success('Payment processed successfully');
      return newPayment;
    } catch (err) {
      console.error('Failed to add payment:', err);
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
        console.log('Payment status updated to completed for order:', updatedPayment.order_id);
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
      console.error('Failed to update payment status:', err);
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
