import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useErrorHandler } from '@/lib/hooks/useErrorHandler';
import { toast } from '@/lib/toast';
import { ViewOrdersDialog } from '@/components/composed/view-orders-dialog';
import { Order } from '@/types';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { AdminOrderOverview } from '@/components/composed/AdminOrderOverview';
import { ServerOrderView } from '@/components/composed/ServerOrderView';
import { KitchenView } from '@/components/composed/KitchenView';
import { useAuthStore } from "@/lib/auth/auth.store";
import { useOrders, useCancelOrder, useUpdateOrderStatus, useUpdateOrderItemStatus } from '@/api/orders';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/auth/roles';
import { OrdersSkeleton } from '@/components/composed/orders-skeleton';

export default function Orders() {
    const { handleError } = useErrorHandler();
    const { user } = useAuthStore();
    const { hasPermission } = usePermissions();
    const currentServer = user?.staff?.name;

    const [isViewOrdersDialogOpen, setIsViewOrdersDialogOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);

    const [queryParams, setQueryParams] = useState<{
        period?: 'day' | 'week' | 'month';
        start_date?: string;
        end_date?: string;
        table_number?: number;
        order_type?: string;
    }>({});

    const { data: orders = [], isLoading: ordersLoading, isError: ordersError, error: ordersErrorMessage, refetch: refetchOrders } = useOrders(queryParams);
    const cancelOrderMutation = useCancelOrder();
    const updateOrderStatusMutation = useUpdateOrderStatus();
    const updateOrderItemStatusMutation = useUpdateOrderItemStatus();

    useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null;
        if (isViewOrdersDialogOpen && selectedOrderId !== null) {
            refetchOrders();
            intervalId = setInterval(() => {
                refetchOrders();
            }, 3000);
        }
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [isViewOrdersDialogOpen, selectedOrderId, refetchOrders]);

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
            setQueryParams({});
            await refetchOrders();
            toast.success('Orders refreshed successfully');
        } catch (err) {
            handleError(err);
        }
    }

    const showCancelConfirmation = (order: Order) => {
        setOrderToCancel(order);
        setIsCancelDialogOpen(true);
    };

    const handleCancelOrder = async () => {
        if (!orderToCancel) return;
        try {
            await cancelOrderMutation.mutateAsync({ id: orderToCancel.id, reason: 'Cancelled by user' });
            await refetchOrders();
            setIsCancelDialogOpen(false);
            setOrderToCancel(null);
        } catch (err) {
            handleError(err);
        }
    }

    const handleEditOrder = (order: Order) => {
        setSelectedOrder(order);
        setSelectedOrderId(order.id);
        setIsViewOrdersDialogOpen(true);
    }

    const handleUpdateOrderStatus = async (orderId: number, newStatus: Order['status']) => {
        try {
            await updateOrderStatusMutation.mutateAsync({ id: orderId, status: newStatus });
            await refetchOrders();
        } catch (err) {
            handleError(err);
        }
    }

    const handleItemStatusChange = async (orderId: number, itemId: number, newStatus: string) => {
        try {
            await updateOrderItemStatusMutation.mutateAsync({ itemId, status: newStatus });
            await refetchOrders();
        } catch (err) {
            handleError(err);
        }
    }

    const handleCloseViewOrdersDialog = () => {
        setIsViewOrdersDialogOpen(false);
        setSelectedOrder(null);
        setSelectedOrderId(null);
        refetchOrders();
    }

    if (ordersLoading) {
        return <OrdersSkeleton />;
    }

    if (ordersError) {
        return (
            <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
                <div className="mx-auto max-w-md text-center">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">Error Loading Orders</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {ordersErrorMessage instanceof Error ? ordersErrorMessage.message : 'An error occurred while loading orders'}
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
            {hasPermission(PERMISSIONS.UPDATE_ORDER) && (
                <AdminOrderOverview
                    orders={orders}
                    onEditOrder={handleEditOrder}
                    onCancelOrder={showCancelConfirmation}
                    onRefreshOrders={refreshOrders}
                    onUpdateOrderStatus={handleUpdateOrderStatus}
                    onItemStatusChange={handleItemStatusChange}
                />
            )}

            {hasPermission(PERMISSIONS.CREATE_PAYMENT) && (
                <ServerOrderView
                    orders={orders}
                    currentServer={currentServer || ''}
                    onMarkItemAsServed={(orderId, itemId) => handleItemStatusChange(orderId, itemId, 'served')}
                    onMarkOrderAsPaid={(orderId) => handleUpdateOrderStatus(orderId, 'paid')}
                    onPrintBill={(orderId) => toast.success(`Printing bill for order #${orderId}`)}
                />
            )}

            {hasPermission(PERMISSIONS.READ_ORDER) && (
                <KitchenView
                    orders={orders}
                    onItemStatusChange={handleItemStatusChange}
                />
            )}

            {selectedOrder && (
                <ViewOrdersDialog
                    open={isViewOrdersDialogOpen}
                    tableId={selectedOrder.table_id || null}
                    onClose={handleCloseViewOrdersDialog}
                />
            )}

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
                            Order
                            #{orderToCancel?.id} - {orderToCancel?.order_type === 'takeaway' ? 'Takeaway' : orderToCancel?.order_type === 'quick-bill' ? 'Quick Bill' : `Table ${orderToCancel?.table?.table_number || 'Unknown'}`}
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
