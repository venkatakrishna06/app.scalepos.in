import {useMemo} from 'react';
import {useDashboardData} from '@/api/dashboardData';
import {toast} from '@/lib/toast';

export const useDashboard = () => {
    const {orders, menuItems, isLoading, isError, refetch} = useDashboardData();

    if (isError) {
        toast.error('Failed to fetch dashboard data');
    }

    const handleRefresh = () => {
        refetch();
    };

    const activeOrders = useMemo(() => orders.filter(order =>
        order.status !== 'paid' && order.status !== 'cancelled'
    ), [orders]);

    const todaySales = useMemo(() => orders
        .filter(order => {
            const orderDate = new Date(order.order_time);
            const today = new Date();
            return orderDate.toDateString() === today.toDateString() && order.status === 'paid';
        })
        .reduce((sum, order) => sum + (order.total_amount || 0), 0), [orders]);

    const tablesInUse = useMemo(() => activeOrders
        .filter(order => order.order_type === 'dine-in')
        .reduce((tables, order) => {
            if (order.table_id && !tables.includes(order.table_id)) {
                tables.push(order.table_id);
            }
            return tables;
        }, [] as number[]).length, [activeOrders]);

    const popularItems = useMemo(() => menuItems
        .map(item => {
            const orderCount = orders.reduce((count, order) => {
                const orderItems = order.items || [];
                const matchingItems = orderItems.filter(orderItem => orderItem.menu_item_id === item.id);
                return count + matchingItems.reduce((sum, orderItem) => sum + orderItem.quantity, 0);
            }, 0);
            return {...item, orderCount};
        })
        .sort((a, b) => b.orderCount - a.orderCount)
        .slice(0, 5), [menuItems, orders]);

    const placedCount = useMemo(() => activeOrders.filter(o => o.status === 'placed').length, [activeOrders]);
    const preparingCount = useMemo(() => activeOrders.filter(o => o.status === 'preparing').length, [activeOrders]);
    const servedCount = useMemo(() => activeOrders.filter(o => o.status === 'served').length, [activeOrders]);
    const availableItemsCount = useMemo(() => menuItems.filter(i => i.available).length, [menuItems]);

    return {
        isLoading,
        handleRefresh,
        todaySales,
        activeOrders,
        activeOrdersCount: activeOrders.length,
        placedCount,
        preparingCount,
        servedCount,
        tablesInUse,
        menuItemsCount: menuItems.length,
        availableItemsCount,
        popularItems,
    };
};
