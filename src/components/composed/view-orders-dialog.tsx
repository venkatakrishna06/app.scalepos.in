import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Order } from '@/types';
import { toast } from '@/lib/toast';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { EmptyOrdersState } from '@/components/composed/EmptyOrdersState';
import { OrderDetails } from "@/components/composed/OrderDetails";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useOrdersByTable, useUpdateOrderItem, useUpdateOrderItemStatus, useCancelOrderItem } from '@/api/orders';

interface ViewOrdersDialogProps {
    open: boolean;
    onClose: () => void;
    tableId: number | null;
    onPayment?: (order: Order) => void;
}

export function ViewOrdersDialog({ open, onClose, tableId, onPayment }: ViewOrdersDialogProps) {
    const [processingItemId, setProcessingItemId] = useState<number | null>(null);
    const [activeOrderId, setActiveOrderId] = useState<number | null>(null);

    const { data: latestOrders = [], isLoading, refetch } = useOrdersByTable(tableId || 0);
    const updateOrderItemMutation = useUpdateOrderItem();
    const updateOrderItemStatusMutation = useUpdateOrderItemStatus();
    const cancelOrderItemMutation = useCancelOrderItem();

    const currentOrders = useMemo(() => latestOrders || [], [latestOrders]);

    useEffect(() => {
        if (open && tableId) {
            refetch();
        }
    }, [open, tableId, refetch]);

    const activeOrders = useMemo(() =>
        currentOrders.filter(order => order.status !== 'paid' && order.status !== 'cancelled'),
        [currentOrders]
    );

    if (activeOrders.length > 0 && activeOrderId === null) {
        setActiveOrderId(activeOrders[0].id);
    }

    const getOrderTotal = useCallback((order: Order) => {
        if (order.total_amount) {
            return order.total_amount;
        }
        const nonCancelledItems = order?.items?.filter(item => item.status !== 'cancelled') || [];
        return nonCancelledItems.reduce((total, item) => total + (item.quantity * item.price), 0);
    }, []);

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
            await updateOrderItemMutation.mutateAsync({ orderId, itemId, updates: { quantity: newQuantity } });
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
            await updateOrderItemStatusMutation.mutateAsync({ itemId, status: newStatus });
        } catch {
            toast.error('Failed to update item status');
        } finally {
            setProcessingItemId(null);
        }
    }, [processingItemId, updateOrderItemStatusMutation]);

    const handleCancelItem = useCallback(async (orderId: number, itemId: number) => {
        if (processingItemId) return;

        try {
            setProcessingItemId(itemId);
            await cancelOrderItemMutation.mutateAsync({ orderId, itemId, reason: 'Cancelled by user' });
        } catch {
            toast.error('Failed to cancel item');
        } finally {
            setProcessingItemId(null);
        }
    }, [processingItemId, cancelOrderItemMutation]);

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
                <div className="h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
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
                                {Array.from({ length: 5 }, (_, i) => (
                                    <tr key={i} className="border-b">
                                        <td className="py-3"><Skeleton className="h-5 w-32" /></td>
                                        <td className="py-3"><Skeleton className="h-5 w-8" /></td>
                                        <td className="py-3"><Skeleton className="h-5 w-16" /></td>
                                        <td className="py-3"><Skeleton className="h-5 w-16" /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
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
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader className="mb-1">
                    <DialogTitle className="text-lg">Order Details</DialogTitle>
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
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
