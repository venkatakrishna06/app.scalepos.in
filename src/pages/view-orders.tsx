import {useEffect, useState} from 'react';
import {ArrowLeft, CheckCircle2, Clock, CreditCard, Loader2, Minus, Plus, XCircle} from 'lucide-react';
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

/**
 * Full page component for viewing and managing orders
 * Replaces the view-orders-dialog component with a better UI experience
 */
const ViewOrdersPage = () => {
  const navigate = useNavigate();
  const { tableId } = useParams();
  const table_id = tableId ? parseInt(tableId) : undefined;

  const { updateOrderItem, getOrdersByTable } = useOrderStore();
  const { restaurant, fetchRestaurant } = useRestaurantStore();
  const { isServer } = usePermissions();

  const [processingItemId, setProcessingItemId] = useState<number | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Fetch orders for the table
  useEffect(() => {
    if (table_id) {
      const tableOrders = getOrdersByTable(table_id);
      const activeOrders = tableOrders.filter(order => 
        order.status !== 'paid' && order.status !== 'cancelled'
      );
      setOrders(activeOrders);
    }
  }, [table_id, getOrdersByTable]);

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

      // Update local state to reflect the change
      setOrders(prevOrders => 
        prevOrders.map(o => 
          o.id === orderId 
            ? {
                ...o,
                items: o.items?.map(item => 
                  item.id === itemId 
                    ? { ...item, quantity: newQuantity }
                    : item
                )
              }
            : o
        )
      );

      toast.success('Order quantity updated');
    } catch (err) {
      console.error('Failed to update order quantity:', err);
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

      // Update local state to reflect the change
      setOrders(prevOrders => 
        prevOrders.map(o => 
          o.id === orderId 
            ? {
                ...o,
                items: o.items?.map(item => 
                  item.id === itemId 
                    ? { ...item, status: newStatus }
                    : item
                )
              }
            : o
        )
      );

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
      {/* Page header with back button */}
      <div className="flex items-center justify-between p-2 border-b sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/tables')}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">
            {table_id ? `Table ${table_id} Orders` : 'Current Orders'}
          </h1>
        </div>

        {table_id && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/create-order/${table_id}`)}
          >
            Add Items
          </Button>
        )}
      </div>

      {/* Orders list */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="h-16 w-16 text-muted-foreground mb-4">🍽️</div>
            <h3 className="text-lg font-semibold">No Active Orders</h3>
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
                  Create New Order
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="rounded-lg border bg-card p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-lg font-semibold">Order #{order.id}</span>
                    <span className="text-sm text-muted-foreground">
                      <Clock className="mr-1 inline-block h-4 w-4" />
                      {format(new Date(order.order_time), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  <div>
                    <Badge className={cn(getStatusBadgeStyles(order.status))}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </div>
                </div>

                {/* Table view for medium and larger screens */}
                <div className="hidden md:block mb-4">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-muted-foreground">
                        <th className="pb-2">Item</th>
                        <th className="pb-2">Qty</th>
                        <th className="pb-2">Price</th>
                        <th className="pb-2">Total</th>
                        <th className="pb-2">Status</th>
                        {!isServer && (
                          <th className="pb-2">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {(order?.items || []).map((item) => (
                        <tr key={item.id}>
                          <td className="py-2">{item.name}</td>
                          <td className="py-2">{item.quantity}</td>
                          <td className="py-2">₹{item?.price?.toFixed(2)}</td>
                          <td className="py-2">₹{(item.quantity * item?.price)?.toFixed(2)}</td>
                          <td className="py-2">
                            <Badge className={cn("px-2 py-1 text-xs font-medium", getStatusBadgeStyles(item.status))}>
                              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                            </Badge>
                          </td>
                          <td className="py-2">
                            {item.status === 'placed' && (
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuantityChange(order.id, item.id, -1, item.quantity)}
                                  disabled={processingItemId === item.id}
                                >
                                  {processingItemId === item.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Minus className="h-3 w-3" />
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuantityChange(order.id, item.id, 1, item.quantity)}
                                  disabled={processingItemId === item.id}
                                >
                                  {processingItemId === item.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Plus className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            )}
                            {!isServer && item.status === 'placed' && (
                              <div className="flex items-center gap-2 mt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleItemStatusChange(order.id, item.id, 'cancelled')}
                                  disabled={processingItemId === item.id}
                                >
                                  {processingItemId === item.id ? (
                                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                  ) : (
                                    <XCircle className="mr-2 h-3 w-3" />
                                  )}
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleItemStatusChange(order.id, item.id, 'preparing')}
                                  disabled={processingItemId === item.id}
                                >
                                  {processingItemId === item.id ? (
                                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                  ) : (
                                    <span>Prepare</span>
                                  )}
                                </Button>
                              </div>
                            )}
                            {item.status === 'preparing' && !isServer && (
                              <Button
                                size="sm"
                                onClick={() => handleItemStatusChange(order.id, item.id, 'served')}
                                disabled={processingItemId === item.id}
                              >
                                {processingItemId === item.id ? (
                                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="mr-2 h-3 w-3" />
                                )}
                                Mark Served
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Card view for small screens */}
                <div className="md:hidden space-y-4 mb-4">
                  {(order?.items || []).map((item) => (
                    <div key={item.id} className="border rounded-md p-3 bg-background">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{item.name}</h4>
                          <div className="text-sm text-muted-foreground mt-1">
                            {item.quantity} × ₹{item?.price?.toFixed(2)} = ₹{(item.quantity * item?.price)?.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <Badge className={cn("px-2 py-1 text-xs font-medium", getStatusBadgeStyles(item.status))}>
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-3">
                        {item.status === 'placed' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9"
                              onClick={() => handleItemStatusChange(order.id, item.id, 'cancelled')}
                              disabled={processingItemId === item.id}
                            >
                              {processingItemId === item.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <XCircle className="mr-2 h-4 w-4" />
                              )}
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              className="h-9"
                              onClick={() => handleItemStatusChange(order.id, item.id, 'preparing')}
                              disabled={processingItemId === item.id}
                            >
                              {processingItemId === item.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <span>Start Preparing</span>
                              )}
                            </Button>
                          </>
                        )}
                        {item.status === 'preparing' && !isServer && (
                          <Button
                            size="sm"
                            className="h-9"
                            onClick={() => handleItemStatusChange(order.id, item.id, 'served')}
                            disabled={processingItemId === item.id}
                          >
                            {processingItemId === item.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                            )}
                            Mark Served
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t pt-4">
                  <div className="text-sm text-muted-foreground">
                    Server: {order.server}
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="text-left sm:text-right">
                      {/* Show GST details if available */}
                      {order.sub_total > 0 && (
                        <div className="text-xs text-muted-foreground mb-1 space-y-0.5">
                          <p>Subtotal: ₹{getGstDetails(order).subTotal.toFixed(2)}</p>
                          {getGstDetails(order).sgstAmount > 0 && (
                            <p>SGST ({getGstDetails(order).sgstRate}%): ₹{getGstDetails(order).sgstAmount.toFixed(2)}</p>
                          )}
                          {getGstDetails(order).cgstAmount > 0 && (
                            <p>CGST ({getGstDetails(order).cgstRate}%): ₹{getGstDetails(order).cgstAmount.toFixed(2)}</p>
                          )}
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-lg font-semibold">₹{getOrderTotal(order).toFixed(2)}</p>
                    </div>
                    <Button
                      onClick={() => handlePayment(order)}
                      disabled={order.status !== 'served'}
                      variant={order.status === 'served' ? 'default' : 'outline'}
                      className="w-full sm:w-auto"
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Pay
                    </Button>
                  </div>
                </div>
              </div>
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
