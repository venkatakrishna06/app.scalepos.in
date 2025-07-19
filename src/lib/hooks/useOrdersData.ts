import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {orderService} from '@/lib/api/services/order.service';
import {Order, OrderItem} from '@/types';
import {useOrderUIStore} from '@/lib/store/orderUI.store';
import {toast} from '@/lib/toast';
import {useMemo} from 'react';

/**
 * Hook that combines React Query for server state with Zustand for UI state
 * This creates a clear boundary between server and client state
 */
export const useOrdersData = (params?: {
    period?: 'day' | 'week' | 'month';
    start_date?: string;
    end_date?: string;
    table_number?: number;
}) => {
    const queryClient = useQueryClient();

    // Get UI state from Zustand store
    const {
        selectedOrderId,
        setSelectedOrderId,
        filterStatus,
        filterDateRange
    } = useOrderUIStore();

    // Server state with React Query
    const {
        data: orders = [],
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: ['orders', params],
        queryFn: () => orderService.getOrders(params),
        staleTime: 30 * 1000, // 30 seconds
        refetchInterval: 60 * 1000, // Poll every minute for critical data
    });

    // Mutation to create an order
    const createOrderMutation = useMutation({
        mutationFn: (order: Omit<Order, 'id'>) => orderService.createOrder(order),
        onSuccess: (newOrder) => {
            queryClient.invalidateQueries({queryKey: ['orders']});
            setSelectedOrderId(newOrder.id);
            toast.success('Order created successfully');
        },
        onError: (error) => {
            toast.error('Failed to create order', {
                description: error instanceof Error ? error.message : 'Unknown error'
            });
        },
    });

    // Mutation to update an order
    const updateOrderMutation = useMutation({
        mutationFn: ({id, updates}: { id: number; updates: Partial<Order> }) =>
            orderService.updateOrder(id, updates),
        onSuccess: (updatedOrder) => {
            queryClient.setQueryData(['orders', 'detail', updatedOrder.id], updatedOrder);
            queryClient.invalidateQueries({queryKey: ['orders']});
        },
        onError: (error) => {
            toast.error('Failed to update order', {
                description: error instanceof Error ? error.message : 'Unknown error'
            });
        },
    });

    // Mutation to update an order item
    const updateOrderItemMutation = useMutation({
        mutationFn: ({
                         orderId,
                         itemId,
                         updates
                     }: {
            orderId: number;
            itemId: number;
            updates: Partial<OrderItem>
        }) => orderService.updateOrderItem(orderId, itemId, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['orders']});
            toast.success('Order item updated successfully');
        },
        onError: (error) => {
            toast.error('Failed to update order item', {
                description: error instanceof Error ? error.message : 'Unknown error'
            });
        },
    });

    // Derived state - selected order
    const selectedOrder = useMemo(() =>
            orders.find(order => order.id === selectedOrderId) || null,
        [orders, selectedOrderId]
    );

    // Filtered orders based on UI state
    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            // Filter by status if not 'all'
            if (filterStatus !== 'all' && order.status !== filterStatus) {
                return false;
            }

            // Filter by date range if set
            if (filterDateRange.startDate && filterDateRange.endDate) {
                const orderDate = new Date(order.order_time);
                if (orderDate < filterDateRange.startDate || orderDate > filterDateRange.endDate) {
                    return false;
                }
            }

            return true;
        });
    }, [orders, filterStatus, filterDateRange]);

    return {
        // Server state
        orders,
        isLoading,
        error,
        refetch,

        // UI state
        selectedOrderId,
        setSelectedOrderId,
        selectedOrder,
        filteredOrders,

        // Mutations
        createOrder: createOrderMutation.mutate,
        isCreatingOrder: createOrderMutation.isPending,
        createOrderError: createOrderMutation.error,

        updateOrder: updateOrderMutation.mutate,
        isUpdatingOrder: updateOrderMutation.isPending,
        updateOrderError: updateOrderMutation.error,

        updateOrderItem: updateOrderItemMutation.mutate,
        isUpdatingOrderItem: updateOrderItemMutation.isPending,
        updateOrderItemError: updateOrderItemMutation.error,
    };
};