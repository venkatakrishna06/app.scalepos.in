import {useEffect, useState} from 'react';
import {AlertCircle, CheckCircle, Loader2} from 'lucide-react';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,} from './ui/dialog';
import {Button} from './ui/button';
import {Input} from './ui/input';
import {usePaymentStore, useRestaurantStore} from '@/lib/store';
import {useOrder} from '@/lib/hooks/useOrder';
import {showToast} from '@/lib/toast';
import {Order, Payment} from '@/types';
import printJS from 'print-js';

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  order?: Order;
  draftOrder?: Omit<Order, 'id'>;
  onPaymentComplete?: (order: Order) => void;
}

type PaymentStep = 'method' | 'processing' | 'complete';

export function PaymentDialog({ open, onClose, order, draftOrder, onPaymentComplete }: PaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<Payment['payment_method']>('upi');
  const [currentStep, setCurrentStep] = useState<PaymentStep>('method');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cashGiven, setCashGiven] = useState<string>('');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const { addPayment } = usePaymentStore();
  const { updateOrderStatus } = useOrder();
  const { addOrder } = useOrder();
  const { restaurant, fetchRestaurant } = useRestaurantStore();

  // Use either the provided order, the created order (from draft), or null
  const currentOrder = order || createdOrder;

  useEffect(() => {
    if (open) {
      setCurrentStep('method');
      setIsSubmitting(false);
      setError(null);
      setCashGiven('');
      // Set default payment method to 'upi' instead of 'card'
      setPaymentMethod('upi');

    }
  }, [open, restaurant, fetchRestaurant]);


  const handlePrintBill = async () => {
    // Check if we have an order to print
    if (!currentOrder && !draftOrder) {
      showToast('error', 'No order data available for printing');
      return null;
    }

    // If we have a draft order but no actual order yet, create it first
    // First check if we already have a created order
    let orderForBill = currentOrder || createdOrder;
    if (!orderForBill && draftOrder) {
      try {
        orderForBill = await createOrderFromDraft();
        if (!orderForBill) {
          showToast('error', 'Failed to create order');
          return null;
        }
        // Note: createOrderFromDraft already sets the createdOrder state
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create order';
        showToast('error', errorMessage);
        return null;
      }
    }

    // Get current date and time
    const now = new Date();
    const dateFormatted = now.toLocaleDateString();
    const timeFormatted = now.toLocaleTimeString();

    // Use the created order for bill generation
    const orderId = orderForBill?.id || 'Draft';
    const orderItems = orderForBill?.items || [];

    const orderType = orderForBill?.order_type === 'takeaway' ? 'Takeaway' : orderForBill?.order_type === 'quick-bill'? 'Quick Bill': 'Dine-in';

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
          .token-no-center {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            background: #fff;
            padding: 2px 10px;
            border: 2px dashed #222;
            border-radius: 6px;
            letter-spacing: 2px;
            display: block;
            margin: 10px auto 8px auto;
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
            ${
              orderForBill?.order_type === 'dine-in'
                ? `<div><strong>Table:</strong> ${orderForBill?.table_id || 'N/A'}</div>
                   <div><strong>Server:</strong> ${orderForBill?.server || 'N/A'}</div>`
                : ''
            }
            <div><strong>Type:</strong> ${orderType}</div>
          </div>

          ${
            orderForBill?.token_number
              ? `<div class="token-no-center">Token No: ${orderForBill.token_number}</div>`
              : ''
          }

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
      </body>
      </html>
    `;

    // Use print-js to print directly without showing dialog
    printJS({
      printable: billContent,
      type: 'raw-html',
      documentTitle: `Bill Receipt - Order #${orderId}`,
      targetStyles: ['*'],
      style: '@page { size: 80mm auto; margin: 0mm; }',
      onPrintDialogClose: () => {
        // Optional: Handle any post-print actions here
        showToast('success', 'Bill printed successfully');
      }
    });

    // Return the order that was used for the bill
    return orderForBill;
  };

  const handlePrintBillAndPayment = async () => {
    try {
      // First print the bill (which now creates the order if it's a draft)
      // Modify handlePrintBill to return the created order
      const orderFromPrintBill = await handlePrintBill();

      // If we have an order from handlePrintBill, use it directly in handlePayment
      // This avoids relying on React state updates which might not be immediate
      if (orderFromPrintBill) {
        // Use a direct reference to the order instead of relying on state
        await handlePayment(orderFromPrintBill);
      } else {
        // If no order was created/returned, just call handlePayment normally
        await handlePayment();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process order';
      setError(errorMessage);
      showToast('error', errorMessage);
    }
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
      showToast('error', errorMessage);
      throw err;
    }
  };

  const handlePayment = async (passedOrder?: Order) => {
    setIsSubmitting(true);
    setError(null);
    //setCurrentStep('processing');

    try {
      // If an order is passed directly, use it instead of looking up state
      // This prevents duplicate order creation when called from handlePrintBillAndPayment
     let orderToProcess = currentOrder || passedOrder || createdOrder;

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
        order_id: orderToProcess?.id,
        amount: roundedAmount, // Use rounded amount instead of original amount
        payment_method: paymentMethod,
        payment_status: 'completed',
        transaction_id: `txn_${Date.now()}`,
      };

      await addPayment(payment);

      // Update order status to 'paid' - backend will handle table status update
      await updateOrderStatus({
        id: orderToProcess?.id,
        status: 'paid'
      });

      setCurrentStep('complete');

      // Notify parent component if callback is provided
      if (onPaymentComplete) {
        onPaymentComplete(orderToProcess);
      }
      // Wait a moment before closing to show the success message
        onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process payment';
      setError(errorMessage);
      showToast('error', errorMessage);
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
      // Processing case removed - now using inline spinner in buttons
      /*case 'processing':
        return (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="relative mb-2">
                <div className="absolute -inset-3 rounded-full bg-primary/15 animate-pulse"></div>
                <div className="absolute -inset-6 rounded-full bg-primary/5 animate-pulse animation-delay-200"></div>
                <Loader2 className="h-12 w-12 animate-spin text-primary relative" />
              </div>
              <p className="mt-4 text-base font-semibold text-center">Processing Payment...</p>
              <p className="mt-2 text-xs text-muted-foreground text-center max-w-md">
                Please wait while we process your payment. This may take a few moments.
              </p>
            </div>
        );*/

      case 'complete':
        return (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="relative mb-2">
                <div className="absolute -inset-2 rounded-full bg-green-100/50 animate-pulse"></div>
                <div className="absolute -inset-4 rounded-full bg-green-50/30 animate-pulse animation-delay-200"></div>
                <div className="rounded-full bg-green-100 p-3 relative">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
              </div>
              <p className="mt-4 text-base font-semibold text-center">Payment Complete!</p>
              <p className="mt-2 text-xs text-muted-foreground text-center max-w-md">
                Thank you for your payment. Your order has been successfully processed.
              </p>
              <Button
                  className="mt-4 px-4 h-8 text-xs font-medium"
                  onClick={onClose}
              >
                Close
              </Button>
            </div>
        );

      default:
        return (
            <div className="flex flex-col gap-3">
              {/* Responsive layout - single column on mobile, two columns on larger screens */}
              <div className="flex flex-col md:grid md:grid-cols-2 gap-3">
                {/* Order Items section */}
                <div className="rounded-lg p-3">
                  <h3 className="text-sm font-semibold mb-2">Order Items ({currentOrder?.items?.filter(item => item.status !== 'cancelled').length || draftOrder?.items?.filter(item => item.status !== 'cancelled').length || 0})</h3>
                  <div className="space-y-0 max-h-[25vh] md:max-h-[35vh] overflow-y-auto pr-1 custom-scrollbar">
                    {/* Get items from either current order or draft order */}
                    {(() => {
                      const items = currentOrder?.items || draftOrder?.items || [];
                      return items.length === 0 ? (
                          <p className="text-center text-muted-foreground py-3 text-xs">No items in this order</p>
                      ) : (
                          items
                              .filter(item => item.status !== 'cancelled')
                              .map((item) => (
                                  <div key={item.id || `draft-${item.menu_item_id}`} className="flex justify-between items-center py-2 border-b border-border/30 last:border-0">
                                    <div>
                                      <p className="font-medium text-sm">{item.name}</p>
                                      <p className="text-xs text-muted-foreground">Qty {item.quantity}</p>
                                    </div>
                                    <span className="font-medium text-sm">₹{(item.price * item.quantity).toFixed(2)}</span>
                                  </div>
                              ))
                      );
                    })()}
                  </div>

                  <div className="mt-3 pt-2 border-t">
                    <div className="">
                      <div className="flex justify-between py-1">
                        <span className="text-xs text-muted-foreground">Sub Total</span>
                        <span className="text-xs font-medium">₹{gstDetails.subTotal.toFixed(2)}</span>
                      </div>
                      {gstDetails.sgstAmount > 0 && (
                          <div className="flex justify-between py-1">
                            <span className="text-xs text-muted-foreground">SGST ({gstDetails.sgstRate}%)</span>
                            <span className="text-xs font-medium">₹{gstDetails.sgstAmount.toFixed(2)}</span>
                          </div>
                      )}
                      {gstDetails.cgstAmount > 0 && (
                          <div className="flex justify-between py-1">
                            <span className="text-xs text-muted-foreground">CGST ({gstDetails.cgstRate}%)</span>
                            <span className="text-xs font-medium">₹{gstDetails.cgstAmount.toFixed(2)}</span>
                          </div>
                      )}
                      <div className="flex justify-between py-1">
                        <span className="text-xs text-muted-foreground">Rounding Adjustment</span>
                        <span className="text-xs font-medium">₹{roundingDifference.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-2 pt-1 border-t border-border/50">
                        <span className="text-sm font-medium">Total Amount</span>
                        <span className="text-sm font-bold">₹{roundedAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Method section */}
                <div className="rounded-lg p-3">
                  <h3 className="text-sm font-semibold mb-2">Payment Method</h3>
                  <div className="space-y-2">
                    {/* UPI Option */}
                    <div className="flex items-center p-2 rounded-lg">
                      <input
                          type="radio"
                          id="upi-payment"
                          name="payment-method"
                          className="mr-2"
                          checked={paymentMethod === 'upi'}
                          onChange={() => setPaymentMethod('upi')}
                      />
                      <label htmlFor="upi-payment" className="flex-1 text-sm">UPI (Pay with UPI)</label>
                    </div>
                    {/* Card Option */}
                    <div className="flex items-center p-2 rounded-lg">
                      <input
                          type="radio"
                          id="card-payment"
                          name="payment-method"
                          className="mr-2"
                          checked={paymentMethod === 'card'}
                          onChange={() => setPaymentMethod('card')}
                      />
                      <label htmlFor="card-payment" className="flex-1 text-sm">Card (Pay with Credit/Debit Card)</label>
                    </div>



                    {/* Cash Option */}
                    <div className="flex items-center p-2 rounded-lg">
                      <input
                          type="radio"
                          id="cash-payment"
                          name="payment-method"
                          className="mr-2"
                          checked={paymentMethod === 'cash'}
                          onChange={() => setPaymentMethod('cash')}
                      />
                      <label htmlFor="cash-payment" className="flex-1 text-sm">Cash (Pay with Cash)</label>
                    </div>

                    {/* Cash amount input field */}
                    {paymentMethod === 'cash' && (
                        <div className="mt-2 ml-5">
                          <label className="block text-xs font-medium mb-1">Cash Amount Given</label>
                          <Input
                              type="text"
                              placeholder="Enter Amount"
                              value={cashGiven}
                              onChange={(e) => {
                                // Only allow positive numbers
                                const value = e.target.value;
                                if (value === '' || (/^\d*\.?\d*$/.test(value) && parseFloat(value) >= 0)) {
                                  setCashGiven(value);
                                }
                              }}
                              className="w-full h-8 text-sm"
                          />

                          {cashGiven && (
                            <div className="mt-1 p-1 border-t">
                              <div className="flex justify-between py-1 text-xs">
                                <span>Amount to Pay</span>
                                <span>₹{roundedAmount.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between py-1 text-xs">
                                <span>Cash Given</span>
                                <span>₹{cashGivenNumber > 0 ? cashGivenNumber.toFixed(2) : '0.00'}</span>
                              </div>
                              <div className="flex justify-between py-1 text-xs font-medium">
                                <span>Return Amount</span>
                                <span>₹{changeAmount > 0 ? changeAmount.toFixed(2) : '0.00'}</span>
                              </div>
                            </div>
                          )}
                        </div>
                    )}
                  </div>

                  {/* Action Buttons - fixed at bottom on mobile */}
                  <div className="mt-4 grid grid-cols-1 gap-2 sticky bottom-0 bg-background pt-2">
                    <Button
                        onClick={handlePrintBill}
                        className="w-full h-9 text-xs"
                        disabled={isSubmitting}
                        variant="outline"
                    >
                      Print Bill
                    </Button>

                    <Button
                        onClick={handlePrintBillAndPayment}
                        className="w-full h-9 text-xs"
                        disabled={isSubmitting}
                        variant="secondary"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Print Bill & Complete Payment"
                      )}
                    </Button>

                    <Button
                        onClick={handlePayment}
                        className="w-full h-9 text-xs font-medium"
                        disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Complete Payment"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
        );
    }
  };

  return (
      <Dialog open={open}>
        <DialogContent
            onClose={onClose}
            className="max-w-[95vw] sm:max-w-[90vw] md:max-w-[800px] max-h-[85vh] md:max-h-[90vh] overflow-y-auto p-2 sm:p-3 md:p-4">
          <DialogHeader className="pb-1 text-center">
            <DialogTitle className="text-lg font-bold text-center">Process Payment</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground text-center">
              {currentOrder ? `(Order #${currentOrder.id}` : '(New Order'}
              {currentOrder?.order_type === 'dine-in' || draftOrder?.order_type === 'dine-in' ? (
                <>
                  {currentOrder?.table_id ? ` - Table ${currentOrder.table_id}` : draftOrder?.table_id ? ` - Table ${draftOrder.table_id}` : ''}
                  {currentOrder?.server ? ` - Server: ${currentOrder.server}` : draftOrder?.server ? ` - Server: ${draftOrder.server}` : ''}
                  {currentOrder?.token_number ? ` - Token No: ${currentOrder.token_number}` : draftOrder?.token_number ? ` - Token No: ${draftOrder.token_number}` : ''}
                </>
              ) : (
                currentOrder?.order_type === 'takeaway' || draftOrder?.order_type === 'takeaway'
                  ? ' - Takeaway'
                  : ' - Quick Bill'
              )}
              )
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
