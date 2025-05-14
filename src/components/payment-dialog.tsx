import {useEffect, useState} from 'react';
import {AlertCircle, CheckCircle, CreditCard, Loader2, Receipt, Wallet} from 'lucide-react';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,} from './ui/dialog';
import {Button} from './ui/button';
import {Input} from './ui/input';
import {useOrderStore, usePaymentStore, useRestaurantStore, useTableStore} from '@/lib/store';
import {toast} from '@/lib/toast';
import {Order, Payment} from '@/types';
import {cn} from '@/lib/utils';

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  order?: Order;
  draftOrder?: Omit<Order, 'id'>;
  onPaymentComplete?: (order: Order) => void;
}

type PaymentStep = 'method' | 'processing' | 'complete';

export function PaymentDialog({ open, onClose, order, draftOrder, onPaymentComplete }: PaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<Payment['payment_method']>('cash');
  const [currentStep, setCurrentStep] = useState<PaymentStep>('method');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cashGiven, setCashGiven] = useState<string>('');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const { addPayment } = usePaymentStore();
  const { updateOrder, addOrder } = useOrderStore();
  const { updateTableStatus } = useTableStore();
  const { restaurant, fetchRestaurant } = useRestaurantStore();

  // Use either the provided order, the created order (from draft), or null
  const currentOrder = order || createdOrder;

  useEffect(() => {
    if (open) {
      setCurrentStep('method');
      setIsSubmitting(false);
      setError(null);
      setCashGiven('');

      // Fetch restaurant data if not already loaded
      if (!restaurant) {
        fetchRestaurant();
      }
    }
  }, [open, restaurant, fetchRestaurant]);

  const handlePrintBill = () => {
    // Check if we have an order to print
    if (!currentOrder && !draftOrder) {
      toast.error('No order data available for printing');
      return;
    }

    // Create a new window for the bill
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print the bill');
      return;
    }

    // Get current date and time
    const now = new Date();
    const dateFormatted = now.toLocaleDateString();
    const timeFormatted = now.toLocaleTimeString();

    // Use either the current order or draft order for bill generation
    const orderForBill = currentOrder || draftOrder;
    const orderId = currentOrder?.id || 'Draft';
    const orderItems = currentOrder?.items || draftOrder?.items || [];

    // Generate bill HTML content
    const billContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill Receipt - Order #${orderId}</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            max-width: 80mm; /* Standard receipt width */
            margin: 0 auto;
          }
          .receipt {
            border: 1px solid #ddd;
            padding: 10px;
          }
          .header {
            text-align: center;
            margin-bottom: 10px;
            border-bottom: 1px dashed #ccc;
            padding-bottom: 8px;
          }
          .restaurant-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 4px;
          }
          .restaurant-details {
            font-size: 11px;
            margin-bottom: 3px;
            line-height: 1.2;
          }
          .bill-info {
            margin-bottom: 12px;
            font-size: 12px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: repeat(3, auto);
            gap: 4px 8px;
          }
          .bill-info div {
            margin-bottom: 2px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
            font-size: 11px;
          }
          .items-table th {
            text-align: left;
            padding: 3px 0;
            border-bottom: 1px solid #ddd;
          }
          .items-table td {
            padding: 3px 0;
            border-bottom: 1px dashed #eee;
          }
          .amount-details {
            margin-top: 8px;
            font-size: 11px;
          }
          .amount-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
          }
          .total-amount {
            font-weight: bold;
            font-size: 13px;
            margin-top: 4px;
            border-top: 1px solid #ddd;
            padding-top: 4px;
          }
          .footer {
            margin-top: 12px;
            text-align: center;
            font-size: 11px;
            border-top: 1px dashed #ccc;
            padding-top: 8px;
          }
          .footer p {
            margin: 2px 0;
          }
          @media print {
            body {
              width: 80mm;
              margin: 0;
              padding: 0;
            }
            .receipt {
              border: none;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="restaurant-name">${restaurant?.name || 'Restaurant Name'}</div>
            <div class="restaurant-details">${restaurant?.address || 'Restaurant Address'}</div>
            <div class="restaurant-details">Phone: ${restaurant?.phone || 'Phone Number'}</div>
            <div class="restaurant-details">GST No: ${restaurant?.gst_number || 'GST Number'}</div>
          </div>

          <div class="bill-info">
            <div><strong>Bill No:</strong> ${orderId}</div>
            <div><strong>Date:</strong> ${dateFormatted}</div>
            <div><strong>Time:</strong> ${timeFormatted}</div>
            <div><strong>Table:</strong> ${orderForBill?.table_id || 'N/A'}</div>
            <div><strong>Server:</strong> ${orderForBill?.server || 'N/A'}</div>
            <div><strong>Type:</strong> ${orderForBill?.order_type || 'Takeaway'}</div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${orderItems
                .filter(item => item.status !== 'cancelled')
                .map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>₹${item.price.toFixed(2)}</td>
                    <td>₹${(item.quantity * item.price).toFixed(2)}</td>
                  </tr>
                `).join('')}
            </tbody>
          </table>

          <div class="amount-details">
            <div class="amount-row">
              <span>Subtotal:</span>
              <span>₹${gstDetails.subTotal.toFixed(2)}</span>
            </div>

            ${gstDetails.sgstAmount > 0 ? `
            <div class="amount-row">
              <span>SGST (${gstDetails.sgstRate}%):</span>
              <span>₹${gstDetails.sgstAmount.toFixed(2)}</span>
            </div>
            ` : ''}

            ${gstDetails.cgstAmount > 0 ? `
            <div class="amount-row">
              <span>CGST (${gstDetails.cgstRate}%):</span>
              <span>₹${gstDetails.cgstAmount.toFixed(2)}</span>
            </div>
            ` : ''}

            <div class="amount-row">
              <span>Rounding Adjustment:</span>
              <span>₹${roundingDifference.toFixed(2)}</span>
            </div>

            <div class="amount-row total-amount">
              <span>Total Amount:</span>
              <span>₹${roundedAmount.toFixed(2)}</span>
            </div>

            ${paymentMethod ? `
            <div class="amount-row" style="margin-top: 10px;">
              <span>Payment Method:</span>
              <span>${paymentMethod.replace('_', ' ').toUpperCase()}</span>
            </div>
            ` : ''}
          </div>

          <div class="footer">
            <p>Thank you for your visit!</p>
            <p>Please visit again</p>
          </div>
        </div>

        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print();" style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Print Bill
          </button>
          <button onclick="window.close();" style="padding: 10px 20px; background: #f44336; color: white; border: none; border-radius: 4px; margin-left: 10px; cursor: pointer;">
            Close
          </button>
        </div>
      </body>
      </html>
    `;

    // Write the content to the new window
    printWindow.document.open();
    printWindow.document.write(billContent);
    printWindow.document.close();

    // Trigger print when content is loaded
    printWindow.onload = function() {
      // Automatically print on load (optional)
      // printWindow.print();
      // Don't automatically close after printing
      // printWindow.onafterprint = function() {
      //   printWindow.close();
      // };
    };

    toast.success('Bill generated successfully');
  };

  const handlePrintBillAndPayment = async () => {
    // First print the bill
    handlePrintBill();

    // Then process the payment after a short delay
    setTimeout(async () => {
      await handlePayment();
    }, 1000);
  };

  // Function to create an order from a draft
  const createOrderFromDraft = async () => {
    if (!draftOrder) return null;

    try {
      const newOrder = await addOrder(draftOrder);
      setCreatedOrder(newOrder);
      return newOrder;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create order';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  };

  const handlePayment = async () => {
    setIsSubmitting(true);
    setError(null);
    setCurrentStep('processing');

    try {
      // If we have a draft order but no actual order yet, create it first
      let orderToProcess = currentOrder;

      if (!orderToProcess && draftOrder) {
        orderToProcess = await createOrderFromDraft();
        if (!orderToProcess) {
          throw new Error('Failed to create order');
        }
      }

      if (!orderToProcess) {
        throw new Error('No order to process');
      }

      // Create payment object according to the new API structure
      const payment = {
        order_id: orderToProcess.id,
        amount: roundedAmount, // Use rounded amount instead of original amount
        payment_method: paymentMethod,
        payment_status: 'completed',
        transaction_id: `txn_${Date.now()}`,
        card_details: paymentMethod === 'credit_card' || paymentMethod === 'debit_card' 
          ? { last_four: '1234', card_type: paymentMethod === 'credit_card' ? 'visa' : 'mastercard' } 
          : undefined
      };

      await addPayment(payment);

      // Update table status if this is a dine-in order
      if (orderToProcess.table_id) {
        await updateTableStatus(orderToProcess.table_id, 'available');
      }

      await updateOrder(orderToProcess.id, {
        status: 'paid'
      });

      setCurrentStep('complete');
      toast.success('Payment processed successfully');

      // Notify parent component if callback is provided
      if (onPaymentComplete) {
        onPaymentComplete(orderToProcess);
      }

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

  // Get GST details from order or draft order
  const gstDetails = currentOrder ? {
    subTotal: currentOrder.sub_total || 0,
    sgstAmount: currentOrder.sgst_amount || 0,
    cgstAmount: currentOrder.cgst_amount || 0,
    sgstRate: currentOrder.sgst_rate || 0,
    cgstRate: currentOrder.cgst_rate || 0,
    totalGstAmount: (currentOrder.sgst_amount || 0) + (currentOrder.cgst_amount || 0),
    totalWithGst: currentOrder.total_amount || 0
  } : draftOrder ? {
    subTotal: draftOrder.sub_total || 0,
    sgstAmount: draftOrder.sgst_amount || 0,
    cgstAmount: draftOrder.cgst_amount || 0,
    sgstRate: draftOrder.sgst_rate || 0,
    cgstRate: draftOrder.cgst_rate || 0,
    totalGstAmount: (draftOrder.sgst_amount || 0) + (draftOrder.cgst_amount || 0),
    totalWithGst: draftOrder.total_amount || 0
  } : {
    subTotal: 0,
    sgstAmount: 0,
    cgstAmount: 0,
    sgstRate: 0,
    cgstRate: 0,
    totalGstAmount: 0,
    totalWithGst: 0
  };

  const totalAmount = currentOrder?.total_amount || draftOrder?.total_amount || 0;
  const roundedAmount = Math.ceil(totalAmount);
  const roundingDifference = roundedAmount - totalAmount;

  // Calculate change amount if cash payment
  const cashGivenNumber = cashGiven ? parseFloat(cashGiven) : 0;
  const changeAmount = cashGivenNumber > roundedAmount ? cashGivenNumber - roundedAmount : 0;

  const renderStep = () => {
    switch (currentStep) {
      case 'processing':
        return (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 md:py-20">
              <div className="relative mb-2">
                <div className="absolute -inset-4 sm:-inset-5 rounded-full bg-primary/15 animate-pulse"></div>
                <div className="absolute -inset-8 sm:-inset-10 rounded-full bg-primary/5 animate-pulse animation-delay-200"></div>
                <Loader2 className="h-16 sm:h-20 md:h-24 w-16 sm:w-20 md:w-24 animate-spin text-primary relative" />
              </div>
              <p className="mt-8 sm:mt-10 text-xl sm:text-2xl font-semibold text-center">Processing Payment...</p>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground text-center max-w-md">
                Please wait while we process your payment. This may take a few moments.
              </p>
            </div>
        );

      case 'complete':
        return (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 md:py-20">
              <div className="relative mb-2">
                <div className="absolute -inset-3 sm:-inset-4 rounded-full bg-green-100/50 animate-pulse"></div>
                <div className="absolute -inset-6 sm:-inset-8 rounded-full bg-green-50/30 animate-pulse animation-delay-200"></div>
                <div className="rounded-full bg-green-100 p-4 sm:p-5 relative">
                  <CheckCircle className="h-16 sm:h-20 md:h-24 w-16 sm:w-20 md:w-24 text-green-600" />
                </div>
              </div>
              <p className="mt-8 sm:mt-10 text-xl sm:text-2xl font-semibold text-center">Payment Complete!</p>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground text-center max-w-md">
                Thank you for your payment. Your order has been successfully processed.
              </p>
              <Button 
                className="mt-8 sm:mt-10 px-8 sm:px-10 h-12 sm:h-14 text-base sm:text-lg font-medium" 
                onClick={onClose}
              >
                Close
              </Button>
            </div>
        );

      default:
        return (
            <>
              <div className="flex flex-col md:flex-row gap-5 sm:gap-6 md:gap-8">
                {/* Order Items - Left Side */}
                <div className="w-full md:w-1/2">
                  <h3 className="text-lg font-semibold mb-3 sm:mb-4">Order Items</h3>
                  <div className="rounded-lg border shadow-sm bg-card/50 p-4 sm:p-5 max-h-[40vh] md:max-h-[50vh] overflow-auto">
                    <div className="space-y-3 sm:space-y-4">
                      {/* Get items from either current order or draft order */}
                      {(() => {
                        const items = currentOrder?.items || draftOrder?.items || [];
                        return items.length === 0 ? (
                          <p className="text-center text-muted-foreground py-6">No items in this order</p>
                        ) : (
                          items
                            .filter(item => item.status !== 'cancelled')
                            .map((item) => (
                              <div key={item.id || `draft-${item.menu_item_id}`} className="flex justify-between items-center py-3 border-b border-border/30 last:border-0">
                                <div className="flex-1">
                                  <p className="font-medium text-base">{item.name}</p>
                                  <p className="text-sm text-muted-foreground mt-1">Qty: {item.quantity}</p>
                                </div>
                                <span className="font-medium text-right ml-4">₹{(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))
                        );
                      })()}
                    </div>
                  </div>

                  {/* Payment Method - Now on left side below order items */}
                  <div className="mt-6 sm:mt-8">
                    <h3 className="text-lg font-semibold mb-3 sm:mb-4">Payment Method</h3>
                    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 max-h-[30vh] overflow-auto pr-1">
                      <button
                          className={cn(
                              "flex items-center gap-4 rounded-lg border p-4 sm:p-5 text-left transition-colors",
                              paymentMethod === 'cash'
                                  ? "border-primary bg-primary/10 ring-1 ring-primary"
                                  : "hover:bg-accent"
                          )}
                          onClick={() => setPaymentMethod('cash')}
                      >
                        <div className={cn(
                          "flex items-center justify-center w-12 h-12 rounded-full",
                          paymentMethod === 'cash' ? "bg-primary/20" : "bg-muted"
                        )}>
                          <Wallet className={cn("h-6 w-6", paymentMethod === 'cash' ? "text-primary" : "text-muted-foreground")} />
                        </div>
                        <div>
                          <p className="font-medium text-base">Cash</p>
                          <p className="text-sm text-muted-foreground mt-1">Pay with cash</p>
                        </div>
                      </button>
                      <button
                          className={cn(
                              "flex items-center gap-4 rounded-lg border p-4 sm:p-5 text-left transition-colors",
                              paymentMethod === 'credit_card'
                                  ? "border-primary bg-primary/10 ring-1 ring-primary"
                                  : "hover:bg-accent"
                          )}
                          onClick={() => setPaymentMethod('credit_card')}
                      >
                        <div className={cn(
                          "flex items-center justify-center w-12 h-12 rounded-full",
                          paymentMethod === 'credit_card' ? "bg-primary/20" : "bg-muted"
                        )}>
                          <CreditCard className={cn("h-6 w-6", paymentMethod === 'credit_card' ? "text-primary" : "text-muted-foreground")} />
                        </div>
                        <div>
                          <p className="font-medium text-base">Credit Card</p>
                          <p className="text-sm text-muted-foreground mt-1">Pay with credit card</p>
                        </div>
                      </button>
                      <button
                          className={cn(
                              "flex items-center gap-4 rounded-lg border p-4 sm:p-5 text-left transition-colors",
                              paymentMethod === 'debit_card'
                                  ? "border-primary bg-primary/10 ring-1 ring-primary"
                                  : "hover:bg-accent"
                          )}
                          onClick={() => setPaymentMethod('debit_card')}
                      >
                        <div className={cn(
                          "flex items-center justify-center w-12 h-12 rounded-full",
                          paymentMethod === 'debit_card' ? "bg-primary/20" : "bg-muted"
                        )}>
                          <CreditCard className={cn("h-6 w-6", paymentMethod === 'debit_card' ? "text-primary" : "text-muted-foreground")} />
                        </div>
                        <div>
                          <p className="font-medium text-base">Debit Card</p>
                          <p className="text-sm text-muted-foreground mt-1">Pay with debit card</p>
                        </div>
                      </button>
                      <button
                          className={cn(
                              "flex items-center gap-4 rounded-lg border p-4 sm:p-5 text-left transition-colors",
                              paymentMethod === 'upi'
                                  ? "border-primary bg-primary/10 ring-1 ring-primary"
                                  : "hover:bg-accent"
                          )}
                          onClick={() => setPaymentMethod('upi')}
                      >
                        <div className={cn(
                          "flex items-center justify-center w-12 h-12 rounded-full",
                          paymentMethod === 'upi' ? "bg-primary/20" : "bg-muted"
                        )}>
                          <svg 
                            className={cn("h-6 w-6", paymentMethod === 'upi' ? "text-primary" : "text-muted-foreground")}
                            viewBox="0 0 24 24" 
                            fill="none" 
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M12 2L4 6V18L12 22L20 18V6L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 22V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M20 6L12 10L4 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M4 14L12 18L20 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 10V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-base">UPI</p>
                          <p className="text-sm text-muted-foreground mt-1">Pay with UPI</p>
                        </div>
                      </button>
                    </div>

                    {/* Cash payment input field */}
                    {paymentMethod === 'cash' && (
                      <div className="mt-5 p-5 border rounded-lg bg-card/30">
                        <div className="mb-4">
                          <label htmlFor="cash-amount" className="block text-sm font-medium mb-2">
                            Cash Amount Given
                          </label>
                          <Input
                            id="cash-amount"
                            type="number"
                            placeholder="Enter amount"
                            value={cashGiven}
                            onChange={(e) => setCashGiven(e.target.value)}
                            className="w-full h-10"
                          />
                        </div>

                        {cashGivenNumber > 0 && (
                          <div className="text-sm space-y-2 mt-3 pt-3 border-t border-border/30">
                            <div className="flex justify-between py-1">
                              <span className="text-muted-foreground">Amount to Pay</span>
                              <span className="font-medium">₹{roundedAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-1">
                              <span className="text-muted-foreground">Cash Given</span>
                              <span className="font-medium">₹{cashGivenNumber.toFixed(2)}</span>
                            </div>
                            {changeAmount > 0 && (
                              <div className="flex justify-between py-2 mt-1 font-medium text-base border-t border-border/30">
                                <span>Return Amount</span>
                                <span className="text-primary">₹{changeAmount.toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Section - Right Side */}
                <div className="w-full md:w-1/2 flex flex-col">
                  <div className="flex flex-col h-full">
                    <h3 className="text-lg font-semibold mb-3 sm:mb-4">Amount Details</h3>
                    <div className="rounded-lg border shadow-sm bg-card/50 p-4 sm:p-6 mb-5 sm:mb-6">
                      {/* Subtotal and GST details */}
                      <div className="mb-5 space-y-3 text-sm">
                        <div className="flex justify-between py-1">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span className="font-medium">₹{gstDetails.subTotal.toFixed(2)}</span>
                        </div>

                        {gstDetails.sgstAmount > 0 && (
                          <div className="flex justify-between py-1">
                            <span className="text-muted-foreground">SGST ({gstDetails.sgstRate}%)</span>
                            <span className="font-medium">₹{gstDetails.sgstAmount.toFixed(2)}</span>
                          </div>
                        )}

                        {gstDetails.cgstAmount > 0 && (
                          <div className="flex justify-between py-1">
                            <span className="text-muted-foreground">CGST ({gstDetails.cgstRate}%)</span>
                            <span className="font-medium">₹{gstDetails.cgstAmount.toFixed(2)}</span>
                          </div>
                        )}
                      </div>

                      {/* Rounding difference */}
                      <div className="flex justify-between py-1 mb-3">
                        <span className="text-muted-foreground">Rounding Adjustment</span>
                        <span className="font-medium">₹{roundingDifference.toFixed(2)}</span>
                      </div>

                      {/* Total amount */}
                      <div className="flex justify-between py-3 border-t border-border/50">
                        <span className="font-medium text-base">Total Amount</span>
                        <span className="text-lg font-bold">₹{roundedAmount.toFixed(2)}</span>
                      </div>

                      {/* Rounded amount */}
                      {/*<div className="flex justify-between py-3 mt-1 bg-primary/5 rounded-md px-3">*/}
                      {/*  <span className="font-medium text-base">Rounded Amount</span>*/}
                      {/*  <span className="text-lg font-bold text-primary">₹{roundedAmount.toFixed(2)}</span>*/}
                      {/*</div>*/}
                    </div>

                    <div className="space-y-3 sm:space-y-4 mt-auto">
                      <Button 
                        onClick={handlePrintBill} 
                        className="w-full h-11 sm:h-12 text-base"
                        disabled={isSubmitting}
                        variant="outline"
                      >
                        <Receipt className="mr-3 h-5 w-5" />
                        Print Bill
                      </Button>

                      <Button 
                        onClick={handlePrintBillAndPayment} 
                        className="w-full h-11 sm:h-12 text-base"
                        disabled={isSubmitting}
                        variant="secondary"
                      >
                        <Receipt className="mr-3 h-5 w-5" />
                        <span className="truncate">Print Bill and Complete Payment</span>
                      </Button>

                      <Button 
                        onClick={handlePayment} 
                        className="w-full h-12 sm:h-14 text-base sm:text-lg font-medium mt-2"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                            <span className="truncate">Processing...</span>
                          </>
                        ) : (
                          <>
                            <span className="truncate">Complete Payment</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  {/* Payment Method box has been moved to the left side */}
                </div>
              </div>
            </>
        );
    }
  };

  return (
      <Dialog open={open}>
        <DialogContent
            onClose={currentStep !== 'processing' ? onClose : undefined}
            className="max-w-[95vw] sm:max-w-[90vw] md:max-w-[800px] max-h-[90vh] overflow-auto p-4 sm:p-6">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-bold">Process Payment</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {currentOrder ? `Order #${currentOrder.id}` : 'New Order'} 
              {currentOrder?.table_id ? ` - Table ${currentOrder.table_id}` : 
               draftOrder?.table_id ? ` - Table ${draftOrder.table_id}` : 
               ' - Takeaway'}
            </DialogDescription>
          </DialogHeader>

          {/* Error message if any */}
          {error && (
            <div className="mb-6 rounded-md bg-destructive/10 p-4 text-sm text-destructive">
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
