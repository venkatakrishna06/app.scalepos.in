import { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/lib/toast';
import { Order, Payment } from '@/types';
import { useCreatePayment } from '@/api/payments';
import { useRestaurant } from '@/api/restaurant';
import { usePrinterConfig } from '@/api/printers';
import { useUpdateOrderStatus, useCreateOrder } from '@/api/orders';

interface PaymentDialogProps {
    open: boolean;
    onClose: () => void;
    order?: Order;
    draftOrder?: Omit<Order, 'id'>;
    onPaymentComplete?: (order: Order) => void;
}

type PaymentStep = 'method' | 'processing' | 'complete';

// ... (ESCPOS constants and helper functions remain the same)

export function PaymentDialog({ open, onClose, order, draftOrder, onPaymentComplete }: PaymentDialogProps) {
    const [paymentMethod, setPaymentMethod] = useState<Payment['payment_method'] | ''>('');
    const [currentStep, setCurrentStep] = useState<PaymentStep>('method');
    const [error, setError] = useState<string | null>(null);
    const [cashGiven, setCashGiven] = useState<string>('');
    const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

    const createPaymentMutation = useCreatePayment();
    const updateOrderStatusMutation = useUpdateOrderStatus();
    const createOrderMutation = useCreateOrder();
    const { data: restaurant } = useRestaurant();
    const { data: printerConfig } = usePrinterConfig();

    const orderRef = useRef(order);
    useEffect(() => {
        if (order && orderRef.current !== order) {
            orderRef.current = order;
        }
    }, [order]);

    const currentOrder = order || createdOrder;

    useEffect(() => {
        if (open) {
            setCurrentStep('method');
            setError(null);
            setCashGiven('');
            setPaymentMethod('');
            setCreatedOrder(null);
        }
    }, [open, order]);

    // ... (generateReceiptContent and handlePrintBill remain the same)

    const handlePrintBillAndPayment = async () => {
        if (!paymentMethod) {
            setError('Please select a payment method');
            toast.error('Please select a payment method');
            return;
        }

        try {
            // const orderFromPrintBill = await handlePrintBill();
            // if (orderFromPrintBill) {
            //     await handlePayment(orderFromPrintBill);
            // } else {
            //     await handlePayment();
            // }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to process order';
            setError(errorMessage);
            toast.error(errorMessage);
        }
    };

    const createOrderFromDraft = async () => {
        if (!draftOrder) return null;

        try {
            const newOrder = await createOrderMutation.mutateAsync(draftOrder);
            setCreatedOrder(newOrder);
            return newOrder;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create order';
            setError(errorMessage);
            toast.error(errorMessage);
            throw err;
        }
    };

    const handlePayment = async (passedOrder?: Order) => {
        if (!paymentMethod) {
            setError('Please select a payment method');
            toast.error('Please select a payment method');
            return;
        }

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

            const totalAmount = orderToProcess?.total_amount || 0;
            const roundedAmount = Math.ceil(totalAmount);

            const payment = {
                order_id: orderToProcess?.id,
                amount_paid: roundedAmount,
                payment_method: paymentMethod,
                status: 'completed',
                transaction_id: `txn_${Date.now()}`,
            };

            await createPaymentMutation.mutateAsync(payment);
            await updateOrderStatusMutation.mutateAsync({
                id: orderToProcess?.id,
                status: 'paid'
            });

            setCurrentStep('complete');

            if (onPaymentComplete) {
                onPaymentComplete(orderToProcess);
            }
            onClose();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to process payment';
            setError(errorMessage);
            toast.error(errorMessage);
            setCurrentStep('method');
        }
    };

    // ... (rest of the component remains the same)

    return (
        <Dialog open={open}>
            {/* ... (rest of the JSX remains the same) */}
        </Dialog>
    );
}
