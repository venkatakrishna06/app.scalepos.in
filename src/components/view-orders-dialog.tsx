import {Dialog, DialogContent, DialogHeader, DialogTitle} from './ui/dialog';
import {Button} from './ui/button';
import {
  CheckCircle2, 
  Clock, 
  CreditCard, 
  Loader2, 
  Minus, 
  Plus, 
  XCircle,
  Info
} from 'lucide-react';
import {Order} from '@/types';
import {format} from 'date-fns';
import {useOrderStore} from '@/lib/store';
import {toast} from '@/lib/toast';
import {useState} from 'react';
import {usePermissions} from '@/hooks/usePermissions';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Separator} from "@/components/ui/separator";

interface ViewOrdersDialogProps {
  open: boolean;
  onClose: () => void;
  orders: Order[];
  onPayment?: (order: Order) => void;
}

export function ViewOrdersDialog({ open, onClose, orders, onPayment }: ViewOrdersDialogProps) {
  const { updateOrderItem } = useOrderStore();
  const { isServer } = usePermissions();
  const [processingItemId, setProcessingItemId] = useState<number | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);

  // Filter active orders (not paid or cancelled)
  const activeOrders = orders.filter(order => order.status !== 'paid' && order.status !== 'cancelled');

  // Set the first order as active if none is selected and there are orders
  if (activeOrders.length > 0 && activeOrderId === null) {
    setActiveOrderId(activeOrders[0].id);
  }

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

  // Get status badge color based on status
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'placed':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'preparing':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'ready':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'served':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };


  const handleQuantityChange = async (orderId: number, itemId: number, delta: number, currentQuantity: number) => {
    if (processingItemId) return;
    if( currentQuantity + delta < 1) {
        toast.error('Quantity cannot be less than 1');
        return;
    }

    const order = orders.find(o => o.id === orderId);
    if (!order || order.status === 'preparing') return;

    try {
      setProcessingItemId(itemId);
      const newQuantity = currentQuantity + delta;
      await updateOrderItem(orderId, itemId, {quantity: newQuantity});

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

  // const canEditOrder = (status: Order['status']) => {
  //   // Server role should not see action buttons
  //   if (isServer) {
  //     return false;
  //   }
  //   return status === 'placed';
  // };


  // Define the OrderDetails component props type
  interface OrderDetailsProps {
    order: Order;
    onPayment?: (order: Order) => void;
    handleQuantityChange: (orderId: number, itemId: number, delta: number, currentQuantity: number) => Promise<void>;
    handleItemStatusChange: (orderId: number, itemId: number, newStatus: string) => Promise<void>;
    processingItemId: number | null;
    getOrderTotal: (order: Order) => number;
    getGstDetails: (order: Order) => {
      subTotal: number;
      sgstRate: number;
      cgstRate: number;
      sgstAmount: number;
      cgstAmount: number;
      totalGstAmount: number;
    };
    getStatusBadgeClass: (status: string) => string;
    isServer: boolean;
  }

  // Separate component for order details to avoid repetition
  function OrderDetails({ 
    order, 
    onPayment, 
    handleQuantityChange, 
    handleItemStatusChange, 
    processingItemId,
    getOrderTotal,
    getGstDetails,
    getStatusBadgeClass,
    isServer
  }: OrderDetailsProps) {
    return (
      <Card className="border-0 shadow-none">
        <CardHeader className="px-0 pt-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <CardTitle className="text-xl">Order #{order.id}</CardTitle>
              <CardDescription className="sm:mt-0">
                <Clock className="inline-block h-4 w-4 mr-1" />
                {format(new Date(order.order_time), 'MMM d, h:mm a')}
              </CardDescription>
            </div>
            <Badge className={getStatusBadgeClass(order.status)}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Badge>
          </div>
          <Separator className="my-2" />
        </CardHeader>

        <CardContent className="p-0 px-0 space-y-4">
          <div className="h-[40vh] overflow-y-auto pr-2">
            {/* Desktop view */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground border-b">
                    <th className="pb-2 font-medium">Item</th>
                    <th className="pb-2 font-medium">Qty</th>
                    <th className="pb-2 font-medium">Price</th>
                    <th className="pb-2 font-medium">Total</th>
                    <th className="pb-2 font-medium">Status</th>
                    {!isServer && <th className="pb-2 font-medium">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {(order?.items || []).map((item) => (
                    <tr key={item.id} className="border-b border-muted last:border-0">
                      <td className="py-3">{item.name}</td>
                      <td className="py-3">
                        {item.status === 'placed' ? (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleQuantityChange(order.id, item.id, -1, item.quantity)}
                              disabled={processingItemId === item.id}
                            >
                              {processingItemId === item.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Minus className="h-3 w-3" />
                              )}
                            </Button>
                            <span className="w-6 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
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
                        ) : (
                          item.quantity
                        )}
                      </td>
                      <td className="py-3">₹{item?.price?.toFixed(2)}</td>
                      <td className="py-3">₹{(item.quantity * item?.price)?.toFixed(2)}</td>
                      <td className="py-3">
                        <Badge className={getStatusBadgeClass(item.status)}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-3">
                        {!isServer && item.status === 'placed' && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleItemStatusChange(order.id, item.id, 'cancelled')}
                              disabled={processingItemId === item.id}
                            >
                              {processingItemId === item.id ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : (
                                <XCircle className="h-3 w-3 mr-1" />
                              )}
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleItemStatusChange(order.id, item.id, 'preparing')}
                              disabled={processingItemId === item.id}
                            >
                              {processingItemId === item.id ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : (
                                "Prepare"
                              )}
                            </Button>
                          </div>
                        )}
                        {!isServer && item.status === 'preparing' && (
                          <Button
                            size="sm"
                            onClick={() => handleItemStatusChange(order.id, item.id, 'ready')}
                            disabled={processingItemId === item.id}
                          >
                            {processingItemId === item.id ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                            )}
                            Mark Ready
                          </Button>
                        )}
                        {!isServer && item.status === 'ready' && (
                            <Button
                                size="sm"
                                onClick={() => handleItemStatusChange(order.id, item.id, 'served')}
                                disabled={processingItemId === item.id}
                            >
                              {processingItemId === item.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : (
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
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

            {/* Mobile view */}
            <div className="md:hidden space-y-4">
              {(order?.items || []).map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardHeader className="p-3 pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">{item.name}</CardTitle>
                      <Badge className={getStatusBadgeClass(item.status)}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="flex justify-between items-center mb-3">
                      <div className="text-sm">
                        {item.status === 'placed' ? (
                          <div className="flex items-center gap-1 mt-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleQuantityChange(order.id, item.id, -1, item.quantity)}
                              disabled={processingItemId === item.id}
                            >
                              {processingItemId === item.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Minus className="h-3 w-3" />
                              )}
                            </Button>
                            <span className="w-6 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
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
                        ) : (
                          <span>Quantity: {item.quantity}</span>
                        )}
                      </div>
                      <div className="text-sm font-medium">
                        ₹{(item.quantity * item?.price)?.toFixed(2)}
                      </div>
                    </div>

                    {!isServer && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {item.status === 'placed' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleItemStatusChange(order.id, item.id, 'cancelled')}
                              disabled={processingItemId === item.id}
                            >
                              {processingItemId === item.id ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : (
                                <XCircle className="h-3 w-3 mr-1" />
                              )}
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleItemStatusChange(order.id, item.id, 'preparing')}
                              disabled={processingItemId === item.id}
                            >
                              {processingItemId === item.id ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : (
                                "Prepare"
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
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                            )}
                            Mark Served
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>

        <CardFooter className="px-0 flex-col sm:flex-row items-start sm:items-center justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground mb-4 sm:mb-0">
            <span className="font-medium">Server:</span> {order.server}
          </div>

          <div className="flex flex-col sm:flex-row items-end gap-4 w-full sm:w-auto">
            <div className="text-right">
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
              <p className="text-sm font-medium">Total: <span className="text-lg">₹{getOrderTotal(order).toFixed(2)}</span></p>
            </div>

            {onPayment && (
              <Button
                onClick={() => onPayment(order)}
                disabled={order.status !== 'served'}
                variant={order.status === 'served' ? 'default' : 'outline'}
                className="w-full sm:w-auto"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Pay
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Dialog open={open}>
      <DialogContent onClose={onClose} className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
        </DialogHeader>

        {activeOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Info className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No Active Orders</h3>
            <p className="text-sm text-muted-foreground mt-2">There are no active orders to display.</p>
          </div>
        ) : (
          <>
            {/* Tabs for multiple orders */}
            {activeOrders.length > 1 && (
              <Tabs 
                defaultValue={activeOrderId?.toString()} 
                onValueChange={(value) => setActiveOrderId(parseInt(value))}
                className="w-full"
              >
                <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {activeOrders.map((order) => (
                    <TabsTrigger key={order.id} value={order.id.toString()}>
                      Order #{order.id}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {activeOrders.map((order) => (
                  <TabsContent key={order.id} value={order.id.toString()}>
                    <OrderDetails 
                      order={order}
                      onPayment={onPayment}
                      handleQuantityChange={handleQuantityChange}
                      handleItemStatusChange={handleItemStatusChange}
                      processingItemId={processingItemId}
                      getOrderTotal={getOrderTotal}
                      getGstDetails={getGstDetails}
                      getStatusBadgeClass={getStatusBadgeClass}
                      isServer={isServer}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            )}

            {/* Single order view (no tabs needed) */}
            {activeOrders.length === 1 && (
              <OrderDetails 
                order={activeOrders[0]}
                onPayment={onPayment}
                handleQuantityChange={handleQuantityChange}
                handleItemStatusChange={handleItemStatusChange}
                processingItemId={processingItemId}
                getOrderTotal={getOrderTotal}
                getGstDetails={getGstDetails}
                getStatusBadgeClass={getStatusBadgeClass}
                isServer={isServer}
              />
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
