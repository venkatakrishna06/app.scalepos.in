import {useEffect, useMemo, useState} from 'react';
import {
    ArrowUpDown,
    Clock,
    Coffee,
    CreditCard,
    Download,
    Edit,
    FileText,
    Printer,
    Search,
    Trash2,
    User
} from 'lucide-react';
import {OrdersSkeleton} from '@/components/skeletons/orders-skeleton';
import {Button} from '@/components/ui/button';
import {useErrorHandler} from '@/lib/hooks/useErrorHandler';
import {useOrder} from '@/lib/hooks/useOrder';
import {format, isToday, isYesterday, subDays} from 'date-fns';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Input} from '@/components/ui/input';
import {Tabs, TabsContent} from '@/components/ui/tabs';
import {FilterDropdownContainer} from '@/components/FilterDropdownContainer';
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
import {ViewOrdersDialog} from '@/components/view-orders-dialog';
import {Order} from '@/types';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export default function Orders() {
  const { handleError } = useErrorHandler();

  // Use React Query hooks instead of Zustand store
  const { useOrdersQuery, updateOrder } = useOrder();

  // State for view orders dialog
  const [isViewOrdersDialogOpen, setIsViewOrdersDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // State for cancel confirmation dialog
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);

  // State for filter parameters
  const [queryParams, setQueryParams] = useState<{
    period?: 'day' | 'week' | 'month';
    start_date?: string;
    end_date?: string;
    table_number?: number;
    order_type?: string;
  }>({});

  // Use React Query to fetch orders
  const { 
    data: orders = [], 
    isLoading: ordersLoading, 
    error: ordersError,
    refetch: refetchOrders
  } = useOrdersQuery(queryParams);

  // Set up polling for orders when the dialog is open
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (isViewOrdersDialogOpen && selectedOrderId !== null) {
      // Initial refetch
      refetchOrders();

      // Set up polling every 3 seconds
      intervalId = setInterval(() => {
        refetchOrders();
      }, 3000);
    }

    // Cleanup interval on unmount or when dialog closes
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isViewOrdersDialogOpen, selectedOrderId, refetchOrders]);

  // Filtering and sorting state
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTimeframe, setFilterTimeframe] = useState<string>('today');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('all');
  const [filterOrderType, setFilterOrderType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [activeTab, setActiveTab] = useState<string>('all');

  // Update query parameters when filter timeframe or order type changes
  useEffect(() => {
    const params: {
      period?: 'day' | 'week' | 'month';
      start_date?: string;
      end_date?: string;
      table_number?: number;
      order_type?: string;
    } = {};

    // Map the UI filter timeframe to API parameters
    switch (filterTimeframe) {
      case 'today':
        params.period = 'day';
        break;
      case 'week':
        params.period = 'week';
        break;
      case 'month':
        params.period = 'month';
        break;
      case 'yesterday': {
        // For yesterday, set explicit start_date and end_date
        const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
        params.start_date = yesterday;
        params.end_date = yesterday;
        break;
      }
      case 'all':
        // For "all time", don't set any time-related parameters
        break;
    }

    // Add order type filter if not 'all'
    if (filterOrderType !== 'all') {
      params.order_type = filterOrderType;
    }

    setQueryParams(params);
  }, [filterTimeframe, filterOrderType]);

  // Log React Query data to console (this ensures the queries are active for DevTools)
  useEffect(() => {


  }, [orders, ordersLoading]);

  // Update selectedOrder when orders data changes
  useEffect(() => {
    if (orders.length > 0 && selectedOrderId && isViewOrdersDialogOpen) {
      const updatedOrder = orders.find(order => order.id === selectedOrderId);
      if (updatedOrder) {
        setSelectedOrder(updatedOrder);
      }
    }
  }, [orders, selectedOrderId, isViewOrdersDialogOpen]);

  // const getTableNumber = (tableId: number | undefined) => {
  //   if (tableId === undefined || tableId === null) {
  //     return 'Unknown';
  //   }
  //   const table = tables.find(t => t.id === tableId);
  //   return table ? table.table_number : tableId;
  // };

  const refreshOrders = async () => {
    try {
      // Reset all filters to initial state
      setFilterStatus('all');
      setFilterTimeframe('today');
      setFilterPaymentMethod('all');
      setFilterOrderType('all');
      setSearchQuery('');
      setSortBy('newest');
      setActiveTab('all');
      // Optionally reset queryParams as well
      setQueryParams({});
      await refetchOrders();
      toast.success('Orders refreshed successfully');
    } catch (err) {
      handleError(err);
    }
  }

  // Show cancel confirmation dialog
  const showCancelConfirmation = (order: Order) => {
    setOrderToCancel(order);
    setIsCancelDialogOpen(true);
  };

  // Handle canceling an order after confirmation
  const handleCancelOrder = async () => {
    if (!orderToCancel) return;

    try {
      // Update order status to cancelled
      await updateOrder({ 
        id: orderToCancel.id, 
        order: { status: 'cancelled' } 
      });

      toast.success('Order cancelled successfully');
      // Refresh orders to update the UI
      await refetchOrders();
      // Close the dialog
      setIsCancelDialogOpen(false);
      setOrderToCancel(null);
    } catch (err) {
      handleError(err);
    }
  }

  // Handle editing an order
  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setSelectedOrderId(order.id);
    setIsViewOrdersDialogOpen(true);
  }

  // Handle payment for an order (used by ViewOrdersDialog)
  const handlePayment = (order: Order) => {
    // This would typically open a payment dialog or redirect to payment page
    toast.info(`Payment for order #${order.id} would be processed here`);
    setIsViewOrdersDialogOpen(true);
  }

  // Handle closing the view orders dialog
  const handleCloseViewOrdersDialog = () => {
    setIsViewOrdersDialogOpen(false);
    setSelectedOrder(null);
    setSelectedOrderId(null);
    // Refresh orders to update the UI with any changes made in the dialog
    refetchOrders();
  }
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

  // Get order date display
  const getOrderDateDisplay = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return `Today, ${format(date, 'h:mm a')}`;
    } else if (isYesterday(date)) {
      return `Yesterday, ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, h:mm a');
    }
  };

  // Filter and sort orders
  const filteredOrders = useMemo(() => {
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
        const tableText = `Table ${order.table?.table_number || 'Unknown'}`;
        const tokenNumberText = order.token_number ? String(order.token_number) : '';

        const matchesSearch = searchQuery === '' || (
          customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          serverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tableText.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tokenNumberText.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return matchesStatus && matchesTimeframe && matchesPaymentMethod && matchesOrderType && matchesTab && matchesSearch;
      })
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
            return new Date(b.order_time).getTime() - new Date(a.order_time).getTime();
        }
      });
  }, [orders, filterStatus, filterTimeframe, filterPaymentMethod, activeTab, searchQuery, sortBy]);

  // Loading state
  if (ordersLoading) {
    return <OrdersSkeleton />;
  }

  // Error state
  if (ordersError) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="mx-auto max-w-md text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Error Loading Orders</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {ordersError instanceof Error ? ordersError.message : 'An error occurred while loading orders'}
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
      {/* Page header with title and actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refreshOrders()}>
            <ArrowUpDown className="mr-2 h-4 w-4" />
            Refresh
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toast.success("CSV export started")}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.success("PDF export started")}>
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => toast.success("Print started")}>
                <Printer className="mr-2 h-4 w-4" />
                Print Orders
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs for order status filtering */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/*<TabsList className="grid w-full grid-cols-4">*/}
        {/*  <TabsTrigger value="all">All Orders</TabsTrigger>*/}
        {/*  <TabsTrigger value="active">Active</TabsTrigger>*/}
        {/*  <TabsTrigger value="completed">Completed</TabsTrigger>*/}
        {/*  <TabsTrigger value="cancelled">Cancelled</TabsTrigger>*/}
        {/*</TabsList>*/}

        <div className="mt-6">
          {/* Filters and search */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by order #, token, table, customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <FilterDropdownContainer>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[130px] sm:w-[140px]">
                    <SelectValue placeholder="Status" />
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
                  <SelectTrigger className="w-[130px] sm:w-[140px]">
                    <SelectValue placeholder="Timeframe" />
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
                  <SelectTrigger className="w-[130px] sm:w-[140px]">
                    <SelectValue placeholder="Payment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payments</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterOrderType} onValueChange={setFilterOrderType}>
                  <SelectTrigger className="w-[130px] sm:w-[140px]">
                    <SelectValue placeholder="Order Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="dine-in">Dine-in</SelectItem>
                    <SelectItem value="takeaway">Takeaway</SelectItem>
                    <SelectItem value="quick-bill">Quick Bill</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Sort by" />
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

        <TabsContent value="all" className="mt-6">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">
                        {order.order_type === 'takeaway'
                            ? 'Takeaway'
                            : order.order_type === 'quick-bill'
                                ? 'Quick Bill'
                                : `Table ${order.table?.table_number || 'Unknown'}`}
                      </CardTitle>
                      <Badge variant="outline">#{order.id}</Badge>
                    </div>
                    <CardDescription className="mt-1">
                      {getOrderDateDisplay(order.order_time)}
                    </CardDescription>
                  </div>
                  <Badge className={cn(getStatusBadgeStyles(order.status))}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pb-3">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Customer: {order.customer || 'Walk-in'}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Coffee className="h-4 w-4 text-muted-foreground" />
                    <span>Server: {order.server || 'Unknown'}</span>
                  </div>

                  {order.payment_method && (
                    <div className="flex items-center gap-2 text-sm">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span>Payment: {order.payment_method.charAt(0).toUpperCase() + order.payment_method.slice(1)}</span>
                    </div>
                  )}

                  {order.token_number && (
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>Token: {order.token_number}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 max-h-40 overflow-auto rounded-md border">
                  <table className="w-full">
                    <thead className="bg-muted/50 text-xs">
                      <tr className="text-left">
                        <th className="p-2">Item</th>
                        <th className="p-2">Qty</th>
                        <th className="p-2">Total</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-xs">
                      {(order?.items || []).length > 0 ? (
                        (order.items || []).map((item) => (
                          <tr key={item.id} className="hover:bg-muted/30">
                            <td className="p-2">{item.name || 'Unknown Item'}</td>
                            <td className="p-2">{item.quantity || 0}</td>
                            <td className="p-2">{formatCurrency((item.quantity || 0) * (item.price || 0))}</td>
                            <td className="p-2">
                              <Badge variant="outline" className={cn("px-1.5 py-0", getStatusBadgeStyles(item.status || 'unknown'))}>
                                {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Unknown'}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-muted-foreground">
                            No items in this order
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-between border-t bg-muted/10 pt-3">
                <div className="flex gap-2">
                  {/* Show buttons for all orders but disable based on order type and status:
                    - For dine-in orders: Enable only when status is 'placed'
                    - For takeaway and quick bill: Enable even after paid status
                    - For all order types: Disable when status is 'cancelled' */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleEditOrder(order)}
                    disabled={
                      order.status === 'cancelled' || 
                      (order.order_type === 'dine-in' && order.status !== 'placed') ||
                      order.status === 'paid'
                    }
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => showCancelConfirmation(order)}
                    disabled={
                      order.status === 'cancelled' || 
                      (order.order_type === 'dine-in' && order.status !== 'placed') ||
                      (order.status === 'paid' && order.order_type !== 'takeaway' && order.order_type !== 'quick-bill')
                    }
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>

                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total Amount</p>
                  <p className="text-base font-semibold">
                    {formatCurrency(order.total_amount)}
                  </p>
                </div>
              </CardFooter>
            </Card>
          ))}

          {filteredOrders.length === 0 && (
            <div className="col-span-full rounded-lg border border-dashed p-8 text-center">
              <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold">No Orders Found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your filters or search criteria
              </p>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="active" className="mt-6">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredOrders
            .filter(order => ['placed', 'preparing', 'served'].includes(order.status))
            .map((order) => (
              <Card key={order.id} className="overflow-hidden">
                {/* Same card content as above */}
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">
                          {order.order_type === 'takeaway' ? 'Takeaway' : `Table ${order.table?.table_number || 'Unknown'}`}
                        </CardTitle>
                        <Badge variant="outline">#{order.id}</Badge>
                      </div>
                      <CardDescription className="mt-1">
                        {getOrderDateDisplay(order.order_time)}
                      </CardDescription>
                    </div>
                    <Badge className={cn(getStatusBadgeStyles(order.status))}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>

                {/* Card content and footer same as above */}
                <CardContent className="pb-3">
                  {/* Content same as above */}
                </CardContent>

                <CardFooter className="flex items-center justify-between border-t bg-muted/10 pt-3">
                  {/* Footer same as above */}
                </CardFooter>
              </Card>
            ))}

          {filteredOrders.filter(order => ['placed', 'preparing', 'served'].includes(order.status)).length === 0 && (
            <div className="col-span-full rounded-lg border border-dashed p-8 text-center">
              <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold">No Active Orders</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                All orders have been completed or cancelled
              </p>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="completed" className="mt-6">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredOrders
            .filter(order => order.status === 'paid')
            .map((order) => (
              <Card key={order.id} className="overflow-hidden">
                {/* Same card content as above */}
              </Card>
            ))}

          {filteredOrders.filter(order => order.status === 'paid').length === 0 && (
            <div className="col-span-full rounded-lg border border-dashed p-8 text-center">
              <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold">No Completed Orders</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                No orders have been paid yet
              </p>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="cancelled" className="mt-6">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredOrders
            .filter(order => order.status === 'cancelled')
            .map((order) => (
              <Card key={order.id} className="overflow-hidden">
                {/* Same card content as above */}
              </Card>
            ))}

          {filteredOrders.filter(order => order.status === 'cancelled').length === 0 && (
            <div className="col-span-full rounded-lg border border-dashed p-8 text-center">
              <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold">No Cancelled Orders</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                No orders have been cancelled
              </p>
            </div>
          )}
        </div>
      </TabsContent>
      </Tabs>

      {/* View Orders Dialog for editing orders */}
      {selectedOrder && (
        <ViewOrdersDialog
          open={isViewOrdersDialogOpen}
          onClose={handleCloseViewOrdersDialog}
          orders={[selectedOrder]}
          onPayment={handlePayment}
        />
      )}

      {/* Cancel Order Confirmation Dialog */}
      <Dialog open={isCancelDialogOpen}>
        <DialogContent 
          onClose={() => {
            setIsCancelDialogOpen(false);
            setOrderToCancel(null);
          }}
          className="max-w-md"
        >
          <DialogHeader className="pb-2">
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {orderToCancel && (
            <div className="my-2 rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Order #{orderToCancel.id}</span>
                <Badge className={cn(getStatusBadgeStyles(orderToCancel.status))}>
                  {orderToCancel.status.charAt(0).toUpperCase() + orderToCancel.status.slice(1)}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1.5">
                  {orderToCancel.order_type === 'takeaway' ? (
                    <Coffee className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span>
                    {orderToCancel.order_type === 'takeaway'
                      ? 'Takeaway'
                      : orderToCancel.order_type === 'quick-bill'
                        ? 'Quick Bill'
                        : `Table ${orderToCancel.table?.table_number || 'Unknown'}`}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{getOrderDateDisplay(orderToCancel.order_time)}</span>
                </div>

                <div className="flex items-center gap-1.5 col-span-2">
                  <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Total: {formatCurrency(orderToCancel.total_amount)}</span>
                </div>
              </div>

              {orderToCancel.items && orderToCancel.items.length > 0 && (
                <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                  <p>{orderToCancel.items.length} item(s) will be cancelled</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsCancelDialogOpen(false);
                setOrderToCancel(null);
              }}
              className="flex-1 sm:flex-initial"
            >
              No, Keep Order
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelOrder}
              className="flex-1 sm:flex-initial"
            >
              Yes, Cancel Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
