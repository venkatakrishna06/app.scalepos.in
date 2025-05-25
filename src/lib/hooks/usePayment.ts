import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {paymentService} from '@/lib/api/services/payment.service';
import {Payment} from '@/types';
import {toast} from '@/lib/toast';

export const usePayment = () => {
  const queryClient = useQueryClient();

  // Query to get all payments
  const usePaymentsQuery = () => {
    return useQuery({
      queryKey: ['payments'],
      queryFn: () => paymentService.getPayments(),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Query to get payments by order
  const usePaymentsByOrderQuery = (orderId: number) => {
    return useQuery({
      queryKey: ['payments', 'order', orderId],
      queryFn: () => paymentService.getPaymentsByOrder(orderId),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Mutation to create a payment
  const createPaymentMutation = useMutation({
    mutationFn: (payment: Omit<Payment, 'id'>) => paymentService.createPayment(payment),
    onSuccess: () => {
      // Invalidate payments queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Payment created successfully');
    },
    onError: (error) => {
      console.error('Failed to create payment:', error);
      toast.error('Failed to create payment');
    },
  });

  // Mutation to update a payment
  const updatePaymentMutation = useMutation({
    mutationFn: ({ id, payment }: { id: number; payment: Partial<Payment> }) => 
      paymentService.updatePayment(id, payment),
    onSuccess: () => {
      // Invalidate payments queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Payment updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update payment:', error);
      toast.error('Failed to update payment');
    },
  });

  return {
    // Queries
    usePaymentsQuery,
    usePaymentsByOrderQuery,
    
    // Mutations
    createPayment: createPaymentMutation.mutate,
    isCreatingPayment: createPaymentMutation.isPending,
    createPaymentError: createPaymentMutation.error,
    
    updatePayment: updatePaymentMutation.mutate,
    isUpdatingPayment: updatePaymentMutation.isPending,
    updatePaymentError: updatePaymentMutation.error,
  };
};