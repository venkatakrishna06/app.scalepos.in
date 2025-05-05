import { useState } from 'react';
import { Dialog } from './ui/dialog';
import { Button } from './ui/button';
import { usePaymentStore, useOrderStore, useMenuStore, useTableStore } from '@/lib/store';
import { Payment, Order } from '@/types';

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  order: Order;
}

export function PaymentDialog({ open, onClose, order }: PaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<Payment['payment_method']>('cash');
  const { addPayment } = usePaymentStore();
  const { updateOrder } = useOrderStore();
  const { menuItems } = useMenuStore();
  const { updateTableStatus } = useTableStore();

  const handlePayment = async () => {
    const payment = {
      order_id: order.id,
      amount_paid: calculateTotal(),
      payment_method: paymentMethod,
      paid_at: new Date().toISOString()
    };

    await addPayment(payment);
    await updateTableStatus(order.table_id, 'available');
    updateOrder(order.id, { status: 'served' });
    onClose();
  };

  const calculateTotal = () => {
    return order.items.reduce((sum, item) => {
      const menuItem = menuItems.find(m => m.id === item.menu_item_id);
      return sum + (menuItem?.price || 0) * item.quantity;
    }, 0);
  };

  return (
      <Dialog open={open} onClose={onClose} title="Process Payment">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Order Summary</h3>
            <div className="mt-2 space-y-2">
              {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>{item.name} x {item.quantity}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
              ))}
              <div className="border-t pt-2">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>${order.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-lg font-medium">Payment Method</h3>
            <div className="flex gap-4">
              <Button
                  variant={paymentMethod === 'cash' ? 'primary' : 'outline'}
                  onClick={() => setPaymentMethod('cash')}
              >
                Cash
              </Button>
              <Button
                  variant={paymentMethod === 'card' ? 'primary' : 'outline'}
                  onClick={() => setPaymentMethod('card')}
              >
                Card
              </Button>
            </div>
          </div>

          <Button onClick={handlePayment} className="w-full">
            Complete Payment
          </Button>
        </div>
      </Dialog>
  );
}