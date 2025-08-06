import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {Order} from '@/types';
import {toast} from '@/lib/toast';
import  {useCallback, useEffect, useMemo, useState} from 'react';
import {EmptyOrdersState} from '@/components/composed/EmptyOrdersState';
import {OrderDetails} from "@/components/composed/OrderDetails";
import {Skeleton} from "@/components/ui/skeleton";
import {Card, CardContent, CardFooter, CardHeader} from '@/components/ui/card';
import {Separator} from '@/components/ui/separator';
import {
    useCancelOrderItem,
    useOrdersByTable,
    useUpdateOrderItem,
    useUpdateOrderItemStatus
} from '@/api/orders';
import {AlertCircle, Clock, CreditCard, RefreshCw} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {formatTime} from '@/lib/date-utils';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {usePermissions} from '@/hooks/usePermissions';
import {PERMISSIONS} from '@/lib/auth/roles';
import {CancellationReasonDialog} from '@/components/composed/CancellationReasonDialog';

interface ViewOrdersDialogProps {
    open: boolean;
    onClose: () => void;
    tableId: number | null;
    onPayment?: (order: Order) => void;
    orderId?: number;
}

export function ViewOrdersDialog({open, onClose, tableId, onPayment, orderId}: ViewOrdersDialogProps) {
    const [processingItemId, setProcessingItemId] = useState<number | null>(null);
    const [activeOrderId, setActiveOrderId] = useState<number | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isItemCancelDialogOpen, setIsItemCancelDialogOpen] = useState(false);
    const [itemToCancel, setItemToCancel] = useState<{orderId: number, itemId: number} | null>(null);
    const {hasPermission} = usePermissions();

    // Use React Query to get the latest orders data
    const {
        data: latestOrders = [],
        isLoading,
        isError,
        error,
        refetch
    } = useOrdersByTable(tableId || 0);

    const updateOrderItemMutation = useUpdateOrderItem();
    const updateOrderItemStatusMutation = useUpdateOrderItemStatus();
    const cancelOrderItemMutation = useCancelOrderItem();

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

    // Filter active orders (not paid or cancelled)
    const activeOrders = useMemo(() =>
            currentOrders.filter(order => order.status !== 'paid' && order.status !== 'cancelled'),
        [currentOrders]
    );

    // Set the first order as active if none is selected and there are orders
    useEffect(() => {
        if (activeOrders.length > 0 && (activeOrderId === null || !activeOrders.find(o => o.id === activeOrderId))) {
            setActiveOrderId(activeOrders[0].id);
        }
    }, [activeOrders, activeOrderId]);

    // Helper function to get the order total
    const getOrderTotal = useCallback((order: Order) => {
        if (order.total_amount) {
            return order.total_amount;
        }
        const nonCancelledItems = order?.items?.filter(item => item.status !== 'cancelled') || [];
        return nonCancelledItems.reduce((total, item) => total + (item.quantity * item.price), 0);
    }, []);

    // Helper function to get GST details from the order
    const getGstDetails = useCallback((order: Order) => {
        return {
            subTotal: order.sub_total || 0,
            sgstRate: order.sgst_rate || 0,
            cgstRate: order.cgst_rate || 0,
            sgstAmount: order.sgst_amount || 0,
            cgstAmount: order.cgst_amount || 0,
            totalGstAmount: (order.sgst_amount || 0) + (order.cgst_amount || 0),
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
        if (currentQuantity + delta < 1) {
            toast.error('Quantity cannot be less than 1');
            return;
        }
        const order = currentOrders.find(o => o.id === orderId);
        if (!order || order.status === 'preparing') return;

        try {
            setProcessingItemId(itemId);
            const newQuantity = currentQuantity + delta;
            await updateOrderItemMutation.mutateAsync({orderId, itemId, updates: {quantity: newQuantity}});
            setRefreshTrigger(prev => prev + 1);
        } catch {
            toast.error('Failed to update order quantity');
        } finally {
            setProcessingItemId(null);
        }
    }, [processingItemId, currentOrders, updateOrderItemMutation]);

    const handleItemStatusChange = useCallback(async (orderId: number, itemId: number, newStatus: string) => {
        if (processingItemId) return;

        try {
            setProcessingItemId(itemId);
            await updateOrderItemStatusMutation.mutateAsync({itemId, status: newStatus});
            setRefreshTrigger(prev => prev + 1);
        } catch {
            toast.error('Failed to update item status');
        } finally {
            setProcessingItemId(null);
        }
    }, [processingItemId, updateOrderItemStatusMutation]);

    const showItemCancellationDialog = useCallback((orderId: number, itemId: number) => {
        setItemToCancel({ orderId, itemId });
        setIsItemCancelDialogOpen(true);
    }, []);

    const handleCancelItem = useCallback(async (orderId: number, itemId: number, reason: string) => {
        if (processingItemId) return;

        try {
            setProcessingItemId(itemId);
            await cancelOrderItemMutation.mutateAsync({orderId, itemId, reason});
            setRefreshTrigger(prev => prev + 1);
            toast.success('Item cancelled successfully');
        } catch {
            toast.error('Failed to cancel item');
        } finally {
            setProcessingItemId(null);
        }
    }, [processingItemId, cancelOrderItemMutation]);

    // Order details skeleton component
    const OrderDetailsSkeleton = () => (
        <Card className="border-0 shadow-none">
            <CardHeader className="px-0 pt-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <Skeleton className="h-7 w-32"/>
                        <Skeleton className="h-5 w-40"/>
                    </div>
                    <Skeleton className="h-6 w-24"/>
                </div>
                <Separator className="my-2"/>
            </CardHeader>

            <CardContent className="p-0 px-0 space-y-4">
                <div className="h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                    {/* Desktop view skeleton */}
                    <div className="hidden md:block">
                        <table className="w-full">
                            <thead>
                            <tr className="text-left text-sm text-muted-foreground border-b">
                                <th className="pb-2 font-medium">Item</th>
                                <th className="pb-2 font-medium">Qty</th>
                                <th className="pb-2 font-medium">Price</th>
                                <th className="pb-2 font-medium">Total</th>
                            </tr>
                            </thead>
                            <tbody>
                            {Array.from({length: 5}, (_, i) => (
                                <tr key={i} className="border-b">
                                    <td className="py-3"><Skeleton className="h-5 w-32"/></td>
                                    <td className="py-3"><Skeleton className="h-5 w-8"/></td>
                                    <td className="py-3"><Skeleton className="h-5 w-16"/></td>
                                    <td className="py-3"><Skeleton className="h-5 w-16"/></td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile view skeleton */}
                    <div className="md:hidden space-y-4">
                        {Array.from({length: 3}, (_, i) => (
                            <div key={i} className="border rounded-md p-3">
                                <div className="flex justify-between mb-2">
                                    <Skeleton className="h-5 w-32"/>
                                    <Skeleton className="h-5 w-16"/>
                                </div>
                                <div className="flex justify-between mb-2">
                                    <Skeleton className="h-4 w-20"/>
                                    <Skeleton className="h-4 w-12"/>
                                </div>
                                <div className="flex justify-between">
                                    <Skeleton className="h-6 w-24"/>
                                    <Skeleton className="h-8 w-20"/>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>

            <CardFooter className="px-0 flex-col sm:flex-row items-start sm:items-center justify-between border-t pt-4">
                <Skeleton className="h-5 w-40 mb-4 sm:mb-0"/>
                <div className="flex flex-col sm:flex-row items-end gap-4 w-full sm:w-auto">
                    <div className="text-right">
                        <div className="text-xs text-muted-foreground mb-1 space-y-0.5">
                            <Skeleton className="h-3 w-32 ml-auto"/>
                            <Skeleton className="h-3 w-40 ml-auto"/>
                            <Skeleton className="h-3 w-40 ml-auto"/>
                        </div>
                        <Skeleton className="h-6 w-32 ml-auto"/>
                    </div>
                    <Skeleton className="h-9 w-24"/>
                </div>
            </CardFooter>
        </Card>
    );

    // Order summary card component
    const OrderSummaryCard = ({order, isActive}: {order: Order, isActive: boolean}) => (
        <Card 
            className={`cursor-pointer transition-all hover:border-primary ${isActive ? 'border-primary bg-primary/5' : ''}`}
            onClick={() => setActiveOrderId(order.id)}
        >
            <CardContent className="p-3">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="font-medium">Order #{order.id}</h3>
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTime(order.order_time)}
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-medium">₹{getOrderTotal(order).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{order.items.length} items</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    // Error display component
    const ErrorDisplay = () => (
        <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
                {error instanceof Error ? error.message : 'Failed to load orders'}
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => refetch()}
                >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                </Button>
            </AlertDescription>
        </Alert>
    );

    // Get the currently active order
    const activeOrder = useMemo(() => 
        activeOrders.find(order => order.id === activeOrderId) || activeOrders[0],
        [activeOrders, activeOrderId]
    );

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClose={onClose}>
                <DialogHeader className="mb-1">
                    <DialogTitle className="text-lg">
                        {tableId ? `Table ${tableId} - Orders` : 'Order Details'}
                    </DialogTitle>
                </DialogHeader>

                {isError && <ErrorDisplay />}

                {isLoading ? (
                    <OrderDetailsSkeleton/>
                ) : activeOrders.length === 0 ? (
                    <EmptyOrdersState/>
                ) : (
                    <div className="flex flex-col h-full overflow-hidden">
                        {activeOrders.length > 1 && (
                            <div className="mb-4">
                                <h3 className="text-sm font-medium mb-2">Active Orders ({activeOrders.length})</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                    {activeOrders.map(order => (
                                        <OrderSummaryCard 
                                            key={order.id} 
                                            order={order} 
                                            isActive={order.id === activeOrderId}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeOrder && (
                            <div className="flex-1 overflow-hidden flex flex-col">
                                <OrderDetails
                                    order={activeOrder}
                                    onPayment={hasPermission(PERMISSIONS.CREATE_PAYMENT) ? onPayment : undefined}
                                    handleQuantityChange={handleQuantityChange}
                                    handleItemStatusChange={handleItemStatusChange}
                                    handleCancelItem={showItemCancellationDialog}
                                    processingItemId={processingItemId}
                                    getOrderTotal={getOrderTotal}
                                    getGstDetails={getGstDetails}
                                    getStatusBadgeClass={getStatusBadgeClass}
                                />
                            </div>
                        )}

                        {hasPermission(PERMISSIONS.CREATE_PAYMENT) && activeOrder && (
                            <div className="mt-4 flex justify-end">
                                <Button 
                                    onClick={() => onPayment && onPayment(activeOrder)}
                                    className="w-full sm:w-auto"
                                >
                                    <CreditCard className="mr-2 h-4 w-4"/>
                                    Process Payment
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Cancellation Reason Dialog for Items */}
                <CancellationReasonDialog
                    open={isItemCancelDialogOpen}
                    onOpenChange={setIsItemCancelDialogOpen}
                    onConfirm={(reason) => {
                        if (itemToCancel) {
                            handleCancelItem(itemToCancel.orderId, itemToCancel.itemId, reason);
                            setItemToCancel(null);
                            setIsItemCancelDialogOpen(false);
                        }
                    }}
                    title="Cancel Item"
                    description="Please provide a reason for cancelling this item."
                    confirmText="Yes, Cancel Item"
                />
            </DialogContent>
        </Dialog>
    );
}