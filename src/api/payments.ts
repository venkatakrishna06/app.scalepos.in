// src/api/payments.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentService } from '@/lib/api/services/payment.service';
import { Payment } from '@/types';

const STALE_TIME = 1000 * 60 * 5; // 5 minutes
const CACHE_TIME = 1000 * 60 * 60; // 1 hour

export const usePayments = () => {
    return useQuery({
        queryKey: ['payments'],
        queryFn: paymentService.getPayments,
        staleTime: STALE_TIME,
        gcTime: CACHE_TIME,
    });
};

export const useCreatePayment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payment: Omit<Payment, 'id'>) => paymentService.createPayment(payment),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payments'] });
        },
    });
};

export const useUpdatePayment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payment }: { id: number, payment: Partial<Payment> }) => paymentService.updatePayment(id, payment),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payments'] });
        },
    });
};

export const usePaymentsByOrder = (orderId: number) => {
    return useQuery({
        queryKey: ['payments', { orderId }],
        queryFn: () => paymentService.getPaymentsByOrder(orderId),
        staleTime: STALE_TIME,
        gcTime: CACHE_TIME,
        enabled: !!orderId,
    });
};
