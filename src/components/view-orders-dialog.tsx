import {Dialog, DialogContent, DialogHeader, DialogTitle} from './ui/dialog';
import {Order} from '@/types';
import {toast} from '@/lib/toast';
import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {useOrder} from '@/lib/hooks/useOrder';
import {usePermissions} from '@/hooks/usePermissions';
import {EmptyOrdersState} from './order/EmptyOrdersState';
import {OrderDetails} from "@/components/order/OrderDetails.tsx";
import {Skeleton} from "@/components/ui/skeleton";
import {Card, CardHeader, CardContent, CardFooter} from '@/components/ui/card';
import {Separator} from '@/components/ui/separator';

interface ViewOrdersDialogProps {
  open: boolean;
  onClose: () => void;
  tableId: number | null;
  onPayment?: (order: Order) => void;
}

export function ViewOrdersDialog({ open, onClose, tableId, onPayment }: ViewOrdersDialogProps) {
  const { updateOrderItem, updateOrderItemStatus, cancelOrderItem, useOrdersByTableQuery } = useOrder();
  const { isServer } = usePermissions();
  const [processingItemId, setProcessingItemId] = useState<number | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Use React Query to get the latest orders data with polling enabled
  const { data: latestOrders, isLoading, refetch } = useOrdersByTableQuery(tableId);

  // Use the fetched orders
  const currentOrders = useMemo(() => latestOrders || [], [latestOrders]);

  // Refresh the data when the dialog is opened or tableId changes
  useEffect(() => {
    if (open && tableId) {
      refetch();
    }
  }, [open, tableId, refetch]);

  // Refresh the data when an item is cancelled or updated
  useEffect(() => {
    if (refreshTrigger > 0) {
      refetch();
    }
  }, [refreshTrigger, refetch]);

  // Filter active orders (not paid or cancelled) - memoized to prevent unnecessary recalculations
  const activeOrders = useMemo(() =>
    currentOrders.filter(order => order.status !== 'paid' && order.status !== 'cancelled'),
    [currentOrders]
  );

  // Set the first order as active if none is selected and there are orders
  if (activeOrders.length > 0 && activeOrderId === null) {
    setActiveOrderId(activeOrders[0].id);
  }

  // Helper function to get the order total, either from the API or calculated from items
  const getOrderTotal = useCallback((activeOrders: Order) => {
    // If the order has a total_amount from the API, use it
    if (activeOrders.total_amount) {
      return activeOrders.total_amount;
    }

    // Otherwise, calculate it from the items (for backward compatibility)
    const nonCancelledItems = activeOrders?.items?.filter(item => item.status !== 'cancelled') || [];
    return nonCancelledItems.reduce((total, item) => total + (item.quantity * item.price), 0);
  }, []);

  // Helper function to get GST details from the order
  const getGstDetails = useCallback((activeOrders: Order) => {
    return {
      subTotal: activeOrders.sub_total || 0,
      sgstRate: activeOrders.sgst_rate || 0,
      cgstRate: activeOrders.cgst_rate || 0,
      sgstAmount: activeOrders.sgst_amount || 0,
      cgstAmount: activeOrders.cgst_amount || 0,
      totalGstAmount: (activeOrders.sgst_amount || 0) + (activeOrders.cgst_amount || 0),
    };
  }, []);

  // Get status badge color based on status
  const getStatusBadgeClass = useCallback((status: string) => {
    switch (status) {
      case 'placed':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'preparing':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'ready':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'served':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  }, []);


  const handleQuantityChange = useCallback(async (orderId: number, itemId: number, delta: number, currentQuantity: number) => {
    if (processingItemId) return;
    if( currentQuantity + delta < 1) {
        toast.error('Quantity cannot be less than 1');
        return;
    }

    // Find the order in currentOrders to ensure we're working with the most up-to-date data
    const order = currentOrders.find(o => o.id === orderId);
    if (!order || order.status === 'preparing') return;

    try {
      setProcessingItemId(itemId);
      const newQuantity = currentQuantity + delta;
      await updateOrderItem({orderId, itemId, updates:{quantity: newQuantity}});

    } catch {
      toast.error('Failed to update order quantity');
    } finally {
      setProcessingItemId(null);
    }
  }, [processingItemId, currentOrders, updateOrderItem, setProcessingItemId]);

  const handleItemStatusChange = useCallback(async (orderId: number, itemId: number, newStatus: Order['items'][0]['status']) => {
    if (processingItemId) return;

    try {
      setProcessingItemId(itemId);
      // Use the new updateOrderItemStatus hook that handles all the business logic in the backend
      await updateOrderItemStatus({ itemId, status: newStatus });
      // Trigger a refresh to update the UI with the latest data
      setRefreshTrigger(prev => prev + 1);

    } catch {
      toast.error('Failed to update item status');
    } finally {
      setProcessingItemId(null);
    }
  }, [processingItemId, updateOrderItemStatus, setProcessingItemId, setRefreshTrigger]);

  // Handle item cancellation and trigger a refresh
  const handleCancelItem = useCallback(async (orderId: number, itemId: number) => {
    if (processingItemId) return;

    try {
      setProcessingItemId(itemId);
      await cancelOrderItem({ orderId, itemId, reason: 'Cancelled by user' });
      // Trigger a refresh to update the UI with the latest data
      setRefreshTrigger(prev => prev + 1);
    } catch {
      toast.error('Failed to cancel item');
    } finally {
      setProcessingItemId(null);
    }
  }, [processingItemId, cancelOrderItem, setProcessingItemId, setRefreshTrigger]);



  // Order details skeleton component
  const OrderDetailsSkeleton = () => (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-0 pt-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-5 w-40" />
          </div>
          <Skeleton className="h-6 w-24" />
        </div>
        <Separator className="my-2" />
      </CardHeader>

      <CardContent className="p-0 px-0 space-y-4">
        <div className="h-[40vh] overflow-y-auto pr-2">
          {/* Desktop view skeleton */}
          <div className="hidden md:block">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-muted-foreground border-b">
                  <th className="pb-2 font-medium">Item</th>
                  <th className="pb-2 font-medium">Qty</th>
                  <th className="pb-2 font-medium">Price</th>
                  <th className="pb-2 font-medium">Total</th>
                  {/*<th className="pb-2 font-medium">Status</th>*/}
                  {/*<th className="pb-2 font-medium">Actions</th>*/}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }, (_, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-3"><Skeleton className="h-5 w-32" /></td>
                    <td className="py-3"><Skeleton className="h-5 w-8" /></td>
                    <td className="py-3"><Skeleton className="h-5 w-16" /></td>
                    <td className="py-3"><Skeleton className="h-5 w-16" /></td>
                    <td className="py-3"><Skeleton className="h-5 w-20" /></td>
                    <td className="py-3"><Skeleton className="h-8 w-24" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile view skeleton */}
          <div className="md:hidden space-y-4">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="border rounded-md p-3">
                <div className="flex justify-between mb-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <div className="flex justify-between mb-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter className="px-0 flex-col sm:flex-row items-start sm:items-center justify-between border-t pt-4">
        <Skeleton className="h-5 w-40 mb-4 sm:mb-0" />
        <div className="flex flex-col sm:flex-row items-end gap-4 w-full sm:w-auto">
          <div className="text-right">
            <div className="text-xs text-muted-foreground mb-1 space-y-0.5">
              <Skeleton className="h-3 w-32 ml-auto" />
              <Skeleton className="h-3 w-40 ml-auto" />
              <Skeleton className="h-3 w-40 ml-auto" />
            </div>
            <Skeleton className="h-6 w-32 ml-auto" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
      </CardFooter>
    </Card>
  );

  return (
    <Dialog open={open}>
      <DialogContent onClose={onClose} className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <OrderDetailsSkeleton />
        ) : activeOrders.length === 0 ? (
          <EmptyOrdersState />
        ) : (
          <OrderDetails
            order={activeOrders[0]}
            onPayment={onPayment}
            handleQuantityChange={handleQuantityChange}
            handleItemStatusChange={handleItemStatusChange}
            handleCancelItem={handleCancelItem}
            processingItemId={processingItemId}
            getOrderTotal={getOrderTotal}
            getGstDetails={getGstDetails}
            getStatusBadgeClass={getStatusBadgeClass}
            isServer={isServer}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
