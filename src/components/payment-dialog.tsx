import { useState, useEffect } from 'react';
import { Loader2, CreditCard, Wallet, Receipt, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { usePaymentStore, useOrderStore, useMenuStore, useTableStore } from '@/lib/store';
import { toast } from 'sonner';
import { Payment, Order } from '@/types';
import { format } from 'date-fns';

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  order: Order;
}

type PaymentStep = 'method' | 'processing' | 'complete';

export function PaymentDialog({ open, onClose, order }: PaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<Payment['payment_method']>('cash');
  const [currentStep, setCurrentStep] = useState<PaymentStep>('method');
  const { addPayment } = usePaymentStore();
  const { updateOrder } = useOrderStore();
  const { menuItems } = useMenuStore();
  const { updateTableStatus } = useTableStore();

  useEffect(() => {
    if (open) {
      setCurrentStep('method');
    }
  }, [open]);

  const handlePayment = async () => {
    setCurrentStep('processing');

    const payment = {
      order_id: order.id,
      amount_paid: calculateTotal(),
      payment_method: paymentMethod,
      paid_at: new Date().toISOString()
    };

    try {
      await addPayment(payment);
      await updateTableStatus(order.table_id, 'available');
      await updateOrder(order.id, { status: 'paid' });
      setCurrentStep('complete');
      toast.success('Payment processed successfully');
    } catch (error) {
      toast.error('Failed to process payment');
      setCurrentStep('method');
    }
  };

  const calculateTotal = () => {
    return order.items.reduce((sum, item) => {
      const menuItem = menuItems.find(m => m.id === item.menu_item_id);
      return sum + (menuItem?.price || 0) * item.quantity;
    }, 0);
  };

  const totalAmount = calculateTotal();

  const renderStep = () => {
    switch (currentStep) {
      case 'processing':
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-lg font-medium">Processing Payment...</p>
            <p className="text-sm text-muted-foreground">Please wait while we process your payment</p>
          </div>
        );

      case 'complete':
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <p className="mt-4 text-lg font-medium">Payment Complete!</p>
            <p className="text-sm text-muted-foreground">Thank you for your payment</p>
            <Button className="mt-6" onClick={onClose}>Close</Button>
          </div>
        );

      default:
        return (
          <>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">Order Summary</h3>
                <div className="mt-4 space-y-4">
                  <div className="rounded-lg border bg-card/50 p-4">
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="flex-1">
                            {item.name}
                            <span className="text-muted-foreground"> × {item.quantity}</span>
                          </span>
                          <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 border-t pt-4">
                      <div className="flex justify-between">
                        <span className="font-medium">Total Amount</span>
                        <span className="text-lg font-bold">₹{totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-lg font-medium">Payment Method</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <button
                    className={`flex items-center justify-center gap-3 rounded-lg border p-4 text-left transition-colors ${
                      paymentMethod === 'cash'
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-accent'
                    }`}
                    onClick={() => setPaymentMethod('cash')}
                  >
                    <Wallet className={`h-5 w-5 ${paymentMethod === 'cash' ? 'text-primary' : ''}`} />
                    <div>
                      <p className="font-medium">Cash</p>
                      <p className="text-sm text-muted-foreground">Pay with cash</p>
                    </div>
                  </button>
                  <button
                    className={`flex items-center justify-center gap-3 rounded-lg border p-4 text-left transition-colors ${
                      paymentMethod === 'card'
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-accent'
                    }`}
                    onClick={() => setPaymentMethod('card')}
                  >
                    <CreditCard className={`h-5 w-5 ${paymentMethod === 'card' ? 'text-primary' : ''}`} />
                    <div>
                      <p className="font-medium">Card</p>
                      <p className="text-sm text-muted-foreground">Pay with credit/debit card</p>
                    </div>
                  </button>
                </div>
              </div>

              <Button onClick={handlePayment} className="w-full">
                Pay ₹{totalAmount.toFixed(2)}
              </Button>
            </div>
          </>
        );
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent 
        onClose={currentStep === 'complete' ? onClose : undefined}
        className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Process Payment</DialogTitle>
        </DialogHeader>
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
}
