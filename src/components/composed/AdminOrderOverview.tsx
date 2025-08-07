import React, {useState} from 'react';
import {
    ArrowUpDown,
    Coffee,
    CreditCard,
    Download,
    Edit,
    FileText,
    LayoutGrid,
    LayoutList,
    Printer,
    Search,
    Trash2,
    CheckCircle
} from 'lucide-react';
import {subDays, isToday, isYesterday} from 'date-fns';
import {formatDateWithContext, formatDateISO, formatDateForFilename} from '@/lib/date-utils';
import {Button} from '@/components/ui/button';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Input} from '@/components/ui/input';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from '@/components/ui/tooltip';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {cn} from '@/lib/utils';
import {toast} from '@/lib/toast';
import {Order} from '@/types';

import {FilterDropdownContainer} from './FilterDropdownContainer';
import {useRestaurant} from "@/api";
import {useCreatePayment} from "@/api/payments";
import {useUpdateOrderStatus} from "@/api/orders";
import {PermissionGuard} from './permission-guard';
import {PERMISSIONS} from '@/lib/auth/roles';

interface AdminOrderOverviewProps {
    orders: Order[];
    onEditOrder: (order: Order) => void;
    onCancelOrder: (order: Order) => void;
    onRefreshOrders: () => void;
    onUpdateOrderStatus: (orderId: number, newStatus: Order['status']) => void;
    onItemStatusChange: (orderId: number, itemId: number, newStatus: string) => void;
    filterTimeframe: string;
    setFilterTimeframe: (value: string) => void;
}

