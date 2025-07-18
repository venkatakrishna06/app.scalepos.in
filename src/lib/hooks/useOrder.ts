import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {orderService} from '@/lib/api/services/order.service';
import {Order, OrderItem} from '@/types';
import {toast} from '@/lib/toast';

// Define types for the new API responses
interface OrderStatusUpdateResponse {
  order: Order;
  allowed_next_states: string[];
}

interface OrderItemStatusUpdateResponse {
  order: Order;
  item: OrderItem;
  allowed_next_item_states: string[];
  allowed_next_order_states: string[];
}

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
    });
  };

  // Query to get orders by table
  const useOrdersByTableQuery = (tableId: number) => {
    return useQuery({
      queryKey: ['orders', 'table', tableId],
      queryFn: () => orderService.getOrdersByTable(tableId),
    });
  };

  // Mutation to create an order
  const createOrderMutation = useMutation({
    mutationFn: (order: Omit<Order, 'id'>) => orderService.createOrder(order),
    onSuccess: () => {
      // Invalidate orders queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: () => {
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
    },
    onError: () => {
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
    onError: () => {
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
    onError: () => {
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
    onError: () => {
      toast.error('Failed to remove order item');
    },
  });

  // New mutations for order status management
  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => 
      orderService.updateOrderStatus(id, status),
    onSuccess: (response: OrderStatusUpdateResponse) => {
      // Update the order in the cache
      queryClient.setQueryData(
        ['orders', 'detail', response.order.id], 
        response.order
      );

      // Invalidate orders queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: () => {
      toast.error('Failed to update order status');
    },
  });

  // Query to get order status history
  const useOrderStatusHistoryQuery = (orderId: number) => {
    return useQuery({
      queryKey: ['orders', 'status-history', orderId],
      queryFn: () => orderService.getOrderStatusHistory(orderId),

    });
  };

  // Mutation to cancel an order
  const cancelOrderMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => 
      orderService.cancelOrder(id, reason),
    onSuccess: (updatedOrder) => {
      // Update the order in the cache
      queryClient.setQueryData(
        ['orders', 'detail', updatedOrder.id], 
        updatedOrder
      );

      // Invalidate orders queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order cancelled successfully');
    },
    onError: () => {
      toast.error('Failed to cancel order');
    },
  });

  // Query to get order cancellations
  const useOrderCancellationsQuery = (orderId: number) => {
    return useQuery({
      queryKey: ['orders', 'cancellations', orderId],
      queryFn: () => orderService.getOrderCancellations(orderId),

    });
  };

  // New mutations for order item status management
  const updateOrderItemStatusMutation = useMutation({
    mutationFn: ({ itemId, status }: { itemId: number; status: string }) => 
      orderService.updateOrderItemStatus(itemId, status),
    onSuccess: (response: OrderItemStatusUpdateResponse) => {
      // Update the order in the cache
      queryClient.setQueryData(
        ['orders', 'detail', response.order.id], 
        response.order
      );

      // Invalidate orders queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success(`Item status updated to ${response.item.status}`);
    },
    onError: () => {
      toast.error('Failed to update item status');
    },
  });

  // Query to get order item status history
  const useOrderItemStatusHistoryQuery = (itemId: number) => {
    return useQuery({
      queryKey: ['order-items', 'status-history', itemId],
      queryFn: () => orderService.getOrderItemStatusHistory(itemId),

    });
  };

  // Mutation to cancel an order item
  const cancelOrderItemMutation = useMutation({
    mutationFn: ({ orderId, itemId, reason }: { orderId: number; itemId: number; reason: string }) => 
      orderService.cancelOrderItem(orderId, itemId, reason),
    onSuccess: (updatedOrder) => {
      // Update the order in the cache
      queryClient.setQueryData(
        ['orders', 'detail', updatedOrder.id], 
        updatedOrder
      );

      // Invalidate orders queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Item cancelled successfully');
    },
    onError: () => {
      toast.error('Failed to cancel item');
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

    // Calculate taxable amount (only for items with include_in_gst = true)
    const taxableAmount = items.reduce((total, item) => {
      // Check if the item has include_in_gst property and it's true
      if (item.include_in_gst === true) {
        return total + (item.price * item.quantity);
      }
      return total;
    }, 0);

    // Calculate tax amounts based on taxable amount
    const sgstAmount = (taxableAmount * sgstRate) / 100;
    const cgstAmount = (taxableAmount * cgstRate) / 100;
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
    useOrderStatusHistoryQuery,
    useOrderCancellationsQuery,
    useOrderItemStatusHistoryQuery,

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

    // New order status management mutations
    updateOrderStatus: updateOrderStatusMutation.mutate,
    isUpdatingOrderStatus: updateOrderStatusMutation.isPending,
    updateOrderStatusError: updateOrderStatusMutation.error,

    // Order cancellation
    cancelOrder: cancelOrderMutation.mutate,
    isCancellingOrder: cancelOrderMutation.isPending,
    cancelOrderError: cancelOrderMutation.error,

    // Order item status management
    updateOrderItemStatus: updateOrderItemStatusMutation.mutate,
    isUpdatingOrderItemStatus: updateOrderItemStatusMutation.isPending,
    updateOrderItemStatusError: updateOrderItemStatusMutation.error,

    // Order item cancellation
    cancelOrderItem: cancelOrderItemMutation.mutate,
    isCancellingOrderItem: cancelOrderItemMutation.isPending,
    cancelOrderItemError: cancelOrderItemMutation.error,

    // Helper functions
    calculateOrderTotals,
  };
};
