import {useEffect, useState} from 'react';
import {
  ArrowLeft, 
  Clock, 
  Loader2, 
  Minus, 
  Plus, 
  RefreshCw
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Order} from '@/types';
import {format} from 'date-fns';
import {useOrderStore, useRestaurantStore} from '@/lib/store';
import {toast} from '@/lib/toast';
import {usePermissions} from '@/hooks/usePermissions';
import {useNavigate, useParams} from 'react-router-dom';
import {PaymentDialog} from '@/components/payment-dialog';
import {Badge} from '@/components/ui/badge';
import {cn} from '@/lib/utils';
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from '@/components/ui/card';

/**
 * Full page component for viewing and managing orders
 * Replaces the view-orders-dialog component with a better UI experience
 */
const ViewOrdersPage = () => {
  const navigate = useNavigate();
  const { tableId } = useParams();
  const table_id = tableId ? parseInt(tableId) : undefined;

  const { updateOrderItem, getOrdersByTable, fetchOrders } = useOrderStore();
  const { restaurant, fetchRestaurant } = useRestaurantStore();
  const { isServer } = usePermissions();

  const [processingItemId, setProcessingItemId] = useState<number | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  // Fetch orders for the table
  useEffect(() => {
    if (table_id) {
      const getTableOrders = async () => {

        // First fetch all orders from the API to ensure we have the latest data
        // This is especially important on hard refresh when the store might be empty
        await fetchOrders();

        // Then filter the orders for this table
        const tableOrders = getOrdersByTable(table_id);
        const activeOrders = tableOrders.filter(order => 
          order.status !== 'paid' && order.status !== 'cancelled'
        );
        setOrders(activeOrders);
        setIsLoading(false); // Set loading to false after initial fetch
      };

      // Initial fetch
      getTableOrders();

      // Set up polling every 3 seconds for real-time updates
      const intervalId = setInterval(getTableOrders, 3000);

      // Clean up interval on unmount
      return () => clearInterval(intervalId);
    }
  }, [table_id, getOrdersByTable, fetchOrders]);

  // Fetch restaurant data when page loads
  useEffect(() => {
    if (!restaurant) {
      fetchRestaurant();
    }
  }, [restaurant, fetchRestaurant]);

  // Helper function to get the order total, either from the API or calculated from items
  const getOrderTotal = (order: Order) => {
    // If the order has a total_amount from the API, use it
    if (order.total_amount) {
      return order.total_amount;
    }

    // Otherwise, calculate it from the items (for backward compatibility)
    const nonCancelledItems = order?.items?.filter(item => item.status !== 'cancelled') || [];
    return nonCancelledItems.reduce((total, item) => total + (item.quantity * item.price), 0);
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
    };
  };

  const handleQuantityChange = async (orderId: number, itemId: number, delta: number, currentQuantity: number) => {
    if (processingItemId) return;
    if (currentQuantity + delta < 1) {
      toast.error('Quantity cannot be less than 1');
      return;
    }

    const order = orders.find(o => o.id === orderId);
    if (!order || order.status === 'preparing') return;

    try {
      setProcessingItemId(itemId);
      const newQuantity = currentQuantity + delta;
      await updateOrderItem(orderId, itemId, { quantity: newQuantity });

      // Fetch the updated orders to get the correct totals and GST details
      if (table_id) {
        // First fetch all orders from the API to ensure we have the latest data
        await fetchOrders();

        // Then filter the orders for this table
        const tableOrders = getOrdersByTable(table_id);
        const activeOrders = tableOrders.filter(order => 
          order.status !== 'paid' && order.status !== 'cancelled'
        );
        setOrders(activeOrders);
      }

    } catch {
      toast.error('Failed to update order quantity');
    } finally {
      setProcessingItemId(null);
    }
  };

  const handleItemStatusChange = async (orderId: number, itemId: number, newStatus: Order['items'][0]['status']) => {
    if (processingItemId) return;

    try {
      setProcessingItemId(itemId);
      await updateOrderItem(orderId, itemId, { status: newStatus });

      // Fetch the updated orders to get the correct totals and GST details
      if (table_id) {
        // First fetch all orders from the API to ensure we have the latest data
        await fetchOrders();

        // Then filter the orders for this table
        const tableOrders = getOrdersByTable(table_id);
        const activeOrders = tableOrders.filter(order => 
          order.status !== 'paid' && order.status !== 'cancelled'
        );
        setOrders(activeOrders);
      }

      toast.success(`Item marked as ${newStatus}`);
    } catch (err) {
      console.error('Failed to update item status:', err);
      toast.error('Failed to update item status');
    } finally {
      setProcessingItemId(null);
    }
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

  const handlePayment = (order: Order) => {
    setSelectedOrder(order);
    setShowPaymentDialog(true);
  };

  const handlePaymentComplete = (order: Order) => {
    // Update local state to reflect the payment
    setOrders(prevOrders => prevOrders.filter(o => o.id !== order.id));
    setShowPaymentDialog(false);
    setSelectedOrder(null);

    // If no more orders, navigate back to tables
    if (orders.length <= 1) {
      toast.success('All orders paid. Returning to tables.');
      setTimeout(() => {
        navigate('/tables');
      }, 1500);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Page header with back button and controls */}
      <div className="flex flex-col gap-3 p-3 sm:p-4 border-b sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/tables')}
              className="mr-1 sm:mr-2 h-9 w-9 sm:h-10 sm:w-10"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <h1 className="text-lg sm:text-xl font-semibold truncate max-w-[180px] sm:max-w-none">
              {table_id ? `Table ${table_id} Orders` : 'Current Orders'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {table_id && (
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate(`/create-order/${table_id}`)}
                className="whitespace-nowrap"
              >
                Add Items
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Orders list */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="h-16 w-16 text-muted-foreground mb-4">🍽️</div>
            <h3 className="text-lg font-semibold">No Orders Found</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              There are no active orders for this table. You can create a new order or go back to the tables view.
            </p>
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => navigate('/tables')}
              >
                Back to Tables
              </Button>

              {table_id && (
                <Button
                  onClick={() => navigate(`/create-order/${table_id}`)}
                >
                  Create Order
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden w-full">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                        <Badge className={cn(getStatusBadgeStyles(order.status))}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <Clock className="inline-block mr-1 h-4 w-4" />
                        {format(new Date(order.order_time), 'MMM d, h:mm a')}
                      </p>
                    </div>

                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handlePayment(order)} 
                      className="self-start"
                      // disabled={order.status !== 'served'}
                    >
                      Process Payment
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="pb-3">
                  <div className="max-h-60 overflow-auto rounded-md border">
                    {/* Desktop view - Table */}
                    <div className="hidden md:block">
                      <table className="w-full">
                        <thead className="bg-muted/50 text-xs">
                          <tr className="text-left">
                            <th className="p-2">Item</th>
                            <th className="p-2 text-center">Qty</th>
                            <th className="p-2 text-right">Price</th>
                            <th className="p-2 text-center">Status</th>
                            <th className="p-2 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                          {(order?.items || []).map((item) => (
                            <tr key={item.id} className="hover:bg-muted/30">
                              <td className="p-2">{item.name}</td>
                              <td className="p-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {item.status === 'placed' && (
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => handleQuantityChange(order.id, item.id, -1, item.quantity)}
                                      disabled={processingItemId === item.id}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                  )}
                                  <span>{item.quantity}</span>
                                  {item.status === 'placed' && (
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => handleQuantityChange(order.id, item.id, 1, item.quantity)}
                                      disabled={processingItemId === item.id}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </td>
                              <td className="p-2 text-right">₹{(item.quantity * item?.price)?.toFixed(2)}</td>
                              <td className="p-2 text-center">
                                <Badge className={cn("px-1.5 py-0.5 text-xs", getStatusBadgeStyles(item.status))}>
                                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                </Badge>
                              </td>
                              <td className="p-2 text-center">
                                {processingItemId === item.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                                ) : (
                                  <div className="flex items-center justify-center gap-1">
                                    {item.status === 'placed' && !isServer && (
                                      <>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-red-500 hover:text-red-700 hover:bg-red-100"
                                          onClick={() => handleItemStatusChange(order.id, item.id, 'cancelled')}
                                        >
                                          Cancel
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-amber-500 hover:text-amber-700 hover:bg-amber-100"
                                          onClick={() => handleItemStatusChange(order.id, item.id, 'preparing')}
                                        >
                                          Prepare
                                        </Button>
                                      </>
                                    )}
                                    {item.status === 'preparing' && !isServer && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-green-500 hover:text-green-700 hover:bg-green-100"
                                        onClick={() => handleItemStatusChange(order.id, item.id, 'served')}
                                      >
                                        Serve
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile view - Card layout */}
                    <div className="md:hidden divide-y">
                      {(order?.items || []).map((item) => (
                        <div key={item.id} className="p-3 hover:bg-muted/30">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.name}</p>
                              <div className="flex items-center mt-1">
                                <Badge className={cn("px-1.5 py-0.5 text-xs mr-2", getStatusBadgeStyles(item.status))}>
                                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  ₹{(item.quantity * item?.price)?.toFixed(2)}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 ml-2">
                              {item.status === 'placed' && (
                                <div className="flex items-center border rounded-md">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleQuantityChange(order.id, item.id, -1, item.quantity)}
                                    disabled={processingItemId === item.id}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="w-6 text-center">{item.quantity}</span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleQuantityChange(order.id, item.id, 1, item.quantity)}
                                    disabled={processingItemId === item.id}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                              {item.status !== 'placed' && (
                                <div className="px-2 py-1 border rounded-md">
                                  <span className="text-sm">{item.quantity}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action buttons for mobile */}
                          {processingItemId === item.id ? (
                            <div className="flex justify-center py-1">
                              <Loader2 className="h-5 w-5 animate-spin" />
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {item.status === 'placed' && !isServer && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-100 h-9 flex-1"
                                    onClick={() => handleItemStatusChange(order.id, item.id, 'cancelled')}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-amber-500 hover:text-amber-700 hover:bg-amber-100 h-9 flex-1"
                                    onClick={() => handleItemStatusChange(order.id, item.id, 'preparing')}
                                  >
                                    Prepare
                                  </Button>
                                </>
                              )}
                              {item.status === 'preparing' && !isServer && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-500 hover:text-green-700 hover:bg-green-100 h-9 w-full"
                                  onClick={() => handleItemStatusChange(order.id, item.id, 'served')}
                                >
                                  Serve
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-t pt-3 gap-3">
                  <div className="text-sm text-muted-foreground">
                    Server: {order.server || 'Unknown'}
                  </div>

                  <div className="flex flex-col items-start sm:items-end w-full sm:w-auto">
                    {/* Show GST details if available */}
                    {order.sub_total > 0 && (
                      <div className="text-xs text-muted-foreground mb-1 space-y-0.5 w-full">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>₹{getGstDetails(order).subTotal.toFixed(2)}</span>
                        </div>
                        {getGstDetails(order).sgstAmount > 0 && (
                          <div className="flex justify-between">
                            <span>SGST ({getGstDetails(order).sgstRate}%):</span>
                            <span>₹{getGstDetails(order).sgstAmount.toFixed(2)}</span>
                          </div>
                        )}
                        {getGstDetails(order).cgstAmount > 0 && (
                          <div className="flex justify-between">
                            <span>CGST ({getGstDetails(order).cgstRate}%):</span>
                            <span>₹{getGstDetails(order).cgstAmount.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-between w-full sm:justify-end sm:gap-3">
                      <p className="text-lg font-semibold">₹{getOrderTotal(order).toFixed(2)}</p>
                      <Button
                        onClick={() => handlePayment(order)}
                        // disabled={order.status !== 'served'}
                        variant={'default'}
                        size="sm"
                        className="ml-4 sm:ml-0"
                      >
                        Pay
                      </Button>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Payment Dialog */}
      {selectedOrder && (
        <PaymentDialog
          open={showPaymentDialog}
          onClose={() => setShowPaymentDialog(false)}
          order={selectedOrder}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </div>
  );
};

export default ViewOrdersPage;