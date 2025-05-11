import { useState, useEffect } from 'react';
import { Loader2, CreditCard, Wallet, Receipt, CheckCircle, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { usePaymentStore, useOrderStore, useTableStore, useRestaurantStore } from '@/lib/store';
import { toast } from 'sonner';
import { Payment, Order } from '@/types';
import { cn } from '@/lib/utils';

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  order: Order;
}

type PaymentStep = 'method' | 'processing' | 'complete';

export function PaymentDialog({ open, onClose, order }: PaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<Payment['payment_method']>('cash');
  const [currentStep, setCurrentStep] = useState<PaymentStep>('method');
  const [billPrinted, setBillPrinted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addPayment } = usePaymentStore();
  const { updateOrder } = useOrderStore();
  const { updateTableStatus } = useTableStore();
  const { restaurant, fetchRestaurant } = useRestaurantStore();

  useEffect(() => {
    if (open) {
      setCurrentStep('method');
      setBillPrinted(false);
      setIsSubmitting(false);
      setError(null);

      // Fetch restaurant data if not already loaded
      if (!restaurant) {
        fetchRestaurant();
      }
    }
  }, [open, restaurant, fetchRestaurant]);

  const handlePrintBill = () => {
    // Simulate printing bill
    toast.success('Bill printed successfully');
    setBillPrinted(true);
  };

  const handlePayment = async () => {
    setIsSubmitting(true);
    setError(null);
    setCurrentStep('processing');

    const payment = {
      order_id: order.id,
      amount_paid: order.total_amount,
      payment_method: paymentMethod,
      paid_at: new Date().toISOString()
    };

    try {
      await addPayment(payment);
      await updateTableStatus(order.table_id, 'available');
      await updateOrder(order.id, {
        status: 'paid'
      });
      setCurrentStep('complete');
      toast.success('Payment processed successfully');

      // Wait a moment before closing to show the success message
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process payment';
      setError(errorMessage);
      toast.error(errorMessage);
      setCurrentStep('method');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get GST details from order
  const gstDetails = {
    subTotal: order.sub_total || 0,
    sgstAmount: order.sgst_amount || 0,
    cgstAmount: order.cgst_amount || 0,
    sgstRate: order.sgst_rate || 0,
    cgstRate: order.cgst_rate || 0,
    totalGstAmount: (order.sgst_amount || 0) + (order.cgst_amount || 0),
    totalWithGst: order.total_amount || 0
  };

  const totalAmount = order.total_amount || 0;

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
                        {order.items
                            .filter(item => item.status !== 'cancelled')
                            .map((item) => (
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
                        {/* Subtotal and GST details */}
                        <div className="mb-2 space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>₹{gstDetails.subTotal.toFixed(2)}</span>
                          </div>

                          {gstDetails.sgstAmount > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">SGST ({gstDetails.sgstRate}%)</span>
                                <span>₹{gstDetails.sgstAmount.toFixed(2)}</span>
                              </div>
                          )}

                          {gstDetails.cgstAmount > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">CGST ({gstDetails.cgstRate}%)</span>
                                <span>₹{gstDetails.cgstAmount.toFixed(2)}</span>
                              </div>
                          )}
                        </div>

                        {/* Total amount */}
                        <div className="flex justify-between">
                          <span className="font-medium">Total Amount</span>
                          <span className="text-lg font-bold">₹{totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {
                  billPrinted && (      <div>
                      <h3 className="mb-4 text-lg font-medium">Payment Method</h3>
                      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                        <button
                            className={cn(
                                "flex items-center gap-3 rounded-lg border p-4 text-left transition-colors",
                                paymentMethod === 'cash'
                                    ? "border-primary bg-primary/5"
                                    : "hover:bg-accent"
                            )}
                            onClick={() => setPaymentMethod('cash')}
                        >
                          <Wallet className={cn("h-5 w-5", paymentMethod === 'cash' ? "text-primary" : "")} />
                          <div>
                            <p className="font-medium">Cash</p>
                            <p className="text-sm text-muted-foreground">Pay with cash</p>
                          </div>
                        </button>
                        <button
                            className={cn(
                                "flex items-center gap-3 rounded-lg border p-4 text-left transition-colors",
                                paymentMethod === 'card'
                                    ? "border-primary bg-primary/5"
                                    : "hover:bg-accent"
                            )}
                            onClick={() => setPaymentMethod('card')}
                        >
                          <CreditCard className={cn("h-5 w-5", paymentMethod === 'card' ? "text-primary" : "")} />
                          <div>
                            <p className="font-medium">Card</p>
                            <p className="text-sm text-muted-foreground">Pay with credit/debit card</p>
                          </div>
                        </button>
                      </div>
                    </div>)

                }



                {/*/!* Payment workflow instructions *!/*/}
                {/*<div className="rounded-md bg-muted p-3 text-sm">*/}
                {/*  <p className="font-medium">Payment Process:</p>*/}
                {/*  <ol className="mt-2 list-decimal pl-5 space-y-1">*/}
                {/*    <li>Select your preferred payment method</li>*/}
                {/*    <li>Print the bill for the customer</li>*/}
                {/*    <li>Collect payment and click "Pay" to complete</li>*/}
                {/*  </ol>*/}
                {/*</div>*/}

                {!billPrinted ? (
                    <Button 
                      onClick={handlePrintBill} 
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      <Receipt className="mr-2 h-4 w-4" />
                      Print Bill ₹{totalAmount.toFixed(2)}
                    </Button>
                ) : (
                    <Button 
                      onClick={handlePayment} 
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Pay ₹{totalAmount.toFixed(2)}
                        </>
                      )}
                    </Button>
                )}
              </div>
            </>
        );
    }
  };

  return (
      <Dialog open={open}>
        <DialogContent
            onClose={currentStep !== 'processing' ? onClose : undefined}
            className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
            <DialogDescription>
              Order #{order.id} - Table {order.table_id}
            </DialogDescription>
          </DialogHeader>

          {/* Error message if any */}
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <p>{error}</p>
              </div>
            </div>
          )}

          {renderStep()}
        </DialogContent>
      </Dialog>
  );
}
