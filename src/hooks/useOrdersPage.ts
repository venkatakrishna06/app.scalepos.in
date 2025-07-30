import {useCallback, useEffect, useMemo, useState} from 'react';
import {useCancelOrder, useOrders, useUpdateOrderItemStatus, useUpdateOrderStatus} from '@/api/orders';
import {Order} from '@/types';

import {toast} from '@/lib/toast';
import {format as formatDate, isToday, isYesterday, subDays} from 'date-fns';

type SortField = 'newest' | 'oldest' | 'highest' | 'lowest';

export const useOrdersPage = () => {
    const [queryParams, setQueryParams] = useState<{
        period?: 'day' | 'week' | 'month';
        start_date?: string;
        end_date?: string;
        table_number?: number;
        order_type?: string;
    }>({});

    const {
        data: orders = [],
        isLoading: ordersLoading,
        isError: ordersError,
        error: ordersErrorMessage,
        refetch: refetchOrders
    } = useOrders(queryParams);

    const cancelOrderMutation = useCancelOrder();
    const updateOrderStatusMutation = useUpdateOrderStatus();
    const updateOrderItemStatusMutation = useUpdateOrderItemStatus();

    const [isViewOrdersDialogOpen, setIsViewOrdersDialogOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);

    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterTimeframe, setFilterTimeframe] = useState<string>('today');
    const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('all');
    const [filterOrderType, setFilterOrderType] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortField>('newest');
    const [activeTab, setActiveTab] = useState<string>('all');

    useEffect(() => {
        if (orders.length > 0 && selectedOrderId && isViewOrdersDialogOpen) {
            const updatedOrder = orders.find(order => order.id === selectedOrderId);
            if (updatedOrder) {
                setSelectedOrder(updatedOrder);
            }
        }
    }, [orders, selectedOrderId, isViewOrdersDialogOpen]);

    const refreshOrders = useCallback(async () => {
        try {
            setQueryParams({});
            await refetchOrders();
            toast.success('Orders refreshed successfully');
        } catch (err) {
        }
    }, [refetchOrders]);

    const showCancelConfirmation = useCallback((order: Order) => {
        setOrderToCancel(order);
        setIsCancelDialogOpen(true);
    }, []);

    const handleCancelOrder = useCallback(async () => {
        if (!orderToCancel) return;
        try {
            await cancelOrderMutation.mutateAsync({id: orderToCancel.id, reason: 'Cancelled by user'});
            await refetchOrders();
            setIsCancelDialogOpen(false);
            setOrderToCancel(null);
            toast.success('Order cancelled successfully');
        } catch (err) {
            toast.error('Failed to cancel order');
        }
    }, [orderToCancel, cancelOrderMutation, refetchOrders]);

    const handleEditOrder = useCallback((order: Order) => {
        setSelectedOrder(order);
        setSelectedOrderId(order.id);
        setIsViewOrdersDialogOpen(true);
    }, []);

    const handleUpdateOrderStatus = useCallback(async (orderId: number, newStatus: Order['status']) => {
        try {
            await updateOrderStatusMutation.mutateAsync({id: orderId, status: newStatus});
            await refetchOrders();
            toast.success(`Order status updated to ${newStatus}`);
        } catch (err) {

            toast.error('Failed to update order status');
        }
    }, [updateOrderStatusMutation, refetchOrders]);

    const handleItemStatusChange = useCallback(async (orderId: number, itemId: number, newStatus: string) => {
        try {
            await updateOrderItemStatusMutation.mutateAsync({itemId, status: newStatus});
            await refetchOrders();
            toast.success('Order item status updated');
        } catch (err) {
            toast.error('Failed to update order item status');
        }
    }, [updateOrderItemStatusMutation, refetchOrders]);

    const handleCloseViewOrdersDialog = useCallback(() => {
        setIsViewOrdersDialogOpen(false);
        setSelectedOrder(null);
        setSelectedOrderId(null);
        refetchOrders();
    }, [refetchOrders]);

    const filteredAndSortedOrders = useMemo(() => {
        return orders
            .filter((order) => {
                // Status filter
                const matchesStatus = filterStatus === 'all' ? true : order.status === filterStatus;

                // Timeframe filter
                let matchesTimeframe = true;
                if (filterTimeframe !== 'all') {
                    const orderDate = new Date(order.order_time);
                    const now = new Date();

                    switch (filterTimeframe) {
                        case 'today':
                            matchesTimeframe = isToday(orderDate);
                            break;
                        case 'yesterday':
                            matchesTimeframe = isYesterday(orderDate);
                            break;
                        case 'week':
                            matchesTimeframe = orderDate >= subDays(now, 7);
                            break;
                        case 'month':
                            matchesTimeframe = orderDate >= subDays(now, 30);
                            break;
                    }
                }

                // Payment method filter
                const matchesPaymentMethod = filterPaymentMethod === 'all'
                    ? true
                    : order.payment_method === filterPaymentMethod;

                // Order type filter
                const matchesOrderType = filterOrderType === 'all'
                    ? true
                    : order.order_type === filterOrderType;

                // Tab filter
                let matchesTab = true;
                if (activeTab !== 'all') {
                    if (activeTab === 'active') {
                        matchesTab = ['placed', 'preparing', 'served'].includes(order.status);
                    } else if (activeTab === 'completed') {
                        matchesTab = order.status === 'paid';
                    } else if (activeTab === 'cancelled') {
                        matchesTab = order.status === 'cancelled';
                    }
                }
                // Search filter
                const customerName = order.customer || '';
                const serverName = order.server || '';
                const tableText = `Table ${order.table_id || 'Unknown'}`;
                const tokenNumberText = order.token_number ? String(order.token_number) : '';

                const matchesSearch = searchQuery === '' || (
                    String(order.id).includes(searchQuery) ||
                    customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    serverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    tableText.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    tokenNumberText.toLowerCase().includes(searchQuery.toLowerCase())
                );

                return matchesStatus && matchesTimeframe && matchesPaymentMethod && matchesOrderType && matchesTab && matchesSearch;
            })
            // Apply sorting based on selected sort option
            .sort((a, b) => {
                switch (sortBy) {
                    case 'newest':
                        return new Date(b.order_time).getTime() - new Date(a.order_time).getTime();
                    case 'oldest':
                        return new Date(a.order_time).getTime() - new Date(b.order_time).getTime();
                    case 'highest':
                        return (b.total_amount || 0) - (a.total_amount || 0);
                    case 'lowest':
                        return (a.total_amount || 0) - (b.total_amount || 0);
                    default:
                        // Default sorting by ID in descending order (as it comes from API)
                        return b.id - a.id;
                }
            });
    }, [orders, filterStatus, filterTimeframe, filterPaymentMethod, filterOrderType, searchQuery, activeTab, sortBy]);

    const getStatusBadgeStyles = useCallback((status: string) => {
        switch (status) {
            case 'placed':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'preparing':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'served':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'paid':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
            case 'cancelled':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    }, []);

    const formatCurrency = useCallback((amount: number | undefined) => {
        if (amount === undefined) return '₹0.00';
        return `₹${amount.toFixed(2)}`;
    }, []);

    const exportOrdersToCSV = useCallback(() => {
        // Define CSV headers
        const headers = [
            'Order ID',
            'Order Type',
            'Table/Token',
            'Status',
            'Order Time',
            'Customer',
            'Server',
            'Payment Method',
            'Total Amount',
            'Items'
        ];

        // Convert orders to CSV rows
        const csvRows = filteredAndSortedOrders.map(order => {
            // Format items as a comma-separated list
            const itemsList = (order.items || [])
                .map(item => `${item.name || 'Unknown Item'} (${item.quantity || 0}x₹${(item.price !== undefined && item.price !== null) ? item.price.toFixed(2) : '0.00'})`)
                .join('; ');

            // Create row data
            return [
                order.id,
                order.order_type,
                order.order_type === 'dine-in' ? `Table ${order.table_id || 'Unknown'}` : `Token ${order.token_number || 'N/A'}`,
                order.status,
                formatDate(new Date(order.order_time), 'yyyy-MM-dd HH:mm:ss'),
                order.customer || 'N/A',
                order.server || 'N/A',
                order.payment_method || 'N/A',
                (order.total_amount || 0).toFixed(2),
                itemsList
            ];
        });

        // Combine headers and rows
        const csvContent = [
            headers.join(','),
            ...csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('');

        // Create a Blob with the CSV content
        const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});

        // Create a download link
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        // Set link properties
        link.setAttribute('href', url);
        link.setAttribute('download', `orders_export_${formatDate(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`);
        link.style.visibility = 'hidden';

        // Add link to document, click it, and remove it
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Show success toast
        toast.success("CSV export completed successfully");
    }, [filteredAndSortedOrders]);

    const getOrderDateDisplay = useCallback((dateString: string) => {
        const date = new Date(dateString);
        if (isToday(date)) {
            return `Today, ${formatDate(date, 'h:mm a')}`;
        } else if (isYesterday(date)) {
            return `Yesterday, ${formatDate(date, 'h:mm a')}`;
        } else {
            return formatDate(date, 'MMM d, h:mm a');
        }
    }, []);

    return {
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
        filterStatus,
        setFilterStatus,
        filterTimeframe,
        setFilterTimeframe,
        filterPaymentMethod,
        setFilterPaymentMethod,
        filterOrderType,
        setFilterOrderType,
        searchQuery,
        setSearchQuery,
        sortBy,
        setSortBy,
        activeTab,
        setActiveTab,
        filteredAndSortedOrders,
        getStatusBadgeStyles,
        formatCurrency,
        exportOrdersToCSV,
        getOrderDateDisplay
    };
};
