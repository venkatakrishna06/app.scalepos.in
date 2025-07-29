import {useEffect, useRef, useState} from 'react';
import {AlertCircle, CheckCircle, Loader2} from 'lucide-react';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,} from './ui/dialog';
import {Button} from './ui/button';
import {Input} from './ui/input';
import {usePaymentStore, useRestaurantStore, usePrinterStore} from '@/lib/store';
import {useOrder} from '@/lib/hooks/useOrder';
import {showToast} from '@/lib/toast';
import {Order, Payment} from '@/types';
import {orderService} from "@/lib/api/services";

interface PaymentDialogProps {
    open: boolean;
    onClose: () => void;
    order?: Order[];
    draftOrder?: Omit<Order, 'id'>;
    onPaymentComplete?: (order: Order) => void;
}

type PaymentStep = 'method' | 'processing' | 'complete';

// ESC/POS command constants
const ESC = '\x1b';
const GS = '\x1d';

// ESC/POS Commands
const ESCPOS = {
    // Initialize printer
    INIT: ESC + '@',
    // Text formatting
    BOLD_ON: ESC + 'E' + '\x01',
    BOLD_OFF: ESC + 'E' + '\x00',
    UNDERLINE_ON: ESC + '-' + '\x01',
    UNDERLINE_OFF: ESC + '-' + '\x00',
    // Text alignment
    ALIGN_LEFT: ESC + 'a' + '\x00',
    ALIGN_CENTER: ESC + 'a' + '\x01',
    ALIGN_RIGHT: ESC + 'a' + '\x02',
    // Font sizes
    FONT_SIZE_NORMAL: GS + '!' + '\x00',
    FONT_SIZE_DOUBLE_HEIGHT: GS + '!' + '\x01',
    FONT_SIZE_DOUBLE_WIDTH: GS + '!' + '\x10',
    FONT_SIZE_DOUBLE: GS + '!' + '\x11',
    // Line feeds
    LF: '\n',
    CR: '\r',
    CRLF: '\r\n',
    // Paper cutting
    CUT_PAPER: GS + 'V' + '\x41' + '\x03',
    // Drawer kick
    DRAWER_KICK: ESC + 'p' + '\x00' + '\x19' + '\xfa',
};

