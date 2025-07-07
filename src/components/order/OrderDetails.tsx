import React from 'react';
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Separator} from '@/components/ui/separator';
import {Clock, CreditCard} from 'lucide-react';
import {format} from 'date-fns';
import {Order} from '@/types';
import {OrderItemCard, OrderItemRow} from './OrderItem';
import {useRestaurantStore} from '@/lib/store';

interface OrderDetailsProps {
  order: Order;
  onPayment?: (order: Order) => void;
  handleQuantityChange: (orderId: number, itemId: number, delta: number, currentQuantity: number) => Promise<void>;
  handleItemStatusChange: (orderId: number, itemId: number, newStatus: string) => Promise<void>;
  handleCancelItem: (orderId: number, itemId: number) => Promise<void>;
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

/**
 * Component for rendering the details of an order
 * Includes order header, items list, and footer with payment button
 */
export const OrderDetails: React.FC<OrderDetailsProps> = ({
  order,
  onPayment,
  handleQuantityChange,
  handleItemStatusChange,
  handleCancelItem,
  processingItemId,
  getOrderTotal,
  getGstDetails,
  getStatusBadgeClass,
  isServer
}) => {
  // Get restaurant data to check if order tracking is enabled
  const { restaurant } = useRestaurantStore();
  const isTrackingEnabled = restaurant?.enable_order_status_tracking || false;
  // Only show order status badge if tracking is enabled or order is cancelled
  const showOrderStatusBadge = isTrackingEnabled || order.status === 'cancelled';
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
          {showOrderStatusBadge && (
            <Badge className={getStatusBadgeClass(order.status)}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Badge>
          )}
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
                  {/*<th className="pb-2 font-medium">Status</th>*/}
                  {/*{!isServer && <th className="pb-2 font-medium">Actions</th>}*/}
                </tr>
              </thead>
              <tbody>
                {(order?.items || []).map((item) => (
                  <OrderItemRow
                    key={item.id}
                    item={item}
                    orderId={order.id}
                    processingItemId={processingItemId}
                    isServer={isServer}
                    getStatusBadgeClass={getStatusBadgeClass}
                    handleQuantityChange={handleQuantityChange}
                    handleItemStatusChange={handleItemStatusChange}
                    handleCancelItem={handleCancelItem}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile view */}
          <div className="md:hidden space-y-4">
            {(order?.items || []).map((item) => (
              <OrderItemCard
                key={item.id}
                item={item}
                orderId={order.id}
                processingItemId={processingItemId}
                isServer={isServer}
                getStatusBadgeClass={getStatusBadgeClass}
                handleQuantityChange={handleQuantityChange}
                handleItemStatusChange={handleItemStatusChange}
                handleCancelItem={handleCancelItem}
              />
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter className="px-0 flex-col sm:flex-row items-start sm:items-center justify-between border-t pt-3">
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
              // disabled={isTrackingEnabled ? order.status !== 'served' : order.status !== 'placed'}
              variant={ 'default'}
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
};
