import {Dialog, DialogContent, DialogHeader, DialogTitle,} from './ui/dialog';
import {Button} from './ui/button';
import {CheckCircle2, Clock, CreditCard, Loader2, XCircle} from 'lucide-react';
import {Order} from '@/types';
import {format} from 'date-fns';
import {useOrderStore, useRestaurantStore} from '@/lib/store';
import {toast} from '@/lib/toast';
import {useEffect, useState} from 'react';
import {usePermissions} from '@/hooks/usePermissions';

interface ViewOrdersDialogProps {
  open: boolean;
  onClose: () => void;
  orders: Order[];
  onPayment: (order: Order) => void;
}

export function ViewOrdersDialog({ open, onClose, orders, onPayment }: ViewOrdersDialogProps) {
  const { updateOrderItem, removeOrderItem, loading } = useOrderStore();
  const { restaurant, fetchRestaurant } = useRestaurantStore();
  const { isServer } = usePermissions();
  const [processingItemId, setProcessingItemId] = useState<number | null>(null);
  const activeOrders = orders.filter(order => order.status !== 'paid' && order.status !== 'cancelled');

  // Fetch restaurant data when dialog opens
  useEffect(() => {
    if (open && !restaurant) {
      fetchRestaurant();
    }
  }, [open, restaurant, fetchRestaurant]);

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

    const order = orders.find(o => o.id === orderId);
    if (!order || order.status === 'preparing') return;

    try {
      setProcessingItemId(itemId);
      const newQuantity = currentQuantity + delta;

      if (newQuantity <= 0) {
        await removeOrderItem(orderId, itemId);
        toast.success('Item removed from order');
      } else {
        await updateOrderItem(orderId, itemId, { quantity: newQuantity });
        toast.success('Order quantity updated');
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
      toast.success(`Item marked as ${newStatus}`);
    } catch {
      toast.error('Failed to update item status');
    } finally {
      setProcessingItemId(null);
    }
  };

  const canEditOrder = (status: Order['status']) => {
    // Server role should not see action buttons
    if (isServer) {
      return false;
    }
    return status === 'placed';
  };


  return (
      <Dialog open={open}>
        <DialogContent onClose={onClose} className="w-[95vw] max-w-[95vw] md:max-w-[90vw] lg:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Current Orders</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto px-1">
            {activeOrders.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-4 text-lg font-semibold">Orders</h3>
                  <div className="space-y-4">
                    {activeOrders.map((order) => (
                        <div key={order.id} className="rounded-lg border bg-card p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <span className="text-lg font-semibold">Order #{order.id}</span>
                              <span className="text-sm text-muted-foreground">
                                <Clock className="mr-1 inline-block h-4 w-4" />
                                {format(new Date(order.order_time), 'MMM d, h:mm a')}
                              </span>
                            </div>
                            <div>
                              <span className={`rounded-full px-2 py-1 text-sm font-medium ${
                                  order.status === 'placed' ? 'bg-blue-100 text-blue-800' :
                                      order.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                                          order.status === 'served' ? 'bg-green-100 text-green-800' :
                                              'bg-gray-100 text-gray-800'
                              }`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                            </div>
                          </div>

                          <div className="mt-4">
                            {/* Table view for medium and larger screens */}
                            <div className="hidden md:block">
                              <table className="w-full">
                                <thead>
                                <tr className="text-left text-sm text-muted-foreground">
                                  <th className="pb-2">Item</th>
                                  <th className="pb-2">Qty</th>
                                  <th className="pb-2">Price</th>
                                  <th className="pb-2">Total</th>
                                  <th className="pb-2">Status</th>
                                  {canEditOrder(order.status) && (
                                      <th className="pb-2">Actions</th>
                                  )}
                                </tr>
                                </thead>
                                <tbody>
                                {(order?.items || []).map((item) => (
                                    <tr key={item.id}>
                                      <td className="py-1">{item.name}</td>
                                      <td className="py-1">{item.quantity}</td>
                                      <td className="py-1">₹{item?.price?.toFixed(2)}</td>
                                      <td className="py-1">₹{(item.quantity * item?.price)?.toFixed(2)}</td>
                                      <td className="py-1">
                                        {item.status === 'cancelled' && (
                                            <span className="rounded-full px-2 py-1 text-xs font-medium bg-red-100 text-red-800">
                                              Cancelled
                                            </span>
                                        )}
                                        {item.status === 'served' && (
                                            <span className="rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
                                              Served
                                            </span>
                                        )}
                                        {item.status === 'preparing' && (
                                            <span className="rounded-full px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800">
                                              Preparing
                                            </span>
                                        )}
                                        {item.status === 'placed' && (
                                            <span className="rounded-full px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800">
                                              Placed
                                            </span>
                                        )}
                                      </td>
                                      <td className="py-1">
                                        {/*{canEditOrder(order.status) && item.status === 'placed' && (*/}
                                        {/*    <div className="flex items-center gap-2">*/}
                                        {/*      <Button*/}
                                        {/*          variant="outline"*/}
                                        {/*          size="sm"*/}
                                        {/*          onClick={() => handleQuantityChange(order.id, item.id, -1, item.quantity)}*/}
                                        {/*          disabled={processingItemId === item.id}*/}
                                        {/*      >*/}
                                        {/*        {processingItemId === item.id ? (*/}
                                        {/*            <Loader2 className="h-3 w-3 animate-spin" />*/}
                                        {/*        ) : (*/}
                                        {/*            <Minus className="h-3 w-3" />*/}
                                        {/*        )}*/}
                                        {/*      </Button>*/}
                                        {/*      <Button*/}
                                        {/*          variant="outline"*/}
                                        {/*          size="sm"*/}
                                        {/*          onClick={() => handleQuantityChange(order.id, item.id, 1, item.quantity)}*/}
                                        {/*          disabled={processingItemId === item.id}*/}
                                        {/*      >*/}
                                        {/*        {processingItemId === item.id ? (*/}
                                        {/*            <Loader2 className="h-3 w-3 animate-spin" />*/}
                                        {/*        ) : (*/}
                                        {/*            <Plus className="h-3 w-3" />*/}
                                        {/*        )}*/}
                                        {/*      </Button>*/}
                                        {/*    </div>*/}
                                        {/*)}*/}
                                        { !isServer && item.status === 'placed' && (
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
                                        { canEditOrder(order.status)&&item.status === 'preparing' && !isServer && (
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
                            <div className="md:hidden space-y-4">
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
                                        {item.status === 'cancelled' && (
                                            <span className="rounded-full px-2 py-1 text-xs font-medium bg-red-100 text-red-800">
                                          Cancelled
                                        </span>
                                        )}
                                        {item.status === 'served' && (
                                            <span className="rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
                                          Served
                                        </span>
                                        )}
                                        {item.status === 'preparing' && (
                                            <span className="rounded-full px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800">
                                          Preparing
                                        </span>
                                        )}
                                        {item.status === 'placed' && (
                                            <span className="rounded-full px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800">
                                          Placed
                                        </span>
                                        )}
                                      </div>
                                    </div>

                                    {/*{canEditOrder(order.status) && item.status === 'placed' && (*/}
                                    {/*    <div className="flex items-center gap-2 mt-3">*/}
                                    {/*      <Button*/}
                                    {/*          variant="outline"*/}
                                    {/*          size="sm"*/}
                                    {/*          className="h-8 w-8"*/}
                                    {/*          onClick={() => handleQuantityChange(order.id, item.id, -1, item.quantity)}*/}
                                    {/*          disabled={processingItemId === item.id}*/}
                                    {/*      >*/}
                                    {/*        {processingItemId === item.id ? (*/}
                                    {/*            <Loader2 className="h-4 w-4 animate-spin" />*/}
                                    {/*        ) : (*/}
                                    {/*            <Minus className="h-4 w-4" />*/}
                                    {/*        )}*/}
                                    {/*      </Button>*/}
                                    {/*      <span className="w-8 text-center">{item.quantity}</span>*/}
                                    {/*      <Button*/}
                                    {/*          variant="outline"*/}
                                    {/*          size="sm"*/}
                                    {/*          className="h-8 w-8"*/}
                                    {/*          onClick={() => handleQuantityChange(order.id, item.id, 1, item.quantity)}*/}
                                    {/*          disabled={processingItemId === item.id}*/}
                                    {/*      >*/}
                                    {/*        {processingItemId === item.id ? (*/}
                                    {/*            <Loader2 className="h-4 w-4 animate-spin" />*/}
                                    {/*        ) : (*/}
                                    {/*            <Plus className="h-4 w-4" />*/}
                                    {/*        )}*/}
                                    {/*      </Button>*/}
                                    {/*    </div>*/}
                                    {/*)}*/}

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
                                  onClick={() => onPayment(order)}
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
                </div>
            )}

          </div>
        </DialogContent>
      </Dialog>
  );
}
