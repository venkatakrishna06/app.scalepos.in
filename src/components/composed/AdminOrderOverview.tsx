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
import { statusBadge } from "@/ui/theme/status-styles";
import {toast} from '@/lib/toast';
import {Order} from '@/types';

import {FilterDropdownContainer} from './FilterDropdownContainer';
import {useRestaurant} from "@/api";
import {useCreatePayment} from "@/api/payments";
import {useUpdateOrderStatus} from "@/api/orders";
import {PermissionGuard} from './permission-guard';
import {PERMISSIONS, ROLES} from '@/lib/auth/roles';

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

    // Helper function to get status badge styling (centralized)
    const getStatusBadgeStyles = (status: string) => statusBadge(status);

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
            
          //  toast.success('Order delivered');
            
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
        const orderDate = new Date(order.order_time.replace(/Z$/, ''));
        const now = new Date();

            // Timeframe filter
            let matchesTimeframe = true;
            if (filterTimeframe !== 'all') {
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
        <div className="space-y-2">
            {/* Page header with title and actions */}

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
                                    className="pl-9 focus-visible:ring-focus"
                                />
                            </div>


                            <FilterDropdownContainer>
                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                    <SelectTrigger className="w-[130px] sm:w-[140px]">
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

                                {/*<Select value={filterPaymentMethod} onValueChange={setFilterPaymentMethod}>*/}
                                {/*    <SelectTrigger className="w-[130px] sm:w-[140px] border-blue-200">*/}
                                {/*        <SelectValue placeholder="Payment"/>*/}
                                {/*    </SelectTrigger>*/}
                                {/*    <SelectContent>*/}
                                {/*        <SelectItem value="all">All Payments</SelectItem>*/}
                                {/*        <SelectItem value="cash">Cash</SelectItem>*/}
                                {/*        <SelectItem value="card">Card</SelectItem>*/}
                                {/*        <SelectItem value="upi">UPI</SelectItem>*/}
                                {/*    </SelectContent>*/}
                                {/*</Select>*/}

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
                            <Button variant="outline" size="sm" onClick={onRefreshOrders}
                                    className="border-info/40 hover:bg-info/10">
                                <ArrowUpDown className="mr-2 h-4 w-4 text-info"/>
                                Refresh
                            </Button>

                            <PermissionGuard permission={ROLES.ADMIN}>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="border-info/40 hover:bg-info/10">
                                            <Download className="mr-2 h-4 w-4 text-info"/>
                                            Export
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={exportOrdersToCSV}>
                                            Export as CSV
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator/>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </PermissionGuard>
                        </div>
                    </div>
                </div>

                <TabsContent value={activeTab} className="mt-6">
                    {viewLayout === 'grid' ? (
                        // Grid View
                        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                            {filteredOrders.map((order) => (
                                <Card key={order.id} className="overflow-hidden border-info/30 hover:shadow-md">
                                    <CardHeader className="pb-3 bg-info/10 border-b border-info/20">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <CardTitle className="text-lg text-info">
                                                        {order.order_type === 'takeaway'
                                                            ? (
                                                                <div className="flex items-center">
                                                                    <span>Takeaway</span>
                                                                    {order.token_number && (
                                                                        <Badge
                                                                            className="ml-2 bg-info/10 text-info border-info/40">
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
                                                                                className="ml-2 bg-info/10 text-info border-info/40">
                                                                                Token: {order.token_number}
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                )
                                                                : `Table ${order?.table?.table_number || 'Unknown'}`}
                                                    </CardTitle>
                                                    <Badge variant="outline"
                                                           className="border-info/50 text-info">#{order.id}</Badge>
                                                </div>
                                                <CardDescription className="mt-1">
                                                    {getOrderDateDisplay(order.order_time)}
                                                </CardDescription>
                                            </div>
                                            {(isTrackingEnabled || order.status === 'cancelled' || order.status === 'paid' || order.status === 'placed') && (
                                                <Badge variant="outline" className={cn(getStatusBadgeStyles(order.status))}>
                                                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Coffee className="h-4 w-4 text-info"/>
                                            <span>Server: {order.server || 'Unknown'}</span>
                                        </div>
                                    </CardHeader>


                                        <div className="space-y-1">

                                            {order.payment_method && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <CreditCard className="h-4 w-4 text-info"/>
                                                    <span>Payment: {order.payment_method.charAt(0).toUpperCase() + order.payment_method.slice(1)}</span>
                                                </div>
                                            )}

                                            {/* Token number is now displayed in the title for takeaway and quick-bill orders */}
                                            {order.token_number && order.order_type === 'dine-in' && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <FileText className="h-4 w-4 text-info"/>
                                                    <span>Token: {order.token_number}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div
                                            className="max-h-40 overflow-auto  border border-info/20 custom-scrollbar">
                                            <table className="w-full">
                                                <thead className="bg-info/10 text-xs">
                                                <tr className="text-left">
                                                    <th className="p-2 text-info">Item</th>
                                                    <th className="p-2 text-info">Qty</th>
                                                    <th className="p-2 text-info">Total</th>

                                                    <th className="p-2 text-info">Status</th>

                                                </tr>
                                                </thead>
                                                <tbody className="divide-y divide-info/20 text-xs">
                                                {(order?.items || []).length > 0 ? (
                                                    (order.items || []).map((item) => (
                                                        <tr key={item.id} className="hover:bg-info/10">
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
                                        className="flex items-center justify-between border-t border-info/20 bg-info/10 pt-3">
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
                                                    className="border-info/50 hover:bg-info/10 text-info"
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
                                                        className="border-success/50 hover:bg-success/10 text-success"
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
                                                  className="text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
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
                                            <p className="text-xs text-info">Total Amount</p>
                                            <TooltipProvider>
                                                <Tooltip 
                                                    open={openTooltips[order.id]} 
                                                    onOpenChange={(open) => setOpenTooltips(prev => ({...prev, [order.id]: open}))}
                                                >
                                                    <TooltipTrigger asChild>
                                                        <p 
                                                            className="text-base font-semibold text-info cursor-help"
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
                                    className="col-span-full rounded-lg border border-dashed border-info/30 p-8 text-center">
                                    <FileText className="mx-auto h-8 w-8 text-info"/>
                                    <h3 className="mt-2 text-lg font-semibold text-info">No Orders Found</h3>
                                    <p className="mt-1 text-sm text-info">
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
                                <div className="bg-info/15 p-3 rounded-t-md">
                                    <h3 className="font-semibold text-info flex items-center">
                                        <span>PLACED</span>
                                        <Badge className={cn("ml-2", getStatusBadgeStyles('placed'))}>
                                            {filteredOrders.filter(order => order.status === 'placed').length}
                                        </Badge>
                                    </h3>
                                </div>
                                <div
                                    className="bg-info/10 p-2 rounded-b-md flex-1 min-h-[70vh] overflow-auto custom-scrollbar">
                                    {filteredOrders
                                        .filter(order => order.status === 'placed')
                                        .map(order => (
                                            <Card key={order.id}
                                                  className="mb-3 overflow-hidden hover:shadow-md border-info/30">
                                                <CardHeader className="p-2 pb-1 bg-info/10">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-1">
                              <span className="font-medium text-sm text-info">
                                {order.order_type === 'takeaway'
                                    ? (
                                        <span className="flex items-center">
                                      Takeaway
                                            {order.token_number && (
                                                <Badge
                                                    className="ml-1 bg-info/10 text-info border-info/40 text-xs">
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
                                                        className="ml-1 bg-info/10 text-info border-info/40 text-xs">
                                                        {order.token_number}
                                                    </Badge>
                                                )}
                                      </span>
                                        )
                                        : `Table ${order.table_id || 'Unknown'}`}
                              </span>
                                                            <Badge variant="outline"
                                                                   className="text-xs border-info/50 text-info">#{order.id}</Badge>
                                                            <span className="text-xs text-info ml-1">
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
                                                                        className="text-xs font-medium text-info cursor-help"
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
                                                            className="max-h-36 overflow-y-auto border border-info/20 rounded-md divide-y divide-info/20">
                                                            {order.items && order.items.length > 0 ? (
                                                                order.items.map(item => (
                                                                    <div key={item.id}
                                                                         className="p-1.5 hover:bg-info/10">
                                                                        <div className="flex items-center gap-1">
                                                                            <div
                                                                                className="flex-1 flex items-center gap-1">
                                                                                <span
                                                                                    className={cn("font-medium truncate", item.status === 'cancelled' && "text-red-500")}>{item.name}</span>
                                                                                <span
                                                                                    className={cn("text-info", item.status === 'cancelled' && "text-destructive")}>×{item.quantity}</span>
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
                                                                                    className="text-warning text-xs h-6 px-1.5 ml-1"
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
                                                                <div className="p-2 text-center text-info">
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
                                                                className="text-xs h-7 text-info hover:bg-info/10"
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
                                                                    className="text-xs h-7 text-warning hover:bg-warning/10"
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
                                        <div className="text-center p-4 text-info text-sm">
                                            No orders in this column
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Preparing Orders Column */}
                            <div className="flex flex-col">
                                <div className="bg-warning/15 p-3 rounded-t-md">
                                    <h3 className="font-semibold text-warning flex items-center">
                                        <span>PREPARING</span>
                                        <Badge className={cn("ml-2", getStatusBadgeStyles('preparing'))}>
                                            {filteredOrders.filter(order => order.status === 'preparing').length}
                                        </Badge>
                                    </h3>
                                </div>
                                <div
                                    className="bg-warning/10 p-2 rounded-b-md flex-1 min-h-[70vh] overflow-auto custom-scrollbar">
                                    {/* Similar card structure as placed orders but with preparing status */}
                                    {filteredOrders
                                        .filter(order => order.status === 'preparing')
                                        .map(order => (
                                            <Card key={order.id}
                                                  className="mb-3 overflow-hidden hover:shadow-md border-warning/30">
                                                {/* Card content similar to placed orders but with preparing-specific actions */}
                                                <CardHeader className="p-2 pb-1 bg-warning/10">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-1">
                              <span className="font-medium text-sm text-warning">
                                {order.order_type === 'takeaway'
                                    ? (
                                        <span className="flex items-center">
                                      Takeaway
                                            {order.token_number && (
                                                <Badge
                                                    className="ml-1 bg-warning/10 text-warning border-warning/40 text-xs">
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
                                                        className="ml-1 bg-warning/10 text-warning border-warning/40 text-xs">
                                                        {order.token_number}
                                                    </Badge>
                                                )}
                                      </span>
                                        )
                                        : `Table ${order.table_id || 'Unknown'}`}
                              </span>
                                                            <Badge variant="outline"
                                                                   className="text-xs border-warning/50 text-warning">#{order.id}</Badge>
                                                            <span className="text-xs text-warning ml-1">
                                {getOrderDateDisplay(order.order_time)}
                              </span>
                                                        </div>
                                                        <span
                                                            className="text-xs font-medium text-warning">{formatCurrency(order.total_amount)}</span>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="p-2 pt-0">
                                                    <div className="text-xs">
                                                        <div
                                                            className="max-h-36 overflow-y-auto border border-warning/20 rounded-md divide-y divide-warning/20">
                                                            {order.items && order.items.length > 0 ? (
                                                                order.items.map(item => (
                                                                    <div key={item.id}
                                                                         className="p-1.5 hover:bg-warning/10">
                                                                        <div className="flex items-center gap-1">
                                                                            <div
                                                                                className="flex-1 flex items-center gap-1">
                                                                                <span
                                                                                    className={cn("font-medium truncate", item.status === 'cancelled' && "text-red-500")}>{item.name}</span>
                                                                                <span
                                                                                    className={cn("text-warning", item.status === 'cancelled' && "text-destructive")}>×{item.quantity}</span>
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
                                                                <div className="p-2 text-center text-warning">
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
                                <div className="bg-success/15 p-3 rounded-t-md">
                                    <h3 className="font-semibold text-success flex items-center">
                                        <span>SERVED</span>
                                        <Badge className={cn("ml-2", getStatusBadgeStyles('served'))}>
                                            {filteredOrders.filter(order => order.status === 'served').length}
                                        </Badge>
                                    </h3>
                                </div>
                                <div
                                    className="bg-success/10 p-2 rounded-b-md flex-1 min-h-[70vh] overflow-auto custom-scrollbar">
                                    {/* Similar card structure as placed orders but with served status */}
                                    {filteredOrders
                                        .filter(order => order.status === 'served')
                                        .map(order => (
                                            <Card key={order.id}
                                                  className="mb-3 overflow-hidden hover:shadow-md border-success/30">
                                                {/* Card content similar to placed orders but with served-specific actions */}
                                                <CardHeader className="p-2 pb-1 bg-success/10">
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
                                <div className="bg-purple-200 dark:bg-purple-800 p-3 rounded-t-md">
                                    <h3 className="font-semibold text-purple-900 dark:text-purple-100 flex items-center">
                                        <span>PAID</span>
                                        <Badge className={cn("ml-2", getStatusBadgeStyles('paid'))}>
                                            {filteredOrders.filter(order => order.status === 'paid').length}
                                        </Badge>
                                    </h3>
                                </div>
                                <div
                                    className="bg-purple-100 dark:bg-purple-900 p-2 rounded-b-md flex-1 min-h-[70vh] overflow-auto custom-scrollbar">
                                    {/* Similar card structure as placed orders but with paid status */}
                                    {filteredOrders
                                        .filter(order => order.status === 'paid')
                                        .map(order => (
                                            <Card key={order.id}
                                                  className="mb-3 overflow-hidden hover:shadow-md border-purple-300">
                                                {/* Card content similar to placed orders but with paid-specific actions */}
                                                <CardHeader className="p-2 pb-1 bg-purple-100">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-1">
                              <span className="font-medium text-sm text-purple-900">
                                {order.order_type === 'takeaway'
                                    ? (
                                        <span className="flex items-center">
                                      Takeaway
                                            {order.token_number && (
                                                <Badge
                                                    className="ml-1 bg-purple-200 text-purple-900 border-purple-400 text-xs">
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
                                                        className="ml-1 bg-purple-200 text-purple-900 border-purple-400 text-xs">
                                                        {order.token_number}
                                                    </Badge>
                                                )}
                                      </span>
                                        )
                                        : `Table ${order.table_id || 'Unknown'}`}
                              </span>
                                                            <Badge variant="outline"
                                                                   className="text-xs border-purple-400 text-purple-800">#{order.id}</Badge>
                                                            <span className="text-xs text-purple-700 ml-1">
                                {getOrderDateDisplay(order.order_time)}
                              </span>
                                                        </div>
                                                        <span
                                                            className="text-xs font-medium text-purple-900">{formatCurrency(order.total_amount)}</span>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="p-2 pt-0">
                                                    <div className="text-xs">
                                                        <div
                                                            className="max-h-36 overflow-y-auto border border-purple-200 rounded-md divide-y divide-purple-200">
                                                            {order.items && order.items.length > 0 ? (
                                                                order.items.map(item => (
                                                                    <div key={item.id}
                                                                         className="p-1.5 hover:bg-purple-100/50">
                                                                        <div className="flex items-center gap-1">
                                                                            <div
                                                                                className="flex-1 flex items-center gap-1">
                                                                                <span
                                                                                    className={cn("font-medium truncate", item.status === 'cancelled' && "text-red-500")}>{item.name}</span>
                                                                                <span
                                                                                    className={cn("text-purple-700", item.status === 'cancelled' && "text-red-500")}>×{item.quantity}</span>
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
                                                                <div className="p-2 text-center text-purple-500">
                                                                    No items in this order
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                </CardContent>
                                            </Card>
                                        ))}

                                    {filteredOrders.filter(order => order.status === 'paid').length === 0 && (
                                        <div className="text-center p-4 text-purple-500 text-sm">
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
