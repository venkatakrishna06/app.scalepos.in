import {PaymentDialog as PaymentDialogComponent} from '@/components/composed/payment-dialog';
import {Order} from '@/types';

interface PaymentDialogProps {
    open: boolean;
    onClose: () => void;
    order: Order;
}

export function PaymentDialog({
                                  open,
                                  onClose,
                                  order,
                              }: PaymentDialogProps) {
    return (
        <PaymentDialogComponent
            open={open}
            onClose={onClose}
            order={order}
        />
    );
}
