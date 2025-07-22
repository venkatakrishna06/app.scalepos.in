import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {paymentService} from '@/lib/api/services/payment.service';
import {Payment} from '@/types';
import {toast} from '@/lib/toast';
import {useErrorHandler} from '@/lib/hooks/useErrorHandler';

export const usePayment = () => {
    const queryClient = useQueryClient();
    // Initialize the error handler hook
    const { handleError } = useErrorHandler();

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
        mutationFn: async (payment: Omit<Payment, 'id'>) => {
            const result = await paymentService.createPayment(payment);
            // If result is null, an error occurred and was already handled by the service
            if (result === null) {
                throw new Error('Operation failed');
            }
            return result;
        },
        onSuccess: () => {
            // Invalidate payments queries to trigger refetch
            queryClient.invalidateQueries({queryKey: ['payments']});
            // Still show success toast here as this is a positive outcome
            toast.success('Payment created successfully');
        },
        // No need for onError as errors are handled in the service layer
    });

    // Mutation to update a payment
    const updatePaymentMutation = useMutation({
        mutationFn: async ({id, payment}: { id: number; payment: Partial<Payment> }) => {
            const result = await paymentService.updatePayment(id, payment);
            // If result is null, an error occurred and was already handled by the service
            if (result === null) {
                throw new Error('Operation failed');
            }
            return result;
        },
        onSuccess: () => {
            // Invalidate payments queries to trigger refetch
            queryClient.invalidateQueries({queryKey: ['payments']});
            // Still show success toast here as this is a positive outcome
            toast.success('Payment updated successfully');
        },
        // No need for onError as errors are handled in the service layer
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