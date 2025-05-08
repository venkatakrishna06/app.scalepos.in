import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import {
  Clock,
  CreditCard,
  Plus,
  Minus,
  XCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { Order } from '@/types';
import { format } from 'date-fns';
import { useOrderStore } from '@/lib/store';
import { toast } from 'sonner';
import { useState } from 'react';

interface ViewOrdersDialogProps {
  open: boolean;
  onClose: () => void;
  orders: Order[];
  onPayment: (order: Order) => void;
}

export function ViewOrdersDialog({ open, onClose, orders, onPayment }: ViewOrdersDialogProps) {
  const { updateOrderItem, removeOrderItem, loading } = useOrderStore();
  const [processingItemId, setProcessingItemId] = useState<number | null>(null);
  const activeOrders = orders.filter(order => order.status !== 'paid' && order.status !== 'cancelled');
  const completedOrders = orders.filter(order => order.status === 'paid' || order.status === 'cancelled');

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
    } catch (error) {
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
    } catch (error) {
      toast.error('Failed to update item status');
    } finally {
      setProcessingItemId(null);
    }
  };

  const canEditOrder = (status: Order['status']) => {
    return status === 'placed';
  };

  if (loading) {
    return (
      <Dialog open={open}>
        <DialogContent onClose={onClose}>
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open}>
      <DialogContent onClose={onClose} className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Table Orders</DialogTitle>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto px-1">
        {activeOrders.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-4 text-lg font-semibold">Active Orders</h3>
            <div className="space-y-4">
              {activeOrders.map((order) => (
                <div key={order.id} className="rounded-lg border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
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
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-sm text-muted-foreground">
                          <th className="pb-2">Item</th>
                          <th className="pb-2">Qty</th>
                          <th className="pb-2">Price</th>
                          <th className="pb-2">Total</th>
                          {canEditOrder(order.status) && (
                            <th className="pb-2">Actions</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item) => (
                          <tr key={item.id}>
                            <td className="py-1">{item.name}</td>
                            <td className="py-1">{item.quantity}</td>
                            <td className="py-1">₹{item.price.toFixed(2)}</td>
                            <td className="py-1">₹{(item.quantity * item.price).toFixed(2)}</td>
                            {canEditOrder(item.status) && (
                              <td className="py-1">
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
                              </td>
                            )}
                            <div className="flex items-center gap-2">
                              {item.status === 'placed' && (
                                  <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleItemStatusChange(order.id,item.id, 'cancelled')}
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
                                      <span>
                                      Start Preparing
                                        </span>
                                      )}
                                    </Button>
                                  </>
                              )}
                              {item.status === 'preparing' && (
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
                            </div>
                            {
                                item.status === 'cancelled' && (
                                    <span className="rounded-full px-2 py-1 text-xs font-medium bg-red-100 text-red-800">
                                        Cancelled
                                    </span>
                                )
                                }
                                {
                                item.status === 'served' && (
                                    <span className="rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
                                        Served
                                    </span>
                                )
                            }

                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t pt-4">
                    <div className="text-sm text-muted-foreground">
                      Server: {order.server}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="text-lg font-semibold">₹{order.total_amount?.toFixed(2)}</p>
                      </div>
                      <Button
                        onClick={() => onPayment(order)}
                        disabled={order.status !== 'served'}
                        variant={order.status === 'served' ? 'default' : 'outline'}
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

        {completedOrders.length > 0 && (
          <div>
            <h3 className="mb-4 text-lg font-semibold">Order History</h3>
            <div className="space-y-4">
              {completedOrders.map((order) => (
                <div key={order.id} className="rounded-lg border bg-muted/10 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Order #{order.id}</span>
                      <span className="text-sm text-muted-foreground">
                        <Clock className="mr-1 inline-block h-4 w-4" />
                        {format(new Date(order.order_time), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <div>
                      <span className={`rounded-full px-2 py-1 text-sm font-medium ${
                        order.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 text-sm text-muted-foreground">
                    {order.items.map((item) => (
                      <div key={item.id}>
                        {item.quantity}x {item.name}
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t pt-4 text-sm">
                    <div className="font-medium">
                      Total: ${order.total_amount.toFixed(2)}
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
