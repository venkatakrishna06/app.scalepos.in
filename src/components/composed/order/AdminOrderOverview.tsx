
import { AdminOrderOverview as AdminOrderOverviewComponent } from '@/components/composed/AdminOrderOverview';
import { Order } from '@/types';

interface AdminOrderOverviewProps {
    orders: Order[];
    onEditOrder: (order: Order) => void;
    onCancelOrder: (order: Order) => void;
    onRefreshOrders: () => void;
    onUpdateOrderStatus: (orderId: number, newStatus: Order['status']) => void;
    onItemStatusChange: (orderId: number, itemId: number, newStatus: string) => void;
}

export function AdminOrderOverview({
    orders,
    onEditOrder,
    onCancelOrder,
    onRefreshOrders,
    onUpdateOrderStatus,
    onItemStatusChange
}: AdminOrderOverviewProps) {
    return (
        <AdminOrderOverviewComponent
            orders={orders}
            onEditOrder={onEditOrder}
            onCancelOrder={onCancelOrder}
            onRefreshOrders={onRefreshOrders}
            onUpdateOrderStatus={onUpdateOrderStatus}
            onItemStatusChange={onItemStatusChange}
        />
    );
}
