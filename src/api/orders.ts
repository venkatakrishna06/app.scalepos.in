// src/api/orders.ts
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {orderService} from '@/lib/api/services/order.service';
import {Order, OrderItem} from '@/types';

const STALE_TIME = 1000 * 60 * 1; // 1 minute
const CACHE_TIME = 1000 * 60 * 30; // 30 minutes

export const useOrders = (params?: {
    period?: 'day' | 'week' | 'month' | 'all' | 'custom';
    start_date?: string;
    end_date?: string;
    table_number?: number;
}) => {
    return useQuery({
        queryKey: ['orders', params],
        queryFn: () => orderService.getOrders(params),
        staleTime: STALE_TIME,
        gcTime: CACHE_TIME,
    });
};

export const useCreateOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (order: Omit<Order, 'id'>) => orderService.createOrder(order),
        // onSuccess: () => {
        //     queryClient.invalidateQueries({queryKey: ['orders']});
        // },
    });
};

export const useUpdateOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({id, order}: { id: number, order: Partial<Order> }) => orderService.updateOrder(id, order),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['orders']});
        },
    });
};

export const useDeleteOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => orderService.deleteOrder(id),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['orders']});
        },
    });
};

export const useOrdersByTable = (tableId: number) => {
    return useQuery({
        queryKey: ['orders', {tableId}],
        queryFn: () => orderService.getOrdersByTable(tableId),
        staleTime: STALE_TIME,
        gcTime: CACHE_TIME,
        enabled: !!tableId,
    });
};

export const useOrderDetailsById = (orderId: number) => {
    return useQuery({
        queryKey: ['orderDetails', orderId],
        queryFn: () => orderService.getOrderById(orderId),
        staleTime: STALE_TIME,
        gcTime: CACHE_TIME,
        enabled: !!orderId,
    });
};

export const useUpdateOrderStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({id, status}: { id: number, status: string }) => orderService.updateOrderStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['orders']});
        },
    });
};

export const useOrderStatusHistory = (orderId: number) => {
    return useQuery({
        queryKey: ['orderStatusHistory', orderId],
        queryFn: () => orderService.getOrderStatusHistory(orderId),
        staleTime: STALE_TIME,
        gcTime: CACHE_TIME,
        enabled: !!orderId,
    });
};

export const useCancelOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({id, reason}: { id: number, reason: string }) => orderService.cancelOrder(id, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['orders']});
        },
    });
};

export const useOrderCancellations = (orderId: number) => {
    return useQuery({
        queryKey: ['orderCancellations', orderId],
        queryFn: () => orderService.getOrderCancellations(orderId),
        staleTime: STALE_TIME,
        gcTime: CACHE_TIME,
        enabled: !!orderId,
    });
};

export const useUpdateOrderItem = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({orderId, itemId, updates}: { orderId: number, itemId: number, updates: Partial<OrderItem> }) =>
            orderService.updateOrderItem(orderId, itemId, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['orders']});
        },
    });
};

export const useUpdateOrderItemStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({itemId, status}: {
            itemId: number,
            status: string
        }) => orderService.updateOrderItemStatus(itemId, status),
        // onSuccess: () => {
        //     queryClient.invalidateQueries({queryKey: ['orders']});
        // },
    });
};

export const useOrderItemStatusHistory = (itemId: number) => {
    return useQuery({
        queryKey: ['orderItemStatusHistory', itemId],
        queryFn: () => orderService.getOrderItemStatusHistory(itemId),
        staleTime: STALE_TIME,
        gcTime: CACHE_TIME,
        enabled: !!itemId,
    });
};

export const useCancelOrderItem = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({orderId, itemId, reason}: { orderId: number, itemId: number, reason: string }) =>
            orderService.cancelOrderItem(orderId, itemId, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['orders']});
        },
    });
};

export const useOrderItemCancellations = (itemId: number) => {
    return useQuery({
        queryKey: ['orderItemCancellations', itemId],
        queryFn: () => orderService.getOrderItemCancellations(itemId),
        staleTime: STALE_TIME,
        gcTime: CACHE_TIME,
        enabled: !!itemId,
    });
};

export const useRemoveOrderItem = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({orderId, itemId}: { orderId: number, itemId: number }) =>
            orderService.removeOrderItem(orderId, itemId),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['orders']});
        },
    });
};
