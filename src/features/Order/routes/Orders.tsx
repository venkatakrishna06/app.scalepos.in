import {FileText} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {ViewOrdersDialog} from '@/components/composed/view-orders-dialog';
import {AdminOrderOverview} from '@/components/composed/order/AdminOrderOverview';
import {ServerOrderView} from '@/components/composed/order/ServerOrderView';
import {KitchenView} from '@/components/composed/order/KitchenView';
import {useAuthStore} from "@/lib/auth/auth.store";
import {usePermissions} from '@/hooks/usePermissions';
import {OrdersSkeleton} from '@/components/composed/orders-skeleton';
import {useOrdersPage} from '@/hooks/useOrdersPage';
import {CancellationReasonDialog} from '@/components/composed/CancellationReasonDialog';

export default function Orders() {
    const {user} = useAuthStore();
    const currentServer = user?.staff?.name;

    const {
        orders,
        ordersLoading,
        ordersError,
        ordersErrorMessage,
        refetchOrders,
        isViewOrdersDialogOpen,
        selectedOrder,
        isCancelDialogOpen,
        setIsCancelDialogOpen,
        orderToCancel,
        refreshOrders,
        showCancelConfirmation,
        handleCancelOrder,
        handleEditOrder,
        handleUpdateOrderStatus,
        handleItemStatusChange,
        handleCloseViewOrdersDialog,
        filterTimeframe,
        setFilterTimeframe,
    } = useOrdersPage();
    const {isAdmin, isManager, isServer, isKitchen} = usePermissions();

    if (ordersLoading) {
        return <OrdersSkeleton/>;
    }

    if (ordersError) {
        return (
            <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
                <div className="mx-auto max-w-md text-center">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground"/>
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
{(isAdmin() || isManager()) && (
    <AdminOrderOverview
        orders={orders}
        onEditOrder={handleEditOrder}
        onCancelOrder={showCancelConfirmation}
        onRefreshOrders={refreshOrders}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onItemStatusChange={handleItemStatusChange}
        filterTimeframe={filterTimeframe}
        setFilterTimeframe={setFilterTimeframe}
    />
)}

            {isServer() && (
                <ServerOrderView
                    orders={orders}
                    currentServer={currentServer || ''}
                    onMarkItemAsServed={(orderId, itemId) => handleItemStatusChange(orderId, itemId, 'served')}
                    onMarkOrderAsPaid={(orderId) => handleUpdateOrderStatus(orderId, 'paid')}
                />
            )}

            {isKitchen() && (
                <KitchenView
                    orders={orders}
                    onItemStatusChange={handleItemStatusChange}
                />
            )}

            {selectedOrder && (
                <ViewOrdersDialog
                    open={isViewOrdersDialogOpen}
                    tableId={selectedOrder.table_id || null}
                    orderId = {selectedOrder.id}
                    onClose={handleCloseViewOrdersDialog}
                />
            )}

            <CancellationReasonDialog
                open={isCancelDialogOpen}
                onOpenChange={setIsCancelDialogOpen}
                onConfirm={handleCancelOrder}
                title="Cancel Order"
                description={`Please provide a reason for cancelling this order. Order #${orderToCancel?.id} - ${orderToCancel?.order_type === 'takeaway' ? 'Takeaway' : orderToCancel?.order_type === 'quick-bill' ? 'Quick Bill' : `Table ${orderToCancel?.table?.table_number || 'Unknown'}`}`}
                confirmText="Yes, Cancel Order"
            />
        </div>
    );
}
