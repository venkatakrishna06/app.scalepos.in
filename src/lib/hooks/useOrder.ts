import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {orderService} from '@/lib/api/services/order.service';
import {Order, OrderItem} from '@/types';
import {toast} from '@/lib/toast';

export const useOrder = () => {
  const queryClient = useQueryClient();

  // Query to get all orders
  const useOrdersQuery = (params?: {
    period?: 'day' | 'week' | 'month';
    start_date?: string;
    end_date?: string;
    table_number?: number;
  }) => {
    return useQuery({
      queryKey: ['orders', params],
      queryFn: () => orderService.getOrders(params),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Query to get orders by table
  const useOrdersByTableQuery = (tableId: number) => {
    return useQuery({
      queryKey: ['orders', 'table', tableId],
      queryFn: () => orderService.getOrdersByTable(tableId),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Mutation to create an order
  const createOrderMutation = useMutation({
    mutationFn: (order: Omit<Order, 'id'>) => orderService.createOrder(order),
    onSuccess: () => {
      // Invalidate orders queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order created successfully');
    },
    onError: (error) => {

      toast.error('Failed to create order');
    },
  });

  // Mutation to update an order
  const updateOrderMutation = useMutation({
    mutationFn: ({ id, order }: { id: number; order: Partial<Order> }) => 
      orderService.updateOrder(id, order),
    onSuccess: (updatedOrder) => {
      // Update the order in the cache
      queryClient.setQueryData(
        ['orders', 'detail', updatedOrder.id], 
        updatedOrder
      );

      // Invalidate orders queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order updated successfully');
    },
    onError: (error) => {

      toast.error('Failed to update order');
    },
  });

  // Mutation to delete an order
  const deleteOrderMutation = useMutation({
    mutationFn: (id: number) => orderService.deleteOrder(id),
    onSuccess: (_, id) => {
      // Remove the order from the cache
      queryClient.removeQueries({ queryKey: ['orders', 'detail', id] });

      // Invalidate orders queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order deleted successfully');
    },
    onError: (error) => {

      toast.error('Failed to delete order');
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
    onSuccess: (_, { orderId }) => {
      // Invalidate the specific order query to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['orders', 'detail', orderId] });

      // Invalidate orders queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order item updated successfully');
    },
    onError: (error) => {

      toast.error('Failed to update order item');
    },
  });

  // Mutation to remove an order item
  const removeOrderItemMutation = useMutation({
    mutationFn: ({ orderId, itemId }: { orderId: number; itemId: number }) => 
      orderService.removeOrderItem(orderId, itemId),
    onSuccess: (_, { orderId }) => {
      // Invalidate the specific order query to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['orders', 'detail', orderId] });

      // Invalidate orders queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Item removed from order');
    },
    onError: (error) => {

      toast.error('Failed to remove order item');
    },
  });

  // Helper function to calculate order totals
  const calculateOrderTotals = (
    items: OrderItem[],
    sgstRate: number,
    cgstRate: number
  ) => {
    const subTotal = items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);

    const sgstAmount = (subTotal * sgstRate) / 100;
    const cgstAmount = (subTotal * cgstRate) / 100;
    const totalAmount = subTotal + sgstAmount + cgstAmount;

    return {
      subTotal,
      sgstAmount,
      cgstAmount,
      totalAmount
    };
  };

  return {
    // Queries
    useOrdersQuery,
    useOrdersByTableQuery,

    // Mutations
    createOrder: createOrderMutation.mutate,
    isCreatingOrder: createOrderMutation.isPending,
    createOrderError: createOrderMutation.error,

    updateOrder: updateOrderMutation.mutate,
    isUpdatingOrder: updateOrderMutation.isPending,
    updateOrderError: updateOrderMutation.error,

    deleteOrder: deleteOrderMutation.mutate,
    isDeletingOrder: deleteOrderMutation.isPending,
    deleteOrderError: deleteOrderMutation.error,

    updateOrderItem: updateOrderItemMutation.mutate,
    isUpdatingOrderItem: updateOrderItemMutation.isPending,
    updateOrderItemError: updateOrderItemMutation.error,

    removeOrderItem: removeOrderItemMutation.mutate,
    isRemovingOrderItem: removeOrderItemMutation.isPending,
    removeOrderItemError: removeOrderItemMutation.error,

    // Helper functions
    calculateOrderTotals,
  };
};