export function PaymentDialog({open, onClose, order, draftOrder, onPaymentComplete}: PaymentDialogProps) {
    const [paymentMethod, setPaymentMethod] = useState<Payment['payment_method'] | ''>('');
    const [currentStep, setCurrentStep] = useState<PaymentStep>('method');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cashGiven, setCashGiven] = useState<string>('');
    const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
    const {addPayment} = usePaymentStore();
    const {updateOrderStatus} = useOrder();
    const {restaurant} = useRestaurantStore();
    const {printerConfig} = usePrinterStore();

    // Store the order in a ref to track if it changes
    const orderRef = useRef(order);
    useEffect(() => {
        if (order && orderRef.current !== order) {
            orderRef.current = order;
        }
    }, [order]);

    // Use either the provided order, the created order (from draft), or null
    const currentOrder = order || createdOrder;

    // Reset component state when order changes or dialog opens
    useEffect(() => {
        if (open) {
            setCurrentStep('method');
            setIsSubmitting(false);
            setError(null);
            setCashGiven('');
            setPaymentMethod('');
            // Reset createdOrder to null to ensure we use the new order prop
            setCreatedOrder(null);
        }
    }, [open, order]);

    // Helper function to pad string to specific width
    const padString = (str: string, width: number, padChar: string = ' '): string => {
        if (str.length >= width) return str.substring(0, width);
        return str + padChar.repeat(width - str.length);
    };

    // Helper function to create a line separator
    const createSeparatorLine = (char: string = '-', width: number = 32): string => {
        return char.repeat(width);
    };

    // Helper function to format currency
    const formatCurrency = (amount: number): string => {
        return `₹${amount.toFixed(2)}`;
    };

    // Helper function to split long text into multiple lines
    const wrapText = (text: string, maxWidth: number): string[] => {
        if (text.length <= maxWidth) return [text];

        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';

        for (const word of words) {
            if ((currentLine + ' ' + word).trim().length <= maxWidth) {
                currentLine = currentLine ? currentLine + ' ' + word : word;
            } else {
                if (currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    // Word is longer than max width, force break it
                    lines.push(word.substring(0, maxWidth));
                    currentLine = word.substring(maxWidth);
                }
            }
        }
        if (currentLine) {
            lines.push(currentLine);
        }

        return lines;
    };

    // Function to generate ESC/POS receipt content
    const generateReceiptContent = (orderForBill: Order): string => {
        const now = new Date();
        const dateFormatted = now.toLocaleDateString('en-IN');
        const timeFormatted = now.toLocaleTimeString('en-IN');
        const orderType = orderForBill?.order_type === 'takeaway' ? 'Takeaway' :
            orderForBill?.order_type === 'quick-bill' ? 'Quick Bill' : 'Dine-in';

        let receipt = '';

        // Initialize printer
        receipt += ESCPOS.INIT;

        // Header with restaurant name
        receipt += ESCPOS.ALIGN_CENTER;
        receipt += ESCPOS.FONT_SIZE_DOUBLE;
        receipt += ESCPOS.BOLD_ON;
        receipt += (restaurant?.name || 'Restaurant Name').toUpperCase();
        receipt += ESCPOS.LF;
        receipt += ESCPOS.BOLD_OFF;
        receipt += ESCPOS.FONT_SIZE_NORMAL;

        // Restaurant details
        const restaurantAddress = restaurant?.address || 'Restaurant Address';
        const addressLines = wrapText(restaurantAddress, 32);
        addressLines.forEach(line => {
            receipt += line;
            receipt += ESCPOS.LF;
        });

        receipt += `Phone: ${restaurant?.phone || 'Phone Number'}`;
        receipt += ESCPOS.LF;
        receipt += `GST No: ${restaurant?.gst_number || 'GST Number'}`;
        receipt += ESCPOS.LF;

        // Separator
        receipt += ESCPOS.ALIGN_LEFT;
        receipt += createSeparatorLine('=', 32);
        receipt += ESCPOS.LF;

        // Bill information
        receipt += ESCPOS.BOLD_ON;
        receipt += padString(`Bill No: ${orderForBill?.id}`, 16) + padString(`Date: ${dateFormatted}`, 16);
        receipt += ESCPOS.LF;
        receipt += padString(`Time: ${timeFormatted}`, 16) + padString(`Type: ${orderType}`, 16);
        receipt += ESCPOS.LF;
        receipt += ESCPOS.BOLD_OFF;

        // Table info for dine-in orders
        if (orderForBill?.order_type === 'dine-in') {
            receipt += padString(`Table: ${orderForBill?.table_id || 'N/A'}`, 16);
            receipt += padString(`Server: ${orderForBill?.server || 'N/A'}`, 16);
            receipt += ESCPOS.LF;
        }

        // Token number if available
        if (orderForBill?.token_number) {
            receipt += ESCPOS.ALIGN_CENTER;
            receipt += ESCPOS.BOLD_ON;
            receipt += ESCPOS.FONT_SIZE_DOUBLE_HEIGHT;
            receipt += `TOKEN NO: ${orderForBill.token_number}`;
            receipt += ESCPOS.LF;
            receipt += ESCPOS.FONT_SIZE_NORMAL;
            receipt += ESCPOS.BOLD_OFF;
            receipt += ESCPOS.ALIGN_LEFT;
        }

        // Separator
        receipt += createSeparatorLine('=', 32);
        receipt += ESCPOS.LF;

        // Items header
        receipt += ESCPOS.BOLD_ON;
        receipt += padString('Item', 16) + padString('Qty', 4) + padString('Rate', 6) + padString('Amount', 6);
        receipt += ESCPOS.LF;
        receipt += ESCPOS.BOLD_OFF;
        receipt += createSeparatorLine('-', 32);
        receipt += ESCPOS.LF;

        // Order items
        const orderItems = orderForBill?.items || [];
        orderItems
            .filter(item => item.status !== 'cancelled')
            .forEach(item => {
                // Item name (wrap if too long)
                const itemNameLines = wrapText(item.name, 32);
                itemNameLines.forEach((line, index) => {
                    if (index === 0) {
                        // First line with quantity, rate, and amount
                        receipt += padString(line, 16) +
                            padString(item.quantity.toString(), 4) +
                            padString(formatCurrency(item.price), 6) +
                            padString(formatCurrency(item.quantity * item.price), 6);
                    } else {
                        // Continuation lines
                        receipt += line;
                    }
                    receipt += ESCPOS.LF;
                });
            });

        // Separator
        receipt += createSeparatorLine('-', 32);
        receipt += ESCPOS.LF;

        // Totals section
        const gstDetails = {
            subTotal: orderForBill.sub_total || 0,
            sgstAmount: orderForBill.sgst_amount || 0,
            cgstAmount: orderForBill.cgst_amount || 0,
            sgstRate: orderForBill.sgst_rate || 0,
            cgstRate: orderForBill.cgst_rate || 0,
        };

        const totalAmount = orderForBill?.total_amount || 0;
        const roundedAmount = Math.ceil(totalAmount);
        const roundingDifference = roundedAmount - totalAmount;

        // Subtotal
        receipt += padString('Subtotal:', 24) + padString(formatCurrency(gstDetails.subTotal), 8);
        receipt += ESCPOS.LF;

        // GST details
        if (gstDetails.sgstAmount > 0) {
            receipt += padString(`SGST (${gstDetails.sgstRate}%):`, 24) + padString(formatCurrency(gstDetails.sgstAmount), 8);
            receipt += ESCPOS.LF;
        }

        if (gstDetails.cgstAmount > 0) {
            receipt += padString(`CGST (${gstDetails.cgstRate}%):`, 24) + padString(formatCurrency(gstDetails.cgstAmount), 8);
            receipt += ESCPOS.LF;
        }

        // Rounding adjustment
        receipt += padString('Rounding Adj:', 24) + padString(formatCurrency(roundingDifference), 8);
        receipt += ESCPOS.LF;

        // Total amount
        receipt += createSeparatorLine('-', 32);
        receipt += ESCPOS.LF;
        receipt += ESCPOS.BOLD_ON;
        receipt += ESCPOS.FONT_SIZE_DOUBLE_HEIGHT;
        receipt += padString('TOTAL:', 16) + padString(formatCurrency(roundedAmount), 16);
        receipt += ESCPOS.LF;
        receipt += ESCPOS.FONT_SIZE_NORMAL;
        receipt += ESCPOS.BOLD_OFF;

        // Payment method
        if (paymentMethod) {
            receipt += createSeparatorLine('-', 32);
            receipt += ESCPOS.LF;
            receipt += padString('Payment Method:', 24) + padString(paymentMethod.replace('_', ' ').toUpperCase(), 8);
            receipt += ESCPOS.LF;

            // Cash payment details
            if (paymentMethod === 'cash' && cashGiven) {
                const cashGivenNumber = parseFloat(cashGiven);
                const changeAmount = cashGivenNumber > roundedAmount ? cashGivenNumber - roundedAmount : 0;

                receipt += padString('Cash Given:', 24) + padString(formatCurrency(cashGivenNumber), 8);
                receipt += ESCPOS.LF;
                receipt += padString('Change:', 24) + padString(formatCurrency(changeAmount), 8);
                receipt += ESCPOS.LF;
            }
        }

        // Footer
        receipt += ESCPOS.LF;
        receipt += createSeparatorLine('=', 32);
        receipt += ESCPOS.LF;
        receipt += ESCPOS.ALIGN_CENTER;
        receipt += 'Thank you for your visit!';
        receipt += ESCPOS.LF;
        receipt += 'Please visit again';
        receipt += ESCPOS.LF;
        receipt += ESCPOS.LF;

        // Cut paper
        receipt += ESCPOS.CUT_PAPER;

        return receipt;
    };

    const handlePrintBill = async () => {
        // Check if we have an order to print
        if (!currentOrder && !draftOrder) {
            showToast('error', 'No order data available for printing');
            return null;
        }

        // If we have a draft order but no actual order yet, create it first
        let orderForBill = currentOrder || createdOrder;
        if (!orderForBill && draftOrder) {
            try {
                orderForBill = await createOrderFromDraft();
                if (!orderForBill) {
                    showToast('error', 'Failed to create order');
                    return null;
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to create order';
                showToast('error', errorMessage);
                return null;
            }
        }

        try {
            // Check if QZ Tray is available
            if (typeof window.qz === 'undefined') {
                throw new Error('QZ Tray not available. Please ensure QZ Tray is installed and running.');
            }

            // Connect to QZ Tray if not already connected
            if (!window.qz.websocket.isActive()) {
                await window.qz.websocket.connect();
            }

            // Get bill printers from configuration
            const billPrinters = printerConfig?.bill_printers || [];
            if (billPrinters.length === 0) {
                throw new Error('No bill printers configured. Please configure printers in settings.');
            }

            // Generate ESC/POS receipt content
            const receiptContent = generateReceiptContent(orderForBill!);

            // Print to all configured bill printers

            for (const printer of billPrinters) {
                const config = window.qz.configs.create(printer);

                // Convert string to bytes for raw printing
                const data = [receiptContent];
                await window.qz.print(config, data);
            }


            return orderForBill;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to print bill';
            showToast('error', errorMessage);
            console.error('Print error:', error);
            throw error;
        }
    };

    const handlePrintBillAndPayment = async () => {
        // Check if payment method is selected
        if (!paymentMethod) {
            setError('Please select a payment method');
            showToast('error', 'Please select a payment method');
            return;
        }

        try {
            // First print the bill (which now creates the order if it's a draft)
            const orderFromPrintBill = await handlePrintBill();

            // If we have an order from handlePrintBill, use it directly in handlePayment
            if (orderFromPrintBill) {
                await handlePayment(orderFromPrintBill);
            } else {
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
            const newOrder = await orderService.createOrder(draftOrder);
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
        // Check if payment method is selected
        if (!paymentMethod) {
            setError('Please select a payment method');
            showToast('error', 'Please select a payment method');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
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

            // Calculate rounded amount
            const totalAmount = orderToProcess?.total_amount || 0;
            const roundedAmount = Math.ceil(totalAmount);

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
            case 'complete':
                return (
                    <div className="flex flex-col items-center justify-center py-6">
                        <div className="relative mb-2">
                            <div className="absolute -inset-2 rounded-full bg-green-100/50 animate-pulse"></div>
                            <div
                                className="absolute -inset-4 rounded-full bg-green-50/30 animate-pulse animation-delay-200"></div>
                            <div className="rounded-full bg-green-100 p-3 relative">
                                <CheckCircle className="h-12 w-12 text-green-600"/>
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
                                <h3 className="text-sm font-semibold mb-2">Order Items
                                    ({currentOrder?.items?.filter(item => item.status !== 'cancelled').length || draftOrder?.items?.filter(item => item.status !== 'cancelled').length || 0})</h3>
                                <div
                                    className="space-y-0 max-h-[25vh] md:max-h-[35vh] overflow-y-auto pr-1 custom-scrollbar">
                                    {/* Get items from either current order or draft order */}
                                    {(() => {
                                        const items = currentOrder?.items || draftOrder?.items || [];
                                        return items.length === 0 ? (
                                            <p className="text-center text-muted-foreground py-3 text-xs">No items in
                                                this order</p>
                                        ) : (
                                            items
                                                .filter(item => item.status !== 'cancelled')
                                                .map((item) => (
                                                    <div key={item.id || `draft-${item.menu_item_id}`}
                                                         className="flex justify-between items-center py-2 border-b border-border/30 last:border-0">
                                                        <div>
                                                            <p className="font-medium text-sm">{item.name}</p>
                                                            <p className="text-xs text-muted-foreground">Qty {item.quantity}</p>
                                                        </div>
                                                        <span
                                                            className="font-medium text-sm">₹{(item.price * item.quantity).toFixed(2)}</span>
                                                    </div>
                                                ))
                                        );
                                    })()}
                                </div>

                                <div className="mt-3 pt-2 border-t">
                                    <div className="">
                                        <div className="flex justify-between py-1">
                                            <span className="text-xs text-muted-foreground">Sub Total</span>
                                            <span
                                                className="text-xs font-medium">₹{gstDetails.subTotal.toFixed(2)}</span>
                                        </div>
                                        {gstDetails.sgstAmount > 0 && (
                                            <div className="flex justify-between py-1">
                                                <span
                                                    className="text-xs text-muted-foreground">SGST ({gstDetails.sgstRate}%)</span>
                                                <span
                                                    className="text-xs font-medium">₹{gstDetails.sgstAmount.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {gstDetails.cgstAmount > 0 && (
                                            <div className="flex justify-between py-1">
                                                <span
                                                    className="text-xs text-muted-foreground">CGST ({gstDetails.cgstRate}%)</span>
                                                <span
                                                    className="text-xs font-medium">₹{gstDetails.cgstAmount.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between py-1">
                                            <span className="text-xs text-muted-foreground">Rounding Adjustment</span>
                                            <span
                                                className="text-xs font-medium">₹{roundingDifference.toFixed(2)}</span>
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
                                            type="checkbox"
                                            id="upi-payment"
                                            name="payment-method"
                                            className="mr-2"
                                            checked={paymentMethod === 'upi'}
                                            onChange={() => {
                                                if (paymentMethod === 'upi') {
                                                    setPaymentMethod('');
                                                } else {
                                                    setPaymentMethod('upi');
                                                }
                                            }}
                                        />
                                        <label htmlFor="upi-payment" className="flex-1 text-sm">UPI (Pay with
                                            UPI)</label>
                                    </div>
                                    {/* Card Option */}
                                    <div className="flex items-center p-2 rounded-lg">
                                        <input
                                            type="checkbox"
                                            id="card-payment"
                                            name="payment-method"
                                            className="mr-2"
                                            checked={paymentMethod === 'card'}
                                            onChange={() => {
                                                if (paymentMethod === 'card') {
                                                    setPaymentMethod('');
                                                } else {
                                                    setPaymentMethod('card');
                                                }
                                            }}
                                        />
                                        <label htmlFor="card-payment" className="flex-1 text-sm">Card (Pay with
                                            Credit/Debit Card)</label>
                                    </div>

                                    {/* Cash Option */}
                                    <div className="flex items-center p-2 rounded-lg">
                                        <input
                                            type="checkbox"
                                            id="cash-payment"
                                            name="payment-method"
                                            className="mr-2"
                                            checked={paymentMethod === 'cash'}
                                            onChange={() => {
                                                if (paymentMethod === 'cash') {
                                                    setPaymentMethod('');
                                                } else {
                                                    setPaymentMethod('cash');
                                                }
                                            }}
                                        />
                                        <label htmlFor="cash-payment" className="flex-1 text-sm">Cash (Pay with
                                            Cash)</label>
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
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
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
                                        variant="outline"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
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
                className="max-w-[95vw] sm:max-w-[90vw] md:max-w-[800px] max-h-[85vh] md:max-h-[90vh] overflow-y-auto p-2 sm:p-3 md:p-4 custom-scrollbar">
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
                            <AlertCircle className="h-4 w-4"/>
                            <p>{error}</p>
                        </div>
                    </div>
                )}

                {renderStep()}
            </DialogContent>
        </Dialog>
    );
}
