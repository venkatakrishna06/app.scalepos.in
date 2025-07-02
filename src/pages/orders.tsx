import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { OrdersSkeleton } from '@/components/skeletons/orders-skeleton';
import { Button } from '@/components/ui/button';
import { useErrorHandler } from '@/lib/hooks/useErrorHandler';
import { useOrder } from '@/lib/hooks/useOrder';
import { toast } from '@/lib/toast';
import { ViewOrdersDialog } from '@/components/view-orders-dialog';
import { Order } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Import role-based components
import { AdminOrderOverview } from '@/components/orders/AdminOrderOverview';
import { ServerOrderView } from '@/components/orders/ServerOrderView';
import { KitchenView } from '@/components/orders/KitchenView';
import {useAuth} from "@/lib/hooks";
export default function Orders() {
  const { handleError } = useErrorHandler();

  // Use React Query hooks instead of Zustand store
  const { useOrdersQuery, cancelOrder, updateOrderStatus, updateOrderItemStatus } = useOrder();
  const{user} = useAuth();

  // State for role selection
  const selectedRole = user?.role;
  // Mock current server name (in a real app, this would come from auth context)
  const currentServer = user?.staff?.name ;

  // State for view orders dialog
  const [isViewOrdersDialogOpen, setIsViewOrdersDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // State for cancel confirmation dialog
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);

  // State for filter parameters
  const [queryParams, setQueryParams] = useState<{
    period?: 'day' | 'week' | 'month';
    start_date?: string;
    end_date?: string;
    table_number?: number;
    order_type?: string;
  }>({});

  // Use React Query to fetch orders
  const {
    data: orders = [],
    isLoading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders
  } = useOrdersQuery(queryParams);

  // Set up polling for orders when the dialog is open
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (isViewOrdersDialogOpen && selectedOrderId !== null) {
      // Initial refetch
      refetchOrders();

      // Set up polling every 3 seconds
      intervalId = setInterval(() => {
        refetchOrders();
      }, 3000);
    }

    // Cleanup interval on unmount or when dialog closes
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isViewOrdersDialogOpen, selectedOrderId, refetchOrders]);

  // Update selectedOrder when orders data changes
  useEffect(() => {
    if (orders.length > 0 && selectedOrderId && isViewOrdersDialogOpen) {
      const updatedOrder = orders.find(order => order.id === selectedOrderId);
      if (updatedOrder) {
        setSelectedOrder(updatedOrder);
      }
    }
  }, [orders, selectedOrderId, isViewOrdersDialogOpen]);

  const refreshOrders = async () => {
    try {
      // Reset all filters to initial state
      setQueryParams({});
      await refetchOrders();
      toast.success('Orders refreshed successfully');
    } catch (err) {
      handleError(err);
    }
  }

  // Show cancel confirmation dialog
  const showCancelConfirmation = (order: Order) => {
    setOrderToCancel(order);
    setIsCancelDialogOpen(true);
  };

  // Handle canceling an order after confirmation
  const handleCancelOrder = async () => {
    if (!orderToCancel) return;

    try {
      // Use the new cancelOrder mutation that handles all the business logic in the backend
      await cancelOrder({
        id: orderToCancel.id,
        reason: 'Cancelled by user'
      });

      // Refresh orders to update the UI
      await refetchOrders();
      // Close the dialog
      setIsCancelDialogOpen(false);
      setOrderToCancel(null);
    } catch (err) {
      handleError(err);
    }
  }

  // Handle editing an order
  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setSelectedOrderId(order.id);
    setIsViewOrdersDialogOpen(true);
  }

  // Handle updating order status (for kanban view)
  const handleUpdateOrderStatus = async (orderId: number, newStatus: Order['status']) => {
    try {
      // Use the new updateOrderStatus function that handles all the business logic in the backend
      await updateOrderStatus({
        id: orderId,
        status: newStatus
      });

      await refetchOrders();
    } catch (err) {
      handleError(err);
    }
  }

  // Handle updating individual item status
  const handleItemStatusChange = async (orderId: number, itemId: number, newStatus: string) => {
    try {
      // Use the new updateOrderItemStatus function that handles all the business logic in the backend
      await updateOrderItemStatus({
        itemId,
        status: newStatus
      });

      await refetchOrders();
    } catch (err) {
      handleError(err);
    }
  }

  // Handle closing the view orders dialog
  const handleCloseViewOrdersDialog = () => {
    setIsViewOrdersDialogOpen(false);
    setSelectedOrder(null);
    setSelectedOrderId(null);
    // Refresh orders to update the UI with any changes made in the dialog
    refetchOrders();
  }

  // Loading state
  if (ordersLoading) {
    return <OrdersSkeleton />;
  }
  console.log(selectedOrder);

  // Error state
  if (ordersError) {
    return (
        <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
          <div className="mx-auto max-w-md text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Error Loading Orders</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {ordersError instanceof Error ? ordersError.message : 'An error occurred while loading orders'}
            </p>
            <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  refetchOrders();
                }}
            >
              Try Again
            </Button>
          </div>
        </div>
    );
  }

  return (
      <div className="space-y-6">
        {/* Render the appropriate component based on the selected role */}
        {selectedRole === 'admin' && (
            <AdminOrderOverview
                orders={orders}
                onEditOrder={handleEditOrder}
                onCancelOrder={showCancelConfirmation}
                onRefreshOrders={refreshOrders}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onItemStatusChange={handleItemStatusChange}
            />
        )}

        {selectedRole === 'server' && (
            <ServerOrderView
                orders={orders}
                currentServer={currentServer}
                onMarkItemAsServed={(orderId, itemId) => handleItemStatusChange(orderId, itemId, 'served')}
                onMarkOrderAsPaid={(orderId) => handleUpdateOrderStatus(orderId, 'paid')}
                onPrintBill={(orderId) => toast.success(`Printing bill for order #${orderId}`)}
            />
        )}

        {selectedRole === 'kitchen' && (
            <KitchenView
                orders={orders}
                onItemStatusChange={handleItemStatusChange}
            />
        )}

        {/* View Orders Dialog for editing orders */}
        {selectedOrder && (
            <ViewOrdersDialog
                open={isViewOrdersDialogOpen}
                orders={[selectedOrder]}
                onClose={handleCloseViewOrdersDialog}
            />
        )}

        {/* Cancel Order Confirmation Dialog */}
        <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Order</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel this order? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                Order #{orderToCancel?.id} - {orderToCancel?.order_type === 'takeaway' ? 'Takeaway' : orderToCancel?.order_type === 'quick-bill' ? 'Quick Bill' : `Table ${orderToCancel?.table?.table_number || 'Unknown'}`}
              </p>
            </div>
            <DialogFooter>
              <Button
                  variant="outline"
                  onClick={() => setIsCancelDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                  variant="destructive"
                  onClick={handleCancelOrder}
              >
                Yes, Cancel Order
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
}