export const AdminOrderOverview: React.FC<AdminOrderOverviewProps> = ({
                                                                          orders,
                                                                          onEditOrder,
                                                                          onCancelOrder,
                                                                          onRefreshOrders,
                                                                          onUpdateOrderStatus,
                                                                          onItemStatusChange,
                                                                          filterTimeframe,
                                                                          setFilterTimeframe
                                                                      }) => {
    // Get restaurant data to check if order tracking is enabled
    const {data:restaurant} = useRestaurant();
    const isTrackingEnabled = restaurant?.enable_order_status_tracking || false;

    // Mutations for updating order status and creating payment
    const createPaymentMutation = useCreatePayment();
    const updateOrderStatusMutation = useUpdateOrderStatus();

    // State for filter parameters
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('all');
    const [filterOrderType, setFilterOrderType] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<string>('newest');
    const [activeTab, setActiveTab] = useState<string>('all');

    // View layout state
    const [viewLayout, setViewLayout] = useState<'grid' | 'kanban'>('grid');
    
    // State to track open tooltips
    const [openTooltips, setOpenTooltips] = useState<Record<number, boolean>>({});
    
    // Function to toggle tooltip open state
    const toggleTooltip = (orderId: number) => {
        setOpenTooltips(prev => ({
            ...prev,
            [orderId]: !prev[orderId]
        }));
    };

    // Helper function to get status badge styling
    const getStatusBadgeStyles = (status: string) => {
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
    };

    // Format currency
    const formatCurrency = (amount: number | undefined) => {
        if (amount === undefined) return '₹0.00';
        return `₹${amount.toFixed(2)}`;
    };
    
    // Calculate total with roundoff
    const getTotalWithRoundoff = (amount: number | undefined) => {
        if (amount === undefined) return 0;
        return Math.ceil(amount);
    };
    
    // Helper function to get GST details from the order
    const getGstDetails = (order: Order) => {
        return {
            subTotal: order.sub_total || 0,
            sgstRate: order.sgst_rate || 0,
            cgstRate: order.cgst_rate || 0,
            sgstAmount: order.sgst_amount || 0,
            cgstAmount: order.cgst_amount || 0,
            totalGstAmount: (order.sgst_amount || 0) + (order.cgst_amount || 0),
            roundingDifference: Math.ceil(order.total_amount || 0) - (order.total_amount || 0)
        };
    };
    
    // Handle marking an order as delivered (for takeaway and quick-bill orders)
    const handleMarkAsDelivered = async (order: Order) => {
        try {
            // Only proceed if order tracking is enabled
            if (!isTrackingEnabled) {
                toast.error("Order tracking is not enabled");
                return;
            }
            
            // Only for takeaway and quick-bill orders
            if (order.order_type !== 'takeaway' && order.order_type !== 'quick-bill') {
                toast.error("This action is only available for takeaway and quick-bill orders");
                return;
            }
            
            // Create payment data
            const paymentData = {
                order_id: order.id,
                amount: order.total_amount || 0,
                payment_method: order.payment_method || 'cash',
                payment_status: 'completed' as const,
                transaction_id: `txn_${Date.now()}`,
            };
            
            // Create payment and update order status
            await createPaymentMutation.mutateAsync(paymentData);
            await updateOrderStatusMutation.mutateAsync({ id: order.id, status: 'paid' });
            
            toast.success('Order delivered');
            
            // // Refresh orders
            // onRefreshOrders();
        } catch (error) {
            console.error('Error marking order as delivered:', error);
            toast.error('Failed to mark order as delivered');
        }
    };

    // Export orders to CSV
    const exportOrdersToCSV = () => {
        // Define CSV headers
        const headers = [
            'Order ID',
            'Order Type',
            'Table/Token',
            'Status',
            'Order Time',
            'Server',
            'SGST Rate',
            'CGST Rate',
            'SGST Amount',
            'CGST Amount',
            'Total Amount',
            'Items'
        ];

        // Convert orders to CSV rows
        const csvRows = filteredOrders.map(order => {
            // Format items as a comma-separated list
            const itemsList = (order.items || [])
                .map(item => {
                    const isCancelled = item.status === 'cancelled';
                    return `${isCancelled ? '[CANCELLED] ' : ''}${item.name || 'Unknown Item'} (${item.quantity || 0}x₹${(item.price !== undefined && item.price !== null) ? item.price.toFixed(2) : '0.00'})`;
                })
                .join('; ');

            // Create row data
            return [
                order.id,
                order.order_type,
                order.order_type === 'dine-in' ? `Table ${order.table_id || 'Unknown'}` : `Token ${order.token_number || 'N/A'}`,
                order.status,
                formatDateISO(order.order_time),
                order.server || 'N/A',
                (order.sgst_rate || 0).toFixed(2),
                (order.cgst_rate || 0).toFixed(2),
                (order.sgst_amount || 0).toFixed(2),
                (order.cgst_amount || 0).toFixed(2),
                (order.total_amount || 0).toFixed(2),
                itemsList
            ];
        });

        // Combine headers and rows
        const csvContent = [
            headers.join(','),
            ...csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

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
    };

    // Get order date display
    const getOrderDateDisplay = (dateString: string) => {
        return formatDateWithContext(dateString);
    };

    // Filter and sort orders
    const filteredOrders = orders.filter((order) => {
            // Status filter
            const matchesStatus = filterStatus === 'all' ? true : order.status === filterStatus;

            // Timeframe filter
            let matchesTimeframe = true;
            if (filterTimeframe !== 'all') {
                const orderDate = new Date(order.order_time.replace(/Z$/, ''));
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
        })

    return (
        <div className="space-y-6">
            {/* Page header with title and actions */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold tracking-tight text-blue-800 dark:text-blue-300">Admin Orders
                    Overview</h1>

                <div className="flex flex-wrap items-center gap-2">
                    {/* View Layout Toggle */}
                    <div className="mr-2">
                        <Tabs value={viewLayout} onValueChange={(value) => setViewLayout(value as 'grid' | 'kanban')}>
                            <TabsList className="grid w-[120px] grid-cols-2">
                                <TabsTrigger value="grid" title="Grid View">
                                    <LayoutGrid className="h-4 w-4"/>
                                </TabsTrigger>
                                <TabsTrigger value="kanban" title="Kanban View">
                                    <LayoutList className="h-4 w-4"/>
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    <Button variant="outline" size="sm" onClick={onRefreshOrders}
                            className="border-blue-300 hover:bg-blue-50">
                        <ArrowUpDown className="mr-2 h-4 w-4 text-blue-600"/>
                        Refresh
                    </Button>

                    <PermissionGuard permission={PERMISSIONS.READ_ORDER}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="border-blue-300 hover:bg-blue-50">
                                    <Download className="mr-2 h-4 w-4 text-blue-600"/>
                                    Export
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={exportOrdersToCSV}>
                                    Export as CSV
                                </DropdownMenuItem>
                                <DropdownMenuSeparator/>
                                <DropdownMenuItem onClick={() => toast.success("Print started")}>
                                    <Printer className="mr-2 h-4 w-4"/>
                                    Print Orders
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </PermissionGuard>
                </div>
            </div>

            {/* Tabs for order status filtering */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

                <div className="mt-6">
                    {/* Filters and search */}
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
                            <div className="relative flex-1">
                                <Search
                                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                                <Input
                                    placeholder="Search by order #, token, table, customer..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 border-blue-200 focus-visible:ring-blue-400"
                                />
                            </div>

                            <FilterDropdownContainer>
                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                    <SelectTrigger className="w-[130px] sm:w-[140px] border-blue-200">
                                        <SelectValue placeholder="Status"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="placed">Placed</SelectItem>
                                        <SelectItem value="preparing">Preparing</SelectItem>
                                        <SelectItem value="served">Served</SelectItem>
                                        <SelectItem value="paid">Paid</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={filterTimeframe} onValueChange={setFilterTimeframe}>
                                    <SelectTrigger className="w-[130px] sm:w-[140px] border-blue-200">
                                        <SelectValue placeholder="Timeframe"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Time</SelectItem>
                                        <SelectItem value="today">Today</SelectItem>
                                        <SelectItem value="yesterday">Yesterday</SelectItem>
                                        <SelectItem value="week">This Week</SelectItem>
                                        <SelectItem value="month">This Month</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={filterPaymentMethod} onValueChange={setFilterPaymentMethod}>
                                    <SelectTrigger className="w-[130px] sm:w-[140px] border-blue-200">
                                        <SelectValue placeholder="Payment"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Payments</SelectItem>
                                        <SelectItem value="cash">Cash</SelectItem>
                                        <SelectItem value="card">Card</SelectItem>
                                        <SelectItem value="upi">UPI</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={filterOrderType} onValueChange={setFilterOrderType}>
                                    <SelectTrigger className="w-[130px] sm:w-[140px] border-blue-200">
                                        <SelectValue placeholder="Order Type"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="dine-in">Dine-in</SelectItem>
                                        <SelectItem value="takeaway">Takeaway</SelectItem>
                                        <SelectItem value="quick-bill">Quick Bill</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={sortBy} onValueChange={setSortBy}>
                                    <SelectTrigger className="w-[140px] border-blue-200">
                                        <SelectValue placeholder="Sort by"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="newest">Newest First</SelectItem>
                                        <SelectItem value="oldest">Oldest First</SelectItem>
                                        <SelectItem value="highest">Highest Amount</SelectItem>
                                        <SelectItem value="lowest">Lowest Amount</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FilterDropdownContainer>
                        </div>
                    </div>
                </div>

                <TabsContent value={activeTab} className="mt-6">
                    {viewLayout === 'grid' ? (
                        // Grid View
                        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                            {filteredOrders.map((order) => (
                                <Card key={order.id} className="overflow-hidden border-blue-200 hover:shadow-md">
                                    <CardHeader className="pb-3 bg-blue-50 dark:bg-blue-950 border-b border-blue-100">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <CardTitle className="text-lg text-blue-800 dark:text-blue-300">
                                                        {order.order_type === 'takeaway'
                                                            ? (
                                                                <div className="flex items-center">
                                                                    <span>Takeaway</span>
                                                                    {order.token_number && (
                                                                        <Badge
                                                                            className="ml-2 bg-blue-100 text-blue-800 border-blue-300">
                                                                            Token: {order.token_number}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            )
                                                            : order.order_type === 'quick-bill'
                                                                ? (
                                                                    <div className="flex items-center">
                                                                        <span>Quick Bill</span>
                                                                        {order.token_number && (
                                                                            <Badge
                                                                                className="ml-2 bg-blue-100 text-blue-800 border-blue-300">
                                                                                Token: {order.token_number}
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                )
                                                                : `Table ${order?.table?.table_number || 'Unknown'}`}
                                                    </CardTitle>
                                                    <Badge variant="outline"
                                                           className="border-blue-300 text-blue-700">#{order.id}</Badge>
                                                </div>
                                                <CardDescription className="mt-1">
                                                    {getOrderDateDisplay(order.order_time)}
                                                </CardDescription>
                                            </div>
                                            {(isTrackingEnabled || order.status === 'cancelled' || order.status === 'paid' || order.status === 'placed') && (
                                                <Badge className={cn(getStatusBadgeStyles(order.status))}>
                                                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Coffee className="h-4 w-4 text-blue-600"/>
                                            <span>Server: {order.server || 'Unknown'}</span>
                                        </div>
                                    </CardHeader>


                                        <div className="space-y-1">

                                            {order.payment_method && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <CreditCard className="h-4 w-4 text-blue-600"/>
                                                    <span>Payment: {order.payment_method.charAt(0).toUpperCase() + order.payment_method.slice(1)}</span>
                                                </div>
                                            )}

                                            {/* Token number is now displayed in the title for takeaway and quick-bill orders */}
                                            {order.token_number && order.order_type === 'dine-in' && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <FileText className="h-4 w-4 text-blue-600"/>
                                                    <span>Token: {order.token_number}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div
                                            className="max-h-40 overflow-auto  border border-blue-100 custom-scrollbar">
                                            <table className="w-full">
                                                <thead className="bg-blue-50 dark:bg-blue-950 text-xs">
                                                <tr className="text-left">
                                                    <th className="p-2 text-blue-800">Item</th>
                                                    <th className="p-2 text-blue-800">Qty</th>
                                                    <th className="p-2 text-blue-800">Total</th>

                                                    <th className="p-2 text-blue-800">Status</th>

                                                </tr>
                                                </thead>
                                                <tbody className="divide-y divide-blue-100 text-xs">
                                                {(order?.items || []).length > 0 ? (
                                                    (order.items || []).map((item) => (
                                                        <tr key={item.id} className="hover:bg-blue-50/50">
                                                            <td className={cn("p-2", item.status === 'cancelled' && "text-red-500 font-medium")}>{item.name || 'Unknown Item'}</td>
                                                            <td className={cn("p-2", item.status === 'cancelled' && "text-red-500 font-medium")}>{item.quantity || 0}</td>
                                                            <td className={cn("p-2", item.status === 'cancelled' && "text-red-500 font-medium")}>{formatCurrency((item.quantity || 0) * (item.price !== undefined ? item.price : 0))}</td>
                                                            <td className="p-2">
                                                                {(isTrackingEnabled || item.status === 'cancelled') && (
                                                                    <Badge variant="outline"
                                                                           className={cn("px-1.5 py-0", getStatusBadgeStyles(item.status || 'unknown'))}>
                                                                        {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Unknown'}
                                                                    </Badge>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={4}
                                                            className="p-4 text-center text-muted-foreground">
                                                            No items in this order
                                                        </td>
                                                    </tr>
                                                )}
                                                </tbody>
                                            </table>
                                        </div>


                                    <CardFooter
                                        className="flex items-center justify-between border-t border-blue-100 bg-blue-50/50 dark:bg-blue-950/50 pt-3">
                                        <div className="flex gap-2">
                                            {
                                                order.order_type === 'dine-in' && (

                                            <PermissionGuard permission={PERMISSIONS.UPDATE_ORDER}>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => onEditOrder(order)}
                                                    disabled={
                                                        order.status === 'cancelled' ||
                                                        order.status === 'paid'
                                                    }
                                                    className="border-blue-300 hover:bg-blue-100 text-blue-700"
                                                >
                                                    <Edit className="mr-2 h-4 w-4"/>
                                                    Edit
                                                </Button>
                                            </PermissionGuard>
                                                )
                                            }
                                            {/* Delivered button for takeaway and quick-bill orders when order tracking is enabled */}
                                            {isTrackingEnabled && 
                                             (order.order_type === 'takeaway' || order.order_type === 'quick-bill') && 
                                             order.status !== 'paid' && 
                                             order.status !== 'cancelled' && (
                                                <PermissionGuard permission={PERMISSIONS.UPDATE_ORDER}>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleMarkAsDelivered(order)}
                                                        className="border-green-300 hover:bg-green-100 text-green-700"
                                                    >
                                                        <CheckCircle className="mr-2 h-4 w-4"/>
                                                        Delivered
                                                    </Button>
                                                </PermissionGuard>
                                            )}
                                            <PermissionGuard permission={PERMISSIONS.DELETE_ORDER}>
                                              <Button
                                                  variant="outline"
                                                  size="sm"
                                                  className="text-red-500 hover:text-red-700 border-red-200 hover:bg-red-50"
                                                  onClick={() => onCancelOrder(order)}
                                                  disabled={
                                                      order.status === 'cancelled' ||
                                                      order.status === 'paid' ||
                                                      ['preparing', 'served', 'ready'].includes(order.status)
                                                  }
                                              >
                                                  <Trash2 className="mr-2 h-4 w-4"/>
                                                  Cancel
                                              </Button>
                                            </PermissionGuard>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-xs text-blue-600">Total Amount</p>
                                            <TooltipProvider>
                                                <Tooltip 
                                                    open={openTooltips[order.id]} 
                                                    onOpenChange={(open) => setOpenTooltips(prev => ({...prev, [order.id]: open}))}
                                                >
                                                    <TooltipTrigger asChild>
                                                        <p 
                                                            className="text-base font-semibold text-blue-800 cursor-help"
                                                            onClick={() => toggleTooltip(order.id)}
                                                        >
                                                            {formatCurrency(getTotalWithRoundoff(order.total_amount))}
                                                        </p>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="p-3 max-w-xs">
                                                        <div className="space-y-1.5">
                                                            <p className="text-xs font-medium">Price Breakdown</p>
                                                            <div className="text-xs space-y-1">
                                                                <div className="flex justify-between">
                                                                    <span>Subtotal:</span>
                                                                    <span>{formatCurrency(getGstDetails(order).subTotal)}</span>
                                                                </div>
                                                                {getGstDetails(order).sgstAmount > 0 && (
                                                                    <div className="flex justify-between">
                                                                        <span>SGST ({getGstDetails(order).sgstRate}%):</span>
                                                                        <span>{formatCurrency(getGstDetails(order).sgstAmount)}</span>
                                                                    </div>
                                                                )}
                                                                {getGstDetails(order).cgstAmount > 0 && (
                                                                    <div className="flex justify-between">
                                                                        <span>CGST ({getGstDetails(order).cgstRate}%):</span>
                                                                        <span>{formatCurrency(getGstDetails(order).cgstAmount)}</span>
                                                                    </div>
                                                                )}
                                                                <div className="flex justify-between">
                                                                    <span>Rounding:</span>
                                                                    <span>{formatCurrency(getGstDetails(order).roundingDifference)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </CardFooter>
                                </Card>
                            ))}

                            {filteredOrders.length === 0 && (
                                <div
                                    className="col-span-full rounded-lg border border-dashed border-blue-200 p-8 text-center">
                                    <FileText className="mx-auto h-8 w-8 text-blue-400"/>
                                    <h3 className="mt-2 text-lg font-semibold text-blue-800">No Orders Found</h3>
                                    <p className="mt-1 text-sm text-blue-600">
                                        Try adjusting your filters or search criteria
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        // Kanban View
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Placed Orders Column */}
                            <div className="flex flex-col">
                                <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-t-md">
                                    <h3 className="font-semibold text-blue-800 dark:text-blue-200 flex items-center">
                                        <span>PLACED</span>
                                        <Badge
                                            className="ml-2 bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200">
                                            {filteredOrders.filter(order => order.status === 'placed').length}
                                        </Badge>
                                    </h3>
                                </div>
                                <div
                                    className="bg-blue-50 dark:bg-blue-950 p-2 rounded-b-md flex-1 min-h-[70vh] overflow-auto custom-scrollbar">
                                    {filteredOrders
                                        .filter(order => order.status === 'placed')
                                        .map(order => (
                                            <Card key={order.id}
                                                  className="mb-3 overflow-hidden hover:shadow-md border-blue-200">
                                                <CardHeader className="p-2 pb-1 bg-blue-50">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-1">
                              <span className="font-medium text-sm text-blue-800">
                                {order.order_type === 'takeaway'
                                    ? (
                                        <span className="flex items-center">
                                      Takeaway
                                            {order.token_number && (
                                                <Badge
                                                    className="ml-1 bg-blue-100 text-blue-800 border-blue-300 text-xs">
                                                    {order.token_number}
                                                </Badge>
                                            )}
                                    </span>
                                    )
                                    : order.order_type === 'quick-bill'
                                        ? (
                                            <span className="flex items-center">
                                        Quick Bill
                                                {order.token_number && (
                                                    <Badge
                                                        className="ml-1 bg-blue-100 text-blue-800 border-blue-300 text-xs">
                                                        {order.token_number}
                                                    </Badge>
                                                )}
                                      </span>
                                        )
                                        : `Table ${order.table_id || 'Unknown'}`}
                              </span>
                                                            <Badge variant="outline"
                                                                   className="text-xs border-blue-300 text-blue-700">#{order.id}</Badge>
                                                            <span className="text-xs text-blue-600 ml-1">
                                {getOrderDateDisplay(order.order_time)}
                              </span>
                                                        </div>
                                                        <TooltipProvider>
                                                            <Tooltip 
                                                                open={openTooltips[order.id]} 
                                                                onOpenChange={(open) => setOpenTooltips(prev => ({...prev, [order.id]: open}))}
                                                            >
                                                                <TooltipTrigger asChild>
                                                                    <span 
                                                                        className="text-xs font-medium text-blue-800 cursor-help"
                                                                        onClick={() => toggleTooltip(order.id)}
                                                                    >
                                                                        {formatCurrency(getTotalWithRoundoff(order.total_amount))}
                                                                    </span>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="p-3 max-w-xs">
                                                                    <div className="space-y-1.5">
                                                                        <p className="text-xs font-medium">Price Breakdown</p>
                                                                        <div className="text-xs space-y-1">
                                                                            <div className="flex justify-between">
                                                                                <span>Subtotal:</span>
                                                                                <span>{formatCurrency(getGstDetails(order).subTotal)}</span>
                                                                            </div>
                                                                            {getGstDetails(order).sgstAmount > 0 && (
                                                                                <div className="flex justify-between">
                                                                                    <span>SGST ({getGstDetails(order).sgstRate}%):</span>
                                                                                    <span>{formatCurrency(getGstDetails(order).sgstAmount)}</span>
                                                                                </div>
                                                                            )}
                                                                            {getGstDetails(order).cgstAmount > 0 && (
                                                                                <div className="flex justify-between">
                                                                                    <span>CGST ({getGstDetails(order).cgstRate}%):</span>
                                                                                    <span>{formatCurrency(getGstDetails(order).cgstAmount)}</span>
                                                                                </div>
                                                                            )}
                                                                            <div className="flex justify-between">
                                                                                <span>Rounding:</span>
                                                                                <span>{formatCurrency(getGstDetails(order).roundingDifference)}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="p-2 pt-0">
                                                    <div className="text-xs">
                                                        <div
                                                            className="max-h-36 overflow-y-auto border border-blue-100 rounded-md divide-y divide-blue-100">
                                                            {order.items && order.items.length > 0 ? (
                                                                order.items.map(item => (
                                                                    <div key={item.id}
                                                                         className="p-1.5 hover:bg-blue-50/50">
                                                                        <div className="flex items-center gap-1">
                                                                            <div
                                                                                className="flex-1 flex items-center gap-1">
                                                                                <span
                                                                                    className={cn("font-medium truncate", item.status === 'cancelled' && "text-red-500")}>{item.name}</span>
                                                                                <span
                                                                                    className={cn("text-blue-600", item.status === 'cancelled' && "text-red-500")}>×{item.quantity}</span>
                                                                                {(isTrackingEnabled || item.status === 'cancelled') && (
                                                                                    <Badge
                                                                                        className={cn("px-1 py-0.5 text-xs ml-auto", getStatusBadgeStyles(item.status || 'unknown'))}>
                                                                                        {item.status ? (item.status.charAt(0).toUpperCase() + item.status.slice(1)) : 'Unknown'}
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                            {item.status === 'placed' && isTrackingEnabled && (
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="text-yellow-600 text-xs h-6 px-1.5 ml-1"
                                                                                    onClick={() => onItemStatusChange(order.id, item.id, 'preparing')}
                                                                                    disabled={item.allowed_next_states && !item.allowed_next_states.includes('preparing')}
                                                                                >
                                                                                    Prepare
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="p-2 text-center text-blue-400">
                                                                    No items in this order
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between mt-2">
                                                        <PermissionGuard permission={PERMISSIONS.UPDATE_ORDER}>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-xs h-7 text-blue-700 hover:bg-blue-100"
                                                                onClick={() => onEditOrder(order)}
                                                            >
                                                                <Edit className="h-3 w-3 mr-1"/> Edit
                                                            </Button>
                                                        </PermissionGuard>
                                                        {isTrackingEnabled && (
                                                            <PermissionGuard permission={PERMISSIONS.UPDATE_ORDER}>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-xs h-7 text-blue-700 hover:bg-blue-100"
                                                                    onClick={() => onUpdateOrderStatus(order.id, 'preparing')}
                                                                    disabled={order.allowed_next_states && !order.allowed_next_states.includes('preparing')}
                                                                >
                                                                    Move to Preparing →
                                                                </Button>
                                                            </PermissionGuard>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}

                                    {filteredOrders.filter(order => order.status === 'placed').length === 0 && (
                                        <div className="text-center p-4 text-blue-400 text-sm">
                                            No orders in this column
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Preparing Orders Column */}
                            <div className="flex flex-col">
                                <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-t-md">
                                    <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 flex items-center">
                                        <span>PREPARING</span>
                                        <Badge
                                            className="ml-2 bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200">
                                            {filteredOrders.filter(order => order.status === 'preparing').length}
                                        </Badge>
                                    </h3>
                                </div>
                                <div
                                    className="bg-yellow-50 dark:bg-yellow-950 p-2 rounded-b-md flex-1 min-h-[70vh] overflow-auto custom-scrollbar">
                                    {/* Similar card structure as placed orders but with preparing status */}
                                    {filteredOrders
                                        .filter(order => order.status === 'preparing')
                                        .map(order => (
                                            <Card key={order.id}
                                                  className="mb-3 overflow-hidden hover:shadow-md border-yellow-200">
                                                {/* Card content similar to placed orders but with preparing-specific actions */}
                                                <CardHeader className="p-2 pb-1 bg-yellow-50">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-1">
                              <span className="font-medium text-sm text-yellow-800">
                                {order.order_type === 'takeaway'
                                    ? (
                                        <span className="flex items-center">
                                      Takeaway
                                            {order.token_number && (
                                                <Badge
                                                    className="ml-1 bg-yellow-100 text-yellow-800 border-yellow-300 text-xs">
                                                    {order.token_number}
                                                </Badge>
                                            )}
                                    </span>
                                    )
                                    : order.order_type === 'quick-bill'
                                        ? (
                                            <span className="flex items-center">
                                        Quick Bill
                                                {order.token_number && (
                                                    <Badge
                                                        className="ml-1 bg-yellow-100 text-yellow-800 border-yellow-300 text-xs">
                                                        {order.token_number}
                                                    </Badge>
                                                )}
                                      </span>
                                        )
                                        : `Table ${order.table_id || 'Unknown'}`}
                              </span>
                                                            <Badge variant="outline"
                                                                   className="text-xs border-yellow-300 text-yellow-700">#{order.id}</Badge>
                                                            <span className="text-xs text-yellow-600 ml-1">
                                {getOrderDateDisplay(order.order_time)}
                              </span>
                                                        </div>
                                                        <span
                                                            className="text-xs font-medium text-yellow-800">{formatCurrency(order.total_amount)}</span>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="p-2 pt-0">
                                                    <div className="text-xs">
                                                        <div
                                                            className="max-h-36 overflow-y-auto border border-yellow-100 rounded-md divide-y divide-yellow-100">
                                                            {order.items && order.items.length > 0 ? (
                                                                order.items.map(item => (
                                                                    <div key={item.id}
                                                                         className="p-1.5 hover:bg-yellow-50/50">
                                                                        <div className="flex items-center gap-1">
                                                                            <div
                                                                                className="flex-1 flex items-center gap-1">
                                                                                <span
                                                                                    className={cn("font-medium truncate", item.status === 'cancelled' && "text-red-500")}>{item.name}</span>
                                                                                <span
                                                                                    className={cn("text-yellow-600", item.status === 'cancelled' && "text-red-500")}>×{item.quantity}</span>
                                                                                {(isTrackingEnabled || item.status === 'cancelled') && (
                                                                                    <Badge
                                                                                        className={cn("px-1 py-0.5 text-xs ml-auto", getStatusBadgeStyles(item.status || 'unknown'))}>
                                                                                        {item.status ? (item.status.charAt(0).toUpperCase() + item.status.slice(1)) : 'Unknown'}
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                            {item.status === 'preparing' && isTrackingEnabled && (
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="text-green-600 text-xs h-6 px-1.5 ml-1"
                                                                                    onClick={() => onItemStatusChange(order.id, item.id, 'ready')}
                                                                                    disabled={item.allowed_next_states && !item.allowed_next_states.includes('ready')}
                                                                                >
                                                                                    Ready
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="p-2 text-center text-yellow-400">
                                                                    No items in this order
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between mt-2">
                                                        {isTrackingEnabled && (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-xs h-7 text-yellow-700 hover:bg-yellow-100"
                                                                    onClick={() => onUpdateOrderStatus(order.id, 'placed')}
                                                                    disabled={order.allowed_next_states && !order.allowed_next_states.includes('placed')}
                                                                >
                                                                    ← Back to Placed
                                                                </Button>
                                                                {/* Delivered button for takeaway and quick-bill orders */}
                                                                {(order.order_type === 'takeaway' || order.order_type === 'quick-bill') ? (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="text-xs h-7 text-green-700 hover:bg-green-100"
                                                                        onClick={() => handleMarkAsDelivered(order)}
                                                                    >
                                                                        <CheckCircle className="h-3 w-3 mr-1"/> Delivered
                                                                    </Button>
                                                                ) : (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="text-xs h-7 text-yellow-700 hover:bg-yellow-100"
                                                                        onClick={() => onUpdateOrderStatus(order.id, 'served')}
                                                                        disabled={order.allowed_next_states && !order.allowed_next_states.includes('served')}
                                                                    >
                                                                        Move to Served →
                                                                    </Button>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}

                                    {filteredOrders.filter(order => order.status === 'preparing').length === 0 && (
                                        <div className="text-center p-4 text-yellow-400 text-sm">
                                            No orders in this column
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Served Orders Column */}
                            <div className="flex flex-col">
                                <div className="bg-green-100 dark:bg-green-900 p-3 rounded-t-md">
                                    <h3 className="font-semibold text-green-800 dark:text-green-200 flex items-center">
                                        <span>SERVED</span>
                                        <Badge
                                            className="ml-2 bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200">
                                            {filteredOrders.filter(order => order.status === 'served').length}
                                        </Badge>
                                    </h3>
                                </div>
                                <div
                                    className="bg-green-50 dark:bg-green-950 p-2 rounded-b-md flex-1 min-h-[70vh] overflow-auto custom-scrollbar">
                                    {/* Similar card structure as placed orders but with served status */}
                                    {filteredOrders
                                        .filter(order => order.status === 'served')
                                        .map(order => (
                                            <Card key={order.id}
                                                  className="mb-3 overflow-hidden hover:shadow-md border-green-200">
                                                {/* Card content similar to placed orders but with served-specific actions */}
                                                <CardHeader className="p-2 pb-1 bg-green-50">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-1">
                              <span className="font-medium text-sm text-green-800">
                                {order.order_type === 'takeaway'
                                    ? (
                                        <span className="flex items-center">
                                      Takeaway
                                            {order.token_number && (
                                                <Badge
                                                    className="ml-1 bg-green-100 text-green-800 border-green-300 text-xs">
                                                    {order.token_number}
                                                </Badge>
                                            )}
                                    </span>
                                    )
                                    : order.order_type === 'quick-bill'
                                        ? (
                                            <span className="flex items-center">
                                        Quick Bill
                                                {order.token_number && (
                                                    <Badge
                                                        className="ml-1 bg-green-100 text-green-800 border-green-300 text-xs">
                                                        {order.token_number}
                                                    </Badge>
                                                )}
                                      </span>
                                        )
                                        : `Table ${order.table_id || 'Unknown'}`}
                              </span>
                                                            <Badge variant="outline"
                                                                   className="text-xs border-green-300 text-green-700">#{order.id}</Badge>
                                                            <span className="text-xs text-green-600 ml-1">
                                {getOrderDateDisplay(order.order_time)}
                              </span>
                                                        </div>
                                                        <span
                                                            className="text-xs font-medium text-green-800">{formatCurrency(order.total_amount)}</span>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="p-2 pt-0">
                                                    <div className="text-xs">
                                                        <div
                                                            className="max-h-36 overflow-y-auto border border-green-100 rounded-md divide-y divide-green-100">
                                                            {order.items && order.items.length > 0 ? (
                                                                order.items.map(item => (
                                                                    <div key={item.id}
                                                                         className="p-1.5 hover:bg-green-50/50">
                                                                        <div className="flex items-center gap-1">
                                                                            <div
                                                                                className="flex-1 flex items-center gap-1">
                                                                                <span
                                                                                    className={cn("font-medium truncate", item.status === 'cancelled' && "text-red-500")}>{item.name}</span>
                                                                                <span
                                                                                    className={cn("text-green-600", item.status === 'cancelled' && "text-red-500")}>×{item.quantity}</span>
                                                                                {(isTrackingEnabled || item.status === 'cancelled') && (
                                                                                    <Badge
                                                                                        className={cn("px-1 py-0.5 text-xs ml-auto", getStatusBadgeStyles(item.status || 'unknown'))}>
                                                                                        {item.status ? (item.status.charAt(0).toUpperCase() + item.status.slice(1)) : 'Unknown'}
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="p-2 text-center text-green-400">
                                                                    No items in this order
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between mt-2">
                                                        {isTrackingEnabled && (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-xs h-7 text-green-700 hover:bg-green-100"
                                                                    onClick={() => onUpdateOrderStatus(order.id, 'preparing')}
                                                                    disabled={order.allowed_next_states && !order.allowed_next_states.includes('preparing')}
                                                                >
                                                                    ← Back to Preparing
                                                                </Button>
                                                                {/* Delivered button for takeaway and quick-bill orders */}
                                                                {(order.order_type === 'takeaway' || order.order_type === 'quick-bill') ? (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="text-xs h-7 text-green-700 hover:bg-green-100"
                                                                        onClick={() => handleMarkAsDelivered(order)}
                                                                    >
                                                                        <CheckCircle className="h-3 w-3 mr-1"/> Delivered
                                                                    </Button>
                                                                ) : (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="text-xs h-7 text-green-700 hover:bg-green-100"
                                                                        onClick={() => onUpdateOrderStatus(order.id, 'paid')}
                                                                        disabled={order.allowed_next_states && !order.allowed_next_states.includes('paid')}
                                                                    >
                                                                        Mark as Paid →
                                                                    </Button>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}

                                    {filteredOrders.filter(order => order.status === 'served').length === 0 && (
                                        <div className="text-center p-4 text-green-400 text-sm">
                                            No orders in this column
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Paid Orders Column */}
                            <div className="flex flex-col">
                                <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-t-md">
                                    <h3 className="font-semibold text-purple-800 dark:text-purple-200 flex items-center">
                                        <span>PAID</span>
                                        <Badge
                                            className="ml-2 bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-200">
                                            {filteredOrders.filter(order => order.status === 'paid').length}
                                        </Badge>
                                    </h3>
                                </div>
                                <div
                                    className="bg-purple-50 dark:bg-purple-950 p-2 rounded-b-md flex-1 min-h-[70vh] overflow-auto custom-scrollbar">
                                    {/* Similar card structure as placed orders but with paid status */}
                                    {filteredOrders
                                        .filter(order => order.status === 'paid')
                                        .map(order => (
                                            <Card key={order.id}
                                                  className="mb-3 overflow-hidden hover:shadow-md border-purple-200">
                                                {/* Card content similar to placed orders but with paid-specific actions */}
                                                <CardHeader className="p-2 pb-1 bg-purple-50">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-1">
                              <span className="font-medium text-sm text-purple-800">
                                {order.order_type === 'takeaway'
                                    ? (
                                        <span className="flex items-center">
                                      Takeaway
                                            {order.token_number && (
                                                <Badge
                                                    className="ml-1 bg-purple-100 text-purple-800 border-purple-300 text-xs">
                                                    {order.token_number}
                                                </Badge>
                                            )}
                                    </span>
                                    )
                                    : order.order_type === 'quick-bill'
                                        ? (
                                            <span className="flex items-center">
                                        Quick Bill
                                                {order.token_number && (
                                                    <Badge
                                                        className="ml-1 bg-purple-100 text-purple-800 border-purple-300 text-xs">
                                                        {order.token_number}
                                                    </Badge>
                                                )}
                                      </span>
                                        )
                                        : `Table ${order.table_id || 'Unknown'}`}
                              </span>
                                                            <Badge variant="outline"
                                                                   className="text-xs border-purple-300 text-purple-700">#{order.id}</Badge>
                                                            <span className="text-xs text-purple-600 ml-1">
                                {getOrderDateDisplay(order.order_time)}
                              </span>
                                                        </div>
                                                        <span
                                                            className="text-xs font-medium text-purple-800">{formatCurrency(order.total_amount)}</span>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="p-2 pt-0">
                                                    <div className="text-xs">
                                                        <div
                                                            className="max-h-36 overflow-y-auto border border-purple-100 rounded-md divide-y divide-purple-100">
                                                            {order.items && order.items.length > 0 ? (
                                                                order.items.map(item => (
                                                                    <div key={item.id}
                                                                         className="p-1.5 hover:bg-purple-50/50">
                                                                        <div className="flex items-center gap-1">
                                                                            <div
                                                                                className="flex-1 flex items-center gap-1">
                                                                                <span
                                                                                    className={cn("font-medium truncate", item.status === 'cancelled' && "text-red-500")}>{item.name}</span>
                                                                                <span
                                                                                    className={cn("text-purple-600", item.status === 'cancelled' && "text-red-500")}>×{item.quantity}</span>
                                                                                {(isTrackingEnabled || item.status === 'cancelled') && (
                                                                                    <Badge
                                                                                        className={cn("px-1 py-0.5 text-xs ml-auto", getStatusBadgeStyles(item.status || 'unknown'))}>
                                                                                        {item.status ? (item.status.charAt(0).toUpperCase() + item.status.slice(1)) : 'Unknown'}
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="p-2 text-center text-purple-400">
                                                                    No items in this order
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                </CardContent>
                                            </Card>
                                        ))}

                                    {filteredOrders.filter(order => order.status === 'paid').length === 0 && (
                                        <div className="text-center p-4 text-purple-400 text-sm">
                                            No orders in this column
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};
