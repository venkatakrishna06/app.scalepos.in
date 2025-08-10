import {useCallback, useEffect, useMemo, useState} from 'react';
import {useCancelOrder, useOrders, useUpdateOrderItemStatus, useUpdateOrderStatus} from '@/api/orders';
import {Order} from '@/types';

import {toast} from '@/lib/toast';
import {isToday, isYesterday, subDays, startOfDay, endOfDay, formatDate} from 'date-fns';
import {formatDateISO, formatDateForFilename, formatDateWithContext} from '@/lib/date-utils';
import { statusBadge } from "@/ui/theme/status-styles";

type SortField = 'newest' | 'oldest' | 'highest' | 'lowest';

export const useOrdersPage = () => {
    const [queryParams, setQueryParams] = useState<{
        period?: 'day' | 'week' | 'month' |'all';
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

    // Update queryParams when filterTimeframe changes and trigger a refetch
    useEffect(() => {
        // Create a new queryParams object to ensure React Query detects the change
        setQueryParams(prevParams => {
            let newParams = { ...prevParams };
            
            // Handle 'yesterday' with start_date and end_date
            if (filterTimeframe === 'yesterday') {
                const yesterdayStart = startOfDay(subDays(new Date(), 1));
                const yesterdayEnd = endOfDay(subDays(new Date(), 1));
                
                newParams = {
                    ...prevParams,
                    period: undefined, // Remove period parameter
                    start_date: formatDate(yesterdayStart,'yyyy-MM-dd'),
                    end_date: formatDate(yesterdayEnd,'yyyy-MM-dd')
                };
            } else {
                // Map other UI filter values to API period values
                let period: 'day' | 'week' | 'month' | 'all'| undefined;
                
                switch (filterTimeframe) {
                    case 'today':
                        period = 'day';
                        break;
                    case 'week':
                        period = 'week';
                        break;
                    case 'month':
                        period = 'month';
                        break;
                    case 'all':
                        // For 'all', we'll fetch a month of data to have a comprehensive view
                        period = 'all';
                        break;
                }
                
                // Only update if the period has changed to avoid infinite loops
                if (prevParams.period === period && 
                    !prevParams.start_date && 
                    !prevParams.end_date) {
                    return prevParams;
                }
                
                // Clear any existing start_date and end_date
                newParams = {
                    ...prevParams,
                    period,
                    start_date: undefined,
                    end_date: undefined
                };
            }
            
            // Schedule a refetch after the state update
            setTimeout(() => {
                refetchOrders();
            }, 0);
            
            return newParams;
        });
    }, [filterTimeframe, refetchOrders]);

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
            // Create a new queryParams object to ensure React Query detects the change
            setQueryParams(prev => {
                let newParams = { ...prev };
                
                // Handle 'yesterday' with start_date and end_date
                if (filterTimeframe === 'yesterday') {
                    const yesterdayStart = startOfDay(subDays(new Date(), 1));
                    const yesterdayEnd = endOfDay(subDays(new Date(), 1));

                    
                    newParams = {
                        ...prev,
                        period: undefined, // Remove period parameter
                        start_date: formatDate(yesterdayStart,'yyyy-MM-dd'),
                        end_date: formatDate(yesterdayEnd,'yyyy-MM-dd')
                    };
                } else {
                    // Map other UI filter values to API period values
                    let period: 'day' | 'week' | 'month';
                    
                    switch (filterTimeframe) {
                        case 'week':
                            period = 'week';
                            break;
                        case 'month':
                        case 'all':
                            period = 'month';
                            break;
                        case 'today':
                        default:
                            period = 'day';
                            break;
                    }
                    
                    // Clear any existing start_date and end_date
                    newParams = {
                        ...prev,
                        period,
                        start_date: undefined,
                        end_date: undefined
                    };
                }
                
                return newParams;
            });
            
            // Wait a moment for the state to update before refetching
            setTimeout(async () => {
                await refetchOrders();
                toast.success('Orders refreshed successfully');
            }, 0);
        } catch {
            toast.error('Failed to refresh orders');
        }
    }, [refetchOrders, filterTimeframe]);

    const showCancelConfirmation = useCallback((order: Order) => {
        setOrderToCancel(order);
        setIsCancelDialogOpen(true);
    }, []);

    const handleCancelOrder = useCallback(async (reason: string) => {
        if (!orderToCancel) return;
        try {
            setIsCancelDialogOpen(false);
            await cancelOrderMutation.mutateAsync({id: orderToCancel.id, reason});
            setOrderToCancel(null);
            toast.success('Order cancelled successfully');
        } catch {
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
        } catch {
            toast.error('Failed to update order status');
        }
    }, [updateOrderStatusMutation, refetchOrders]);

    const handleItemStatusChange = useCallback(async (orderId: number, itemId: number, newStatus: string) => {

            await updateOrderItemStatusMutation.mutateAsync({itemId, status: newStatus});
            // await refetchOrders();

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
                // We're now fetching data from the API based on the selected time frame,
                // but we still need client-side filtering for 'today' and 'yesterday'
                // since they both map to 'day' in the API call
                let matchesTimeframe = true;
                
                // Only apply additional client-side filtering for 'today' and 'yesterday'
                // since 'week', 'month', and 'all' are already handled by the API
                if (filterTimeframe === 'today' || filterTimeframe === 'yesterday') {
                    const orderDate = new Date(order.order_time);
                    
                    if (filterTimeframe === 'today') {
                        matchesTimeframe = isToday(orderDate);
                    } else if (filterTimeframe === 'yesterday') {
                        matchesTimeframe = isYesterday(orderDate);
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
        return statusBadge(status);
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
                formatDateISO(order.order_time),
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
        link.setAttribute('download', `orders_export_${formatDateForFilename(new Date())}.csv`);
        link.style.visibility = 'hidden';

        // Add link to document, click it, and remove it
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Show success toast
        toast.success("CSV export completed successfully");
    }, [filteredAndSortedOrders]);

    const getOrderDateDisplay = useCallback((dateString: string) => {
        return formatDateWithContext(dateString);
    }, []);

    return {
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
